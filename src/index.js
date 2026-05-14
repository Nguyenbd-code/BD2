import { handleHome }                              from './pages/home.js';
import { handleCharacters }                        from './pages/characters.js';
import { handleGuide }                             from './pages/guide.js';
import { handleCoupons }                           from './pages/coupons.js';
import { handleEmotes }                            from './pages/emotes.js';
import { handleAdmin, handleAdminLogin, handleAdminLogout } from './pages/admin.js';
import { handleRedeem }                            from './api/redeem.js';
import { handleAdminApi }                          from './api/admin.js';
import { handleImage }                             from './api/images.js';

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

      // Redeem API
      if (path === '/api/redeem' && method === 'POST') return handleRedeem(request);

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

      return new Response('Not Found', { status: 404 });
    } catch(err) {
      return new Response(`Worker Error: ${err.message}\n\nStack: ${err.stack}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  },
};
