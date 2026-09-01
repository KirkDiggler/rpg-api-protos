#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo "usage: $0 <source-sha> <candidate-generated-commit> <repository-module-path> [go-mod-file]" >&2
  exit 2
}

die() {
  echo "release planning failed: $*" >&2
  exit 1
}

[ "$#" -ge 3 ] && [ "$#" -le 4 ] || usage

SOURCE_SHA="$1"
CANDIDATE_COMMIT="$2"
REPOSITORY_MODULE_PATH="$3"
GO_MOD_FILE="${4:-gen/go/go.mod}"

SOURCE_SHA="$(git rev-parse --verify "$SOURCE_SHA^{commit}")" || die "invalid source commit"
CANDIDATE_COMMIT="$(git rev-parse --verify "$CANDIDATE_COMMIT^{commit}")" || die "invalid generated commit"
git merge-base --is-ancestor "$SOURCE_SHA" "$CANDIDATE_COMMIT" || \
  die "generated commit $CANDIDATE_COMMIT is not based on source $SOURCE_SHA"

[ -f "$GO_MOD_FILE" ] || die "missing $GO_MOD_FILE"
mapfile -t MODULE_DECLARATIONS < <(awk '$1 == "module" && NF == 2 { print $2 }' "$GO_MOD_FILE")
[ "${#MODULE_DECLARATIONS[@]}" -eq 1 ] || die "expected one module declaration in $GO_MOD_FILE"
MODULE_PATH="${MODULE_DECLARATIONS[0]}"
EXPECTED_MODULE_PATH="$REPOSITORY_MODULE_PATH/gen/go"
[ "$MODULE_PATH" = "$EXPECTED_MODULE_PATH" ] || \
  die "expected Go module $EXPECTED_MODULE_PATH, found $MODULE_PATH"
MODULE_TAG_PREFIX="${MODULE_PATH#"$REPOSITORY_MODULE_PATH/"}"
[ "$MODULE_TAG_PREFIX" != "$MODULE_PATH" ] && [ -n "$MODULE_TAG_PREFIX" ] || \
  die "cannot derive a repository-relative module prefix from $MODULE_PATH"

ref_exists() {
  git show-ref --verify --quiet "refs/tags/$1"
}

peeled_commit() {
  git rev-parse --verify "refs/tags/$1^{commit}" 2>/dev/null
}

source_for_tag() {
  local commit
  local trailers
  local -a source_values

  commit="$(peeled_commit "$1")" || return 1
  trailers="$(git show -s --format='%(trailers:key=Source-SHA,valueonly)' "$commit")"
  mapfile -t source_values < <(printf '%s\n' "$trailers" | awk 'NF == 1 { print }')
  [ "${#source_values[@]}" -eq 1 ] || return 1
  printf '%s\n' "${source_values[0]}"
}

mapfile -t ALL_TAGS < <(git for-each-ref --format='%(refname:strip=2)' refs/tags)
ROOT_TAGS=()
declare -A RELEASE_ROOTS=()
for tag in "${ALL_TAGS[@]}"; do
  if [[ "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    ROOT_TAGS+=("$tag")
    RELEASE_ROOTS["$tag"]=1
    continue
  fi

  if [[ "$tag" == "$MODULE_TAG_PREFIX/"* ]]; then
    possible_root="${tag#"$MODULE_TAG_PREFIX/"}"
    if [[ "$possible_root" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      RELEASE_ROOTS["$possible_root"]=1
    fi
  fi
done

LATEST_TAG="v0.0.0"
if [ "${#ROOT_TAGS[@]}" -gt 0 ]; then
  LATEST_TAG="$(printf '%s\n' "${ROOT_TAGS[@]}" | sort -V | tail -1)"
fi

CURRENT_RELEASES=()
if [ "${#RELEASE_ROOTS[@]}" -gt 0 ]; then
  mapfile -t RELEASE_VERSIONS < <(printf '%s\n' "${!RELEASE_ROOTS[@]}" | sort -V)
else
  RELEASE_VERSIONS=()
fi

for root_tag in "${RELEASE_VERSIONS[@]}"; do
  module_tag="$MODULE_TAG_PREFIX/$root_tag"
  root_source=""
  module_source=""
  root_is_current=0
  module_is_current=0

  if ref_exists "$root_tag"; then
    root_source="$(source_for_tag "$root_tag" || true)"
    [ "$root_source" = "$SOURCE_SHA" ] && root_is_current=1
  fi
  if ref_exists "$module_tag"; then
    module_source="$(source_for_tag "$module_tag" || true)"
    [ "$module_source" = "$SOURCE_SHA" ] && module_is_current=1
  fi

  if [ "$root_is_current" -eq 1 ] || [ "$module_is_current" -eq 1 ]; then
    if ! ref_exists "$root_tag" || ! ref_exists "$module_tag"; then
      die "partial release for source $SOURCE_SHA: expected both $root_tag and $module_tag"
    fi
    if [ "$root_is_current" -ne 1 ] || [ "$module_is_current" -ne 1 ]; then
      die "inconsistent release pair for source $SOURCE_SHA: $root_tag and $module_tag have different source identities"
    fi

    root_commit="$(peeled_commit "$root_tag")" || die "$root_tag does not peel to a commit"
    module_commit="$(peeled_commit "$module_tag")" || die "$module_tag does not peel to a commit"
    [ "$root_commit" = "$module_commit" ] || \
      die "release pair $root_tag and $module_tag does not target one generated commit"
    CURRENT_RELEASES+=("$root_tag")
  fi
done

if [ "${#CURRENT_RELEASES[@]}" -gt 1 ]; then
  die "source $SOURCE_SHA already has multiple complete releases: ${CURRENT_RELEASES[*]}"
fi

if [ "${#CURRENT_RELEASES[@]}" -eq 1 ]; then
  NEW_TAG="${CURRENT_RELEASES[0]}"
  [ "$NEW_TAG" = "$LATEST_TAG" ] || \
    die "source $SOURCE_SHA belongs to stale release $NEW_TAG; latest root release is $LATEST_TAG"
  GO_MODULE_TAG="$MODULE_TAG_PREFIX/$NEW_TAG"
  GENERATED_COMMIT="$(peeled_commit "$NEW_TAG")"
  REUSE_RELEASE=true
else
  version="${LATEST_TAG#v}"
  IFS=. read -r major minor patch <<< "$version"
  NEW_TAG="v${major}.${minor}.$((10#$patch + 1))"
  GO_MODULE_TAG="$MODULE_TAG_PREFIX/$NEW_TAG"
  ref_exists "$NEW_TAG" && die "ref $NEW_TAG already exists"
  ref_exists "$GO_MODULE_TAG" && die "ref $GO_MODULE_TAG already exists without its root pair"
  GENERATED_COMMIT="$CANDIDATE_COMMIT"
  REUSE_RELEASE=false
fi

NPM_VERSION="${NEW_TAG#v}"

printf 'LATEST_TAG=%s\n' "$LATEST_TAG"
printf 'NEW_TAG=%s\n' "$NEW_TAG"
printf 'GO_MODULE_TAG=%s\n' "$GO_MODULE_TAG"
printf 'MODULE_PATH=%s\n' "$MODULE_PATH"
printf 'MODULE_TAG_PREFIX=%s\n' "$MODULE_TAG_PREFIX"
printf 'SOURCE_SHA=%s\n' "$SOURCE_SHA"
printf 'GENERATED_COMMIT=%s\n' "$GENERATED_COMMIT"
printf 'NPM_VERSION=%s\n' "$NPM_VERSION"
printf 'REUSE_RELEASE=%s\n' "$REUSE_RELEASE"
