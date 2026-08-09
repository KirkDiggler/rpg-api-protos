# Encounter placement runtime fixtures

## Facing presence

The `placement-facing-*.json` fixtures describe the existing runtime
`dnd5e.api.v1alpha2.encounter.Placement.facing` field from Slice #178. That
slice deliberately added no authoring facing echo.

- `placement-facing-absent.json` has no authored override.
- `placement-facing-east.json` has an explicitly present `E = 0` override.
- `placement-facing-southwest.json` has an explicitly present nonzero `SW = 4`
  override.

`tests/placement-facing` parses each fixture with generated Go and TypeScript,
serializes it to protobuf binary, and verifies that the decoded `facing` field
retains both its value and presence.

## Dungeon YAML v0.4 placement offset

The `placement-offset-{absent,zero,signed}.json` fixtures prove direct runtime
`Placement.offset` presence and value compatibility. The complete
`placement-offset-space.json` and `placement-offset-knowledge-change.json`
fixtures prove the authorized snapshot and live paths respectively. Both carry
room/canvas props and monsters plus a boss using the existing monster entity
discriminator; every `Placement.entity_id` joins to an exact `Entity.id`.

`tests/placement-offset` verifies these fixtures through freshly generated Go
and TypeScript binary/JSON round trips. Omission and explicit zero must remain
distinct.
