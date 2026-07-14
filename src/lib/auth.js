import crypto from 'crypto';
import prisma from './prisma';

const SECRET = process.env.AUTH_SECRET || 'appfund-dev-secret-change-me';
export const SESSION_COOKIE = 'appfund_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (seconds)

// Initial admin, created automatically on first login if no admins exist.
// The password must come from the server environment so it is never committed.
const INITIAL_ADMIN = {
  email: process.env.INITIAL_ADMIN_EMAIL || 'admin@appfund.com',
  name: process.env.INITIAL_ADMIN_NAME || 'Admin',
  password: process.env.INITIAL_ADMIN_PASSWORD,
};

/* ---------- Password hashing (scrypt, no external deps) ---------- */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(candidate, 'hex');
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ---------- Signed session token (HMAC) ---------- */
export function signSession(payload) {
  const body = { ...payload, exp: Date.now() + SESSION_MAX_AGE * 1000 };
  const data = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifySessionToken(token) {
  if (!token || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload; // { uid, email, name, exp }
  } catch {
    return null;
  }
}

// Read + verify the session from an incoming request. Returns payload or null.
export function getSessionUser(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_MAX_AGE,
  secure: process.env.NODE_ENV === 'production',
};

/* ---------- Default admin bootstrap ---------- */
export async function ensureDefaultAdmin() {
  const count = await prisma.adminUser.count();
  if (count === 0) {
    if (!INITIAL_ADMIN.password || INITIAL_ADMIN.password.length < 8) {
      throw new Error('Set INITIAL_ADMIN_PASSWORD with at least 8 characters before creating the first admin.');
    }
    await prisma.adminUser.create({
      data: {
        email: INITIAL_ADMIN.email.trim().toLowerCase(),
        name: INITIAL_ADMIN.name,
        passwordHash: hashPassword(INITIAL_ADMIN.password),
      },
    });
  }
}
