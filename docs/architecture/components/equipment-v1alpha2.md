---
name: Equipment (v1alpha2)
description: Character-scoped equip/unequip RPCs and CharacterData's equipment fields — wire shape only, no live consumer yet
updated: 2026-07-21
confidence: high — verified by reading dnd5e/api/v1alpha2/character/service.proto and encounter/types.proto end-to-end, and grepping rpg-api / rpg-dnd5e-web for consumers
---

# Equipment (v1alpha2)

The equipment slice (rpg-api-protos#187 → PR #188) added a character-scoped
equip/unequip RPC pair and five equipment fields on `CharacterData`. It's a
proto-only contract today — see "Live consumers" below before assuming
anything here is wired into a running server.

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
rule forbids. The toolkit composes `ArmorClassDisplay.note` as a display
projection over its effective-AC calculation; rpg-api and the web pass it
through unchanged.

**`icon_key` is currently unpopulated.** It's a reference key into an
asset-owned manifest that doesn't exist yet — verified by grep, there is no
`IconKey`/`icon_key` reference anywhere in rpg-api's orchestrator. The field
is real contract, waiting on the asset-manifest mapping, not dead weight.

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

**Neither consumer has picked up this contract yet.** Checked directly:

- **rpg-api** pins `github.com/KirkDiggler/rpg-api-protos/gen/go` at a
  pseudo-version (`v0.0.0-20260720043951-c3059bc89397`) whose commit
  predates both PR #188 (equipment) and PR #191 (refgen) on the `generated`
  branch (`git merge-base --is-ancestor` confirms both post-date the pin).
  There is no `v1alpha2/character` or `characterpb` reference anywhere in
  `rpg-api/internal` — the `EquipItem`/`UnequipItem` RPCs this doc describes
  have no server-side handler.
- **rpg-dnd5e-web** pins `@kirkdiggler/rpg-api-protos` at `v0.1.108` — the
  same pre-#188/#191 commit. `src/api/equipmentHooks.ts` does call an
  `EquipItem`/`UnequipItem` pair, but imports them from
  `dnd5e/api/v1alpha1/character_pb` — the **v1alpha1** service, not this
  one.

`CharacterData` itself is not new — its base fields (`class_ref`,
`race_ref`, `player_id`) are already populated by the live encounter v2
orchestrator (`rpg-api/internal/orchestrators/encounter/v2/`). Only the five
equipment fields added in #188 are unconsumed.

Next step for whoever picks this up: bump both repos past the #188/#191
merge point before wiring handlers — otherwise the generated Go/TS types
these RPCs need don't exist in the consumer's vendored SDK.

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
- "No live consumer" claim verified by: (a) comparing each consumer's
  pinned `rpg-api-protos` version against the `generated` branch's commit
  history via `git merge-base --is-ancestor`; (b) grepping both consumer
  repos for the new package/message names. A consumer outside this
  workspace, or an in-flight branch not yet pushed, would invalidate this —
  speak up if you find one.
- `icon_key` unpopulated claim verified by grep across
  `rpg-api/internal` for `IconKey`/`icon_key` — zero hits.
- Have not verified the toolkit-side `EffectiveAC()`/equipment-view
  composition logic this contract assumes exists — that's `rpg-toolkit`
  territory, out of scope for a protos-repo doc.

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
