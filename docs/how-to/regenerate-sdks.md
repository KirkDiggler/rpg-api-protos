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
4. Under the serialized release lock, fetches `origin/main` and all tags
   immediately before planning, then inspects release history even for a stale
   source.
5. Searches all strict final root releases for the triggering source. A
   complete root/module pair is reused even when newer releases exist; a stale
   source without a pair coalesces, and any Source-SHA-associated partial or
   inconsistent pair fails closed. Otherwise, only final root tags matching
   `vX.Y.Z` advance the version clock.
6. Creates or reuses annotated root `vX.Y.Z` and `gen/go/vX.Y.Z` tags on the
   exact same generated commit and verifies the module path, derived `gen/go`
   prefix, peeled targets, and source identity.
7. Re-fetches and compares `origin/main` immediately before publication. A
   source that became stale after planning publishes nothing. Otherwise a new
   release performs one atomic push containing the forced `generated` update
   and both create-only tags. Reuse performs no branch or tag push.
8. From that same main-triggered job, creates or recovers the one GitHub release
   using the explicit root tag; generated notes are added only on creation.

There is no tag-triggered publication workflow. npm publication is unsupported
pending rpg-api-protos#263; #261 performs no npm packaging or publication.

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
`vX.Y.Z` tag is the explicit GitHub release identity.

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

`buf generate` produces TypeScript under `gen/ts`, and CI compile-checks that
output. npm publication is unsupported pending rpg-api-protos#263. Do not use a
new root release as evidence that `@kirkdiggler/rpg-api-protos@X.Y.Z` exists or
that its current manifest/import layout is usable. #263 owns the package and
clean-install import contract; generate locally until it lands.

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
- **A release job is delayed behind newer main.** The under-lock gate still
  scans release history. A verified same-source pair may repair only its root
  GitHub release; without a pair the job coalesces. A partial pair fails.
- **Main advances after planning.** The immediate pre-publication fetch blocks
  both ref and external publication for that newly stale source.
- **A release rerun sees a source-associated partial or inconsistent pair.**
  CI fails closed even when the bad pair belongs to another source; it does not
  allocate or rewrite another version.
- **GitHub release publication fails after the atomic ref push.** Rerun the
  same source. The planner reuses its complete pair even if newer releases
  exist, skips branch/tag publication, and retries only the root GitHub
  release without appending generated notes, so `generated` cannot rewind.
- **npm is expected after merge.** npm publication is unsupported pending
  rpg-api-protos#263 and does not run in #261.

## See also

- [run-buf-checks-locally.md](run-buf-checks-locally.md) — pre-push
  validation
- [breaking-change-workflow.md](breaking-change-workflow.md) — what to
  do when a change breaks the SDK ABI
