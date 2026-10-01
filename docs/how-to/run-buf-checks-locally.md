---
name: Run buf checks locally
description: Contract-only checks before pushing; generation and SDK validation belong to CI
---

# Run contract checks locally

Author contracts on a feature worktree based on `main`. Normal authoring requires
Buf, Git, Make and Bash/Awk, not Go, Node, mockgen or locally generated SDKs.
CI retains generation and SDK validation; merge-triggered CI publishes bindings
and mocks on `generated` for consumers.

## Normal authoring gate

From the worktree root:

```bash
buf --version
git fetch origin main
make format
make test
```

`make test` and `make pre-commit` run these checks only:

```bash
make lint          # buf lint --disable-symlinks
make format-check  # buf format --diff --exit-code --disable-symlinks
make proto-options # added tracked/untracked .proto files vs origin/main
make breaking      # buf breaking against remote main
```

All are blocking for ordinary additions. `make test` does not generate code or
mocks, install dependencies, compile consumers, or run generator-tool tests.
A proto contract PR is not a local consumer build.

## New-file options policy

New proto files use conventional package names matching their paths. Managed
mode supplies Go package paths; new contracts omit `go_package` and `java_*`
options. The policy guard ignores historical files so it does not change
published package identities. A required exception needs explicit review and a
scoped policy/config change.

Keep `origin/main` current so the guard can identify new files. It includes
untracked, staged and committed additions. To compare with an explicit revision:

```bash
make proto-options NEW_PROTO_BASE=<comparison-commit>
```

CI uses the PR base commit or main-push predecessor. Comments and string contents
are not option declarations. Missing comparison revisions fail loudly.

## When breaking detection flags a change

The remote comparison is configured by `BREAKING_AGAINST` in the Makefile.
A field removal, rename or type change can be an intentional break, but it is
not silently accepted. Follow
[breaking-change-workflow.md](breaking-change-workflow.md): record the migration
and obtain the required acknowledgment for the `breaking-change-approved` CI
label. Local detection still reports the break; a label does not authorize
changing the local gate or claiming a passing check.

Reserve retired numbers and names to prevent reuse. For unintentional breaks,
restore the agreed contract. For additions, all contract checks should pass.

## Generation is separate

Do not put `buf generate`, `make mocks`, `make compile-go` or `make compile-ts`
in the authoring checklist. CI runs its generation/validation pipeline on PRs
and publishes after merging to `main`. Consumers wait for the published output
and verify integration in their own repositories.

Explicit local generation can be useful when changing a generator or diagnosing
CI failure. See [regenerate-sdks.md](regenerate-sdks.md); its optional tooling is
not a prerequisite for writing a contract.

## Testing authoring tooling

If changing the new-file guard or Makefile routing, run:

```bash
bash scripts/test-contract-authoring.sh
```

This tests the project policy and contract-only command routing in temporary Git
fixtures. It does not re-test generated protobuf serialization or descriptors.
Generator-specific tests, such as `tools/refgen`, remain owned by their tooling
and CI; see [regenerate-content-enums.md](regenerate-content-enums.md).
