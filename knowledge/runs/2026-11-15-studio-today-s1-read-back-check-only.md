# Run — 2026-11-15 — Studio today S1 read-back on the check only

processed: 2026-11-25T190427Z

Slice [rpg-project#967](https://github.com/KirkDiggler/rpg-project/issues/967) of story [rpg-project#966](https://github.com/KirkDiggler/rpg-project/issues/966). Base: `rpg-api-protos` `main` at [`815a96b`](https://github.com/KirkDiggler/rpg-api-protos/commit/815a96bda716848d784d02cca6807427e2f00ae9).

## Shipped

- Comments only on `PutDungeonResponse`: the two-shapes header and the `read_back` field say the read-back is present only on a validate_only check of a compiled site document, never on a save; no field, number or message changed — [rpg-api-protos#441 follow-up](https://github.com/KirkDiggler/rpg-api-protos/pull/441).

## Decided

- The read-back rides the check, not the save, because the client already holds the read-back of the check it made before saving and computing it again on a save doubles the cost of every castle save; the api is changed to match — [rpg-api#1246](https://github.com/KirkDiggler/rpg-api/pull/1246).
- The comment states the reason (the client holds the check's read-back) rather than only the rule, so a later reader does not "fix" the save to carry it — [rpg-project#967](https://github.com/KirkDiggler/rpg-project/issues/967).

## Found

- The first contract (#441) said the read-back was set whenever a site document compiled, save included; rpg-api CI measured the save cost that contract implied — [rpg-api#1246](https://github.com/KirkDiggler/rpg-api/pull/1246).
- `make test` (lint, format check, new-file options policy, breaking against `main`) passes on the comment change — [rpg-project#967](https://github.com/KirkDiggler/rpg-project/issues/967).

## Mistaken

- #441 wrote the presence rule without validate_only, though design law R25 already said the read-back rides the check; the plan's Behavior line named compile and dialect but not the check, and the builder copied it without reading R25 — [rpg-api-protos#441](https://github.com/KirkDiggler/rpg-api-protos/pull/441).
