# Run — 2026-11-26 — The two `descriptor` fields, renamed in place

Ruling R2 of the Unreal client's design ([rpg-project#1155](https://github.com/KirkDiggler/rpg-project/pull/1155#issuecomment-7185702703)) closes a defect of the contract ([rpg-api-protos#453](https://github.com/KirkDiggler/rpg-api-protos/issues/453)).

## Shipped

- `InteractResponse.npc_descriptor` and `TradeResponse.npc_descriptor`, tag 1 untouched, the old name reserved; the two comments that named the field follow it — [https://github.com/KirkDiggler/rpg-api-protos/pull/457](https://github.com/KirkDiggler/rpg-api-protos/pull/457).
- The label `breaking-change-approved` on the PR, as the repository's workflow provides for an alpha package — [the workflow](https://github.com/KirkDiggler/rpg-api-protos/blob/main/docs/how-to/breaking-change-workflow.md).

## Decided

- In place: not a later package version and not a deprecated sibling. The field's name is the collision, so neither message compiles in C++ while the field exists, and the workflow keeps a new version for a released package — [the workflow](https://github.com/KirkDiggler/rpg-api-protos/blob/main/docs/how-to/breaking-change-workflow.md).
- The old name is reserved with the tag kept, the workflow's prescription for a rename — [the workflow](https://github.com/KirkDiggler/rpg-api-protos/blob/main/docs/how-to/breaking-change-workflow.md).
- No `json_name` pin: no field of the contract carries one, and the web moves in the same wave, so the JSON key follows the name — [rpg-dnd5e-web#1486](https://github.com/KirkDiggler/rpg-dnd5e-web/issues/1486).
- The PR proves the defect closed with the generator that found it, on both trees from one machine, rather than asserting it — [https://github.com/KirkDiggler/rpg-api-protos/pull/457](https://github.com/KirkDiggler/rpg-api-protos/pull/457).

## Found

- `buf breaking` against main names four findings, the two renames and their `json_name`, and nothing else — [https://github.com/KirkDiggler/rpg-api-protos/pull/457](https://github.com/KirkDiggler/rpg-api-protos/pull/457).
- C++ from `protocolbuffers/cpp` v23.4 under clang 21.1.8: `origin/main` fails at `service.pb.h:14733` and `:16400`; with the rename it compiles — [https://github.com/KirkDiggler/rpg-api-protos/pull/457](https://github.com/KirkDiggler/rpg-api-protos/pull/457).
- protoc-gen-go had already mangled the field to `Descriptor_`, so rpg-api carries two lines to change; the web reads it in one file, six times — [rpg-api#1290](https://github.com/KirkDiggler/rpg-api/issues/1290), [rpg-dnd5e-web#1486](https://github.com/KirkDiggler/rpg-dnd5e-web/issues/1486).
- `origin/main` had moved two commits past the checkout the session read first; exact-match edits refused the stale anchors, and the work was redone against it — [https://github.com/KirkDiggler/rpg-api-protos/blob/r2-descriptor/knowledge/runs/2026-11-26-descriptor-rename.md](https://github.com/KirkDiggler/rpg-api-protos/blob/r2-descriptor/knowledge/runs/2026-11-26-descriptor-rename.md).

## Mistaken

- An anchor indented four spaces where the proto uses two, then a pattern written for a script's literal characters rather than its output; the script's own assertion stopped each before a wrong edit — [https://github.com/KirkDiggler/rpg-api-protos/blob/r2-descriptor/knowledge/runs/2026-11-26-descriptor-rename.md](https://github.com/KirkDiggler/rpg-api-protos/blob/r2-descriptor/knowledge/runs/2026-11-26-descriptor-rename.md).
- A before-and-after first compared main with main: `git archive` packages committed work, and the rename was not yet committed. The same two errors on both sides gave it away — [https://github.com/KirkDiggler/rpg-api-protos/pull/457](https://github.com/KirkDiggler/rpg-api-protos/pull/457).
- Two commands ran with their output hidden and failed in silence, the label among them; both were rerun where their result could be read — [https://github.com/KirkDiggler/rpg-api-protos/pull/457](https://github.com/KirkDiggler/rpg-api-protos/pull/457).
