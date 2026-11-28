# Run — 2026-11-28 — second ability 5d-2 a use value says it needs a count

Slice [rpg-project#1264](https://github.com/KirkDiggler/rpg-project/issues/1264) of story [rpg-project#1131](https://github.com/KirkDiggler/rpg-project/issues/1131). Base: `rpg-api-protos` `main` at [`8bc21d0`](https://github.com/KirkDiggler/rpg-api-protos/commit/8bc21d0).

One line per entry. Every line ends with a link.

## Shipped

- Field `bool needs_count = 4` on `ItemWordValue` in `dnd5e/api/authoring/v1alpha1/service.proto`, mirroring the rules' `kits.Value.NeedsCount` — [slice](https://github.com/KirkDiggler/rpg-project/issues/1264).

## Decided

- The field is true only for a value of `use` whose entry must also write `uses` or a `cost`; false for every other value — [slice](https://github.com/KirkDiggler/rpg-project/issues/1264).

## Found

- F1 holds: `ItemWordValue` had fields 1 to 3 and no field 4 on origin/main — [slice](https://github.com/KirkDiggler/rpg-project/issues/1264).
- F2 holds: the only hits for `ItemWordValue` are in `service.proto` (lines 894, 907, 921, 923) and the run file `knowledge/runs/2026-11-26-the-item-words-on-the-wire.md`; no doc lists the message's fields, so none needs a line — [slice](https://github.com/KirkDiggler/rpg-project/issues/1264).

## Mistaken

- none observed — [slice](https://github.com/KirkDiggler/rpg-project/issues/1264).
