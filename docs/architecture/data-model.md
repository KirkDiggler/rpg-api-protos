---
name: rpg-api-protos data model
description: Common message types, envelopes, error and pagination patterns, and known shape collisions
updated: 2026-05-04
confidence: high — verified by reading every .proto and grepping field reuse across files
---

# rpg-api-protos data model

This doc covers the *shapes* used across services: common message types,
the (inconsistent) error and pagination envelopes, type collisions that
trip up generated code, and the cross-package imports that hold the
contract together.

For per-service request/response details, see
[components/](components/) — one doc per service.

## Common building blocks

### Identity and references

The contract is reference-based. Clients send opaque IDs (character ID,
encounter ID, dungeon ID, connection ID, weapon ID), never calculations.
The server resolves IDs to behavior via `rpg-toolkit`.

There is no shared `Reference` message — IDs are bare `string` fields.
This is intentional and matches the workspace pattern: refs like
`dnd5e:features:rage` are strings the toolkit interprets.

### Position (`api/v1alpha1/room_common.proto:9`)

```proto
message Position {
  double x = 1;
  double y = 2;
  double z = 3;  // Optional for future 3D support
}
```

Used by every service that needs spatial coordinates. The encounter
service imports this from `api.v1alpha1` rather than redefining it —
this is the canonical cross-package reuse pattern.

**Upcoming breaking change.** Per the design at
`rpg-project/ideas/coordinate-types/design.md`, `Position` will move
from `double` to `int32` to match the cube-coordinate invariant
(`X + Y + Z = 0`) used by the dungeon generator. The current `double`
signature is the root cause of the int↔float64 cast pattern that
caused 5 coordinate bugs in Round 2 (see PRs #459, #461, #463, #466,
#467 in rpg-api). This is a breaking change at the wire level for any
consumer that round-trips Position to a non-integer value, but in
practice rpg-dnd5e-web only renders these coordinates and rpg-api only
casts to/from integer cube positions internally. The migration plan is
in the linked design doc — proto change blocks on the rpg-api types
landing first.

### GridType (`api/v1alpha1/room_common.proto:16`)

```proto
enum GridType {
  GRID_TYPE_UNSPECIFIED = 0;
  GRID_TYPE_SQUARE = 1;        // Chebyshev distance
  GRID_TYPE_HEX_POINTY = 2;    // pointy-top hex
  GRID_TYPE_HEX_FLAT = 3;      // flat-top hex
  GRID_TYPE_GRIDLESS = 4;      // Euclidean distance
}
```

Live game uses `GRID_TYPE_HEX_POINTY` exclusively. The other values are
defined for future RPG systems.

### Wall (`api/v1alpha1/room_common.proto:104`)

Used by `dnd5e.api.v1alpha1.Room.walls` (encounter.proto:130). The
encounter service imports `api.v1alpha1.Wall` rather than redefining
it — good reuse.

### Ability scores, modifiers, conditions (`dnd5e/api/v1alpha1/common.proto`)

```proto
message AbilityScores { strength, dexterity, constitution, intelligence, wisdom, charisma; }
message Modifier { target, value, source, type; }
message Resource { name, current, maximum, refresh_on; } // hit dice, spell slots, etc.
message Condition { name, source, duration, notes, ConditionId id, bytes condition_data; }
message ValidationError { field, message, code; }
message ValidationWarning { field, message, type; }
```

For dice, see `api.v1alpha1.DiceRoll` (the result form, in `dice.proto`)
— there is no notation-form message in the dnd5e package.

`Condition.condition_data` (line 106) is `bytes` carrying toolkit-owned
JSON. The pattern: enum identifies the condition; toolkit owns the
behavior payload; client renders the bytes for display. This is the
canonical "client renders, doesn't know rules" shape.

### ValidationResult (`dnd5e/api/v1alpha1/common.proto:122`)

The 3-tier draft validation envelope:

```proto
enum Severity { ERROR; INCOMPLETE; WARNING; }
message Issue { Severity severity; ValidationSource source; ValidationField field; ... }
message ValidationResult {
  bool is_valid = 1;
  repeated Issue issues = 2;
  int32 error_count, incomplete_count, warning_count;
}
```

Used by `CharacterDraft.validation` and `ValidateDraftResponse`. This is
the only consistent rich-error pattern in the repo. It is dnd5e-specific
because `ValidationSource` and `ValidationField` are dnd5e-specific
enums (race, class, background, ability scores, ...).

The generic `api.v1alpha1.ValidationResult` (`room_common.proto:216`) is
a different shape, in a different package, with the same name. Type
collision — see [overview.md Rule 6](overview.md#rule-6-naming-consistency).

### SourceRef (`dnd5e/api/v1alpha1/common.proto:189`)

```proto
message SourceRef {
  oneof source {
    Weapon weapon = 1;
    Ability ability = 2;
    ConditionId condition = 3;
    FeatureId feature = 4;
    Spell spell = 5;
    MonsterTraitId monster_trait = 6;
  }
}
```

The damage-source discriminator. Replaces the deprecated
`DamageComponent.source string` field. Source granularity varies — the
`ability` arm is a generic enum (STR/DEX), the others identify specific
weapons / spells / features by enum.

## Error patterns (inconsistent)

Three patterns coexist:

### Pattern A: `bool success + string error`

Used by most encounter and character RPCs:
- `OpenDoorResponse` (encounter.proto:190)
- `EquipItemResponse` (character.proto:1189; implicit via Character return)
- `ShortRestResponse` (encounter.proto:1127)
- `LongRestResponse` (encounter.proto:1139)
- `AttackResponse` (encounter.proto:560)
- `ActivateCombatAbilityResponse` (encounter.proto:585)
- `ExecuteActionResponse` (encounter.proto:640)

This is the dominant pattern. Treat it as the de facto standard. The
caller parses the `error` string for display.

### Pattern B: typed error message

Only `MoveCharacterResponse` (encounter.proto:435) does this:

```proto
message MovementError {
  enum ErrorCode { INVALID_POSITION, INSUFFICIENT_MOVEMENT, PATH_BLOCKED, ... }
  ErrorCode code; string message; map<string,string> details;
}
message MoveCharacterResponse {
  bool success = 1;
  MovementError error = 2;       // ← only typed error in the repo
  ...
}
```

`MoveCharacter` is itself deprecated (`option deprecated = true`,
encounter.proto:1202). The richer error pattern was a one-off
experiment that didn't propagate.

### Pattern C: gRPC status codes

`GetCombatState` returns `codes.Unimplemented` via gRPC status. No proto
field carries the error. This is correct for "this RPC is gone" but
unused for application-level errors elsewhere.

**Recommendation:** new RPCs should match Pattern A unless there's a
strong reason to design a typed error. There is no shared `Error` /
`Status` envelope to standardize on; designing one is its own decision.

## Pagination patterns (inconsistent)

Three patterns coexist:

### Pattern A: AIP-158 inline (preferred)

Request:
```proto
int32 page_size = N;
string page_token = N+1;
```
Response:
```proto
repeated <T> items = 1;
string next_page_token = 2;
int32 total_size = 3;
```

Used consistently by the live character-side list endpoints:
- `ListCharacters` (character.proto:337, 352)
- `ListDrafts` (character.proto:606, 614)
- `ListRaces`, `ListClasses`, `ListBackgrounds`, `ListEquipmentByType`,
  `ListSpellsByLevel`

This is the standard. New list RPCs should match.

### Pattern B: `GetEncounterHistory` event-style

```proto
message GetEncounterHistoryRequest {
  string encounter_id = 1;
  string up_to_event_id = 2;  // not page_token
  int32 limit = 3;             // not page_size
}
message GetEncounterHistoryResponse {
  repeated EncounterEvent events = 1;
  bool has_more = 2;            // not total_size or next_page_token
  string last_event_id = 3;
}
```

Different field names and semantics from Pattern A. Justified by the
load-then-stream pattern: clients want a watermark (`last_event_id`),
not a page cursor. But the field names diverge unnecessarily —
`page_size` could be `limit` everywhere and align.

### Pattern C: `PageInfo` envelope (unused services)

```proto
// room_common.proto:223
message PageInfo {
  int32 page_size = 1;
  string page_token = 2;
  string next_page_token = 3;
  int32 total_size = 4;
}
```

Used only by the four unused `api.v1alpha1` services
(`EnvironmentService`, `SpawnService`, `SelectionTableService`). If those
services were live, they'd be a third inconsistent pagination pattern.
Since they aren't, this is dead schema.

## Type collisions (cross-package name reuse)

Listed in [overview.md Rule 6](overview.md#rule-6-naming-consistency).
Summary table:

| Name | Live shape | Dead/secondary shape |
|---|---|---|
| `Room` | `dnd5e.api.v1alpha1.Room` (encounter.proto:111) | `api.v1alpha1.Room` (room_common.proto:176) — generic, unused |
| `Entity` | `dnd5e.api.v1alpha1.EntityState` / `EntityPlacement` | `api.v1alpha1.Entity` (room_common.proto:33) — generic, unused |
| `EntitySize` | `dnd5e.api.v1alpha1.EntitySize` (enums.proto:818) | `sandbox.api.v1alpha1.EntitySize` — duplicate, unused |
| `DiceRoll` | `api.v1alpha1.DiceRoll` (dice.proto:49, result) AND `dnd5e.api.v1alpha1.DiceRoll` (common.proto:45, notation) | Both live, different roles, same name |
| `ValidationResult` | `dnd5e.api.v1alpha1.ValidationResult` (common.proto:122, three-tier) | `api.v1alpha1.ValidationResult` (room_common.proto:216, generic, unused) |
| `Wall` | `api.v1alpha1.Wall` (room_common.proto:104) | `sandbox.api.v1alpha1.WallSegment` — different shape, unused |

Most collisions resolve naturally when the unused services / sandbox
package are deleted (issue #140). The `DiceRoll` collision survives —
two live `DiceRoll` messages with different shapes — and should be
renamed (e.g. `DiceRollResult` vs `DiceRollNotation`) when touched.

## Cross-package imports (the canonical reuse path)

```
api/v1alpha1/dice.proto              ← no imports, leaf
api/v1alpha1/room_common.proto       ← no imports, leaf

dnd5e/api/v1alpha1/enums.proto       ← no imports, leaf
dnd5e/api/v1alpha1/common.proto      ← imports enums
dnd5e/api/v1alpha1/equipment_types.proto ← imports enums
dnd5e/api/v1alpha1/choices.proto     ← imports common, enums, equipment_types
dnd5e/api/v1alpha1/character.proto   ← imports choices, common, enums, equipment_types
dnd5e/api/v1alpha1/encounter.proto   ← imports api/v1alpha1/room_common.proto, character, common, enums

api/v1alpha1/room_environments.proto ← imports api/v1alpha1/room_common.proto
api/v1alpha1/room_spatial.proto      ← imports room_common
api/v1alpha1/room_spawn.proto        ← imports room_common, room_spatial
api/v1alpha1/room_selectables.proto  ← imports room_common

sandbox/api/v1alpha1/sandbox_common.proto ← imports api/v1alpha1/room_common.proto
sandbox/api/v1alpha1/sandbox_room.proto   ← imports sandbox_common, room_common
```

Dependency hygiene is good: no circular imports, leaf files are leaf
files, generic types live in `api.v1alpha1` and dnd5e-specific types
live in `dnd5e.api.v1alpha1`. Cross-package reuse (encounter.proto
importing `api.v1alpha1.Position` / `Wall`) is the reason there are
not three Position types and four Wall types in the live encounter
service.

## Two parallel state shapes (the unfixed migration)

`EncounterStateData` (encounter.proto:96) is the unified entity-state
message that landed in PR #136. Inside the encounter service it
coexists with the legacy fragmented shapes:

```
EncounterStateData encounter_state_data = 20  ← unified, new
  field 3:  map<string, EntityState> entities  ← unified entity map

vs. legacy fields populated alongside:
CombatState combat_state = 6
Room room = 7
repeated MonsterCombatState monsters = 8
repeated DoorInfo doors = 10
repeated CharacterCombatState characters = 12
```

`CharacterCombatState` (encounter.proto:314) holds per-character
HP/death-saves/equipment/conditions. `MonsterCombatState`
(encounter.proto:343) holds per-monster HP/conditions/placement.
`EntityPlacement` (encounter.proto:18) holds placement+visual_type.
All three are subsumed by `EntityState` (encounter.proto:45) which
unifies them with `oneof details { CharacterDetails | MonsterDetails |
ObstacleDetails }`.

The new fields exist; the old ones haven't been removed; both are
populated. Per Rule 1 of [overview.md](overview.md#rule-1-one-source-of-truth-for-shape),
this is a violation. Tracked as **issue #138**.

## Tag-number densification

Multiple events in `encounter.proto` have intentional gaps:
- `MovementCompletedEvent` reserves 3-6 (encounter.proto:921), uses
  1, 2, 10, 11.
- `AttackResolvedEvent` reserves 4-6 (encounter.proto:933), uses
  1-3, 7, 10, 11.
- `ActionExecutedEvent` reserves 3, 5, 7 (encounter.proto:993), uses
  1, 2, 4, 6, 8, 10, 11, 20.

This is correct behavior — wire-compatible removal of fields requires
`reserved`. PR #136 demonstrates the team knows the pattern. Reading
the proto front-to-back is jarring, though; assume tag gaps mean a
deprecated field used to live there.

## Choice / submission redundancy (unfixed)

`ChoiceSubmission` (choices.proto:165) carries two parallel selection
paths:

```proto
repeated string selection_ids = 5;  // generic, preferred
oneof selection {
  SkillSelection skills = 6;          // category-specific, deprecated
  EquipmentSelection equipment = 7;
  LanguageSelection languages = 8;
  ToolSelection tools = 9;
  FightingStyleSelection fighting_style = 10;
  SpellSelection spells = 11;
  ExpertiseSelection expertise = 12;
}
```

The comment at line 176 says the `oneof` is deprecated. Both paths are
populated in practice. There is no schema-level enforcement of
"submit one or the other." Tracked as part of **issue #138**.

## What's intentionally missing

- **No shared `Error` envelope.** Each service ad-hocs the error shape.
  Standardizing one is a future decision.
- **No streaming / long-poll outside `EncounterService`.** Other services
  use unary RPCs only. Dice rolls don't stream; character creation
  doesn't stream. Only encounter events do.
- **No `MetadataEnvelope` or request-id field.** Tracing happens at the
  gRPC layer (interceptors), not the proto layer.
- **No protobuf options for client codegen** beyond `go_package` and
  `java_package`. TypeScript codegen is driven by `buf.gen.yaml` not
  per-file options.
