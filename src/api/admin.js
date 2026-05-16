import { json } from '../layout/layout.js';

async function renameTierCascade(env, oldTier, newTier) {
  if (oldTier === newTier) return;
  const ol = oldTier.toLowerCase();
  const nl = newTier.toLowerCase();
  await env.DB.prepare('UPDATE comp_rotations SET tier=? WHERE tier=?').bind(newTier, oldTier).run().catch(()=>{});
  await env.DB.prepare('UPDATE comp_media SET tier=? WHERE tier=?').bind(newTier, oldTier).run().catch(()=>{});
  await env.DB.prepare('UPDATE comp_chars SET tier=? WHERE tier=?').bind(newTier, oldTier).run().catch(()=>{});
  const imgPatterns = [
    [`comp_${ol}_board`, `comp_${nl}_board`],
    [`comp_${ol}_board_back`, `comp_${nl}_board_back`],
    [`comp_${ol}_video`, `comp_${nl}_video`],
    [`preemptive_${ol}`, `preemptive_${nl}`],
    [`how_to_play_${ol}`, `how_to_play_${nl}`],
    [`notes_${ol}`, `notes_${nl}`],
  ];
  for (const [ok, nk] of imgPatterns) {
    if (ok === nk) continue;
    const row = await env.DB.prepare('SELECT data FROM images WHERE key=?').bind(ok).first().catch(()=>null);
    if (row) {
      await env.DB.prepare('INSERT OR REPLACE INTO images (key,data) VALUES (?,?)').bind(nk, row.data).run().catch(()=>{});
      await env.DB.prepare('DELETE FROM images WHERE key=?').bind(ok).run().catch(()=>{});
    }
  }
}

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
      // Assign sort_order = max(sort_order)+10 within same type
      const mx = await env.DB.prepare('SELECT MAX(sort_order) as m FROM compositions WHERE type=?').bind(body.type||'ATK').first().catch(() => null);
      const nextOrder = ((mx && mx.m) || 0) + 10;
      const r = await env.DB.prepare(
        'INSERT INTO compositions (tier,name,type,description,countered_by,last_updated,sort_order) VALUES (?,?,?,?,?,?,?)'
      ).bind(body.tier||'T1', body.name, body.type||'ATK', body.description||'', body.countered_by||'', body.last_updated||'', nextOrder).run().catch(async () => {
        return env.DB.prepare(
          'INSERT INTO compositions (tier,name,type,description,countered_by,last_updated) VALUES (?,?,?,?,?,?)'
        ).bind(body.tier||'T1', body.name, body.type||'ATK', body.description||'', body.countered_by||'', body.last_updated||'').run();
      });
      return json({ success:true, message:'Composition added!', id: r.meta.last_row_id });
    }
    if (path === '/api/admin/comp/delete' && method === 'POST') {
      await env.DB.prepare('DELETE FROM compositions WHERE id=?').bind(body.id).run();
      return json({ success:true, message:'Deleted.' });
    }
    if (path === '/api/admin/comp/reorder' && method === 'POST') {
      await env.DB.prepare('ALTER TABLE compositions ADD COLUMN sort_order INTEGER DEFAULT 0').run().catch(() => {});
      // Drag-drop bulk reorder: ids array
      if (Array.isArray(body.ids)) {
        for (let i = 0; i < body.ids.length; i++) {
          await env.DB.prepare('UPDATE compositions SET sort_order=? WHERE id=?').bind((i+1)*10, body.ids[i]).run().catch(()=>{});
        }
        return json({ success: true });
      }
      const comp = await env.DB.prepare('SELECT id, type, sort_order FROM compositions WHERE id=?').bind(body.id).first();
      if (!comp) return json({ success:false, message:'Not found' }, 404);
      const allOfType = await env.DB.prepare(
        'SELECT id, tier, sort_order, name, color FROM compositions WHERE type=? ORDER BY COALESCE(NULLIF(sort_order,0),id*10) ASC, id ASC'
      ).bind(comp.type).all().catch(() => ({results:[]}));
      const list = allOfType.results || [];
      const idx  = list.findIndex(r => r.id === comp.id);
      const swapIdx = body.direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= list.length) {
        return json({ success:true, message:'Already at edge.', comps: list.map(c=>({...c,type:comp.type})) });
      }
      const a = list[idx], b = list[swapIdx];
      const aOrder = a.sort_order || (idx + 1) * 10;
      const bOrder = b.sort_order || (swapIdx + 1) * 10;
      await env.DB.prepare('UPDATE compositions SET sort_order=? WHERE id=?').bind(bOrder, a.id).run().catch(() => {});
      await env.DB.prepare('UPDATE compositions SET sort_order=? WHERE id=?').bind(aOrder, b.id).run().catch(() => {});
      // Re-read in new order and renumber tiers
      const newOrder = await env.DB.prepare(
        'SELECT id, tier, name, color FROM compositions WHERE type=? ORDER BY COALESCE(NULLIF(sort_order,0),id*10) ASC, id ASC'
      ).bind(comp.type).all().catch(() => ({results:[]}));
      const ordered = newOrder.results || [];
      const prefix = comp.type === 'DEF' ? 'D' : 'A';
      // Build map of id→newTier
      const newTierMap = {};
      ordered.forEach((c, i) => { newTierMap[c.id] = `${prefix}${i + 1}`; });
      // Two-pass rename via temp names to avoid conflicts
      for (const c of ordered) {
        const nt = newTierMap[c.id];
        if (c.tier !== nt) {
          const tmp = `_TMP_${c.id}`;
          await env.DB.prepare('UPDATE compositions SET tier=? WHERE id=?').bind(tmp, c.id).run().catch(()=>{});
          await renameTierCascade(env, c.tier, tmp);
        }
      }
      for (const c of ordered) {
        const nt = newTierMap[c.id];
        if (c.tier !== nt) {
          const tmp = `_TMP_${c.id}`;
          await env.DB.prepare('UPDATE compositions SET tier=? WHERE id=?').bind(nt, c.id).run().catch(()=>{});
          await renameTierCascade(env, tmp, nt);
        }
      }
      // Return all comps of both types so client can refresh
      const allComps = await env.DB.prepare(
        'SELECT id, tier, name, type, color, short_description, description, countered_by, unit_order FROM compositions ORDER BY type ASC, COALESCE(NULLIF(sort_order,0),id*10) ASC, id ASC'
      ).all().catch(() => ({results:[]}));
      return json({ success:true, comps: allComps.results || [] });
    }

    if (path === '/api/admin/comp/normalize-tiers' && method === 'POST') {
      // Renumber all ATK comps to A1,A2,... and DEF comps to D1,D2,...
      for (const type of ['ATK','DEF']) {
        const prefix = type === 'DEF' ? 'D' : 'A';
        const res = await env.DB.prepare(
          'SELECT id, tier FROM compositions WHERE type=? ORDER BY COALESCE(NULLIF(sort_order,0),id*10) ASC, id ASC'
        ).bind(type).all().catch(() => ({results:[]}));
        const comps = res.results || [];
        const newTierMap = {};
        comps.forEach((c, i) => { newTierMap[c.id] = `${prefix}${i + 1}`; });
        for (const c of comps) {
          const nt = newTierMap[c.id];
          if (c.tier !== nt) {
            const tmp = `_TMP_${c.id}`;
            await env.DB.prepare('UPDATE compositions SET tier=? WHERE id=?').bind(tmp, c.id).run().catch(()=>{});
            await renameTierCascade(env, c.tier, tmp);
          }
        }
        for (const c of comps) {
          const nt = newTierMap[c.id];
          if (c.tier !== nt) {
            const tmp = `_TMP_${c.id}`;
            await env.DB.prepare('UPDATE compositions SET tier=? WHERE id=?').bind(nt, c.id).run().catch(()=>{});
            await renameTierCascade(env, tmp, nt);
          }
        }
      }
      return json({ success:true, message:'All tiers normalized.' });
    }

    // ── Emotes ───────────────────────────────────────────────
    if (path === '/api/admin/emote/add' && method === 'POST') {
      if (!body.name || !body.image_url) return json({ success:false, message:'Name and image_url required' }, 400);
      await env.DB.prepare('ALTER TABLE emotes ADD COLUMN set_num INTEGER DEFAULT 1').run().catch(()=>{});
      const sn = parseInt(body.set_num, 10) || 1;
      const r = await env.DB.prepare(
        'INSERT INTO emotes (name, image_url, set_num) VALUES (?,?,?)'
      ).bind(body.name.trim(), body.image_url.trim(), sn).run();
      return json({ success:true, message:'Emote added!', id: r.meta.last_row_id });
    }
    if (path === '/api/admin/emote/delete' && method === 'POST') {
      await env.DB.prepare('DELETE FROM emotes WHERE id=?').bind(body.id).run();
      return json({ success:true, message:'Deleted.' });
    }
    if (path === '/api/admin/emote-set/list' && method === 'GET') {
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS emote_sets (set_num INTEGER PRIMARY KEY, name TEXT, hint TEXT, unlock_page TEXT, unlock_target TEXT, unlock_count INTEGER DEFAULT 7, cover_key TEXT)").run().catch(()=>{});
      const r = await env.DB.prepare('SELECT * FROM emote_sets ORDER BY set_num').all();
      return json({ success:true, sets: r.results || [] });
    }
    if (path === '/api/admin/emote-set/save' && method === 'POST') {
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS emote_sets (set_num INTEGER PRIMARY KEY, name TEXT, hint TEXT, unlock_page TEXT, unlock_target TEXT, unlock_count INTEGER DEFAULT 7, cover_key TEXT)").run().catch(()=>{});
      await env.DB.prepare("ALTER TABLE emote_sets ADD COLUMN unlock_mode TEXT DEFAULT 'count'").run().catch(()=>{});
      await env.DB.prepare("ALTER TABLE emote_sets ADD COLUMN unlock_sequence TEXT DEFAULT ''").run().catch(()=>{});
      await env.DB.prepare("ALTER TABLE emote_sets ADD COLUMN set_letter TEXT DEFAULT ''").run().catch(()=>{});
      const sn = parseInt(body.set_num, 10);
      if (!sn) return json({ success:false, message:'set_num required' }, 400);
      const validModes = ['count', 'sequence', 'letter_sequence', 'who_am_i'];
      const mode = validModes.includes(body.unlock_mode) ? body.unlock_mode : 'count';
      let sequence = (body.unlock_sequence || '').toString().trim();
      if (mode === 'sequence') {
        sequence = sequence.toLowerCase().split(',').map(s => s.trim()).filter(Boolean).join(',');
      } else if (mode === 'letter_sequence') {
        sequence = sequence.toUpperCase().split(',').map(s => s.trim()).filter(Boolean).join(',');
      }
      // who_am_i: keep as-is (it's the answer text)
      await env.DB.prepare(
        'INSERT INTO emote_sets (set_num, name, hint, unlock_page, unlock_target, unlock_count, cover_key, unlock_mode, unlock_sequence, set_letter) VALUES (?,?,?,?,?,?,?,?,?,?) ' +
        'ON CONFLICT(set_num) DO UPDATE SET name=excluded.name, hint=excluded.hint, unlock_page=excluded.unlock_page, unlock_target=excluded.unlock_target, unlock_count=excluded.unlock_count, cover_key=excluded.cover_key, unlock_mode=excluded.unlock_mode, unlock_sequence=excluded.unlock_sequence, set_letter=excluded.set_letter'
      ).bind(sn, body.name||('Set '+sn), body.hint||'', body.unlock_page||'characters', (body.unlock_target||''), parseInt(body.unlock_count,10)||0, body.cover_key||'', mode, sequence, body.set_letter||'').run();
      return json({ success:true, message:'Set saved.' });
    }
    if (path === '/api/admin/emote/list-by-set' && method === 'GET') {
      await env.DB.prepare('ALTER TABLE emotes ADD COLUMN set_num INTEGER DEFAULT 1').run().catch(()=>{});
      const sn = parseInt(new URL(request.url).searchParams.get('set_num'), 10) || 1;
      const r = await env.DB.prepare('SELECT * FROM emotes WHERE set_num=? ORDER BY created_at DESC').bind(sn).all();
      return json({ success:true, emotes: r.results || [] });
    }
    if (path === '/api/admin/emote/bulk-add' && method === 'POST') {
      await env.DB.prepare('ALTER TABLE emotes ADD COLUMN set_num INTEGER DEFAULT 1').run().catch(()=>{});
      const sn = parseInt(body.set_num, 10) || 1;
      const items = Array.isArray(body.items) ? body.items : [];
      let added = 0;
      for (const it of items) {
        if (!it || !it.name || !it.data) continue;
        const safe = String(it.name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').substring(0,40);
        const key = 'emote_' + sn + '_' + safe + '_' + Date.now() + '_' + added;
        await env.DB.prepare('INSERT OR REPLACE INTO images (key,data) VALUES (?,?)').bind(key, it.data).run().catch(()=>{});
        await env.DB.prepare('INSERT INTO emotes (name, image_url, set_num) VALUES (?,?,?)').bind(it.name, '/img/' + key, sn).run();
        added++;
      }
      return json({ success:true, message:'Added ' + added + ' emote' + (added===1?'':'s') + '.', added });
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
        "SELECT key FROM images WHERE key NOT LIKE 'notes_%' AND key NOT LIKE '%_migrated' AND key != 'unit_order' AND key != 'board_layout' AND key != 'mamonir_tap_count' AND key != 'special_code_config' AND key != 'home_secret_passcode' ORDER BY key"
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
    if (path === '/api/admin/costumes/update' && method === 'POST') {
      if (!body.char_slug || !body.costume_slug) return json({ success:false, message:'char_slug and costume_slug required' }, 400);
      await env.DB.prepare(
        'UPDATE char_costumes SET bond_stats=? WHERE char_slug=? AND costume_slug=?'
      ).bind(body.bond_stats||'', body.char_slug, body.costume_slug).run();
      return json({ success:true, message:'Bond stats saved.' });
    }

    // ── Character reset (danger zone) ────────────────────────
    if (path === '/api/admin/chars/reset' && method === 'POST') {
      await env.DB.prepare('DELETE FROM char_registry').run().catch(() => {});
      await env.DB.prepare('DELETE FROM char_costumes').run().catch(() => {});
      await env.DB.prepare('DELETE FROM char_skills').run().catch(() => {});
      await env.DB.prepare('DELETE FROM comp_chars').run().catch(() => {});
      await env.DB.prepare("DELETE FROM images WHERE key LIKE 'char_%'").run().catch(() => {});
      return json({ success:true, message:'All characters, costumes, skills, bonds, portraits and gear deleted.' });
    }

    // ── Skills ─────────────────────────────────────────────────
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

    // ── Guide Card Label ──────────────────────────────────────
    if (path === '/api/admin/comp/guide-label' && method === 'POST') {
      if (!body.id) return json({ success:false, message:'id required' }, 400);
      await env.DB.prepare('ALTER TABLE compositions ADD COLUMN guide_label TEXT DEFAULT \'\'').run().catch(() => {});
      await env.DB.prepare('UPDATE compositions SET guide_label=? WHERE id=?').bind(body.guide_label||'', body.id).run();
      return json({ success:true, message:'Guide label saved.' });
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

    // ── Rotations Reset ──────────────────────────────────────
    if (path === '/api/admin/rotations/reset' && method === 'POST') {
      await env.DB.prepare('DELETE FROM comp_rotations').run().catch(() => {});
      return json({ success:true, message:'All skill rotations deleted.' });
    }

    // ── Comp Matchups ──────────────────────────────────────────
    if (path === '/api/admin/comp/matchups/save' && method === 'POST') {
      if (!body.tier || !body.id) return json({ success:false, message:'tier and id required' }, 400);
      const countersKey = 'counters_' + body.tier.toLowerCase();
      await env.DB.prepare('INSERT OR REPLACE INTO images (key,data) VALUES (?,?)').bind(countersKey, body.counters || '').run();
      await env.DB.prepare('UPDATE compositions SET countered_by=? WHERE id=?').bind(body.countered_by || '', body.id).run();
      return json({ success:true, message:'Matchups saved.' });
    }
    if (path === '/api/admin/comp/matchups/get' && method === 'GET') {
      const tier = url.searchParams.get('tier') || '';
      const id   = parseInt(url.searchParams.get('id') || '0', 10);
      const countersRow = await env.DB.prepare('SELECT data FROM images WHERE key=?').bind('counters_' + tier.toLowerCase()).first().catch(()=>null);
      const compRow     = id ? await env.DB.prepare('SELECT countered_by FROM compositions WHERE id=?').bind(id).first().catch(()=>null) : null;
      return json({ counters: countersRow ? countersRow.data : '', countered_by: compRow ? (compRow.countered_by || '') : '' });
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

    // ── Secret Code ───────────────────────────────────────────
    if (path === '/api/admin/secret/save' && method === 'POST') {
      if (!body.code || body.code.length < 4)
        return json({ success:false, message:'Secret code must be at least 4 characters.' });
      await env.DB.prepare("INSERT OR REPLACE INTO images (key,data) VALUES ('secret_code',?)")
        .bind(body.code).run();
      return json({ success:true, message:'Secret code updated.' });
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
