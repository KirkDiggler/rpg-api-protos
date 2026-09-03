---
name: SessionService
description: D&D 5e session contract (v1alpha1) — the wire transcription of the toolkit's session package; one map, no rooms on the seam; the surface that replaces the v1alpha2 encounter stack
updated: 2026-09-03
confidence: high for the Death Save contract and everything with an SDK tag behind it — Death Save was transcribed field-for-field from rulebooks/dnd5e/session v0.54.1; earlier surface evidence includes scripted comparison against v0.18.0 plus the tagged Atlas.Layout and Seen deltas; first live consumer remains the rpg-dnd5e-web Concepts Lab pending API adoption
---

# SessionService

Defined in `dnd5e/api/session/v1alpha1/` (service-first layout:
`service.proto`, `types.proto`, `events.proto` — the split
`dnd5e/api/v1alpha2/encounter/` set and `dnd5e/api/lobby/v1alpha1/` followed).
Package `dnd5e.api.session.v1alpha1`.

Design doc: `rpg-project/ideas/session-api/design.md`. Umbrella:
`KirkDiggler/rpg-project#227`. Landed by rpg-api-protos#222 (issue #221) against
session/v0.9.0, re-transcribed by #226 (issue #225) against
**session/v0.12.0**, extended by #228 (issue #227) with `GetWhere` at
**session/v0.13.0**, caught up to **session/v0.18.0** by the delta below,
extended to **session/v0.20.0** with `GetAtlasResponse.layout`
(rpg-toolkit#1140), extended to **session/v0.21.2** with `Seen` on
`Sighting`/`Report` (ADR-0041, rpg-toolkit#1157), carrying **the combat-turn
contract** (rpg-project#249, design `rpg-project/ideas/combat-turn/design.md`
§3), which is the one part of this package that merged *ahead* of its SDK
(see "The combat turn" below), and most recently extended with **`Interact`
and `MEMBER_KIND_WORLD`** against **rulebooks/dnd5e/v0.131.0**
(rpg-toolkit#1404/#1434, design `rpg-toolkit/docs/ideas/world-npcs/`), and now
adds the explicit Death Save surface from **rulebooks/dnd5e/session v0.54.1**
(rpg-api-protos#277) — the state this doc describes. See "Death Saves" and
"World NPCs" below.

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
- `Sighting.seen` / `Report.seen` are a typed sub-message, not more payload
  bytes: the sight channel's position travels as `Seen{position}` (ADR-0041).
  Gated on channel provenance for `Sighting`; on `Report` it is only inferred
  by decode, since `intel.Report` carries no channel of its own
  (rpg-toolkit#1160 tracks closing that gap). `payload` stays, for channels
  the SDK has not typed.

## Public roster customization

`PublicMemberInfo.customization = 7` remains the public identity shelf and now
projects `Customization.hair = 1` and `Customization.outfit = 2` with the same
neutral customization messages used by character creation. Customization
belongs beside public name/body identity: peers may render the hair and outfit
intent a member chose, while hit points, ability scores, inventory, features,
conditions, resources, and all other sheet/rules data remain behind the
character service's owner gate.

The toolkit owns semantic validation and public projection for both Hair and
Outfit. The API performs pure protobuf/toolkit conversion and delegates without
interpreting customization values. The nested presence contract is preserved
across that projection: absent Hair messages, selections, color, and roughness
use provider defaults; absent Outfit messages and optional channels preserve the
provider-authored channel. Present `style_ref` and packed sRGB values are
carried as intent. `none` explicitly requests no style. A present
`StyleSelection` with no oneof arm is semantically invalid; toolkit validation
owns that refusal and the API passes the shape through for delegation.

This is a schema contract for the toolkit and later API/web consumers. It does
not claim that runtime persistence or roster projection has landed.

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
| `session/v0.13.0` | a client can ask where it stands — the `Where` read arrives (purely additive) |
| `session/v0.14.0` | the seam speaks one map to the last frame (rpg-toolkit#1053) |
| `session/v0.15.0` | **a fight can be lost, and the seam says so** — `DissolveByDefeat` and `EventDowned` arrive (rpg-toolkit#1079) |
| `session/v0.16.0` | the swing notices its own kill (rpg-toolkit#1083) |
| `session/v0.17.0` | **a second swing costs something** — the action economy starts refusing (rpg-toolkit#1097) |
| `session/v0.17.1` | the walk speaks only absolute positions (rpg-toolkit#1059) |
| `session/v0.18.0` | **the new Atlas** — props that say what they are, replacing bare occluder coordinates (rpg-toolkit#1130) |
| `session/v0.19.0` | the hex-orientation correction lands (rpg-toolkit#1141/#1143/#1145) — no contract change; every served cell of a hex map moves |
| `session/v0.20.0` | **the atlas says which way its hexes point** — `Atlas.Layout` (rpg-toolkit#1140, ADR-0040) |

Consequences for this contract, all live:

- **No `Traverse` RPC.** It is gone, not deprecated — there is no SDK verb
  behind it. A doorway crossing is an ordinary step of `Move`.
- **No room ID anywhere on the seam.** `JoinRequest`, `Member`,
  `MemberOutcome` and `AtlasDoorway` all speak cells.
- **Every position is dungeon-absolute**, uniformly. There is no room-local
  frame left on this contract to get wrong.

## RPCs

Twenty-three, mirroring the exposed SDK verbs one-for-one plus the stream.

| RPC | SDK verb | Request:Response | Notes |
|---|---|---|---|
| `Join` | `Join` | `JoinRequest:JoinResponse` | Players only. Takes an absolute cell — a caller places somebody on the map, not in a chamber |
| `Exit` | `Exit` | `ExitRequest:ExitResponse` | Returns the knowledge that leaves with the member (`carry`); last member out auto-closes the encounter (`closed`) |
| `Move` | `Move` | `MoveRequest:MoveResponse` | A **path**, not a destination; crosses doorways as ordinary steps. Fewer `steps` than requested `path` is an answer, not an error. **On the turn clock it spends** (rpg-toolkit#1169): only the active member walks (`ErrNotYourTurn`), and the whole path is priced at 5 ft/cell and paid before the first step (`ErrCannotAfford`, "movement: N ft needed, M ft left"). Both `FAILED_PRECONDITION`. The old blanket in-a-fight refusal (`ErrInBubble`) is gone from this verb |
| `Attack` | `Attack` | `AttackRequest:AttackResponse` | Character attackers only in v1. **It spends now** — a second swing can be refused with `ErrCannotAfford`. `Afford` announces not-your-turn, DOWNED, unreadable dependency, no-target-in-reach, and action-budget blockers first. DOWNED blocks Attack and Move, not End Turn. An empty hand is **not** a refusal — it swings `dnd5e:weapons:unarmed-strike` (rpg-toolkit#1168). Response carries the same full-ref `AttackRef` selected from the declaration and recorded by Struck/Missed |
| `DeathSave` | `DeathSave` | `DeathSaveRequest:DeathSaveResponse` | Requires the current non-empty Death Save declaration ID. The response carries the authoritative d20, typed provider outcome/continuation, provider-derived progress/remaining counts, actor-local `seq`, and one opaque generated `presentation_id` shared with every witness event |
| `Turn` | `Turn` | `TurnRequest:TurnResponse` | Asked of a **member**, never of the session. See below. Carries `participants[]` beside `order[]` — name, kind, standing, active per member (rpg-toolkit#1137) |
| `Afford` | `Afford` | `AffordRequest:AffordResponse` | Nested compiled offers, not a flat target list and not remaining currencies. A compiled Attack carries non-empty `id`, the sole `AttackRef`, `target_kind = MEMBER`, and every current live-sight member except the actor exactly once. Move uses `PATH` and display/context-only `remaining`; End Turn uses `NONE`. Early per-verb blockers remain rows with empty ID/detail and authoritative `why`. `available` is the full per-verb gate. Empty on the world clock is the answer |
| `EndTurn` | `EndTurn` | `EndTurnRequest:EndTurnResponse` | No "end the current turn" form, for the same reason `Turn` takes a member |
| `Dissolve` | `Dissolve` | `DissolveRequest:DissolveResponse` | Cause required. The fight is reached *through* a member, because a fight has no name |
| `End` | `End` | `EndRequest:EndResponse` | Declared external endings only — `NotFound` means the key was never on the menu |
| `GetStatus` | `Status` | `GetStatusRequest:GetStatusResponse` | Encounter-wide, never per-member |
| `GetStory` | `Story` | `GetStoryRequest:GetStoryResponse` | The resync source of truth |
| `GetView` | `View` | `GetViewRequest:GetViewResponse` | Sightings — what this member perceives of *others*. Skips self by design; `GetWhere` answers self |
| `GetWhere` | `Where` | `GetWhereRequest:GetWhereResponse` | The caller's own cell, answerable cold. Deliberately singular — no roster read exists |
| `GetAtlas` | `Atlas` | `GetAtlasRequest:GetAtlasResponse` | Static; cache per encounter, never per frame |
| `Interact` | `Interact` | `InteractRequest:InteractResponse` | Reaches a placed `MEMBER_KIND_WORLD` member and reports identity plus resolved vendor stock, if any. See "World NPCs" below |
| `StreamEvents` | `EventStream` | `StreamEventsRequest:stream Event` | Per-recipient projections |

**No `StartSession`, no `Spawn`, and no `PlaceNPC`**, though the SDK exposes
all three. Creation is the lobby's: `LobbyService.StartEncounter` calls them
in-process (design rule 5). There is no creation RPC here, in v1 or after.

## Death Saves

Session v0.54.0 introduced `VERB_DEATH_SAVE`; the current v0.54.1 contract has
one `DeathSaveRef` on its compiled
`Declaration`, and the dedicated `DeathSave` RPC. The request is only
`session`, authenticated `member`, and required opaque `declaration_id`: no die,
target, state, threshold, or proposed outcome crosses into the provider. Empty,
stale, mismatched, spent, and no-longer-eligible selectors are refused before
entropy or mutation.

`LifeState` is always explicit on each turn `Participant`; optional
`DeathSaveProgress` does not define it. Both are session-owned projections of
provider facts, not another persistence ledger. Progress and its
`successes_needed` / `failures_remaining` values are table-visible, provider-
derived answers. Clients never inspect HP, compare counts to three, or infer
Dying/Stabilized/Dead. The authenticated-owner `CharacterData` reuses these
same two wire types at tags 15/16 so owner and public turn views cannot invent
parallel life-state vocabularies; foreign legacy encounter projections still
withhold all owner-only fields.

`DeathSaveResponse` and the whole-party
`EVENT_KIND_DEATH_SAVE_ROLLED`/`DeathSaveRolled` body expose the same
authoritative roll, typed outcome/continuation, progress facts, and identical
opaque generated `presentation_id`. The token contains no Story/global sequence
and is never parsed. Presentation retries keep that token and the same
already-authoritative result, increment only the presentation attempt, and do
not issue a second game RPC. The presentation service's numeric `authority_seq`
is supplied separately from the actor's recipient-local response `seq` and
each witness's local `Event.seq`; none is encoded in the token.

Continuation is provider instruction after in-bounds settlement:
`END_TURN` invokes the current End Turn declaration, `KEEP_TURN` refreshes
CharacterData/Turn/Afford and leaves the recovered actor active, and
`ALREADY_ADVANCED` refreshes authority without a second mutation.

## World NPCs

`rpg-toolkit#1404`/`#1434` (rulebooks/dnd5e/v0.131.0) added placed,
non-combatant world NPCs to the SDK — a vendor today, any other
`npc.Capability`-tagged content later. This seam's slice of it:

- **`MemberKind` gained `MEMBER_KIND_WORLD`.** A placed NPC shows up in the
  roster like any other member, structurally excluded from combat — never a
  side in a fight, never on the turn clock.
- **`Interact`, not a generic verb reused from the old encounter stack.** The
  earlier `dnd5e.api.v1alpha2.encounter.Interact` (see "Relationship to the
  v1alpha2 encounter service" below) is a different, dead RPC on a different,
  dead service — this one is a fresh transcription of `session.Interact`,
  field-for-field, sharing nothing but a name.
- **`WorldNPCDescriptor.capabilities` and `.combat_policy` are plain
  strings, deliberately not enums.** The toolkit's own `npc.Capability` and
  `npc.CombatPolicy` are open, extensible string types with no fixed catalog
  (today's only capability value is `"vendor"`) — this seam mirrors that
  rather than inventing a closed set ahead of the SDK committing to one.
- **`VendorStockEntry.equipment_type` is also a plain string**, mirroring
  the toolkit's `shared.EquipmentType`. Checked against this repo's existing
  `dnd5e.api.v1alpha1.EquipmentType`/`EquipmentCategory` enums first — neither
  matches the toolkit's coarse vocabulary (weapon/armor/tool/pack/item/
  ammunition), and forcing a fit would mean deriving categorization this
  seam has no business deriving.
- **No `PlaceNPC` RPC.** Placing a vendor into a session is authored dungeon
  content (a `place:` entry keyed by an `npcs:`-namespaced ref, the same
  mechanism monster placement already uses), resolved server-side into a
  `PlaceNPC` call the same way a `monsters:` ref becomes `Spawn` — never a
  caller-facing RPC. See "Known gaps" for what's still open.

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

Through v0.13.0 the SDK gave that refusal its own sentinel — `ErrNoCrossing`,
*"no doorway joins those cells"* — distinct from `ErrBrokenPath` (the cells are
not adjacent at all) and `ErrBadPosition` (there is no cell there). **That
sentinel is gone as of v0.18.0**, and its removal is worth understanding rather
than working around: on one canvas the composition no longer distinguishes a
walled crossing from a missing cell, so nothing upstream could still produce it.
The SDK deleted it rather than leave a name nothing answers to. A walk stopped
by a wall now arrives as `ErrBadPosition`.

That collapse costs a client something real, and it is filed:
**rpg-toolkit#1135** — a locked door and a bad coordinate currently come back as
the same sentinel, so the tomb's most player-visible beat ("the door is locked,
DC 12") is indistinguishable on the wire from a client bug. `ErrLocked` exists
in the SDK for a door verb this seam does not expose yet; when #1135 lands, the
walk case joins it and nothing on this contract has to change.

> The `MoveInput` godoc warning that stood here — *"A WALK STILL DOES NOT CROSS
> A DOORWAY"*, stale since v0.12.0 and contradicted by its own code — is
> **resolved**. rpg-toolkit#1052 is closed and the paragraph is gone at v0.18.0.

## The Atlas

`GetAtlasResponse` is the whole map in one piece: one `grid` for the field,
which way its hexes point (`layout`), every `cell` sorted by coordinate, every
`prop` standing on it, every `boundary`, every `doorway` as a crossable cell
pair, and every `region` — a named set of those cells with its lighting.

**`regions` arrived 2026-08-23 (tag 9)**, ahead of its SDK by the same ruling
as the combat turn, as part of the Dungeon Builder restart (rpg-project PR
#255, slice rpg-project#256; toolkit side T1/T3 of the plan). `AtlasRegion`
is `{id, name, cells, archetype, lighting}`: the cells are absolute, sorted
with the same comparator as `cells`, and **every floor cell appears in exactly
one region** — no cell unowned, no cell shared. **Regions replace rooms.**
Nothing past the authored file has a room: no origin, no room-local frame, no
chain. A region is only a name over cells that already exist in `cells`, and
walls are still declared, not implied by it (below).

Regions are on the atlas because **lighting is a world fact, not a render
hint** — the ADR-0040/0041 argument again: a client that cannot read "this
hall is dark" off the wire re-derives it by experiment. `Lighting.intensity`
(0..1) is the dimmer on top of the region's archetype, carried from the
author *unread* by the composition; what an intensity means to perception is
a rule and lives in the rulebook. Audio will be a second field on
`AtlasRegion`.

`AtlasRegion.archetype` carries a law in its doc comment worth repeating
here: **an archetype never decides mechanics** — not start, not blocking,
not sight, not intensity. The dialect this replaces had an archetype that
silently chose where the party stood ("entrance" meant spawn here), the
rpg-toolkit#1033 trap; it is a presentation ref the assets resolve, and may
only say what they show and play. The builder (`AuthoringService.PutDungeon`,
[authoring-service.md](authoring-service.md)) answers with this very message,
so regions and lighting reach the builder the same way they reach the game.

**`layout` arrived at v0.20.0 (tag 8)**, and it exists because a client drew the
reference tomb as a diagonal staircase. Axial coordinates fix the topology —
the same six neighbours either way — and not the picture: the same cell set
laid out pointy-top and flat-top gives two different images. Nothing on the
wire said which, and the guess that looked right was wrong, because
`tools/spatial` had the two orientations running each other's offset schemes
(rpg-toolkit#1140 → #1141/#1143/#1145). With that corrected, the honest answer
is finally the authored one — and now the wire says it.

It is the **render** word, deliberately not the authoring word. The toolkit's
composition keeps `Orientation` — the frame an author typed offset cells in —
and the session seam consumes it when it enumerates the cells, never handing
it out. `layout` is what a client does with the cells it receives. Same two
values, a different question, and a different name so they cannot be confused
again (ADR-0040). Present exactly when `grid` is `HEX`; `UNSPECIFIED` on a
square map, which has no such thing. **Read it; do not infer it** — not from
the cells, not from the YAML, not from a bounding box.

**`props` replaced `occluders` at v0.18.0**, and the reason generalises past
this field. `occluders` was the subset of cells that blocked sight, carried as
bare coordinates — which could not tell a pillar from a statue
(rpg-project#227 filed it in exactly those words) and hardcoded **one** answer
to **two** independent questions. A coffin is walked around but seen over; a
pile of bones is neither. `AtlasProp` names what it is and answers both. A host
that wants the old list filters on `blocks_line_of_sight`.

It took a **new tag (7)** rather than a retype of 5. Reusing a tag while
changing its type is the one proto break that is *silent*: an old client
decoding `AtlasProp` bytes as `Position` would not fail, it would draw
furniture in the wrong places. Tag 5 and the name `occluders` are reserved.

**Walls are declared, not implied by rooms** — the migration hazard for
anything that authors a world for this service. When each chamber owned its own
grid, nothing crossed between chambers except through a declared doorway. On
one canvas, two chambers side by side are **one open space** until somebody
draws the seam. `boundaries` is therefore the whole answer to what a member
cannot walk through or see past; the room structure a world was authored from
is not on this wire and cannot stand in for it. The toolkit's tomb compiler
draws these automatically. Every hand-built world in the SDK's own tests
behaved wrongly until it did the same (rpg-toolkit#1130).

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
  monotonic and dense **per recipient**, not per session: each member's stream
  is numbered for that member alone, so two members receiving the same beat
  carry different numbers and neither number means anything in the other's
  stream (ruled on rpg-project#351, built in rpg-toolkit#1377). The dense
  numbering is what makes a gap honest — a member never observes a hole even
  though retention trims the shared story underneath. A client that notices a
  gap in its *own* numbering re-queries `GetStory` from its last known value.
  The stream carries no replay obligation, which is why there is no
  snapshot-then-deltas pattern here — the shape `StreamEncounter` and
  `StreamLobby` both use.

`EventKind` now has 19 named values plus `UNSPECIFIED`, with the retired
`TRAVERSED` number/name reserved. The vocabulary held unchanged from v0.9.0
through v0.13.0, then grew additively as typed session beats landed; clients
must match names rather than counts.

It is **open to growth by construction**: proto3 preserves an unrecognised enum
number rather than dropping it, so a kind added later (rpg-toolkit#959) reaches
an old client intact and that client's `seq` accounting keeps working.

`EVENT_KIND_UNSPECIFIED` (0) and `EVENT_KIND_UNKNOWN` (100) are deliberately
different: 0 means the producer failed to set a kind (a defect), while
`UNKNOWN` mirrors the SDK's own `session.EventUnknown` — a beat *this toolkit
version* does not recognise, delivered on purpose so the recipient still learns
its sequence advanced. Same distinction `HexState` draws in the v1alpha2
encounter package.

**`EVENT_KIND_TRAVERSED` outlived the verb it was named for, and then the beat
outlived it.** It survived the loss of the `Traverse` RPC on the SDK's own
argument — *one map does not mean one narration* — and v0.18.0 retired it
anyway, for the reason that argument could not answer: **the composition
stopped emitting the beat.** A crossing is written like any other step
(rpg-toolkit#1048, #1059), which was the entire point of absolute coordinates,
so nothing upstream can tell the two apart. A kind nothing can produce is worse
than no kind at all — it reads as a contract.

The information is not lost, only moved. `GetAtlasResponse.doorways` lists every
crossable pair, so a step whose `from`/`to` matches one **is** a traversal and a
client that draws doorways differently derives it there. Number 2 and the name
are reserved, so no future beat inherits either: a client still holding the old
generated enum keeps a symbol nothing will ever send, which is a dead branch,
not a misreading.

**`EVENT_KIND_DOWNED` is the addition**, and it is *downed*, not *down* — a bare
"down" also reads as **prone**, which is a posture the rulebook tracks on a
member still in the fight and still acting. A client narrating the two the same
way would say somebody died every time they were knocked flat (Kirk's ruling,
rpg-toolkit#1084). It carries kind and who, and nothing else; how much damage
produced it is a separate question with its own answer. Nobody announces it —
the composition asks the rulebook who is standing at every sight refresh, so it
arrives on whatever verb happened to refresh sight, frequently **not** the verb
that dealt the damage. There is deliberately no kind for coming back up:
nothing in v1 can revive a downed member.

## The combat turn (rpg-project#249) — merged ahead of its SDK

Everything else in this package was transcribed from a shipped tag. This
section was **ruled whole and merged first** (Kirk, 2026-08-22, design
`rpg-project/ideas/combat-turn/design.md`) so the toolkit, rpg-api and the web
client build against one shape in parallel rather than a chain of one-field
PRs. Nothing in it is invented — each field projects a rule the composition
already holds — but until the named toolkit issue closes, the proto comment
says *"lands with rpg-toolkit#n"* rather than *"mirrors session.X"*.

The production combat experience revision is an intentional in-place source
break: `Declaration.affordable = 3` is renamed to `available = 3`. Tag 3 and
its wire type remain fixed, but generated source accessors and the default JSON
name change from `affordable` to `available`, so this is a JSON-name/source
break. Removed declaration tags/names are reserved and the PR requires the
`breaking-change-approved` label.

| Addition | Where | Waits on |
|---|---|---|
| `enum Standing { UP, DOWNED }` | types | rpg-toolkit#1137 |
| `message Participant { member, name, kind, standing, active }` + `TurnResponse.participants = 5` | types, service | rpg-toolkit#1137 |
| `Seen.standing = 2` (sight-channel knowledge of who is up) | types | rpg-toolkit#1137 |
| `Sighting.name = 8` | types | rpg-toolkit#1137 |
| `enum DamageType` (13 values) + `message AttackRef { ref, name, damage_type }` + `AttackResponse.attack = 10` | types, service | rpg-toolkit#866 |
| `enum ShortfallReason`, `enum Currency`, `message Shortfall { reason, currency, needed, left, text }` + `Declaration.why = 7` | types | rpg-toolkit#1010 (structured form) |
| `TargetKind`, nested `TargetCandidate`, and `Declaration { available, why, id, attack, target_kind, candidates }`; removed `shortfall = 4` / `target = 6` reserved | types | session combat experience, rpg-project#270 |
| Attack blockers documented (turn / DOWNED / unreadable / target / budget); empty hand → `dnd5e:weapons:unarmed-strike` | service | rpg-toolkit#1010, #1168 |
| `oneof Event.body { TurnEnded, Downed, Struck, Missed, FightStarted, FightEnded, Moved }` (tags 10–16) | events | rpg-toolkit#941 |

Rulings carried into the shape (design §6):

- **Closed sets are enums; refs are strings.** `DamageType`,
  `ShortfallReason`, `Currency`, `Standing` are enums because a UI branches
  on them and the set is the rulebook's. `AttackRef.ref` stays a string because
  the catalog is open, but its value is now the complete `core.Ref.String()`
  (for example `dnd5e:weapons:longsword`), never a bare definition ID. The
  selected `Declaration.attack` must equal `AttackResponse.attack` and the
  corresponding `Struck.attack` or `Missed.attack`; one offered Attack cannot
  silently resolve as another.
- **Nested Attack declarations.** Reach is never computed client-side. One
  declaration represents one exact authored Attack/cost variant. Its candidate
  universe is every current live-sight holding (`CurrentVia` non-empty) except
  the actor, each exactly once; stale/undisclosed members are excluded and a
  live holding with no position fails Afford rather than disappearing. Available
  and unavailable candidates remain in the rows, and candidate `why` is present
  if and only if candidate `available=false`. The declaration and candidate
  booleans are independent gates. `TARGET_OUT_OF_REACH = 6` is candidate-level;
  `NO_TARGET_IN_REACH = 3` disables the top-level declaration without removing
  candidate rows.
- **Compiled and blocked presence is fixed.** Every compiled Attack,
  turn-clock Move, and End Turn has a non-empty ID. Every compiled Attack also
  carries its exact `AttackRef` and candidate rows. An early per-verb blocker
  remains a declaration—including an Attack that could not compile—with
  `available=false`, `why` present, empty ID, absent attack, empty candidates,
  and fixed target kind (Attack `MEMBER`, Move `PATH`, End Turn `NONE`). Compiled
  offers disabled by later gates retain their compiled fields. `remaining` is
  present only on Move and absent on Attack/End Turn. No declaration emits
  `UNSPECIFIED` target kind.
- **Selectors are echoed, not interpreted.** Attack and End Turn require a
  non-empty `declaration_id`. Turn-clock Move requires one; world-clock Move
  requires it empty. A non-empty selector received after a world-clock
  transition is stale and must not become a free move. Unknown, mismatched,
  stale, or now-unavailable selectors fail with `FAILED_PRECONDITION`.
- **Blockers are per verb.** `UNREADABLE` covers the character/action dependency
  matrix: Attack needs the character and compiled action, Move needs its own
  character/economy dependencies, and End Turn needs neither. DOWNED likewise
  blocks Attack and Move only. One bad/downed Attack must not erase independently
  executable Move or End Turn; End Turn is governed solely by clock/turn.
- **No magic boundary and no speculative targets.** This contract adds no
  spell, spell-slot, concentration, magical-resource, or magical-targeting
  field, and `TargetKind` has only `NONE`, `MEMBER`, and `PATH` beyond
  `UNSPECIFIED`. A later executor must earn any later kind.
- **Typed event bodies now, done properly.** rpg-toolkit#941's accepted
  direction — beats record a declared kind and a typed body, session projects
  them — not a stopgap over `kindOf`-unmarshals-the-JSON. A client reads
  `Event.body` and **never decodes `payload`**; `payload` remains for the kinds
  with no body yet (`JOINED`, `EXITED`, `ENDED`, `SCENE_OPENED`, `TICK`,
  `UNKNOWN`).
- **The declaration migration is explicitly source/JSON breaking.**
  `affordable = 3` becomes `available = 3`, changing generated source names and
  the default JSON name while preserving tag 3 and its wire type.
  `Declaration.shortfall` and flat `target` are removed and reserved;
  `why.text` is the sole prose refusal and `candidates` is the nested target
  list. The break is carried with `breaking-change-approved`.
- **Not a roster read.** `Participant` carries no position; it lists the
  members of the fight the asker is *in*, who have by construction seen each
  other. Where a participant stands is still `GetView`'s, gated by sight.

Deliberately not in this proto: monster behavior, ranged weapons and cover,
reactions/opportunity attacks, a session-level equip verb, magic,
spells, spell slots, concentration, magical resources, or future target kinds.

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

- **`Dissolve` covers only half of ending a fight, and the other half arrived
  exactly as predicted.** The party deciding to disengage is a verb. Defeat is a
  fact the world notices — and at v0.15.0 it landed as
  `DISSOLVE_KIND_BY_DEFEAT`, a second value of the same enum produced
  automatically, never a second RPC. The SDK sealing its `DissolveCause`
  interface with an unexported method is what made that the path of least
  resistance.

  The asymmetry this creates is worth stating plainly, because one enum now
  serves two directions with different rules: **`BY_DECISION` is the only cause
  a caller can honestly declare**, since the `Dissolve` verb *is* the decision.
  Sending `BY_DEFEAT` as a request cause does not fail the call and does not
  change the outcome — it simply does not survive contact with the answer, which
  reports what the world actually did. And only the **bubble** ends: the
  encounter stays open, the downed stay on the map and in the roster, and `Exit`
  still carries them out.

## Reconnect, and the gap that closed

Design rule 11 asked that a cold client be able to learn its own position from
reads alone. Through v0.12.0 it could not: `GetView` reports what a member
perceives and *skips self*, `GetStatus` is encounter-wide, and while `Member`
gained an absolute position at v0.11.0, no read returned a `Member`. A client
knew its own cell only by remembering the last `Move` it made — which holds
right up until the moment it matters: a reconnect, a fresh tab, a second
device, a response it never received.

**`session/v0.13.0` closed it, and `GetWhere` is that read on the wire.** A
cold client's reconnect is now three reads with no replay dependency for
position:

1. `GetWhere` — where am I
2. `GetAtlas` — what does the map look like (cache it; construction truth)
3. `GetStory` — what did I miss, from my last known `seq`

`GetStory` still matters, because story replay is how a client recovers *events*
it missed. What changed is that position is no longer derived from it.

**A second gap of the same shape opened at v0.15.0, and the combat-turn
contract closes it on the wire (SDK pending, rpg-toolkit#1137): a cold client
could not learn who is DOWNED.** `TurnResponse.participants[].standing` and
`Seen.standing` are that read. The rest of this paragraph describes the gap
as it stood. `EventDowned` fires once on the stream, and
nothing readable carries the state afterwards — `Member` is `{id, kind,
position}`, `GetStatus` is `{open, outcome}`, and `Sighting.status`
distinguishes a live sighting from a stale memory, not an upright member from a
fallen one. So the three-read recipe above recovers where everybody is and
nothing about whether they are standing, and a client that reconnects mid-fight
draws the whole party on its feet. Filed as **rpg-toolkit#1137**; it wants the
same treatment `GetWhere` got — a read, not a replay dependency.

**Why there is no roster read**, and this is the part worth not "improving"
later: a read returning everybody's positions would hand a client the cells of
members it has never perceived — around a corner, in a room it has not entered,
behind a door it has not opened. That is precisely the fog-of-war leak design
rule 4 exists to prevent. Where somebody *else* is, is `GetView`'s answer, and
`GetView` reports only what the observer actually holds. The singular shape of
`GetWhere` is the design, not a first cut.

## Known gaps, inherited and stated rather than papered over

- **`Attack` is character-attackers-only.** The SDK's stated scope: a monster's
  action can declare a save gate this seam has no vocabulary for. It arrives
  with the work that calls for it.
- **The combat-turn fields are on the wire before the SDK.** `Participant`,
  `Standing`, `Sighting.name`, full-ref `AttackRef`, `Shortfall`, nested
  declarations/candidates and the typed `Event.body` are contract today and
  projection tomorrow:
  rpg-api leaves them unset until rpg-toolkit#1010/#1137/#866/#941/#1168 tag.
  A client written against them renders what arrives and must not treat an
  unset `body` or an empty `participants` as a defect meanwhile.
- ~~**The economy spends, but nothing reports a budget.**~~ Closed at
  session/v0.21.3 by `Afford` (**rpg-toolkit#1138**, ADR-0042): the budget
  *before* the refusal is now on the wire as `Declaration`s — can-or-cannot per
  gated verb — rather than as remaining currencies, so the client still never
  learns that a swing costs an action. `SLOT_NONE` is a value distinct from
  `SLOT_UNSPECIFIED` because the SDK spells it `""`: a banked Extra Attack
  swing lights no shape, and rpg-api's projection must map that explicitly
  rather than let Go's zero value fall through to proto's 0.
- ~~**A fight is a clock nobody can move on.**~~ Closed by rpg-toolkit#1169
  (encounter #1170, session #1171): the active member of a bubble walks through
  the same `Move` RPC, paying movement for the whole path up front. What a
  non-active bubble member gets is `ErrNotYourTurn`, not the old `ErrInBubble`.
  `Declaration.remaining` is the one `optional` scalar on this seam — the
  pointer-optional law (Outcome/Formed), not the bool law. `optional` on a
  proto3 scalar is what keeps absent and `0` distinct in both generated SDKs;
  the hand-written suite that once re-checked this was removed 2026-08-23
  (generation is the evidence).
- **No door state or locks on the wire.** A doorway is crossable or absent.
  `ErrLocked` exists in the SDK for a door verb this seam does not expose, and a
  walk into a locked door still returns `ErrBadPosition` (rpg-toolkit#1135), so
  a fiction beat and a client bug are currently the same sentinel.
- **No `PlaceNPC` on the wire, and none planned.** Same shape of absence as
  `Spawn`: a placed world NPC (vendor or otherwise) is authored dungeon
  content, seated server-side the same loop `Spawn` already uses, never a
  caller-driven RPC. See "World NPCs" below.
- **`Interact` cannot yet drive a purchase.** `WorldNPCDescriptor.inventory`
  is read-only — display data, no prices, no buy/sell/quote RPC. That's
  rpg-toolkit#1275, still open on the toolkit side.
- **No hostile or disposition-bearing world NPCs.** Every `MEMBER_KIND_WORLD`
  member is structurally non-combatant — excluded from the toolkit's own
  fight-detection code, not merely defaulted that way. rpg-toolkit's own
  design docs note this is deliberately unresolved, not just unbuilt.

## Relationship to the v1alpha2 encounter service

**No runtime service/state path.** `SessionService` still never imports or calls
the old encounter stack, which is why this package mints its own `Position`
rather than importing `dnd5e.api.v1alpha2.encounter.Position`. The one contract-
type edge points the other way: the surviving authenticated-owner
`v1alpha2.encounter.CharacterData` imports the session-owned `LifeState` and
`DeathSaveProgress` definitions so owner and turn projections use identical
vocabulary instead of duplicating life-state semantics. That historical
message's legacy encounter use remains owner-gated and shares no runtime state
with SessionService.

The two stacks coexist until cutover, with server configuration selecting which
one `StartEncounter` creates on — exactly one, never both. At cutover the
v1alpha2 encounter package is removed in place (every consumer moves in the
same swap), per the versioning trigger in `rpg-project/CLAUDE.md`.

## Status

Proto-only as of this doc. rpg-api's implementation (W2 of `rpg-project#227`)
is open as **rpg-api#797**, written and aligned against **v0.13.0** — so it
absorbs this delta: the `occluders` translation becomes `props`, the error table
loses `ErrNoCrossing` and gains `ErrLocked` / `ErrDowned` / `ErrCannotAfford` /
`ErrBadCost` (35 sentinels → 38), and `DOWNED` / `BY_DEFEAT` become reachable
values it must map. No `rpg-dnd5e-web` client usage yet (W3). Not a "live"
service by this repo's usual definition — re-grade once the rpg-api PR lands.
