---
name: Regenerate SDKs
description: How CI generates Go and TypeScript SDKs and how to consume them
updated: 2026-09-01
confidence: high — verified by reading buf.gen.yaml and .github/workflows/ci.yml
---

# Regenerate SDKs

The repo generates two SDK targets: Go (gRPC + grpc-go) and TypeScript
(Connect-ES via `bufbuild/es`). You should rarely need to do this
locally — CI does it on every merge to main and force-pushes the
result to the `generated` branch. The generated commit receives both
an auto-incremented root tag and a module-qualified Go tag.

## What the pipeline does

`.github/workflows/ci.yml` runs `publish-packages` only for a `main` push and
serializes that job with other release jobs:

1. Generates code: `buf generate` writes `gen/go` and `gen/ts`.
2. Generates mocks: `make mocks` writes the gRPC client mocks under `gen/go`.
3. Sets up the nested Go module and constructs a local generated commit whose
   `Source-SHA` trailer records the triggering main commit.
4. Selects only final root tags matching `vX.Y.Z` for the version clock. A
   rerun of the latest source reuses its complete root/module pair; a partial
   pair fails closed.
5. Creates annotated root `vX.Y.Z` and `gen/go/vX.Y.Z` tags on the exact same
   generated commit and verifies the module path, derived `gen/go` prefix,
   annotated tag objects, peeled targets, and source identity.
6. Builds an isolated npm workspace, derives version `X.Y.Z` with
   `npm version --no-git-tag-version`, and inspects the package payload.
7. After all local validation, performs one atomic push containing the forced
   `generated` update and both create-only tags.
8. From that same main-triggered job, creates or updates the GitHub release by
   explicit root tag and queries/publishes that exact npm version. A matching
   npm version is an idempotent success; query failures and identity mismatches
   fail closed.

There is no tag-triggered publication workflow. The module-qualified Go tag
creates neither a second GitHub release nor a second npm package version.

## Local generation (rarely needed)

```bash
cd /home/kirk/personal/rpg-api-protos

buf generate                      # writes gen/go, gen/ts
make mocks                        # writes mocks under gen/go

# Validate Go output:
cd gen/go && find . -name "*.pb.go" -o -name "*.connect.go" | head

# Validate TS output:
cd gen/ts && ls dnd5e/api/v1alpha1/
```

`gen/` is gitignored. Don't commit it.

## Consuming the SDKs

### Go

```go
import (
    dnd5ev1alpha1 "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha1"
    "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha1/mocks"
)

client := dnd5ev1alpha1.NewCharacterServiceClient(conn)
mockClient := mocks.NewMockCharacterServiceClient(ctrl)
```

To pick up a fresh generated branch in rpg-api:
```bash
GOPROXY=direct go get github.com/KirkDiggler/rpg-api-protos/gen/go@generated
```

For a release created after the module-tag fix, pin its version:

```bash
go get github.com/KirkDiggler/rpg-api-protos/gen/go@vX.Y.Z
```

The repository ref for that version is `gen/go/vX.Y.Z`. The root
`vX.Y.Z` tag is the explicit GitHub release identity and maps to npm version
`X.Y.Z` in the serialized main-branch release transaction.

Historical root tags through `v0.1.147` lack the required `gen/go/`
prefix and are not resolvable for this nested module. Use the exact
generated commit as a stable fallback; Go records an immutable
pseudo-version:

```bash
GOPROXY=direct go get github.com/KirkDiggler/rpg-api-protos/gen/go@1e5c208d02ee4d81f167bc8d5ae272016ca0bd57
```

That commit is the generated output for root release `v0.1.147`.
Do not use `gen/go@v0.1.147`; the root tag does not identify the
nested module.

### TypeScript

```typescript
import { CharacterServiceClient } from '@kirkdiggler/rpg-api-protos/dnd5e/api/v1alpha1/character_connect';
import { Character } from '@kirkdiggler/rpg-api-protos/dnd5e/api/v1alpha1/character_pb';

const client = new CharacterServiceClient(transport);
```

Standard `npm install @kirkdiggler/rpg-api-protos`.

## Why the `generated` branch exists

Go modules can resolve a branch name as a pseudo-version. `@generated`
gives you "latest from main" without needing to know the tag. An exact
generated commit gives the same pseudo-version mechanism with an
immutable selector and is the stable fallback for historical releases.
rpg-api's `CLAUDE.md` recommends:

```bash
GOPROXY=direct go get github.com/KirkDiggler/rpg-api-protos/gen/go@generated
```

This pulls the most recent generated artifacts. The `generated` branch
is force-pushed every CI run, so a `go mod tidy` after each merge
gets the latest.

## What can go wrong

- **You committed to `generated`.** That branch is force-pushed on every
  main merge. Your commit will be lost. Always work in feature branches
  per `CLAUDE.md`.
- **Generated output drifts from proto.** Only happens if you edit
  `gen/` files directly (don't) or if `buf generate` fails silently.
  Run it locally to confirm.
- **`make mocks` fails.** The CI installs `mockgen` first
  (`go install go.uber.org/mock/mockgen@latest`). Missing locally
  → install it.
- **A release rerun sees one tag but not its pair.** CI fails closed; it does
  not allocate or rewrite another version. Repair requires an explicit release
  decision rather than an automatic retry.
- **GitHub/npm fails after the atomic ref push.** Rerun the same main job. It
  reuses the complete tag pair, creates or updates the root GitHub release,
  and publishes npm only if the exact root-derived version is absent.

## See also

- [run-buf-checks-locally.md](run-buf-checks-locally.md) — pre-push
  validation
- [breaking-change-workflow.md](breaking-change-workflow.md) — what to
  do when a change breaks the SDK ABI
