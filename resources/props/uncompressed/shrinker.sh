#!/usr/bin/env bash
set -euo pipefail

SRC="${1:-preset}"
DST="${2:-output}"

mkdir -p "$DST"

find "$SRC" -type f -iname '*.glb' -print0 |
while IFS= read -r -d '' f; do
  rel="${f#$SRC/}"
  out="$DST/$rel"

  mkdir -p "$(dirname "$out")"

  echo "Exporting $rel"

  gltfpack \
    -i "$f" \
    -o "$out" \
    -tc \
    -tq 8 \
    -ts 0.5 \
    -kn \
    -km

  old=$(stat -c%s "$f")
  new=$(stat -c%s "$out")

  awk -v o="$old" -v n="$new" \
    'BEGIN { printf "  %.2f MB -> %.2f MB  (%.1f%%)\n", o/1048576, n/1048576, 100*n/o }'
done
