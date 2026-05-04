# Monster Turn Result Proto Messages Design

**Issue:** [#86](https://github.com/KirkDiggler/rpg-api-protos/issues/86)
**Related:** rpg-toolkit PR #414, rpg-api issue #273
**Date:** 2025-12-08

## Overview

Add proto messages to communicate monster turn outcomes back to clients. When players end their turns, the server executes all monster actions until the next player's turn, then batches and returns these results.

## Design Decisions

### Reuse `AttackResult`
Monsters are first-class entities on the event bus and use the same damage/attack systems as characters. We reuse the existing `AttackResult` message (with full `DamageBreakdown`) rather than creating a simplified version.

### Enum for Action Types
The toolkit defines typed string constants for `ActionType` in `rulebooks/dnd5e/monster/data.go`. We mirror these as a proto enum for type safety.

### Minimal Result Types
Start with `AttackResult` (existing) and `HealResult` only. No `StealthResult` or `SpellResult` until we have concrete use cases.

### Self-Contained Messages
Include `monster_name` in `MonsterTurnResult` for streaming/event scenarios where messages need to stand alone without cross-referencing room state.

### Encounter End via EndTurn
`EncounterResult` only comes through `EndTurnResponse`, not `AttackResponse`. This allows players to loot/heal after killing the last monster before formally ending the encounter.

## New Types

### MonsterActionType Enum (enums.proto)

```protobuf
// MonsterActionType categorizes monster actions for behavior decisions
// Maps to toolkit's monster.ActionType constants
enum MonsterActionType {
  MONSTER_ACTION_TYPE_UNSPECIFIED = 0;
  MONSTER_ACTION_TYPE_MELEE_ATTACK = 1;
  MONSTER_ACTION_TYPE_RANGED_ATTACK = 2;
  MONSTER_ACTION_TYPE_SPELL = 3;
  MONSTER_ACTION_TYPE_HEAL = 4;
  MONSTER_ACTION_TYPE_MOVEMENT = 5;
  MONSTER_ACTION_TYPE_STEALTH = 6;
  MONSTER_ACTION_TYPE_DEFEND = 7;
}
```

### EncounterEndReason Enum (encounter.proto)

```protobuf
// EncounterEndReason indicates why combat ended
enum EncounterEndReason {
  ENCOUNTER_END_REASON_UNSPECIFIED = 0;
  ENCOUNTER_END_REASON_VICTORY = 1;  // All monsters defeated
  ENCOUNTER_END_REASON_DEFEAT = 2;   // All players defeated (TPK)
}
```

### HealResult Message (encounter.proto)

```protobuf
// HealResult contains the outcome of a healing action
message HealResult {
  int32 amount_healed = 1;  // HP restored
  int32 new_hp = 2;         // Current HP after healing
  int32 max_hp = 3;         // Maximum HP (for context)
}
```

### EncounterResult Message (encounter.proto)

```protobuf
// EncounterResult signals that combat has ended
message EncounterResult {
  EncounterEndReason reason = 1;
}
```

### MonsterExecutedAction Message (encounter.proto)

```protobuf
// MonsterExecutedAction records a single action taken by a monster
message MonsterExecutedAction {
  string action_id = 1;                    // Which action was used
  MonsterActionType action_type = 2;       // Category (melee_attack, heal, etc.)
  string target_id = 3;                    // Who was targeted (if applicable)
  bool success = 4;                        // Did the action succeed?

  // Action-specific details
  oneof details {
    AttackResult attack_result = 5;        // Reuse existing AttackResult
    HealResult heal_result = 6;
  }
}
```

### MonsterTurnResult Message (encounter.proto)

```protobuf
// MonsterTurnResult encapsulates everything a monster did on its turn
message MonsterTurnResult {
  string monster_id = 1;
  string monster_name = 2;                           // Self-contained for streaming
  repeated MonsterExecutedAction actions = 3;        // All actions taken
  repeated .api.v1alpha1.Position movement_path = 4; // Positions traversed
}
```

## Updated Responses

### EndTurnResponse (encounter.proto)

```protobuf
// EndTurnResponse returns the updated state after turn end
message EndTurnResponse {
  bool success = 1;
  CombatState combat_state = 2;
  TurnChangeEvent turn_change = 3;

  // NEW: Monster turns that occurred after player ended turn
  repeated MonsterTurnResult monster_turns = 4;

  // NEW: Set if combat ended (victory or TPK)
  optional EncounterResult encounter_result = 5;
}
```

### DungeonStartResponse (encounter.proto)

```protobuf
// DungeonStartResponse contains the generated encounter with combat already started
message DungeonStartResponse {
  string encounter_id = 1;
  Room room = 2;
  CombatState combat_state = 3;

  // NEW: If monsters won initiative and acted before first player
  repeated MonsterTurnResult monster_turns = 4;
}
```

## Files to Modify

1. `dnd5e/api/v1alpha1/enums.proto` - Add `MonsterActionType` enum
2. `dnd5e/api/v1alpha1/encounter.proto` - Add all new messages and update responses

## Backward Compatibility

All changes are additive:
- New enum values
- New messages
- New optional fields on existing responses

No breaking changes to existing clients.
