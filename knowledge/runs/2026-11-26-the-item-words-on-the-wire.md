# Run — 2026-11-26 — item story S2 the item words on the wire

Slice [rpg-project#1187](https://github.com/KirkDiggler/rpg-project/issues/1187) of story [rpg-project#850](https://github.com/KirkDiggler/rpg-project/issues/850). Base: `rpg-api-protos` `main` at [`6cc9e941`](https://github.com/KirkDiggler/rpg-api-protos/commit/6cc9e941a41b7e4278fa2bb039a9e84410d7368a).

One line per entry. Every line ends with a link.

## Shipped

- `rpc GetItemWords` on `AuthoringService` after `SayStatus`, and messages `GetItemWordsRequest`, `GetItemWordsResponse`, `ItemWord`, `ItemWordValue`, `ItemNumberBounds` after `StatusSaidPart`, all in `dnd5e/api/authoring/v1alpha1/service.proto` — [slice](https://github.com/KirkDiggler/rpg-project/issues/1187).

## Decided

- `place`, `shape` and `holds` are open strings owned by the engine, never enums, so a rules release that adds one needs no proto release — [slice design](https://github.com/KirkDiggler/rpg-project/issues/1187).
- `ItemNumberBounds` says a cost's `charges` is limited by the item's own `charges.max`, which the table reports as no upper limit; the dungeon check refuses a cost the item cannot pay — [slice design](https://github.com/KirkDiggler/rpg-project/issues/1187).

## Found

- F1 holds: `rpc SayStatus` is at line 146 and is the last RPC of the service — [comment](https://github.com/KirkDiggler/rpg-project/issues/1187#issuecomment-7185226493).
- F2 holds: the five status messages GetStatusWordsResponse, StatusWord, StatusWordValue, StatusNumberBounds and StatusSaidPart are at lines 753, 767, 808, 821 and 861 — [comment](https://github.com/KirkDiggler/rpg-project/issues/1187#issuecomment-7185226493).
- F3 holds: the grep for GetItemWords, ItemWord and ItemNumberBounds on origin/main printed 0 — [comment](https://github.com/KirkDiggler/rpg-project/issues/1187#issuecomment-7185226493).
- F4 holds, field by field. Word: word=ItemWord.word, Place=place, Shape=shape, Values=values, Holds=holds, Required=required, Bounds=bounds, Label=label. Value: Word=ItemWordValue.word, Label=label, With=with. Bounds: Min=min, Max=max, NoMax=no_max. No field is without a home — [words.go at v0.237.0](https://github.com/KirkDiggler/rpg-toolkit/blob/rulebooks/dnd5e/v0.237.0/rulebooks/dnd5e/magicitems/words.go).
- F5 holds: `make test` passed on the clean worktree before any change — [comment](https://github.com/KirkDiggler/rpg-project/issues/1187#issuecomment-7185226493).
- After the change `make format` left no diff beyond the added lines and `make test` passed; the diff against origin/main is 79 added lines in the proto and the new run file — [slice checks](https://github.com/KirkDiggler/rpg-project/issues/1187).

## Mistaken

- none observed — [slice](https://github.com/KirkDiggler/rpg-project/issues/1187).
