---
name: Run buf checks locally
description: Lint, format, and breaking-change checks before pushing
updated: 2026-05-02
confidence: high — verified by running each command on docs/honest-status-snapshot
---

# Run buf checks locally

CI runs three buf checks. Two are blocking, one is currently advisory
(see [overview.md Rule 2](../architecture/overview.md#rule-2-buf-breaking-is-authoritative-not-advisory)
— issue #139 will make it blocking). Run all three locally before
pushing.

## Prerequisites

```bash
# Install Buf CLI: https://buf.build/docs/installation
brew install bufbuild/buf/buf      # macOS
# or download from GitHub releases for Linux

buf --version                      # verify install
```

## The three checks

```bash
cd /home/kirk/personal/rpg-api-protos

# 1. Lint — blocking. Fails on violations of the buf default lint set.
buf lint

# 2. Format — blocking. Auto-fixable; check first, then write.
buf format --diff --exit-code      # check (exits non-zero if changes needed)
buf format -w                       # write fixes (run before commit)

# 3. Breaking-change detection — currently advisory in CI.
buf breaking --against "https://github.com/KirkDiggler/rpg-api-protos.git#branch=main"
```

**On `docs/honest-status-snapshot` (this branch) all three exit clean.**

## When `buf breaking` flags something

You changed a field tag, removed a field, renamed a message, etc.
The check tells you exactly what.

Two responses:

1. **You meant to break.** Use `reserved` to retire field numbers and
   names so future tag reuse is detected:
   ```proto
   message TurnState {
     reserved 9, 10;
     reserved "disengage_active", "dodge_active";
     // ...
   }
   ```
   Then bump the version package (`v1alpha1` → `v1alpha2` or
   `v1beta1`) per [breaking-change-workflow.md](breaking-change-workflow.md).

2. **You didn't mean to break.** Revert the change. Field tag numbers
   are forever within a version.

PR #136 is the worked example — old fragmented event fields retired
correctly.

## Generation locally

`buf generate` produces Go, TypeScript, and (unused) C++ code. Useful
for verifying generation works before CI.

```bash
buf generate              # writes gen/go, gen/ts, gen/cpp
make mocks                # generates Go mocks for gRPC clients

# Quick verification:
ls gen/go/dnd5e/api/v1alpha1/*.pb.go
ls gen/ts/dnd5e/api/v1alpha1/*.ts
```

The `gen/` directory is gitignored — it's regenerated per CI run and
force-pushed to the `generated` branch on main merges.

## Pre-push checklist

```bash
buf format -w                                                      # auto-fix formatting
buf lint                                                            # must pass
buf format --diff --exit-code                                       # must pass
buf breaking --against "https://github.com/KirkDiggler/rpg-api-protos.git#branch=main"   # check
buf generate                                                        # must produce output
```

If all five clean, push.

## Why each check matters

- **`buf lint`** — enforces naming consistency (Rule 6). Violations
  land as ugly Go/TS code in consumer SDKs.
- **`buf format`** — keeps PR diffs small. A formatting churn diff hides
  the actual change.
- **`buf breaking`** — the contract guarantee. A breaking change here
  is a runtime break in rpg-api or rpg-dnd5e-web. Today the check is
  advisory in CI (`continue-on-error: true`). Run it locally; don't
  rely on CI to catch it for you.
- **`buf generate`** — protos that fail to generate Go/TS won't ship.
  Catching here saves a CI cycle.

## Configuration

`buf.yaml`:
```yaml
version: v2
modules:
  - path: .
    excludes:
      - .claude
breaking:
  use:
    - FILE       # detects breaks per file (more sensitive than PACKAGE)
lint:
  use:
    - DEFAULT
  except:
    - PACKAGE_VERSION_SUFFIX        # we use v1alpha1 style
    - RPC_RESPONSE_STANDARD_NAME    # streaming RPCs use event-style names
  rpc_allow_same_request_response: false
  rpc_allow_google_protobuf_empty_requests: false
  rpc_allow_google_protobuf_empty_responses: false
```

The two `lint.except` entries are intentional — they document
deviations from the default set. New deviations should be discussed
in a PR rather than added quietly.
