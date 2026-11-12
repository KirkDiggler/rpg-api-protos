# Run — 2026-11-06 — Courtyard S2 ground wire

processed: 2026-11-12T165555Z

Slice [#874](https://github.com/KirkDiggler/rpg-project/issues/874), story [#867](https://github.com/KirkDiggler/rpg-project/issues/867). Base: `main` at `0f27df9`.

## Shipped

- Additive `RegionGround`/`GroundPaint` and `AtlasRegion.ground` contracts in snapshot v1alpha1 and act geometry v1alpha2; consumer adoption remains separate — [S2](https://github.com/KirkDiggler/rpg-project/issues/874).

## Decided

- Carry an opaque base and explicit per-cell paint, restricting paint to the cells of its containing delivered region; absence retains the existing default and unavailable explicit refs are errors — [design/plan](https://github.com/KirkDiggler/rpg-project/pull/875).

## Found

- AtlasRegion field 6 is available in both wire packages; the additive contract passes the repository's Buf checks without generating SDKs locally — [S2](https://github.com/KirkDiggler/rpg-project/issues/874).

## Mistaken

- None observed — [S2](https://github.com/KirkDiggler/rpg-project/issues/874).
