# Run — 2026-11-10 — Courtyard S5 wall-face finish contract

Work [Project #919](https://github.com/KirkDiggler/rpg-project/issues/919), design [Project #915](https://github.com/KirkDiggler/rpg-project/pull/915), shared Studio controls [Web #1402](https://github.com/KirkDiggler/rpg-dnd5e-web/issues/1402).

## Shipped

- Additive contract only: `WallFaceFinish { side=1, material_ref=2 }` and wall `face_finishes=11` in both snapshot and act-geometry packages; actual generated SDK adoption and application delivery remain downstream — [plan](https://github.com/KirkDiggler/rpg-project/blob/design/1402-studio-appearance/ideas/studio-appearance/plan.md).

## Decided

- The operator included existing normal-bearing masonry wall finishes in the first shared-control delivery; capture explicit per-face choices alongside current wall geometry rather than invent a regional chart payload — [R9 approval](https://github.com/KirkDiggler/rpg-project/pull/915#issuecomment-6758627344).
- Use the native wall-local tokens positive-z/negative-z, unique per wall, and opaque material refs. Provider resource/basis validation remains consumer-side; no generic texture URLs, authoring source, gameplay material interpretation or extra RPC — [design](https://github.com/KirkDiggler/rpg-project/blob/design/1402-studio-appearance/ideas/studio-appearance/design.md).

## Found

- Both current wall messages have field10 material overrides and free field11. Their existing opening/footprint field numbers differ across versions and remain unchanged — [source baseline](https://github.com/KirkDiggler/rpg-api-protos/commit/45a0fb3644c75cc37caa2a0c0fbd174ae25b5e59).
- Existing region-wall binding returns not-wall-bound; working masonry uses whole-wall local mapping. The new field does not carry hidden region geometry or reactivate unapplied regional defaults — [checked plan](https://github.com/KirkDiggler/rpg-project/blob/design/1402-studio-appearance/ideas/studio-appearance/plan.md).

## Mistaken

- none observed — [slice](https://github.com/KirkDiggler/rpg-project/issues/919).
