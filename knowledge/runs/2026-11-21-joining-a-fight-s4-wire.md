# Run — 2026-11-21 — Joining a fight S4 the wire

processed: 2026-11-25T190427Z

Slice [rpg-project#1072](https://github.com/KirkDiggler/rpg-project/issues/1072) of story [rpg-project#1068](https://github.com/KirkDiggler/rpg-project/issues/1068). Base: `rpg-api-protos` `main` at [`20de1f9`](https://github.com/KirkDiggler/rpg-api-protos/commit/20de1f9).

One line per entry. Every line ends with a link.

## Shipped

- `CLOCK_MARK_FIGHT_JOINED = 13`, `message FightJoined` and `ClockEntry.fight_joined = 14` in `dnd5e/api/session/v1alpha2/act.proto` — [rpg-project#1072](https://github.com/KirkDiggler/rpg-project/issues/1072).

## Decided

- A join is its own clock mark and message and not a field on the existing joined mark, because that mark is a creature entering the encounter, not a fight — [rpg-project#1072](https://github.com/KirkDiggler/rpg-project/issues/1072).

## Found

- none — [rpg-project#1072](https://github.com/KirkDiggler/rpg-project/issues/1072).

## Mistaken

- none — [rpg-project#1072](https://github.com/KirkDiggler/rpg-project/issues/1072).
