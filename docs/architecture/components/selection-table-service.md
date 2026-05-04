---
name: SelectionTableService (UNUSED)
description: Generic loot/encounter table system with rolls, modifiers, batch generation; defined in api/v1alpha1, no live consumer
updated: 2026-05-02
confidence: high — verified by grepping rpg-api / rpg-dnd5e-web for any reference
---

# SelectionTableService

**Status: defined, not consumed.** Tracked under issue #140.

The largest unused proto file in the repo. A generic table-rolling
service for loot tables, random encounter tables, treasure tables, etc.
Designed for many RPG systems' "roll on a d100 table" pattern.

## File and shape

- `api/v1alpha1/room_selectables.proto` — 1,821 lines (largest single
  proto file in the repo).
- 1 service, 14 RPCs, ~70 messages.
- Imports `api/v1alpha1/room_common.proto`.

## RPCs

### Table CRUD

| RPC | Purpose |
|---|---|
| `CreateSelectionTable` | Create a table |
| `GetSelectionTable` | Fetch by id |
| `UpdateSelectionTable` | Modify |
| `DeleteSelectionTable` | Remove |
| `ListSelectionTables` | Paginated list |

### Rolls

| RPC | Purpose |
|---|---|
| `RollOnTable` | Single roll |
| `RollMultiple` | Multiple rolls on same table |
| `RollWithModifiers` | Roll with adjustments (luck, advantage, etc.) |

### Generation flows

| RPC | Purpose |
|---|---|
| `BatchRollTables` | Roll on multiple tables in one call |
| `GenerateEncounter` | Encounter generation flow |
| `GenerateLoot` | Loot generation flow |

### Validation and import/export

| RPC | Purpose |
|---|---|
| `ValidateSelectionTable` | Check table validity |
| `GetTableStatistics` | Distribution analysis |
| `ExportSelectionTable` | Serialize |
| `ImportSelectionTable` | Deserialize |

## Why this is unused

- The live game does not use random-encounter or random-loot tables.
  Encounters are placed by the dungeon component (rpg-api) using
  toolkit logic. Loot is not currently generated.
- No code in `rpg-api/internal` or `rpg-dnd5e-web/src` references
  `SelectionTableServiceClient` (verified by grep, 2026-05-02).

## Rule violations (this service)

- **Rule 4 (no proto unused for >1 release)**: largest unused service.
  1,821 lines.

## Recommendation

Delete with issue #140. If random encounter / loot tables become a
feature, design then; the schema needs are likely to be specific to
the actual use case rather than the generic shape captured here.
