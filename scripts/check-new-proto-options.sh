#!/usr/bin/env bash
# Guard new contracts, not historical package identities. No SDK generation.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
base="${1:-origin/main}"
git rev-parse --verify "${base}^{commit}" >/dev/null

status=0
declare -A seen=()
while IFS= read -r -d '' file; do
  [[ -f "$file" && -z "${seen[$file]:-}" ]] || continue
  seen["$file"]=1
  # Strip comments and string contents before matching option declarations.
  # Keep whitespace so declarations split across lines are checked too.
  if ! awk '
    {
      for (i = 1; i <= length($0); i++) {
        c = substr($0, i, 1); nextc = substr($0, i + 1, 1)
        if (block) {
          if (c == "*" && nextc == "/") { block = 0; i++; code = code " " }
          continue
        }
        if (quoted) {
          if (c == "\\") { i++; continue }
          if (c == quote) { quoted = 0; code = code " " }
          continue
        }
        if (c == "/" && nextc == "/") break
        if (c == "/" && nextc == "*") { block = 1; i++; code = code " "; continue }
        if (c == "\"" || c == "\047") { quoted = 1; quote = c; code = code " "; continue }
        code = code c
      }
      code = code "\n"
    }
    END {
      pattern = "(^|[^[:alnum:]_])option[[:space:]]+(go_package|java_[[:alnum:]_]+)[[:space:]]*="
      while (match(code, pattern)) {
        declaration = substr(code, RSTART, RLENGTH)
        gsub(/^[[:space:];{}]+|[[:space:]]*=.*$/, "", declaration)
        printf "%s: forbidden new-contract declaration: %s\n", FILENAME, declaration > "/dev/stderr"
        code = substr(code, RSTART + RLENGTH)
        bad = 1
      }
      exit bad
    }
  ' "$file"; then
    status=1
  fi
done < <(
  git diff --name-only --diff-filter=A -z "$base" -- '*.proto'
  git ls-files --others --exclude-standard -z -- '*.proto'
)

if (( status )); then
  echo 'Use Buf-managed Go packages; there is no Java consumer. Any required exception needs explicit review.' >&2
  exit "$status"
fi
echo 'New proto options: clean (historical files unchanged by this policy).'
