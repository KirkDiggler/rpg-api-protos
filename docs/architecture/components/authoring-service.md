---
name: AuthoringService
description: Dev-gated dungeon authoring surface — PutDungeon compiles and (unless validate_only) persists a dungeonspec YAML, returning a server-computed floor plan
updated: 2026-08-09
confidence: high — verified by schema, buf compatibility checks, and generated Go/TypeScript compilation; provider population remains downstream rpg-api/toolkit Wave B work
---

# AuthoringService

New service, own subpackage `dnd5e/api/authoring/v1alpha1`. Defined in
`dnd5e/api/authoring/v1alpha1/service.proto` (~75 lines). Part of the
Dungeon Builder arc (`rpg-project#169`, design PR `rpg-project#170`) — the
in-game authoring loop that replaces "edit YAML, restart the server" with a
live, server-validated preview.

## Why its own service, not an RPC on LobbyService

Per `docs/how-to/add-a-new-service.md`'s three-question checklist:
content authoring doesn't fit `CharacterService`/`EncounterService`/
`LobbyService`'s bounded contexts (does it belong on an existing service?
no); it's a distinct aggregate from party/encounter state (does it have
its own ownership boundary? yes); rpg-api's authoring orchestrator (S1 of
the same arc) is its live consumer in flight, not a speculative one (will
multiple services share it? not today, but there's a consumer already
queued).

## File and shape

- `dnd5e/api/authoring/v1alpha1/service.proto` — 1 service, 1 RPC, 9
  messages, and 2 authoring-local enums.
- Imports `dnd5e/api/v1alpha1/common.proto` for `ValidationError` and the
  narrowly shared `PlacementOffset` transport — no duplicate service-local
  vector or new error type invented.

## RPC

| RPC | Purpose |
|---|---|
| `PutDungeon` | Validates + compiles a dungeonspec YAML; unless `validate_only`, persists it (write-through) and swaps it into the live registry `StartEncounter` reads |

`PutDungeonRequest`:
```proto
string key = 1;           // must match the YAML's own declared key: field
string yaml = 2;
bool validate_only = 3;   // true: compile + return floor_plan, no persist
```

`PutDungeonResponse`:
```proto
bool success = 1;
repeated dnd5e.api.v1alpha1.ValidationError field_errors = 2;  // v1: one flat entry per compile failure
FloorPlan floor_plan = 3;
```

## The FloorPlan response contract

The design's server-authoritative-grid-math principle (design.md,
"Grid math is server-authoritative"): the client never re-derives
room-chain offsets or connector-gap columns from room widths. `FloorPlan`
carries every value a naive board implementation might otherwise
reconstruct with arithmetic:

- `FloorPlanRoom.start_column` — the room's absolute position in the
  compiled left-to-right chain.
- `FloorPlanConnector.column` — the reserved gap column between its two
  rooms.
- `FloorPlan.door_row` — applies uniformly to every room today
  (dungeonspec's `height/2` invariant), carried explicitly so a future
  non-uniform toolkit change doesn't silently break a board that hardcoded
  the formula.
- `FloorPlan.width` and existing `height` — canvas dimensions. In the
  RATIFIED Dungeon YAML Spec v0.3 Wave 0 canvas projection, `rooms` is empty;
  width/height are bounds, not a substitute for floor geometry.
- `FloorPlan.floor_source` — optional-presence
  `FloorPlanFloorSource{UNSPECIFIED, BOUNDS, REGIONS}`. A successful current
  provider always emits present `BOUNDS` or `REGIONS`; omitted YAML
  `canvas.floor_source` resolves to present `BOUNDS`. Absent/`UNSPECIFIED`
  identifies an older or incomplete producer, so generated clients hard-stop
  rather than infer topology from mask shape. This discriminator is authoring-
  only and adds no runtime topology wire.
- `FloorPlan.floor_cells` — the complete canonical structural floor, using
  `FloorPlanCell`'s absolute pointy-top odd-q `[column, row]` coordinates.
  Producers emit ascending lexicographic `(column, row)` order. The board
  renders this explicit list and MUST NOT infer a floor from dimensions.
- `FloorPlan.regions` — declared regions only, preserving YAML declaration order
  even when a child precedes its parent. Each `FloorPlanRegion` projects the
  non-empty unique declared ID, its complete absolute odd-q extent (cells in
  ascending `(column,row)` order), and a toolkit-derived optional direct
  `parent_id`. Root-parented declared regions omit `parent_id`; producers must
  not emit an explicit empty value. The implicit unpainted root is omitted.
  This intentionally carries no authoring `name`, `archetype`, or region-
  archetype resolution/omission discriminator: those remain YAML/toolkit
  semantics.
- `FloorPlan.entrance` (`FloorPlanCell{column, row}`) — existing message
  presence is normative. A successful validate-only structural draft may omit
  it when no PartyCap anchor qualifies; a present `(0,0)` is a real entrance,
  never an absence sentinel. Strict runnable validity and anchor derivation are
  provider behavior, not new proto fields. It remains distinct from
  `FloorPlanRoom.archetype == "entrance"`, which identifies the entrance
  *room*, not this cell.
- `FloorPlan.placements` — the complete compiled placement projection for
  room/canvas props, room/canvas monsters, and the room boss. Each
  `FloorPlanPlacement` carries submitted `ref`, absolute `at`, optional facing,
  blockers, canonical source path, and optional shared `PlacementOffset`.
  Offset message presence distinguishes omission from explicit `[0,0,0]`;
  its finite x/y/z components are canonical game-world-axis values relative to
  the placement origin and are never rotated by facing. The provider validates
  exact YAML triple shape/finiteness before this projection; proto supplies the
  exact three named transport components rather than a repeated or generic
  transform field.
- `FloorPlan.edges` — the generated canonical solid-wall and door edges.
  `FloorPlanEdge{from, to, kind, door_id}` is authoring-local. A physical
  edge is the **undirected** adjacent-cell pair `{from, to}`; the producer
  emits exactly one record for each pair. Reversed endpoints are the same
  edge, so duplicate or conflicting records are forbidden. `from`/`to` have
  no canonical order and clients must not derive direction, ownership, or
  any other meaning from their orientation. An exterior edge has one endpoint
  outside the floor-plan bounds.

  `door_id` is required, non-empty, and unique for `DOOR`; for a generated
  connector door it exactly equals `FloorPlanConnector.door_id`. It is absent
  for `SOLID`. These are semantic producer requirements, not validations a
  proto parser/textproto fixture can enforce. At encounter startup, convert
  each endpoint from FloorPlanCell's `[column, row]` pointy-top offset
  coordinate into the runtime `Position` cube coordinate. The corresponding
  runtime `Wall` represents the same unordered pair: `SOLID` becomes
  `WALL_KIND_SOLID` without `Wall.id`; `DOOR` becomes an initially closed or
  locked door wall with `Wall.id == door_id` (and may later be
  `WALL_KIND_DOOR_OPEN`). This projects the generator's truth to runtime
  `HexRecord.edges`; it deliberately does **not** reuse runtime
  `dnd5e.api.v1alpha2.encounter.Wall` or `WallKind`, because those describe
  live encounter state. Region-union envelopes retain this same flat pair
  wire, including an in-canvas void or actual off-canvas coordinate as the
  non-floor endpoint; ownership comes only from `floor_cells` membership, not
  pair orientation. The board renders and hit-tests this list directly; it
  neither derives competing edges nor restores the retired flat
  `Space.walls` field.

## Error transport — decided, not left to drift between S1 and S4c

Opus gate finding on the first S0 revision: design.md's "returns
structured errors (field-path-mapped, `InvalidArgument`)" describes two
transports gRPC can't combine — a non-OK status never delivers the
response body, so `field_errors`/`floor_plan` would be unreachable on an
`InvalidArgument` return. Decided and documented in the proto comments
(`PutDungeonRequest`/`PutDungeonResponse`) so S1 (produces this) and S4c
(consumes it) can't independently guess different answers:

- **Malformed request** (key fails `[a-z0-9-]`, or key/YAML `key:`
  mismatch) — no meaningful body exists, so this is transport-level gRPC
  `InvalidArgument`. `PutDungeonResponse` is never delivered.
- **Well-formed request, YAML content fails dungeonspec
  validate/compile** — gRPC `OK` with `PutDungeonResponse{success: false,
  field_errors: [...], floor_plan: unset}`. This is the editor's inline
  compile-error path; a non-OK status here would silently drop the one
  message the v1 flat-error limitation already leaves an author with.
- **Success** — `success: true`, `floor_plan` set, `field_errors` empty.
- `validate_only` affects persistence only — it does not change which of
  the above three paths a given input takes.
- Gate off — `Unimplemented` (the RPC is unregistered; unaffected by any
  of the above, and doesn't collide with the availability-probe pattern
  S4a uses to distinguish "gate off" from "server unreachable").

## Error shape — a deliberate deviation from `bool success + string error`

`add-a-new-service.md`'s default error pattern is `bool success = 1;
string error = 2;` "unless you have a strong reason to design a typed
error." This service has one: `field_errors` reuses the existing
`dnd5e.api.v1alpha1.ValidationError` (field/message/code) rather than a
bare string, so an editor can render errors inline per the design's UX
requirement. **Known v1 limitation**, stated plainly here because it
constrains what the web editor can honestly promise: `rpg-toolkit`'s
`dungeonspec.Validate` returns one flat `error`, not per-field paths, so a
compile failure surfaces as exactly one `ValidationError` (`field=""`)
today — not true per-cell mapping. A future toolkit enhancement to return
structured per-field errors is follow-up work, not part of this arc.

## The authoring gate (rpg-api side, not visible in this proto)

`PutDungeon` is absent from the server's reflection list
(`Unimplemented`) unless rpg-api was started with its authoring env flag
set — this proto carries no gate of its own; the RPC is simply not
registered when the gate is off. See `rpg-api`'s S1 slice of the same arc.

## Live consumers

None yet at merge time. `rpg-api` (arc slice S1, `PutDungeon` orchestrator
+ authoring gate + shared registry) and `rpg-dnd5e-web` (arc slices S4a-c,
the `/author` route) are both queued as the next legs of the same arc —
this is the "no consumer in flight" anti-pattern's explicit exception, not
a violation of it.

## Design notes

- **No pagination, no listing RPC here.** `ListDungeons` (key + display
  name for the lobby dropdown) lives on `LobbyService`, deliberately not
  gated — see `lobby-service.md`'s note or `dnd5e/api/lobby/v1alpha1/service.proto`.
  Reads content, mutates nothing; must work with authoring off.
- **`validate_only` over a sibling `Preview` RPC.** One RPC, one message
  pair, a bool flag — simpler than a second RPC with a near-identical
  request/response shape, and the flag reads naturally at the call site.
- **Preview/dry-run compiles at a fixed default seed**, not a
  caller-supplied one (design.md) — seed only affects rolled content,
  which the editor keeps off-grid in its own "rolled content" panel, so
  the live per-edit board preview doesn't need seed control. Not
  represented as a proto field for that reason.

## Confidence and what's not verified

- RPC and message counts verified by reading the file directly.
- No live consumer to verify runtime behavior against — this doc describes
  the wire contract only, per this repo's own scope ("it never runs at
  runtime").
