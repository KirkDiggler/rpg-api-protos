---
name: AuthoringService
description: Builder-authorized dungeon source and compile surface, sharing the atlas DTO with permitted player knowledge; separate catalog reads expose rulebook vocabulary
updated: 2026-10-01
confidence: high for schema shape; builder authorization and immutable source provenance remain pending runtime adoption
---

# AuthoringService

Own subpackage `dnd5e/api/authoring/v1alpha1`, defined in
`dnd5e/api/authoring/v1alpha1/service.proto`. The seam of the in-game
dungeon builder (journey `rpg-project#169`, design+plan `rpg-project` PR
#255, slice `rpg-project#256`): write a world file, get back the world the
game will play.

## This is the second contract at this path — a replacement, not a revision

The first `AuthoringService` (rpg-api-protos#200, 2026-07-30) described the
room-chain dialect: `FloorPlan`, `door_row`, `start_column`, connector
columns, and an `archetype` that silently chose where the party stood. Its
only server was deleted with the old encounter module in rpg-api#801. Under
no-backcompat there was nothing left to stay compatible with, so on
2026-08-23 the file was rewritten outright — old messages gone, not
`reserved` (there is no wire to keep safe) — and `buf breaking` reports the
replace as expected. Carried on the `breaking-change-approved` label per
[breaking-change-workflow.md](../../how-to/breaking-change-workflow.md).

The one idea that survives is the transport decision from the first cut: a
malformed **request** is a gRPC status, a file that fails to **compile** is
a body.

## Shape

- 1 service, 4 RPCs, 12 messages, 1 enum. Imports
  `dnd5e/api/session/v1alpha1/types.proto` for shared `GetAtlasResponse`.
  The DTO is reused, not a second authored geometry model.

| RPC | Purpose |
|---|---|
| `PutDungeon` | Builder-authorized compile/validate/write; additionally unavailable with `RPG_AUTHORING_ENABLED` off. Returns the complete author compile view when valid |
| `GetDungeon` | Builder-authorized full source read. An authorized unknown key is `NotFound`; no player rendering fallback |
| `ListScenarios` | Registry catalog of scenario fields; catalog access grants no dungeon source or placement knowledge |
| `ListWeapons` | Registry catalog for the action palette; catalog access grants no source or placed-monster equipment knowledge |

```proto
message PutDungeonRequest  { string key = 1; string yaml = 2; bool validate_only = 3; }
message PutDungeonResponse {
  repeated FieldError errors = 1;                         // empty ⇒ compiled, atlas set
  dnd5e.api.session.v1alpha1.GetAtlasResponse atlas = 2;  // the same message the game plays from
}
message FieldError { string path = 1; string message = 2; }   // "regions[1].cells[0][3]", "walls[3]", "start"
message GetDungeonRequest  { string key = 1; }
message GetDungeonResponse { string yaml = 1; }               // verbatim text, never a re-marshal

message ListScenariosRequest  {}
message ListScenariosResponse { repeated ScenarioDescriptor scenarios = 1; }
message ScenarioDescriptor    { string id = 1; string name = 2; repeated ScenarioField fields = 3; }
message ScenarioField         { string key = 1; string label = 2; FieldType type = 3; string kind = 4; string guidance = 5; }
enum FieldType { FIELD_TYPE_UNSPECIFIED = 0; FIELD_TYPE_ENTITY_REF = 1; FIELD_TYPE_CHECK = 2; }

message ListWeaponsRequest  {}
message ListWeaponsResponse { repeated WeaponDescriptor weapons = 1; }
message WeaponDescriptor    { string ref = 1; string name = 2; bool ranged = 3; string category = 4; }
```

There is no `DeleteDungeon`. Not now: nothing in the builder's first loop
(draw, validate, save, play, reopen) deletes.

## The atlas is the response — the builder has no second geometry

`PutDungeon` reuses `dnd5e.api.session.v1alpha1.GetAtlasResponse`, defined in
session `types.proto`. One authoritative geometry source serves two authorized
answers: the builder's complete compile view may contain holdable placements;
player knowledge contains discovered fixed geometry/scenery and separate mutable
testimony. Reusing the DTO never grants a player the full author view. Regions,
lighting and appearance metadata obey the same disclosure boundary as floor.
See [observer knowledge](session-service.md#individual-dungeon-knowledge).

Source reads, validation and writes require host-enforced builder authority for
that source. `RPG_AUTHORING_ENABLED` controls availability, not authorization;
signing in, joining or hosting a session does not confer builder authority.
Player rendering uses supplied permitted knowledge, never `GetDungeon` YAML.
The concrete builder policy and its runtime enforcement remain follow-on work.

## Error transport

- **Malformed request** — `key` outside `[a-z0-9-]`, or `key` not equal to
  the YAML's own `key:` line — is gRPC `InvalidArgument`, no body. A
  request that could not name its target has no meaningful atlas or error
  list, and a non-OK status never delivers a body anyway.
- **Well-formed request, file does not compile** — gRPC `OK` with `errors`
  populated and `atlas` unset. The builder's inline-error path: the author
  needs the list, not a status code. Every problem the compiler found comes
  back at once, each with the YAML path it is about.
- **Compiled** — `errors` empty, `atlas` set, and (unless `validate_only`)
  the file stored under its key. There is no `bool success`: an empty error
  list *is* success, and a flag that could disagree with it would be a
  second source of truth.
- `validate_only` affects persistence only, and **never refuses a
  half-drawn map** — a file with no start cell comes back as an error on
  `start`, not as a status. The author is in the middle of drawing.
- Gate off — `Unimplemented`; the RPC is not registered. This is how a
  client tells "authoring is off" from "server unreachable".

## Verbatim text

`PutDungeonRequest.yaml` is compiled and stored exactly as sent;
`GetDungeonResponse.yaml` is exactly that UTF-8 text back. The server never
re-marshals: an author reopening a map gets their comments, ordering and
spacing, not the server's opinion of the file.

## The registry RPCs hand over the rulebook's words, not the builder's

`ListScenarios` and `ListWeapons` exist for one reason: the rulebook owns the
vocabulary and the builder must not hold a copy of it. A web client carrying
its own list of scenarios, or of weapon names, would need a release before an
author could reach something the server's rulebook already has — and the day
the two lists disagreed, the palette would be offering a chip that writes a
file the compiler refuses.

These are catalog reads, unlike builder-authorized `GetDungeon` source reads.
Catalog access never grants a dungeon's complete source or reveals its placed
content. Both take an empty request: the set belongs to the server's rulebook
build, not a particular dungeon. A builder with nothing drawn still needs the
vocabulary to show what a map or monster could become.

### `ScenarioDescriptor` is content, translated verbatim

Each scenario package in the rulebook exports its own descriptor — the field
keys its `New(cfg)` validates and the refusal words that constructor would use
— and `rpg-api` copies it onto the wire without interpreting it. Nothing on
the server path learns what a captain is or what winning means. That is why
there is no `recover_the_artifact` message here and never will be: a typed
message per scenario would put the rulebook's vocabulary in this contract, and
every new scenario would then need a proto change, an `rpg-api` change and a
web change before an author could use it.

`ScenarioField.kind` is an open string for the same reason, while `FieldType`
beside it is a closed enum: the set of **widget shapes** is the builder's own
vocabulary and grows only when the builder learns to render something new,
while the set of **things a widget can point at** is content and grows with the
rulebook.

### `WeaponDescriptor` carries the ref the author writes

Design `rpg-project#448`. A dungeon file's placement names its actions in
order — `actions: [dnd5e:weapons:scimitar, dnd5e:weapons:shortbow]` — and the
palette emits `WeaponDescriptor.ref` **verbatim** into that list. `name` is the
chip's label, `ranged` is the server's answer to the one question a
"ranged / melee / both" filter asks, and `category` is the rulebook's own word
(`simple-melee`, `martial-ranged`, …) for grouping and for showing, opaque and
never branched on.

Two shape decisions worth keeping:

- **`ref` is a string, not this repo's `dnd5e.api.v1alpha2.weapons.Weapon`
  enum.** That enum is generated 1-to-1 from the toolkit registry, so a
  rulebook that grew a weapon would need a regeneration, a proto release and a
  web release before an author could reach it — the coupling this RPC exists
  to remove. And the enum names the weapon without naming its ref: a client
  holding `WEAPON_SHORTBOW` would have to rebuild `"dnd5e:weapons:" +
  "shortbow"` to write the file, and a client that reconstructs an id will
  eventually reconstruct it wrong. The enum keeps its own job — typed weapon
  identity on the equipment wire — and this door hands over the string the
  file wants.
- **No damage dice, no range, no properties.** The palette does not compute an
  attack; the toolkit assembles one at spawn from the wielding monster's own
  ability scores and proficiency, which is why a skeleton shortbow and a goblin
  shortbow are the same weapon. Numbers here would be a second copy of the
  rulebook's, lying the moment they disagreed.

`ranged` is not derived by the client from `category`. The category word fuses
the proficiency tier and the melee/ranged split today, and a client that took
that as license to split it apart would be holding the rulebook's vocabulary
again; the bool is the rulebook's own predicate, answered server-side.

## Live consumers

Existing API handlers and the web builder consume this surface. The new
builder-authorization requirement, immutable source revision binding and player
source-refusal proof remain pending in the dungeon-knowledge wave
(`rpg-project#508` / design PR `rpg-project#509`). Schema documentation does not
establish that runtime gate or authenticated non-disclosure.

## Design notes

- **`ListDungeons` stays on `LobbyService`**, ungated — a picker needs it
  with authoring off. `StartEncounterRequest.dungeon_key` is honoured:
  unknown key is `NotFound`, never the default tomb.
- **`validate_only` over a sibling `Preview` RPC** — one RPC, one message
  pair, a bool; the flag reads naturally at the call site.
- **No hand-written tests.** Per the repo rule, the evidence for this
  contract is `buf lint`, `buf format`, `buf breaking` and generation
  compiling; the old `tests/regions` suite against `FloorPlan` was deleted
  with the dialect it tested.
