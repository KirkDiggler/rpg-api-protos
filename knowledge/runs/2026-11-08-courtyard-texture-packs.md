# Run — 2026-11-08 — Courtyard texture-pack wire

processed: 2026-11-12T165555Z

## Shipped

- Contract checkpoint adds captured material overrides to wall/prop render records in snapshot and act geometry; consumer adoption and Save & Play remain outstanding — [Courtyard S3](https://github.com/KirkDiggler/rpg-project/issues/895).

## Decided

- Transcribe the same planned SDK MaterialOverride pair as surface_id/material_ref at both existing appearance owners, with unique targets and Original on absence. No source path, image payload, separate RPC or rule meaning — [design](https://github.com/KirkDiggler/rpg-project/blob/design/867-courtyard-ground/ideas/courtyard-walls/texture-design.md).
- Add field10 without changing prior numbering; defer independent A/B controls and structural-door enrollment rather than guess the later mixed-wall contract — [plan](https://github.com/KirkDiggler/rpg-project/blob/design/867-courtyard-ground/ideas/courtyard-walls/atlas-implementation.md).

## Found

- Both existing packages have free field10 on PropPresentation and AtlasStructuralWall. Existing snapshot/reveal ownership provides the transport; no new event is needed — [S3](https://github.com/KirkDiggler/rpg-project/issues/895).

## Mistaken

- None observed — [S3](https://github.com/KirkDiggler/rpg-project/issues/895).
