# TypeScript Usage Examples

## Installation

```bash
npm install @kirkdiggler/rpg-api-protos
# or
yarn add @kirkdiggler/rpg-api-protos
```

## Basic Client Setup

```typescript
import { createConnectTransport } from "@connectrpc/connect-web";
import { CharacterServiceClient } from "@kirkdiggler/rpg-api-protos/gen/ts/dnd5e/api/v1alpha1/character_connect";

// Create transport (for web browsers)
const transport = createConnectTransport({
  baseUrl: "https://api.example.com",
});

// Create service client
const client = new CharacterServiceClient(transport);
```

### Node.js Setup

```typescript
import { createConnectTransport } from "@connectrpc/connect-node";
import { CharacterServiceClient } from "@kirkdiggler/rpg-api-protos/gen/ts/dnd5e/api/v1alpha1/character_connect";

// Create transport (for Node.js)
const transport = createConnectTransport({
  baseUrl: "http://localhost:8080",
  httpVersion: "2",
});

const client = new CharacterServiceClient(transport);
```

## Character Creation Flow

```typescript
import {
  CreateCharacterDraftRequest,
  UpdateCharacterDraftAbilityScoresRequest,
  UpdateCharacterDraftRaceInfoRequest,
  UpdateCharacterDraftClassInfoRequest,
  FinalizeCharacterDraftRequest,
  AbilityScores,
  Race,
  Class,
} from "@kirkdiggler/rpg-api-protos/gen/ts/dnd5e/api/v1alpha1/character_pb";

async function createCharacterExample() {
  try {
    // 1. Create a character draft
    const draftResponse = await client.createCharacterDraft(
      new CreateCharacterDraftRequest({
        name: "Legolas",
        userId: "user456",
      })
    );

    const draftId = draftResponse.characterDraft?.id;
    if (!draftId) {
      throw new Error("Failed to create character draft");
    }

    // 2. Set ability scores
    await client.updateCharacterDraftAbilityScores(
      new UpdateCharacterDraftAbilityScoresRequest({
        id: draftId,
        abilityScores: new AbilityScores({
          strength: 13,
          dexterity: 18,
          constitution: 14,
          intelligence: 15,
          wisdom: 16,
          charisma: 12,
        }),
      })
    );

    // 3. Set race information
    await client.updateCharacterDraftRaceInfo(
      new UpdateCharacterDraftRaceInfoRequest({
        id: draftId,
        race: Race.ELF,
      })
    );

    // 4. Set class information
    await client.updateCharacterDraftClassInfo(
      new UpdateCharacterDraftClassInfoRequest({
        id: draftId,
        class: Class.RANGER,
        level: 1,
      })
    );

    // 5. Finalize the character
    const finalResponse = await client.finalizeCharacterDraft(
      new FinalizeCharacterDraftRequest({
        id: draftId,
      })
    );

    console.log(
      `Created character: ${finalResponse.character?.name} (ID: ${finalResponse.character?.id})`
    );

    return finalResponse.character;
  } catch (error) {
    console.error("Error creating character:", error);
    throw error;
  }
}
```

## Character Management

```typescript
import {
  GetCharacterRequest,
  UpdateCharacterRequest,
  ListCharactersRequest,
  Character,
} from "@kirkdiggler/rpg-api-protos/gen/ts/dnd5e/api/v1alpha1/character_pb";

async function characterManagementExample() {
  try {
    // Get a character
    const getResponse = await client.getCharacter(
      new GetCharacterRequest({
        id: "character123",
      })
    );

    const character = getResponse.character;
    if (!character) {
      throw new Error("Character not found");
    }

    console.log(
      `Character: ${character.name}, Level ${character.level} ${Race[character.race]} ${Class[character.class]}`
    );

    // Update character (level up!)
    const updatedCharacter = new Character({
      ...character,
      level: character.level + 1,
    });

    await client.updateCharacter(
      new UpdateCharacterRequest({
        id: character.id,
        character: updatedCharacter,
      })
    );

    // List characters for a user
    const listResponse = await client.listCharacters(
      new ListCharactersRequest({
        userId: "user456",
        pageSize: 10,
      })
    );

    listResponse.characters.forEach((char) => {
      console.log(`- ${char.name} (${char.id})`);
    });

    return character;
  } catch (error) {
    console.error("Error managing character:", error);
    throw error;
  }
}
```

## Working with Enums

```typescript
import {
  Race,
  Class,
  Ability,
  Skill,
  Alignment,
} from "@kirkdiggler/rpg-api-protos/gen/ts/dnd5e/api/v1alpha1/enums_pb";

function enumExample() {
  // Race enum usage
  const race = Race.ELF;
  console.log(`Race: ${Race[race]}`);

  // Class enum usage
  const characterClass = Class.WIZARD;
  console.log(`Class: ${Class[characterClass]}`);

  // Ability enum usage
  const abilities = [
    Ability.STRENGTH,
    Ability.DEXTERITY,
    Ability.CONSTITUTION,
    Ability.INTELLIGENCE,
    Ability.WISDOM,
    Ability.CHARISMA,
  ];

  abilities.forEach((ability) => {
    console.log(`Ability: ${Ability[ability]}`);
  });

  // Skill enum usage
  const skills = [Skill.ACROBATICS, Skill.STEALTH, Skill.PERCEPTION];

  skills.forEach((skill) => {
    console.log(`Skill: ${Skill[skill]}`);
  });

  // Alignment enum usage
  const alignment = Alignment.CHAOTIC_GOOD;
  console.log(`Alignment: ${Alignment[alignment]}`);
}
```

## Error Handling

```typescript
import { ConnectError, Code } from "@connectrpc/connect";

async function errorHandlingExample() {
  try {
    await client.getCharacter(
      new GetCharacterRequest({
        id: "nonexistent",
      })
    );
  } catch (error) {
    if (error instanceof ConnectError) {
      switch (error.code) {
        case Code.NotFound:
          console.log("Character not found");
          break;
        case Code.InvalidArgument:
          console.log("Invalid character ID");
          break;
        case Code.Unauthenticated:
          console.log("Authentication required");
          break;
        default:
          console.log(`gRPC error: ${error.message}`);
      }
    } else {
      console.log(`Non-gRPC error: ${error}`);
    }
  }
}
```

## React Component Example

```typescript
import React, { useState, useEffect } from "react";
import { Character } from "@kirkdiggler/rpg-api-protos/gen/ts/dnd5e/api/v1alpha1/character_pb";
import { Race, Class } from "@kirkdiggler/rpg-api-protos/gen/ts/dnd5e/api/v1alpha1/enums_pb";

interface CharacterListProps {
  userId: string;
}

export const CharacterList: React.FC<CharacterListProps> = ({ userId }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCharacters = async () => {
      try {
        setLoading(true);
        const response = await client.listCharacters(
          new ListCharactersRequest({
            userId,
            pageSize: 20,
          })
        );
        setCharacters(response.characters);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadCharacters();
  }, [userId]);

  if (loading) {
    return <div>Loading characters...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="character-list">
      <h2>Characters</h2>
      {characters.length === 0 ? (
        <p>No characters found.</p>
      ) : (
        <ul>
          {characters.map((character) => (
            <li key={character.id} className="character-item">
              <h3>{character.name}</h3>
              <p>
                Level {character.level} {Race[character.race]} {Class[character.class]}
              </p>
              <p>
                STR: {character.abilityScores?.strength}, 
                DEX: {character.abilityScores?.dexterity}, 
                CON: {character.abilityScores?.constitution}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

## Character Creation Form

```typescript
import React, { useState } from "react";
import {
  CreateCharacterDraftRequest,
  UpdateCharacterDraftAbilityScoresRequest,
  AbilityScores,
} from "@kirkdiggler/rpg-api-protos/gen/ts/dnd5e/api/v1alpha1/character_pb";
import { Race, Class } from "@kirkdiggler/rpg-api-protos/gen/ts/dnd5e/api/v1alpha1/enums_pb";

interface CharacterFormData {
  name: string;
  race: Race;
  class: Class;
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
}

export const CharacterCreationForm: React.FC = () => {
  const [formData, setFormData] = useState<CharacterFormData>({
    name: "",
    race: Race.HUMAN,
    class: Class.FIGHTER,
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
  });
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      // Create draft
      const draftResponse = await client.createCharacterDraft(
        new CreateCharacterDraftRequest({
          name: formData.name,
          userId: "current-user", // Get from auth context
        })
      );

      const draftId = draftResponse.characterDraft?.id;
      if (!draftId) throw new Error("Failed to create draft");

      // Set ability scores
      await client.updateCharacterDraftAbilityScores(
        new UpdateCharacterDraftAbilityScoresRequest({
          id: draftId,
          abilityScores: new AbilityScores(formData.abilityScores),
        })
      );

      // Set race and class
      await client.updateCharacterDraftRaceInfo(
        new UpdateCharacterDraftRaceInfoRequest({
          id: draftId,
          race: formData.race,
        })
      );

      await client.updateCharacterDraftClassInfo(
        new UpdateCharacterDraftClassInfoRequest({
          id: draftId,
          class: formData.class,
          level: 1,
        })
      );

      // Finalize
      const finalResponse = await client.finalizeCharacterDraft(
        new FinalizeCharacterDraftRequest({ id: draftId })
      );

      console.log("Character created:", finalResponse.character);
      // Redirect or update UI
    } catch (error) {
      console.error("Error creating character:", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="character-form">
      <div>
        <label>
          Name:
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
          />
        </label>
      </div>

      <div>
        <label>
          Race:
          <select
            value={formData.race}
            onChange={(e) =>
              setFormData({ ...formData, race: parseInt(e.target.value) as Race })
            }
          >
            {Object.entries(Race)
              .filter(([key]) => isNaN(Number(key)))
              .map(([name, value]) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div>
        <label>
          Class:
          <select
            value={formData.class}
            onChange={(e) =>
              setFormData({ ...formData, class: parseInt(e.target.value) as Class })
            }
          >
            {Object.entries(Class)
              .filter(([key]) => isNaN(Number(key)))
              .map(([name, value]) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
          </select>
        </label>
      </div>

      {/* Ability Score inputs */}
      <fieldset>
        <legend>Ability Scores</legend>
        {Object.entries(formData.abilityScores).map(([ability, value]) => (
          <div key={ability}>
            <label>
              {ability.charAt(0).toUpperCase() + ability.slice(1)}:
              <input
                type="number"
                min={3}
                max={20}
                value={value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    abilityScores: {
                      ...formData.abilityScores,
                      [ability]: parseInt(e.target.value),
                    },
                  })
                }
              />
            </label>
          </div>
        ))}
      </fieldset>

      <button type="submit" disabled={creating}>
        {creating ? "Creating..." : "Create Character"}
      </button>
    </form>
  );
};
```

## Testing

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { CharacterServiceClient } from "@kirkdiggler/rpg-api-protos/gen/ts/dnd5e/api/v1alpha1/character_connect";
import { CreateCharacterRequest, Character } from "@kirkdiggler/rpg-api-protos/gen/ts/dnd5e/api/v1alpha1/character_pb";
import { Race, Class } from "@kirkdiggler/rpg-api-protos/gen/ts/dnd5e/api/v1alpha1/enums_pb";

describe("CharacterService", () => {
  let client: CharacterServiceClient;

  beforeEach(() => {
    // Setup test client with mock transport
    client = createTestClient();
  });

  it("should create a character", async () => {
    const request = new CreateCharacterRequest({
      character: new Character({
        name: "Test Character",
        level: 1,
        race: Race.HUMAN,
        class: Class.FIGHTER,
        abilityScores: new AbilityScores({
          strength: 15,
          dexterity: 14,
          constitution: 13,
          intelligence: 12,
          wisdom: 10,
          charisma: 8,
        }),
      }),
    });

    const response = await client.createCharacter(request);

    expect(response.character).toBeDefined();
    expect(response.character?.name).toBe("Test Character");
    expect(response.character?.race).toBe(Race.HUMAN);
    expect(response.character?.class).toBe(Class.FIGHTER);
  });

  it("should handle validation errors", async () => {
    const request = new CreateCharacterRequest({
      character: new Character({
        name: "", // Invalid: empty name
        level: 1,
        race: Race.HUMAN,
        class: Class.FIGHTER,
      }),
    });

    await expect(client.createCharacter(request)).rejects.toThrow();
  });
});
```