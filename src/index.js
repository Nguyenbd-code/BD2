import { handleHome }                              from './pages/home.js';
import { handleCharacters }                        from './pages/characters.js';
import { handleGuide }                             from './pages/guide.js';
import { handleCoupons }                           from './pages/coupons.js';
import { handleEmotes }                            from './pages/emotes.js';
import { handleAdmin, handleAdminLogin, handleAdminLogout } from './pages/admin.js';
import { handleRedeem }                            from './api/redeem.js';
import { handleAdminApi }                          from './api/admin.js';
import { handleImage }                             from './api/images.js';
import { handleXVideo }                            from './api/xvideo.js';
import { handleStylesheet }                        from './css/styles.js';
import { handleNotFound }                          from './pages/notfound.js';

export default {
  async fetch(request, env) {
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method;

    try {
      // Seed initial coupon codes on first run
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
      } catch(e) { /* ignore seed errors */ }

      // Image serving
      if (path.startsWith('/img/')) return handleImage(request, env);

      // Cached stylesheet (immutable, busted via ?v= query string)
      if (path === '/styles.css') return handleStylesheet();

      // Secret code check (public, no auth)
      if (path === '/api/secret/check' && method === 'POST') {
        let b = {};
        try { b = await request.json(); } catch {}
        const submitted = b.code || '';
        const DEFAULT_SECRET = 'Seji404';
        const row = await env.DB.prepare("SELECT data FROM images WHERE key='secret_code'").first().catch(()=>null);
        const correct = (row && row.data) ? row.data : DEFAULT_SECRET;
        return new Response(JSON.stringify({ success: submitted === correct }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Special code unlock
      if (path === '/api/special-code/unlock' && method === 'POST') {
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
          const r = await env.DB.prepare('SELECT set_num, name, set_letter, hint, unlock_page, unlock_target, unlock_count, unlock_mode, unlock_sequence, unlock_message, difficulty, extra_hint, display_location, extra_sequence, extra_reveal FROM emote_sets ORDER BY set_num').all().catch(() => env.DB.prepare('SELECT set_num, name, hint, unlock_page, unlock_target, unlock_count FROM emote_sets ORDER BY set_num').all());
          rows = r.results || [];
        } catch(e) {}
        return new Response(JSON.stringify({ sets: rows }), { headers: { 'Content-Type': 'application/json' } });
      }

      // X/Twitter video proxy
      if (path.startsWith('/api/x-video/')) return handleXVideo(request);

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
