import { handleHome }                              from './pages/home.js';
import { handleCharacters }                        from './pages/characters.js';
import { handleGuide }                             from './pages/guide.js';
import { handleCoupons }                           from './pages/coupons.js';
import { handleEmotes }                            from './pages/emotes.js';
import { handleAdmin, handleAdminLogin, handleAdminLogout } from './pages/admin.js';
import { handleRedeem }                            from './api/redeem.js';
import { handleAdminApi }                          from './api/admin.js';
import { handleImage }                             from './api/images.js';
import { handleXVideo, handleXThumb, handleXTweet } from './api/xvideo.js';
import { handleStylesheet }                        from './css/styles.js';
import { handleNotFound }                          from './pages/notfound.js';
import { clientIp }                              from './lib/auth.js';
import { readProgress, progressCookie, clearProgressCookie, evaluateAttempt,
         publicState, rateLimited }               from './lib/kitsu.js';

// Module-level latch — coupon seeding only needs to happen once per database,
// not once per request. Without this we ate a D1 SELECT COUNT(*) on every
// inbound request (including static assets) just to confirm the table was
// already populated. Set to true after a successful non-empty check.
let _couponsSeeded = false;
let _emoteSetsApiSchemaReady = false;

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export default {
  async fetch(request, env) {
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method;

    try {
      // Fast-path the highest-frequency routes BEFORE any DB work. Image and
      // stylesheet responses are cacheable + don't touch coupons.
      if (path.startsWith('/img/')) return handleImage(request, env);
      if (path === '/styles.css')   return handleStylesheet();

      // Seed initial coupon codes — once per isolate. The latch avoids the
      // recurring COUNT(*) on every non-static request.
      if (!_couponsSeeded) {
        try {
          const existing = await env.DB.prepare('SELECT COUNT(*) as count FROM coupons').first();
          if (existing && existing.count === 0) {
            const initCodes = [
              ['2026BD2MAY',       '50 Diamonds + 3 Draw Tickets', null],
              ['BD2RADIOFINALE',   'Stamina x20 + Diamonds x30',   null],
              ['Waiting4legend',   '30 Diamonds',                  null],
              ['BD2025SUMMER',     '50 Diamonds',                  null],
              ['SQUARE1000DEKO',   '30 Diamonds',                  null],
              ['BD2RADIOABYSS',    '30 Diamonds',                  null],
            ];
            for (const [code, rewards, expiry] of initCodes) {
              await env.DB.prepare('INSERT OR IGNORE INTO coupons (code,rewards,expiry,active) VALUES (?,?,?,1)')
                .bind(code, rewards, expiry).run();
            }
          }
          _couponsSeeded = true;
        } catch(e) { /* ignore seed errors — retry on next isolate */ }
      }

      // Secret code check (public, no auth). A correct code marks the
      // visitor's signed progress cookie, which unlocks the Emotes page.
      if (path === '/api/secret/check' && method === 'POST') {
        if (rateLimited(clientIp(request), 'secret', 10)) return jsonResp({ success: false, message: 'Too many attempts. Wait a minute.' }, 429);
        let b = {};
        try { b = await request.json(); } catch {}
        const submitted = typeof b.code === 'string' ? b.code : '';
        const DEFAULT_SECRET = 'Seji404';
        const row = await env.DB.prepare("SELECT data FROM images WHERE key='secret_code'").first().catch(()=>null);
        const correct = (row && row.data) ? row.data : DEFAULT_SECRET;
        const success = submitted.length > 0 && submitted === correct;
        const headers = { 'Content-Type': 'application/json' };
        if (success) {
          const p = await readProgress(request, env);
          p.home = true;
          const c = await progressCookie(env, p);
          if (c) headers['Set-Cookie'] = c;
        }
        return new Response(JSON.stringify({ success }), { headers });
      }

      // Puzzle attempts. The browser reports what the player did; the server
      // compares it to answers that never leave the database.
      if (path === '/api/kitsu/attempt' && method === 'POST') {
        if (rateLimited(clientIp(request), 'kitsu', 120)) return jsonResp({ ok: false, message: 'Slow down a little.' }, 429);
        let body = {};
        try { body = await request.json(); } catch {}
        const p = await readProgress(request, env);
        const result = await evaluateAttempt(env, p, body);
        const headers = { 'Content-Type': 'application/json' };
        if (result.unlocked.length || result.revealed.length) {
          const c = await progressCookie(env, p);
          if (c) headers['Set-Cookie'] = c;
        }
        return new Response(JSON.stringify({ ok: true, ...result, state: await publicState(env, p) }), { headers });
      }

      if (path === '/api/kitsu/state' && method === 'GET') {
        const p = await readProgress(request, env);
        return jsonResp(await publicState(env, p));
      }

      // Lets a player wipe their own progress (used by the admin "Re-lock" button).
      if (path === '/api/kitsu/reset' && method === 'POST') {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json', 'Set-Cookie': clearProgressCookie() },
        });
      }

      // Special code unlock
      if (path === '/api/special-code/unlock' && method === 'POST') {
        if (rateLimited(clientIp(request), 'special', 10)) return jsonResp({ success: false, message: 'Too many attempts. Wait a minute.' }, 429);
        let sb = {};
        try { sb = await request.json(); } catch {}
        const enteredPasscode = sb.passcode || '';
        try {
          const scRow = await env.DB.prepare("SELECT data FROM images WHERE key='special_code_config'").first().catch(() => null);
          if (!scRow || !scRow.data) {
            return new Response(JSON.stringify({ success: false, message: 'Not configured.' }), { headers: { 'Content-Type': 'application/json' } });
          }
          const sc = JSON.parse(scRow.data);
          if (!sc.passcode || !sc.code) {
            return new Response(JSON.stringify({ success: false, message: 'Not configured.' }), { headers: { 'Content-Type': 'application/json' } });
          }
          if (enteredPasscode !== sc.passcode) {
            return new Response(JSON.stringify({ success: false, message: 'Incorrect passcode.' }), { headers: { 'Content-Type': 'application/json' } });
          }
          return new Response(JSON.stringify({ success: true, code: sc.code }), { headers: { 'Content-Type': 'application/json' } });
        } catch(e) {
          return new Response(JSON.stringify({ success: false, message: 'Error.' }), { headers: { 'Content-Type': 'application/json' } });
        }
      }

      // Public emotes by set
      if (path === '/api/emotes/by-set' && method === 'GET') {
        const sn = parseInt(new URL(request.url).searchParams.get('set_num') || '1', 10);
        try {
          const r = await env.DB.prepare('SELECT * FROM emotes WHERE set_num=? ORDER BY created_at DESC').bind(sn).all();
          return new Response(JSON.stringify({ emotes: r.results || [] }), { headers: { 'Content-Type': 'application/json' } });
        } catch(e) {
          return new Response(JSON.stringify({ emotes: [] }), { headers: { 'Content-Type': 'application/json' } });
        }
      }

      // Redeem API
      if (path === '/api/redeem' && method === 'POST') return handleRedeem(request);

      // Public emote sets metadata (unlock conditions, hints)
      if (path === '/api/emote-sets' && method === 'GET') {
        let rows = [];
        try {
          if (!_emoteSetsApiSchemaReady) {
            await env.DB.prepare("CREATE TABLE IF NOT EXISTS emote_sets (set_num INTEGER PRIMARY KEY, name TEXT, hint TEXT, unlock_page TEXT, unlock_target TEXT, unlock_count INTEGER DEFAULT 7, cover_key TEXT)").run();
            // Make sure every column the client reads exists. Idempotent.
            await Promise.all([
              env.DB.prepare("ALTER TABLE emote_sets ADD COLUMN unlock_message TEXT DEFAULT ''").run().catch(()=>{}),
              env.DB.prepare("ALTER TABLE emote_sets ADD COLUMN difficulty TEXT DEFAULT 'easy'").run().catch(()=>{}),
              env.DB.prepare("ALTER TABLE emote_sets ADD COLUMN extra_hint TEXT DEFAULT ''").run().catch(()=>{}),
              env.DB.prepare("ALTER TABLE emote_sets ADD COLUMN display_location TEXT DEFAULT ''").run().catch(()=>{}),
              env.DB.prepare("ALTER TABLE emote_sets ADD COLUMN extra_sequence TEXT DEFAULT ''").run().catch(()=>{}),
              env.DB.prepare("ALTER TABLE emote_sets ADD COLUMN extra_reveal TEXT DEFAULT ''").run().catch(()=>{}),
            ]);
            _emoteSetsApiSchemaReady = true;
          }
          const r = await env.DB.prepare('SELECT set_num, name, set_letter, hint, unlock_page, unlock_target, unlock_count, unlock_mode, unlock_sequence, unlock_message, difficulty, extra_hint, display_location, extra_sequence, extra_reveal FROM emote_sets ORDER BY set_num').all().catch(() => env.DB.prepare('SELECT set_num, name, hint, unlock_page, unlock_target, unlock_count FROM emote_sets ORDER BY set_num').all());
          rows = r.results || [];
        } catch(e) {}
        return new Response(JSON.stringify({ sets: rows }), { headers: { 'Content-Type': 'application/json' } });
      }

      // X/Twitter video + thumbnail + tweet metadata proxy
      if (path.startsWith('/api/x-video/')) return handleXVideo(request);
      if (path.startsWith('/api/x-thumb/')) return handleXThumb(request);
      if (path.startsWith('/api/x-tweet/')) return handleXTweet(request);

      // Admin APIs
      if (path.startsWith('/api/admin/')) return handleAdminApi(request, env);

      // Admin pages
      if (path === '/admin/login'  && method === 'POST') return handleAdminLogin(request, env);
      if (path === '/admin/logout')                      return handleAdminLogout();
      if (path === '/admin')                             return handleAdmin(request, env);

      // Public pages
      if (path === '/' || path === '') return handleHome(request, env);
      if (path === '/guide')           return handleGuide(request, env);
      if (path === '/coupons')         return handleCoupons(request, env);
      if (path === '/emotes')          return handleEmotes(request, env);
      if (path === '/characters')      return handleCharacters(request, env);

      return await handleNotFound(request, env);
    } catch(err) {
      return new Response(`Worker Error: ${err.message}\n\nStack: ${err.stack}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  },
};
