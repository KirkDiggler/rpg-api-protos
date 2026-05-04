---
name: SandboxRoomService (UNUSED)
description: Sandbox-package room generation and entity management with its own duplicate types; defined, not consumed
updated: 2026-05-02
confidence: high — verified by grepping rpg-api / rpg-dnd5e-web for any reference
---

# SandboxRoomService

**Status: defined, not consumed.** Tracked under issue #140.

Lives in its own package (`sandbox.api.v1alpha1`) with its own
sub-package conventions. Defines a duplicate `EntitySize` enum and a
non-reusable `WallSegment` type. The strongest candidate for
deletion in the repo.

## Files and shape

- `sandbox/api/v1alpha1/sandbox_room.proto` — 177 lines (service +
  request/response messages).
- `sandbox/api/v1alpha1/sandbox_common.proto` — 138 lines (config
  messages, RoomShape / WallPattern enums, the duplicate `EntitySize`
  enum).
- 1 service, 13 RPCs.
- Imports `api/v1alpha1/room_common.proto`.

## RPCs

### Room creation and management

| RPC | Purpose |
|---|---|
| `GenerateRoom` | Procedural generation from `GenerativeRoomConfig` |
| `BuildStaticRoom` | Build from explicit walls/doors |
| `GetRoom` | Fetch by id |
| `ListRooms` | List rooms |
| `DeleteRoom` | Remove |

### Spatial queries

| RPC | Purpose |
|---|---|
| `CheckLineOfSight` | LoS check |
| `FindPath` | Path between positions |
| `CalculateDistance` | Distance |
| `GetPositionsInRange` | Positions in a radius |

### Entity management

| RPC | Purpose |
|---|---|
| `PlaceEntity` | Spawn at position |
| `MoveEntity` | Update position |
| `RemoveEntity` | Remove from room |
| `GetEntitiesInRoom` | List entities in room |

## Why this is unused

- The live game uses `dnd5e.EncounterService`'s built-in room and
  entity model. The sandbox shapes are richer in some areas (room
  shapes — RECTANGLE, L_SHAPE, T_SHAPE, CROSS, OVAL — and wall
  patterns) but no live consumer exercises any of it.
- The only reference in rpg-api is
  `internal/services/sandboxroom/types.go` which imports
  `sandboxcommon.GenerativeRoomConfig`, `GenerationMetrics`,
  `StaticRoomConfig`, and `EntitySize` for an interface stub. There
  is no orchestrator, handler, or server registration backing that
  interface (per rpg-api docs `discoveries.json` disc-008).
- No web consumer.

## Rule violations (this service)

### Rule 4 violation: extensive unused proto

315 lines of schema across two files, defined-but-unused.

### Rule 6 violations: type collisions and duplicate enums

- **`sandbox.api.v1alpha1.EntitySize`** (`sandbox_common.proto:73`) —
  duplicates `dnd5e.api.v1alpha1.EntitySize` (`enums.proto:818`)
  exactly. Same six values (TINY, SMALL, MEDIUM, LARGE, HUGE,
  GARGANTUAN), different fully-qualified names. There is no shared
  generic-EntitySize in `api.v1alpha1` to consolidate to.
- **`WallSegment`** — defined fresh in this package rather than
  reusing `api.v1alpha1.Wall` (`room_common.proto:104`). Different
  shape, similar concept.
- **`GenerationMetrics`** — sandbox-specific; the live encounter
  service has no equivalent metric envelope.

### Rule 4 + 6 combined

A package that defines its own duplicates of types that already exist
in `api/v1alpha1` and `dnd5e/api/v1alpha1`, isn't used by anyone, and
has no clear path to being used. Schema noise.

## Recommendation

**Delete the entire `sandbox/api/v1alpha1` package.** The interface
stub in rpg-api that imports it (`services/sandboxroom/types.go`)
gets deleted at the same time.

If procedural-room-shape generation (RECTANGLE, L_SHAPE, T_SHAPE,
CROSS, OVAL) becomes a real need later, those concepts can be added
to either `dnd5e.EncounterService` (if dnd5e-specific) or a clean
generic package designed against actual use.
