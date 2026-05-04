---
name: Breaking change workflow
description: When breaking changes are acceptable, how to do them safely, and how to retire deprecated fields
updated: 2026-05-02
confidence: high — based on PR #136 (worked example) and the workspace's "breaking changes during migration" preference
---

# Breaking change workflow

The contract layer is explicit about breaking discipline. This is
the highest-stakes work in the repo: a missed breaking change here
is a runtime break in either consumer.

Per the workspace preference (set in `rpg-project/CLAUDE.md`):
**breaking changes during migration beat permanent dual-shape
APIs.** The cost of carrying both shapes is paid every PR forever;
the cost of breaking is paid once.

## When a change is breaking

`buf breaking` flags these cases (with `breaking: use: [FILE]` in
`buf.yaml`):

- **Field tag number changed.** Adding `int32 foo = 7` then changing
  it to `int32 foo = 8` is a wire break.
- **Field type changed.** `int32 foo = 7` → `int64 foo = 7` is a wire
  break (encodings differ).
- **Field deleted without `reserved`.** Removing `string foo = 7;`
  without `reserved 7;` allows future reuse of tag 7 — silent break
  later.
- **Message renamed.** Renames break generated client code (Go
  imports, TS imports).
- **Field renamed.** Renames break TS clients (which use field names),
  even though the wire is fine. Use `reserved "old_name";`.
- **Enum value renumbered.** Wire break.
- **RPC signature changed.** Replacing `Request:Response` with
  different message types is an SDK break.

Non-breaking (safe):

- Adding a new field at a new tag.
- Adding a new RPC.
- Adding a new enum value.
- Adding a new message.
- Marking a field `[deprecated = true]` or an RPC `option deprecated
  = true` (these are advisory, not wire-affecting).

## Today's CI gap

`.github/workflows/ci.yml:31` runs `buf breaking` with
`continue-on-error: true`. **The check is advisory, not blocking.**
A PR with a breaking change merges with a yellow x.

This is **issue #139** — the highest-leverage one-line fix on the
board. Until that fix lands, treat `buf breaking` as if it were
blocking when run locally; don't rely on CI.

## The PR #136 worked example

PR #135/#136 (2026-04-03) introduced unified entity state
(`EncounterStateData`, `EntityState`) and retired the legacy
fragmented event fields. The retirement was done correctly:

```proto
// encounter.proto:903 — CombatStartedEvent
message CombatStartedEvent {
  reserved 1, 2, 3, 4, 5;
  reserved "combat_state", "room", "party", "monsters", "doors";
  // ...
  EncounterStateData encounter_state_data = 10;
}
```

Both the field numbers (1-5) AND the field names ("combat_state"...)
are reserved. Future tag reuse is detected; future name reuse is
detected; the wire is safe.

Replicate this exact pattern when retiring fields.

## Workflow: retiring a deprecated field

1. **Confirm consumers have migrated.**
   ```bash
   # In rpg-api workspace:
   grep -rn "\.movement_used" /home/kirk/personal/rpg-api/internal /home/kirk/personal/rpg-dnd5e-web/src

   # Should find no live read/write of the deprecated field. Test
   # references guarded by //nolint:staticcheck are fine to leave —
   # they verify backward compat — but they will need to be removed
   # when you remove the field itself.
   ```

2. **Remove the field; add `reserved`.**
   ```proto
   message TurnState {
     string entity_id = 1;
     // movement_used = 2 was here (deprecated by ActionEconomy in PR #128)
     reserved 2, 3, 4, 5, 6;
     reserved "movement_used", "movement_max", "action_used", "bonus_action_used", "reaction_available";
     .api.v1alpha1.Position position = 7;
     ActionEconomy action_economy = 8;
   }
   ```

3. **Run `buf breaking` locally.** It should still flag the change as
   breaking — `reserved` makes future safety, not retroactive
   non-breakage. The break is intentional.

4. **Coordinate with consumer PRs.** rpg-api and rpg-dnd5e-web need PRs
   that remove the corresponding field reads / `//nolint:staticcheck`
   guards. Either land them first, or merge the proto change first
   and immediately follow with consumer PRs (whichever the team
   prefers — usually consumer PRs first to verify nothing breaks).

5. **Update docs in the same proto PR.**
   - `docs/status.md`: remove the field from the "Deprecated fields
     still in scope" list.
   - `docs/architecture/components/<service>.md`: update Rule 3
     violations.
   - `docs/architecture/overview.md`: update Rule 3 violation table if
     listed there.

## Workflow: retiring a deprecated RPC

Same as above, but the RPC entry comes out of the service block:

```proto
service EncounterService {
  // ...
  // Removed (was: rpc Attack(AttackRequest) returns (AttackResponse))
  // Replacement: ActivateCombatAbility + ExecuteAction
}
```

`buf breaking` flags removed RPCs. Confirm rpg-api's handler doesn't
implement the RPC anymore (no `Attack` method on the service struct)
before merging.

If `AttackRequest` / `AttackResponse` messages are not used by any
other RPC, retire them too.

## Workflow: introducing a new shape during migration

The Rule 1 invariant: don't carry two shapes after a migration
completes. During migration, the two shapes coexist briefly. The
critical question is: when does "briefly" end?

**Answer: in the same release as the new shape.** The transition window
is one release. Both shapes coexist for the duration of one PR cycle —
the PR that adds the new shape removes the old one.

This is harder than it sounds. The current `EncounterStateData`
migration (issue #138) carries dual shapes today because consumer
migration wasn't complete in PR #136. The fix is to land the consumer
migration and remove the legacy fields in a follow-up PR — not to
extend the dual-shape window indefinitely.

If the consumer migration is going to take more than one PR cycle,
the workspace pattern is:

1. Land the new shape with both populated.
2. Land consumer migration PRs that switch reads to the new shape.
3. Land a single proto PR that removes the legacy fields and the
   `reserved` lines all at once. This is the breaking change.

The breaking change is the *closing* PR of the migration, not an
afterthought.

## Anti-patterns

- **Renaming a field to "fix" the name.** Renames are TS-client
  breaks. If the name is wrong but the data is right, leave it. New
  fields can have new names; existing fields stay.
- **Adding a new field to "replace" without removing the old.** This
  creates a Rule 1 violation. Either commit to the migration window
  or don't start.
- **Skipping `reserved` because "no one's using that tag anyway."**
  Future you, or another contributor, will reuse that tag and create
  a silent break. `reserved` is cheap.
- **Bypassing CI's breaking check.** Today CI is advisory; locally
  run the check and respect it. When CI becomes blocking (issue #139),
  there will be no `--no-verify` equivalent for `buf breaking`.

## When breaking is unavoidable: bump the version

If the change really can't be staged migration-style — e.g. the new
shape requires a fundamentally different message — bump the version
package. `dnd5e/api/v1alpha1` → `dnd5e/api/v1alpha2` or
`dnd5e/api/v1beta1`. The old version stays around as a separate
package with its own clients; consumers migrate at their own pace.

This is heavyweight. `buf breaking` is configured `use: [FILE]` so
file-level changes flag; a version bump is a new file path, so the
old file's content doesn't trigger breakage flags.

This is appropriate for big shape changes (e.g. moving `Position`
from `double` to `int32` per the coordinate-types design). Not
appropriate for "I want to rename one field."

## See also

- [run-buf-checks-locally.md](run-buf-checks-locally.md) — running
  `buf breaking` before pushing
- [overview.md Rule 2](../architecture/overview.md#rule-2-buf-breaking-is-authoritative-not-advisory)
  — the ci.yml issue (#139)
- [overview.md Rule 3](../architecture/overview.md#rule-3-deprecated-fields-are-retired-in-the-same-release-as-their-replacement)
  — the deprecation discipline this workflow enforces
- PR #136 in rpg-api-protos — the worked example
