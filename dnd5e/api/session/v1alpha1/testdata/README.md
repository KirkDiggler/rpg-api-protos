# Declaration.remaining presence fixtures

These fixtures describe `dnd5e.api.session.v1alpha1.Declaration`, the one
message on the session seam whose `optional int32 remaining` carries the
pointer-optional law (rpg-toolkit#1169): present for a `VERB_MOVE` declaration,
absent for a `VERB_ATTACK` one, and `0` is a real answer ("nothing left this
turn") distinct from "this verb carries no such number".

- `declaration-remaining-absent.json` — an Attack declaration; `remaining`
  is not set.
- `declaration-remaining-zero.json` — a Move declaration with explicitly
  present `remaining = 0`.
- `declaration-remaining-thirty.json` — a Move declaration with a nonzero
  `remaining = 30`.

`tests/declaration-remaining` parses each fixture with generated Go and
TypeScript, serializes it to protobuf binary, and verifies that the decoded
`remaining` field retains both its value and presence. The absent and
explicit-zero cases must remain distinct on the wire — a projection that let
nil collapse to 0 would tell a client its attack has no feet left.
