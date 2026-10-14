// Admin authentication. Sessions are HMAC-signed tokens in a cookie; the
// signing key is generated once (32 random bytes) and persisted in D1, so it
// never lives in source and forging a session is infeasible. The admin
// password comes from the ADMIN_PASSWORD Workers secret (or a password saved
// from the admin panel). There is no fallback: if neither is set, every login
// attempt is rejected.
const SESSION_COOKIE = 'admin_session';
const TOKEN_PREFIX   = 'admin';
const SECRET_KEY = 'admin_secret';
const SESSION_MAX_AGE_S = 7 * 24 * 60 * 60; // sessions last 7 days

const enc = new TextEncoder();
let _cachedSecret = null;

function readCookie(cookieHeader, name) {
  for (const part of (cookieHeader || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return '';
}

function b64url(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getSigningSecret(env) {
  if (env && env.ADMIN_SECRET) return env.ADMIN_SECRET;
  if (_cachedSecret) return _cachedSecret;
  try {
    let row = await env.DB.prepare('SELECT data FROM images WHERE key=?').bind(SECRET_KEY).first().catch(() => null);
    if (!row || !row.data) {
      const rnd = new Uint8Array(32);
      crypto.getRandomValues(rnd);
      await env.DB.prepare('INSERT OR IGNORE INTO images (key,data) VALUES (?,?)').bind(SECRET_KEY, b64url(rnd)).run().catch(() => {});
      row = await env.DB.prepare('SELECT data FROM images WHERE key=?').bind(SECRET_KEY).first().catch(() => null);
    }
    if (row && row.data) { _cachedSecret = row.data; return row.data; }
  } catch {}
  return null;
}

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  return b64url(new Uint8Array(sig));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function getAdminPassword(env) {
  if (env && env.ADMIN_PASSWORD) return env.ADMIN_PASSWORD;
  try {
    const row = await env.DB.prepare("SELECT data FROM images WHERE key='admin_password'").first();
    if (row && row.data) return row.data;
  } catch {}
  return null;
}

// Compares a login attempt to the configured password in constant time by
// hashing both first, so the comparison never leaks length or prefix matches.
export async function verifyAdminPassword(env, attempt) {
  if (typeof attempt !== 'string' || attempt.length === 0) return false;
  const correct = await getAdminPassword(env);
  if (typeof correct !== 'string' || correct.length === 0) return false;
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(attempt)),
    crypto.subtle.digest('SHA-256', enc.encode(correct)),
  ]);
  return timingSafeEqual(b64url(new Uint8Array(a)), b64url(new Uint8Array(b)));
}

export async function createSessionCookie(env) {
  const secret = await getSigningSecret(env);
  if (!secret) throw new Error('Session signing key unavailable');
  const payload = TOKEN_PREFIX + '.' + Date.now();
  const sig = await hmac(secret, payload);
  return `${SESSION_COOKIE}=${payload}.${sig}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_S}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export async function isAuthed(request, env) {
  const token = readCookie(request.headers.get('Cookie') || '', SESSION_COOKIE);
  if (!token) return false;
  const lastDot = token.lastIndexOf('.');
  if (lastDot < 0) return false;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  if (!payload.startsWith(TOKEN_PREFIX + '.')) return false;
  const secret = await getSigningSecret(env);
  if (!secret) return false;
  const expected = await hmac(secret, payload);
  if (!timingSafeEqual(sig, expected)) return false;
  // The cookie's Max-Age only tells the browser when to drop it, so the
  // server checks the signed issue time too. A copied cookie stops working
  // after 7 days no matter where it is used.
  const issuedAt = Number(payload.slice(TOKEN_PREFIX.length + 1));
  if (!Number.isFinite(issuedAt)) return false;
  const age = Date.now() - issuedAt;
  return age >= 0 && age <= SESSION_MAX_AGE_S * 1000;
}

// ── Failed-login lockout ────────────────────────────────────
// After MAX_FAILURES wrong passwords from one IP within LOCKOUT_MS, that IP
// is blocked from logging in until the window ends. A correct login clears
// the counter.
const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
let _attemptsTableReady = false;

async function ensureAttemptsTable(env) {
  if (_attemptsTableReady) return;
  await env.DB.prepare(
    'CREATE TABLE IF NOT EXISTS admin_login_attempts (ip TEXT PRIMARY KEY, failures INTEGER NOT NULL, window_start INTEGER NOT NULL)'
  ).run();
  _attemptsTableReady = true;
}

export function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

export async function isLoginLocked(env, ip) {
  try {
    await ensureAttemptsTable(env);
    const row = await env.DB.prepare('SELECT failures, window_start FROM admin_login_attempts WHERE ip=?').bind(ip).first();
    if (!row) return false;
    if (Date.now() - row.window_start > LOCKOUT_MS) return false;
    return row.failures >= MAX_FAILURES;
  } catch {
    return false;
  }
}

export async function recordLoginFailure(env, ip) {
  try {
    await ensureAttemptsTable(env);
    const now = Date.now();
    // Start a new window if the old one has expired; otherwise count up.
    await env.DB.prepare(
      `INSERT INTO admin_login_attempts (ip, failures, window_start) VALUES (?, 1, ?)
       ON CONFLICT(ip) DO UPDATE SET
         failures     = CASE WHEN ? - window_start > ? THEN 1 ELSE failures + 1 END,
         window_start = CASE WHEN ? - window_start > ? THEN ? ELSE window_start END`
    ).bind(ip, now, now, LOCKOUT_MS, now, LOCKOUT_MS, now).run();
  } catch {}
}

export async function clearLoginFailures(env, ip) {
  try {
    await ensureAttemptsTable(env);
    await env.DB.prepare('DELETE FROM admin_login_attempts WHERE ip=?').bind(ip).run();
  } catch {}
}
