#!/usr/bin/env bash
# PM2 entrypoint — serve the Vite build with Node (SPA fallback).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-3099}"
SERVE_MAIN="${ROOT}/node_modules/serve/build/main.js"

if [[ ! -f "${SERVE_MAIN}" ]]; then
  echo "Missing ${SERVE_MAIN}. Run npm ci in pubmap-frontend first." >&2
  exit 1
fi

if [[ ! -f dist/index.html ]]; then
  echo "Missing dist/index.html. Run npm run build first." >&2
  exit 1
fi

exec node "${SERVE_MAIN}" -s dist -l "tcp://127.0.0.1:${PORT}"
