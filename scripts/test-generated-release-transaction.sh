#!/usr/bin/env bash

set -euo pipefail

REPOSITORY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLANNER="$REPOSITORY_ROOT/scripts/plan-generated-release.sh"
SOURCE_STATUS="$REPOSITORY_ROOT/scripts/release-source-status.sh"
PUBLICATION_STATUS="$REPOSITORY_ROOT/scripts/release-publication-status.sh"
REPOSITORY_MODULE_PATH=github.com/KirkDiggler/rpg-api-protos

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

publish_refs_if_new() {
  local reuse_release="$1"
  local generated_commit="$2"
  local root_tag="$3"
  local module_tag="$4"

  if [ "$reuse_release" = true ]; then
    return 0
  fi
  git push -q --atomic origin \
    "+$generated_commit:refs/heads/generated" \
    "refs/tags/$root_tag:refs/tags/$root_tag" \
    "refs/tags/$module_tag:refs/tags/$module_tag"
}

fence_before_planning() {
  local source_sha="$1"
  local candidate_commit="$2"
  local plan_file="$3"

  FENCE_RESULT="$($SOURCE_STATUS "$source_sha" refs/remotes/origin/main)"
  if [ "$FENCE_RESULT" = coalesced ]; then
    return 0
  fi
  [ "$FENCE_RESULT" = current ] || fail "unexpected source fence result: $FENCE_RESULT"
  "$PLANNER" "$source_sha" "$candidate_commit" "$REPOSITORY_MODULE_PATH" > "$plan_file"
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
printf 'source A\n' > "$WORK/source.txt"
printf 'module github.com/KirkDiggler/rpg-api-protos/gen/go\n' > "$WORK/gen/go/go.mod"
printf 'export const generated = "A";\n' > "$WORK/gen/ts/index.ts"
git -C "$WORK" add .
git -C "$WORK" commit -q -m "source A"
SOURCE_A="$(git -C "$WORK" rev-parse HEAD)"

git -C "$WORK" commit -q --allow-empty \
  -m "generated A" -m "Source-SHA: $SOURCE_A"
GENERATED_A="$(git -C "$WORK" rev-parse HEAD)"
OLD_COMMIT="$(printf 'historical generated\n' | git -C "$WORK" commit-tree "$SOURCE_A^{tree}" -p "$SOURCE_A")"

git -C "$WORK" tag -a v1.2.3 -m "historical root" "$OLD_COMMIT"
git -C "$WORK" tag -a v7.0.0-rc.1 -m "prerelease must not count" "$OLD_COMMIT"
git -C "$WORK" tag -a gen/go/v9.9.9 -m "module tag must not count" "$OLD_COMMIT"

# The bare remote stands in for GitHub. No public refs or releases are touched.
git init -q --bare "$REMOTE"
git -C "$WORK" remote add origin "$REMOTE"
git -C "$WORK" push -q origin \
  "$SOURCE_A:refs/heads/main" \
  "$OLD_COMMIT:refs/heads/generated" \
  refs/tags/v1.2.3 \
  refs/tags/v7.0.0-rc.1 \
  refs/tags/gen/go/v9.9.9
git -C "$WORK" fetch -q --force --tags origin \
  "+refs/heads/main:refs/remotes/origin/main"

cd "$WORK"
STATUS_BEFORE="$(refs_snapshot)"
assert_equal current "$($SOURCE_STATUS "$SOURCE_A" refs/remotes/origin/main)" \
  "current source fence"
STATUS_AFTER="$(refs_snapshot)"
assert_equal "$STATUS_BEFORE" "$STATUS_AFTER" "source status check must not mutate release refs"

# Plan release A. Only strict final root tags drive the clock.
BEFORE_PLAN="$(refs_snapshot)"
PLAN_A="$TMP_ROOT/plan-a.env"
"$PLANNER" "$SOURCE_A" "$GENERATED_A" "$REPOSITORY_MODULE_PATH" > "$PLAN_A"
AFTER_PLAN="$(refs_snapshot)"
assert_equal "$BEFORE_PLAN" "$AFTER_PLAN" "planner must not mutate refs"
# shellcheck disable=SC1090
. "$PLAN_A"
assert_equal v1.2.3 "$LATEST_TAG" "strict root version clock"
assert_equal v1.2.4 "$NEW_TAG" "A root tag"
assert_equal gen/go/v1.2.4 "$GO_MODULE_TAG" "A derived module tag"
assert_equal gen/go "$MODULE_TAG_PREFIX" "derived module prefix"
assert_equal false "$REUSE_RELEASE" "A new-source decision"
assert_equal "$GENERATED_A" "$GENERATED_COMMIT" "A candidate identity"
A_ROOT_TAG="$NEW_TAG"
A_MODULE_TAG="$GO_MODULE_TAG"

git tag -a "$A_ROOT_TAG" -m "Generated code for $A_ROOT_TAG" "$GENERATED_A"
git tag -a "$A_MODULE_TAG" -m "Generated Go module for $A_ROOT_TAG" "$GENERATED_A"
assert_equal tag "$(git cat-file -t "refs/tags/$A_ROOT_TAG")" "A root tag object type"
assert_equal tag "$(git cat-file -t "refs/tags/$A_MODULE_TAG")" "A module tag object type"
assert_equal "$GENERATED_A" "$(git rev-parse "$A_ROOT_TAG^{commit}")" "A root target"
assert_equal "$GENERATED_A" "$(git rev-parse "$A_MODULE_TAG^{commit}")" "A module target"

ROOT_HISTORICAL_OID="$(git rev-parse refs/tags/v1.2.3)"
MODULE_HISTORICAL_OID="$(git rev-parse refs/tags/gen/go/v9.9.9)"

# A rejected tag leaves generated and both new tags unchanged atomically.
cat > "$REMOTE/hooks/update" <<'HOOK'
#!/usr/bin/env bash
if [ "$1" = "refs/tags/gen/go/v1.2.4" ]; then
  echo "rejecting module tag for atomic rollback test" >&2
  exit 1
fi
HOOK
chmod +x "$REMOTE/hooks/update"
REMOTE_BEFORE_REJECTION="$(bare_refs_snapshot "$REMOTE")"
if git push --atomic origin \
  "+$GENERATED_A:refs/heads/generated" \
  "refs/tags/$A_ROOT_TAG:refs/tags/$A_ROOT_TAG" \
  "refs/tags/$A_MODULE_TAG:refs/tags/$A_MODULE_TAG" \
  >"$TMP_ROOT/rejected-push.out" 2>"$TMP_ROOT/rejected-push.err"; then
  fail "atomic push with a rejected tag unexpectedly succeeded"
fi
REMOTE_AFTER_REJECTION="$(bare_refs_snapshot "$REMOTE")"
assert_equal "$REMOTE_BEFORE_REJECTION" "$REMOTE_AFTER_REJECTION" \
  "atomic rejection must leave every remote ref unchanged"

rm "$REMOTE/hooks/update"
publish_refs_if_new false "$GENERATED_A" "$A_ROOT_TAG" "$A_MODULE_TAG"
assert_equal "$GENERATED_A" "$(git --git-dir="$REMOTE" rev-parse refs/heads/generated)" \
  "published A generated branch"
assert_equal "$GENERATED_A" "$(git --git-dir="$REMOTE" rev-parse "refs/tags/$A_ROOT_TAG^{commit}")" \
  "published A root tag"
assert_equal "$GENERATED_A" "$(git --git-dir="$REMOTE" rev-parse "refs/tags/$A_MODULE_TAG^{commit}")" \
  "published A module tag"

# Advance main to source B, then publish release B.
git checkout -q -B main "$SOURCE_A"
printf 'source B\n' > source.txt
git add source.txt
git commit -q -m "source B"
SOURCE_B="$(git rev-parse HEAD)"
git push -q origin "$SOURCE_B:refs/heads/main"
git commit -q --allow-empty -m "generated B" -m "Source-SHA: $SOURCE_B"
GENERATED_B="$(git rev-parse HEAD)"

PLAN_B="$TMP_ROOT/plan-b.env"
"$PLANNER" "$SOURCE_B" "$GENERATED_B" "$REPOSITORY_MODULE_PATH" > "$PLAN_B"
# shellcheck disable=SC1090
. "$PLAN_B"
assert_equal v1.2.4 "$LATEST_TAG" "B sees A as latest strict release"
assert_equal v1.2.5 "$NEW_TAG" "B root tag"
assert_equal gen/go/v1.2.5 "$GO_MODULE_TAG" "B module tag"
assert_equal false "$REUSE_RELEASE" "B new-source decision"
assert_equal "$GENERATED_B" "$GENERATED_COMMIT" "B candidate identity"
B_ROOT_TAG="$NEW_TAG"
B_MODULE_TAG="$GO_MODULE_TAG"
git tag -a "$B_ROOT_TAG" -m "Generated code for $B_ROOT_TAG" "$GENERATED_B"
git tag -a "$B_MODULE_TAG" -m "Generated Go module for $B_ROOT_TAG" "$GENERATED_B"
publish_refs_if_new false "$GENERATED_B" "$B_ROOT_TAG" "$B_MODULE_TAG"
assert_equal "$GENERATED_B" "$(git --git-dir="$REMOTE" rev-parse refs/heads/generated)" \
  "published B generated branch"

git fetch -q --force --tags origin \
  "+refs/heads/main:refs/remotes/origin/main"
assert_equal current "$($SOURCE_STATUS "$SOURCE_B" refs/remotes/origin/main)" \
  "B remains current after fetch"

# A delayed source is coalesced before planning. Make local planning
# deliberately fail-closed; successful fencing proves the planner was never
# reached. The coalesced path also never reaches ref/GitHub publication.
COALESCE_SAVED_B_MODULE="$(git rev-parse "refs/tags/$B_MODULE_TAG")"
git update-ref -d "refs/tags/$B_MODULE_TAG"
REMOTE_BEFORE_COALESCE="$(bare_refs_snapshot "$REMOTE")"
fence_before_planning "$SOURCE_A" "$GENERATED_A" "$TMP_ROOT/coalesced-plan.env"
assert_equal coalesced "$FENCE_RESULT" "superseded source decision"
[ ! -e "$TMP_ROOT/coalesced-plan.env" ] || fail "coalesced source reached release planning"
REMOTE_AFTER_COALESCE="$(bare_refs_snapshot "$REMOTE")"
assert_equal "$REMOTE_BEFORE_COALESCE" "$REMOTE_AFTER_COALESCE" \
  "coalesced source must perform no remote mutation"
git update-ref "refs/tags/$B_MODULE_TAG" "$COALESCE_SAVED_B_MODULE"

# A release -> B release -> retry A: recover A's older complete pair. Reuse
# suppresses every branch/tag push, so generated cannot rewind from B to A.
RETRY_A_BEFORE="$(refs_snapshot)"
RETRY_A_PLAN="$TMP_ROOT/retry-a.env"
"$PLANNER" "$SOURCE_A" "$GENERATED_A" "$REPOSITORY_MODULE_PATH" > "$RETRY_A_PLAN"
RETRY_A_AFTER="$(refs_snapshot)"
assert_equal "$RETRY_A_BEFORE" "$RETRY_A_AFTER" "retry-A planning must not mutate refs"
# shellcheck disable=SC1090
. "$RETRY_A_PLAN"
assert_equal v1.2.5 "$LATEST_TAG" "retry A sees newer B release"
assert_equal true "$REUSE_RELEASE" "retry A reuse decision"
assert_equal "$A_ROOT_TAG" "$NEW_TAG" "retry A root identity"
assert_equal "$A_MODULE_TAG" "$GO_MODULE_TAG" "retry A module identity"
assert_equal "$GENERATED_A" "$GENERATED_COMMIT" "retry A generated identity"
REMOTE_BEFORE_REUSE="$(bare_refs_snapshot "$REMOTE")"
publish_refs_if_new "$REUSE_RELEASE" "$GENERATED_COMMIT" "$NEW_TAG" "$GO_MODULE_TAG"
REMOTE_AFTER_REUSE="$(bare_refs_snapshot "$REMOTE")"
assert_equal "$REMOTE_BEFORE_REUSE" "$REMOTE_AFTER_REUSE" \
  "reuse must perform no branch or tag push"
assert_equal "$GENERATED_B" "$(git --git-dir="$REMOTE" rev-parse refs/heads/generated)" \
  "retry A must not rewind generated from B"

# A source-associated root-only pair fails closed.
SAVED_A_MODULE="$(git rev-parse "refs/tags/$A_MODULE_TAG")"
git update-ref -d "refs/tags/$A_MODULE_TAG"
PARTIAL_BEFORE="$(refs_snapshot)"
assert_fails "source-associated root-only pair" \
  "$PLANNER" "$SOURCE_A" "$GENERATED_A" "$REPOSITORY_MODULE_PATH"
PARTIAL_AFTER="$(refs_snapshot)"
assert_equal "$PARTIAL_BEFORE" "$PARTIAL_AFTER" \
  "failed root-only planning must not mutate refs"
git update-ref "refs/tags/$A_MODULE_TAG" "$SAVED_A_MODULE"

# The inverse module-only state also fails closed.
SAVED_A_ROOT="$(git rev-parse "refs/tags/$A_ROOT_TAG")"
git update-ref -d "refs/tags/$A_ROOT_TAG"
assert_fails "source-associated module-only pair" \
  "$PLANNER" "$SOURCE_A" "$GENERATED_A" "$REPOSITORY_MODULE_PATH"
git update-ref "refs/tags/$A_ROOT_TAG" "$SAVED_A_ROOT"

# A partial pair for another source also closes planning; it cannot be skipped
# merely because the triggering source already has a complete release.
SAVED_B_MODULE="$(git rev-parse "refs/tags/$B_MODULE_TAG")"
git update-ref -d "refs/tags/$B_MODULE_TAG"
assert_fails "other-source partial pair" \
  "$PLANNER" "$SOURCE_A" "$GENERATED_A" "$REPOSITORY_MODULE_PATH"
git update-ref "refs/tags/$B_MODULE_TAG" "$SAVED_B_MODULE"

# A pair whose tags record different sources is inconsistent.
git update-ref "refs/tags/$A_MODULE_TAG" "$SAVED_B_MODULE"
assert_fails "different-source release pair" \
  "$PLANNER" "$SOURCE_A" "$GENERATED_A" "$REPOSITORY_MODULE_PATH"
git update-ref "refs/tags/$A_MODULE_TAG" "$SAVED_A_MODULE"

# A pair recording one source but peeling to different generated commits is
# also inconsistent.
ALT_A_COMMIT="$(printf 'alternate generated A\n\nSource-SHA: %s\n' "$SOURCE_A" | \
  git commit-tree "$SOURCE_A^{tree}" -p "$SOURCE_A")"
git tag -a test-alt-a -m "alternate A tag object" "$ALT_A_COMMIT"
ALT_A_TAG_OBJECT="$(git rev-parse refs/tags/test-alt-a)"
git update-ref "refs/tags/$A_MODULE_TAG" "$ALT_A_TAG_OBJECT"
assert_fails "different-target release pair" \
  "$PLANNER" "$SOURCE_A" "$GENERATED_A" "$REPOSITORY_MODULE_PATH"
git update-ref "refs/tags/$A_MODULE_TAG" "$SAVED_A_MODULE"
git tag -d test-alt-a >/dev/null

assert_equal "$ROOT_HISTORICAL_OID" "$(git --git-dir="$REMOTE" rev-parse refs/tags/v1.2.3)" \
  "historical root tag object"
assert_equal "$MODULE_HISTORICAL_OID" "$(git --git-dir="$REMOTE" rev-parse refs/tags/gen/go/v9.9.9)" \
  "historical module tag object"

# Stub only the read-side GitHub release query. No external release is created.
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
chmod +x "$STUB_BIN/gh"

GH_CREATE="$(PATH="$STUB_BIN:$PATH" STUB_GH_RESULT=absent \
  "$PUBLICATION_STATUS" github KirkDiggler/rpg-api-protos "$A_ROOT_TAG")"
assert_equal create "$GH_CREATE" "missing GitHub release decision"
GH_UPDATE="$(PATH="$STUB_BIN:$PATH" STUB_GH_RESULT=present STUB_GH_TAG="$A_ROOT_TAG" \
  "$PUBLICATION_STATUS" github KirkDiggler/rpg-api-protos "$A_ROOT_TAG")"
assert_equal update "$GH_UPDATE" "existing GitHub release decision"
assert_fails "GitHub authentication failure" env \
  PATH="$STUB_BIN:$PATH" STUB_GH_RESULT=auth \
  "$PUBLICATION_STATUS" github KirkDiggler/rpg-api-protos "$A_ROOT_TAG"

printf 'generated release transaction tests passed\n'
