import { json } from '../layout/layout.js';

function isAuthed(request) {
  const cookie = request.headers.get('Cookie') || '';
  return cookie.split(';').some(c => c.trim() === 'admin=true');
}

function unauth() { return json({ success: false, message: 'Unauthorized' }, 401); }

export async function handleAdminApi(request, env) {
  if (!isAuthed(request)) return unauth();

  const url    = new URL(request.url);
  const path   = url.pathname;
  const method = request.method;

  let body = {};
  if (method === 'POST') {
    try { body = await request.json(); } catch { body = {}; }
  }

  try {
    // ── Coupons ──────────────────────────────────────────────
    if (path === '/api/admin/coupon/add' && method === 'POST') {
      if (!body.code) return json({ success:false, message:'Code required' }, 400);
      const r = await env.DB.prepare(
        'INSERT INTO coupons (code, rewards, expiry, active) VALUES (?,?,?,1)'
      ).bind(body.code.trim(), body.rewards||'', body.expiry||null).run();
      return json({ success:true, message:'Coupon added!', id: r.meta.last_row_id });
    }

    if (path === '/api/admin/coupon/delete' && method === 'POST') {
      await env.DB.prepare('DELETE FROM coupons WHERE id=?').bind(body.id).run();
      return json({ success:true, message:'Deleted.' });
    }

    // ── Compositions ─────────────────────────────────────────
    if (path === '/api/admin/comp/add' && method === 'POST') {
      if (!body.name) return json({ success:false, message:'Name required' }, 400);
      const r = await env.DB.prepare(
        'INSERT INTO compositions (tier,name,type,description,countered_by,last_updated) VALUES (?,?,?,?,?,?)'
      ).bind(body.tier||'T2', body.name, body.type||'ATK', body.description||'', body.countered_by||'', body.last_updated||'').run();
      return json({ success:true, message:'Composition added!', id: r.meta.last_row_id });
    }

    if (path === '/api/admin/comp/delete' && method === 'POST') {
      await env.DB.prepare('DELETE FROM compositions WHERE id=?').bind(body.id).run();
      return json({ success:true, message:'Deleted.' });
    }

    // ── Emotes ───────────────────────────────────────────────
    if (path === '/api/admin/emote/add' && method === 'POST') {
      if (!body.name || !body.image_url) return json({ success:false, message:'Name and image_url required' }, 400);
      const r = await env.DB.prepare(
        'INSERT INTO emotes (name, image_url) VALUES (?,?)'
      ).bind(body.name.trim(), body.image_url.trim()).run();
      return json({ success:true, message:'Emote added!', id: r.meta.last_row_id });
    }

    if (path === '/api/admin/emote/delete' && method === 'POST') {
      await env.DB.prepare('DELETE FROM emotes WHERE id=?').bind(body.id).run();
      return json({ success:true, message:'Deleted.' });
    }

    // ── Images ───────────────────────────────────────────────
    if (path === '/api/admin/image/upload' && method === 'POST') {
      if (!body.key || !body.data) return json({ success:false, message:'Missing key or data.' });
      await env.DB.prepare('INSERT OR REPLACE INTO images (key,data) VALUES (?,?)').bind(body.key, body.data).run();
      return json({ success:true, message:'Uploaded: ' + body.key });
    }

    if (path === '/api/admin/image/delete' && method === 'POST') {
      await env.DB.prepare('DELETE FROM images WHERE key=?').bind(body.key).run();
      return json({ success:true, message:'Image deleted.' });
    }

    // ── T1 Notes ─────────────────────────────────────────────
    if (path === '/api/admin/t1/notes/save' && method === 'POST') {
      await env.DB.prepare('INSERT OR REPLACE INTO images (key,data) VALUES (?,?)')
        .bind('notes_' + body.char, body.notes || '').run();
      return json({ success:true, message:'Notes saved for ' + body.char });
    }

    if (path === '/api/admin/t1/notes/get' && method === 'GET') {
      const char = new URL(request.url).searchParams.get('char') || '';
      const row  = await env.DB.prepare('SELECT data FROM images WHERE key=?').bind('notes_' + char).first();
      return json({ notes: row ? row.data : null });
    }

    // ── T1 Unit Order ─────────────────────────────────────────
    if (path === '/api/admin/t1/order/save' && method === 'POST') {
      await env.DB.prepare('INSERT OR REPLACE INTO images (key,data) VALUES (?,?)')
        .bind('unit_order', JSON.stringify(body.order || [])).run();
      return json({ success:true, message:'Unit order saved!' });
    }

    if (path === '/api/admin/t1/order/get' && method === 'GET') {
      const row = await env.DB.prepare('SELECT data FROM images WHERE key=?').bind('unit_order').first();
      const order = row ? JSON.parse(row.data) : ['Rou','Seir','Lecliss','Scheherazade','Sylvia'];
      return json({ order });
    }

    // ── Board Layout ──────────────────────────────────────────
    if (path === '/api/admin/board/save' && method === 'POST') {
      await env.DB.prepare("INSERT OR REPLACE INTO images (key,data) VALUES ('board_layout',?)")
        .bind(JSON.stringify(body.board || {})).run();
      return json({ success: true, message: 'Board saved!' });
    }

    if (path === '/api/admin/board/get' && method === 'GET') {
      const row = await env.DB.prepare("SELECT data FROM images WHERE key='board_layout'").first();
      const board = row ? JSON.parse(row.data) : {
        d1:'Seir',d2:'',d3:'Lecliss',d4:'',d5:'',d6:'',
        a1:'Rou',a2:'Schera',a3:'',a4:'Sylvia',a5:'',a6:'',
      };
      return json({ board });
    }

    // ── Image list ────────────────────────────────────────────
    if (path === '/api/admin/images/list' && method === 'GET') {
      const r = await env.DB.prepare(
        "SELECT key FROM images WHERE key NOT LIKE 'notes_%' AND key != 'unit_order' ORDER BY key"
      ).all();
      return json({ images: r.results || [] });
    }

  } catch(e) {
    return json({ success:false, message:'DB error: ' + e.message }, 500);
  }

  return json({ success:false, message:'Not found' }, 404);
}
