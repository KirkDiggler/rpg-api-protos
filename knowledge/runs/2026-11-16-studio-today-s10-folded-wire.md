# Run — 2026-11-16 — Studio today S10 folded read-back on the wire

processed: 2026-11-25T190427Z

Slice [rpg-project#978](https://github.com/KirkDiggler/rpg-project/issues/978) of story [rpg-project#966](https://github.com/KirkDiggler/rpg-project/issues/966). Base: `rpg-api-protos` `main` at [`e5131d2`](https://github.com/KirkDiggler/rpg-api-protos/commit/e5131d28538d30b9090f23542e843744acaafdea).

## Shipped

- `ReadBackFoldedSection{title=1, items=2}`, `ReadBackFoldedItem{text=1, paths=2, base=3, items=4}` and `repeated ReadBackFoldedSection folded = 5` on `ReadBack`; the protos half of the slice, the api maps `ReadBack.Folded()` onto it — [rpg-project#978](https://github.com/KirkDiggler/rpg-project/issues/978).

## Decided

- The messages mirror the exported JSON of `readback.FoldedSection` and `readback.Item` field for field; the unexported `terse` display flag stays off the wire because the JSON does not carry it and `paths` still holds every path it hides — [folded.go](https://github.com/KirkDiggler/rpg-toolkit/blob/main/rulebooks/dnd5e/encounter/dungeonspec/readback/folded.go).
- `folded` sits on `ReadBack` beside `sections`, not on `PutDungeonResponse`, so it is present exactly when the read-back is (a validate_only check) and the two cannot be sent apart — [rpg-project#978](https://github.com/KirkDiggler/rpg-project/issues/978).
- The comment tells a client never to fold statements itself and to open an item by matching its `paths` against `sections`, because the fold's wording is the engine's and the studio writes no sentence of its own — [rpg-project#978](https://github.com/KirkDiggler/rpg-project/issues/978).
- `base` is documented as a display hint inherited down the tree until an entry sets its own, with `paths` always whole, because that is how the engine's own writer uses it — [folded.go](https://github.com/KirkDiggler/rpg-toolkit/blob/main/rulebooks/dnd5e/encounter/dungeonspec/readback/folded.go).

## Found

- `Folded()` is a method, not a field of the read-back's JSON, so `ReadBack`'s "mirrors the exported JSON" comment was narrowed to fields 1-4 and the `folded` comment names its producer — [folded.go](https://github.com/KirkDiggler/rpg-toolkit/blob/main/rulebooks/dnd5e/encounter/dungeonspec/readback/folded.go).
- The engine's text writer drops some paths from a terse item's display; a client that shows `paths` as given shows more than the engine's text form does, with nothing lost — [folded.go](https://github.com/KirkDiggler/rpg-toolkit/blob/main/rulebooks/dnd5e/encounter/dungeonspec/readback/folded.go).
- `make test`, `make generate` and `make compile-go` pass locally; the generated TypeScript exports `ReadBackFoldedSection` and `ReadBackFoldedItem` and `ReadBack.folded` — [rpg-project#978](https://github.com/KirkDiggler/rpg-project/issues/978).

## Mistaken

- none observed — [rpg-project#978](https://github.com/KirkDiggler/rpg-project/issues/978).
