---
name: Consumer integration
description: How rpg-api (Go) and rpg-dnd5e-web (TypeScript) consume this contract
updated: 2026-09-01
confidence: high — verified by reading rpg-api/CLAUDE.md, rpg-api-protos/buf.gen.yaml, .github/workflows/ci.yml
---

# Consumer integration

Two live consumers: rpg-api (Go gRPC server) and rpg-dnd5e-web
(TypeScript Connect-ES client). Each takes the generated SDK
differently. This doc covers the integration shape, the version
pinning model, and the failure modes.

## Generation outputs

`buf.gen.yaml` produces two SDK targets per merge to main:

| Target | Path | Plugins |
|---|---|---|
| Go | `gen/go/...` | `protocolbuffers/go` + `grpc/go` (no `require_unimplemented_servers`) |
| TypeScript | `gen/ts/...` | `bufbuild/es target=ts` (Connect-ES; one plugin handles both messages and services) |

CI then runs one serialized release transaction from the `main` push:
1. Constructs the generated commit locally and records the triggering source
   SHA in its commit message.
2. Under the release lock, fetches `origin/main` and tags immediately before
   planning, then inspects release history even when the source is stale.
3. Reuses a complete same-source `vX.Y.Z` + `gen/go/vX.Y.Z` pair wherever it
   appears, even when newer releases exist. A stale source without such a pair
   coalesces; any source-associated partial pair fails closed. Otherwise the
   next version is selected from final root tags matching `vX.Y.Z` only.
4. Validates the module path, source identity, annotated tags, and peeled
   targets before publication.
5. Immediately re-fetches and compares `origin/main`. If the source became
   stale after planning, nothing is published. Otherwise a new release
   atomically force-updates `generated` while creating both tags without force;
   reuse performs no branch or tag push.
6. Creates or recovers the one GitHub release by explicit root tag. Generated
   notes are added only when creating it, not during existing-release recovery.

Any Source-SHA-associated partial or inconsistent tag pair fails closed. npm
publication is unsupported pending rpg-api-protos#263.

See [regenerate-sdks.md](regenerate-sdks.md) for the local equivalent.

## rpg-api (Go) integration

### Pinning model

rpg-api's `go.mod` pins to either a tag or the `generated` branch.
Per `rpg-api/CLAUDE.md`, the recommended pull command is:

```bash
GOPROXY=direct go get github.com/KirkDiggler/rpg-api-protos/gen/go@generated
```

`@generated` resolves to the latest commit on the force-pushed
`generated` branch as a Go module pseudo-version. It is useful during
active development, but the branch selector moves on every release.

For an immutable fallback, request an exact generated commit. For
example, the generated commit for root release `v0.1.147` is:

```bash
GOPROXY=direct go get github.com/KirkDiggler/rpg-api-protos/gen/go@1e5c208d02ee4d81f167bc8d5ae272016ca0bd57
```

Go records the resulting commit-based pseudo-version in `go.mod`;
that pseudo-version remains a stable pin.

Root tags through `v0.1.147` are **not** resolvable versions of the
nested `gen/go` module. They were published as `vX.Y.Z` instead of the
module-qualified `gen/go/vX.Y.Z`, so this historical command fails:

```bash
go get github.com/KirkDiggler/rpg-api-protos/gen/go@v0.1.147
```

Releases after the module-tag fix publish both tag forms on the same
generated commit. Consumers can then use the release version normally:

```bash
go get github.com/KirkDiggler/rpg-api-protos/gen/go@vX.Y.Z
```

The Go resolver maps that module version to the repository tag
`gen/go/vX.Y.Z`. The root `vX.Y.Z` tag remains the GitHub release identity.

### Usage shape

```go
import (
    pb "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha1"
    apiv1alpha1 "github.com/KirkDiggler/rpg-api-protos/gen/go/api/v1alpha1"
)

// Server side: implement the generated service interface
type encounterHandler struct {
    pb.UnimplementedEncounterServiceServer  // (only if buf.gen.yaml had require_unimplemented_servers; we don't)
    orchestrator encounter.Service
}

func (h *encounterHandler) CreateEncounter(ctx context.Context, req *pb.CreateEncounterRequest) (*pb.CreateEncounterResponse, error) {
    // ...
}
```

### Mocks

`make mocks` (in this repo) generates Go mocks for every gRPC client
interface using `go.uber.org/mock/mockgen`. They live under
`gen/go/.../mocks/`. rpg-api consumes them in tests:

```go
import "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha1/mocks"

mockClient := mocks.NewMockCharacterServiceClient(ctrl)
```

### Drift indicators

Watch for these in rpg-api PRs:

- **Imports of `pb.` types in non-handler packages** (orchestrator,
  entities, repository). The proto SDK should be confined to the
  handler / converter layer. Per the rpg-api docs, this is currently
  violated extensively (see rpg-api `architecture/overview.md` —
  39 `pb.` references in encounter orchestrator).
- **Type assertions on toolkit types in handlers.** Indicates the
  orchestrator's Output type is `interface{}` where it should be
  typed.
- **Tests guarded by `//nolint:staticcheck`** that exercise deprecated
  proto fields. These are early-warning that a field is past due for
  retirement (see [breaking-change-workflow.md](breaking-change-workflow.md)).

## rpg-dnd5e-web (TypeScript) integration

### Publication status

CI still generates and compile-checks `gen/ts`, but npm is **not a supported
publication channel**. #261 does not pack, query, or publish
`@kirkdiggler/rpg-api-protos`. Do not rely on a fresh root GitHub release to
produce an npm version, and do not treat the current package manifest/import
layout as a supported consumer contract.

rpg-api-protos#263 owns the TypeScript package layout, exports, compile output,
versioning, clean-install import proof, and idempotent npm publication. Until
that work lands, TypeScript SDK work must use locally generated `gen/ts` output
or an explicitly coordinated consumer fixture rather than a newly published
npm package.

### Drift indicators

- **A field exists in proto but the TS client never references it.**
  Schema noise; the field was added speculatively or the consumer
  migration regressed.
- **A field is referenced in TS but doesn't exist in the proto.**
  Compile error caught immediately.
- **Field-name churn in the TS client.** TS clients use field names
  (snake_case → camelCase), so a field rename in proto is a TS
  break even though it's not a wire break. Avoid renames.

## Cross-repo PR sequencing

When a proto change has consumer impact, sequence PRs deliberately:

### Adding a new field (non-breaking)

1. Land proto PR adding the field.
2. CI publishes new tag.
3. rpg-api PR (or rpg-dnd5e-web PR) bumps the dependency and uses
   the new field. No coordination needed; old SDK still works.

### Adding a new RPC (non-breaking)

Same as adding a field: proto first, then consumer.

### Removing a deprecated field (breaking)

1. Confirm consumers no longer read the field.
2. rpg-api PR removes any remaining read sites.
3. rpg-dnd5e-web PR removes any remaining read sites.
4. Proto PR removes the field, adds `reserved`. CI publishes a new
   tag.
5. Consumer PRs bump the dependency.

The proto change is the **last** PR to merge; previous consumer PRs
must already be on main with the new SDK pulled.

### Renaming a field (avoid)

There is no clean way. Either keep the old name, or bump the package
version (`v1alpha1` → `v1alpha2`) and migrate consumers across the
boundary. See [breaking-change-workflow.md](breaking-change-workflow.md).

## Failure modes

- **Consumer pinned to old SDK uses removed field.** Compile-time
  break in rpg-api (Go), runtime break in rpg-dnd5e-web (TS proto
  decode error). Mitigated by `buf breaking` (blocking in CI; PR can
  carry `breaking-change-approved` for intentional breaks) and
  pre-merge consumer migration.
- **Consumer pinned to old SDK calls deprecated RPC.** Works (the RPC
  is still implemented today even when proto-deprecated) until the
  RPC is removed. Then unimplemented error at runtime.
- **`buf generate` produces output, but `make mocks` fails.** Mocks are
  required for rpg-api unit tests; failure here is a pre-merge gate.
- **`buf format` clean locally but CI flags formatting.** Unlikely if
  you ran `buf format -w`; possible if your buf version is older than
  CI's. Run `brew upgrade buf` (macOS) periodically.
- **A delayed release job reaches the lock after newer main.** It fetches and
  compares its source with `origin/main`, then scans release history. Its own
  verified pair may repair only the root GitHub release; without a pair it
  coalesces. A partial pair fails closed.
- **Main advances after release planning.** CI re-fetches immediately before
  the atomic push and skips both ref and external publication for the stale
  plan.
- **Release validation or one ref update fails.** Validation completes before
  publication, and the generated branch plus both tags are one atomic push, so
  no remote release ref advances. Any Source-SHA-associated partial or
  inconsistent pair stops planning.
- **GitHub release publication fails after refs land.** Rerunning the same
  source reuses its original tag pair even if newer releases exist, skips all
  ref pushes, and retries only the root GitHub release without appending
  generated notes. It cannot rewind `generated`.
- **An npm package is expected for a new release.** npm publication is
  unsupported pending rpg-api-protos#263; #261 deliberately performs no npm
  packaging or publication.
- **Force-push to `generated` overwrites local commits.** Don't commit
  to `generated`. The branch is force-updated by the release transaction.

## Visualizing the contract surface

```
rpg-api-protos (this repo)
    │
    ├── proto edits on feature branch → buf lint/format/breaking → merge
    │
    ▼ CI generates
gen/go ──┬── force-pushed to `generated` branch ─────── @generated
         └── tagged `gen/go/vX.Y.Z` ─────────────────── @vX.Y.Z
                                                              │
                                                       go mod consumes
                                                              ▼
                                                          rpg-api
                                                              │
                                                              ├── handlers (proto types here)
                                                              ├── orchestrators (entity types — proto leakage today)
                                                              └── tests (mocks from gen/go/.../mocks/)

gen/ts ─────── generated + compile-checked in CI
    │
    └── npm publication unsupported pending rpg-api-protos#263
                                                    │
                                      future supported package
                                                    ▼
                                            rpg-dnd5e-web
```

## See also

- [overview.md](../architecture/overview.md) — full architecture
- [breaking-change-workflow.md](breaking-change-workflow.md) — when
  drift becomes unavoidable
- `rpg-api/CLAUDE.md` — Go consumer's view of the contract
- `rpg-dnd5e-web/CLAUDE.md` — TS consumer's view (if/when it exists)
