---
name: rpg-api-protos architecture overview
description: Contract layer rules, repo layout, generation pipeline, and current rule violations
updated: 2026-05-04
confidence: high — verified by reading every .proto file, buf.yaml, .github/workflows/ci.yml, and grepping consumer references in rpg-api / rpg-dnd5e-web
---

# rpg-api-protos architecture overview

rpg-api-protos is the contract layer between `rpg-api` (Go gRPC server) and
`rpg-dnd5e-web` (TypeScript Connect-ES client). It is buf-managed: `.proto`
files are the source of truth, `buf generate` produces Go and TypeScript SDKs
on every merge to main, and a force-pushed `generated` branch + autoincremented
git tag publishes them to Go modules and npm.

This repo never runs at runtime. Its only output is the shape of the wire and
the consequences of changing that shape.

## Repo layout

```
rpg-api-protos/
  api/v1alpha1/
    dice.proto                  # DiceService — live, consumed by rpg-api
    room_common.proto           # generic Position, Wall, Door, Room, Entity
    room_environments.proto     # EnvironmentService — defined, not consumed
    room_spatial.proto          # SpatialService — defined, not consumed
    room_spawn.proto            # SpawnService — defined, not consumed
    room_selectables.proto      # SelectionTableService — defined, not consumed
  dnd5e/api/v1alpha1/
    character.proto             # CharacterService — live
    encounter.proto             # EncounterService — live
    common.proto                # AbilityScores, Modifier, Resource, Condition, ValidationResult, SourceRef
    enums.proto                 # Race, Class, Skill, Spell, etc.
    choices.proto               # Choice, ChoiceSubmission, ChoiceData
    equipment_types.proto       # Equipment, WeaponData, ArmorData, GearData
  sandbox/api/v1alpha1/
    sandbox_common.proto        # GenerativeRoomConfig, RoomShape, etc. — defined, not consumed
    sandbox_room.proto          # SandboxRoomService — defined, not consumed
  buf.yaml                      # lint: DEFAULT minus 2 exceptions; breaking: FILE
  buf.gen.yaml                  # Go + TS generation
  .github/workflows/ci.yml      # lint, format, breaking, generate, publish
```

Total `.proto` content: ~9,400 lines. Of those, ~5,000 lines are defined but
not consumed by any live client. See [status.md](../status.md) for the
breakdown.

## Generation pipeline

```
PR opened
    │
    ▼
buf lint            (blocking)
buf format --diff   (blocking)
buf breaking        (blocking; PR may carry `breaking-change-approved` label to skip)
    │
    ▼
PR merged to main
    │
    ▼
buf generate     → gen/go (protoc-gen-go + grpc-go)
                  → gen/ts (bufbuild/es target=ts, Connect)
make mocks       → mockgen-generated mocks for all gRPC clients
    │
    ▼
git checkout -B generated  (force-push)
git tag vX.Y.Z+1           (auto-increment last tag)
    │
    ▼
GitHub release  + npm publish (@kirkdiggler/rpg-api-protos)
                + Go modules consumption via @generated branch
```

Verified by reading `.github/workflows/ci.yml` lines 13-79 and 81-170. The
`generated` branch is force-pushed every merge with a fresh tag — checking
out `generated` for proto edits will lose work.

## The contract rules

These are the rules this repo's docs and PRs enforce. Each rule names a
current violation where one exists. Rules without listed violations are
followed today.

### Rule 1: One source of truth for shape

After a migration completes, the proto carries one shape, not two. Coexistence
is migration debt, not design.

**Violation: `EncounterService.GetEncounterStateResponse` carries two state
shapes.** Post-PR #135/#136 (2026-04-03), `GetEncounterStateResponse`
(`dnd5e/api/v1alpha1/encounter.proto:353`) populates **both** the legacy
fragmented fields and the new unified `EncounterStateData`:

```
// encounter.proto:353-382
message GetEncounterStateResponse {
  // ... metadata, lobby state ...
  CombatState combat_state = 6;             // legacy
  Room room = 7;                            // legacy
  repeated MonsterCombatState monsters = 8; // legacy
  repeated DoorInfo doors = 10;             // legacy
  repeated CharacterCombatState characters = 12;  // legacy
  // Unified encounter snapshot (replaces fragmented state above)
  EncounterStateData encounter_state_data = 20;
}
```

`CharacterCombatState` (line 314), `MonsterCombatState` (line 343), and
`EntityPlacement` (line 18) are all still defined and still populated by
rpg-api's orchestrator. Tracked as **issue #138** (rpg-api-protos board).

### Rule 2: `buf breaking` is authoritative, not advisory

A breaking change in this repo is a runtime break in either consumer. The
schema check exists to prevent that. CI enforces it.

**Enforcement (since issue #139):** `.github/workflows/ci.yml` runs
`buf breaking` as a blocking step on PRs. To intentionally land a breaking
change — typically an alpha-package edit per
[breaking-change-workflow.md](../how-to/breaking-change-workflow.md) — apply
the **`breaking-change-approved`** label to the PR. The label flips the
breaking step into a skipped + warning state and adds a CI annotation noting
the override.

```yaml
- name: Breaking change detection
  if: github.event_name == 'pull_request' &&
      !contains(github.event.pull_request.labels.*.name, 'breaking-change-approved')
  run: buf breaking --against ...
```

The override is intentional: alpha packages permit breaking changes, but
each one requires explicit reviewer acknowledgment via the label, not a
silent merge with a yellow x. Stable (v1+) services should bump the package
version (`v1`→`v2`) instead of using the override.

### Rule 3: Deprecated fields are retired in the same release as their replacement

The transition window is one release. Per the workspace preference: breaking
changes during migration beat permanent dual-shape APIs.

**Violations (in order of severity):**

- **4 deprecated RPCs in `EncounterService`** (encounter.proto:1177, 1188,
  1202, 1211): `DungeonStart`, `GetCombatState`, `MoveCharacter`, `Attack`.
  All but `GetCombatState` still implemented in rpg-api.
- **6 deprecated fields in `TurnState`** (encounter.proto:225-229):
  `movement_used`, `movement_max`, `action_used`, `bonus_action_used`,
  `reaction_available` — superseded by `ActionEconomy` since PR #128 in
  January 2026.
- **2 deprecated fields in `Proficiencies`** (character.proto:306, 309):
  `armor`, `weapons` — superseded by `armor_categories`, `weapon_categories`,
  `specific_weapons`.
- **1 deprecated field in `DamageComponent`** (encounter.proto:512):
  `source` (string) — superseded by `SourceRef source_ref`.
- **1 deprecated path in `ChoiceSubmission`** (choices.proto:178): the
  category-specific `oneof selection` — superseded by `repeated string
  selection_ids = 5`. Both populated today.

Tracked as **issue #140** (consolidated unused-and-deprecated cleanup).

### Rule 4: No proto unused for >1 release

Either implement it or delete it. Schema noise costs review attention,
generation time, and consumer confusion.

**Violations: ~5,000 lines of unused proto.**

| Package | Lines | Status |
|---|---|---|
| `sandbox.api.v1alpha1` (2 files) | 315 | Referenced only by `rpg-api/internal/services/sandboxroom/types.go`, which is an interface stub with no orchestrator/handler/server wiring |
| `api.v1alpha1.EnvironmentService` (`room_environments.proto`) | 530 | No consumer in rpg-api or rpg-dnd5e-web (verified by grep, 2026-05-02) |
| `api.v1alpha1.SpatialService` (`room_spatial.proto`) | 1,064 | No consumer |
| `api.v1alpha1.SpawnService` (`room_spawn.proto`) | 1,424 | No consumer |
| `api.v1alpha1.SelectionTableService` (`room_selectables.proto`) | 1,821 | No consumer; largest unused service |

Plus the 4 deprecated-but-still-implemented RPCs in `EncounterService`
listed under Rule 3. Total: roughly **5,154 lines defined, not consumed**.
Tracked as **issue #140**.

Two dead messages in live services also fall under this rule:
- `UpdateCharacterRequest` / `UpdateCharacterResponse` (character.proto:364,
  374) — declared but no `UpdateCharacter` RPC. Section-based updates
  (`UpdateName`, `UpdateRace`, etc.) replaced this.
- `UpdateDraftRequest` / `UpdateDraftResponse` (character.proto:509, 519) —
  same pattern; no `UpdateDraft` RPC.

### Rule 5: Services have consistent error and pagination shapes

A new service that invents its own error envelope or pagination convention is
a smell. Consistency makes consumer code (especially the TS client) simpler.

**Violations:**

- **Three error patterns coexist** in the live services:
  - Most response messages use `bool success = 1; string error = 2;`
    (e.g. `OpenDoorResponse`, `EquipItemResponse`, `ShortRestResponse`,
    `LongRestResponse`, `AttackResponse`).
  - `MoveCharacterResponse` (encounter.proto:435) uses a typed `MovementError`
    (line 419) with an enum + map. Nothing else uses this pattern.
  - A handful of RPCs return `codes.Unimplemented` via gRPC status — used
    only for `GetCombatState`.
  - There is no shared `Error` message and no standard error envelope.

- **Three pagination patterns coexist:**
  - `ListCharacters`, `ListDrafts`, `ListRaces`, `ListClasses`,
    `ListBackgrounds`, `ListEquipmentByType`, `ListSpellsByLevel` — use
    `int32 page_size`, `string page_token`, `string next_page_token`,
    `int32 total_size` directly on the request/response (Google AIP-158
    style).
  - `GetEncounterHistory` (encounter.proto:386, 397) — uses `int32 limit`,
    `string up_to_event_id`, `bool has_more`, `string last_event_id`.
    Different shape, different field names, different semantics.
  - The unused `api.v1alpha1` services (`EnvironmentService`,
    `SpawnService`, `SelectionTableService`) — use a `PageInfo` message
    (`room_common.proto:223`) with `page_size`, `page_token`,
    `next_page_token`, `total_size`.

The consistent character-side path is the standard. New services should
match it.

### Rule 6: Naming consistency

- Services: `<Domain>Service` ✓ (every service)
- RPCs: PascalCase verbs ✓
- Messages: PascalCase ✓
- Fields: snake_case ✓
- Enums: `<TYPE>_<UPPER_SNAKE>` with `_UNSPECIFIED = 0` ✓ (every enum)
- Request/response: `<Verb><Subject>Request` / `Response` ✓

The deduction is for **type-name collisions across packages.** Four names
are reused in 2+ places with different shapes:

| Name | Locations | Status |
|---|---|---|
| `Room` | `api.v1alpha1.Room` (`room_common.proto:176`); `dnd5e.api.v1alpha1.Room` (`encounter.proto:111`) | Both populated; only the dnd5e one is live |
| `Entity` / `EntityPlacement` / `EntityState` | `api.v1alpha1.Entity` (generic, `room_common.proto:33`); `dnd5e.api.v1alpha1.EntityPlacement` (encounter.proto:18); `dnd5e.api.v1alpha1.EntityState` (encounter.proto:45) | Live: dnd5e versions; generic Entity not consumed |
| `EntitySize` | `dnd5e.api.v1alpha1.EntitySize` (`enums.proto:818`); `sandbox.api.v1alpha1.EntitySize` (`sandbox_common.proto:73`) | Same six values, different fully-qualified names |
| `ValidationResult` | `api.v1alpha1.ValidationResult` (`room_common.proto:216`, generic); `dnd5e.api.v1alpha1.ValidationResult` (`common.proto:122`, three-tier draft system) | Different shapes, identical name |
| `Wall` | `api.v1alpha1.Wall` (`room_common.proto:104`); `sandbox.api.v1alpha1.WallSegment` (different shape) | Live: api.v1alpha1.Wall via encounter Room |

(`DiceRoll` was previously in this list; the unused `dnd5e.api.v1alpha1.DiceRoll` was deleted in issue #141, 2026-05-04.)

Technically valid in protobuf (different packages = different
fully-qualified types). Trips up generated TypeScript imports and code
review. Reconciliation tracked as part of **issue #140**.

## Cross-repo boundaries

**What this repo accepts as input:**
- Proto file edits on feature branches.
- `buf format -w` clean.
- `buf lint` clean.
- `buf breaking` clean against main, OR PR carries
  `breaking-change-approved` label (alpha-only override; v1+ should bump
  package version instead).

**What this repo produces:**
- `gen/go` consumed by `rpg-api` via `go.mod`:
  `github.com/KirkDiggler/rpg-api-protos/gen/go@<version>`.
- `gen/ts` published to npm: `@kirkdiggler/rpg-api-protos`.
- A `generated` branch with the latest tag — sometimes used directly via
  `@generated` for development.

**What changes here ripple to:**
- `rpg-api/internal/handlers/dnd5e/v1alpha1/*` (Go server stubs).
- `rpg-dnd5e-web/src/api/*` (TS Connect-ES clients).
- Any field rename / removal without `reserved` is an immediate runtime
  break in either consumer.

## What this repo never does

- It never runs at runtime. There is no server.
- It never knows what Rage *does* (that's `rpg-toolkit`).
- It never knows how to *orchestrate* state (that's `rpg-api`).
- It never knows how to *render* state (that's `rpg-dnd5e-web`).
- It defines references and shapes; the consumers attach behavior.

## Confidence note

Rule violations are verified by reading the named files at the cited
line numbers and grepping the two consumer repos. The "unused proto"
verifications are negative greps — absence of a consumer reference is
strong evidence but not proof. If an unlisted consumer (e.g. an
unmerged branch, or a consumer outside this workspace) imports one of
these services, the verification is wrong. Speak up if you find one.
