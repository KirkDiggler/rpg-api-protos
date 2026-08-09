# Authoring placement offset fixtures

`placement-offset-{absent,zero,signed}.json` exercise the direct generated
`FloorPlanPlacement.offset` presence shape. `floor-plan-placement-matrix.json`
contains the complete proto-level five-case projection matrix: room prop,
canvas prop, room monster, canvas monster, and room boss, each with distinct
absolute cells/source paths plus applicable facing, blockers, and optional
verbatim offset.

`tests/placement-offset` verifies exact `FloorPlanPlacement` descriptors and
Go/TypeScript binary/JSON round trips against these fixtures.
