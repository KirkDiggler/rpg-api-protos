---
name: SpatialService (UNUSED)
description: Generic spatial queries (LoS, movement, AoE, multi-room paths); defined in api/v1alpha1, no live consumer
updated: 2026-05-02
confidence: high — verified by grepping rpg-api / rpg-dnd5e-web for any reference
---

# SpatialService

**Status: defined, not consumed.** Tracked under issue #140.

A generic spatial query service intended to back movement validation,
line-of-sight checks, area-of-effect queries, multi-room pathing, and
spatial-index access. Designed alongside `EnvironmentService` as part
of the room-services package. None of it is wired.

## File and shape

- `api/v1alpha1/room_spatial.proto` — 1,064 lines.
- 1 service, 11 RPCs, ~45 messages.
- Imports `api/v1alpha1/room_common.proto`.

## RPCs

### Phase 1-3 (basic queries)

| RPC | Purpose |
|---|---|
| `QueryLineOfSight` | Single-room LoS check |
| `ValidateMovement` | Can entity move to position? |
| `ValidateEntityPlacement` | Can entity be placed at position? |
| `QueryEntitiesInRange` | Entities within a radius |

### Phase 4 (advanced queries)

| RPC | Purpose |
|---|---|
| `CalculateMovementPath` | Compute path between positions |
| `QueryAreaOfEffect` | Entities/positions in an AoE |
| `QueryMultiRoomLineOfSight` | LoS across rooms |
| `CalculateMultiRoomPath` | Path across rooms |
| `QuerySpatialIndex` | Direct spatial-index access |

### Diagnostics

| RPC | Purpose |
|---|---|
| `GetSpatialStats` | Index statistics |
| `InvalidateSpatialCache` | Clear cache |

## Why this is unused

- The live encounter service does spatial work inline (handler imports
  `tools/spatial` from rpg-toolkit; the orchestrator calls toolkit
  pathfinding directly). See the rpg-api docs for the boundary
  violation that results — handlers shouldn't import toolkit.
- The "right" way per architecture is for spatial queries to go
  through this service. They don't, because it's not implemented.
- No code in `rpg-api/internal` or `rpg-dnd5e-web/src` references
  `SpatialServiceClient` (verified by grep, 2026-05-02).

## Rule violations (this service)

- **Rule 4 (no proto unused for >1 release)**: largest unused service
  by line count except `room_selectables.proto`. Has been
  defined-but-unused since at least 2025-12.
- **Rule 6 (naming)**: defines its own movement-validation result
  shapes that overlap conceptually with `MovementError` in
  `EncounterService`. If this service were ever wired, the
  inconsistency would force a reconciliation.

## Recommendation

Delete with issue #140. If the workspace later wants spatial queries
exposed via gRPC (rather than inlined in encounter), design fresh
against actual consumer needs.
