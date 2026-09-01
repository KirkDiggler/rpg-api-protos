#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo "usage: $0 github <repository> <root-tag>" >&2
  exit 2
}

die() {
  echo "release publication check failed: $*" >&2
  exit 1
}

is_github_not_found() {
  grep -Eq 'HTTP[[:space:]]+404|"status"[[:space:]]*:[[:space:]]*"?404' "$1"
}

[ "$#" -eq 3 ] || usage
[ "$1" = github ] || usage
REPOSITORY="$2"
ROOT_TAG="$3"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

if gh api "repos/$REPOSITORY/releases/tags/$ROOT_TAG" >"$TMP_DIR/github.json" 2>"$TMP_DIR/github.err"; then
  node - "$TMP_DIR/github.json" "$ROOT_TAG" <<'NODE'
const fs = require("fs");
const [path, expectedTag] = process.argv.slice(2);
let release;
try {
  release = JSON.parse(fs.readFileSync(path, "utf8"));
} catch (error) {
  console.error(`release publication check failed: invalid GitHub response: ${error.message}`);
  process.exit(1);
}
if (release.tag_name !== expectedTag) {
  console.error(`release publication check failed: expected GitHub tag ${expectedTag}, found ${String(release.tag_name)}`);
  process.exit(1);
}
NODE
  printf 'update\n'
else
  if is_github_not_found "$TMP_DIR/github.err"; then
    printf 'create\n'
  else
    cat "$TMP_DIR/github.err" >&2
    die "GitHub release query failed for $ROOT_TAG"
  fi
fi
