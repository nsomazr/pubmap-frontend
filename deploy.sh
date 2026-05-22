#!/usr/bin/env bash
# Production deploy: build SPA + serve dist/ via PM2 (gre-frontend).
# Prereqs: Node 20+, npm, PM2 (`npm i -g pm2`).
# Optional: Nginx TLS proxy to PORT (see deploy/nginx-frontend.example.conf).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

APP_NAME="${PM2_APP_NAME:-gre-frontend}"
PORT="${PORT:-3099}"
DEPLOY_DIR="${ROOT}/.deploy"
LOCK_HASH_FILE="${DEPLOY_DIR}/package-lock.sha"
ECOSYSTEM="${ROOT}/ecosystem.config.cjs"

log() { printf '[deploy] %s\n' "$*"; }
need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

START=$(date +%s)
need_cmd node
need_cmd npm
need_cmd pm2

if [[ ! -f .env.production ]]; then
  echo "Create .env.production first (see .env.production.example):" >&2
  echo "  VITE_API_URL=https://api.gre.nileagi.com/api" >&2
  echo "  VITE_APP_URL=https://gre.nileagi.com" >&2
  exit 1
fi

if [[ ! -f "${ECOSYSTEM}" ]]; then
  echo "Missing ${ECOSYSTEM}" >&2
  exit 1
fi

mkdir -p "${DEPLOY_DIR}"

# Export Vite build-time variables
set -a
# shellcheck disable=SC1091
source .env.production
set +a

log "Installing dependencies (skipped when package-lock.json unchanged)…"
LOCK_HASH="$(sha256sum package-lock.json 2>/dev/null | awk '{print $1}' || shasum -a 256 package-lock.json | awk '{print $1}')"
if [[ -f "${LOCK_HASH_FILE}" && "$(cat "${LOCK_HASH_FILE}")" == "${LOCK_HASH}" && -d node_modules ]]; then
  log "  → node_modules up to date"
else
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
  echo "${LOCK_HASH}" > "${LOCK_HASH_FILE}"
fi

log "Building production bundle…"
export NODE_ENV=production
npm run build

if [[ ! -d dist ]] || [[ ! -f dist/index.html ]]; then
  echo "Build failed: dist/index.html not found" >&2
  exit 1
fi

export PORT PM2_APP_NAME="${APP_NAME}"
log "Starting / reloading PM2 app '${APP_NAME}' on port ${PORT}…"
if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
  pm2 reload "${ECOSYSTEM}" --update-env
else
  pm2 start "${ECOSYSTEM}"
fi
pm2 save

ELAPSED=$(( $(date +%s) - START ))
log "Done in ${ELAPSED}s — http://127.0.0.1:${PORT}"
log "PM2: pm2 logs ${APP_NAME}  |  pm2 status"
log "Put Nginx/Caddy in front for https://gre.nileagi.com (see deploy/nginx-frontend.example.conf)"
