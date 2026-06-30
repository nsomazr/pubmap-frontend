#!/usr/bin/env bash
# Production deploy: build SPA, optional sync to web root, optional PM2 (serve on PORT).
# Prereqs: Node 20+, npm. PM2 only if SERVE_WITH_PM2=1 (default).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
# shellcheck source=scripts/load-env.sh
source "${ROOT}/scripts/load-env.sh"

APP_NAME="${PM2_APP_NAME:-gre-frontend}"
PORT="${PORT:-3099}"
DEPLOY_DIR="${ROOT}/.deploy"
LOCK_HASH_FILE="${DEPLOY_DIR}/package-lock.sha"
ECOSYSTEM="${ROOT}/ecosystem.config.cjs"
SERVE_BIN="${ROOT}/bin/run-serve.sh"
# Set to your Hostinger/Apache document root to publish dist/ (recommended on shared hosting)
DEPLOY_WEB_ROOT="${DEPLOY_WEB_ROOT:-}"
SERVE_WITH_PM2="${SERVE_WITH_PM2:-1}"

log() { printf '[deploy] %s\n' "$*"; }

pm2_start_or_restart() {
  local status
  status="$(pm2 jlist 2>/dev/null | node -e "
const name = process.argv[1];
let apps = [];
try { apps = JSON.parse(require('fs').readFileSync(0, 'utf8')); } catch { process.exit(0); }
const app = apps.find((a) => a.name === name);
if (app) console.log(app.pm2_env?.status || 'unknown');
" "${APP_NAME}" 2>/dev/null || echo "missing")"

  if [[ "${status}" == "online" ]]; then
    log "  → reloading ${APP_NAME}"
    pm2 reload "${ECOSYSTEM}" --update-env
  else
    log "  → starting ${APP_NAME} (status was: ${status})"
    pm2 delete "${APP_NAME}" 2>/dev/null || true
    pm2 start "${ECOSYSTEM}"
  fi
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

START=$(date +%s)
need_cmd node
need_cmd npm

if [[ ! -f .env.production ]]; then
  if [[ -f .env.production.example ]]; then
    cp .env.production.example .env.production
    log "Created .env.production from .env.production.example"
  else
    cat > .env.production <<'EOF'
VITE_API_URL=https://api.globalresearchexchange.com/api
VITE_APP_URL=https://globalresearchexchange.com
EOF
    log "Created .env.production with default production URLs"
  fi
fi

mkdir -p "${DEPLOY_DIR}"

log "Loading .env.production…"
load_env_file .env.production

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

cp deploy/htaccess.example dist/.htaccess
log "Wrote dist/.htaccess (SPA routing for Apache)"

if [[ -n "${DEPLOY_WEB_ROOT}" ]]; then
  log "Publishing dist/ → ${DEPLOY_WEB_ROOT}"
  mkdir -p "${DEPLOY_WEB_ROOT}"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "${ROOT}/dist/" "${DEPLOY_WEB_ROOT}/"
  else
    rm -rf "${DEPLOY_WEB_ROOT:?}"/*
    cp -a dist/. "${DEPLOY_WEB_ROOT}/"
  fi
  log "  → web root updated ($(wc -c < "${DEPLOY_WEB_ROOT}/index.html" | tr -d ' ') bytes index.html)"
fi

if [[ "${SERVE_WITH_PM2}" == "1" ]]; then
  need_cmd pm2
  if [[ ! -f "${ECOSYSTEM}" ]] || [[ ! -f "${SERVE_BIN}" ]]; then
    echo "Missing ecosystem.config.cjs or bin/run-serve.sh" >&2
    exit 1
  fi
  chmod +x "${SERVE_BIN}"
  export PORT PM2_APP_NAME="${APP_NAME}"
  log "Starting / reloading PM2 app '${APP_NAME}' on port ${PORT}…"
  pm2_start_or_restart
  pm2 save
  if command -v curl >/dev/null 2>&1; then
    if curl -sf "http://127.0.0.1:${PORT}/" -o /dev/null; then
      log "  → local check OK: http://127.0.0.1:${PORT}/"
    else
      echo "WARNING: http://127.0.0.1:${PORT}/ did not return 200 — check pm2 logs ${APP_NAME}" >&2
    fi
  fi
else
  log "Skipping PM2 (SERVE_WITH_PM2=0). Point Apache/Nginx document root at dist/ or DEPLOY_WEB_ROOT."
fi

ELAPSED=$(( $(date +%s) - START ))
log "Done in ${ELAPSED}s"
log "Built files: ${ROOT}/dist"
log ""
log "If globalresearchexchange.com shows 'Not Found', the WEB SERVER is not serving dist/:"
log "  • Hostinger/Apache: set document root to dist/ OR run:"
log "      DEPLOY_WEB_ROOT=/home/gre-user/htdocs/globalresearchexchange.com/public ./deploy.sh"
log "  • Nginx: use deploy/nginx-frontend.example.conf (root + try_files)"
log "  • Do NOT point globalresearchexchange.com at the Django API (port 8099)"
