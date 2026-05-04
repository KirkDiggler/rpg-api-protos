# Entity Asset Types Design

## Overview

This design defines how entities (characters, monsters, obstacles, hazards) are represented in the game map for rendering and tactical gameplay. The goal is a unified entity system where:

- All entities share the same placement structure (`EntityPlacement`)
- An `EntityType` enum determines where to look up additional details
- A `oneof visual_type` provides the specific type for rendering (reusing existing `MonsterType`, adding new `ObstacleType`)
- Characters use shader colors from `CharacterState` (no visual_type needed)
- The toolkit owns all game logic (blocking, cover, line of sight)

## Problem Statement

Current entity representation is too simple:
- Entities have only `id` and `type` (string)
- The web renders all non-character/monster entities as generic purple obstacles
- No way to distinguish between different obstacle types visually
- No support for tactical properties (cover, LoS blocking)

We need richer entity data to support:
1. **Visual variety** - Different obstacles render different assets
2. **Tactical information** - Can you shoot over it? Does it block movement?
3. **Future hazards** - Traps, difficult terrain, environmental effects

## Design

### EntityPlacement (Updated)

```protobuf
message EntityPlacement {
  string entity_id = 1;
  EntityType entity_type = 2;
  Position position = 3;
  EntitySize size = 4;

  // Visual type based on entity_type
  // - CHARACTER: not set (uses shader colors from CharacterState)
  // - MONSTER: monster_type
  // - OBSTACLE: obstacle_type
  // - HAZARD (future): hazard_type
  oneof visual_type {
    MonsterType monster_type = 5;
    ObstacleType obstacle_type = 6;
    // HazardType hazard_type = 7;  // Future
  }
}

enum EntityType {
  ENTITY_TYPE_UNSPECIFIED = 0;
  ENTITY_TYPE_CHARACTER = 1;
  ENTITY_TYPE_MONSTER = 2;
  ENTITY_TYPE_OBSTACLE = 3;
  // ENTITY_TYPE_HAZARD = 4;  // Future
}

enum EntitySize {
  ENTITY_SIZE_UNSPECIFIED = 0;
  ENTITY_SIZE_TINY = 1;       // 2.5 ft - 1 hex (can share)
  ENTITY_SIZE_SMALL = 2;      // 5 ft - 1 hex
  ENTITY_SIZE_MEDIUM = 3;     // 5 ft - 1 hex
  ENTITY_SIZE_LARGE = 4;      // 10 ft - 2x2 hexes
  ENTITY_SIZE_HUGE = 5;       // 15 ft - 3x3 hexes
  ENTITY_SIZE_GARGANTUAN = 6; // 20+ ft - 4x4 hexes
}
```

### MonsterType (Existing)

Already defined in `enums.proto` - reuse as-is:
```protobuf
enum MonsterType {
  MONSTER_TYPE_UNSPECIFIED = 0;
  // Undead (Crypt theme) - 1-9
  MONSTER_TYPE_SKELETON = 1;
  MONSTER_TYPE_ZOMBIE = 2;
  // ... etc
}
```

### ObstacleType (New)

```protobuf
enum ObstacleType {
  OBSTACLE_TYPE_UNSPECIFIED = 0;

  // Cave obstacles (1-19)
  OBSTACLE_TYPE_STALAGMITE = 1;
  OBSTACLE_TYPE_BOULDER = 2;

  // Structural obstacles (20-39)
  OBSTACLE_TYPE_PILLAR = 20;
  OBSTACLE_TYPE_STATUE = 21;

  // Crypt obstacles (40-59)
  OBSTACLE_TYPE_SARCOPHAGUS = 40;
  OBSTACLE_TYPE_ALTAR = 41;
  OBSTACLE_TYPE_BRAZIER = 42;

  // Furniture obstacles (60-79)
  OBSTACLE_TYPE_CRATE = 60;
  OBSTACLE_TYPE_BARREL = 61;
  OBSTACLE_TYPE_TABLE = 62;
}
```

### Obstacle Properties by Theme

**Cave:**
| Obstacle | Blocks Movement | Blocks LoS |
|----------|-----------------|------------|
| Stalagmite | Yes | Yes |
| Boulder | Yes | Yes |
| Pillar | Yes | Yes |

**Crypt:**
| Obstacle | Blocks Movement | Blocks LoS |
|----------|-----------------|------------|
| Pillar | Yes | Yes |
| Statue | Yes | Yes |
| Sarcophagus | Yes | No (half cover) |
| Altar | Yes | No (half cover) |
| Brazier | Yes | No |

**Bandit Lair:**
| Obstacle | Blocks Movement | Blocks LoS |
|----------|-----------------|------------|
| Crate | Yes | No (half cover) |
| Barrel | Yes | No (half cover) |
| Table | Yes | No (half cover) |
| Brazier | Yes | No |

**Monsters by Theme** (reference - already in MonsterType):
- **Cave:** Goblin, Giant Rat, Giant Spider, Wolf
- **Crypt:** Skeleton, Zombie, Ghoul, Giant Rat, Giant Spider
- **Bandit Lair:** Bandit, Bandit Captain, Wolf

## Data Flow

### Encounter Response Structure

```protobuf
message GetEncounterResponse {
  // ... existing fields
  repeated EntityPlacement entities = X;
  repeated CharacterState characters = X;
  repeated MonsterCombatState monsters = X;
  // repeated HazardState hazards = X;  // Future
}
```

### Rendering Flow

1. Loop through `entities[]`
2. Check `entity_type`:
   - `CHARACTER` → look up `characters[]` by `entity_id`, use shader colors for rendering
   - `MONSTER` → read `monster_type` from oneof, load 3D asset, look up `monsters[]` for HP/name
   - `OBSTACLE` → read `obstacle_type` from oneof, load 3D asset (no additional lookup needed)
   - `HAZARD` (future) → read `hazard_type` from oneof, look up `hazards[]` for visibility/effects

### Tactical Queries

The UI calls toolkit RPCs to ask tactical questions:
- "Can I move from A to B?" → Toolkit checks obstacles in path
- "Do I have line of sight to target?" → Toolkit checks LoS blockers
- "What cover do I have?" → Toolkit checks nearby obstacles

The toolkit knows what each `ObstacleType` means tactically (pillar blocks LoS, crate provides half cover, etc.).

## Separation of Concerns

| Layer | Responsibility |
|-------|----------------|
| **Proto (rpg-api-protos)** | Define `EntityPlacement`, `EntityType`, `ObstacleType` (reuse existing `MonsterType`) |
| **API (rpg-api)** | Store entities, serve data, expose tactical RPCs |
| **Toolkit (rpg-toolkit)** | Own game rules - what blocks movement, provides cover, etc. |
| **Web (rpg-dnd5e-web)** | Map `monster_type`/`obstacle_type` → 3D asset, render at position |

## Future: Hazards

When we add traps and difficult terrain:

1. Add `ENTITY_TYPE_HAZARD` to `EntityType`
2. Add `HazardType` enum:
   ```protobuf
   enum HazardType {
     HAZARD_TYPE_UNSPECIFIED = 0;
     HAZARD_TYPE_RUBBLE = 1;        // Difficult terrain
     HAZARD_TYPE_SHALLOW_WATER = 2; // Difficult terrain
     HAZARD_TYPE_CAMPFIRE = 3;      // Fire damage if entered
     HAZARD_TYPE_CHASM_EDGE = 4;    // Fall risk
     HAZARD_TYPE_BEAR_TRAP = 5;     // Hidden, triggers on movement
     HAZARD_TYPE_PIT_TRAP = 6;      // Hidden, triggers on movement
   }
   ```
3. Add `hazard_type` to the oneof in `EntityPlacement`
4. Add `hazards[]` slice to encounter response with:
   - `hazard_id` (matches `entity_id`)
   - `display_label` (e.g., "Difficult Terrain", "Trap Detected")
   - Any UI hints needed

Visibility is handled by the event stream - hazards only appear in a player's entity list if they can see them.

## Non-Goals

- **Doors** - Handled separately as room connections, not entities
- **Complex trap mechanics** - Backend handles all logic, UI just renders
- **Height/elevation** - Obstacle type implies behavior, no explicit height field needed

## Why This Approach

- **Reuses existing `MonsterType`** - No duplication of monster definitions
- **Focused enums** - `ObstacleType` only has obstacles, easier to maintain
- **Type safety via oneof** - Compiler enforces correct field for each entity type
- **Characters are different** - They use shader colors, not asset enums, so no visual_type needed
- **Follows "pick ONE way"** - Monsters use `MonsterType` everywhere, obstacles use `ObstacleType`
