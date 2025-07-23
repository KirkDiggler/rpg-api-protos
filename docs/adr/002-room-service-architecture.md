# ADR-002: Room Service Architecture - Generic Tactical Environment API

**Status**: Proposed  
**Date**: 2025-07-22  
**Decision-makers**: Kirk Diggler, Claude AI  
**Technical story**: [Issue #27](https://github.com/KirkDiggler/rpg-api-protos/issues/27) - Add Room Service Proto Definition for Room Generation Integration

## Summary

We need to add room generation and tactical environment functionality to support tactical RPG gameplay. The key decision is how to structure the gRPC service to support room generation, spatial queries, entity spawning, and procedural content selection in a system-agnostic way.

## Problem Statement

### Immediate Need
- Game clients need to generate tactical environments (rooms with walls, positioning grids)
- Tactical gameplay requires spatial queries (line of sight, movement validation, range queries)
- Entity placement and spawning must work within generated environments
- Multi-room environments with connections and transitions are required

### Long-term Vision
- SDK will support multiple RPG systems (D&D 5e, Pathfinder, GURPS, etc.)
- VTT (Virtual Tabletop) integration for tactical combat
- Procedural dungeon generation with connected multi-room environments
- Real-time tactical gameplay with positioning and movement
- Integration with existing character and dice services

## Decision

**We will create a separate `RoomService` as a generic gRPC service in `api/v1alpha1/room.proto` alongside the existing `DiceService`.**

### Core Design Principles

1. **Generic RoomService**: Universal tactical environment mechanics for all RPG systems
2. **Environment-Centric**: Multi-room environments as primary abstraction
3. **Tactical Gameplay**: Support positioning, movement, line of sight queries
4. **Procedural Generation**: Weighted selection tables for content generation
5. **System Agnostic**: Works with any RPG rule system

### Service Architecture

Following the established pattern from `DiceService`:

```
External API (gRPC Services)
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   DiceService   │     │   RoomService   │     │ CharacterService│
│    (generic)    │     │    (generic)    │     │   (D&D 5e)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                        │
         └────────┬─────────────────┬─────────────────────┘
                  │                 │
         ┌─────────────────┐       ┌─────────────────┐
         │ Internal Layer  │       │ Internal Layer  │
         │ ┌─────────────┐ │       │ ┌─────────────┐ │
         │ │DiceOrch     │ │       │ │RoomOrch     │ │
         │ │(business)   │ │       │ │(business)   │ │
         │ └─────────────┘ │       │ └─────────────┘ │
         └─────────────────┘       └─────────────────┘
```

## Proto Service Design

### Multi-Proto File Architecture

**Decision**: Split room functionality across multiple proto files aligned with rpg-toolkit modules:

```
api/v1alpha1/
├── room_environments.proto    # Core room/environment generation (environments tool)
├── room_spatial.proto         # Spatial queries and validation (spatial tool)  
├── room_spawn.proto          # Entity spawning and population (spawn tool)
├── room_selectables.proto    # Selection tables and procedural content (selectables tool)
└── room_common.proto         # Shared types and enums
```

**Rationale**:
- **Module alignment**: Each proto maps to a specific rpg-toolkit tool
- **Development phases**: Easier to implement one tool at a time
- **Client flexibility**: Clients can import only needed capabilities
- **Team scaling**: Different developers can work on different protos simultaneously

### Service Methods Organization

```protobuf
// api/v1alpha1/room_environments.proto
service EnvironmentService {
  // Single room generation and management
  rpc GenerateRoom(GenerateRoomRequest) returns (GenerateRoomResponse);
  rpc GetRoom(GetRoomRequest) returns (GetRoomResponse);
  rpc ListRooms(ListRoomsRequest) returns (ListRoomsResponse);
  rpc DeleteRoom(DeleteRoomRequest) returns (DeleteRoomResponse);
  
  // Multi-room environments with connections
  rpc GenerateEnvironment(GenerateEnvironmentRequest) returns (GenerateEnvironmentResponse);
  rpc GetEnvironment(GetEnvironmentRequest) returns (GetEnvironmentResponse);
  rpc ListEnvironments(ListEnvironmentsRequest) returns (ListEnvironmentsResponse);
  rpc DeleteEnvironment(DeleteEnvironmentRequest) returns (DeleteEnvironmentResponse);
}

// api/v1alpha1/room_spatial.proto  
service SpatialService {
  // Tactical gameplay spatial queries
  rpc QueryLineOfSight(QueryLineOfSightRequest) returns (QueryLineOfSightResponse);
  rpc ValidateMovement(ValidateMovementRequest) returns (ValidateMovementResponse);
  rpc QueryEntitiesInRange(QueryEntitiesInRangeRequest) returns (QueryEntitiesInRangeResponse);
  rpc ValidateEntityPlacement(ValidateEntityPlacementRequest) returns (ValidateEntityPlacementResponse);
}

// api/v1alpha1/room_spawn.proto
service SpawnService {
  // Entity population and spawning
  rpc PopulateRoom(PopulateRoomRequest) returns (PopulateRoomResponse);
  rpc PopulateEnvironment(PopulateEnvironmentRequest) returns (PopulateEnvironmentResponse);
  rpc GetSpawnRecommendations(GetSpawnRecommendationsRequest) returns (GetSpawnRecommendationsResponse);
}

// api/v1alpha1/room_selectables.proto
service SelectionTableService {
  // Procedural content generation
  rpc CreateSelectionTable(CreateSelectionTableRequest) returns (CreateSelectionTableResponse);
  rpc UpdateSelectionTable(UpdateSelectionTableRequest) returns (UpdateSelectionTableResponse);
  rpc DeleteSelectionTable(DeleteSelectionTableRequest) returns (DeleteSelectionTableResponse);
  rpc SelectFromTable(SelectFromTableRequest) returns (SelectFromTableResponse);
  rpc ListSelectionTables(ListSelectionTablesRequest) returns (ListSelectionTablesResponse);
}
```

### Message Design Patterns

Following `dice.proto` conventions:

1. **Request/Response Pairs**: Every RPC has dedicated request/response messages
2. **Consistent Naming**: `{Verb}{Noun}Request` / `{Verb}{Noun}Response`
3. **Entity Ownership**: Rooms/environments owned by entity_id (like dice sessions)
4. **Structured Data**: Complex objects broken into focused message types
5. **Optional Fields**: Use proto3 optional for truly optional parameters

### Resolved Design Decisions

Based on analysis of existing proto patterns and project requirements:

#### 1. Proto Import Structure: **Import-Based with Common Types**
- **Decision**: Use `room_common.proto` for shared types (Position, Entity, GridType)
- **Rationale**: Spatial types will be reused across all 4 services, import prevents duplication
- **Pattern**: Similar to `dnd5e/api/v1alpha1/common.proto` usage

#### 2. Entity/Position Data Structure: **Rich Entity Data**
- **Decision**: Entities include position + properties + tags for tactical gameplay
- **Rationale**: Tactical combat requires entity metadata (size, materials, etc.)

#### 3. Grid Coordinate System: **Universal Coordinate System**
- **Decision**: Single Position type supporting all three distance calculations
- **Rationale**: Grid math is generic, game rules are system-specific

#### 4. Selection Table Data Types: **String-Only Values**
- **Decision**: Selection tables use string values, no `google.protobuf.Any`
- **Rationale**: 95% of selections are strings (entity types, materials), keeps proto simple

#### 5. Error Handling Strategy: **Standard gRPC Status Codes**
- **Decision**: Follow dice.proto pattern with standard gRPC codes
- **Rationale**: Consistent with existing services, good tooling support

#### 6. TTL Policies: **Configurable with Game Session Defaults**
- **Decision**: Default 4-hour TTL (typical game session), client-configurable
- **Rationale**: Rooms live longer than dice rolls (15 min) but shouldn't persist indefinitely

### Grid System Architecture

**Universal distance calculation support:**

```protobuf
// In room_common.proto
message Position {
  double x = 1;
  double y = 2;
  // Optional z-coordinate for future 3D support
  double z = 3;
}

enum GridType {
  GRID_TYPE_UNSPECIFIED = 0;
  GRID_TYPE_SQUARE = 1;      // Chebyshev distance (D&D 5e, Pathfinder)
  GRID_TYPE_HEX_POINTY = 2;  // Cube coordinates, pointy-top orientation
  GRID_TYPE_HEX_FLAT = 3;    // Cube coordinates, flat-top orientation  
  GRID_TYPE_GRIDLESS = 4;    // Euclidean distance (narrative systems)
}
```

**Distance calculation handled in business logic:**
- **Chebyshev**: `max(|x1-x2|, |y1-y2|)` for square grids
- **Cube coordinates**: Hex math with orientation support
- **Euclidean**: `sqrt((x1-x2)² + (y1-y2)²)` for gridless

**Grid size specified in room configuration:**
```protobuf
message RoomConfiguration {
  GridType grid_type = 1;
  double grid_size = 2;  // 5.0 for D&D (5ft), 1.0 for abstract
  // ... other config
}
```

### Key Message Types

**Core Entities** (in `room_common.proto`):
```protobuf
message Room {
  string room_id = 1;
  string entity_id = 2;  // Owner (char_123, campaign_456, etc.)
  RoomConfiguration config = 3;
  repeated Entity entities = 4;
  RoomMetadata metadata = 5;
  int64 created_at = 6;
  int64 expires_at = 7;  // TTL like dice sessions
}

message Environment {
  string environment_id = 1;
  string entity_id = 2;  // Owner
  EnvironmentConfiguration config = 3;
  repeated Room rooms = 4;
  repeated RoomConnection connections = 5;
  EnvironmentMetadata metadata = 6;
  int64 created_at = 7;
  int64 expires_at = 8;
}

message Entity {
  string entity_id = 1;
  string entity_type = 2;  // "wall", "door", "monster", "character"
  Position position = 3;
  map<string, string> properties = 4;  // size, material, health, etc.
  repeated string tags = 5;            // "destructible", "blocking", "cover"
}
```

**Configuration Types**:
```protobuf
message RoomConfiguration {
  int32 width = 1;
  int32 height = 2;
  string theme = 3;          // "dungeon", "forest", "urban", etc.
  float wall_density = 4;    // 0.0-1.0
  string pattern = 5;        // "random", "empty", "clustered"
  GridType grid_type = 6;
  double grid_size = 7;      // 5.0 for D&D 5ft squares
  int64 seed = 8;           // Required for reproducibility
  int32 ttl_seconds = 9;    // Default 14400 (4 hours)
}

message SelectionTable {
  string table_id = 1;
  string entity_id = 2;      // Owner (follows entity ownership pattern)
  string name = 3;           // Human-readable name
  repeated SelectionItem items = 4;
  int64 created_at = 5;
  int64 expires_at = 6;      // TTL for temporary tables
}

message SelectionItem {
  string value = 1;          // String-only as decided
  int32 weight = 2;          // Selection weight
  map<string, string> context_modifiers = 3;  // Optional context-based weight changes
}
```

### Recommended Message Design Patterns

**1. Consistent Entity Ownership**
```protobuf
// Every major entity follows this pattern
message [Entity] {
  string [entity]_id = 1;    // Primary identifier
  string entity_id = 2;      // Owner (char_123, campaign_456, etc.) 
  // ... entity-specific fields
  int64 created_at = n-1;    // Timestamp
  int64 expires_at = n;      // TTL
}
```

**2. Rich Request Context**
```protobuf
// Requests include context for better business logic
message GenerateRoomRequest {
  string entity_id = 1;           // Owner
  RoomConfiguration config = 2;   // Required configuration
  string context = 3;            // "combat", "exploration", "boss_fight"
  map<string, string> tags = 4;  // Additional context for business logic
}
```

**3. Comprehensive Response Metadata**
```protobuf
// Responses include generation metadata for debugging
message GenerateRoomResponse {
  Room room = 1;                 // Primary result
  GenerationMetadata metadata = 2;  // How it was generated
}

message GenerationMetadata {
  int64 seed_used = 1;          // Actual seed (for reproducibility)
  string toolkit_version = 2;   // rpg-toolkit version used
  repeated string warnings = 3;  // Non-fatal issues during generation
  map<string, string> debug_info = 4;  // Additional debug context
}
```

**4. Flexible Spatial Queries**
```protobuf
// Spatial queries support multiple query types
message QueryEntitiesInRangeRequest {
  string room_id = 1;
  Position center = 2;
  double range = 3;
  repeated string entity_types = 4;  // Filter by type
  repeated string tags = 5;          // Filter by tags
  bool include_properties = 6;       // Whether to return full entity data
}

message QueryEntitiesInRangeResponse {
  repeated EntityResult entities = 1;
}

message EntityResult {
  Entity entity = 1;
  double distance = 2;       // Calculated distance from query center
  bool line_of_sight = 3;    // Whether center has LOS to this entity
}
```

## Decision Rationale

### Why Generic RoomService?

1. **Consistency**: Follows established `DiceService` pattern
2. **System Agnostic**: Works for D&D 5e, Pathfinder, custom systems
3. **Reusability**: Combat, exploration, dungeon generation all use same API
4. **SDK Vision**: Clients can use room service independently

### Why api/v1alpha1 Placement?

Following `dice.proto` precedent:
- **Generic Services**: `api/v1alpha1/` for system-agnostic functionality
- **System-Specific Services**: `dnd5e/api/v1alpha1/` for D&D-specific features
- **Room generation is tactical infrastructure**, not game-specific rules

### Why Multi-Capability Service?

Unlike dice service (focused on rolling), rooms require integrated capabilities:
- **Spatial Queries**: Rooms need line-of-sight, movement validation
- **Entity Spawning**: Rooms need population with monsters/NPCs
- **Procedural Content**: Rooms need varied features and decorations
- **Environment Orchestration**: Multi-room navigation and connections

These are tightly coupled and benefit from unified API design.

### Why Entity Ownership Model?

Following `dice.proto` pattern:
- **Security**: Rooms tied to specific entities (campaigns, characters)
- **TTL Management**: Rooms can expire like dice sessions
- **Organization**: Group related rooms/environments by owner
- **Storage**: Consistent key patterns with existing services

## Alternatives Considered

### Alternative 1: Separate Services for Each Capability
```protobuf
service RoomGenerationService { ... }
service SpatialQueryService { ... }
service EntitySpawningService { ... }
service SelectionTableService { ... }
```

**Pros**:
- Clear separation of concerns
- Independent service evolution
- Focused API surfaces

**Cons**:
- Complex client integration (4 services for room functionality)
- Data consistency challenges between services
- Increased API surface complexity
- Storage coordination complexity

### Alternative 2: Room Methods in CharacterService
```protobuf
service CharacterService {
  rpc CreateTacticalEnvironment(...) returns (...);
  rpc QueryCombatMovement(...) returns (...);
}
```

**Pros**:
- Single service for character-related functionality
- Simpler initial implementation

**Cons**:
- Not reusable for non-character scenarios (monster encounters)
- Mixes character creation with tactical mechanics
- Violates single responsibility principle
- Doesn't support campaign-level room management

### Alternative 3: Embedded in Game-Specific Services
```protobuf
// In dnd5e/api/v1alpha1/combat.proto
service CombatService {
  rpc GenerateBattlefield(...) returns (...);
}
```

**Pros**:
- System-specific optimizations
- Tight integration with combat rules

**Cons**:
- Not reusable across RPG systems
- Duplicates tactical infrastructure
- Violates DRY principle
- Limits SDK flexibility

## Proto Design Decisions

### Message Naming Conventions

Following `dice.proto` patterns:
- **Requests**: `{Verb}{Noun}Request` (GenerateRoomRequest)
- **Responses**: `{Verb}{Noun}Response` (GenerateRoomResponse)  
- **Entities**: Singular nouns (Room, Environment, Entity)
- **Collections**: `repeated {Entity}` not separate collection types

### Field Naming Conventions

Following protobuf and existing patterns:
- **snake_case**: All field names (room_id, entity_id, created_at)
- **Consistent IDs**: Always `{entity}_id` for identifiers
- **Timestamps**: Unix timestamps as int64 (created_at, expires_at)
- **Enums**: UPPER_SNAKE_CASE with type prefix (GRID_TYPE_SQUARE)

### Optional vs Required Fields

Following proto3 best practices:
- **Required**: Essential identifiers (room_id, entity_id)
- **Optional**: Configuration that has reasonable defaults
- **Repeated**: Collections (entities, connections, rooms)

### Seed Management

**Decision**: Seeds are required (not optional) for all generation operations.

**Rationale**: From rpg-api planning - reproducibility is essential for debugging and consistent gameplay experience.

## Versioning Strategy

Following established patterns:
- **v1alpha1**: Initial implementation, breaking changes expected
- **v1beta1**: Stable API, limited breaking changes
- **v1**: Production stable, backward compatibility guaranteed

## Implementation Strategy

### Phase 1: Multi-Proto Foundation
**Deliverable**: Complete proto definitions with all resolved design decisions

**Files to Create**:
1. `api/v1alpha1/room_common.proto` - Shared types (Position, Entity, GridType, etc.)
2. `api/v1alpha1/room_environments.proto` - EnvironmentService with room/environment CRUD
3. `api/v1alpha1/room_spatial.proto` - SpatialService with tactical queries  
4. `api/v1alpha1/room_spawn.proto` - SpawnService with entity population
5. `api/v1alpha1/room_selectables.proto` - SelectionTableService with procedural content

**Implementation Order**:
1. **room_common.proto first** - Foundation for all other protos
2. **room_environments.proto** - Core functionality, needed by all others
3. **room_spatial.proto, room_spawn.proto, room_selectables.proto** - Can be parallel

**Validation**:
- All 5 proto files compile without errors
- Go bindings generate 4 separate service clients
- TypeScript bindings generate 4 separate service interfaces
- Import relationships work correctly (common types)

### Phase 2: Integration Alignment
**Deliverable**: Proto compatibility with rpg-api phase planning

**Tasks**:
1. Align proto RPC methods with rpg-api phase implementations
2. Validate message types support all rpg-toolkit tool capabilities
3. Ensure backwards compatibility strategy for multi-service evolution
4. Design service client patterns for multi-proto usage

### Phase 3: Documentation and Publishing  
**Deliverable**: Published proto package ready for rpg-api consumption

**Tasks**:
1. Comprehensive proto documentation with examples
2. Client usage patterns for multi-service coordination
3. Generate and publish updated proto package
4. Validate rpg-api can import all 4 services correctly

## Consequences

### Positive
- **System Agnostic**: Works with any RPG system using tactical combat
- **Complete Solution**: Single service provides all tactical environment needs
- **SDK Ready**: Generic service enables flexible client integration
- **Consistent**: Follows established patterns from dice service
- **Extensible**: Easy to add new room types, spatial queries, spawn patterns

### Negative
- **Complexity**: Large service with multiple capabilities
- **Coordination**: Must coordinate room, spatial, and spawning concerns
- **API Surface**: Substantial API surface to document and maintain
- **Learning Curve**: More complex than simple room generation

### Neutral
- **Performance**: Similar to dice service with internal orchestrator sharing
- **Deployment**: Single service in same binary as other services
- **Testing**: Standard integration testing between service layers

## Validation Criteria

### Functional Requirements
1. **Room Generation**: Create tactical rooms with walls and positioning
2. **Environment Generation**: Multi-room environments with connections
3. **Spatial Queries**: Line of sight and movement validation work correctly
4. **Entity Spawning**: Populate rooms with appropriate entities
5. **Procedural Content**: Selection tables for varied room features

### Non-Functional Requirements
1. **Performance**: Room generation completes in <200ms
2. **SDK Support**: Go and TypeScript clients work correctly
3. **Consistency**: Follows established proto patterns and conventions
4. **Documentation**: Complete service and message documentation
5. **Extensibility**: Easy to add new capabilities without breaking changes

### Integration Requirements
1. **rpg-api**: Service integrates correctly with rpg-api orchestrator layer
2. **Client Binding**: All target languages generate working bindings
3. **Storage**: Entity ownership and TTL work with existing Redis patterns
4. **Security**: Room access control follows entity ownership model

## RPG-API Engine Integration Reference

### Exact Engine Interface Signatures from rpg-api ADR-005

**This section documents the exact rpg-api engine interface signatures that our proto services must support for bulletproof integration. These are the orchestration interfaces that coordinate rpg-toolkit functionality.**

#### 1. Primary Engine Interface (from rpg-api ADR-005)

**Core room generation engine interface that coordinates all toolkit functionality:**

```go
// === PRIMARY INTERFACE: ENVIRONMENT GENERATION ===
// Environment generation - engine uses environments.EnvironmentGenerator
GenerateEnvironment(ctx context.Context, input *GenerateEnvironmentInput) (*GenerateEnvironmentOutput, error)

// === SECONDARY INTERFACE: INDIVIDUAL ROOM OPERATIONS ===
// Single room generation - for simple use cases, uses environments.RoomBuilder
GenerateRoom(ctx context.Context, input *GenerateRoomInput) (*GenerateRoomOutput, error)

// === SPATIAL QUERY SYSTEM - VIA ENVIRONMENTS AND SPATIAL ===
// Multi-room spatial queries - via environments.Environment
QueryEntitiesInRange(ctx context.Context, input *QueryEntitiesInRangeInput) (*QueryEntitiesInRangeOutput, error)
QueryLineOfSight(ctx context.Context, input *QueryLineOfSightInput) (*QueryLineOfSightOutput, error)
ValidateMovement(ctx context.Context, input *ValidateMovementInput) (*ValidateMovementOutput, error)
ValidateEntityPlacement(ctx context.Context, input *ValidateEntityPlacementInput) (*ValidateEntityPlacementOutput, error)

// === ENTITY SPAWNING INTEGRATION ===
// Entity spawning system - uses tools/spawn SpawnEngine for intelligent entity placement
PopulateRoom(ctx context.Context, input *PopulateRoomInput) (*PopulateRoomOutput, error)
PopulateEnvironment(ctx context.Context, input *PopulateEnvironmentInput) (*PopulateEnvironmentOutput, error)
PopulateSplitRooms(ctx context.Context, input *PopulateSplitRoomsInput) (*PopulateSplitRoomsOutput, error)
```

#### 2. Room Service Interface (rpg-api Service Layer)

**The complete service interface that orchestrates engine functionality:**

```go
// This interface follows rpg-api's principle of using Input/Output types for all operations
type Service interface {
    // === ROOM GENERATION ===
    GenerateRoom(ctx context.Context, input *GenerateRoomInput) (*GenerateRoomOutput, error)
    GenerateEnvironment(ctx context.Context, input *GenerateEnvironmentInput) (*GenerateEnvironmentOutput, error)
    
    // === ROOM MANAGEMENT ===
    GetRoom(ctx context.Context, input *GetRoomInput) (*GetRoomOutput, error)
    ListRooms(ctx context.Context, input *ListRoomsInput) (*ListRoomsOutput, error)
    DeleteRoom(ctx context.Context, input *DeleteRoomInput) (*DeleteRoomOutput, error)
    
    // === ENTITY SPAWNING ===
    PopulateRoom(ctx context.Context, input *PopulateRoomInput) (*PopulateRoomOutput, error)
    PopulateEnvironment(ctx context.Context, input *PopulateEnvironmentInput) (*PopulateEnvironmentOutput, error)
    PopulateSplitRooms(ctx context.Context, input *PopulateSplitRoomsInput) (*PopulateSplitRoomsOutput, error)
    
    // === SPATIAL QUERIES ===
    QueryEntitiesInRange(ctx context.Context, input *QueryEntitiesInRangeInput) (*QueryEntitiesInRangeOutput, error)
    QueryLineOfSight(ctx context.Context, input *QueryLineOfSightInput) (*QueryLineOfSightOutput, error)
    ValidateMovement(ctx context.Context, input *ValidateMovementInput) (*ValidateMovementOutput, error)
    ValidateEntityPlacement(ctx context.Context, input *ValidateEntityPlacementInput) (*ValidateEntityPlacementOutput, error)
}
```

**The orchestrator methods that coordinate between services, engines, and repositories:**

```go
// GenerateRoom orchestrates room generation workflow
func (o *Orchestrator) GenerateRoom(ctx context.Context, input *room.GenerateRoomInput) (*room.GenerateRoomOutput, error)

// GenerateEnvironment orchestrates multi-room environment generation
func (o *Orchestrator) GenerateEnvironment(ctx context.Context, input *room.GenerateEnvironmentInput) (*room.GenerateEnvironmentOutput, error)

// PopulateRoom orchestrates entity spawning in a room
func (o *Orchestrator) PopulateRoom(ctx context.Context, input *room.PopulateRoomInput) (*room.PopulateRoomOutput, error)
```

**The gRPC handlers that convert proto requests to service calls:**

```go
// RoomHandler handles room service gRPC requests
type RoomHandler struct {
    roomService room.Service
}

// GenerateRoom converts gRPC request to service call
func (h *RoomHandler) GenerateRoom(ctx context.Context, req *apiv1alpha1.GenerateRoomRequest) (*apiv1alpha1.GenerateRoomResponse, error) {
    // Request validation
    // Service call with Input/Output conversion  
    // Response mapping
}
```

**Core Input/Output types that our proto messages must exactly match:**

**Environment Generation:**
```go
// GenerateEnvironmentInput - Parameters for full environment generation
type GenerateEnvironmentInput struct {
    Config      EnvironmentConfig
    Seed        int64   // Required - if 0, engine will generate and return actual seed used
    SessionID   string  // Optional - links to game session 
    TTL         *int32  // Optional TTL override (seconds)
}

type GenerateEnvironmentOutput struct {
    Environment *EnvironmentData
    Rooms       []RoomData
    Connections []ConnectionData
    Metadata    GenerationMetadata
    SessionID   string
    ExpiresAt   time.Time
}
```

**Room Generation:**
```go
// GenerateRoomInput - Parameters for individual room generation  
type GenerateRoomInput struct {
    Config    RoomConfig
    Seed      int64   // Required - if 0, engine will generate and return actual seed used
    SessionID string  // Optional - links to game session
    TTL       *int32  // Optional TTL override (seconds)
}

type GenerateRoomOutput struct {
    Room      *RoomData
    Entities  []EntityData
    Metadata  GenerationMetadata
    SessionID string
    ExpiresAt time.Time
}
```

**Spatial Queries:**
```go
// QueryEntitiesInRangeInput - Find entities within a radius
type QueryEntitiesInRangeInput struct {
    RoomID       string
    CenterX      float64
    CenterY      float64
    Range        float64
    EntityTypes  []string  // Optional filtering by entity type
}

type QueryEntitiesInRangeOutput struct {
    Entities []EntityData
    Count    int32
    Range    float64    // Actual range used (may be clamped)
    Metadata QueryMetadata
}

// ValidateMovementInput - Check if movement is valid
type ValidateMovementInput struct {
    RoomID        string
    EntityID      string    // Entity attempting to move
    FromX         float64
    FromY         float64
    ToX           float64
    ToY           float64
    MovementType  string    // "walk", "fly", "teleport", etc.
}

type ValidateMovementOutput struct {
    IsValid           bool
    BlockedBy         *string   // ID of blocking entity (if any)
    AlternativePaths  []MovementPath  // Suggested alternative routes
    MovementCost      float64   // Cost in movement points
}
```

**Entity Spawning:**
```go
// PopulateRoomInput - Spawn entities in a single room
type PopulateRoomInput struct {
    RoomID      string      // Target room for spawning
    SpawnConfig SpawnConfig // Complete spawn configuration
    Seed        int64       // Required for reproducible spawning
}

type PopulateRoomOutput struct {
    Success              bool                 // Overall operation success
    SpawnedEntities      []SpawnedEntityData  // Successfully placed entities
    Failures             []SpawnFailureData   // Entities that couldn't be placed
    SplitRecommendations []RoomSplitData      // Recommendations for splitting overpacked groups
    Metadata             SpawnMetadata        // Generation statistics and debug info
}

// PopulateEnvironmentInput - Spawn entities across connected rooms
type PopulateEnvironmentInput struct {
    EnvironmentID string      // Target environment 
    SpawnConfig   SpawnConfig // Spawn configuration (distributed across rooms)
    Seed          int64       // Required for reproducible spawning
}

type PopulateEnvironmentOutput struct {
    Success              bool                           // Overall operation success
    SpawnedEntities      []SpawnedEntityData            // All spawned entities across rooms
    Failures             []SpawnFailureData             // Entities that couldn't be placed
    RoomDistribution     map[string][]SpawnedEntityData // Entities organized by room
    Metadata             SpawnMetadata                  // Generation statistics and debug info
}
```

### Proto Service to rpg-api Engine Mapping

**Based on the exact rpg-api engine signatures above, our proto services must provide seamless integration:**

#### 1. EnvironmentService Proto Mapping:
```go
// rpg-api engine interface → proto RPC methods
GenerateEnvironment(ctx context.Context, input *GenerateEnvironmentInput) (*GenerateEnvironmentOutput, error)
→ rpc GenerateEnvironment(GenerateEnvironmentRequest) returns (GenerateEnvironmentResponse)

GenerateRoom(ctx context.Context, input *GenerateRoomInput) (*GenerateRoomOutput, error)  
→ rpc GenerateRoom(GenerateRoomRequest) returns (GenerateRoomResponse)

GetRoom(ctx context.Context, input *GetRoomInput) (*GetRoomOutput, error)
→ rpc GetRoom(GetRoomRequest) returns (GetRoomResponse)

ListRooms(ctx context.Context, input *ListRoomsInput) (*ListRoomsOutput, error)
→ rpc ListRooms(ListRoomsRequest) returns (ListRoomsResponse)

DeleteRoom(ctx context.Context, input *DeleteRoomInput) (*DeleteRoomOutput, error)
→ rpc DeleteRoom(DeleteRoomRequest) returns (DeleteRoomResponse)
```

#### 2. SpatialService Proto Mapping:
```go  
QueryEntitiesInRange(ctx context.Context, input *QueryEntitiesInRangeInput) (*QueryEntitiesInRangeOutput, error)
→ rpc QueryEntitiesInRange(QueryEntitiesInRangeRequest) returns (QueryEntitiesInRangeResponse)

QueryLineOfSight(ctx context.Context, input *QueryLineOfSightInput) (*QueryLineOfSightOutput, error)
→ rpc QueryLineOfSight(QueryLineOfSightRequest) returns (QueryLineOfSightResponse)

ValidateMovement(ctx context.Context, input *ValidateMovementInput) (*ValidateMovementOutput, error)
→ rpc ValidateMovement(ValidateMovementRequest) returns (ValidateMovementResponse)

ValidateEntityPlacement(ctx context.Context, input *ValidateEntityPlacementInput) (*ValidateEntityPlacementOutput, error)
→ rpc ValidateEntityPlacement(ValidateEntityPlacementRequest) returns (ValidateEntityPlacementResponse)
```

#### 3. SpawnService Proto Mapping:
```go
PopulateRoom(ctx context.Context, input *PopulateRoomInput) (*PopulateRoomOutput, error)
→ rpc PopulateRoom(PopulateRoomRequest) returns (PopulateRoomResponse)

PopulateEnvironment(ctx context.Context, input *PopulateEnvironmentInput) (*PopulateEnvironmentOutput, error)
→ rpc PopulateEnvironment(PopulateEnvironmentRequest) returns (PopulateEnvironmentResponse)

PopulateSplitRooms(ctx context.Context, input *PopulateSplitRoomsInput) (*PopulateSplitRoomsOutput, error)
→ rpc PopulateSplitRooms(PopulateSplitRoomsRequest) returns (PopulateSplitRoomsResponse)

GetSpawnRecommendations(ctx context.Context, input *GetSpawnRecommendationsInput) (*GetSpawnRecommendationsOutput, error)
→ rpc GetSpawnRecommendations(GetSpawnRecommendationsRequest) returns (GetSpawnRecommendationsResponse)
```

#### 4. SelectionTableService Proto Mapping:
```go
// Based on entity selection functionality from rpg-api ADR-005
RegisterEntityTable(ctx context.Context, input *RegisterEntityTableInput) (*RegisterEntityTableOutput, error)
→ rpc CreateSelectionTable(CreateSelectionTableRequest) returns (CreateSelectionTableResponse)

GetEntityTables(ctx context.Context, input *GetEntityTablesInput) (*GetEntityTablesOutput, error)
→ rpc ListSelectionTables(ListSelectionTablesRequest) returns (ListSelectionTablesResponse)

// Selection functionality integrated into spawn operations
SelectFromTable(ctx context.Context, input *SelectFromTableInput) (*SelectFromTableOutput, error)
→ rpc SelectFromTable(SelectFromTableRequest) returns (SelectFromTableResponse)
```

### Proto Message Type Requirements

**Based on rpg-api ADR-005 Input/Output types, our proto messages must include:**

#### Core Configuration Types:
```protobuf
// Maps to environments.GenerationConfig
message EnvironmentConfiguration {
  int32 room_count = 1;
  LayoutType layout_type = 2;        // LAYOUT_TYPE_ORGANIC, etc.
  string theme = 3;
  GenerationType generation_type = 4; // GENERATION_TYPE_GRAPH, etc.
  repeated GenerationConstraint constraints = 5;
  int64 seed = 6;                    // Required for reproducibility
}

// Maps to spatial.Position  
message Position {
  double x = 1;
  double y = 2;
  double z = 3;  // Optional for 3D
}

// Maps to spatial.GridShape
enum GridType {
  GRID_TYPE_UNSPECIFIED = 0;
  GRID_TYPE_SQUARE = 1;      // spatial.GridShapeSquare
  GRID_TYPE_HEX_POINTY = 2;  // spatial.GridShapeHex (pointy-top)
  GRID_TYPE_HEX_FLAT = 3;    // spatial.GridShapeHex (flat-top)
  GRID_TYPE_GRIDLESS = 4;    // spatial.GridShapeGridless
}
```

#### Entity and Spatial Types:
```protobuf
// Maps to rpg-api EntityData and core.Entity
message Entity {
  string entity_id = 1;
  string entity_type = 2;        // "wall", "door", "monster", "character"
  Position position = 3;
  map<string, string> properties = 4;  // Flexible properties
  repeated string tags = 5;            // "destructible", "blocking", "cover"
  EntityState state = 6;
}

message EntityState {
  bool blocks_movement = 1;
  bool blocks_line_of_sight = 2;  
  bool destroyed = 3;
  int32 current_hp = 4;          // Optional for destructible
  int32 max_hp = 5;              // Optional for destructible
}
```

#### Selection and Spawn Types:
```protobuf
// Maps to spawn.SpawnConfig
message SpawnConfiguration {
  repeated EntityGroup entity_groups = 1;
  SpawnPattern pattern = 2;      // PATTERN_SCATTERED, etc.
  TeamConfiguration team_config = 3;
  SpatialConstraints spatial_rules = 4;
  int64 seed = 5;               // Required for reproducibility
}

// Maps to selectables.SelectionTable[string] (string-only decision)
message SelectionTable {
  string table_id = 1;
  string entity_id = 2;          // Owner (entity ownership pattern)
  string name = 3;
  repeated SelectionItem items = 4;
  int64 created_at = 5;
  int64 expires_at = 6;          // TTL following dice service pattern
}

message SelectionItem {
  string value = 1;              // String-only as decided
  int32 weight = 2;
  map<string, string> context_modifiers = 3;
}
```

### Validation Requirements

**All proto messages must validate against rpg-toolkit constraints:**

1. **Seed Management**: All generation operations require int64 seeds (not optional)
2. **Grid Type Support**: Must support all 4 grid types (square, hex-pointy, hex-flat, gridless)
3. **Entity Ownership**: All major entities follow `entity_id` ownership pattern  
4. **TTL Management**: 4-hour default TTL (14400 seconds) for game session length
5. **Position Precision**: Use double for coordinates to support sub-grid positioning
6. **Enum Alignment**: Proto enums must match toolkit constants exactly

## Related Decisions

- **[ADR-001]**: Established generic service pattern and entity ownership model
- **[rpg-api ADR-005]**: **CRITICAL DEPENDENCY** - Complete engine interface signatures and Input/Output types
- **[rpg-api ADR-006]**: Will define rpg-toolkit integration architecture (requires this ADR)
- **[rpg-api ADR-007]**: Will define repository and orchestrator patterns
- **Future**: Combat system integration with tactical room service

## References

- [Issue #27](https://github.com/KirkDiggler/rpg-api-protos/issues/27) - Room Service Proto Definition
- [rpg-api Epic #107](https://github.com/KirkDiggler/rpg-api/issues/107) - Room Generation Integration
- [ADR-001](./001-dice-service-architecture.md) - Established patterns for generic services
- [rpg-api ADR-005](https://github.com/KirkDiggler/rpg-api/blob/main/docs/adr/005-room-generation-integration.md) - Comprehensive room generation requirements
- [Journey 002](https://github.com/KirkDiggler/rpg-api/blob/main/docs/journey/002-room-generation-phase-planning.md) - Phase planning and implementation strategy