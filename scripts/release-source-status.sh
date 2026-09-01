#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo "usage: $0 <source-sha> <current-main-ref>" >&2
  exit 2
}

die() {
  echo "release source check failed: $*" >&2
  exit 1
}

[ "$#" -eq 2 ] || usage

SOURCE_SHA="$(git rev-parse --verify "$1^{commit}")" || die "invalid source commit: $1"
CURRENT_MAIN_SHA="$(git rev-parse --verify "$2^{commit}")" || die "invalid current main ref: $2"

if [ "$SOURCE_SHA" = "$CURRENT_MAIN_SHA" ]; then
  printf 'current\n'
else
  printf 'coalesced\n'
fi
