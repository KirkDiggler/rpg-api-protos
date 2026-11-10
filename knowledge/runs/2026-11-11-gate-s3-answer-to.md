# Run — 2026-11-11 — gate conversation S3 answer to

Slice [rpg-project#923](https://github.com/KirkDiggler/rpg-project/issues/923) of story [rpg-project#769](https://github.com/KirkDiggler/rpg-project/issues/769). Base: `rpg-api-protos` `main` at [`2c5324d`](https://github.com/KirkDiggler/rpg-api-protos/commit/2c5324d1).

One line per entry. Every line ends with a link: a PR, an issue comment, a commit, or a design section anchor. This file rides on the work PR, under the `knowledge/runs/` of the lowest directory that contains everything the PR changed. The ingest reads it once and adds a `processed:` line at the top; nobody else edits it after merge.

## Shipped

- `session.v1alpha2.TableAnswer.to = 13` (`Party`): the member a creature's spoken answer to a hail or bump is addressed to — [rpg-project#923](https://github.com/KirkDiggler/rpg-project/issues/923).

## Decided

- `to` reuses `Party` (the type of `who`) rather than a bare member id string, so speaker and listener name parties the same way — [rpg-project#923](https://github.com/KirkDiggler/rpg-project/issues/923).
- Unset, not an empty party, for a table pick, a line to nobody in particular and a prop; presence is the message's own — [rpg-project#923](https://github.com/KirkDiggler/rpg-project/issues/923).
- Field 13 is the next free number on `TableAnswer`; nothing renumbered or reserved — [rpg-project#923](https://github.com/KirkDiggler/rpg-project/issues/923).

## Found

- The need came from the operator's early look on Gate S3: the guard's spoken answer did not say who it was spoken to — [rpg-project#923](https://github.com/KirkDiggler/rpg-project/issues/923).

## Mistaken

- none observed — [rpg-project#923](https://github.com/KirkDiggler/rpg-project/issues/923).
