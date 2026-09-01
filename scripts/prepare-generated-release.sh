#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo "usage: $0 <source-sha> <candidate-generated-commit> <repository-module-path> <current-main-ref> [go-mod-file]" >&2
  exit 2
}

die() {
  echo "release preparation failed: $*" >&2
  exit 1
}

[ "$#" -ge 4 ] && [ "$#" -le 5 ] || usage

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_SHA="$1"
CANDIDATE_COMMIT="$2"
REPOSITORY_MODULE_PATH="$3"
CURRENT_MAIN_REF="$4"
GO_MOD_FILE="${5:-gen/go/go.mod}"

SOURCE_STATUS_AT_PLAN="$($SCRIPT_DIR/release-source-status.sh \
  "$SOURCE_SHA" "$CURRENT_MAIN_REF")"

PLAN_FILE="$(mktemp)"
trap 'rm -f "$PLAN_FILE"' EXIT
"$SCRIPT_DIR/plan-generated-release.sh" \
  "$SOURCE_SHA" \
  "$CANDIDATE_COMMIT" \
  "$REPOSITORY_MODULE_PATH" \
  "$GO_MOD_FILE" > "$PLAN_FILE"

# The planner emits constrained KEY=value fields only.
# shellcheck disable=SC1090
. "$PLAN_FILE"

case "$SOURCE_STATUS_AT_PLAN:$REUSE_RELEASE" in
  current:false)
    RELEASE_ACTION=publish
    ;;
  current:true|coalesced:true)
    RELEASE_ACTION=repair
    ;;
  coalesced:false)
    RELEASE_ACTION=coalesced
    ;;
  *)
    die "unexpected source/reuse decision: $SOURCE_STATUS_AT_PLAN/$REUSE_RELEASE"
    ;;
esac

cat "$PLAN_FILE"
printf 'SOURCE_STATUS_AT_PLAN=%s\n' "$SOURCE_STATUS_AT_PLAN"
printf 'RELEASE_ACTION=%s\n' "$RELEASE_ACTION"
