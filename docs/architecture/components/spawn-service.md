---
name: SpawnService (UNUSED)
description: Generic entity spawning, movement, and templates; defined in api/v1alpha1, no live consumer
updated: 2026-05-02
confidence: high — verified by grepping rpg-api / rpg-dnd5e-web for any reference
---

# SpawnService

**Status: defined, not consumed.** Tracked under issue #140.

A generic entity-management service: spawn, move, update, remove
entities individually or in batches; spawn from templates; list and
manage templates. Sibling to `EnvironmentService` and `SpatialService`
in the room-services package.

## File and shape

- `api/v1alpha1/room_spawn.proto` — 1,424 lines.
- 1 service, 14 RPCs, ~50 messages.
- Imports `api/v1alpha1/room_common.proto`,
  `api/v1alpha1/room_spatial.proto` (uses spatial validation types).

## RPCs

### Single-entity operations

| RPC | Purpose |
|---|---|
| `SpawnEntity` | Place a single entity in a room |
| `SpawnMultipleEntities` | Place several at once |
| `SpawnFromTemplate` | Instantiate from a saved template |
| `MoveEntity` | Update entity position |
| `UpdateEntity` | Modify entity properties |
| `RemoveEntity` | Remove from room |

### Queries

| RPC | Purpose |
|---|---|
| `GetEntity` | Fetch by id |
| `ListEntities` | Pagination via PageInfo |
| `FindEntitiesByType` | Filter by type string |

### Templates

| RPC | Purpose |
|---|---|
| `ListSpawnTemplates` | List saved templates |
| `CreateSpawnTemplate` | Save a template |
| `GetSpawnTemplate` | Fetch a template |

### Batch operations

| RPC | Purpose |
|---|---|
| `BatchSpawnEntities` | Bulk spawn |
| `BatchMoveEntities` | Bulk move |
| `BatchRemoveEntities` | Bulk remove |

## Why this is unused

- The live encounter service spawns entities via the encounter
  orchestrator's room-generation flow (rpg-api's dungeon component
  → encounter `Room` with embedded `entities` map). Entities never
  flow through this service.
- No code in `rpg-api/internal` or `rpg-dnd5e-web/src` references
  `SpawnServiceClient` (verified by grep, 2026-05-02).

## Rule violations (this service)

- **Rule 4 (no proto unused for >1 release)**: 1,424 lines of unused
  schema since at least 2025-12.
- **Rule 5 (pagination)**: uses `PageInfo` envelope, which is the
  pattern only the unused services use. Inconsistent with the live
  AIP-158 inline pattern.

## Recommendation

Delete with issue #140.
