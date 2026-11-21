# Run — 2026-11-22 — status effect powers S-words serve wire

Slice [rpg-project#1096](https://github.com/KirkDiggler/rpg-project/issues/1096) of story [rpg-project#1036](https://github.com/KirkDiggler/rpg-project/issues/1036). Base: `rpg-api-protos` `main` at [`01e1a39`](https://github.com/KirkDiggler/rpg-api-protos/commit/01e1a397953f24578202b1a5c212d831f1e34241).

## Shipped

- `GetStatusWords` and `SayStatus` rpcs with `GetStatusWordsRequest/Response`, `StatusWord`, `StatusWordValue`, `StatusNumberBounds`, `SayStatusRequest/Response`, `StatusSaidPart` in the authoring service — [rpg-project#1096](https://github.com/KirkDiggler/rpg-project/issues/1096).

## Decided

- `place`, `shape`, `written_in` and `holds` are open strings, never enums, so a rules release needs no proto release — [rpg-project#1096](https://github.com/KirkDiggler/rpg-project/issues/1096).
- `rulebook_version` is its own field name, as it names a different module than `encounter_version` — [rpg-project#1096](https://github.com/KirkDiggler/rpg-project/issues/1096).
- A refused status answers with `errors` and an OK status; the existing `FieldError` is reused — [rpg-project#1096](https://github.com/KirkDiggler/rpg-project/issues/1096).

## Found

- W1 `rpc GetMachineWords` at service.proto:134, response :711, `encounter_version = 1` :715 — [rests-on comment](https://github.com/KirkDiggler/rpg-project/issues/1096#issuecomment-7069597378).
- W2 all eight new names matched no .proto file (0 files each) — [rests-on comment](https://github.com/KirkDiggler/rpg-project/issues/1096#issuecomment-7069597378).
- W3 `FieldError` at :443 with path = 1, message = 2 — [rests-on comment](https://github.com/KirkDiggler/rpg-project/issues/1096#issuecomment-7069597378).
- W4 latest tag is v0.1.288 — [rests-on comment](https://github.com/KirkDiggler/rpg-project/issues/1096#issuecomment-7069597378).
- No tests added or changed (no hand-written tests in this repository) — [rpg-project#1096](https://github.com/KirkDiggler/rpg-project/issues/1096).
- `make compile-go` needs `make generate` first and then passes; `make compile-ts` fails here because `tsc` is not installed on this machine — [rpg-project#1096](https://github.com/KirkDiggler/rpg-project/issues/1096).

## Mistaken

none observed — [rpg-project#1096](https://github.com/KirkDiggler/rpg-project/issues/1096).
