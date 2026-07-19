#!/usr/bin/env bash
set -euo pipefail

SERVER="${APPFUND_PRODUCTION_SERVER:-root@72.62.247.131}"
APP_DIR="/var/www/apps/appfund"
DATA_DIR="/var/lib/2startup/appfund"

if [[ -f "$HOME/.ssh/codex-agent.env" ]]; then
  # shellcheck disable=SC1091
  source "$HOME/.ssh/codex-agent.env"
fi

ssh-add -l >/dev/null

ssh -A -o BatchMode=yes "$SERVER" bash -s <<'REMOTE'
set -euo pipefail

APP_DIR="/var/www/apps/appfund"
DATA_DIR="/var/lib/2startup/appfund"
DB_PATH="$DATA_DIR/appfund.db"

cd "$APP_DIR"
test -f .env
test "$(stat -c %a .env)" = "600"
test -f "$DB_PATH"

mkdir -p "$DATA_DIR/backups"
stamp="$(date +%Y%m%d-%H%M%S)"
backup="$DATA_DIR/backups/appfund-predeploy-$stamp.db"
cp -a "$DB_PATH" "$backup"
chmod 600 "$backup"
echo "Database backup: $backup"
sha256sum "$DB_PATH" "$backup"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Production worktree is not clean; deployment stopped." >&2
  exit 1
fi

git remote set-url origin git@github.com:torpong-tang/appfund.git
git pull --ff-only origin main
echo "Deploying commit: $(git rev-parse --short HEAD)"

npm ci --include=dev
set -a
# shellcheck disable=SC1091
source ./.env
set +a
export DATABASE_URL="file:$DB_PATH"
export NEXT_PUBLIC_BASE_PATH="/appfund"

npx prisma generate
npx prisma db push
npm test
npm run build
npm run test:runtime

test -f .next/standalone/server.js
test -d .next/standalone/.next/static
test -d .next/standalone/public

export NODE_ENV=production
export PORT=3011
export HOSTNAME=127.0.0.1
pm2 restart appfund --update-env
pm2 save
REMOTE
