---
name: CharacterService
description: D&D 5e character creation, draft lifecycle, equipment management, and reference data
updated: 2026-05-02
confidence: high — verified by reading dnd5e/api/v1alpha1/character.proto end-to-end
---

# CharacterService

The largest service by RPC count. Defined in
`dnd5e/api/v1alpha1/character.proto` (1,237 lines). Owns every
character-related operation: draft creation flow, ability score
rolls, validation, finalization, equipment management, and the
reference data lookups (races, classes, backgrounds, equipment,
spells) that the character-creation UI needs.

## File and shape

- `dnd5e/api/v1alpha1/character.proto` — 1,237 lines.
- 1 service, ~32 RPCs, ~80 messages.
- Imports `choices.proto`, `common.proto`, `enums.proto`,
  `equipment_types.proto`.

## RPCs (grouped by purpose)

### Draft lifecycle (4 RPCs)

| RPC | Notes |
|---|---|
| `CreateDraft` | Starts character creation; player_id required, optional initial CharacterDraftData |
| `GetDraft` | Returns the draft including computed `validation` |
| `ListDrafts` | AIP-158 pagination; filter by player_id |
| `DeleteDraft` | Removes draft |

### Section-based updates (7 RPCs)

The "skip-around editing" pattern. Each RPC returns the full updated
draft so the client can re-render without a separate `Get`.

| RPC | Updates |
|---|---|
| `UpdateName` | string name |
| `UpdateRace` | Race + Subrace + race traits |
| `UpdateClass` | Class + Subclass + class info |
| `UpdateBackground` | Background |
| `UpdateAbilityScores` | AbilityScores |
| `UpdateSkills` | Skill proficiencies |
| `UpdateAppearance` | Appearance (skin tone, primary/secondary color, eye color) |

### Validation and finalization (3 RPCs)

| RPC | Notes |
|---|---|
| `ValidateDraft` | Returns `ValidationResult` (3-tier ERROR/INCOMPLETE/WARNING) |
| `GetDraftPreview` | Returns the Character that would be created if the draft were finalized |
| `FinalizeDraft` | Converts draft to Character |

### Completed character operations (3 RPCs)

| RPC | Notes |
|---|---|
| `GetCharacter` | Fetches by ID |
| `ListCharacters` | AIP-158 pagination; filter by session_id, player_id |
| `DeleteCharacter` | Removes character |

### Reference data (7 RPCs)

| RPC | Returns |
|---|---|
| `ListRaces` | Available races (PHB) |
| `ListClasses` | Available classes (PHB) |
| `ListBackgrounds` | Available backgrounds (PHB) |
| `GetRaceDetails` | Full race info including subraces, traits |
| `GetClassDetails` | Full class info including subclasses, features |
| `GetBackgroundDetails` | Full background info |
| `GetFeature` | Specific feature lookup |

### Choices and dice (3 RPCs)

| RPC | Notes |
|---|---|
| `RollAbilityScores` | Server-rolled ability score session; returns roll IDs |
| `GetRequirements` | Returns `repeated Choice` for the current draft state |
| `SubmitChoices` | Submits `repeated ChoiceSubmission` |

### Equipment listing and management (7 RPCs)

| RPC | Notes |
|---|---|
| `ListEquipmentByType` | Pagination; filter by EquipmentCategory |
| `ListSpellsByLevel` | Pagination; filter by spell level |
| `GetCharacterInventory` | Equipment slots + inventory |
| `EquipItem` | Equips item to a slot; may displace existing |
| `UnequipItem` | Unequips from slot |
| `AddToInventory` | Adds items |
| `RemoveFromInventory` | Removes by quantity or all |

## Core messages

### `CharacterDraft` (line 444) — view shape

The draft as the UI sees it: identity fields, base ability scores,
choices made, computed `validation` (3-tier), expanded info objects
(`RaceInfo`, `SubraceInfo`, `ClassInfo`, `BackgroundInfo`) for richer
UI.

### `CharacterDraftData` (line 392) — storage shape

Same identity fields without the expanded info objects. Toolkit's
`DraftData` analogue. Used in `CreateDraftRequest.initial_data` and
internally by rpg-api for storage.

### `Character` (line ~150-198, scattered) — finalized shape

Includes `EquipmentSlots equipment_slots = 19`, ability scores,
features, proficiencies, hit points, etc.

### `ValidationResult` (in common.proto:122)

Three-tier validation envelope: ERROR / INCOMPLETE / WARNING. Each
issue carries `ValidationSource` (race, class, background, ability
scores, name, alignment, level, subrace) and `ValidationField`
(skills, languages, equipment, spells, cantrips, tools, expertise,
fighting style, ability scores, name, race, class, background,
draconic ancestry, subrace, traits).

This is the only consistent rich-error pattern in the repo. New rich
errors should mirror it.

### `Choice` (choices.proto:62) and `ChoiceSubmission` (choices.proto:165)

Three-message split:
- `Choice` — what the player needs to choose (requirement).
- `ChoiceSubmission` — what the player picked (submission).
- `ChoiceData` — what's stored on the character (record).

`Choice.options` is a `oneof` of category-specific option lists
(`SkillOptions`, `EquipmentOptions`, `LanguageOptions`, ...).
`ChoiceSubmission` carries both the new generic `repeated string
selection_ids = 5` path and the deprecated category-specific `oneof`
path (lines 178-186).

### `EquipmentSlot` enum (line 1173)

11 slots: MAIN_HAND, OFF_HAND, ARMOR, HELMET, BOOTS, **GLOVES**, CLOAK,
AMULET, RING_1, RING_2, BELT.

`EQUIPMENT_SLOT_GLOVES` is rejected at runtime by rpg-api with
`InvalidArgument` (per existing status.md investigation). The enum
value is still present. This is a Rule 3 / enum-deprecation gap —
there is no proto-level marker that GLOVES is invalid; consumers
must know not to send it.

## Live consumers

- **rpg-api** — `internal/handlers/dnd5e/v1alpha1/character/handler.go`
  implements every RPC. The character orchestrator wraps the toolkit's
  `character.Data`.
- **rpg-dnd5e-web** — Connect-ES client drives the entire
  character-creation flow.

## Rule violations (this service)

### Rule 3 violations

- **`Proficiencies.armor` field 3** (character.proto:306):
  `[deprecated = true]`, superseded by `armor_categories`.
- **`Proficiencies.weapons` field 4** (character.proto:309):
  `[deprecated = true]`, superseded by `weapon_categories` /
  `specific_weapons`.
- **`EQUIPMENT_SLOT_GLOVES`** (line 1180): no proto-level deprecation
  marker; rpg-api rejects at runtime.
- **`ChoiceSubmission.selection` oneof** (choices.proto:178): comment
  marks deprecated; both paths still populated.

### Rule 4 violations: dead messages with no RPC

- **`UpdateCharacterRequest`** (character.proto:364) +
  **`UpdateCharacterResponse`** (character.proto:374). No `UpdateCharacter`
  RPC — section-based updates replaced the bulk update. Both messages
  define `repeated string update_mask` for a field-mask pattern that
  was never wired.
- **`UpdateDraftRequest`** (character.proto:509) +
  **`UpdateDraftResponse`** (character.proto:519). Same pattern; no
  `UpdateDraft` RPC.

These can be removed without affecting any consumer.

## Known rough edges

- **No proto-level enforcement that `ChoiceCategory` matches the
  populated `oneof` arm.** A `CHOICE_CATEGORY_SKILLS` Choice with
  `equipment_options` set is wire-valid but semantically wrong. The
  toolkit / orchestrator validates this at runtime; the schema does
  not.
- **`EquipmentItem` has three identifiers** (choices.proto:104):
  `selection_id` string, `oneof type_hint { Weapon | Armor | Tool |
  Pack | Ammunition }`, and `equipment_detail Equipment`. Three ways
  to identify the same item; pragmatic but redundant.
- **Subrace is a flat enum** (`enums.proto`). Mixes elf / dwarf /
  halfling / gnome subraces. When dragonborn ancestries land, there's
  no namespacing — they go in the same enum.
- **`Race`, `Class`, `Background`** hardcode the PHB list as enums.
  Homebrew or supplements would force a v1beta1 bump.

## Confidence and what's not verified

- RPC count and names verified by grepping `^  rpc ` against the
  service block (lines 16-76).
- Dead-message claim verified by grepping `rpc UpdateCharacter\|rpc
  UpdateDraft ` against the file — zero hits.
- Pagination consistency verified by grepping `page_size\|page_token\|
  next_page_token\|total_size` against character.proto. Every list
  RPC matches.
- I have not audited each enum for missing PHB values (e.g. is every
  cleric domain in `Subclass`?). That's a content audit, not a
  contract audit.
