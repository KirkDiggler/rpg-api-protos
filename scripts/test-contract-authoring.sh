#!/usr/bin/env bash
# Tests project policy/tool routing, not generated protobuf mechanics.
set -euo pipefail
repo="$(cd "$(dirname "$0")/.."; pwd)"
fixture="$(mktemp -d)"
git -C "$fixture" init -q
git -C "$fixture" config user.email fixture@example.invalid
git -C "$fixture" config user.name Fixture
printf 'syntax = "proto3";\noption go_package = "legacy";\n' > "$fixture/legacy.proto"
git -C "$fixture" add legacy.proto
git -C "$fixture" commit -qm baseline
base="$(git -C "$fixture" rev-parse HEAD)"
check() (
  cd "$fixture"
  bash "$repo/scripts/check-new-proto-options.sh" "$base"
)
expect_failure() {
  if "$@" > "$fixture/failure.log" 2>&1; then
    echo "FAIL: expected rejection: $*" >&2
    exit 1
  fi
}

check
printf '\noption java_package = "legacy";\n' >> "$fixture/legacy.proto"
check
echo 'PASS: existing legacy files are not gated'

printf 'syntax = "proto3";\npackage api.fixture.v1alpha1;\n' > "$fixture/new.proto"
check
echo 'PASS: clean untracked contract'

printf 'option go_package = "unused";\n' >> "$fixture/new.proto"
expect_failure check
grep -q 'go_package' "$fixture/failure.log"
echo 'PASS: untracked Go option rejected'

git -C "$fixture" add new.proto
expect_failure check
echo 'PASS: staged Go option rejected'

git -C "$fixture" commit -qm new-contract
expect_failure check
echo 'PASS: committed Go option rejected'

cat > "$fixture/new.proto" <<'PROTO'
syntax = "proto3";
package api.fixture.v1alpha1;
/*
option go_package = "comment only";
*/
// option java_package = "comment only";
option deprecated = false;
option (example.text) = "option java_package = ignored";
PROTO
check
echo 'PASS: comments and option-like string contents ignored'

printf 'option\njava_multiple_files\n= true;\n' >> "$fixture/new.proto"
expect_failure check
grep -q 'java_multiple_files' "$fixture/failure.log"
echo 'PASS: multiline Java declaration rejected'

expect_failure bash -c 'cd "$1"; bash "$2" missing-revision' bash "$fixture" "$repo/scripts/check-new-proto-options.sh"
echo 'PASS: unavailable comparison baseline fails closed'

# Exercise make test without real remote plugins, Node, Go or mockgen.
# The stub records every Buf action and rejects generation/unexpected actions.
mkdir "$fixture/bin"
cat > "$fixture/bin/buf" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$CONTRACT_LOG"
case "$1" in
  lint|format|breaking) ;;
  *) echo "unexpected Buf action: $*" >&2; exit 99 ;;
esac
if [[ "${FAIL_ACTION:-}" == "$1" ]]; then exit 42; fi
STUB
chmod +x "$fixture/bin/buf"
for tool in go npm npx mockgen; do
  printf '#!/usr/bin/env bash\necho "forbidden authoring tool" >&2\nexit 99\n' > "$fixture/bin/$tool"
  chmod +x "$fixture/bin/$tool"
done
# Restore a clean newly added contract for the make invocation.
printf 'syntax = "proto3";\npackage api.fixture.v1alpha1;\n' > "$fixture/new.proto"
mkdir "$fixture/scripts"
cp "$repo/scripts/check-new-proto-options.sh" "$fixture/scripts/"
export CONTRACT_LOG="$fixture/buf.log"
PATH="$fixture/bin:$PATH" make -C "$fixture" -f "$repo/Makefile" test NEW_PROTO_BASE="$base"
[[ "$(wc -l < "$CONTRACT_LOG")" -eq 3 ]]
grep -q '^lint ' "$CONTRACT_LOG"
grep -q '^format .*--exit-code' "$CONTRACT_LOG"
grep -q '^breaking .*rpg-api-protos.git#branch=main$' "$CONTRACT_LOG"
echo 'PASS: make test invokes only lint, format check, policy guard and breaking'
expect_failure env PATH="$fixture/bin:$PATH" FAIL_ACTION=lint make -C "$fixture" -f "$repo/Makefile" test NEW_PROTO_BASE="$base" BREAKING_AGAINST=fixture
echo 'PASS: contract check failure propagates through make test'
printf 'option java_package = "bad";\n' >> "$fixture/new.proto"
expect_failure env PATH="$fixture/bin:$PATH" make -C "$fixture" -f "$repo/Makefile" test NEW_PROTO_BASE="$base" BREAKING_AGAINST=fixture
echo 'PASS: policy failure propagates through make test'
echo 'All contract-authoring policy tests passed.'
