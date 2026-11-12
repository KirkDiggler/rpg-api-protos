# Decisions — dnd5e/api/session

One line per entry, dated and linked. Ingest is the writer; entries arrive through its reviewed PR.
A decision reads `- <date> · <the words> · options: <the options it closed> · because: <why> · <link> · upheld: <links, or none yet>`;
a finding, friction or open line reads `- <date> · <the words> · <link>`. A finding that needs more than a line links its case file in `findings/`.
Friction names both entries and never settles them.

## Decisions

- none yet

## Findings

- 2026-11-12 · Ground, per-surface material overrides and explicit wall-face finishes extend existing snapshot and act-geometry owners. Absence preserves Original/default appearance; refs are opaque, and no source paths, image data or new resource RPC are introduced. · https://github.com/KirkDiggler/rpg-api-protos/blob/cf4408728d1daf6d799ae2c3ad185009bf45948a/knowledge/runs/2026-11-06-courtyard-ground.md, https://github.com/KirkDiggler/rpg-api-protos/blob/cf4408728d1daf6d799ae2c3ad185009bf45948a/knowledge/runs/2026-11-08-courtyard-texture-packs.md, https://github.com/KirkDiggler/rpg-api-protos/blob/cf4408728d1daf6d799ae2c3ad185009bf45948a/knowledge/runs/2026-11-10-wall-face-finishes.md

## Friction

- 2026-11-12 · Gate S3 introduces an addressed interaction on Declaration so the Speak row carries reply context beside its options. Its TableAnswer.to checkpoint and the later Speech.spoken_to contract are different generations: TableAnswer.to remains present but deprecated, and a new wire shape alone does not establish consumer adoption. · https://github.com/KirkDiggler/rpg-api-protos/blob/cf4408728d1daf6d799ae2c3ad185009bf45948a/knowledge/runs/2026-11-11-gate-s3-answer-to.md, https://github.com/KirkDiggler/rpg-api-protos/blob/cf4408728d1daf6d799ae2c3ad185009bf45948a/knowledge/runs/2026-11-11-gate-s3-speak-address.md, https://github.com/KirkDiggler/rpg-api-protos/blob/cf4408728d1daf6d799ae2c3ad185009bf45948a/dnd5e/api/session/v1alpha2/act.proto

## Open

- none yet
