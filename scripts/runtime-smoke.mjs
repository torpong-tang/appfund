import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, rmSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const serverPath = path.join(root, '.next', 'standalone', 'server.js');
const databasePath = path.join(os.tmpdir(), `appfund-runtime-${process.pid}.db`);
const databaseUrl = `file:${databasePath}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function getFreePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  server.close();
  await once(server, 'close');
  return port;
}

async function waitForServer(url, child) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Runtime server exited with code ${child.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server startup can take a moment.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Runtime server did not become ready');
}

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json();
  return { response, body };
}

async function main() {
  assert(existsSync(serverPath), 'Build AppFund before running npm run test:runtime');
  rmSync(databasePath, { force: true });

  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    AUTH_SECRET: 'runtime-smoke-secret-at-least-32-chars',
    INITIAL_ADMIN_EMAIL: 'runtime@appfund.test',
    INITIAL_ADMIN_NAME: 'Runtime Admin',
    INITIAL_ADMIN_PASSWORD: 'RuntimeSmoke2026!',
    NODE_ENV: 'production',
  };
  const dbPush = spawnSync('npx', ['prisma', 'db', 'push', '--skip-generate'], {
    cwd: root,
    env,
    encoding: 'utf8',
  });
  assert(dbPush.status === 0, dbPush.stderr || 'Unable to initialize runtime test database');

  const port = await getFreePort();
  const child = spawn(process.execPath, [serverPath], {
    cwd: root,
    env: { ...env, HOSTNAME: '127.0.0.1', PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverLog = '';
  child.stdout.on('data', (chunk) => { serverLog += chunk; });
  child.stderr.on('data', (chunk) => { serverLog += chunk; });

  try {
    const baseUrl = `http://127.0.0.1:${port}/appfund`;
    await waitForServer(`${baseUrl}/login`, child);

    const unauthenticated = await jsonRequest(`${baseUrl}/api/members`);
    assert(unauthenticated.response.status === 401, 'Protected API must return HTTP 401');
    assert(unauthenticated.body.error === 'unauthenticated', 'Protected API must return JSON auth error');

    const invalidJson = await jsonRequest(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    });
    assert(invalidJson.response.status === 400, 'Malformed login JSON must return HTTP 400');

    const login = await jsonRequest(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'runtime@appfund.test', password: 'RuntimeSmoke2026!' }),
    });
    assert(login.response.status === 200, 'Runtime admin login must succeed');
    const cookie = login.response.headers.get('set-cookie')?.split(';')[0];
    assert(cookie, 'Login must set a session cookie');

    const member = await jsonRequest(`${baseUrl}/api/members`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({
        memberId: 'M001',
        name: 'Runtime Member',
        email: 'member@example.com',
        role: 'admin',
      }),
    });
    assert(member.response.status === 201, 'Validated member creation must succeed');
    assert(!Object.hasOwn(member.body, 'role'), 'Unsupported member fields must be discarded');

    const transaction = await jsonRequest(`${baseUrl}/api/transactions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({
        txId: 'TX-1',
        memberName: 'Runtime Member',
        income: 0,
        expense: 0,
        slipUrl: 'data:image/png;base64,AA==',
      }),
    });
    assert(transaction.response.status === 400, 'Ambiguous transaction amounts must be rejected');

    const settings = await jsonRequest(`${baseUrl}/api/settings`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ role: 'admin' }),
    });
    assert(settings.response.status === 400, 'Unsupported settings fields must be rejected');

    console.log('Runtime smoke checks passed: auth, API 401, allowlist, and validation.');
  } catch (error) {
    if (serverLog) console.error(serverLog.trim());
    throw error;
  } finally {
    child.kill('SIGTERM');
    await Promise.race([once(child, 'exit'), new Promise((resolve) => setTimeout(resolve, 2000))]);
    rmSync(databasePath, { force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
