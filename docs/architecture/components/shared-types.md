---
name: Shared types (common, enums, choices, equipment_types)
description: D&D 5e cross-service types — ability scores, validation, choices, conditions, enums, equipment data
updated: 2026-05-02
confidence: high — verified by reading every shared file end-to-end
---

# Shared types

These files don't define their own services; they hold the types that
`CharacterService` and `EncounterService` both depend on. Together
they're roughly 2,400 lines of contract:

| File | Lines | Contents |
|---|---|---|
| `dnd5e/api/v1alpha1/enums.proto` | 896 | All dnd5e enums |
| `dnd5e/api/v1alpha1/common.proto` | 209 | AbilityScores, DiceRoll, Modifier, Resource, Condition, ValidationResult, SourceRef |
| `dnd5e/api/v1alpha1/choices.proto` | 262 | Choice, ChoiceSubmission, ChoiceData, options, selections |
| `dnd5e/api/v1alpha1/equipment_types.proto` | 66 | Equipment, WeaponData, ArmorData, GearData, Cost, Weight |

## `enums.proto` — every dnd5e enum

Comprehensive: races, classes, subclasses, backgrounds, languages,
weapons, armor, tools, packs, ammunition, spells, damage types, traits,
weapon properties, armor/weapon/tool proficiency categories, fighting
styles, conditions, features, monster traits, action types, monster
action types, monster types, dungeon themes/difficulties/lengths,
dungeon state, attack hand, entity type, entity size, obstacle type,
combat ability id, action id, rest type.

Naming is consistent: `<TYPE>_<UPPER_SNAKE>`, every enum has
`_UNSPECIFIED = 0`. No violations of Rule 6.

### Rule 3 / 4 risk: enum value lifecycle

- **`EQUIPMENT_SLOT_GLOVES`** (character.proto:1180) is in the live
  enum but rejected by rpg-api at runtime. There is no proto-level
  marker that it's deprecated. Enum value deprecation has no examples
  in this repo.
- **`Spell`, `MonsterType`, `FeatureId`, `ConditionId`, `Subclass`**
  grow per-feature. No deprecation pathway — once added, they're
  forever within `v1alpha1`.
- **`Race`, `Class`, `Background`** hardcode the PHB list. Homebrew
  or supplement support would require a `v1beta1` bump.

These are watch items, not violations. Rule 3 says deprecated *fields*
retire in one release; protobuf enum values are harder to retire
cleanly without `reserved` (which protobuf supports for enum values
since proto3).

## `common.proto` — D&D 5e building blocks

### `AbilityScores` (line 12)

Six fields: strength, dexterity, constitution, intelligence, wisdom,
charisma. Used everywhere — character creation, monster definitions,
saving throws, etc. Stable; no churn expected.

### `DiceRoll` (line 45)

The notation form: `count`, `size`, `modifier`, `notation` (e.g.
"1d20+5"). Distinct from `api.v1alpha1.DiceRoll` (the result form).
Same name, different shape — Rule 6 violation. Renaming candidate.

### `Modifier` (line 60)

`target`, `value`, `source`, `type`. Generic ability/skill modifier
with provenance. The `type` field is a free-form string ("enhancement",
"circumstance", etc.) — could be enumified but isn't.

### `Resource` (line 75)

Trackable resources: hit dice, spell slots, ki points, rage uses.
`name`, `current`, `maximum`, `refresh_on` (string: "short rest",
"long rest", "daily"). Refresh trigger is a string rather than an enum.

### `Condition` (line 90)

```proto
message Condition {
  string name = 1;
  string source = 2;
  int32 duration = 3;        // -1 for indefinite
  string notes = 4;
  ConditionId id = 5;        // toolkit reference
  bytes condition_data = 6;  // toolkit-owned JSON for UI
}
```

The `id + condition_data` pattern is canonical in this repo: enum
identifies the condition, opaque bytes carry toolkit-owned payload
for the UI to render. Same shape used by `CharacterFeature.feature_data`
and `PartyMember.character_data`. The contract layer carries the
identifier; the toolkit owns the meaning.

### `ValidationResult` (line 122)

The 3-tier validation envelope. See
[character-service.md](character-service.md#validationresult-in-commonproto122).
This is the only consistent rich-error pattern in the repo.

### `SourceRef` (line 189)

Discriminator for damage / effect sources. `oneof source { Weapon |
Ability | ConditionId | FeatureId | Spell | MonsterTraitId }`.
Replaces the deprecated `DamageComponent.source` string field
(encounter.proto:512). Source granularity is uneven — `Ability` is
a generic enum, the others identify specific items.

## `choices.proto` — character creation choices

Three-message split:

- **`Choice`** (line 62) — what needs to be chosen. Carries `id`,
  `description`, `choose_count`, `ChoiceCategory`, and a `oneof
  options` of category-specific option lists.
- **`ChoiceSubmission`** (line 165) — what the player picked. Carries
  `choice_id`, `category`, `source`, `option_id`, `repeated string
  selection_ids`, AND a deprecated category-specific `oneof selection`
  path. Both are populated in real use today.
- **`ChoiceData`** (line 244) — what's stored on the character. Same
  shape as the deprecated `oneof` path on `ChoiceSubmission` plus a
  `string name` arm for character names.

### Rule 3 violation: dual selection paths

`ChoiceSubmission.selection_ids` (line 174, the new generic path) and
`ChoiceSubmission.selection` `oneof` (line 178, the deprecated
category-specific path) both populated today. The comment marks the
oneof deprecated; nothing in the schema enforces it. Tracked as
**issue #138**.

### Rule 6 risk: category/options mismatch is wire-valid

A `CHOICE_CATEGORY_SKILLS` Choice with `equipment_options` set is
wire-valid but semantically wrong. Toolkit / orchestrator validates
this at runtime; the schema does not. Could be enforced with stricter
typing (separate Choice messages per category) but the cost is
verbosity — current shape is a deliberate trade-off.

### Rule 6 risk: triple-identification on `EquipmentItem`

`EquipmentItem` (line 104) has:
- `selection_id` string (toolkit's reference key).
- `oneof type_hint { Weapon | Armor | Tool | Pack | Ammunition }`
  for client convenience.
- `equipment_detail Equipment` for full resolved stats.

Three ways to identify the same item. Pragmatic but redundant. The
`type_hint` could be removed once consumers reliably use either the
selection_id or equipment_detail.

## `equipment_types.proto` — equipment data

Smallest dnd5e file. `Equipment` with a `oneof equipment_data
{ WeaponData | ArmorData | GearData }` discriminator. `Cost` and
`Weight` are tiny `quantity + unit` messages — overkill for D&D 5e
(only gp/sp/cp; only lbs) but correct in spirit and trivially
extensible.

No rule violations.

## Cross-cutting risks

- **Stringly-typed fields where enums would help:**
  `Modifier.type`, `Resource.refresh_on`, `Condition.source`,
  several `Door.type` / `Door.state` fields in the unused services.
  Trade-off: schema simplicity vs. enforcement.
- **`bytes condition_data` is opaque.** The contract intentionally
  doesn't specify the JSON shape — the toolkit owns it. This means
  schema evolution of conditions happens in the toolkit's JSON, not
  in this proto. Drift between the toolkit's JSON shape and the web's
  rendering can occur silently.

## Confidence and what's not verified

- File line counts verified by `wc -l`.
- Field/message line numbers verified by direct read.
- Cross-package import / reuse verified by reading the import lists at
  the top of each file.
- "Stable; no churn expected" claim about `AbilityScores` is from the
  dnd5e PHB never changing its six abilities — not from git log.
