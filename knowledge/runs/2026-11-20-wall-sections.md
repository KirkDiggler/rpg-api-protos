# Run — 2026-11-20 — Wall-owned visual sections

processed: 2026-11-25T190427Z

## Shipped

- Added the optional immutable section list to both session wall contracts; this is a candidate contract, not deployed Play support — [Courtyard S6](https://github.com/KirkDiggler/rpg-project/issues/1022).

## Decided

- Keep visual sections on the existing permitted wall, with canonical-feet centre/width and opaque identity/ref; do not reuse gameplay openings or create another disclosure owner — [continuation plan](https://github.com/KirkDiggler/rpg-project/blob/feat/wall-kit-fit/ideas/wall-kit-fit/sections-plan.md).

## Found

- Both wall messages leave field 12 available; local format/lint/options/breaking checks pass. Generation remains CI-owned under the repository's contract-only authoring workflow — [slice](https://github.com/KirkDiggler/rpg-project/issues/1022).

## Mistaken

- The cross-repository plan named local generation as a routine gate; repository instructions instead reserve explicit generation for generator work/troubleshooting. Followed `make format` and `make test`, without bespoke generated-code tests — [slice](https://github.com/KirkDiggler/rpg-project/issues/1022).
