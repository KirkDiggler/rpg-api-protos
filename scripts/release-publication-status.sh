#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat >&2 <<'USAGE'
usage:
  release-publication-status.sh github <repository> <root-tag>
  release-publication-status.sh npm <package> <version> <root-tag> <go-module-tag> <source-sha> <generated-commit>
USAGE
  exit 2
}

die() {
  echo "release publication check failed: $*" >&2
  exit 1
}

is_github_not_found() {
  grep -Eq 'HTTP[[:space:]]+404|"status"[[:space:]]*:[[:space:]]*"?404' "$1"
}

is_npm_not_found() {
  grep -Eq '(^|[^[:alnum:]_])E404([^[:alnum:]_]|$)|HTTP[[:space:]]+404|"status"[[:space:]]*:[[:space:]]*"?404' "$1"
}

[ "$#" -ge 1 ] || usage
KIND="$1"
shift

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

case "$KIND" in
  github)
    [ "$#" -eq 2 ] || usage
    REPOSITORY="$1"
    ROOT_TAG="$2"

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
    ;;

  npm)
    [ "$#" -eq 6 ] || usage
    PACKAGE_NAME="$1"
    NPM_VERSION="$2"
    ROOT_TAG="$3"
    GO_MODULE_TAG="$4"
    SOURCE_SHA="$5"
    GENERATED_COMMIT="$6"

    if npm view "$PACKAGE_NAME@$NPM_VERSION" --json >"$TMP_DIR/npm.json" 2>"$TMP_DIR/npm.err"; then
      node - "$TMP_DIR/npm.json" "$PACKAGE_NAME" "$NPM_VERSION" "$ROOT_TAG" "$GO_MODULE_TAG" "$SOURCE_SHA" "$GENERATED_COMMIT" <<'NODE'
const fs = require("fs");
const [path, expectedName, expectedVersion, expectedTag, expectedGoTag, expectedSource, expectedGenerated] = process.argv.slice(2);
let metadata;
try {
  metadata = JSON.parse(fs.readFileSync(path, "utf8"));
} catch (error) {
  console.error(`release publication check failed: invalid npm response: ${error.message}`);
  process.exit(1);
}
const identity = metadata.rpgApiProtosRelease || {};
const checks = [
  ["name", metadata.name, expectedName],
  ["version", metadata.version, expectedVersion],
  ["root tag", identity.tag, expectedTag],
  ["Go module tag", identity.goModuleTag, expectedGoTag],
  ["source commit", identity.sourceCommit, expectedSource],
  ["generated commit", identity.generatedCommit, expectedGenerated],
];
const mismatches = checks.filter(([, actual, expected]) => actual !== expected);
if (mismatches.length > 0) {
  for (const [field, actual, expected] of mismatches) {
    console.error(`release publication check failed: npm ${field}: expected ${expected}, found ${String(actual)}`);
  }
  process.exit(1);
}
NODE
      printf 'already-published\n'
    else
      if is_npm_not_found "$TMP_DIR/npm.err"; then
        printf 'publish\n'
      else
        cat "$TMP_DIR/npm.err" >&2
        die "npm query failed for $PACKAGE_NAME@$NPM_VERSION"
      fi
    fi
    ;;

  *)
    usage
    ;;
esac
