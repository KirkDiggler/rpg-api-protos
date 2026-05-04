# Go Usage Examples

## Installation

```bash
go get github.com/KirkDiggler/rpg-api-protos
```

## Basic Client Setup

```go
package main

import (
    "context"
    "log"
    
    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials/insecure"
    
    dnd5ev1alpha1 "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha1"
)

func main() {
    // Connect to the gRPC server
    conn, err := grpc.Dial("localhost:8080", grpc.WithTransportCredentials(insecure.NewCredentials()))
    if err != nil {
        log.Fatal(err)
    }
    defer conn.Close()
    
    // Create service client
    client := dnd5ev1alpha1.NewCharacterServiceClient(conn)
    
    // Use the client...
}
```

## Character Creation Flow

```go
func createCharacterExample(client dnd5ev1alpha1.CharacterServiceClient) {
    ctx := context.Background()
    
    // 1. Create a character draft
    draftResp, err := client.CreateCharacterDraft(ctx, &dnd5ev1alpha1.CreateCharacterDraftRequest{
        Name:   "Aragorn",
        UserId: "user123",
    })
    if err != nil {
        log.Fatal(err)
    }
    
    draftID := draftResp.CharacterDraft.Id
    
    // 2. Set ability scores
    _, err = client.UpdateCharacterDraftAbilityScores(ctx, &dnd5ev1alpha1.UpdateCharacterDraftAbilityScoresRequest{
        Id: draftID,
        AbilityScores: &dnd5ev1alpha1.AbilityScores{
            Strength:     16,
            Dexterity:    14,
            Constitution: 15,
            Intelligence: 12,
            Wisdom:       13,
            Charisma:     10,
        },
    })
    if err != nil {
        log.Fatal(err)
    }
    
    // 3. Set race information
    _, err = client.UpdateCharacterDraftRaceInfo(ctx, &dnd5ev1alpha1.UpdateCharacterDraftRaceInfoRequest{
        Id:   draftID,
        Race: dnd5ev1alpha1.Race_RACE_HUMAN,
    })
    if err != nil {
        log.Fatal(err)
    }
    
    // 4. Set class information
    _, err = client.UpdateCharacterDraftClassInfo(ctx, &dnd5ev1alpha1.UpdateCharacterDraftClassInfoRequest{
        Id:    draftID,
        Class: dnd5ev1alpha1.Class_CLASS_RANGER,
        Level: 1,
    })
    if err != nil {
        log.Fatal(err)
    }
    
    // 5. Finalize the character
    finalResp, err := client.FinalizeCharacterDraft(ctx, &dnd5ev1alpha1.FinalizeCharacterDraftRequest{
        Id: draftID,
    })
    if err != nil {
        log.Fatal(err)
    }
    
    log.Printf("Created character: %s (ID: %s)", 
        finalResp.Character.Name, 
        finalResp.Character.Id)
}
```

## Character Management

```go
func characterManagementExample(client dnd5ev1alpha1.CharacterServiceClient) {
    ctx := context.Background()
    
    // Get a character
    getResp, err := client.GetCharacter(ctx, &dnd5ev1alpha1.GetCharacterRequest{
        Id: "character123",
    })
    if err != nil {
        log.Fatal(err)
    }
    
    character := getResp.Character
    log.Printf("Character: %s, Level %d %s %s", 
        character.Name, 
        character.Level,
        character.Race.String(),
        character.Class.String())
    
    // Update character
    _, err = client.UpdateCharacter(ctx, &dnd5ev1alpha1.UpdateCharacterRequest{
        Id: character.Id,
        Character: &dnd5ev1alpha1.Character{
            Id:       character.Id,
            Name:     character.Name,
            Level:    character.Level + 1, // Level up!
            Race:     character.Race,
            Class:    character.Class,
            AbilityScores: character.AbilityScores,
        },
    })
    if err != nil {
        log.Fatal(err)
    }
    
    // List characters for a user
    listResp, err := client.ListCharacters(ctx, &dnd5ev1alpha1.ListCharactersRequest{
        UserId:   "user123",
        PageSize: 10,
    })
    if err != nil {
        log.Fatal(err)
    }
    
    for _, char := range listResp.Characters {
        log.Printf("- %s (%s)", char.Name, char.Id)
    }
}
```

## Working with Enums

```go
func enumExample() {
    // Race enum usage
    race := dnd5ev1alpha1.Race_RACE_ELF
    fmt.Printf("Race: %s\n", race.String())
    
    // Class enum usage
    class := dnd5ev1alpha1.Class_CLASS_WIZARD
    fmt.Printf("Class: %s\n", class.String())
    
    // Ability enum usage
    abilities := []dnd5ev1alpha1.Ability{
        dnd5ev1alpha1.Ability_ABILITY_STRENGTH,
        dnd5ev1alpha1.Ability_ABILITY_DEXTERITY,
        dnd5ev1alpha1.Ability_ABILITY_CONSTITUTION,
        dnd5ev1alpha1.Ability_ABILITY_INTELLIGENCE,
        dnd5ev1alpha1.Ability_ABILITY_WISDOM,
        dnd5ev1alpha1.Ability_ABILITY_CHARISMA,
    }
    
    for _, ability := range abilities {
        fmt.Printf("Ability: %s\n", ability.String())
    }
}
```

## Error Handling

```go
func errorHandlingExample(client dnd5ev1alpha1.CharacterServiceClient) {
    ctx := context.Background()
    
    _, err := client.GetCharacter(ctx, &dnd5ev1alpha1.GetCharacterRequest{
        Id: "nonexistent",
    })
    
    if err != nil {
        // Check for gRPC status codes
        if status, ok := status.FromError(err); ok {
            switch status.Code() {
            case codes.NotFound:
                log.Println("Character not found")
            case codes.InvalidArgument:
                log.Println("Invalid character ID")
            default:
                log.Printf("gRPC error: %v", status.Message())
            }
        } else {
            log.Printf("Non-gRPC error: %v", err)
        }
    }
}
```

## Server Implementation

```go
type characterServer struct {
    dnd5ev1alpha1.UnimplementedCharacterServiceServer
    // your dependencies here
}

func (s *characterServer) GetCharacter(
    ctx context.Context, 
    req *dnd5ev1alpha1.GetCharacterRequest,
) (*dnd5ev1alpha1.GetCharacterResponse, error) {
    // Validate request
    if req.Id == "" {
        return nil, status.Error(codes.InvalidArgument, "character ID is required")
    }
    
    // Your business logic here
    character, err := s.getCharacterFromDB(ctx, req.Id)
    if err != nil {
        return nil, status.Error(codes.Internal, "failed to get character")
    }
    
    if character == nil {
        return nil, status.Error(codes.NotFound, "character not found")
    }
    
    return &dnd5ev1alpha1.GetCharacterResponse{
        Character: character,
    }, nil
}

func (s *characterServer) CreateCharacter(
    ctx context.Context,
    req *dnd5ev1alpha1.CreateCharacterRequest,
) (*dnd5ev1alpha1.CreateCharacterResponse, error) {
    // Validate required fields
    if req.Character == nil {
        return nil, status.Error(codes.InvalidArgument, "character is required")
    }
    
    if req.Character.Name == "" {
        return nil, status.Error(codes.InvalidArgument, "character name is required")
    }
    
    // Your creation logic here
    createdCharacter, err := s.createCharacterInDB(ctx, req.Character)
    if err != nil {
        return nil, status.Error(codes.Internal, "failed to create character")
    }
    
    return &dnd5ev1alpha1.CreateCharacterResponse{
        Character: createdCharacter,
    }, nil
}
```

## Testing

```go
func TestCharacterService(t *testing.T) {
    // Setup test server
    server := grpc.NewServer()
    service := &characterServer{
        // mock dependencies
    }
    
    dnd5ev1alpha1.RegisterCharacterServiceServer(server, service)
    
    // Create test client
    conn, client := createTestClient(t, server)
    defer conn.Close()
    
    // Test cases
    t.Run("CreateCharacter", func(t *testing.T) {
        resp, err := client.CreateCharacter(context.Background(), &dnd5ev1alpha1.CreateCharacterRequest{
            Character: &dnd5ev1alpha1.Character{
                Name:  "Test Character",
                Level: 1,
                Race:  dnd5ev1alpha1.Race_RACE_HUMAN,
                Class: dnd5ev1alpha1.Class_CLASS_FIGHTER,
                AbilityScores: &dnd5ev1alpha1.AbilityScores{
                    Strength:     15,
                    Dexterity:    14,
                    Constitution: 13,
                    Intelligence: 12,
                    Wisdom:       10,
                    Charisma:     8,
                },
            },
        })
        
        assert.NoError(t, err)
        assert.NotNil(t, resp.Character)
        assert.Equal(t, "Test Character", resp.Character.Name)
    })
}
```