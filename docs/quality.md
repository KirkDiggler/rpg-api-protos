---
name: rpg-api-protos quality scorecard
description: Per-service grade with rationale — a graded scorecard the janitor will update over time
updated: 2026-05-04
confidence: low-medium — first draft grades from a read-through of every .proto file plus grep against rpg-api / rpg-dnd5e-web; expect Kirk to adjust
---

# Quality scorecard

Every service / proto package graded A-D. Grades reflect a holistic read of:
API clarity, breaking-change discipline, naming consistency, message reuse,
deprecation path, and whether real consumers actually use what's defined.

This is a first draft. Grades are a starting point — they should change as
consumers stabilize and as we add discipline around removing deprecated
fields.

## Live services (consumed by rpg-api and/or rpg-dnd5e-web)

### dnd5e.EncounterService — B-

The biggest, busiest service in the repo. The unified entity-state landing
(PRs #135/#136) was the right move and was done with care — old field tags
correctly `reserved`'d, new fields placed at higher tag numbers — but it
left the proto carrying two parallel state shapes: legacy `CombatState` +
`Room` + `[]CharacterCombatState` + `[]MonsterCombatState` + `[]DoorInfo`
**and** the new `EncounterStateData` (field 20). Both are populated today.

Other drag:
- Four RPCs marked deprecated (`Attack`, `MoveCharacter`, `DungeonStart`,
  `GetCombatState`). All four are still implemented in rpg-api except
  `GetCombatState`, which returns `Unimplemented`. No removal plan in
  proto.
- `MovementError` defines a typed error code enum, but nothing else in
  the service uses it. Most other RPCs return `bool success` + `string
  error`. Inconsistent.
- `EncounterEvent.event` oneof has 26 variants spread across tag numbers
  10-55 with intentional gaps for future categorization. Reading the
  enum requires the legend in the comments.
- Field-tag densification on event messages (e.g. `ActionExecutedEvent`
  uses 1, 2, 4, 6, 8, 10, 11, 20) is correct for wire compatibility but
  hard to scan.

Strengths:
- Real care taken with breaking-change avoidance: every retired field is
  `reserved` (both number and name).
- Action-economy redesign (`ActivateCombatAbility` + `ExecuteAction`) is
  cleaner than the old single-shot model and clearly separates
  capacity-grant from execution.
- Lobby + streaming flow (`CreateEncounter`, `JoinEncounter`,
  `StreamEncounterEvents`, `GetEncounterState`, `GetEncounterHistory`)
  is coherent and matches the load-then-stream pattern used by the web.

### dnd5e.CharacterService — B

Largest service by RPC count (~25 RPCs). The draft → finalize flow is
explicit and well-shaped: `CreateDraft` → section-based updates
(`UpdateName`, `UpdateRace`, `UpdateClass`, `UpdateBackground`,
`UpdateAbilityScores`, `UpdateSkills`, `UpdateAppearance`) →
`ValidateDraft` / `GetDraftPreview` → `FinalizeDraft`. Each section
update returns the full draft, which keeps the web consumer simple.

Drag:
- `Proficiencies.armor` (field 3) and `Proficiencies.weapons` (field 4)
  are `[deprecated = true]`; superseded by `armor_categories` /
  `weapon_categories` / `specific_weapons`. Still in the message.
- `EquipmentSlot.EQUIPMENT_SLOT_GLOVES` value is still in the enum but
  rejected at runtime by rpg-api with `InvalidArgument`. Better to
  remove from the enum or document at the proto level.
- `UpdateCharacterRequest` defines a `repeated string update_mask` but
  no RPC uses it (the section-based RPCs replace it). Dead message.
- `ChoiceData.selection` oneof and `ChoiceSubmission.selection` oneof
  cover most categories but rely on convention to match
  `ChoiceCategory category`. No proto-level enforcement.

Strengths:
- Pagination shape is consistent across `ListCharacters`, `ListDrafts`,
  `ListRaces`, `ListClasses`, `ListBackgrounds`,
  `ListEquipmentByType`, `ListSpellsByLevel`.
- `CharacterDraft` and `CharacterDraftData` cleanly separate the
  view-model (with expanded `RaceInfo` / `ClassInfo` etc.) from the
  storage shape.
- `Choice` / `ChoiceSubmission` / `ChoiceData` are distinct concepts
  with clear roles (requirement → submission → record).

### api.DiceService — A-

Small, focused, well-named. Three RPCs (`RollDice`, `GetRollSession`,
`ClearRollSession`) over a sensible entity+context grouping. Used by
rpg-api. The previous `DiceRoll` name collision with
`dnd5e.api.v1alpha1.DiceRoll` was resolved by deleting the unused
dnd5e copy (issue #141, 2026-05-04).

## Live shared types

### dnd5e/choices.proto — B-

The choice → submission → record three-message split (`Choice`,
`ChoiceSubmission`, `ChoiceData`) is good; this is the contract that
makes the character draft flow work.

Drag:
- `ChoiceSubmission` carries both `repeated string selection_ids = 5`
  (the new generic path) and a `oneof selection` of category-specific
  messages (the deprecated path). The comment says one is preferred but
  nothing in the proto enforces it. Both paths are populated in real
  use.
- `ChoiceCategory` and `Choice.options` `oneof` aren't linked at the
  schema level — a `CHOICE_CATEGORY_SKILLS` Choice with
  `equipment_options` set is wire-valid but semantically wrong.
- `EquipmentItem.type_hint` `oneof` (Weapon / Armor / Tool / Pack /
  Ammunition) plus `equipment_detail` (full Equipment) plus
  `selection_id` string is three ways to identify the same item.

### dnd5e/common.proto — B-

Solid building blocks for character creation: `AbilityScores`,
`Modifier`, `Resource`, `Condition`, `ValidationResult` (3-tier),
`SourceRef` (oneof of damage sources). The Condition message correctly
carries both an enum id and a `bytes condition_data` for toolkit-owned
JSON.

Drag:
- `ValidationResult` here is the rich 3-tier draft validation;
  `api.v1alpha1.ValidationResult` (room_common) is a generic
  is-valid-or-not. Same name, different shapes.
- `SourceRef.oneof` mixes specific enums (`Weapon`, `Spell`,
  `ConditionId`, `FeatureId`, `MonsterTraitId`) with one general one
  (`Ability`). Means damage source granularity varies by category.

### dnd5e/enums.proto — B+

Comprehensive: races, classes, subclasses, backgrounds, languages,
weapons, armor, tools, packs, ammunition, spells, damage types, traits,
weapon properties, armor/weapon/tool proficiency categories, fighting
styles, conditions, features, monster traits, action types, monster
action types, monster types, dungeon themes/difficulties/lengths,
dungeon state, attack hand, entity type, entity size, obstacle type,
combat ability id, action id, rest type. Naming is consistently
`<TYPE>_<UPPER_SNAKE>`.

Drag:
- `Spell`, `MonsterType`, `FeatureId`, `ConditionId`, and `Subclass`
  grow per-feature. There's no deprecation pathway documented for
  enums; once added they're forever.
- `Subrace` mixes elf, dwarf, halfling, gnome subraces. When a new
  subrace is added (e.g. dragonborn ancestries), there's no namespacing.
- The `Race`, `Class`, `Background` enums hardcode the PHB list. If
  homebrew or supplements ever land, this is a v1beta1 bump.

### dnd5e/equipment_types.proto — A-

Smallest dnd5e file (66 lines). `Equipment` with a `oneof equipment_data`
discriminator (`WeaponData` / `ArmorData` / `GearData`) is a clean,
extensible shape. `Cost` and `Weight` as separate messages with
`quantity + unit` is overkill for D&D 5e (gp/sp/cp; lbs) but correct in
spirit.

## Newly defined, consumer PR pending

### dnd5e.lobby.LobbyService — B+ (provisional)

Landed 2026-07-06 (rpg-api-protos#176), no consumer yet — distinct from the
"defined-but-not-consumed" bucket below because an `rpg-api` handler PR is
the immediate next leg of the same umbrella issue (`rpg-project#81`), not
speculative schema. Service-first layout (`service.proto`/`types.proto`/
`events.proto`) matches the precedent `dnd5e/api/v1alpha2/encounter/` set.
Six focused RPCs, one join mechanism (`join_ref`) with two carriers
documented in comments rather than invented as separate contract paths.
`LobbyEvent` deliberately skips `EncounterEvent`'s combat-log envelope
(sequence/timestamp/correlation_id) since there's no causation chain to
reassemble — right-sized rather than copy-pasted. Held below A by: no
runtime validation this shape survives contact with the orchestrator layer
yet, and `character_name` enrichment / party-cap config aren't verifiable
from the proto alone. Re-grade once the rpg-api PR lands.

## Defined-but-not-consumed services

These services compile, lint clean, and ship in the generated SDKs, but
no live consumer in `rpg-api` or `rpg-dnd5e-web` references them. They
are paying schema cost without earning their keep.

### api.EnvironmentService — C

Generic room generation/CRUD service: `GenerateRoom`, `GetRoomDetails`,
`ListRooms`, `UpdateRoom`, `DeleteRoom`, `ValidateRoomConfig`,
`ListRoomTemplates`, `CreateRoomTemplate`. Defines a generic `Room`
shape (with `RoomStructure`, `Door`, `TerrainFeature`, `RoomConnection`)
that overlaps with — but is not used by — the encounter `Room`. Not
consumed by anything live.

### api.SpatialService — C

Spatial queries: `QueryLineOfSight`, `ValidateMovement`, etc. plus a
`Phase 4` set of advanced queries (multi-room path, area of effect,
spatial index). Self-consistent, uses `api.v1alpha1.Position` — but no
live consumer; spatial work in rpg-api today goes through
encounter-service mechanics, not this.

### api.SpawnService — C

Entity spawning into rooms: `SpawnEntity`, `MoveEntity`, `UpdateEntity`,
`RemoveEntity`, plus batch and template variants. Imports `room_spatial`.
Not consumed.

### api.SelectionTableService — C-

Largest unused file (1.8k lines). Loot/encounter table system:
`CreateSelectionTable`, `RollOnTable`, `BatchRollTables`,
`GenerateEncounter`, `GenerateLoot`, `ImportSelectionTable`, etc. Not
consumed; the live encounter generation path doesn't use these.

### sandbox.SandboxRoomService — D

Room creation + spatial queries + entity management with a different
shape from the `api.v1alpha1` versions, plus its own `EntitySize` enum
that duplicates `dnd5e.EntitySize` exactly. Lives in its own package
(`sandbox.api.v1alpha1`), is fully generated, but not consumed. Either
an old experiment or scaffolding that lost its purpose. **Strongest
candidate for deletion.**

## Cross-cutting

### Naming consistency — B

- Services: `<Domain>Service` ✓
- RPCs: PascalCase ✓
- Messages: PascalCase ✓
- Fields: snake_case ✓
- Enums: `<TYPE>_<UPPER_SNAKE>` with `_UNSPECIFIED = 0` ✓ (every enum
  in the repo)
- Request/response naming: `<Verb><Subject>Request` / `Response` ✓
  (consistent across all live services)

The deduction is for type-name collisions (`Room`, `Entity`,
`EntitySize`, `ValidationResult` exist in 2+ places) which
are technically fine in protobuf (different packages) but trip up
generated TypeScript imports and code review.

### Breaking-change discipline — A-

- The repo uses `breaking: use: [FILE]` (per-file breaking detection).
- CI runs `buf breaking` against `main` on PRs as a **blocking** step
  (since issue #139 / 2026-05-03). Intentional breaking changes apply the
  `breaking-change-approved` label to skip the check; the workflow emits
  a CI annotation noting the override.
- The work in PR #136 demonstrates the team knows how to retire fields
  correctly (`reserved` both number and name). The discipline now lives in
  CI as well as in practice.
- Held back from A by the dual-shape live coexistence (`EncounterStateData`
  + legacy fields per Rule 1) — discipline is enforced at the wire level
  but not yet at the "no two parallel shapes once a migration completes"
  level.

### Deprecation path — C+

Mixed signals:
- Field-level deprecation uses `[deprecated = true]` correctly
  (`TurnState.movement_used`, `Proficiencies.armor`,
  `DamageComponent.source`).
- RPC-level deprecation uses `option deprecated = true` correctly
  (`Attack`, `MoveCharacter`, `DungeonStart`).
- Enum-value deprecation has no examples — `EQUIPMENT_SLOT_GLOVES` is
  rejected at runtime but the enum value lives on.
- No documented timeline for removing deprecated fields. Once marked,
  they tend to stay (e.g. `TurnState.movement_used` since the
  action-economy redesign in PR #128, January).

### Message reuse — B-

- Good: `api.v1alpha1.Position` and `api.v1alpha1.Wall` are reused by
  the dnd5e encounter `Room`. The cross-package import is correct and
  saves duplication.
- Mixed: `RoomLayout` (added in #136) vs `Room` (encounter) vs
  `api.v1alpha1.Room` (generic). Three rooms, two are identical in
  spirit, one is an aspirational generic.
- Bad: sandbox redefines `EntitySize`, `Wall`-equivalent
  (`WallSegment`), and `Door` rather than reusing `api/v1alpha1`.

## Grade legend

- **A** — strong design, clear naming, careful deprecation, real consumers
- **B** — works reliably; some known gaps or polish missing
- **C** — defined but unused, OR has real consistency issues
- **D** — schema noise: defined, not used, duplicates other parts of the
  repo

## How this doc is meant to work

This is a **graded scorecard the janitor updates over time.** The grades
are a first draft from 2026-05-02. The intended evolution:

1. Today: human-curated grades from read-through and consumer grep.
2. Next: every PR that touches a service updates the relevant grade and
   leaves a one-line reason.
3. Later: a CI step that diffs proto messages against actual usage in
   rpg-api / rpg-dnd5e-web flags any field added in proto and not yet
   consumed (for "schema noise" prevention) and any field removed in
   proto but still consumed (for "drift" prevention).

When you update a grade, leave a reason. Don't just move a letter.
