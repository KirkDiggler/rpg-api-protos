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

`.github/workflows/ci.yml` `publish-packages` job:

1. Generates code: `buf generate` writes `gen/go` and `gen/ts`.
2. Generates mocks: `make mocks` runs `mockgen` against the gRPC
   client interfaces and writes them under `gen/go`.
3. Sets up the Go module: `cd gen/go && go mod init && go mod tidy`.
4. Force-pushes a `generated` branch with the contents of `gen/`.
5. Computes the next version from root `v*` tags only.
6. Creates annotated root `vX.Y.Z` and Go module
   `gen/go/vX.Y.Z` tags on the exact same generated commit, validates
   the module/tag shape locally, and pushes both tags.
7. Retains the existing GitHub release and npm publication semantics;
   the root tag remains their release identity.

Verified by reading the workflow directly. Steps 4-7 only run on
pushes to `main`.

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
`vX.Y.Z` tag remains present for the existing release/npm flow.

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

## See also

- [run-buf-checks-locally.md](run-buf-checks-locally.md) — pre-push
  validation
- [breaking-change-workflow.md](breaking-change-workflow.md) — what to
  do when a change breaks the SDK ABI
