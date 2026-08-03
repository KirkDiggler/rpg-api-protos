# Placement facing runtime fixtures

These fixtures describe the existing runtime
`dnd5e.api.v1alpha2.encounter.Placement` message. They are deliberately not
`dnd5e.api.authoring.v1alpha1.FloorPlan` fixtures: Slice #178 adds no authoring
placement field, placement delta, or facing echo.

- `placement-facing-absent.json` has no authored override.
- `placement-facing-east.json` has an explicitly present `E = 0` override.
- `placement-facing-southwest.json` has an explicitly present nonzero `SW = 4`
override.

`tests/placement-facing` parses each fixture with generated Go and TypeScript,
serializes it to protobuf binary, and verifies that the decoded `facing` field
retains both its value and presence. The absent and explicit-zero cases must
remain distinct.
