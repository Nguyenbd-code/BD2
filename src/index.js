import { handleHome } from './pages/home.js';
import { handleGuide } from './pages/guide.js';
import { handleCoupons } from './pages/coupons.js';
import { handleEmotes } from './pages/emotes.js';
import { handleAdmin, handleAdminPost } from './pages/admin.js';
import { handleRedeem } from './api/redeem.js';
import { handleAdminApi } from './api/admin.js';
import { handleImage } from './api/images.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      if (path.startsWith('/img/')) {
        return handleImage(request, env);
      }

      if (path === '/api/redeem' && method === 'POST') {
        return handleRedeem(request);
      }

      if (path.startsWith('/api/admin')) {
        return handleAdminApi(request, env);
      }

      if (path === '/' || path === '') {
        return handleHome(request, env);
      }
      if (path === '/guide') {
        return handleGuide(request, env);
      }
      if (path === '/coupons') {
        return handleCoupons(request, env);
      }
      if (path === '/emotes') {
        return handleEmotes(request, env);
      }
      if (path === '/admin') {
        if (method === 'POST') return handleAdminPost(request, env);
        return handleAdmin(request, env);
      }

      return new Response('Not Found', { status: 404 });
    } catch (err) {
      console.error(err);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
