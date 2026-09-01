#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo "usage: $0 <source-sha> <current-main-ref> <source-status-at-plan> <release-action>" >&2
  exit 2
}

die() {
  echo "release publication gate failed: $*" >&2
  exit 1
}

[ "$#" -eq 4 ] || usage

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_SHA="$1"
CURRENT_MAIN_REF="$2"
SOURCE_STATUS_AT_PLAN="$3"
RELEASE_ACTION="$4"
SOURCE_STATUS_AT_PUBLICATION="$($SCRIPT_DIR/release-source-status.sh \
  "$SOURCE_SHA" "$CURRENT_MAIN_REF")"

PUBLISH_REFS=false
PUBLISH_GITHUB_RELEASE=false

case "$SOURCE_STATUS_AT_PLAN:$RELEASE_ACTION" in
  current:publish)
    if [ "$SOURCE_STATUS_AT_PUBLICATION" = current ]; then
      PUBLISH_REFS=true
      PUBLISH_GITHUB_RELEASE=true
    fi
    ;;
  current:repair)
    if [ "$SOURCE_STATUS_AT_PUBLICATION" = current ]; then
      PUBLISH_GITHUB_RELEASE=true
    fi
    ;;
  coalesced:repair)
    # A source that was already stale may repair only its verified, immutable
    # root GitHub release. Release preparation guarantees this is a reuse.
    PUBLISH_GITHUB_RELEASE=true
    ;;
  coalesced:coalesced)
    ;;
  *)
    die "invalid planned publication state: $SOURCE_STATUS_AT_PLAN/$RELEASE_ACTION"
    ;;
esac

printf 'SOURCE_STATUS_AT_PUBLICATION=%s\n' "$SOURCE_STATUS_AT_PUBLICATION"
printf 'PUBLISH_REFS=%s\n' "$PUBLISH_REFS"
printf 'PUBLISH_GITHUB_RELEASE=%s\n' "$PUBLISH_GITHUB_RELEASE"
