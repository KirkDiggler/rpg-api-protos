---
name: Consumer integration
description: How rpg-api (Go) and rpg-dnd5e-web (TypeScript) consume this contract
updated: 2026-05-04
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

CI then:
1. Force-pushes `gen/` to a `generated` branch.
2. Auto-increments the latest `vX.Y.Z` git tag.
3. Publishes to npm (`@kirkdiggler/rpg-api-protos`).
4. Creates a GitHub release.

See [regenerate-sdks.md](regenerate-sdks.md) for the local equivalent.

## rpg-api (Go) integration

### Pinning model

rpg-api's `go.mod` pins to either a tag or the `generated` branch.
Per `rpg-api/CLAUDE.md`, the recommended pull command is:

```bash
GOPROXY=direct go get github.com/KirkDiggler/rpg-api-protos/gen/go@generated
```

`@generated` resolves to the latest commit on the `generated`
branch as a Go module pseudo-version. Useful during active
development; less stable than a tag pin.

For release stability:
```bash
go get github.com/KirkDiggler/rpg-api-protos/gen/go@v0.1.86
```

(Tags are auto-incremented; `v0.1.86` is current as of 2026-05-02.)

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

### Pinning model

Standard npm install:
```bash
npm install @kirkdiggler/rpg-api-protos
```

Each tag publishes a new npm version. `package.json` pins to either a
specific version or `^0.1.0` / `latest` for active development.

### Usage shape

```typescript
import { CharacterServiceClient } from '@kirkdiggler/rpg-api-protos/dnd5e/api/v1alpha1/character_connect';
import { Character, CharacterDraft } from '@kirkdiggler/rpg-api-protos/dnd5e/api/v1alpha1/character_pb';
import { createConnectTransport } from '@connectrpc/connect-web';

const transport = createConnectTransport({ baseUrl: '/api/grpc' });
const client = createPromiseClient(CharacterServiceClient, transport);

const draft: CharacterDraft = await client.createDraft({ playerId });
```

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
- **Force-push to `generated` overwrites local commits.** Don't commit
  to `generated`. The branch is force-pushed every CI run.

## Visualizing the contract surface

```
rpg-api-protos (this repo)
    │
    ├── proto edits on feature branch → buf lint/format/breaking → merge
    │
    ▼ CI generates
gen/go ─────── force-pushed to `generated` branch ────── @generated
                                                              │
                                                       go mod consumes
                                                              ▼
                                                          rpg-api
                                                              │
                                                              ├── handlers (proto types here)
                                                              ├── orchestrators (entity types — proto leakage today)
                                                              └── tests (mocks from gen/go/.../mocks/)

gen/ts ─────── npm publish ────────── @kirkdiggler/rpg-api-protos
                                                              │
                                                       npm install consumes
                                                              ▼
                                                          rpg-dnd5e-web
                                                              │
                                                              └── src/api/* — Connect-ES client wraps each service
```

## See also

- [overview.md](../architecture/overview.md) — full architecture
- [breaking-change-workflow.md](breaking-change-workflow.md) — when
  drift becomes unavoidable
- `rpg-api/CLAUDE.md` — Go consumer's view of the contract
- `rpg-dnd5e-web/CLAUDE.md` — TS consumer's view (if/when it exists)
