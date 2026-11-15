# Run — 2026-11-16 — Studio today S6 read-back connection value

Slice [rpg-project#972](https://github.com/KirkDiggler/rpg-project/issues/972) of story [rpg-project#966](https://github.com/KirkDiggler/rpg-project/issues/966). Base: `rpg-api-protos` `main` at [`8c62114`](https://github.com/KirkDiggler/rpg-api-protos/commit/8c621147a53e0eeedd2b4e09920cf3412a878d7f).

## Shipped

- `int32 value = 4` on `ReadBackConnection`, mirroring the engine's `Connection.Value` (JSON `value`), the difficulty of a check on a way's `method` connection; zero means none — [rpg-project#972](https://github.com/KirkDiggler/rpg-project/issues/972).

## Decided

- `int32`, not `int64`, because the value is a check difficulty and the engine's `int` never nears 2^31; proto3 scalar zero already reads as "carries no number", matching the engine's `omitempty` — [readback.go](https://github.com/KirkDiggler/rpg-toolkit/blob/main/rulebooks/dnd5e/encounter/dungeonspec/readback/readback.go).
- The `role` comment's verbs are marked as examples ("for example … the list is not the set") rather than extended with `through`, `lifts`, `needs`, `on-miss`, `still-holds`, `unless`, `joins`, `sees`, because a growing list on the wire drifts every time the engine adds a role and roles are open strings — [rpg-project#972](https://github.com/KirkDiggler/rpg-project/issues/972).

## Found

- The engine's `Connection` comment carries the same closed-looking verb list as the wire did; it now also omits the roles the engine uses — [readback.go](https://github.com/KirkDiggler/rpg-toolkit/blob/main/rulebooks/dnd5e/encounter/dungeonspec/readback/readback.go).
- `make test`, `make generate` and `make compile-go` pass locally; Go gets `ReadBackConnection.GetValue() int32`, TypeScript `value: number` — [rpg-project#972](https://github.com/KirkDiggler/rpg-project/issues/972).

## Mistaken

- The first `make generate` exited 2 with no message and passed on rerun with nothing changed; the remote plugin call is the likely cause, unconfirmed — [rpg-project#972](https://github.com/KirkDiggler/rpg-project/issues/972).
