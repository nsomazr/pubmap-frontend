#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-3009}"

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "Created .env — set VITE_API_URL for your backend."
fi

if [ ! -d "node_modules" ]; then
  npm install
fi

echo "Starting Global Research Exchange frontend on http://127.0.0.1:${PORT}"
exec npm run dev -- --port "${PORT}"
