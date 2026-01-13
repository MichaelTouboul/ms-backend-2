#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

# Find all services in /apps
SERVICES=()
for dir in apps/*; do
  if [[ -f "$dir/package.json" ]]; then
    SERVICES+=("$dir")
  fi
done

if [[ ${#SERVICES[@]} -eq 0 ]]; then
  echo "No microservices found under apps/* (missing package.json)."
  exit 1
fi

echo "Starting microservices:"
printf ' - %s\n' "${SERVICES[@]}"
echo

pids=()

cleanup() {
  echo
  echo "Stopping microservices..."
  for pid in "${pids[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  echo "Done."
}

trap cleanup INT TERM EXIT

for svc in "${SERVICES[@]}"; do
  echo ">>> Starting $svc"
  # Run te script
  npm -w "$svc" run dev &
  pids+=("$!")
done

echo
echo "All microservices started."
echo "Press Ctrl+C to stop."
echo

# Wait for all services
wait
