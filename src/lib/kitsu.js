// Server-side state and checks for Kitsu's Emotes puzzles.
//
// Puzzle answers never leave the server. The browser reports what the player
// did (recent filter clicks, letter taps, side-menu taps, a typed name) and
// the server decides whether that solves a set. Progress lives in a signed
// cookie, so it can't be edited by hand: the server ignores any cookie whose
// signature doesn't match.
//
// Cookie format: kitsu_progress=1.<home>.<sets>.<reveals>.<sig>
//   home     1 if the Home page secret code was solved, else 0
//   sets     unlocked set numbers joined by "-" (e.g. "1-3")
//   reveals  set numbers whose Sub-Riddle reveal was found
//   sig      HMAC of everything before it (see siteSign in auth.js)
// The cookie is readable by page scripts so the UI can show progress, but
// only the server can produce a valid one.

import { siteSign, safeEqual } from './auth.js';
import { memoTTL } from './memo.js';

export const PROGRESS_COOKIE = 'kitsu_progress';
const MAX_AGE_S = 365 * 24 * 60 * 60;
const MAX_EVENTS = 40;
const EVENT_RE = /^[a-z0-9:_-]{1,32}$/i;

function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return '';
}

function parseList(str) {
  return str ? str.split('-').map(Number).filter((n) => Number.isInteger(n) && n > 0) : [];
}

export function emptyProgress() {
  return { home: false, sets: new Set(), reveals: new Set() };
}

export async function readProgress(request, env) {
  const raw = readCookie(request, PROGRESS_COOKIE);
  const lastDot = raw.lastIndexOf('.');
  if (lastDot < 0) return emptyProgress();
  const body = raw.slice(0, lastDot);
  const sig = raw.slice(lastDot + 1);
  if (!/^1\.[01]\.[0-9-]*\.[0-9-]*$/.test(body)) return emptyProgress();
  const expected = await siteSign(env, body);
  if (!expected || !safeEqual(sig, expected)) return emptyProgress();
  const [, home, sets, reveals] = body.split('.');
  return { home: home === '1', sets: new Set(parseList(sets)), reveals: new Set(parseList(reveals)) };
}

export async function progressCookie(env, p) {
  const sort = (s) => [...s].sort((a, b) => a - b).join('-');
  const body = `1.${p.home ? 1 : 0}.${sort(p.sets)}.${sort(p.reveals)}`;
  const sig = await siteSign(env, body);
  if (!sig) return null;
  return `${PROGRESS_COOKIE}=${body}.${sig}; Path=/; Max-Age=${MAX_AGE_S}; SameSite=Lax; Secure`;
}

export function clearProgressCookie() {
  return `${PROGRESS_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure`;
}

// ── Puzzle data (server only) ───────────────────────────────

export async function getPuzzleSets(env) {
  return memoTTL('kitsu:sets', 30_000, async () => {
    const r = await env.DB.prepare('SELECT * FROM emote_sets ORDER BY set_num').all().catch(() => ({ results: [] }));
    return r.results || [];
  });
}

async function getNavTapTarget(env) {
  return memoTTL('kitsu:navtap', 30_000, async () => {
    const row = await env.DB.prepare("SELECT data FROM images WHERE key='mamonir_tap_count'").first().catch(() => null);
    return Math.max(1, parseInt(row && row.data, 10) || 7);
  });
}

// A difficulty tier opens only after every set in the tier below is solved.
export function tierOpen(sets, p, difficulty) {
  const d = difficulty || 'easy';
  if (d === 'easy') return true;
  const prev = d === 'medium' ? 'easy' : 'medium';
  const list = sets.filter((s) => (s.difficulty || 'easy') === prev);
  return list.length > 0 && list.every((s) => p.sets.has(s.set_num));
}

const list = (str, upper = false) =>
  String(str || '').split(',').map((x) => (upper ? x.trim().toUpperCase() : x.trim().toLowerCase())).filter(Boolean);

function tailMatches(events, seq) {
  if (!seq.length || events.length < seq.length) return false;
  const tail = events.slice(-seq.length);
  return tail.every((v, i) => v === seq[i]);
}

function cleanEvents(raw, upper = false) {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(-MAX_EVENTS)
    .filter((e) => typeof e === 'string' && EVENT_RE.test(e))
    .map((e) => (upper ? e.toUpperCase() : e.toLowerCase()));
}

// Checks one attempt against every set the player can currently work on.
// Mutates `p` with anything newly solved and returns what changed.
export async function evaluateAttempt(env, p, body) {
  const sets = await getPuzzleSets(env);
  const open = (s) => !p.sets.has(s.set_num) && tierOpen(sets, p, s.difficulty);
  const unlocked = [];
  const revealed = [];
  const solve = (s, fallbackMsg) => {
    p.sets.add(s.set_num);
    unlocked.push({ set_num: s.set_num, name: s.name || `Set ${s.set_num}`, message: s.unlock_message || fallbackMsg });
  };
  const kind = body && body.kind;

  if (kind === 'characters') {
    // Events look like "el:<element>" (element filter) or "atk:<type>" (attack filter).
    const events = cleanEvents(body.events);
    const elements = events.filter((e) => e.startsWith('el:')).map((e) => e.slice(3));
    for (const s of sets) {
      if ((s.unlock_page || '') !== 'characters' || !open(s)) continue;
      const mode = s.unlock_mode || 'count';
      const target = String(s.unlock_target || '').toLowerCase();
      const needed = s.unlock_count || 7;
      if (mode === 'sequence') {
        if (tailMatches(elements, list(s.unlock_sequence))) solve(s, `Unlocked! Visit Kitsu's Emotes to see set ${s.set_num}.`);
      } else if (mode === 'count') {
        if (target && elements.filter((e) => e === target).length >= needed) solve(s, `Unlocked! Visit Kitsu's Emotes to see set ${s.set_num}.`);
      } else if (mode === 'count_then_seal') {
        const seal = String(s.unlock_sequence || '').trim().toLowerCase();
        const last = events[events.length - 1] || '';
        const before = events.slice(0, -1).filter((e) => e === `el:${target}`).length;
        if (target && seal && last === `atk:${seal}` && before >= needed) solve(s, `Unlocked! Visit Kitsu's Emotes to see set ${s.set_num}.`);
      }
    }
  } else if (kind === 'who_am_i') {
    const s = sets.find((x) => x.set_num === Number(body.set_num));
    const answer = typeof body.answer === 'string' ? body.answer.trim().toLowerCase().slice(0, 64) : '';
    const correct = s ? String(s.unlock_sequence || '').trim().toLowerCase() : '';
    if (s && (s.unlock_mode || '') === 'who_am_i' && open(s) && correct && answer === correct) {
      solve(s, `Unlocked! Visit Kitsu's Emotes to see set ${s.set_num}.`);
    }
  } else if (kind === 'letters') {
    const events = cleanEvents(body.events, true);
    for (const s of sets) {
      if ((s.unlock_mode || '') !== 'letter_sequence' || !open(s)) continue;
      if (tailMatches(events, list(s.unlock_sequence, true))) solve(s, 'You found the secret! This set is now unlocked.');
    }
  } else if (kind === 'sidebar') {
    const events = cleanEvents(body.events);
    for (const s of sets) {
      if (!open(s)) continue;
      if ((s.unlock_mode || '') === 'char_sequence' && tailMatches(events, list(s.unlock_sequence))) {
        solve(s, 'Set unlocked!');
        continue;
      }
      const extra = list(s.extra_sequence);
      if (extra.length && String(s.extra_reveal || '').trim() && !p.reveals.has(s.set_num) && tailMatches(events, extra)) {
        p.reveals.add(s.set_num);
        revealed.push({ set_num: s.set_num, label: s.set_letter || s.name || String(s.set_num) });
      }
    }
  } else if (kind === 'nav_tap') {
    // The tapping figure only appears after the Home secret is solved.
    const taps = Number(body.taps);
    if (p.home && Number.isInteger(taps) && taps > 0) {
      const target = await getNavTapTarget(env);
      for (const s of sets) {
        if ((s.unlock_mode || '') !== 'nav_icon_tap' || !open(s)) continue;
        if (taps >= target) solve(s, 'The figure could not withstand your persistence. This set is now yours.');
      }
    }
  }
  return { unlocked, revealed };
}

// What the player's own pages are allowed to know about their progress,
// including the text of any Sub-Riddle reveals they have earned.
export async function publicState(env, p) {
  const sets = await getPuzzleSets(env);
  const reveals = {};
  for (const s of sets) {
    if (p.reveals.has(s.set_num) && String(s.extra_reveal || '').trim()) reveals[s.set_num] = s.extra_reveal;
  }
  return { home: p.home, sets: [...p.sets].sort((a, b) => a - b), reveals };
}

// ── Light rate limit for public guess endpoints ─────────────
// Per isolate and approximate, which is enough to make brute-forcing slow.
const _hits = new Map();
export function rateLimited(ip, bucket, limit, windowMs = 60_000) {
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const h = _hits.get(key);
  if (!h || now - h.start > windowMs) {
    _hits.set(key, { start: now, n: 1 });
    if (_hits.size > 5000) for (const [k, v] of _hits) if (now - v.start > windowMs) _hits.delete(k);
    return false;
  }
  h.n += 1;
  return h.n > limit;
}
