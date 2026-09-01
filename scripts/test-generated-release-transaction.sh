#!/usr/bin/env bash

set -euo pipefail

REPOSITORY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLANNER="$REPOSITORY_ROOT/scripts/plan-generated-release.sh"
PUBLICATION_STATUS="$REPOSITORY_ROOT/scripts/release-publication-status.sh"

fail() {
  echo "release transaction test failed: $*" >&2
  exit 1
}

assert_equal() {
  local expected="$1"
  local actual="$2"
  local description="$3"
  [ "$actual" = "$expected" ] || fail "$description: expected '$expected', found '$actual'"
}

assert_fails() {
  local description="$1"
  shift
  if "$@" >"$TMP_ROOT/expected-failure.out" 2>"$TMP_ROOT/expected-failure.err"; then
    fail "$description unexpectedly succeeded"
  fi
}

refs_snapshot() {
  git for-each-ref --format='%(refname) %(objectname)' refs/heads refs/tags | sort
}

bare_refs_snapshot() {
  git --git-dir="$1" for-each-ref --format='%(refname) %(objectname)' refs/heads refs/tags | sort
}

TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

WORK="$TMP_ROOT/work"
REMOTE="$TMP_ROOT/remote.git"
mkdir -p "$WORK"
git -C "$WORK" init -q -b main
git -C "$WORK" config user.name "Release Test"
git -C "$WORK" config user.email "release-test@example.com"

mkdir -p "$WORK/gen/go" "$WORK/gen/ts"
printf 'source\n' > "$WORK/source.txt"
printf 'module github.com/KirkDiggler/rpg-api-protos/gen/go\n' > "$WORK/gen/go/go.mod"
printf 'export const generated = true;\n' > "$WORK/gen/ts/index.ts"
git -C "$WORK" add .
git -C "$WORK" commit -q -m "source"
SOURCE_SHA="$(git -C "$WORK" rev-parse HEAD)"

git -C "$WORK" commit -q --allow-empty -m "generated" -m "Source-SHA: $SOURCE_SHA"
GENERATED_COMMIT="$(git -C "$WORK" rev-parse HEAD)"
EXPECTED_GENERATED_COMMIT="$GENERATED_COMMIT"
OLD_COMMIT="$(printf 'historical generated\n' | git -C "$WORK" commit-tree "$SOURCE_SHA^{tree}" -p "$SOURCE_SHA")"

git -C "$WORK" tag -a v1.2.3 -m "historical root" "$OLD_COMMIT"
git -C "$WORK" tag -a v7.0.0-rc.1 -m "prerelease must not count" "$OLD_COMMIT"
git -C "$WORK" tag -a gen/go/v9.9.9 -m "module tag must not count" "$OLD_COMMIT"

cd "$WORK"
BEFORE_PLAN="$(refs_snapshot)"
PLAN_FILE="$TMP_ROOT/plan.env"
"$PLANNER" "$SOURCE_SHA" "$GENERATED_COMMIT" \
  github.com/KirkDiggler/rpg-api-protos > "$PLAN_FILE"
AFTER_PLAN="$(refs_snapshot)"
assert_equal "$BEFORE_PLAN" "$AFTER_PLAN" "planner must not mutate refs"
# shellcheck disable=SC1090
. "$PLAN_FILE"
assert_equal "v1.2.3" "$LATEST_TAG" "strict root version clock"
assert_equal "v1.2.4" "$NEW_TAG" "next root tag"
assert_equal "gen/go/v1.2.4" "$GO_MODULE_TAG" "derived module tag"
assert_equal "gen/go" "$MODULE_TAG_PREFIX" "derived module prefix"
assert_equal "1.2.4" "$NPM_VERSION" "npm version"
assert_equal "false" "$REUSE_RELEASE" "new source decision"
assert_equal "$EXPECTED_GENERATED_COMMIT" "$GENERATED_COMMIT" "candidate identity"

git tag -a "$NEW_TAG" -m "Generated code for $NEW_TAG" "$GENERATED_COMMIT"
git tag -a "$GO_MODULE_TAG" -m "Generated Go module for $NEW_TAG" "$GENERATED_COMMIT"
assert_equal "tag" "$(git cat-file -t "refs/tags/$NEW_TAG")" "root tag object type"
assert_equal "tag" "$(git cat-file -t "refs/tags/$GO_MODULE_TAG")" "Go tag object type"
assert_equal "$GENERATED_COMMIT" "$(git rev-parse "$NEW_TAG^{commit}")" "root tag target"
assert_equal "$GENERATED_COMMIT" "$(git rev-parse "$GO_MODULE_TAG^{commit}")" "Go tag target"

ROOT_HISTORICAL_OID="$(git rev-parse refs/tags/v1.2.3)"
MODULE_HISTORICAL_OID="$(git rev-parse refs/tags/gen/go/v9.9.9)"

git init -q --bare "$REMOTE"
git push -q "$REMOTE" \
  "$OLD_COMMIT:refs/heads/generated" \
  refs/tags/v1.2.3 \
  refs/tags/v7.0.0-rc.1 \
  refs/tags/gen/go/v9.9.9

cat > "$REMOTE/hooks/update" <<'HOOK'
#!/usr/bin/env bash
if [ "$1" = "refs/tags/gen/go/v1.2.4" ]; then
  echo "rejecting module tag for atomic rollback test" >&2
  exit 1
fi
HOOK
chmod +x "$REMOTE/hooks/update"

REMOTE_BEFORE_REJECTION="$(bare_refs_snapshot "$REMOTE")"
if git push --atomic "$REMOTE" \
  "+$GENERATED_COMMIT:refs/heads/generated" \
  "refs/tags/$NEW_TAG:refs/tags/$NEW_TAG" \
  "refs/tags/$GO_MODULE_TAG:refs/tags/$GO_MODULE_TAG" \
  >"$TMP_ROOT/rejected-push.out" 2>"$TMP_ROOT/rejected-push.err"; then
  fail "atomic push with a rejected tag unexpectedly succeeded"
fi
REMOTE_AFTER_REJECTION="$(bare_refs_snapshot "$REMOTE")"
assert_equal "$REMOTE_BEFORE_REJECTION" "$REMOTE_AFTER_REJECTION" "atomic rejection must leave every remote ref unchanged"

rm "$REMOTE/hooks/update"
git push -q --atomic "$REMOTE" \
  "+$GENERATED_COMMIT:refs/heads/generated" \
  "refs/tags/$NEW_TAG:refs/tags/$NEW_TAG" \
  "refs/tags/$GO_MODULE_TAG:refs/tags/$GO_MODULE_TAG"
assert_equal "$GENERATED_COMMIT" "$(git --git-dir="$REMOTE" rev-parse refs/heads/generated)" "published generated branch"
assert_equal "$GENERATED_COMMIT" "$(git --git-dir="$REMOTE" rev-parse "refs/tags/$NEW_TAG^{commit}")" "published root tag"
assert_equal "$GENERATED_COMMIT" "$(git --git-dir="$REMOTE" rev-parse "refs/tags/$GO_MODULE_TAG^{commit}")" "published Go tag"
assert_equal "$ROOT_HISTORICAL_OID" "$(git --git-dir="$REMOTE" rev-parse refs/tags/v1.2.3)" "historical root tag"
assert_equal "$MODULE_HISTORICAL_OID" "$(git --git-dir="$REMOTE" rev-parse refs/tags/gen/go/v9.9.9)" "historical module tag"

# A same-source rerun may construct a new local commit, but it must recover the
# already-complete latest pair and its original generated commit.
git commit -q --allow-empty -m "rerun candidate" -m "Source-SHA: $SOURCE_SHA"
RERUN_CANDIDATE="$(git rev-parse HEAD)"
RERUN_PLAN="$TMP_ROOT/rerun.env"
"$PLANNER" "$SOURCE_SHA" "$RERUN_CANDIDATE" \
  github.com/KirkDiggler/rpg-api-protos > "$RERUN_PLAN"
# shellcheck disable=SC1090
. "$RERUN_PLAN"
assert_equal "true" "$REUSE_RELEASE" "same-source rerun decision"
assert_equal "v1.2.4" "$NEW_TAG" "reused root tag"
assert_equal "gen/go/v1.2.4" "$GO_MODULE_TAG" "reused module tag"
assert_equal "$EXPECTED_GENERATED_COMMIT" "$GENERATED_COMMIT" "reused generated commit"

# A root-only current-source release is a closed failure, not a new allocation.
SAVED_MODULE_TAG="$(git rev-parse refs/tags/gen/go/v1.2.4)"
git update-ref -d refs/tags/gen/go/v1.2.4
PARTIAL_BEFORE="$(refs_snapshot)"
assert_fails "partial release pair" "$PLANNER" "$SOURCE_SHA" "$RERUN_CANDIDATE" \
  github.com/KirkDiggler/rpg-api-protos
PARTIAL_AFTER="$(refs_snapshot)"
assert_equal "$PARTIAL_BEFORE" "$PARTIAL_AFTER" "failed partial-pair planning must not mutate refs"
git update-ref refs/tags/gen/go/v1.2.4 "$SAVED_MODULE_TAG"

# The inverse module-only state is also a partial pair and must fail closed.
SAVED_ROOT_TAG="$(git rev-parse refs/tags/v1.2.4)"
git update-ref -d refs/tags/v1.2.4
assert_fails "inverse partial release pair" "$PLANNER" "$SOURCE_SHA" "$RERUN_CANDIDATE" \
  github.com/KirkDiggler/rpg-api-protos
git update-ref refs/tags/v1.2.4 "$SAVED_ROOT_TAG"

# Stub only read-side publication queries. No GitHub release or npm package is
# created by this test.
STUB_BIN="$TMP_ROOT/stub-bin"
mkdir -p "$STUB_BIN"
cat > "$STUB_BIN/gh" <<'GH_STUB'
#!/usr/bin/env bash
case "${STUB_GH_RESULT:?}" in
  present)
    printf '{"tag_name":"%s"}\n' "${STUB_GH_TAG:?}"
    ;;
  absent)
    echo 'gh: Not Found (HTTP 404)' >&2
    exit 1
    ;;
  auth)
    echo 'gh: authentication failed (HTTP 401)' >&2
    exit 1
    ;;
esac
GH_STUB
cat > "$STUB_BIN/npm" <<'NPM_STUB'
#!/usr/bin/env bash
case "${STUB_NPM_RESULT:?}" in
  present)
    printf '{"name":"%s","version":"%s","rpgApiProtosRelease":{"tag":"%s","goModuleTag":"%s","sourceCommit":"%s","generatedCommit":"%s"}}\n' \
      "${STUB_NPM_NAME:?}" "${STUB_NPM_VERSION:?}" "${STUB_NPM_TAG:?}" \
      "${STUB_NPM_GO_TAG:?}" "${STUB_NPM_SOURCE:?}" "${STUB_NPM_GENERATED:?}"
    ;;
  absent)
    echo 'npm error code E404' >&2
    exit 1
    ;;
  auth)
    echo 'npm error code E401' >&2
    exit 1
    ;;
esac
NPM_STUB
chmod +x "$STUB_BIN/gh" "$STUB_BIN/npm"

GH_CREATE="$(PATH="$STUB_BIN:$PATH" STUB_GH_RESULT=absent \
  "$PUBLICATION_STATUS" github KirkDiggler/rpg-api-protos v1.2.4)"
assert_equal "create" "$GH_CREATE" "missing GitHub release decision"
GH_UPDATE="$(PATH="$STUB_BIN:$PATH" STUB_GH_RESULT=present STUB_GH_TAG=v1.2.4 \
  "$PUBLICATION_STATUS" github KirkDiggler/rpg-api-protos v1.2.4)"
assert_equal "update" "$GH_UPDATE" "existing GitHub release decision"
assert_fails "GitHub authentication failure" env PATH="$STUB_BIN:$PATH" STUB_GH_RESULT=auth \
  "$PUBLICATION_STATUS" github KirkDiggler/rpg-api-protos v1.2.4

NPM_COMMON=(npm @kirkdiggler/rpg-api-protos 1.2.4 v1.2.4 gen/go/v1.2.4 "$SOURCE_SHA" "$GENERATED_COMMIT")
NPM_PUBLISH="$(PATH="$STUB_BIN:$PATH" STUB_NPM_RESULT=absent \
  "$PUBLICATION_STATUS" "${NPM_COMMON[@]}")"
assert_equal "publish" "$NPM_PUBLISH" "missing npm version decision"
NPM_ALREADY="$(PATH="$STUB_BIN:$PATH" STUB_NPM_RESULT=present \
  STUB_NPM_NAME=@kirkdiggler/rpg-api-protos STUB_NPM_VERSION=1.2.4 \
  STUB_NPM_TAG=v1.2.4 STUB_NPM_GO_TAG=gen/go/v1.2.4 \
  STUB_NPM_SOURCE="$SOURCE_SHA" STUB_NPM_GENERATED="$GENERATED_COMMIT" \
  "$PUBLICATION_STATUS" "${NPM_COMMON[@]}")"
assert_equal "already-published" "$NPM_ALREADY" "matching npm release decision"
assert_fails "mismatched npm release identity" env PATH="$STUB_BIN:$PATH" STUB_NPM_RESULT=present \
  STUB_NPM_NAME=@kirkdiggler/rpg-api-protos STUB_NPM_VERSION=1.2.4 \
  STUB_NPM_TAG=v1.2.4 STUB_NPM_GO_TAG=gen/go/v1.2.4 \
  STUB_NPM_SOURCE="$SOURCE_SHA" STUB_NPM_GENERATED=wrong \
  "$PUBLICATION_STATUS" "${NPM_COMMON[@]}"
assert_fails "npm authentication failure" env PATH="$STUB_BIN:$PATH" STUB_NPM_RESULT=auth \
  "$PUBLICATION_STATUS" "${NPM_COMMON[@]}"

printf 'generated release transaction tests passed\n'
