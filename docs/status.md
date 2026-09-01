---
name: rpg-api-protos status
description: Where we are with the proto contracts — active work, recently landed, paused, known rough edges, per-service confidence
updated: 2026-09-01
confidence: medium — seeded from `git log` since 2025-12, open PRs, and grep across rpg-api / rpg-dnd5e-web; needs Kirk's correction pass
---

# rpg-api-protos: Where We Are

This is a living doc. Edit it in the same PR that invalidates a line. Don't
let it rot.

The contract layer between `rpg-api` (Go) and `rpg-dnd5e-web` (TypeScript via
Connect-ES). When a proto change lands here, it ripples to both consumers; when
shape and consumer drift, it shows up here as a "rough edge."

## Active work

- **Shared dice presentation contract (rpg-api-protos#256,
  rpg-project#289 / #303, 2026-08-27)** — additive new subpackage
  `dnd5e/api/session/presentation/v1alpha1`, provider-first before the
  `rpg-api` relay (`rpg-api#852`) and `rpg-dnd5e-web` playback
  (`rpg-dnd5e-web#837`). Two RPCs only: `PublishDiceThrow` validates one
  client-generated `DiceThrowDraft` and answers with the published
  `DiceThrowPlan`; `StreamDiceThrows` fans that same plan out live to roller
  and witnesses. The plan is group-shaped from day one — bodies, sparse
  contact checkpoints, per-body `SETTLED`/`OFF_TABLE` terminals — so later
  damage handfuls add enum values and more repeated entries rather than a
  second service. Explicitly presentation-only: live/no-replay intended host in
  rpg-api (Redis-backed fanout), server-bound `roller`, and no hit/miss,
  damage, HP, target legality, or Story authority on the wire. Evidence here is
  buf/generation only; runtime confidence waits on the consumer legs.

- **Session production combat experience (rpg-api-protos#252,
  rpg-project#270, 2026-08-25)** — contract-first, before toolkit/API/web.
  `Declaration` is intentionally reshaped in place from flat per-target rows to
  one compiled action/cost variant. The migration explicitly renames
  `affordable = 3` to `available = 3`: tag/type stay fixed, while generated
  source names and the default JSON name change. Removed `shortfall = 4` and
  `target = 6` are reserved by tag/name; the PR requires
  `breaking-change-approved`. A compiled Attack includes every current
  live-sight member except the actor exactly once; missing live position fails
  Afford, candidate `why` is present iff unavailable, TARGET_OUT_OF_REACH is
  candidate-level, and NO_TARGET_IN_REACH disables the declaration without
  deleting rows. Every compiled Attack/turn Move/End Turn has a non-empty ID;
  every early per-verb blocker remains a row (including an uncompileable
  Attack) with `available=false`, `why`, empty ID, absent attack, empty
  candidates, and fixed target kind. `remaining` is Move-only. DOWNED blocks
  Attack/Move only; End Turn uses solely clock/turn. The selected
  `Declaration.attack`, `AttackResponse.attack`, and Struck/Missed attack must
  match as one full `core.Ref.String()` `AttackRef`. Selector clock rules remain
  fail-closed. `CharacterData` fields 9–14 add level, HP, speed, features,
  conditions, and non-magical resources only for the authenticated owner;
  foreign `Entity.character` projections withhold them, so peers receive no
  exact private sheet data. Temporary HP stays zero until toolkit ownership and
  `SpellSlots` / legacy `ClassResources` are excluded. No `CharacterHud`, magic
  fields, or future target kinds are introduced. Proto/docs only; no
  generated-mechanics tests.

- **Dungeon Builder restart: authoring REPLACED, regions on the atlas
  (rpg-api-protos feat/256-dungeon-authoring-v2, rpg-project PR #255 /
  issue #256, 2026-08-23)** — one PR, two halves. `dnd5e/api/session/v1alpha1`
  is additive: `AtlasRegion` + `Lighting` in `types.proto` and
  `GetAtlasResponse.regions = 9` (every floor cell in exactly one region;
  regions replace rooms; lighting is a world fact). `dnd5e/api/authoring/v1alpha1`
  is **rewritten, breaking by design** and carried on the
  `breaking-change-approved` label: the `FloorPlan` dialect (rooms, `door_row`,
  `start_column`, an archetype that chose the spawn) is gone — not reserved,
  deleted — because its only server went with the old encounter module in
  rpg-api#801 and there is no wire left to keep safe. `PutDungeon` now
  answers with `session.GetAtlasResponse` itself (the builder has no second
  geometry), `errors` is a list of `FieldError{path, message}`, and
  `GetDungeon` returns the stored file verbatim. Deleted with the dialect:
  `authoring/v1alpha1/testdata/`, and — by Kirk's ruling on this PR (*"we do
  not need tests in the protos. we have them mechanically compiled"*) —
  every hand-written presence suite this repo had: `tests/regions`,
  `tests/placement-facing`, `tests/declaration-remaining`, their fixtures,
  Makefile targets and CI steps. `tests/` is gone. Evidence for a proto
  change is `buf lint`, `buf format`, `buf breaking` and generation
  compiling, nothing else. See
  [architecture/components/authoring-service.md](architecture/components/authoring-service.md).
  Proto-only — rpg-toolkit (T1–T3), rpg-api (A) and rpg-dnd5e-web (W) are
  the parallel legs (`rpg-project/ideas/dungeon-builder/plan.md`).

- **Character v1alpha2: `GetCharacterData` (rpg-api-protos
  feat/character-get-data, rpg-project#249 §2, 2026-08-22)** — additive,
  `buf breaking` green when introduced. The owner-private read from which
  character surfaces, including the equipment screen (rpg-dnd5e-web#571), load
  their state on the session stack:
  `CharacterService` had only
  `EquipItem`/`UnequipItem` (protos#187) because the old route seeded from the
  encounter snapshot, which the session stack does not carry. Returns the same
  `CharacterData` the equip writes return; host binds to the owner.

- **Session contract: the combat turn (rpg-api-protos
  feat/session-combat-turn, rpg-project#249, 2026-08-22)** — additive, `buf
  breaking` green against v0.1.131, no hand-written tests (generation is the
  evidence). The whole of design §3 in one PR, merged AHEAD of its SDK by
  Kirk's ruling so toolkit/api/web build in parallel: `Standing`,
  `Participant` + `TurnResponse.participants`, `Seen.standing`,
  `Sighting.name` (rpg-toolkit#1137); `DamageType`, `AttackRef` +
  `AttackResponse.attack` (rpg-toolkit#866); `ShortfallReason`, `Currency`,
  `Shortfall` + the original declaration refusal shape (rpg-toolkit#1010), now
  superseded by #252's nested declaration/candidate contract; Attack's refusals
  documented, empty hand → `dnd5e:weapons:unarmed-strike`
  (rpg-toolkit#1168); `oneof Event.body` with seven typed bodies, `payload` kept
  for untyped kinds
  (rpg-toolkit#941). See
  [architecture/components/session-service.md](architecture/components/session-service.md)
  "The combat turn".

- **Session contract: Move on the turn clock (rpg-api-protos
  feat/session-move-clock, rpg-toolkit#1169, 2026-08-22)** — additive, `buf
  breaking` green. `VERB_MOVE = 2`, `optional int32 Declaration.remaining = 5`
  (feet; present for Move, absent for Attack), and the `Move` RPC's two new
  refusal cases documented (`ErrNotYourTurn`; `ErrCannotAfford` naming
  movement) in place of the retired blanket fight-lock. (Its presence suite
  `tests/declaration-remaining` was removed 2026-08-23 with the rest —
  see the restart entry above.)

- **Session contract: `Afford` at `session/v0.21.3` (rpg-api-protos
  feat/session-afford, 2026-08-22)** — additive, `buf breaking` green. Adds
  `rpc Afford(AffordRequest) returns (AffordResponse)` beside `Turn`, plus
  the initial `Declaration` and `Verb` / `Slot` enums. The initial flat fields
  are superseded by #252's compiled-offer shape. Closes the "economy spends but
  nothing reports a budget" gap
  (rpg-toolkit#1138) the way ADR-0042 rules: declarations, not remaining
  currencies. 15 RPCs.

- **Session contract: `Seen` on `Sighting`/`Report` at `session/v0.21.2`
  (rpg-api-protos feat/session-seen, ADR-0041, rpg-toolkit#1157/#1158/#1159,
  2026-08-22)** — purely additive, `buf breaking` green, no label. Adds
  `message Seen { Position position = 1; }` plus `Sighting.seen = 7` and
  `Report.seen = 3`: the sight channel's position now travels typed instead of
  inside opaque `payload`. On `Report`, `seen` is inferred by decoding the
  payload rather than gated on channel — `intel.Report` carries no channel of
  its own (rpg-toolkit#1160 tracks closing that gap). See
  [architecture/components/session-service.md](architecture/components/session-service.md).

- **Session contract: `GetWhere` at `session/v0.13.0` (rpg-api-protos#228,
  issue #227, 2026-08-16)** — purely additive, `buf breaking` green, no label.
  Adds `rpc GetWhere(GetWhereRequest) returns (GetWhereResponse)` mirroring the
  SDK's `Where` verb: the caller's own cell in dungeon-absolute space.
  **This closes design rule 11 on the wire** — a cold client can learn its own
  position from a read, so reconnect is `GetWhere` + `GetAtlas` + `GetStory`
  rather than story replay carrying position. Deliberately singular: there is
  no roster-of-positions read, because one would leak the cells of members a
  client has never perceived. The v0.12.0 -> v0.13.0 surface diff was verified
  in full and is additive-only — two new types, zero field changes on existing
  ones, sentinels unchanged at 35, all enums unchanged. 14 RPCs.

- **Session contract re-transcribed against `session/v0.12.0`
  (rpg-api-protos#226, issue #225, W1 of the API session integration,
  2026-08-16)** — the
  one-map contract. #222 landed `dnd5e/api/session/v1alpha1/` against
  `session/v0.9.0`; #226 re-transcribes it in place against `session/v0.12.0`
  after Kirk's ruling (*"we should be going off the latest session version.
  traverse is dead... let's get the contract we want not one that matches"*).
  **Breaking by design**, carried on the `breaking-change-approved` label: the
  `Traverse` RPC and its messages are gone (a walk crosses a doorway —
  toolkit#1048/#1049), `AtlasRoom` is gone (the Atlas is one map — v0.10.0), and
  `Member`/`MemberOutcome`/`JoinRequest` are roomless, trading room IDs for
  absolute cells (v0.11.0). Every position on the seam is now dungeon-absolute.
  13 RPCs. Verified field-for-field against the **tag**, not a checkout tree —
  37 message-struct pairs, zero mismatches. See
  [architecture/components/session-service.md](architecture/components/session-service.md).
  Proto-only — `rpg-api` (W2, in flight against the v0.9.0 shapes, absorbs this
  reshape) and `rpg-dnd5e-web` (W3) are the next legs (design:
  `rpg-project/ideas/session-api/design.md`, umbrella `rpg-project#227`).
  **This surface is what eventually replaces the
  `dnd5e.api.v1alpha2.encounter` package**, which is deleted in place at
  cutover; until then the two stacks coexist with server config selecting
  exactly one.

- **Dungeon Builder: authoring contract (rpg-api-protos#200, S0 of the
  Dungeon Builder arc, 2026-07-30) — SUPERSEDED 2026-08-23, see the
  restart entry above** — was additive-only, one PR: `dungeon_key`
  field on `StartEncounterRequest` (`dnd5e/api/lobby/v1alpha1/service.proto`);
  `ListDungeons` RPC + `DungeonSummary`/`ListDungeonsResponse` on
  `LobbyService`, deliberately ungated (reads content, mutates nothing —
  the lobby dropdown needs it with authoring off); new `AuthoringService`
  in its own subpackage `dnd5e/api/authoring/v1alpha1` with `PutDungeon`
  (key/yaml/`validate_only`) returning a server-computed `FloorPlan` plus
  best-effort `field_errors`. See
  [architecture/components/authoring-service.md](architecture/components/authoring-service.md).
  Proto-only — `rpg-api` (S1: `PutDungeon` orchestrator + shared registry;
  S2: `dungeon_key` plumbing) and `rpg-dnd5e-web` (S3: lobby dropdown;
  S4a-c: `/author` route) are both queued as the next legs of the same arc
  (design: `rpg-project#170`, plan: `rpg-project/ideas/dungeon-builder/plan.md`).

- **Typed content vocabulary, increment 1 (rpg-api-protos#190, PR #191,
  2026-07-20) + equipment on the wire (rpg-api-protos#187, PR #188,
  2026-07-21)** — #190 adds `tools/refgen` (a codegen tool, own `go.mod`,
  generates a proto enum 1-to-1 from a toolkit registry) plus the first two
  generated enums, `dnd5e.api.v1alpha2.weapons.Weapon` (38 values) and
  `dnd5e.api.v1alpha2.armor.Armor` (13 values) — see
  [how-to/regenerate-content-enums.md](how-to/regenerate-content-enums.md)
  for the number-stability contract, which shipped a real bug (caught in
  review, fixed before merge) worth reading before touching either enum.
  #190's enums are proto-only, deliberately not wired into `Item` yet —
  `Item.ref` is still a plain untyped `Ref` today. #188 adds
  `dnd5e/api/v1alpha2/character/service.proto`
  (`CharacterService.EquipItem`/`UnequipItem`, character-scoped,
  out-of-encounter) and five equipment fields on `CharacterData` — see
  [architecture/components/equipment-v1alpha2.md](architecture/components/equipment-v1alpha2.md).
  **#188 is live**: rpg-api serves it as of rpg-api#682 (merged 2026-07-21,
  closing rpg-api#680) — real toolkit-computed AC, shared composition
  between the encounter snapshot and the character-service response.
  rpg-dnd5e-web has not adopted it yet (still on v1alpha1 equip/unequip;
  pin predates the merge). Verify consumer state like this at `origin/main`
  after a fetch, never a local clone — this doc's first pass got the
  rpg-api half backwards by checking a stale one. Deliberately deferred by
  #188: relocating the `encounter`-owned `Ref` primitive into a shared
  package (rpg-api-protos#189, open decision, blocked on a coordinated
  api+web cut since the web imports `RefSchema` from `encounter` directly
  today).

- **LobbyService v1alpha1 (rpg-api-protos#176, 2026-07-06)** — new
  `dnd5e/api/lobby/v1alpha1/` service: `CreateLobby`, `JoinLobby`, `SetReady`,
  `LeaveLobby`, `StartEncounter`, `StreamLobby`. Party-assembly slice 1 of the
  game-screen rebuild (`rpg-project#81`; design at
  `rpg-project/ideas/game-screen-rebuild/lobby-surface.md`). Also removes
  `EncounterService.CreateEncounter` (`dnd5e/api/v1alpha2/encounter/`) —
  subsumed by `LobbyService.StartEncounter` — carried via the
  `breaking-change-approved` label. Proto-only so far; no `rpg-api` handler
  or `rpg-dnd5e-web` client yet (next legs of the same umbrella issue).

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
- `buf breaking` runs in CI on PRs as a **blocking** step. To intentionally
  land a breaking change, apply the `breaking-change-approved` label to the
  PR; the workflow then skips the breaking check and emits a CI annotation
  noting the override. See
  [breaking-change-workflow.md](how-to/breaking-change-workflow.md).
- The serialized main-branch release job fetches and verifies `origin/main`
  under the release lock immediately before planning, but still scans release
  history for a stale source: a complete pair permits only root GitHub release
  repair, no pair coalesces, and a partial pair fails. It re-fetches main
  immediately before publication, blocking all ref and external publication if
  the source became stale after planning. A new release is validated locally,
  then atomically force-updates `generated` and creates root `vX.Y.Z` plus
  nested-module `gen/go/vX.Y.Z` tags on the same generated commit. Release
  recovery adds generated notes only on create. npm publication is
  unsupported pending rpg-api-protos#263. Root tags through `v0.1.147` predate
  the nested-module tag fix and require exact generated-commit pseudo-versions
  for Go. Worth knowing if someone tries to checkout `generated` for proto
  edits.

## Per-service confidence

Your read of where we are. See [quality.md](quality.md) for grade + rationale.

| Service / package | Confidence |
|---|---|
| `dnd5e.EncounterService` | Medium — works in production; carries two state shapes (legacy + unified), four deprecated RPCs, and many `reserved` slots. Highest churn, biggest cleanup debt |
| `dnd5e.CharacterService` | Medium-high — the biggest service by RPC count (~25 RPCs); coherent draft + finalize flow; deprecated proficiency fields still present |
| `api.DiceService` | High — small (3 RPCs), consumed by rpg-api, well-shaped |
| `dnd5e.authoring.AuthoringService` | High (contract) / no consumer yet — REPLACED 2026-08-23 (rpg-project#256): 2 RPCs, answers with the session atlas itself; the 2026-07-30 `FloorPlan` contract is gone with its server (rpg-api#801). Consumers (rpg-api A, rpg-dnd5e-web W) are queued in the same plan, distinct from the Low-rated services below which have none in flight |
| `dnd5e.session.SessionService` | High (contract) / no consumer yet — new (rpg-api-protos#222, re-transcribed against session/v0.12.0 in #226, `GetWhere` added at v0.13.0 in #228, 2026-08-16). Confidence is unusually cheap here: the shapes were not designed, they were transcribed from a shipped SDK and machine-checked against it, so "is this the right shape?" reduces to a question the toolkit already answered. What is genuinely unverified is the same thing every pre-consumer service has — that it survives contact with an orchestrator (rpg-api W2, queued) |
| `dnd5e.session.presentation.SessionPresentationService` | High (contract) / no consumer yet — new (rpg-api-protos#256, 2026-08-27). Presentation-only live-session dice throw plans: `PublishDiceThrow` + `StreamDiceThrows`, group-shaped bodies/contacts/terminals, server-bound `roller`, intended live/no-replay Redis-backed host in rpg-api. Both consumer issues are already assigned (`rpg-api#852`, `rpg-dnd5e-web#837`), so this is consumer-pending rather than speculative unused proto |
| `api.EnvironmentService` | Low — defined, not consumed. Generic room shape duplicates encounter Room |
| `api.SpatialService` | Low — defined, not consumed |
| `api.SpawnService` | Low — defined, not consumed |
| `api.SelectionTableService` | Low — defined, not consumed; largest unused service (1.8k lines) |
| `sandbox.SandboxRoomService` | Low — defined, not consumed; duplicates concepts from `api/v1alpha1` |
| `dnd5e/choices.proto` | Medium — works; submission shape has dual paths (generic `selection_ids` + deprecated `oneof`) that are not enforceable at the schema level |
| `dnd5e/enums.proto` | Medium-high — comprehensive; some enums (`Spell`, `MonsterType`, `FeatureId`, `ConditionId`) grow per-feature with no deprecation discipline yet |
| `dnd5e/equipment_types.proto` | Medium-high — small, focused, clean |
| `dnd5e/common.proto` | Medium — solid building blocks; `ValidationResult` name collides with `api.ValidationResult` |
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
- **Reconcile duplicate names** (`Room`, `Entity`, `EntitySize`,
  `ValidationResult`). Either consolidate or rename to remove
  ambiguity. (`DiceRoll` collision resolved 2026-05-04 — issue #141.)

## Related references

- [README.md](../README.md) — package overview, usage examples
- [CLAUDE.md](../CLAUDE.md) — proto workflow, branch rules,
  `buf format -w` requirement
- [architecture/overview.md](architecture/overview.md) — contract
  rules (Rules 1-6) with current violations cited at file:line
- [architecture/data-model.md](architecture/data-model.md) — common
  message types, error and pagination patterns
- [architecture/components/](architecture/components/) — one doc
  per service (Encounter, Character, Dice, the v1alpha2 equipment
  slice, plus the unused
  Environment/Spatial/Spawn/SelectionTable/SandboxRoom)
- [how-to/](how-to/) — running buf checks locally, regenerating
  SDKs, regenerating content enums, breaking-change workflow,
  consumer integration, adding a new service
- [archive/](archive/) — older docs (usage-go.md, usage-typescript.md,
  ADRs, plans, P001 UE plugin design) preserved for context
