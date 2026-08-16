---
name: SessionService
description: D&D 5e session contract (v1alpha1) — the wire transcription of the toolkit's session package; one map, no rooms on the seam; the surface that replaces the v1alpha2 encounter stack
updated: 2026-08-16
confidence: high — proto-side only; no consumer yet, verified by scripted field-for-field comparison against rulebooks/dnd5e/session v0.12.0 read from the tag
---

# SessionService

Defined in `dnd5e/api/session/v1alpha1/` (service-first layout:
`service.proto`, `types.proto`, `events.proto` — the split
`dnd5e/api/v1alpha2/encounter/` set and `dnd5e/api/lobby/v1alpha1/` followed).
Package `dnd5e.api.session.v1alpha1`.

Design doc: `rpg-project/ideas/session-api/design.md`. Umbrella:
`KirkDiggler/rpg-project#227`. Landed by rpg-api-protos#222 (issue #221) against
session/v0.9.0, then re-transcribed by #226 (issue #225) against
**session/v0.12.0**, which is the version this doc describes.

## What makes this service different from every other one here

**It is a transcription, not a design.** The toolkit's
`rulebooks/dnd5e/session` package is the game server's single point of contact
with the rules engine, and it already exposes exactly one verb surface. This
package mirrors that surface field-for-field. rpg-api invents no vocabulary:
per the design's rule 1, a proto field with no SDK counterpart is a *design
change* and goes through the design doc before it goes into the proto.

That constraint is the reason several shapes here look unlike the rest of the
repo, and each apparent oddity is the SDK's, faithfully carried:

- `Position` is `double x/y` — two axes, floating point — because
  `spatial.Position` is. It is **not** the repo's `int32` cube `Position`.
  See [data-model.md](../data-model.md#position) for the three-Position
  situation and why reuse was rejected rather than overlooked.
- Responses are the SDK's Output structs flattened, not envelopes.
  `MoveResponse` *is* `session.MoveOutput`.
- `SaveReport` and `DeliveryReport` ride on every mutating response, because
  the SDK reports persistence and delivery as separate facts with different
  consequences (a failed save means the world did not change; a failed
  delivery means it did and some clients have not heard).
- Free-form SDK strings (`Sighting.channel`, `Sighting.status`) stay strings.
  Promoting them to enums would be inventing a closed vocabulary the toolkit
  has not committed to.

## One map — the ruling arrived

Design §0 recorded Kirk's ruling that *"the encounter has rooms but projects
the absolute geo of the dungeon so the session package sees it as all one
map."* When #222 landed, that was still the seam's **destination**, and the
contract carried room IDs plus a transitional `Traverse` RPC. It is now the
seam's **state**, delivered across three toolkit releases:

| release | what changed |
|---|---|
| `session/v0.10.0` | the Atlas became one map — no per-room decomposition, one grid for the field, cells sorted by coordinate |
| `session/v0.11.0` | joins, placements and outcomes went roomless — `Member` trades its room ID for an absolute `position` |
| `session/v0.12.0` | a walk crosses a doorway; the `Traverse` verb retires |

Consequences for this contract, all live:

- **No `Traverse` RPC.** It is gone, not deprecated — there is no SDK verb
  behind it. A doorway crossing is an ordinary step of `Move`.
- **No room ID anywhere on the seam.** `JoinRequest`, `Member`,
  `MemberOutcome` and `AtlasDoorway` all speak cells.
- **Every position is dungeon-absolute**, uniformly. There is no room-local
  frame left on this contract to get wrong.

## RPCs

Thirteen, mirroring the SDK verbs one-for-one.

| RPC | SDK verb | Request:Response | Notes |
|---|---|---|---|
| `Join` | `Join` | `JoinRequest:JoinResponse` | Players only. Takes an absolute cell — a caller places somebody on the map, not in a chamber |
| `Exit` | `Exit` | `ExitRequest:ExitResponse` | Returns the knowledge that leaves with the member (`carry`); last member out auto-closes the encounter (`closed`) |
| `Move` | `Move` | `MoveRequest:MoveResponse` | A **path**, not a destination; crosses doorways as ordinary steps. Fewer `steps` than requested `path` is an answer, not an error |
| `Attack` | `Attack` | `AttackRequest:AttackResponse` | Character attackers only in v1; nothing spends yet |
| `Turn` | `Turn` | `TurnRequest:TurnResponse` | Asked of a **member**, never of the session. See below |
| `EndTurn` | `EndTurn` | `EndTurnRequest:EndTurnResponse` | No "end the current turn" form, for the same reason `Turn` takes a member |
| `Dissolve` | `Dissolve` | `DissolveRequest:DissolveResponse` | Cause required. The fight is reached *through* a member, because a fight has no name |
| `End` | `End` | `EndRequest:EndResponse` | Declared external endings only — `NotFound` means the key was never on the menu |
| `GetStatus` | `Status` | `GetStatusRequest:GetStatusResponse` | Encounter-wide, never per-member |
| `GetStory` | `Story` | `GetStoryRequest:GetStoryResponse` | The resync source of truth |
| `GetView` | `View` | `GetViewRequest:GetViewResponse` | Sightings. Skips self — see the known gap below |
| `GetAtlas` | `Atlas` | `GetAtlasRequest:GetAtlasResponse` | Static; cache per encounter, never per frame |
| `StreamEvents` | `EventStream` | `StreamEventsRequest:stream Event` | Per-recipient projections |

**No `StartSession` and no `Spawn`**, though the SDK exposes both. Creation is
the lobby's: `LobbyService.StartEncounter` calls them in-process (design rule
5). There is no creation RPC here, in v1 or after.

## Movement, and the trap in it

A walk crosses a doorway because the far side of a doorway is simply the next
cell along. That is what made `Traverse` unnecessary.

But **adjacency is not permission**, and this is the part worth knowing before
writing a client. A pair of cells can be perfectly adjacent and still have
nothing to walk through. The composition's internal chambers are what create
those gaps, but a client never sees chambers and does not need to — the
observable rule is entirely about cells: the joint is in
`GetAtlasResponse.doorways` or it is nowhere. A route planner must consult that
list as well as `cells`.

The SDK gives that refusal its own sentinel (`ErrNoCrossing`, *"no doorway
joins those cells"*), kept deliberately distinct from `ErrBrokenPath` (the two
cells are not adjacent at all) and `ErrBadPosition` (there is no cell there).
Three different author mistakes, three different places to look.

## The Atlas

`GetAtlasResponse` is the whole map in one piece: one `grid` for the field,
every `cell` sorted by coordinate, the `occluders` subset that blocks sight,
every `boundary`, and every `doorway` as a crossable cell pair.

The sort order is load-bearing rather than cosmetic — the SDK sorts by
coordinate specifically so the flattening does not leak the old room grouping
back through iteration order. A map that still came out room-by-room would be
the old shape wearing a new type.

Construction truth: unchanged by movement, joins, exits or endings. Fetch it
once per encounter and cache it; never per frame.

## The event spine

`Event` (`events.proto`) mirrors `session.Event` exactly — `session`, `seq`,
`at`, `correlation`, `recipient`, `kind`, `payload`. The SDK's own godoc says
it was shaped flat and non-polymorphic *for this mapping*: no interface-valued
fields, no type switches on the wire, and no payload shape that varies by kind
in a way a generated client cannot express.

Three properties worth holding onto:

- **Per-recipient, not per-occurrence.** One underlying beat becomes several
  `Event`s, one per viewer who may know about it, and their payloads may
  differ. Projection happens inside the toolkit, where perception lives.
- **rpg-api never filters.** `StreamEvents(session, member)` delivers events
  whose `recipient` is that member, verbatim (design rule 4). A host that
  filtered would be reimplementing visibility, and its first mistake would leak
  fog of war.
- **Delivery is best-effort; the story log is truth** (design rule 6). `seq` is
  monotonic and gapless per session. A client that notices a gap re-queries
  `GetStory` from its last known value. The stream carries no replay
  obligation, which is why there is no snapshot-then-deltas pattern here — the
  shape `StreamEncounter` and `StreamLobby` both use.

`EventKind` is a proto enum with 13 named values plus `UNSPECIFIED`, and the
vocabulary is **unchanged from v0.9.0 through v0.12.0**. It is **open to growth
by construction**: proto3 preserves an unrecognised enum number rather than
dropping it, so a kind added later (rpg-toolkit#959) reaches an old client
intact and that client's `seq` accounting keeps working.

`EVENT_KIND_UNSPECIFIED` (0) and `EVENT_KIND_UNKNOWN` (100) are deliberately
different: 0 means the producer failed to set a kind (a defect), while
`UNKNOWN` mirrors the SDK's own `session.EventUnknown` — a beat *this toolkit
version* does not recognise, delivered on purpose so the recipient still learns
its sequence advanced. Same distinction `HexState` draws in the v1alpha2
encounter package.

**`EVENT_KIND_TRAVERSED` outlived the verb it was named for.** There is no
Traverse RPC any more, but the kind stayed distinct from `MOVED` through the
reshape, and the SDK is explicit about why: *one map does not mean one
narration.* A client renders a doorway differently from a corridor, and the
composition still knows which happened; collapsing them would make a client
re-derive it from the geometry.

## Contract edge cases (decided by the SDK, transcribed rather than re-decided)

- **`Turn` is asked of a member, never of the session.** Several clocks can run
  at once — a fight in the crypt while the rest of the party explores the hall
  — so "whose turn is it?" has no answer. A top-level query would have to pick
  one privileged clock to be *the* clock. `GetStatus` is correspondingly
  encounter-wide and must never learn anything per-member; the SDK pins this
  rather than merely leaving it unimplemented.

- **A verb's response describes only the caller's own action** (design rule 2).
  Monsters acting, other members moving, the world waiting — none of it appears
  in anyone's return value. It reaches a client through `StreamEvents`,
  single-player included. This is why the stream is not optional.

- **`Formed` appears on every verb that can put two sides in sight of each
  other** (`Join`, `Move`). A fight is *news*, not a decision: the composition
  detects contact wherever sight changes and starts the fight itself. A client
  renders "roll for initiative" from this; it never asks for one.

- **`Dissolve` covers only half of ending a fight.** The party deciding to
  disengage is a verb. Defeat is a fact the world notices, and when the
  composition can see it, it arrives as another `DissolveKind` produced
  automatically — never as a second RPC. The SDK seals its `DissolveCause`
  interface with an unexported method to make that structural.

## Known gaps, inherited and stated rather than papered over

- **A cold client still cannot learn its own position from a read.** This
  narrowed at v0.11.0 without closing: `Member` now carries an absolute
  `position`, so a `Join` tells you where you are — but no *read* returns a
  `Member`. `GetView` reports what a member perceives and skips self;
  `GetStatus` is encounter-wide. So a client that reconnects still leans on
  `GetStory` replay. The fix is SDK-first (design rule 11, rpg-toolkit#933) and
  is explicitly not a gate on this package.
- **`Attack` is character-attackers-only, and nothing spends.** Both are the
  SDK's stated scope — a monster's action can declare a save gate the seam has
  no vocabulary for, and the economy that would spend an action sits above this
  seam and does not exist. They arrive with the work that calls for them.
- **No door state or locks.** A doorway is crossable or absent; there is no
  closed/locked state on the wire yet. Fork-independent gap, arriving with its
  own capability work.

## Relationship to the v1alpha2 encounter service

**None, deliberately.** Design rule 9: no path between `SessionService` and the
old encounter stack — the two never call, import, or share state. That is why
this package mints its own `Position` rather than importing
`dnd5e.api.v1alpha2.encounter.Position`, which would have created exactly such
a path into a package the cutover deletes.

The two stacks coexist until cutover, with server configuration selecting which
one `StartEncounter` creates on — exactly one, never both. At cutover the
v1alpha2 encounter package is removed in place (every consumer moves in the
same swap), per the versioning trigger in `rpg-project/CLAUDE.md`.

## Status

Proto-only as of this doc. rpg-api's implementation (W2 of `rpg-project#227`)
is in flight and was written against the v0.9.0 shapes, so it absorbs this
reshape — the Traverse handler goes away and placements become cells. No
`rpg-dnd5e-web` client usage yet (W3). Not a "live" service by this repo's
usual definition — re-grade once the rpg-api PR lands.
