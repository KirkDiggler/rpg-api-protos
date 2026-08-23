---
name: AuthoringService
description: Dev-gated dungeon authoring surface — PutDungeon compiles a dungeon file and answers with the same GetAtlasResponse the game plays from; GetDungeon hands the stored file back verbatim
updated: 2026-08-23
confidence: high for the contract — verified by buf lint/format/breaking and generated Go/TypeScript compilation; no consumer yet (rpg-api A and rpg-dnd5e-web W of the same plan are the next legs)
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

- 1 service, 2 RPCs, 5 messages. Imports
  `dnd5e/api/session/v1alpha1/service.proto` for `GetAtlasResponse` — the
  only cross-package dependency, and the point of the design.

| RPC | Purpose |
|---|---|
| `PutDungeon` | Compiles a dungeon file and, unless `validate_only`, stores it under its key. Either way answers with the compiled atlas. Gated server-side by `RPG_AUTHORING_ENABLED` (Unimplemented when off) |
| `GetDungeon` | Returns the stored file for a key, verbatim. `NotFound` for an unknown key. Ungated — reading content mutates nothing |

```proto
message PutDungeonRequest  { string key = 1; string yaml = 2; bool validate_only = 3; }
message PutDungeonResponse {
  repeated FieldError errors = 1;                         // empty ⇒ compiled, atlas set
  dnd5e.api.session.v1alpha1.GetAtlasResponse atlas = 2;  // the same message the game plays from
}
message FieldError { string path = 1; string message = 2; }   // "regions[1].cells[0][3]", "walls[3]", "start"
message GetDungeonRequest  { string key = 1; }
message GetDungeonResponse { string yaml = 1; }               // verbatim bytes, never a re-marshal
```

There is no `DeleteDungeon`. Not now: nothing in the builder's first loop
(draw, validate, save, play, reopen) deletes.

## The atlas is the response — the builder has no second geometry

`PutDungeon` answers with `dnd5e.api.session.v1alpha1.GetAtlasResponse`,
not a builder-shaped projection. The builder draws what `PutDungeon`
returns, and what `PutDungeon` returns is what `GetAtlas` will return once
a session starts on that file: one message type, one producer, one
geometry. The first cut's `FloorPlan` was a second projection of the world
that had to be kept in step with the atlas by hand, and the moment the two
disagreed the builder was lying. Returning the atlas itself leaves nothing
to keep in step. Regions and lighting reach the builder the same way every
other world fact does — on the atlas
([session-service.md](session-service.md), "The Atlas").

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

## Verbatim bytes

`PutDungeonRequest.yaml` is compiled and stored exactly as sent;
`GetDungeonResponse.yaml` is exactly those bytes back. The server never
re-marshals: an author reopening a map gets their comments, ordering and
spacing, not the server's opinion of the file.

## Live consumers

None at merge time. `rpg-api` (plan section A: the content registry, the
RPCs, the key) and `rpg-dnd5e-web` (section W: `/author` on the atlas)
are the next legs of the same plan
(`rpg-project/ideas/dungeon-builder/plan.md`).

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
