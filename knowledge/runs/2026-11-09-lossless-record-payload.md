# Run — 2026-11-09 — lossless diagnostic record payload

processed: 2026-11-12T165555Z

## Shipped

- Prepared an additive fields_json byte payload on the existing RecordEvent and deprecated the approximate Struct field; publication and consumer adoption are not yet complete — [Machine inspection S2](https://github.com/KirkDiggler/rpg-project/issues/900).

## Decided

- Carry the owner's exact UTF-8 JSON bytes, because the existing Struct projects every number through a double and loses valid machine integers — [R9](https://github.com/KirkDiggler/rpg-project/pull/902#issuecomment-6727648247).
- Keep existing RPCs, IDs and the old field number; new exact readers do not fall back to the approximate field when raw data is missing or malformed — [#898](https://github.com/KirkDiggler/rpg-project/issues/898).
- Use contract-only local checks and CI-owned generated SDK validation, because generated bindings are not authored or hand-published — [proto workflow](https://github.com/KirkDiggler/rpg-api-protos/blob/main/CLAUDE.md).

## Found

- make format and make test pass, including Buf lint/format/new-file policy/breaking checks; no bespoke generated-mechanics test is added — [#900](https://github.com/KirkDiggler/rpg-project/issues/900).
- CI publishes generated Go/TypeScript bindings only after main merges. Consumer validation cannot substitute a local replace, handwritten binding or generated-branch push; narrow proto publication permission remains distinct from preparing the whole wave — [workflow](https://github.com/KirkDiggler/rpg-api-protos/blob/main/.github/workflows/ci.yml).

## Mistaken

- None observed in the contract edit; the earlier assumption that Struct could carry exact live diagnostic values is the reason for this provider cut — [probe](https://github.com/KirkDiggler/rpg-project/pull/902#issuecomment-6727648247).
