#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

OUT_DIR="${1:-public/assets}"
BLENDER="${BLENDER_BIN:-/Applications/Blender.app/Contents/MacOS/Blender}"
LOG_DIR="$ROOT/.tmp/slime-builds/tier1-logs"
mkdir -p "$OUT_DIR" "$LOG_DIR"

slugs=(plain shield wand dagger gun)
pids=()

for slug in "${slugs[@]}"; do
  tmp_dir="$ROOT/.tmp/blender-$slug"
  mkdir -p "$tmp_dir"
  (
    TMPDIR="$tmp_dir" "$BLENDER" --background \
      --python tools/blender/slimes/build.py -- \
      --slug "$slug" \
      --output "$OUT_DIR/$slug-slime.glb" \
      > "$LOG_DIR/$slug.log" 2>&1
  ) &
  pids+=("$!")
done

status=0
for pid in "${pids[@]}"; do
  if ! wait "$pid"; then
    status=1
  fi
done

if [[ "$status" -ne 0 ]]; then
  echo "One or more Tier-1 slime builds failed. See $LOG_DIR/*.log" >&2
  exit "$status"
fi

printf 'Generated Tier-1 assets:\n'
for slug in "${slugs[@]}"; do
  printf '  %s\n' "$OUT_DIR/$slug-slime.glb"
done
