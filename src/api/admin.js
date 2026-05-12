import { json } from '../layout/layout.js';

const ADMIN_PASSWORD = 'Anime0404!';

function isAuthed(request) {
  const cookie = request.headers.get('Cookie') || '';
  return cookie.split(';').some(c => c.trim() === 'admin=true');
}

function unauthorized() {
  return json({ error: 'Unauthorized' }, 401);
}

export async function handleAdminApi(request, env) {
  if (!isAuthed(request)) return unauthorized();

  const url = new URL(request.url);
  // Strip /api/admin prefix
  const sub = url.pathname.replace(/^\/api\/admin\/?/, '');
  const method = request.method;

  // ── Coupons ──────────────────────────────────────────────
  if (sub === 'coupons' || sub === 'coupons/') {
    if (method === 'GET') return getCoupons(env);
    if (method === 'POST') return addCoupon(request, env);
  }
  const couponDel = sub.match(/^coupons\/(\d+)$/);
  if (couponDel && method === 'DELETE') return deleteCoupon(couponDel[1], env);

  // ── Compositions ─────────────────────────────────────────
  if (sub === 'compositions' || sub === 'compositions/') {
    if (method === 'GET') return getCompositions(env);
    if (method === 'POST') return addComposition(request, env);
  }
  const compDel = sub.match(/^compositions\/(\d+)$/);
  if (compDel && method === 'DELETE') return deleteComposition(compDel[1], env);

  // ── Emotes ───────────────────────────────────────────────
  if (sub === 'emotes' || sub === 'emotes/') {
    if (method === 'GET') return getEmotes(env);
    if (method === 'POST') return addEmote(request, env);
  }
  const emoteDel = sub.match(/^emotes\/(\d+)$/);
  if (emoteDel && method === 'DELETE') return deleteEmote(emoteDel[1], env);

  // ── Images ───────────────────────────────────────────────
  if (sub === 'images' || sub === 'images/') {
    if (method === 'GET') return getImages(env);
    if (method === 'POST') return uploadImage(request, env);
  }
  const imgDel = sub.match(/^images\/(.+)$/);
  if (imgDel && method === 'DELETE') return deleteImage(imgDel[1], env);

  // ── Notes (per-character build notes) ────────────────────
  const notesMatch = sub.match(/^notes\/(.+)$/);
  if (notesMatch) {
    if (method === 'GET') return getNotes(notesMatch[1], env);
    if (method === 'POST') return setNotes(notesMatch[1], request, env);
  }

  // ── Unit Order ───────────────────────────────────────────
  if (sub === 'unit-order') {
    if (method === 'GET') return getUnitOrder(env);
    if (method === 'POST') return setUnitOrder(request, env);
  }

  return json({ error: 'Not Found' }, 404);
}

// ── Coupons ──────────────────────────────────────────────────────────────────

async function getCoupons(env) {
  const { results } = await env.DB.prepare(
    'SELECT id, code, rewards, expiry, created_at FROM coupons ORDER BY id DESC'
  ).all();
  return json(results);
}

async function addCoupon(request, env) {
  const body = await request.json();
  const { code, rewards, expiry } = body;
  if (!code) return json({ error: 'code required' }, 400);
  try {
    const result = await env.DB.prepare(
      'INSERT INTO coupons (code, rewards, expiry) VALUES (?, ?, ?)'
    ).bind(code.trim(), rewards || '', expiry || null).run();
    return json({ ok: true, id: result.meta.last_row_id });
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return json({ error: 'Code already exists' }, 409);
    throw e;
  }
}

async function deleteCoupon(id, env) {
  await env.DB.prepare('DELETE FROM coupons WHERE id = ?').bind(Number(id)).run();
  return json({ ok: true });
}

// ── Compositions ─────────────────────────────────────────────────────────────

async function getCompositions(env) {
  const { results } = await env.DB.prepare(
    'SELECT id, tier, name, type, counters, countered_by, characters, notes FROM compositions ORDER BY tier, id'
  ).all();
  return json(results.map(r => ({
    ...r,
    characters: tryParse(r.characters, []),
    notes: tryParse(r.notes, []),
  })));
}

async function addComposition(request, env) {
  const body = await request.json();
  const { tier, name, type, counters, counteredBy, characters, notes } = body;
  if (!tier || !name) return json({ error: 'tier and name required' }, 400);
  const result = await env.DB.prepare(
    `INSERT INTO compositions (tier, name, type, counters, countered_by, characters, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    tier, name, type || 'ATK',
    counters || '', counteredBy || '',
    JSON.stringify(characters || []),
    JSON.stringify(notes || [])
  ).run();
  return json({ ok: true, id: result.meta.last_row_id });
}

async function deleteComposition(id, env) {
  await env.DB.prepare('DELETE FROM compositions WHERE id = ?').bind(Number(id)).run();
  return json({ ok: true });
}

// ── Emotes ───────────────────────────────────────────────────────────────────

async function getEmotes(env) {
  const { results } = await env.DB.prepare(
    'SELECT id, name, url, created_at FROM emotes ORDER BY id DESC'
  ).all();
  return json(results);
}

async function addEmote(request, env) {
  const body = await request.json();
  const { name, url } = body;
  if (!name || !url) return json({ error: 'name and url required' }, 400);
  const result = await env.DB.prepare(
    'INSERT INTO emotes (name, url) VALUES (?, ?)'
  ).bind(name.trim(), url.trim()).run();
  return json({ ok: true, id: result.meta.last_row_id });
}

async function deleteEmote(id, env) {
  await env.DB.prepare('DELETE FROM emotes WHERE id = ?').bind(Number(id)).run();
  return json({ ok: true });
}

// ── Images ───────────────────────────────────────────────────────────────────

async function getImages(env) {
  const { results } = await env.DB.prepare(
    "SELECT key FROM images ORDER BY key"
  ).all();
  return json(results.map(r => r.key));
}

async function uploadImage(request, env) {
  const body = await request.json();
  const { key, data } = body;
  if (!key || !data) return json({ error: 'key and data required' }, 400);
  await env.DB.prepare(
    'INSERT OR REPLACE INTO images (key, data) VALUES (?, ?)'
  ).bind(key.trim(), data).run();
  return json({ ok: true });
}

async function deleteImage(key, env) {
  await env.DB.prepare('DELETE FROM images WHERE key = ?').bind(key).run();
  return json({ ok: true });
}

// ── Notes ─────────────────────────────────────────────────────────────────────

async function getNotes(character, env) {
  const key = `notes_${character}`;
  const row = await env.DB.prepare('SELECT data FROM images WHERE key = ?')
    .bind(key).first();
  return json({ notes: row ? row.data : '' });
}

async function setNotes(character, request, env) {
  const body = await request.json();
  const { notes } = body;
  const key = `notes_${character}`;
  await env.DB.prepare('INSERT OR REPLACE INTO images (key, data) VALUES (?, ?)')
    .bind(key, notes || '').run();
  return json({ ok: true });
}

// ── Unit Order ───────────────────────────────────────────────────────────────

async function getUnitOrder(env) {
  const row = await env.DB.prepare('SELECT data FROM images WHERE key = ?')
    .bind('unit_order').first();
  return json({ order: row ? tryParse(row.data, []) : [] });
}

async function setUnitOrder(request, env) {
  const body = await request.json();
  const { order } = body;
  await env.DB.prepare('INSERT OR REPLACE INTO images (key, data) VALUES (?, ?)')
    .bind('unit_order', JSON.stringify(order || [])).run();
  return json({ ok: true });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function tryParse(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

export { ADMIN_PASSWORD, isAuthed };
