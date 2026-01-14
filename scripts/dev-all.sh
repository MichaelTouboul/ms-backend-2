#!/usr/bin/env bash
set -euo pipefail

SERVICE="${1:-}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -n "$SERVICE" ]]; then
  APP_DIR="apps/$SERVICE"

  if [[ ! -d "$APP_DIR" ]]; then
    echo "❌ Service '$SERVICE' not found in apps/"
    exit 1
  fi

  echo "▶ Starting service: $SERVICE"
  npm -w "$APP_DIR" run dev
  exit 0
fi

echo "▶ Starting ALL services"

SERVICES=()
for dir in apps/*; do
  if [[ -f "$dir/package.json" ]]; then
    SERVICES+=("$dir")
  fi
done

pids=()

cleanup() {
  echo
  echo "Stopping services..."
  for pid in "${pids[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}

trap cleanup INT TERM EXIT

for svc in "${SERVICES[@]}"; do
  echo "▶ Starting $(basename "$svc")"
  npm -w "$svc" run dev &
  pids+=("$!")
done

wait
