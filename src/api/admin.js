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
    if (path === '/api/admin/images/list' && method === 'GET') {
      const r = await env.DB.prepare(
        "SELECT key FROM images WHERE key NOT LIKE 'notes_%' AND key != 'unit_order' AND key != 'board_layout' ORDER BY key"
      ).all();
      return json({ images: r.results || [] });
    }

    // ── T1 Notes ─────────────────────────────────────────────
    if (path === '/api/admin/t1/notes/save' && method === 'POST') {
      await env.DB.prepare('INSERT OR REPLACE INTO images (key,data) VALUES (?,?)')
        .bind('notes_' + body.char, body.notes || '').run();
      return json({ success:true, message:'Notes saved for ' + body.char });
    }
    if (path === '/api/admin/t1/notes/get' && method === 'GET') {
      const char = url.searchParams.get('char') || '';
      const row  = await env.DB.prepare('SELECT data FROM images WHERE key=?').bind('notes_' + char).first();
      const defaults = {
        Rou: 'Needs ≥21,000 HP · 50% Critical Rate · 1 HP/Res piece to survive empowered basic',
        Seir: 'Needs ≥29,000 HP · 105% Magic Resist',
        Lecliss: 'Needs ≥33,000 HP · 90% Defence',
        Scheherazade: '50% Critical Rate · MATK + CDMG build',
        Sylvia: '50% Critical Rate · max ATK% substats',
      };
      return json({ notes: row ? row.data : (defaults[char] || null) });
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
      return json({ success:true, message:'Board saved!' });
    }
    if (path === '/api/admin/board/get' && method === 'GET') {
      const row = await env.DB.prepare("SELECT data FROM images WHERE key='board_layout'").first();
      const board = row ? JSON.parse(row.data) : {
        d1:'Seir',d2:'',d3:'Lecliss',d4:'',d5:'',d6:'',
        a1:'Rou',a2:'Schera',a3:'',a4:'Sylvia',a5:'',a6:'',
      };
      return json({ board });
    }

    // ── Characters ────────────────────────────────────────────
    if (path === '/api/admin/chars/list' && method === 'GET') {
      const r = await env.DB.prepare('SELECT * FROM char_registry ORDER BY name').all();
      return json({ chars: r.results || [] });
    }
    if (path === '/api/admin/chars/add' && method === 'POST') {
      if (!body.name || !body.slug) return json({ success:false, message:'Name and slug required' }, 400);
      const r = await env.DB.prepare(
        'INSERT INTO char_registry (name, slug, element, status) VALUES (?,?,?,?)'
      ).bind(body.name.trim(), body.slug.trim(), body.element||'Dark', body.status||'active').run();
      return json({ success:true, message:'Character added!', id: r.meta.last_row_id });
    }
    if (path === '/api/admin/chars/update' && method === 'POST') {
      if (!body.id) return json({ success:false, message:'id required' }, 400);
      await env.DB.prepare('UPDATE char_registry SET name=?,element=?,status=? WHERE id=?')
        .bind(body.name||'', body.element||'Dark', body.status||'active', body.id).run();
      return json({ success:true, message:'Updated.' });
    }
    if (path === '/api/admin/chars/delete' && method === 'POST') {
      await env.DB.prepare('DELETE FROM char_registry WHERE id=?').bind(body.id).run();
      return json({ success:true, message:'Deleted.' });
    }

    // ── Costumes ─────────────────────────────────────────────
    if (path === '/api/admin/costumes/list' && method === 'GET') {
      const slug = url.searchParams.get('char_slug') || '';
      const r = await env.DB.prepare('SELECT * FROM char_costumes WHERE char_slug=? ORDER BY id').bind(slug).all();
      return json({ costumes: r.results || [] });
    }
    if (path === '/api/admin/costumes/add' && method === 'POST') {
      if (!body.char_slug || !body.costume_name || !body.costume_slug) return json({ success:false, message:'char_slug, costume_name, costume_slug required' }, 400);
      const r = await env.DB.prepare(
        'INSERT INTO char_costumes (char_slug, costume_name, costume_slug, bond_stats) VALUES (?,?,?,?)'
      ).bind(body.char_slug, body.costume_name.trim(), body.costume_slug.trim(), body.bond_stats||'').run();
      return json({ success:true, message:'Costume added!', id: r.meta.last_row_id });
    }
    if (path === '/api/admin/costumes/delete' && method === 'POST') {
      await env.DB.prepare('DELETE FROM char_costumes WHERE id=?').bind(body.id).run();
      return json({ success:true, message:'Deleted.' });
    }

    // ── Skills ────────────────────────────────────────────────
    if (path === '/api/admin/skills/list' && method === 'GET') {
      const slug = url.searchParams.get('costume_slug') || '';
      const r = await env.DB.prepare('SELECT * FROM char_skills WHERE costume_slug=? ORDER BY id').bind(slug).all();
      return json({ skills: r.results || [] });
    }
    if (path === '/api/admin/skills/add' && method === 'POST') {
      if (!body.skill_name || !body.costume_slug) return json({ success:false, message:'skill_name and costume_slug required' }, 400);
      const r = await env.DB.prepare(
        'INSERT INTO char_skills (char_slug, costume_slug, skill_name, sp_cost, cooldown, tile_type, description) VALUES (?,?,?,?,?,?,?)'
      ).bind(body.char_slug||'', body.costume_slug, body.skill_name.trim(), body.sp_cost||1, body.cooldown||5, body.tile_type||'FRONT', body.description||'').run();
      return json({ success:true, message:'Skill added!', id: r.meta.last_row_id });
    }
    if (path === '/api/admin/skills/delete' && method === 'POST') {
      await env.DB.prepare('DELETE FROM char_skills WHERE id=?').bind(body.id).run();
      return json({ success:true, message:'Deleted.' });
    }

    // ── Comp Media (board images + video URLs) ────────────────
    if (path === '/api/admin/comp/media/save' && method === 'POST') {
      if (!body.tier || !body.media_type || body.value === undefined)
        return json({ success:false, message:'tier, media_type, value required' }, 400);
      await env.DB.prepare(
        'INSERT INTO comp_media (tier,media_type,value) VALUES (?,?,?) ON CONFLICT(tier,media_type) DO UPDATE SET value=excluded.value'
      ).bind(body.tier, body.media_type, body.value).run().catch(async () => {
        // Fallback if no UNIQUE constraint yet
        await env.DB.prepare('DELETE FROM comp_media WHERE tier=? AND media_type=?').bind(body.tier, body.media_type).run();
        await env.DB.prepare('INSERT INTO comp_media (tier,media_type,value) VALUES (?,?,?)').bind(body.tier, body.media_type, body.value).run();
      });
      return json({ success:true, message:'Media saved.' });
    }
    if (path === '/api/admin/comp/media/get' && method === 'GET') {
      const tier = url.searchParams.get('tier') || '';
      const r = await env.DB.prepare('SELECT media_type, value FROM comp_media WHERE tier=?').bind(tier).all();
      const media = {};
      for (const row of (r.results || [])) media[row.media_type] = row.value;
      return json({ media });
    }

    // ── Comp Rotations ────────────────────────────────────────
    if (path === '/api/admin/comp/rotation/save' && method === 'POST') {
      if (!body.tier || !body.char_name || body.slot === undefined)
        return json({ success:false, message:'tier, char_name, slot required' }, 400);
      await env.DB.prepare(
        'INSERT INTO comp_rotations (tier,char_name,slot,skill_name,costume,sp_cost,cooldown,tile_type,description) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(tier,char_name,slot) DO UPDATE SET skill_name=excluded.skill_name,costume=excluded.costume,sp_cost=excluded.sp_cost,cooldown=excluded.cooldown,tile_type=excluded.tile_type,description=excluded.description'
      ).bind(body.tier, body.char_name, body.slot, body.skill_name||'', body.costume||'', body.sp_cost||1, body.cooldown||5, body.tile_type||'FRONT', body.description||'').run().catch(async () => {
        await env.DB.prepare('DELETE FROM comp_rotations WHERE tier=? AND char_name=? AND slot=?').bind(body.tier, body.char_name, body.slot).run();
        await env.DB.prepare('INSERT INTO comp_rotations (tier,char_name,slot,skill_name,costume,sp_cost,cooldown,tile_type,description) VALUES (?,?,?,?,?,?,?,?,?)').bind(body.tier, body.char_name, body.slot, body.skill_name||'', body.costume||'', body.sp_cost||1, body.cooldown||5, body.tile_type||'FRONT', body.description||'').run();
      });
      return json({ success:true, message:'Rotation saved.' });
    }
    if (path === '/api/admin/comp/rotation/get' && method === 'GET') {
      const tier = url.searchParams.get('tier') || '';
      const r = await env.DB.prepare('SELECT * FROM comp_rotations WHERE tier=? ORDER BY char_name, slot').bind(tier).all();
      return json({ rotation: r.results || [] });
    }
    if (path === '/api/admin/comp/rotation/delete' && method === 'POST') {
      if (!body.tier || !body.char_name || body.slot === undefined)
        return json({ success:false, message:'tier, char_name, slot required' }, 400);
      await env.DB.prepare('DELETE FROM comp_rotations WHERE tier=? AND char_name=? AND slot=?').bind(body.tier, body.char_name, body.slot).run();
      return json({ success:true, message:'Deleted.' });
    }

    // ── Comp Update ───────────────────────────────────────────
    if (path === '/api/admin/comp/update' && method === 'POST') {
      if (!body.id) return json({ success:false, message:'id required' }, 400);
      await env.DB.prepare(
        'UPDATE compositions SET name=?,type=?,color=?,short_description=?,description=?,countered_by=?,unit_order=? WHERE id=?'
      ).bind(body.name||'', body.type||'ATK', body.color||'#c9a84c', body.short_description||'', body.description||'', body.countered_by||'', body.unit_order||'[]', body.id).run();
      return json({ success:true, message:'Updated.' });
    }

    // ── Comp Board Image (tier-keyed) ─────────────────────────
    if (path === '/api/admin/comp/board/save' && method === 'POST') {
      if (!body.tier || !body.data) return json({ success:false, message:'tier and data required' }, 400);
      const suffix = body.suffix || '';
      const key = 'comp_' + body.tier.toLowerCase() + '_board' + suffix;
      await env.DB.prepare('INSERT OR REPLACE INTO images (key,data) VALUES (?,?)').bind(key, body.data).run();
      return json({ success:true, message:'Board saved.', key });
    }

    // ── Comp Preemptive Skills ────────────────────────────────
    if (path === '/api/admin/comp/preemptive/get' && method === 'GET') {
      const tier = url.searchParams.get('tier') || '';
      const row  = await env.DB.prepare('SELECT data FROM images WHERE key=?').bind('preemptive_' + tier.toLowerCase()).first();
      const items = row ? JSON.parse(row.data) : [];
      return json({ items });
    }
    if (path === '/api/admin/comp/preemptive/add' && method === 'POST') {
      if (!body.tier || !body.data) return json({ success:false, message:'tier and data required' }, 400);
      const key  = 'preemptive_' + body.tier.toLowerCase();
      const row  = await env.DB.prepare('SELECT data FROM images WHERE key=?').bind(key).first();
      const items = row ? JSON.parse(row.data) : [];
      items.push(body.data);
      await env.DB.prepare('INSERT OR REPLACE INTO images (key,data) VALUES (?,?)').bind(key, JSON.stringify(items)).run();
      return json({ success:true, message:'Added.', count: items.length });
    }
    if (path === '/api/admin/comp/preemptive/delete' && method === 'POST') {
      if (!body.tier || body.index === undefined) return json({ success:false, message:'tier and index required' }, 400);
      const key  = 'preemptive_' + body.tier.toLowerCase();
      const row  = await env.DB.prepare('SELECT data FROM images WHERE key=?').bind(key).first();
      const items = row ? JSON.parse(row.data) : [];
      items.splice(body.index, 1);
      await env.DB.prepare('INSERT OR REPLACE INTO images (key,data) VALUES (?,?)').bind(key, JSON.stringify(items)).run();
      return json({ success:true, message:'Deleted.' });
    }

    // ── Comp How To Play ──────────────────────────────────────
    if (path === '/api/admin/comp/howtoplay/save' && method === 'POST') {
      if (!body.tier) return json({ success:false, message:'tier required' }, 400);
      const key = 'how_to_play_' + body.tier.toLowerCase();
      await env.DB.prepare('INSERT OR REPLACE INTO images (key,data) VALUES (?,?)').bind(key, body.content || '').run();
      return json({ success:true, message:'Saved.' });
    }
    if (path === '/api/admin/comp/howtoplay/get' && method === 'GET') {
      const tier = url.searchParams.get('tier') || '';
      const row  = await env.DB.prepare('SELECT data FROM images WHERE key=?').bind('how_to_play_' + tier.toLowerCase()).first();
      return json({ content: row ? row.data : '' });
    }

    // ── Comp Build Notes (images key) ─────────────────────────
    if (path === '/api/admin/comp/notes/save' && method === 'POST') {
      if (!body.tier) return json({ success:false, message:'tier required' }, 400);
      const key = 'notes_' + body.tier.toLowerCase();
      await env.DB.prepare('INSERT OR REPLACE INTO images (key,data) VALUES (?,?)').bind(key, body.content || '').run();
      return json({ success:true, message:'Build notes saved.' });
    }
    if (path === '/api/admin/comp/notes/get' && method === 'GET') {
      const tier = url.searchParams.get('tier') || '';
      const row  = await env.DB.prepare('SELECT data FROM images WHERE key=?').bind('notes_' + tier.toLowerCase()).first();
      return json({ content: row ? row.data : '' });
    }

    // ── Comp Chars ────────────────────────────────────────────
    if (path === '/api/admin/comp/chars/save' && method === 'POST') {
      if (!body.tier || !Array.isArray(body.chars)) return json({ success:false, message:'tier and chars[] required' }, 400);
      await env.DB.prepare('DELETE FROM comp_chars WHERE tier=?').bind(body.tier).run();
      for (const c of body.chars) {
        await env.DB.prepare(
          'INSERT INTO comp_chars (tier,position,char_name,char_slug,costume_name,bond_stats) VALUES (?,?,?,?,?,?)'
        ).bind(body.tier, c.position||0, c.char_name||'', c.char_slug||'', c.costume_name||'', c.bond_stats||'').run();
      }
      return json({ success:true, message:'Chars saved.' });
    }
    if (path === '/api/admin/comp/chars/get' && method === 'GET') {
      const tier = url.searchParams.get('tier') || '';
      const r = await env.DB.prepare('SELECT * FROM comp_chars WHERE tier=? ORDER BY position').bind(tier).all().catch(() => ({ results: [] }));
      return json({ chars: r.results || [] });
    }

    // ── Home Notes ────────────────────────────────────────────
    if (path === '/api/admin/home/notes/save' && method === 'POST') {
      if (!body.slot) return json({ success:false, message:'slot required' }, 400);
      const key = 'home_strategy_' + body.slot;
      await env.DB.prepare('INSERT OR REPLACE INTO images (key,data) VALUES (?,?)')
        .bind(key, JSON.stringify({ title: body.title||'', content: body.content||'' })).run();
      return json({ success:true, message:'Saved.' });
    }
    if (path === '/api/admin/home/notes/get' && method === 'GET') {
      const slot = parseInt(url.searchParams.get('slot') || '0', 10);
      const defaults = {
        1: { title: 'Tier Usage', content: 'Use T2 for general attacking and climbing\nUse T4 for general defence\nOnly use T1 going for Rank 1 — last hour only\nT5 only counters Michaela, loses to most Double Taunt\nT6 counters T3 and Double Taunt — loses to T2 and T1' },
        2: { title: 'Targeting Top 10', content: 'Hit 3 hours before end and sit in Top 10\nDefend until 2–1.5 hours remain\nThen spam attack' },
        3: { title: 'Targeting Rank 1', content: 'Sit Top 1–3 at the 3-hour mark\nUse T6 as blocker to feed one player into R1\nThe R1 player uses T1 or T2' },
        4: { title: 'Building PvP Characters', content: 'Tanks: target 105% Magic Resist, Defence at 90%\nDamage carries: 50% Crit Rate with buffer, 100% without\nJustia & Alec: HP ring with ATK substats + Magic Resist Armor\nAll compositions can swap lanes' },
      };
      const row  = await env.DB.prepare("SELECT data FROM images WHERE key=?").bind('home_strategy_' + slot).first();
      const data = row ? JSON.parse(row.data) : (defaults[slot] || { title: '', content: '' });
      return json({ data });
    }

  } catch(e) {
    return json({ success:false, message:'DB error: ' + e.message }, 500);
  }

  return json({ success:false, message:'Not found' }, 404);
}
