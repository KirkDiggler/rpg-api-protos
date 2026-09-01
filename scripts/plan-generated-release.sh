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

inspect_tag_source() {
  local commit
  local resolved_source
  local -a source_values

  TAG_SOURCE_STATE=none
  TAG_SOURCE_VALUE=""
  commit="$(peeled_commit "$1")" || {
    TAG_SOURCE_STATE=invalid
    return
  }
  mapfile -t source_values < <(
    git show -s --format=%B "$commit" |
      git interpret-trailers --parse |
      awk 'tolower($0) ~ /^source-sha:/ { sub(/^[^:]*:[[:space:]]*/, ""); print }'
  )
  [ "${#source_values[@]}" -gt 0 ] || return 0

  TAG_SOURCE_STATE=invalid
  [ "${#source_values[@]}" -eq 1 ] || return 0
  TAG_SOURCE_VALUE="${source_values[0]}"
  [[ "$TAG_SOURCE_VALUE" =~ ^[0-9a-f]{40}$ ]] || return 0
  resolved_source="$(git rev-parse --verify "$TAG_SOURCE_VALUE^{commit}" 2>/dev/null)" || return 0
  [ "$resolved_source" = "$TAG_SOURCE_VALUE" ] || return 0
  TAG_SOURCE_STATE=valid
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
  root_exists=false
  module_exists=false
  root_source_state=none
  module_source_state=none
  root_source=""
  module_source=""

  if ref_exists "$root_tag"; then
    root_exists=true
    inspect_tag_source "$root_tag"
    root_source_state="$TAG_SOURCE_STATE"
    root_source="$TAG_SOURCE_VALUE"
  fi
  if ref_exists "$module_tag"; then
    module_exists=true
    inspect_tag_source "$module_tag"
    module_source_state="$TAG_SOURCE_STATE"
    module_source="$TAG_SOURCE_VALUE"
  fi

  # Legacy tags have no Source-SHA trailer and may predate module tags. Once
  # either side records a source, however, the release identity must be a
  # complete, internally consistent root/module transaction for every source,
  # not only for the source currently being planned.
  if [ "$root_source_state" = none ] && [ "$module_source_state" = none ]; then
    continue
  fi
  if [ "$root_exists" != true ] || [ "$module_exists" != true ]; then
    die "partial source-associated release: expected both $root_tag and $module_tag"
  fi
  if [ "$root_source_state" != valid ] || [ "$module_source_state" != valid ]; then
    die "inconsistent release pair $root_tag and $module_tag: invalid Source-SHA identity"
  fi
  [ "$root_source" = "$module_source" ] || \
    die "inconsistent release pair $root_tag and $module_tag: different source identities"

  [ "$(git cat-file -t "refs/tags/$root_tag")" = tag ] || \
    die "source-associated root tag $root_tag is not annotated"
  [ "$(git cat-file -t "refs/tags/$module_tag")" = tag ] || \
    die "source-associated module tag $module_tag is not annotated"
  root_commit="$(peeled_commit "$root_tag")" || die "$root_tag does not peel to a commit"
  module_commit="$(peeled_commit "$module_tag")" || die "$module_tag does not peel to a commit"
  [ "$root_commit" = "$module_commit" ] || \
    die "release pair $root_tag and $module_tag does not target one generated commit"
  git merge-base --is-ancestor "$root_source" "$root_commit" || \
    die "release pair $root_tag and $module_tag is not based on source $root_source"

  if [ "$root_source" = "$SOURCE_SHA" ]; then
    CURRENT_RELEASES+=("$root_tag")
  fi
done

if [ "${#CURRENT_RELEASES[@]}" -gt 1 ]; then
  die "source $SOURCE_SHA already has multiple complete releases: ${CURRENT_RELEASES[*]}"
fi

if [ "${#CURRENT_RELEASES[@]}" -eq 1 ]; then
  NEW_TAG="${CURRENT_RELEASES[0]}"
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

printf 'LATEST_TAG=%s\n' "$LATEST_TAG"
printf 'NEW_TAG=%s\n' "$NEW_TAG"
printf 'GO_MODULE_TAG=%s\n' "$GO_MODULE_TAG"
printf 'MODULE_PATH=%s\n' "$MODULE_PATH"
printf 'MODULE_TAG_PREFIX=%s\n' "$MODULE_TAG_PREFIX"
printf 'SOURCE_SHA=%s\n' "$SOURCE_SHA"
printf 'GENERATED_COMMIT=%s\n' "$GENERATED_COMMIT"
printf 'REUSE_RELEASE=%s\n' "$REUSE_RELEASE"
