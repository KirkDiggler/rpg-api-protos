# Run — 2026-11-15 — Studio today S1 read-back on the wire

Slice [rpg-project#967](https://github.com/KirkDiggler/rpg-project/issues/967) of story [rpg-project#966](https://github.com/KirkDiggler/rpg-project/issues/966). Base: `rpg-api-protos` `main` at [`5f3c307`](https://github.com/KirkDiggler/rpg-api-protos/commit/5f3c307046d900c4c952f67b53385286d5b9ddd2).

## Shipped

- `ReadBack`, `ReadBackSection`, `ReadBackGroup`, `ReadBackStatement`, `ReadBackSubject`, `ReadBackConnection`, `ReadBackUnsaid` and `ReadBack read_back = 3` on `PutDungeonResponse` in the authoring package; the protos half of the slice, the api half maps the toolkit read-back onto it — [plan Task 1](https://github.com/KirkDiggler/rpg-project/blob/studio-today-design/ideas/encounter-studio/plan-places-and-ways.md#task-1-the-read-back-message-on-the-wire).

## Decided

- Field names and numbers mirror the toolkit read-back's exported JSON (`key`, `name`, `sections`, `not_yet_said`, `kind`, `about`, `sentence`, `path`, `connects`, `role`, `why`) one for one, so a field added there is added here by the same name — [readback.go](https://github.com/KirkDiggler/rpg-toolkit/blob/main/rulebooks/dnd5e/encounter/dungeonspec/readback/readback.go).
- Statement, subject and connection kinds and connection roles are open strings, never enums, because the engine owns them and adds kinds without a wire change; the doc comment tells a client to show an unknown kind plainly — [plan Task 1](https://github.com/KirkDiggler/rpg-project/blob/studio-today-design/ideas/encounter-studio/plan-places-and-ways.md#task-1-the-read-back-message-on-the-wire).
- The `read_back` comment answers the `atlas` comment's "no second builder-shaped projection" rule instead of contradicting it: the atlas stays the one geometry, the read-back repeats no cell, wall or door shape and says what the file means, which no message carried before — [issue](https://github.com/KirkDiggler/rpg-project/issues/967).
- `PutDungeonResponse`'s two-shapes header now names `read_back` in both shapes (set on a compiled site document, unset with errors), so the header and the field comment cannot disagree — [issue](https://github.com/KirkDiggler/rpg-project/issues/967).
- The `"(engine rule)"` path literal is documented on `ReadBackStatement.path`, because a client pointing a statement at the file needs to know which paths have no place in it — [readback.go](https://github.com/KirkDiggler/rpg-toolkit/blob/main/rulebooks/dnd5e/encounter/dungeonspec/readback/readback.go).

## Found

- `make test` (lint, format check, new-file options policy, breaking against `main`), `make generate` and `make compile-go` pass locally; the generated TypeScript exports `ReadBack` and `ReadBackSchema` from `dnd5e/api/authoring/v1alpha1/service_pb.ts` — [plan verification](https://github.com/KirkDiggler/rpg-project/blob/studio-today-design/ideas/encounter-studio/plan-places-and-ways.md#task-1-the-read-back-message-on-the-wire).
- CI tags the repository root `vX.Y.Z` on the `generated` branch; the `gen/go` module carries no tag of its own, so Go consumers pin a pseudo-version of the `generated` branch (rpg-api is on one) and the web pins `github:KirkDiggler/rpg-api-protos#vX.Y.Z` — [ci.yml](https://github.com/KirkDiggler/rpg-api-protos/blob/main/.github/workflows/ci.yml).

## Mistaken

- none observed — [plan Task 1](https://github.com/KirkDiggler/rpg-project/blob/studio-today-design/ideas/encounter-studio/plan-places-and-ways.md#task-1-the-read-back-message-on-the-wire).
