#!/bin/bash
# Blocks the turn if changes reintroduce something explicitly rejected
# in MASTER_PROMPT.md's "Keputusan yang sudah diambil" section.
#
# This only catches concrete, greppable reintroductions (banned packages/imports).
# It cannot detect subtler drift from the product's vision or positioning —
# that part relies on MASTER_PROMPT.md being loaded as context every turn
# (see the @MASTER_PROMPT.md import at the top of CLAUDE.md) and on the
# agent actually reading it, not on this script.

BANNED_PATTERNS=(
  "@liveblocks"
  "\byjs\b"
  "y-protocol"
  "@clerk"
  "ConvexProviderWithClerk"
  "react-icons"
  "@convex-dev/auth"
)

DIFF="$(git diff --cached --diff-filter=ACM 2>/dev/null; git diff --diff-filter=ACM 2>/dev/null)"

if [ -z "$DIFF" ]; then
  exit 0
fi

FOUND=""
for pattern in "${BANNED_PATTERNS[@]}"; do
  if echo "$DIFF" | grep -iE "^\+.*${pattern}" > /dev/null 2>&1; then
    FOUND="${FOUND}
  - ${pattern}"
  fi
done

if [ -n "$FOUND" ]; then
  echo "BLOCKED — perubahan ini nyentuh sesuatu yang eksplisit udah ditolak di MASTER_PROMPT.md ('Keputusan yang sudah diambil'):${FOUND}"
  echo ""
  echo "Kalau ini beneran keputusan baru (bukan kecelakaan/reintroduce lama), konfirmasi eksplisit ke user dulu sebelum lanjut — jangan diam-diam jalan terus."
  exit 2
fi

exit 0