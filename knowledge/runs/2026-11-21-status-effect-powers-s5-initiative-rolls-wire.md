# Run — 2026-11-21 — Status effect powers S5 initiative rolls on the wire

Slice [rpg-project#1048](https://github.com/KirkDiggler/rpg-project/issues/1048) of story [rpg-project#1036](https://github.com/KirkDiggler/rpg-project/issues/1036). Base: `rpg-api-protos` `main` at [`94b501dc0ad78fc00d982c81597ec6fd070eaf2c`](https://github.com/KirkDiggler/rpg-api-protos/commit/94b501dc0ad78fc00d982c81597ec6fd070eaf2c).

One line per entry. Every line ends with a link: a PR, an issue comment, a commit, or a design section anchor. This file rides on the work PR, under the `knowledge/runs/` of the lowest directory that contains everything the PR changed. The ingest reads it once and adds a `processed:` line at the top; nobody else edits it after merge.

## Shipped

- `InitiativeRoll { Party member; Roll roll }` and `FightFormed.rolls = 3` in `dnd5e/api/session/v1alpha2/act.proto` — [rpg-api-protos#448](https://github.com/KirkDiggler/rpg-api-protos/pull/448).

## Decided

- An initiative roll reuses the existing `Roll` message, so a client prints it the way it prints every other roll and nothing is re-added on the client; the lead's call — [rpg-project#1048](https://github.com/KirkDiggler/rpg-project/issues/1048).
- The rolls ride the fight-forming message and are not a new event, because everyone in the fight reads every member's roll; the operator's ruling of 2026-11-21 — [rpg-project#1035 comment](https://github.com/KirkDiggler/rpg-project/issues/1035#issuecomment-7051043597).

## Found

- An older `InitiativeRolled { repeated string order = 1; }` exists in `dnd5e/api/v1alpha2/encounter/events.proto`, another package, carrying only an order — [events.proto at base](https://github.com/KirkDiggler/rpg-api-protos/blob/94b501dc0ad78fc00d982c81597ec6fd070eaf2c/dnd5e/api/v1alpha2/encounter/events.proto).

## Mistaken

- The slice issue's fact F3 was written without running its own command and matched that older message; the first builder stopped on it correctly, and Amendment 1 corrected it — [rpg-project#1048 Amendment 1](https://github.com/KirkDiggler/rpg-project/issues/1048#issuecomment-7051191603).
- The slice issue left the run record out of its file list — [rpg-project#1048 fix list](https://github.com/KirkDiggler/rpg-project/issues/1048#issuecomment-7051403288).
