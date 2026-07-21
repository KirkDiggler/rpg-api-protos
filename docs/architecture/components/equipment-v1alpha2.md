---
name: Equipment (v1alpha2)
description: Character-scoped equip/unequip RPCs and CharacterData's equipment fields — live in rpg-api since rpg-api#682, not yet adopted by rpg-dnd5e-web
updated: 2026-07-21
confidence: high — verified by reading dnd5e/api/v1alpha2/character/service.proto and encounter/types.proto end-to-end, and by grepping rpg-api / rpg-dnd5e-web **at origin/main** for consumers (see "Live consumers" for why that qualifier matters)
---

# Equipment (v1alpha2)

The equipment slice (rpg-api-protos#187 → PR #188) added a character-scoped
equip/unequip RPC pair and five equipment fields on `CharacterData`. **This is
live**: rpg-api serves both RPCs and populates every equipment field through
the toolkit's rules engine, as of rpg-api#682 (merged 2026-07-21, closing
rpg-api#680). rpg-dnd5e-web has not adopted it yet — see "Live consumers"
below for exactly what that split means.

## File and shape

- `dnd5e/api/v1alpha2/character/service.proto` — 55 lines. One service
  (`CharacterService`), two RPCs (`EquipItem`, `UnequipItem`).
- `dnd5e/api/v1alpha2/encounter/types.proto` — `CharacterData` (line 232),
  `Item` (281), `SlotDef` (292), `ArmorClassDisplay` (299), `Ref` (21). The
  character service imports this file rather than owning these types itself
  — see "The Ref dependency" below for why that's a known, deliberately
  deferred wart rather than an oversight.

## Why equip/unequip is a separate character-scoped service

`CharacterService` is explicitly **out-of-encounter**: sheet editing between
encounters, not a combat action. The proto comment on `EquipItemRequest` is
direct about the alternative that was considered and deferred:

> Character-scoped, out of combat (protos#187 design doc: encounter-scoped
> equip with an action-economy cost is deferred to rpg-project#94).

In-encounter equipment changes (if/when they exist) will ride the encounter
event stream like any other state change, not this service — per
`CharacterData`'s doc comment and the `CharacterService` doc comment in
`service.proto`.

## RPCs

| RPC | Request | Response | Notes |
|---|---|---|---|
| `EquipItem` | `character_id`, `Ref item`, `slot_key` | full `CharacterData` | Two-handed occupancy and slot-swap semantics are toolkit rules — the caller sends only a `Ref` + slot key. The toolkit may displace an existing occupant back to inventory; the response reflects that. |
| `UnequipItem` | `character_id`, `slot_key` | full `CharacterData` | Clears the slot, returns its occupant to inventory. |

Both responses carry a full `CharacterData`, not a diff or a bare success
flag — "same `CharacterData` shape the encounter hydrates, so a client
rendering both surfaces uses one type" (`service.proto:25`). This is a
deliberate one-shape decision: the alternative (a separate `EquippedItem`
wrapper type for the character-sheet view) would force the web to reconcile
two representations of the same item.

## `CharacterData`'s equipment fields

`CharacterData` (line 232) is the message that already rides inside
`Entity.data` for player characters in an encounter snapshot. PR #188 added
five equipment fields to it rather than inventing a parallel
equipment-specific message — the design rationale, from the proto comment:
the character HUD/sheet reads equipment off the same hydrated `CharacterData`
the encounter already snapshots, so there's no separate fetch on popover
open (rpg-dnd5e-web#531 CONTRACT.md §8 — a second source of truth would
disagree with the encounter's view of the character).

| Field | Type | What it is |
|---|---|---|
| `equipped` | `map<string, Ref>` | slot key → the `Ref` of the item worn/wielded there. Slot keys are opaque strings to the web, defined by `slots` below. |
| `inventory` | `repeated Item` | every item the character owns, **including** currently-equipped ones. An equipped item's entry here is what `equipped[slot_key]` points at — one list is the source of truth, `equipped` is purely a slot index into it. |
| `slots` | `repeated SlotDef` | the character's equip-socket taxonomy, server-owned so classes/homebrew can add slots without a web release. The web filters by `Item.slot_keys` / `SlotDef.accepts`; it never hardcodes slot keys. |
| `armor_class_detail` | `ArmorClassDisplay` | the sheet/HUD AC readout: total + a server-composed note. |
| `main_hand_damage` | `string` | resolved main-hand damage display, occupancy-dependent (versatile/two-handed/off-hand vary the string) — can't be read off `Item.stat_line`, which is the item's own static stat line. |

### Why `armor_class_detail` duplicates `Entity.armor_class`

`CharacterData` sits inside `Entity`, which already has a flat
`optional int32 armor_class = 7` used by every entity type (including
monsters, which have no `armor_class_detail`). `armor_class_detail` isn't
redundant despite the overlap: the character-scoped `EquipItem`/
`UnequipItem` RPCs return a **bare** `CharacterData` with no surrounding
`Entity` — `armor_class_detail.total` is the only AC total available on
that response; there's nowhere else to put it. Inside an encounter
snapshot, where `CharacterData` does ride inside an `Entity`, rpg-api is
expected to keep the two in sync (`armor_class_detail.total ==
Entity.armor_class`); `Entity.armor_class` stays the flat cross-entity
value monsters use, with no note at all.

## `Item`, `SlotDef`, `ArmorClassDisplay`

```proto
message Item {
  Ref ref = 1;              // {module:"dnd5e", type:"item", id:"longsword"}
  string name = 2;
  string stat_line = 3;     // "1d8 slashing · versatile", "AC 16 · heavy"
  string icon_key = 4;      // reference key into the asset-owned manifest
  string kind = 5;          // "weapon" | "shield" | "armor" | "gear" — open vocabulary, not an enum
  repeated string slot_keys = 6; // e.g. ["main_hand", "off_hand"]
}

message SlotDef {
  string key = 1;            // "main_hand", "off_hand", "armor" — opaque to the web
  string display_label = 2;
  repeated string accepts = 3; // item kinds this slot accepts, e.g. ["weapon", "shield"]
}

message ArmorClassDisplay {
  int32 total = 1;
  string note = 2;           // server-composed breakdown, rendered verbatim
}
```

**`stat_line`, `note`, and `main_hand_damage` are server-composed strings,
rendered verbatim.** The web never assembles a damage or AC breakdown from
rules data — that would put game rules in the client, which the boundary
rule forbids. Confirmed against rpg-api's actual composition code
(`internal/handlers/dnd5e/v2/encounter/character_data.go`,
`BuildEquipmentCharacterData`): every field is a pass-through or
`Ref`-translation of `rpg-toolkit`'s `EquipmentView` — `ArmorClassDisplay`
carries the toolkit's own `EffectiveAC()` result (`view.ACTotal`/
`view.ACNote`), not a stored int. Per that file's doc comment, this fixed
a named bug: before rpg-api#680, AC on the wire was "a straight copy of a
stored int instead of EffectiveAC."

**`icon_key` is currently unpopulated — a deliberate, cited Scope-decision,
not an oversight.** From `character_data.go` (still true on `origin/main`
as of rpg-api#682):

> IconKey intentionally left empty (rpg-api#680 Scope-decision): no
> toolkit/asset-manifest source exists yet for a bare sprite key — the
> fixture data rpg-dnd5e-web#557 ships is a full sprite path, not a key.
> Composing one in rpg-api would be exactly the kind of display-field
> invention this slice exists to stop.

`kind` and `slot_keys` are open vocabulary (plain strings), not enums — a
different design choice than the typed `Weapon`/`Armor` enums described
below, made because `Item` predates the refgen pattern.

## Relationship to the `Weapon`/`Armor` enums — not wired in yet

`rpg-api-protos#190` (see
[regenerate-content-enums.md](../../how-to/regenerate-content-enums.md))
generated `dnd5e.api.v1alpha2.weapons.Weapon` and
`dnd5e.api.v1alpha2.armor.Armor` as a typed alternative to `Ref` for content
the toolkit registries enumerate. **`Item.ref` is still a plain
`Ref { module, type, id }` today** — the two enums exist as standalone
proto packages with no importer. Per #190's scope: "no equipment `Item`
rebase in this PR — that's the next increment once this pattern is proven
end to end." Don't assume `Item` carries a typed `Weapon`/`Armor` field;
grep before relying on it.

## The `Ref` dependency (and the deferred relocation)

`Ref` (`encounter/types.proto:21`) is a universal reference primitive —
`{module, type, id}` — used everywhere the wire identifies a piece of
toolkit content. It's defined only in the `encounter` package, and v1alpha2
has no `common`/`core` package (v1alpha1 had one; v1alpha2 didn't migrate
it). So `character/service.proto` imports `encounter/types.proto` just to
name a `Ref` and to return a `CharacterData`.

This was flagged and consciously deferred, not missed: **rpg-api-protos#189**
tracks relocating `Ref` (and likely `CharacterData`) into a shared
`dnd5e/api/v1alpha2/common` package. It's deferred rather than done in #188
because **rpg-dnd5e-web imports `RefSchema` directly from the `encounter`
package today** — relocating `Ref` is a breaking package-path move for every
importer, and with a live web import in the mix it needs a coordinated
api+web cut, not a protos-only PR. The equipment slice shipped with
`encounter`-owned `Ref` as a documented Scope-decision on #188 rather than
block on the relocation. #189 captures the two options (relocate now vs.
defer until a third importer or an actual import cycle forces it) as an
open decision for Kirk — not yet resolved as of this writing.

## Live consumers

**A note on method before the finding:** the first version of this doc got
this section backwards, because the check ran against a stale local rpg-api
clone (checked out well behind `origin/main`) instead of fetching first.
Verify consumer state at `origin/main` — `git fetch origin` then
`git grep ... origin/main`, or `git show origin/main:path` — never a local
working copy, which routinely drifts behind in this workspace. The
corrected finding, verified that way:

- **rpg-api is live.** `go.mod` on `origin/main` pins
  `github.com/KirkDiggler/rpg-api-protos/gen/go
  v0.0.0-20260721173744-7212a2d922f3` — the commit is a strict superset of
  both PR #188 (equipment) and PR #191 (refgen) on the `generated` branch,
  not a predecessor. `internal/handlers/dnd5e/v2/character/handler.go`
  implements `EquipItem`/`UnequipItem`, calling the **same orchestrator
  method** (`internal/orchestrators/character`'s `EquipItem`/`UnequipItem`)
  the v1alpha1 handler already used — occupancy and slot-compatibility rules
  are enforced exactly once, in the toolkit, for both API surfaces.
  `cmd/server/server.go:191` registers it on the gRPC server
  (`characterv2pb.RegisterCharacterServiceServer`).
  `internal/handlers/dnd5e/v2/encounter/integration_equipment_test.go`
  exercises the full equip → snapshot flow: equip through the toolkit's
  rules, assert `armor_class_detail.total` matches the toolkit's own
  `EffectiveAC()`, assert `Entity.armor_class` stays in sync, assert
  equipping a two-handed weapon clears `off_hand` as an occupancy side
  effect. Landed as rpg-api#682 ("serve equipment on the wire — equip
  through toolkit rules, real AC"), closing rpg-api#680, merged
  2026-07-21T18:26:37Z.
- **rpg-dnd5e-web has not adopted it.** `package.json` on `origin/main`
  still pins `@kirkdiggler/rpg-api-protos` at `v0.1.108` — the same
  pre-#188/#191 commit as before. `src/api/equipmentHooks.ts` does call an
  `EquipItem`/`UnequipItem` pair, but imports them from
  `dnd5e/api/v1alpha1/character_pb` — the **v1alpha1** service, not this
  one. Grepping `origin/main`'s `src/` for `v1alpha2/character` or
  `v2/character` returns nothing. The web-side swap to this contract is
  still ahead, not started.

`CharacterData` itself is not new — its base fields (`class_ref`,
`race_ref`, `player_id`) were already populated by the live encounter v2
orchestrator before this slice. What #188/#682 add is real population of the
five equipment fields, shared between two call paths via one exported
function (`BuildEquipmentCharacterData`, in
`internal/handlers/dnd5e/v2/encounter/character_data.go`): the encounter
snapshot path and the out-of-encounter `EquipItem`/`UnequipItem` responses
compose `CharacterData`'s equipment fields identically, so a client reading
both surfaces never sees them disagree.

Next step for whoever picks up the web side: bump `@kirkdiggler/rpg-api-protos`
past `v0.1.108`, then build the v1alpha2-equivalent of `equipmentHooks.ts`
against `dnd5e/api/v1alpha2/character`.

## Known rough edges

- **No proto-level enum for `kind`/`slot_keys` on `Item`** — open-vocabulary
  strings today (see above). Consistent with how `equipment_types.proto`'s
  v1alpha1 `Equipment.kind` works, but inconsistent with the typed-enum
  direction #190 establishes for weapons/armor.
- **`icon_key` is a real field with no producer yet** — see above. Not a
  contract defect, just incomplete: the asset-manifest side doesn't exist.
- **The `Ref` import direction is backwards from ideal layering**
  (`character` → `encounter` for a primitive that conceptually belongs
  below both) — tracked, not fixed. See #189.

## Confidence and what's not verified

- RPC shapes and message field numbers verified by direct read of
  `service.proto` and `types.proto`.
- "Live in rpg-api" claim verified against **`origin/main` after
  `git fetch`**, not a local working copy: `go.mod`'s pin checked with
  `git merge-base --is-ancestor` against PR #188/#191's commits (both are
  ancestors of the pin, not descendants); handler, server wiring, and
  integration test read directly via `git show origin/main:<path>` and
  `git grep ... origin/main`. A consumer-side commit landed after this
  doc's `updated:` date would invalidate it — speak up if you find one.
- "Web has not adopted it" claim verified the same way, also at
  `origin/main`: pin unchanged at `v0.1.108`, `equipmentHooks.ts` still
  imports v1alpha1, zero grep hits for `v1alpha2/character`/`v2/character`
  in `src/`.
- `icon_key` unpopulated claim verified by reading
  `character_data.go` at `origin/main` directly — the Scope-decision
  comment quoted above is the actual source, not an inference from absence.
- Have not independently verified the toolkit-side `EffectiveAC()`/
  `EquipmentView` composition logic beyond what `character_data.go`'s
  comments assert — that's `rpg-toolkit` territory, out of scope for a
  protos-repo doc.

## See also

- [regenerate-content-enums.md](../../how-to/regenerate-content-enums.md) —
  the `Weapon`/`Armor` enums this doc's "not wired in yet" section refers
  to.
- [character-service.md](character-service.md) — the v1alpha1
  `CharacterService`, a much larger, already-live service in a different
  package.
- [shared-types.md](shared-types.md) — v1alpha1's `common.proto`/
  `equipment_types.proto`, the predecessor shapes this v1alpha2 slice
  doesn't reuse (different package, no migration path defined yet).
