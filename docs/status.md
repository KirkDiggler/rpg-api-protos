---
name: rpg-api-protos status
description: Where we are with the proto contracts — active work, recently landed, paused, known rough edges, per-service confidence
updated: 2026-05-02
confidence: medium — seeded from `git log` since 2025-12, open PRs, and grep across rpg-api / rpg-dnd5e-web; needs Kirk's correction pass
---

# rpg-api-protos: Where We Are

This is a living doc. Edit it in the same PR that invalidates a line. Don't
let it rot.

The contract layer between `rpg-api` (Go) and `rpg-dnd5e-web` (TypeScript via
Connect-ES). When a proto change lands here, it ripples to both consumers; when
shape and consumer drift, it shows up here as a "rough edge."

## Active work

- **PR #136 just merged (2026-04-03)** — unified entity state protos
  (`EntityState`, `CharacterDetails`, `MonsterDetails`, `ObstacleDetails`,
  `EncounterStateData`, `RoomLayout`). Currently no open PRs. Branch
  `feat/unified-entity-state` was the last in-flight change before
  this docs branch.

- **This branch** (`docs/honest-status-snapshot`) — adds `docs/status.md` and
  `docs/quality.md`. Not yet merged.

## Recently landed (last ~6 weeks, highlights)

- **Unified entity state** — PRs
  [#135](https://github.com/KirkDiggler/rpg-api-protos/pull/135) +
  [#136](https://github.com/KirkDiggler/rpg-api-protos/pull/136)
  (2026-03-29 / 2026-04-03). Adds `EntityState` (one shape per entity in an
  encounter) and `EncounterStateData` (full snapshot). Replaces the
  fragmented `CharacterCombatState` / `MonsterCombatState` / `EntityPlacement`
  trio. Most legacy event fields were `reserved`'d on this pass; the legacy
  messages remain in the file (not yet removed).
- **Death save / unconscious / rest contracts** — PR
  [#134](https://github.com/KirkDiggler/rpg-api-protos/pull/134) (2026-03-22).
  Adds `DeathSaveProgress`, `ShortRest`/`LongRest` RPCs, `RestType` enum,
  and `DeathSaveRolledEvent` / `CharacterDiedEvent` /
  `CharacterStabilizedEvent` / `CharacterUnconsciousEvent`.
- **`equipment_detail` on `EquipmentItem`** — PR
  [#133](https://github.com/KirkDiggler/rpg-api-protos/pull/133)
  (2026-03-22). Equipment shape resolved at choice-build time so UI
  doesn't have to look it up.
- **Resource fields on `AvailableAbility`, expanded `CombatAbilityId`** — PR
  [#132](https://github.com/KirkDiggler/rpg-api-protos/pull/132) (2026-03-22).
  Adds `resource_current` / `resource_max` for class-resource UI.
- **`AvailableAbility` / `AvailableAction` messages** — PR
  [#130](https://github.com/KirkDiggler/rpg-api-protos/pull/130) (2026-01-25).
  UI-shape contracts for the action/ability buttons.
- **Two-level action economy protos** — PR
  [#127/#128](https://github.com/KirkDiggler/rpg-api-protos/pull/128)
  (2026-01-08). `ActivateCombatAbility` + `ExecuteAction` RPCs and
  `ActionEconomy` message. The legacy single-shot `Attack` and
  `MoveCharacter` RPCs were marked `option deprecated = true` here and
  in [#117](https://github.com/KirkDiggler/rpg-api-protos/pull/117).
- **Multi-room dungeon shape: `Room.walls`, `room_origin`, doors,
  `dungeon_id` everywhere** — PRs
  [#117](https://github.com/KirkDiggler/rpg-api-protos/pull/117),
  [#120](https://github.com/KirkDiggler/rpg-api-protos/pull/120),
  [#125](https://github.com/KirkDiggler/rpg-api-protos/pull/125),
  [#126](https://github.com/KirkDiggler/rpg-api-protos/pull/126).
  Required for the multi-room rendering work tracked in the project.
- **Entity asset/visual type system** — PR
  [#121](https://github.com/KirkDiggler/rpg-api-protos/pull/121) (2026-01-04).
  `EntityType` enum + `oneof visual_type { MonsterType | ObstacleType }` on
  `EntityPlacement`. Drives asset selection on the web.
- **Multiplayer streaming** — PR
  [#89](https://github.com/KirkDiggler/rpg-api-protos/pull/89) +
  follow-ups [#95](https://github.com/KirkDiggler/rpg-api-protos/pull/95) /
  [#105](https://github.com/KirkDiggler/rpg-api-protos/pull/105). Lobby
  RPCs, `StreamEncounterEvents`, `GetEncounterState`,
  `GetEncounterHistory` (load-then-stream pattern).

## Paused / on hold

- **Sandbox proto package** (`sandbox/api/v1alpha1`) — `SandboxRoomService`
  and `sandbox_common.proto`. Defined and generated, but **no consumer in
  rpg-api or rpg-dnd5e-web** (verified by grep, 2026-05-02). Either an
  experimental harness from earlier room-generation work or genuinely dead
  code. Decide: keep as scaffolding or delete.
- **C++/Unreal generation (P001)** — `buf.gen.yaml` includes
  `protocolbuffers/cpp` + `grpc/cpp` plugins; `Makefile` has
  `package-ue-plugin` / `validate-ue-plugin` targets. No active UE consumer
  in this workspace. Treated as future work; CI does not exercise it.
- **`api/v1alpha1` room services** (`EnvironmentService`,
  `SpatialService`, `SpawnService`, `SelectionTableService`) — fully
  defined, but only `DiceService` from this package is consumed by rpg-api.
  Room generation in the live game flows through the encounter service,
  not these. Status: defined, not wired. See per-service confidence below.

## Known rough edges

### Encounter proto carries two parallel state shapes

Post-PR #135/#136, `GetEncounterStateResponse` carries **both** the legacy
fragmented fields (`CombatState`, `Room`, `[]MonsterCombatState`,
`[]CharacterCombatState`, `[]DoorInfo`) **and** the new unified
`EncounterStateData encounter_state_data = 20`. Events were converted via
`reserved` (old field tags retired, new `EntityState`/`EncounterStateData`
fields added at higher tag numbers). The legacy messages
`CharacterCombatState` and `MonsterCombatState` and the legacy
`EntityPlacement` are still present and still populated by orchestrator
code. Two-shapes-for-one-thing is the biggest rough edge in the repo right
now.

### Deprecated but still implemented RPCs

- `EncounterService.Attack` — `option deprecated = true` in proto, but
  `rpg-api` still implements it (`internal/handlers/dnd5e/v1alpha1/encounter/handler.go:60`)
  and the web still calls "attack" flows in several components. Replacement:
  `ActivateCombatAbility` + `ExecuteAction`.
- `EncounterService.MoveCharacter` — same situation
  (`handler.go:278`). Replacement: `ExecuteAction` with `ACTION_ID_MOVE`.
- `EncounterService.DungeonStart` — `option deprecated = true`. Replacement:
  `CreateEncounter` + `StartCombat`. rpg-api still implements
  (`handler.go:96`).
- `EncounterService.GetCombatState` — proto comment marks it deprecated;
  rpg-api now returns `codes.Unimplemented` (`handler.go:193`). The
  message is still in the proto. Decide whether to remove the RPC or
  formally `option deprecated = true` it.

### Deprecated fields still in scope

- `TurnState.movement_used` / `movement_max` / `action_used` /
  `bonus_action_used` / `reaction_available` — superseded by
  `ActionEconomy`. Marked `[deprecated = true]` (proto field options).
- `TurnState` itself reserves slots 9, 10 for `disengage_active` /
  `dodge_active` (removed in favor of conditions).
- `Proficiencies.armor` / `Proficiencies.weapons` — superseded by
  `armor_categories` / `weapon_categories` / `specific_weapons`. Marked
  `[deprecated = true]`.
- `DamageComponent.source` (string) — superseded by `SourceRef source_ref`.
  Marked `[deprecated = true]`. rpg-api tests still cover the deprecated
  path with `//nolint:staticcheck` annotations
  (`encounter/converters_test.go`).
- `EquipmentSlot.EQUIPMENT_SLOT_GLOVES` — proto enum still has it; rpg-api
  rejects it with `InvalidArgument` ("EQUIPMENT_SLOT_GLOVES is deprecated
  and not supported", `character/converters.go:1309`). The enum value
  remains; consumers must know not to send it.
- `ChoiceSubmission.selection` `oneof` — comment says
  "DEPRECATED: Category-specific selections (maintained for backward
  compatibility)" (`choices.proto:177`). New code should use
  `selection_ids` (repeated string). Both shapes are still populated in
  practice.

### Duplicate / overlapping types across packages

- **Two `Room` messages.** `api.v1alpha1.Room` (in `room_common.proto`)
  is the rich generic version with `RoomStructure`, entities, tags,
  metadata. `dnd5e.api.v1alpha1.Room` (in `encounter.proto`) is the lean
  version actually used in encounters: id, type, w/h, grid, walls,
  entities map, origin. They coexist; consumers always mean the encounter
  one. The generic one is referenced by the unused room services.
- **Two `Entity` shapes.** `api.v1alpha1.Entity` (generic, dnd-agnostic)
  and `dnd5e.api.v1alpha1.EntityPlacement` / `EntityState` (D&D combat).
  Same situation — only the dnd5e versions are live.
- **Two `Wall` shapes.** `api.v1alpha1.Wall` is used by the encounter
  `Room`'s walls field (good — shared). `sandbox.api.v1alpha1.WallSegment`
  is a separate richer wall in the sandbox package.
- **Two `EntitySize` enums.** `dnd5e.api.v1alpha1.EntitySize` and
  `sandbox.api.v1alpha1.EntitySize` — same six values, different fully-
  qualified names. Either consolidate to a shared one in `api/v1alpha1`
  or delete the sandbox copy when the package goes.
- **Two `DiceRoll` messages.** `api.v1alpha1.DiceRoll` (in `dice.proto`,
  rich roll result with rolled dice and dropped values) and
  `dnd5e.api.v1alpha1.DiceRoll` (in `common.proto`, just notation +
  count + size + modifier). Different roles (result vs. notation) but
  same name — confusing.
- **Two `ValidationResult` messages.** `api.v1alpha1.ValidationResult`
  (in `room_common.proto`, generic) and
  `dnd5e.api.v1alpha1.ValidationResult` (in `common.proto`, character
  draft three-tier system). Different shapes, identical name.

### Inconsistent error/result patterns

Most response messages use the
`bool success / string error / ...` pattern (`AttackResponse`,
`OpenDoorResponse`, `EquipItemResponse` (implicit), `ShortRestResponse`,
`LongRestResponse`, `MoveEntityResponse` in sandbox, etc.). A handful use
richer error types (`MoveCharacterResponse` has `MovementError` with an
enum + map). Most have neither — they expose a `string error` and
expect callers to parse. Rare consistent path: gRPC status codes, used
for `Unimplemented` cases.

### Pagination is partial

- `ListCharacters`, `ListDrafts`, `ListEquipmentByType`,
  `ListSpellsByLevel`, `ListRaces`, `ListClasses`, `ListBackgrounds` all
  use `page_size` / `page_token` / `total_size`. Good.
- `GetEncounterHistory` uses `limit` + `up_to_event_id` + `has_more` —
  different shape from the character-side list endpoints.
- `ListSpawnTemplates`, `ListSelectionTables`, `ListRoomTemplates` use a
  `PageInfo` message; not used by anything live.

### Field-tag densification on event messages

After PR #136, several events have a noticeable hop in tag numbers:
`MovementCompletedEvent` reserves 3-6 and uses 1, 2, 10, 11.
`AttackResolvedEvent` uses 1-3, 7, 10, 11. `ActionExecutedEvent` uses
1, 2, 4, 6, 8, 10, 11, 20, with 3/5/7 reserved. Intentional (preserves
wire compatibility), but reading the proto front-to-back is jarring.

### Choice / submission redundancy

`ChoiceSubmission` has both:
- `repeated string selection_ids = 5` (the new, generic path)
- `oneof selection { SkillSelection | EquipmentSelection | ... }` (the
  deprecated category-specific path)

Both are still populated in places. There is no proto-level enforcement
of which is canonical; the comment is the only signal.

### Buf workflow

- `buf lint` clean as of 2026-05-02.
- `buf format --diff --exit-code` clean.
- `buf breaking` runs in CI on PRs with `continue-on-error: true` —
  i.e. breaking detection is **advisory only**, not blocking. Worth
  noting because the proto repo is the contract layer; a missed breaking
  change here is a runtime break in either consumer.
- `buf.gen.yaml` includes `protocolbuffers/cpp` + `grpc/cpp` plugins
  even though no UE consumer exists in this workspace. CI generates the
  C++ output anyway.
- The `generated` branch is force-pushed by CI on every main merge with
  a fresh tag (`v0.1.86` is the latest as of pull). Worth knowing if
  someone tries to checkout `generated` for proto edits.

## Per-service confidence

Your read of where we are. See [quality.md](quality.md) for grade + rationale.

| Service / package | Confidence |
|---|---|
| `dnd5e.EncounterService` | Medium — works in production; carries two state shapes (legacy + unified), four deprecated RPCs, and many `reserved` slots. Highest churn, biggest cleanup debt |
| `dnd5e.CharacterService` | Medium-high — the biggest service by RPC count (~25 RPCs); coherent draft + finalize flow; deprecated proficiency fields still present |
| `api.DiceService` | High — small (3 RPCs), consumed by rpg-api, well-shaped |
| `api.EnvironmentService` | Low — defined, not consumed. Generic room shape duplicates encounter Room |
| `api.SpatialService` | Low — defined, not consumed |
| `api.SpawnService` | Low — defined, not consumed |
| `api.SelectionTableService` | Low — defined, not consumed; largest unused service (1.8k lines) |
| `sandbox.SandboxRoomService` | Low — defined, not consumed; duplicates concepts from `api/v1alpha1` |
| `dnd5e/choices.proto` | Medium — works; submission shape has dual paths (generic `selection_ids` + deprecated `oneof`) that are not enforceable at the schema level |
| `dnd5e/enums.proto` | Medium-high — comprehensive; some enums (`Spell`, `MonsterType`, `FeatureId`, `ConditionId`) grow per-feature with no deprecation discipline yet |
| `dnd5e/equipment_types.proto` | Medium-high — small, focused, clean |
| `dnd5e/common.proto` | Medium — solid building blocks; `DiceRoll` name collides with `api.DiceService.DiceRoll`; `ValidationResult` name collides with `api.ValidationResult` |
| `api/room_common.proto` | Medium-low — generic shapes that aren't used by live consumers; risk of being kept "for the future" indefinitely |

## Upcoming work (not yet planned in detail)

- **Decide the fate of `sandbox/` and the unused `api.v1alpha1` room
  services.** Either wire them up or delete them. Right now they are
  schema noise.
- **Drop legacy combat state messages** once unified `EntityState` /
  `EncounterStateData` are fully adopted by the orchestrator. Today both
  shapes coexist in `GetEncounterStateResponse`.
- **Remove deprecated RPCs** (`Attack`, `MoveCharacter`, `DungeonStart`,
  `GetCombatState`) from the service after consumers migrate.
- **Make `buf breaking` blocking** in CI (currently `continue-on-error:
  true`). The contract layer should not be advisory about breakage.
- **Reconcile duplicate names** (`Room`, `Entity`, `EntitySize`,
  `DiceRoll`, `ValidationResult`). Either consolidate or rename to
  remove ambiguity.

## Related references

- [README.md](../README.md) — package overview, usage examples
- [CLAUDE.md](../CLAUDE.md) — proto workflow, branch rules,
  `buf format -w` requirement
- [architecture/overview.md](architecture/overview.md) — contract
  rules (Rules 1-6) with current violations cited at file:line
- [architecture/data-model.md](architecture/data-model.md) — common
  message types, error and pagination patterns
- [architecture/components/](architecture/components/) — one doc
  per service (Encounter, Character, Dice, plus the unused
  Environment/Spatial/Spawn/SelectionTable/SandboxRoom)
- [how-to/](how-to/) — running buf checks locally, regenerating
  SDKs, breaking-change workflow, consumer integration, adding a
  new service
- [archive/](archive/) — older docs (usage-go.md, usage-typescript.md,
  ADRs, plans, P001 UE plugin design) preserved for context
