#!/bin/bash

set -euo pipefail

input=$(cat)

stop_hook_active=$(echo "$input" | jq -r '.stop_hook_active // false')
if [ "$stop_hook_active" = "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  exit 0
fi

# ponytail: git status is session-agnostic, so leftover uncommitted changes
# from before this turn also count. Upgrade if that causes false positives:
# snapshot `git status` at SessionStart and diff against it instead.
changed=$(git status --porcelain --untracked-files=all || true)

if [ -z "$changed" ]; then
  exit 0
fi

changelog_touched=$(echo "$changed" | grep -F 'CHANGELOG.md' || true)

if [ -z "$changelog_touched" ]; then
  echo "Ada perubahan kode tapi CHANGELOG.md belum di-update. Tambahin entry baru di paling atas sebelum selesai (format & policy: lihat CLAUDE.md > Changelog Policy). Singkat aja." >&2
  exit 2
fi

exit 0