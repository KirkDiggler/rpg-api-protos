---
name: Regenerate SDKs
description: How CI generates Go and TypeScript SDKs and how to consume them
updated: 2026-05-04
confidence: high — verified by reading buf.gen.yaml and .github/workflows/ci.yml
---

# Regenerate SDKs

The repo generates two SDK targets: Go (gRPC + grpc-go) and TypeScript
(Connect-ES via `bufbuild/es`). You should rarely need to do this
locally — CI does it on every merge to main and force-pushes the
result to the `generated` branch plus an auto-incremented git tag.

## What the pipeline does

`.github/workflows/ci.yml` `publish-packages` job:

1. Generates code: `buf generate` writes `gen/go` and `gen/ts`.
2. Generates mocks: `make mocks` runs `mockgen` against the gRPC
   client interfaces and writes them under `gen/go`.
3. Sets up the Go module: `cd gen/go && go mod init && go mod tidy`.
4. Force-pushes a `generated` branch with the contents of `gen/`.
5. Auto-increments the latest `vX.Y.Z` tag and pushes it on the
   `generated` branch.
6. Creates a GitHub release.
7. Publishes to npm: `cp -r gen/ts/* . && npm publish`.

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

To pin to a specific tag:
```bash
go get github.com/KirkDiggler/rpg-api-protos/gen/go@v0.1.86
```

### TypeScript

```typescript
import { CharacterServiceClient } from '@kirkdiggler/rpg-api-protos/dnd5e/api/v1alpha1/character_connect';
import { Character } from '@kirkdiggler/rpg-api-protos/dnd5e/api/v1alpha1/character_pb';

const client = new CharacterServiceClient(transport);
```

Standard `npm install @kirkdiggler/rpg-api-protos`.

## Why the `generated` branch exists

Go modules can resolve a branch name as a pseudo-version. `@generated`
gives you "latest from main" without needing to know the tag.
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
