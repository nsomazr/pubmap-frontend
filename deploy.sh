#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f ".env.production" ]; then
  echo "Create .env.production with:"
  echo "  VITE_API_URL=https://api.gre.nileagi.com/api"
  echo "  VITE_APP_URL=https://gre.nileagi.com"
  exit 1
fi

export $(grep -v '^#' .env.production | xargs)
npm ci
npm run build

echo "Built to dist/ — serve with Nginx/Caddy for https://gre.nileagi.com"
echo "Example Nginx root: $(pwd)/dist"
