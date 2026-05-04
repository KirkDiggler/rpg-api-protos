---
name: EncounterService
description: D&D 5e encounter contract — lobby, dungeon exploration, combat, action economy, event streaming
updated: 2026-05-02
confidence: high — verified by reading dnd5e/api/v1alpha1/encounter.proto end-to-end and grepping consumers
---

# EncounterService

The largest, busiest service in the repo. Defined in
`dnd5e/api/v1alpha1/encounter.proto` (1,235 lines). It is the contract
for every multiplayer combat interaction: lobby management, dungeon
exploration, combat actions, monster turns, rest, and the event stream
that broadcasts state changes to all connected clients.

## File and shape

- `dnd5e/api/v1alpha1/encounter.proto` — 1,235 lines.
- 1 service, 25 RPCs, 91 messages.
- Imports `api/v1alpha1/room_common.proto` (Position, Wall),
  `dnd5e/api/v1alpha1/character.proto` (Character types), `common.proto`
  (Condition, SourceRef), `enums.proto` (everything dnd5e-specific).

## RPCs

Defined at `encounter.proto:1150-1235`. Grouped by feature area.

### Lobby management (4 RPCs)

| RPC | Request:Response | Purpose |
|---|---|---|
| `CreateEncounter` | `CreateEncounterRequest:CreateEncounterResponse` | Creates lobby with join code |
| `JoinEncounter` | `JoinEncounterRequest:JoinEncounterResponse` | Joins by join code |
| `SetReady` | `SetReadyRequest:SetReadyResponse` | Marks player ready |
| `LeaveEncounter` | `LeaveEncounterRequest:LeaveEncounterResponse` | Removes player |

### Combat lifecycle (1 RPC)

| RPC | Notes |
|---|---|
| `StartCombat` | Host-only; rolls initiative, places entities, transitions WAITING→ACTIVE |

### Event stream (1 RPC)

| RPC | Notes |
|---|---|
| `StreamEncounterEvents` | Server-streaming; `stream EncounterEvent`. Used after `GetEncounterState` for the load-then-stream pattern |

### Dungeon exploration (1 RPC + 1 deprecated)

| RPC | Notes |
|---|---|
| `OpenDoor` | Opens door, reveals next room, may trigger initiative for new monsters |
| `DungeonStart` | **`option deprecated = true`** (encounter.proto:1177). Replaced by `CreateEncounter` + `StartCombat`; rpg-api still implements |

### State retrieval (3 RPCs)

| RPC | Notes |
|---|---|
| `GetCombatState` | **Deprecated** (proto comment at 1187). rpg-api returns `Unimplemented`. Replaced by `GetEncounterState` |
| `GetEncounterState` | Full snapshot for load-then-stream; carries `last_event_id` for client-side dedup |
| `GetEncounterHistory` | Replays past events for late join/reconnect; non-AIP-158 pagination — see [data-model.md pagination patterns](../data-model.md#pagination-patterns-inconsistent) |

### Combat actions — legacy (3 RPCs, all deprecated)

| RPC | Notes |
|---|---|
| `MoveCharacter` | **`option deprecated = true`** (encounter.proto:1202). Replaced by `ExecuteAction` with `ACTION_ID_MOVE`. rpg-api still implements |
| `Attack` | **`option deprecated = true`** (encounter.proto:1211). Replaced by `ActivateCombatAbility` + `ExecuteAction`. rpg-api still implements |
| `EndTurn` | Active. Advances initiative |

### Combat actions — two-level action economy (3 RPCs)

| RPC | Notes |
|---|---|
| `ActivateCombatAbility` | Consumes action economy (e.g. Standard Action) and grants capacity (e.g. 2 attacks for Extra Attack) |
| `ExecuteAction` | Consumes granted capacity. `oneof input { StrikeInput | MoveInput }` |
| `ActivateFeature` | Activates class features (Rage, Second Wind, etc.) |

### Rest (2 RPCs)

| RPC | Notes |
|---|---|
| `ShortRest` | Party short rest between rooms |
| `LongRest` | Party long rest |

## State envelope: `EncounterStateData`

`encounter.proto:96` — the unified snapshot. Used in `GetEncounterStateResponse`
(field 20, line 381) and embedded in event messages
(`CombatStartedEvent.encounter_state_data`, `RoomRevealedEvent`,
`PlayerReconnectedEvent`, `CombatPausedEvent`, `CombatResumedEvent`,
`CombatEndedEvent`).

```proto
message EncounterStateData {
  string encounter_id = 1;
  string dungeon_id = 2;
  map<string, EntityState> entities = 3;
  map<string, RoomLayout> rooms = 4;
  string current_room_id = 5;
  repeated string revealed_room_ids = 6;
  CombatState combat = 7;
  DungeonState dungeon_state = 8;
  int32 rooms_cleared = 9;
  map<string, DoorInfo> doors = 10;
}
```

`EntityState` (encounter.proto:45) is the unified per-entity shape:
position, size, HP, conditions, death saves, plus
`oneof details { CharacterDetails | MonsterDetails | ObstacleDetails }`.

This is the future shape. The legacy fragmented fields are still
populated alongside it (see below).

## Event surface: `EncounterEvent`

`encounter.proto:836` — the discriminated union for the event stream.
26 `oneof event` variants spread across tag numbers 10-55 with
intentional gaps for future categorization. Variants:

- **Player lifecycle:** `PlayerJoinedEvent`, `PlayerLeftEvent`,
  `PlayerReadyEvent`, `PlayerDisconnectedEvent`, `PlayerReconnectedEvent`.
- **Combat lifecycle:** `CombatStartedEvent`, `CombatEndedEvent`,
  `CombatPausedEvent`, `CombatResumedEvent`.
- **Combat actions:** `MovementCompletedEvent`, `AttackResolvedEvent`,
  `FeatureActivatedEvent`, `TurnEndedEvent`,
  `MonsterTurnCompletedEvent`, `CombatAbilityActivatedEvent`,
  `ActionExecutedEvent`.
- **Dungeon:** `RoomRevealedEvent`, `DungeonVictoryEvent`,
  `DungeonFailureEvent`.
- **Death/rest:** `DeathSaveRolledEvent`, `CharacterDiedEvent`,
  `CharacterStabilizedEvent`, `CharacterUnconsciousEvent`,
  `RestCompletedEvent`.

Each event message is small — ID, target entity ID, and the diff fields
needed to update client-side state. Several events embed
`EncounterStateData encounter_state_data = 10` as a snapshot fast path
(`CombatStartedEvent`, `RoomRevealedEvent`, `PlayerReconnectedEvent`,
`CombatPausedEvent`, `CombatResumedEvent`, `CombatEndedEvent`).

### Event tag-number densification

PR #136 retired old fragmented event fields via `reserved`. The result
is intentional gaps:
- `CombatStartedEvent` (line 903) reserves 1-5, uses 10.
- `MovementCompletedEvent` (line 916) reserves 3-6, uses 1, 2, 10, 11.
- `AttackResolvedEvent` (line 926) reserves 4-6, uses 1-3, 7, 10, 11.
- `ActionExecutedEvent` (line 982) reserves 3, 5, 7, uses 1, 2, 4, 6,
  8, 10, 11, 20.
- `RoomRevealedEvent` (line 1032) reserves 3-5, uses 1, 2, 10.

Wire-correct, hard to read. When you see a `reserved` block, an old
fragmented field used to live there.

## Action economy

`ActionEconomy` (encounter.proto:238) tracks per-turn combat
resources:

```proto
message ActionEconomy {
  int32 movement_remaining = 1;
  int32 movement_max = 2;
  int32 attacks_remaining = 3;
  bool standard_action_available = 4;
  bool bonus_action_available = 5;
  bool reaction_available = 6;
  int32 off_hand_attacks_remaining = 7;
  int32 flurry_strikes_remaining = 8;
  reserved 9, 10;
  reserved "disengage_active", "dodge_active";
}
```

Replaces the deprecated boolean/int fields on `TurnState` (line 225-229).
`disengage_active` / `dodge_active` were retired in favor of conditions
(reserved at lines 260-261).

Drives the two-level action economy flow:
1. Client calls `ActivateCombatAbility` (e.g. `COMBAT_ABILITY_ID_ATTACK`).
2. Server returns updated `ActionEconomy` and `granted_capacity`
   description.
3. Client calls `ExecuteAction` (e.g. `ACTION_ID_STRIKE`) which consumes
   the granted capacity.
4. UI uses `repeated AvailableAbility available_abilities` and `repeated
   AvailableAction available_actions` from the response to render
   buttons with `can_use` + `reason` for tooltips.

## Live consumers

- **rpg-api** — `internal/handlers/dnd5e/v1alpha1/encounter/handler.go`
  implements every RPC including the deprecated ones. The orchestrator
  builds `EncounterStateData` and emits `EncounterEvent`s through the
  Redis publisher.
- **rpg-dnd5e-web** — Connect-ES client subscribes to
  `StreamEncounterEvents`, calls `GetEncounterState` on join/reconnect,
  and dispatches actions via `ActivateCombatAbility` + `ExecuteAction`.

## Rule violations (this service)

### Rule 1 violation: dual state shapes in `GetEncounterStateResponse`

`encounter.proto:353-382`. Both legacy fragmented fields and the
unified `EncounterStateData` are populated. Tracked as **issue #138**.
The legacy messages — `CharacterCombatState` (314), `MonsterCombatState`
(343), `EntityPlacement` (18) — are subsumed by `EntityState` (45)
and should be removed once rpg-api stops populating them.

### Rule 3 violations: 4 deprecated RPCs

Listed above:
- `DungeonStart` (line 1177)
- `GetCombatState` (line 1188 — proto comment, no `option deprecated`)
- `MoveCharacter` (line 1202)
- `Attack` (line 1211)

Plus 6 deprecated fields on `TurnState` (lines 225-229) and 1 on
`DamageComponent.source` (line 512). Tracked as **issue #140**.

### Rule 5 violation: inconsistent error patterns

- Most response messages use `bool success + string error`.
- `MoveCharacterResponse` uses typed `MovementError` (line 419) — the
  only typed error in the whole repo.
- `GetCombatState` returns `codes.Unimplemented`.

`MoveCharacter` is itself deprecated, so the inconsistency self-resolves
when issue #140 closes.

### Rule 5 violation: non-standard pagination on `GetEncounterHistory`

`limit` / `up_to_event_id` / `has_more` instead of `page_size` /
`page_token` / `next_page_token` / `total_size`. Justified for the
event-stream load-then-stream use case but the field names diverge
unnecessarily. See [data-model.md pagination](../data-model.md#pagination-patterns-inconsistent).

## Known rough edges

- **`Room` field name collision.** `dnd5e.api.v1alpha1.Room`
  (encounter.proto:111) is the live encounter room; `api.v1alpha1.Room`
  (room_common.proto:176) is a richer generic version that nothing
  uses. Generated TypeScript imports become awkward when both packages
  are referenced.
- **`PartyMember.character_data` is `bytes`** (line 752, looking at
  surrounding context) — toolkit-owned JSON for character state. This
  is the same pattern as `Condition.condition_data` and is intentional.
- **`MovementError` is dead enum noise.** Defined but only consumed by
  the deprecated `MoveCharacter` RPC. Will go when `MoveCharacter` goes.

## Confidence and what's not verified

- The 26 event variants are confirmed by reading the `oneof event`
  block at encounter.proto:836-885.
- Each deprecated marker is confirmed by `grep -n deprecated`.
- Consumer references confirmed by grepping
  `EncounterServiceClient` and `EncounterServiceServer` in rpg-api
  and rpg-dnd5e-web.
- I have not verified that every event variant is actually emitted
  by rpg-api today; that's an rpg-api-member concern. If an event is
  defined but never emitted, that's drift in the proto-but-not-in-use
  direction.
