# AppFund

AppFund is the shared fund dashboard for 2Startup Cloud. It tracks members, income, expenses, goals, and admin-managed fund settings under the `/appfund` base path.

## Stack

- Next.js 16
- React 19
- Prisma
- SQLite
- PM2 standalone deployment

## Local Development

```bash
cd /home/johnson/projects/appfund
npm install
npx prisma generate
npm run dev -- -H 0.0.0.0 -p 3011
```

Open:

```text
http://localhost:3011/appfund
```

## Environment

Use local `.env` for development and production environment variables on the server. Do not commit real secrets.

Required production values:

```bash
DATABASE_URL="file:/var/lib/2startup/appfund/appfund.db"
AUTH_SECRET="<long-random-secret>"
INITIAL_ADMIN_EMAIL="<admin-email>"
INITIAL_ADMIN_NAME="<admin-name>"
INITIAL_ADMIN_PASSWORD="<temporary-bootstrap-password>"
NEXT_PUBLIC_BASE_PATH="/appfund"
```

`INITIAL_ADMIN_PASSWORD` is only for first admin bootstrap when no admin exists. After first login, change the admin password and remove any temporary credential file from the server.

## Database

```bash
npx prisma generate
npx prisma db push
```

Production SQLite path:

```text
/var/lib/2startup/appfund/appfund.db
```

Keep the database outside the Git checkout and restrict permissions:

```bash
chmod 600 /var/lib/2startup/appfund/appfund.db
```

## Build Checks

Run before commit/deploy:

```bash
npm run lint
NEXT_PUBLIC_BASE_PATH=/appfund npm run build
```

The `postbuild` script automatically copies `.next/static` and `public` into
`.next/standalone`. These assets are required when PM2 runs the standalone
server; do not remove this step from the production build.

Known lint warnings may appear for existing `<img>` usage. Treat new warnings as issues unless intentionally reviewed.

## Production Routing

AppFund runs behind Nginx and PM2:

- Public URL: `https://2startup.cloud/appfund`
- Login URL: `https://2startup.cloud/appfund/login`
- Internal target: `http://127.0.0.1:3011`
- PM2 process: `appfund`

Nginx should keep an exact redirect for the bare app path:

```nginx
location = /appfund {
    return 302 /appfund/login;
}

location ^~ /appfund {
    proxy_pass http://127.0.0.1:3011;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

The application also has a server-side route guard in `src/proxy.js`. Protected routes redirect to `/appfund/login` when the `appfund_session` cookie is missing or invalid.

## Production Deploy

```bash
ssh -A root@72.62.247.131
cd /var/www/apps/appfund
git remote set-url origin git@github.com:torpong-tang/appfund.git
git pull --ff-only origin main
npm ci --include=dev
DATABASE_URL="file:/var/lib/2startup/appfund/appfund.db" npx prisma generate
DATABASE_URL="file:/var/lib/2startup/appfund/appfund.db" npx prisma db push
NEXT_PUBLIC_BASE_PATH=/appfund DATABASE_URL="file:/var/lib/2startup/appfund/appfund.db" npm run build
NODE_ENV=production PORT=3011 HOSTNAME=127.0.0.1 DATABASE_URL="file:/var/lib/2startup/appfund/appfund.db" pm2 restart appfund --update-env
pm2 save
```

Verify that standalone assets were prepared before restarting PM2:

```bash
test -f .next/standalone/server.js
test -d .next/standalone/.next/static
test -d .next/standalone/public
```

If PM2 must be recreated:

```bash
NODE_ENV=production PORT=3011 HOSTNAME=127.0.0.1 DATABASE_URL="file:/var/lib/2startup/appfund/appfund.db" pm2 start .next/standalone/server.js --name appfund --cwd /var/www/apps/appfund --update-env
pm2 save
```

## Health Checks

```bash
curl -I -s https://2startup.cloud/ | head -n 1
curl -I -s https://2startup.cloud/appfund | head -n 5
curl -I -s https://2startup.cloud/appfund/login | head -n 1
asset_path=$(curl -s https://2startup.cloud/appfund/login | grep -oE '/appfund/_next/static/[^" ]+' | head -n 1)
curl -I -s "https://2startup.cloud${asset_path}" | head -n 2
curl -I -s https://2startup.cloud/appfund/members | head -n 5
pm2 ls
```

Expected:

- `https://2startup.cloud/` returns `200 OK`
- `https://2startup.cloud/appfund` redirects to `/appfund/login`
- `https://2startup.cloud/appfund/login` returns `200 OK`
- the sampled `/_next/static/` asset returns `200 OK` with a JavaScript or CSS content type
- protected routes without a session redirect to `/appfund/login`
- PM2 process `appfund` is `online`

## Security Notes

- Keep Git remote as SSH: `git@github.com:torpong-tang/appfund.git`
- Do not commit `.env`, SQLite DBs, backups, temporary passwords, or GitHub tokens
- Use SSH agent forwarding during production deploy only when needed
- Rotate exposed credentials immediately
- Remove temporary initial admin credential files after changing the admin password
