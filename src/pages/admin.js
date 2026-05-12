import { layout, esc } from '../layout/layout.js';

const ADMIN_PASSWORD = 'Anime0404!';

function isAuthed(request) {
  const cookie = request.headers.get('Cookie') || '';
  return cookie.split(';').some(c => c.trim() === 'admin=true');
}

export async function handleAdminLogin(request, env) {
  const form = await request.formData();
  if (form.get('password') === ADMIN_PASSWORD) {
    return new Response('', {
      status: 302,
      headers: {
        Location: '/admin',
        'Set-Cookie': 'admin=true; Path=/; HttpOnly; SameSite=Lax',
      },
    });
  }
  return renderLogin('Incorrect password.');
}

export async function handleAdminLogout() {
  return new Response('', {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': 'admin=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    },
  });
}

export async function handleAdmin(request, env) {
  if (!isAuthed(request)) return renderLogin();

  let coupons = [], emotes = [], comps = [], images = [], chars = [];
  try {
    const [cr, er, compr, imgr, charr] = await Promise.all([
      env.DB.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all(),
      env.DB.prepare('SELECT * FROM emotes ORDER BY created_at DESC').all(),
      env.DB.prepare('SELECT * FROM compositions ORDER BY tier ASC').all(),
      env.DB.prepare("SELECT key FROM images WHERE key NOT LIKE 'notes_%' AND key != 'unit_order' AND key != 'board_layout' ORDER BY key").all(),
      env.DB.prepare('SELECT * FROM char_registry ORDER BY name ASC').all().catch(() => ({ results: [] })),
    ]);
    coupons = cr.results || [];
    emotes  = er.results || [];
    comps   = compr.results || [];
    images  = imgr.results || [];
    chars   = charr.results || [];
  } catch(e) {}

  const existingKeys = new Set(images.map(i => i.key));

  const skillSlots = [
    { char:'Rou',          slots:['Snack Time','Half Moon Kick','Hide & Seek 1','Terra Burst','Hide & Seek 2'] },
    { char:'Seir',         slots:['Protective Instinct 1','He is Bullying Me 1','Protective Instinct 2','He is Bullying Me 2','Protective Instinct 3'] },
    { char:'Lecliss',      slots:['Curse Replica 1','Auto Defense Mode 1','Curse Replica 2','Auto Defense Mode 2','Curse Replica 3'] },
    { char:'Scheherazade', slots:['Sapphire Boomerang 1','Aqua Break 1','Aqua Silence','Sapphire Boomerang 2','Aqua Break 2'] },
    { char:'Sylvia',       slots:['CBFS 1','Bikini Blaster 1','The Punisher','CBFS 2','Bikini Blaster 2'] },
  ];

  const tileStatusHtml = skillSlots.map(({char, slots}) => `
<div style="margin-bottom:0.75rem">
  <div style="font-family:'Cinzel',serif;font-size:0.8rem;color:var(--gold);margin-bottom:0.4rem">${esc(char)}</div>
  ${slots.map((name, i) => {
    const k = `tile_${char.toLowerCase().replace('scheherazade','schera')}_${i+1}`;
    const has = existingKeys.has(k);
    return `<span style="display:inline-block;margin:2px 4px 2px 0;font-size:0.72rem;padding:2px 8px;border-radius:3px;background:${has ? 'rgba(39,174,96,0.15)' : 'var(--bg4)'};border:1px solid ${has ? 'rgba(39,174,96,0.3)' : 'var(--border2)'};color:${has ? '#2ecc71' : 'var(--text3)'}">Slot ${i+1}: ${esc(name)} ${has ? '✓' : '✗'}</span>`;
  }).join('')}
</div>`).join('');

  const imgGridHtml = images.length ? images.map(img => `
  <div class="img-slot" id="imgslot-${esc(img.key)}">
    <img src="/img/${esc(img.key)}" alt="${esc(img.key)}" style="object-fit:contain" onclick="openLightbox('/img/${esc(img.key)}')" onerror="this.style.display='none'">
    <div class="img-slot-key">${esc(img.key)}</div>
    <button class="btn-danger" style="margin-top:4px;width:100%" onclick="deleteImage('${esc(img.key)}')">Delete</button>
  </div>`).join('') : '<p style="color:var(--text3);font-size:0.83rem">No images uploaded yet.</p>';

  const compsListHtml = comps.map(c => {
    const isAtk = (c.type || '').toUpperCase() === 'ATK';
    const badgeStyle = isAtk
      ? 'background:rgba(41,128,185,0.2);color:#5dade2;border:1px solid rgba(41,128,185,0.35)'
      : 'background:rgba(39,174,96,0.2);color:#2ecc71;border:1px solid rgba(39,174,96,0.35)';
    const badgeText = isAtk ? '⚔ ATK' : '🛡 DEF';
    return `
    <div class="admin-item" id="comp-${c.id}">
      <div class="admin-item-info">
        <strong>${esc(c.tier)} — ${esc(c.name)}</strong>
        <span style="display:inline-block;margin-left:0.5rem;font-size:0.72rem;padding:2px 8px;border-radius:3px;${badgeStyle}">${badgeText}</span>
      </div>
      <button class="btn-danger" onclick="deleteComp(${c.id})">Delete</button>
    </div>`;
  }).join('') || '<p style="color:var(--text3);font-size:0.83rem">No custom compositions yet.</p>';

  const charsListHtml = chars.map(c => `
    <div class="admin-item" id="char-${c.id}" style="cursor:pointer" onclick="selectChar(${c.id},'${esc(c.name)}','${esc(c.slug)}')">
      <div class="admin-item-info"><strong>${esc(c.name)}</strong>${c.status === 'upcoming' ? ' <span style="color:var(--gold);font-size:0.75rem">🔜</span>' : ''}</div>
      <button class="btn-danger" onclick="event.stopPropagation();deleteChar(${c.id})">Delete</button>
    </div>`).join('') || '<p style="color:var(--text3);font-size:0.83rem">No characters yet.</p>';

  const tierOptions = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]
    .map(n => `<option>T${n}</option>`).join('');

  return layout('Admin Panel', `
<div class="admin-wrap">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
    <h1 style="font-family:'Cinzel',serif;font-size:1.5rem;color:var(--gold2)">Admin Panel</h1>
    <a href="/admin/logout" style="font-size:0.82rem;color:var(--text3)">Logout</a>
  </div>

  <div class="admin-tabs">
    <button class="tab-btn active" data-tab="coupons" onclick="showTab('coupons')">Coupons</button>
    <button class="tab-btn"        data-tab="comps"   onclick="showTab('comps')">Compositions</button>
    <button class="tab-btn"        data-tab="emotes"  onclick="showTab('emotes')">Emotes</button>
    <button class="tab-btn"        data-tab="images"  onclick="showTab('images')">Images</button>
    <button class="tab-btn"        data-tab="t1"      onclick="showTab('t1')">T1 Content</button>
    <button class="tab-btn"        data-tab="chars"   onclick="showTab('chars')">Characters</button>
  </div>

  <!-- ═══════════════════════════════════════════════════════════ COUPONS -->
  <div class="admin-section active" id="tab-coupons">
    <div class="admin-form">
      <h3>Add Coupon Code</h3>
      <div id="coupon-alert"></div>
      <div class="form-row">
        <div class="form-group"><label>Code</label><input type="text" id="c-code" placeholder="BDCODE2024"></div>
        <div class="form-group"><label>Expiry (optional)</label><input type="text" id="c-expiry" placeholder="2024-12-31"></div>
      </div>
      <div class="form-group"><label>Rewards</label><input type="text" id="c-rewards" placeholder="50 Diamonds + 3 Tickets"></div>
      <button class="btn" style="width:auto;padding:10px 24px" onclick="addCoupon()">Add Code</button>
    </div>
    <div id="coupon-list" style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:0.5rem">
      ${coupons.map(c => `
      <div class="admin-item" id="coupon-${c.id}">
        <div class="admin-item-info">
          <strong>${esc(c.code)}</strong> — ${esc(c.rewards || '')}
          ${c.expiry ? ` · Expires ${esc(c.expiry)}` : ''} · ${c.active ? 'Active' : 'Inactive'}
        </div>
        <button class="btn-danger" onclick="deleteCoupon(${c.id})">Delete</button>
      </div>`).join('') || '<p style="color:var(--text3);font-size:0.83rem">No coupons yet.</p>'}
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════ COMPOSITIONS -->
  <div class="admin-section" id="tab-comps">
    <div class="admin-form">
      <h3>Add Composition</h3>
      <div id="comp-alert"></div>
      <div class="form-row">
        <div class="form-group"><label>Tier</label>
          <select id="comp-tier">${tierOptions}</select>
        </div>
        <div class="form-group"><label>Type</label>
          <select id="comp-type"><option>ATK</option><option>DEF</option></select>
        </div>
      </div>
      <div class="form-group"><label>Name</label><input type="text" id="comp-name" placeholder="Team Name"></div>
      <div class="form-group"><label>Description / Notes</label><textarea id="comp-desc" placeholder="Build notes and details..."></textarea></div>
      <div class="form-group"><label>Countered By</label><input type="text" id="comp-cby" placeholder="T1, Schera teams"></div>
      <button class="btn" style="width:auto;padding:10px 24px" onclick="addComp()">Add Composition</button>
    </div>
    <div id="comp-list" style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:0.5rem">
      ${compsListHtml}
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════ EMOTES -->
  <div class="admin-section" id="tab-emotes">
    <div class="admin-form">
      <h3>Add Emote</h3>
      <div id="emote-alert"></div>
      <div class="form-row">
        <div class="form-group"><label>Name</label><input type="text" id="e-name" placeholder="Happy Sylvia"></div>
        <div class="form-group"><label>Image URL</label><input type="text" id="e-url" placeholder="https://..."></div>
      </div>
      <button class="btn" style="width:auto;padding:10px 24px" onclick="addEmote()">Add Emote</button>
    </div>
    <div id="emote-list" style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:0.5rem">
      ${emotes.map(e => `
      <div class="admin-item" id="emote-${e.id}">
        <div class="admin-item-info" style="display:flex;align-items:center;gap:0.75rem">
          <img src="${esc(e.image_url)}" style="width:36px;height:36px;object-fit:cover;border-radius:4px" onerror="this.style.display='none'">
          <strong>${esc(e.name)}</strong>
        </div>
        <button class="btn-danger" onclick="deleteEmote(${e.id})">Delete</button>
      </div>`).join('') || '<p style="color:var(--text3);font-size:0.83rem">No emotes yet.</p>'}
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════ IMAGES -->
  <div class="admin-section" id="tab-images">
    <div class="admin-form">
      <h3>Upload Image</h3>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1rem">Select a category, configure the slot, pick a file. Auto-compressed to 340px JPEG.</p>
      <div id="img-alert"></div>

      <!-- Category buttons -->
      <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:1rem">
        <button class="img-cat-btn active" data-cat="chars"  onclick="setImgCat('chars')">Characters</button>
        <button class="img-cat-btn"        data-cat="comps"  onclick="setImgCat('comps')">Compositions</button>
        <button class="img-cat-btn"        data-cat="tiles"  onclick="setImgCat('tiles')">Skills/Tiles</button>
        <button class="img-cat-btn"        data-cat="board"  onclick="setImgCat('board')">Board</button>
        <button class="img-cat-btn"        data-cat="other"  onclick="setImgCat('other')">Other</button>
      </div>

      <!-- Characters category -->
      <div id="imgcat-chars">
        <div class="form-row">
          <div class="form-group">
            <label>Character</label>
            <select id="img-char-pick" onchange="updateComputedKey()">
              <option value="Rou">Rou</option>
              <option value="Seir">Seir</option>
              <option value="Lecliss">Lecliss</option>
              <option value="Scheherazade">Scheherazade</option>
              <option value="Sylvia">Sylvia</option>
            </select>
          </div>
          <div class="form-group">
            <label>Slot Type</label>
            <select id="img-char-slot" onchange="updateComputedKey()">
              <option value="portrait">Portrait</option>
              <option value="gear">Gear</option>
              <option value="icon">Costume Icon</option>
            </select>
          </div>
        </div>
        <div class="form-group" id="img-char-costume-group" style="display:none">
          <label>Costume Slug</label>
          <input type="text" id="img-char-costume" placeholder="red_riding_hood" oninput="updateComputedKey()">
        </div>
      </div>

      <!-- Compositions category -->
      <div id="imgcat-comps" style="display:none">
        <div class="form-group">
          <label>Tier</label>
          <select id="img-comp-tier" onchange="updateComputedKey()">
            ${[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(n => `<option value="T${n}">T${n}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Skills/Tiles category -->
      <div id="imgcat-tiles" style="display:none">
        <div class="form-row">
          <div class="form-group">
            <label>Character</label>
            <select id="img-tile-char" onchange="updateComputedKey()">
              <option value="rou">Rou</option>
              <option value="seir">Seir</option>
              <option value="lecliss">Lecliss</option>
              <option value="schera">Scheherazade</option>
              <option value="sylvia">Sylvia</option>
            </select>
          </div>
          <div class="form-group">
            <label>Slot</label>
            <select id="img-tile-slot" onchange="updateComputedKey()">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Board category -->
      <div id="imgcat-board" style="display:none">
        <p style="font-size:0.83rem;color:var(--text3)">Key: <span style="color:var(--gold);font-family:monospace">board_layout</span> (fixed)</p>
      </div>

      <!-- Other category -->
      <div id="imgcat-other" style="display:none">
        <div class="form-group">
          <label>Custom Key</label>
          <input type="text" id="img-custom-key" placeholder="my_image_key" oninput="updateComputedKey()">
        </div>
      </div>

      <!-- Computed key display -->
      <div style="margin-bottom:0.75rem;font-size:0.83rem;color:var(--text3)">
        Key: <span id="img-computed-key" style="color:var(--gold);font-family:monospace"></span>
      </div>

      <!-- File input -->
      <div class="form-group">
        <label>Image File</label>
        <input type="file" id="img-file" accept="image/*" onchange="previewImage(this)" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:10px 14px;border-radius:5px;width:100%">
      </div>

      <!-- Preview -->
      <div id="img-preview-wrap" style="display:none">
        <div id="img-preview-container" style="height:300px;background:var(--bg4);border:1px solid var(--border2);border-radius:6px;display:flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:0.5rem;transition:height 0.2s">
          <img id="img-preview" style="max-width:100%;max-height:100%;object-fit:contain">
        </div>
        <div id="img-preview-info" style="font-size:0.75rem;color:var(--text3);margin-bottom:0.4rem"></div>
        <button id="img-preview-expand" onclick="togglePreviewExpand()" style="font-size:0.75rem;color:var(--text3);background:none;border:1px solid var(--border2);border-radius:3px;padding:2px 8px;cursor:pointer">Show Full</button>
      </div>

      <canvas id="compress-canvas" style="display:none"></canvas>
      <button class="btn" style="width:auto;padding:10px 24px;margin-top:0.75rem" onclick="uploadImage()">Upload Image</button>
    </div>

    <!-- Image grid -->
    <div class="admin-form">
      <h3>Uploaded Images (${images.length})</h3>
      <div class="img-grid" id="img-grid">
        ${imgGridHtml}
      </div>
    </div>

    <!-- Lightbox -->
    <div id="img-lightbox" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:9998;align-items:center;justify-content:center;cursor:zoom-out" onclick="closeLightbox()">
      <img id="img-lightbox-img" style="max-width:90vw;max-height:90vh;object-fit:contain;border-radius:4px">
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════ T1 CONTENT -->
  <div class="admin-section" id="tab-t1">
    <div class="admin-form">
      <h3>Character Build Notes</h3>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1rem">Edit the build notes shown on hover over each character portrait.</p>
      <div class="form-group">
        <label>Character</label>
        <select id="notes-char" onchange="loadNotes()">
          <option value="Rou">Rou</option>
          <option value="Seir">Seir</option>
          <option value="Lecliss">Lecliss</option>
          <option value="Scheherazade">Scheherazade</option>
          <option value="Sylvia">Sylvia</option>
        </select>
      </div>
      <div class="form-group">
        <label>Build Notes</label>
        <textarea id="notes-text" rows="5" placeholder="Build notes for this character..."></textarea>
      </div>
      <div id="notes-alert"></div>
      <button class="btn" style="width:auto;padding:10px 24px" onclick="saveNotes()">Save Notes</button>
    </div>

    <div class="admin-form">
      <h3>Unit Order</h3>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1rem">Edit the numbered placement order (positions 1–5).</p>
      ${[1,2,3,4,5].map(i => `
      <div class="form-group">
        <label>Position ${i}</label>
        <select id="order-${i}">
          ${['Rou','Seir','Lecliss','Scheherazade','Sylvia'].map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('')}
        </select>
      </div>`).join('')}
      <div id="order-alert"></div>
      <button class="btn" style="width:auto;padding:10px 24px" onclick="saveOrder()">Save Unit Order</button>
    </div>

    <div class="admin-form">
      <h3>Skill Tile Patterns</h3>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1rem">Upload tile screenshots via the Images tab.</p>
      ${tileStatusHtml}
    </div>

    <div class="admin-form">
      <h3>Board Positioning</h3>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1rem">Edit which characters occupy each board tile. DEF = left side, ATK = right side.</p>
      <div id="board-alert"></div>
      <div style="display:flex;gap:1.5rem;align-items:center;margin-bottom:1rem;flex-wrap:wrap">
        <div>
          <div style="text-align:center;font-size:0.65rem;color:#3498db;font-weight:700;letter-spacing:0.07em;margin-bottom:5px">DEF ←</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">
            ${['d1','d2','d3','d4','d5','d6'].map(k => `<input type="text" id="b${k}" placeholder="${k}" style="width:52px;height:52px;background:rgba(41,128,185,0.1);border:1px solid rgba(41,128,185,0.3);color:var(--text);font-size:0.65rem;text-align:center;border-radius:5px;font-family:'Cinzel',serif;font-weight:700;outline:none;padding:2px">`).join('')}
          </div>
        </div>
        <div style="font-size:1.4rem;color:var(--gold)">⟶</div>
        <div>
          <div style="text-align:center;font-size:0.65rem;color:#e74c3c;font-weight:700;letter-spacing:0.07em;margin-bottom:5px">→ ATK</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">
            ${['a1','a2','a3','a4','a5','a6'].map(k => `<input type="text" id="b${k}" placeholder="${k}" style="width:52px;height:52px;background:rgba(192,57,43,0.1);border:1px solid rgba(192,57,43,0.3);color:var(--text);font-size:0.65rem;text-align:center;border-radius:5px;font-family:'Cinzel',serif;font-weight:700;outline:none;padding:2px">`).join('')}
          </div>
        </div>
      </div>
      <button class="btn" style="width:auto;padding:10px 24px" onclick="saveBoard()">Save Board</button>
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════════ CHARACTERS -->
  <div class="admin-section" id="tab-chars">
    <div style="display:grid;grid-template-columns:220px 1fr;gap:1.5rem;align-items:start">
      <!-- Left: character list -->
      <div class="admin-form">
        <h3>Characters</h3>
        <div id="char-alert"></div>
        <div class="form-group"><label>Name</label><input id="new-char-name" placeholder="Rou"></div>
        <div class="form-group"><label>Slug</label><input id="new-char-slug" placeholder="rou"></div>
        <div class="form-group"><label>Status</label>
          <select id="new-char-status">
            <option value="active">Active</option>
            <option value="upcoming">Upcoming 🔜</option>
          </select>
        </div>
        <button class="btn" onclick="addChar()">Add Character</button>
        <div id="char-list" style="margin-top:1rem;display:flex;flex-direction:column;gap:0.4rem">
          ${charsListHtml}
        </div>
      </div>
      <!-- Right: character detail -->
      <div id="char-detail" style="display:none">
        <div class="admin-form">
          <h3>Costumes — <span id="detail-char-name"></span></h3>
          <div class="form-row">
            <div class="form-group"><label>Costume Name</label><input id="cost-name" placeholder="Red Riding Hood"></div>
            <div class="form-group"><label>Costume Slug</label><input id="cost-slug" placeholder="red_riding_hood"></div>
          </div>
          <div class="form-group"><label>Bond Stats</label><input id="cost-stats" placeholder="HP: +62.40%, DEF: +13.40%"></div>
          <div id="cost-alert"></div>
          <button class="btn" onclick="addCostume()">Add Costume</button>
          <div id="costume-list" style="margin-top:1rem;max-height:200px;overflow-y:auto;display:flex;flex-direction:column;gap:0.4rem"></div>
        </div>
        <div class="admin-form" id="skills-section" style="display:none">
          <h3>Skills — <span id="skills-costume-label"></span></h3>
          <div class="form-row">
            <div class="form-group"><label>Skill Name</label><input id="skill-name" placeholder="Half Moon Kick"></div>
            <div class="form-group"><label>Tile Type</label>
              <select id="skill-tile">
                <option>FRONT</option>
                <option>SELF</option>
                <option>ALL</option>
                <option>SKIP</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>SP Cost</label><input type="number" id="skill-sp" min="1" max="10" value="3"></div>
            <div class="form-group"><label>Cooldown</label><input type="number" id="skill-cd" min="1" max="10" value="5"></div>
          </div>
          <div class="form-group"><label>Description</label><textarea id="skill-desc" rows="3" placeholder="Skill effect..."></textarea></div>
          <div id="skill-alert"></div>
          <button class="btn" onclick="addSkill()">Add Skill</button>
          <div id="skill-list" style="margin-top:1rem;max-height:250px;overflow-y:auto;display:flex;flex-direction:column;gap:0.4rem"></div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
.img-cat-btn {
  display:inline-block;
  background:var(--bg4);
  border:1px solid var(--border2);
  color:var(--text2);
  padding:6px 12px;
  border-radius:4px;
  font-size:0.8rem;
  cursor:pointer;
}
.img-cat-btn.active {
  background:rgba(201,168,76,0.15);
  border-color:var(--gold);
  color:var(--gold);
}
</style>

<script>
/* ── Tab switching ── */
function showTab(name) {
  console.log('showTab:', name);
  var sections = document.querySelectorAll('.admin-section');
  var buttons  = document.querySelectorAll('.tab-btn');
  for (var i = 0; i < sections.length; i++) sections[i].classList.remove('active');
  for (var i = 0; i < buttons.length;  i++) buttons[i].classList.remove('active');
  var target = document.getElementById('tab-' + name);
  if (target) target.classList.add('active');
  var activeBtn = document.querySelector('[data-tab="' + name + '"]');
  if (activeBtn) activeBtn.classList.add('active');
  if (name === 't1') { loadNotes(); loadOrder(); loadBoard(); }
  if (name === 'chars') { loadChars(); }
  if (name === 'images') { updateComputedKey(); }
}

/* ── Helpers ── */
function escH(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function showAlert(id, ok, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '<div class="alert ' + (ok ? 'alert-success' : 'alert-error') + '">' + escH(msg) + '</div>';
  setTimeout(function() { el.innerHTML = ''; }, 3000);
}
async function apiPost(path, body) {
  try {
    var r = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await r.json();
  } catch(e) {
    return { success: false, message: e.message };
  }
}

/* ── Image category system ── */
var _imgCat = 'chars';
function setImgCat(cat) {
  _imgCat = cat;
  var cats = ['chars','comps','tiles','board','other'];
  for (var i = 0; i < cats.length; i++) {
    var d = document.getElementById('imgcat-' + cats[i]);
    if (d) d.style.display = cats[i] === cat ? 'block' : 'none';
  }
  var btns = document.querySelectorAll('.img-cat-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.toggle('active', btns[i].dataset.cat === cat);
  }
  updateComputedKey();
}
function updateComputedKey() {
  var key = '';
  if (_imgCat === 'chars') {
    var ch = (document.getElementById('img-char-pick') || {}).value || '';
    var sl = (document.getElementById('img-char-slot') || {}).value || 'portrait';
    var slug = ch.toLowerCase().replace('scheherazade','schera');
    if (sl === 'portrait') {
      key = 'char_' + slug + '_portrait';
    } else if (sl === 'gear') {
      key = 'char_' + slug + '_gear';
    } else {
      var cs = (document.getElementById('img-char-costume') || {}).value || '';
      key = 'char_' + slug + '_' + cs + '_icon';
    }
    var cg = document.getElementById('img-char-costume-group');
    if (cg) cg.style.display = sl === 'icon' ? 'block' : 'none';
  } else if (_imgCat === 'comps') {
    var t = (document.getElementById('img-comp-tier') || {}).value || 'T1';
    key = 'comp_' + t.toLowerCase() + '_board';
  } else if (_imgCat === 'tiles') {
    var ch = (document.getElementById('img-tile-char') || {}).value || 'rou';
    var sl = (document.getElementById('img-tile-slot') || {}).value || '1';
    key = 'tile_' + ch.toLowerCase().replace('scheherazade','schera') + '_' + sl;
  } else if (_imgCat === 'board') {
    key = 'board_layout';
  } else {
    key = (document.getElementById('img-custom-key') || {}).value || '';
  }
  var el = document.getElementById('img-computed-key');
  if (el) el.textContent = key;
}

/* ── Image preview ── */
function previewImage(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var url = URL.createObjectURL(file);
  var wrap = document.getElementById('img-preview-wrap');
  var imgEl = document.getElementById('img-preview');
  var info = document.getElementById('img-preview-info');
  if (!wrap || !imgEl) return;
  imgEl.src = url;
  imgEl.onload = function() {
    if (info) info.textContent = imgEl.naturalWidth + '×' + imgEl.naturalHeight + 'px  ·  ' + (file.size / 1024).toFixed(1) + ' KB';
    var c = document.getElementById('img-preview-container');
    if (c) c.style.height = '300px';
    var btn = document.getElementById('img-preview-expand');
    if (btn) btn.textContent = 'Show Full';
    _previewExpanded = false;
    wrap.style.display = 'block';
  };
}
var _previewExpanded = false;
function togglePreviewExpand() {
  _previewExpanded = !_previewExpanded;
  var c = document.getElementById('img-preview-container');
  var btn = document.getElementById('img-preview-expand');
  if (c) c.style.height = _previewExpanded ? '500px' : '300px';
  if (btn) btn.textContent = _previewExpanded ? 'Collapse' : 'Show Full';
}

/* ── Lightbox ── */
function openLightbox(src) {
  var lb = document.getElementById('img-lightbox');
  var img = document.getElementById('img-lightbox-img');
  if (!lb || !img) return;
  img.src = src;
  lb.style.display = 'flex';
}
function closeLightbox() {
  var lb = document.getElementById('img-lightbox');
  if (lb) lb.style.display = 'none';
}

/* ── Image compress + upload ── */
function compressImage(file, maxW, quality) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var scale = img.width > maxW ? maxW / img.width : 1;
        var canvas = document.getElementById('compress-canvas');
        canvas.width  = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
async function uploadImage() {
  var key = (document.getElementById('img-computed-key') || {}).textContent || '';
  if (!key) { showAlert('img-alert', false, 'Select a category and slot'); return; }
  var fileEl = document.getElementById('img-file');
  var file = fileEl && fileEl.files[0];
  if (!file) { showAlert('img-alert', false, 'Select an image file'); return; }
  showAlert('img-alert', true, 'Compressing…');
  var data = await compressImage(file, 340, 0.85);
  var r = await apiPost('/api/admin/image/upload', { key: key, data: data });
  showAlert('img-alert', r.success, r.message || (r.success ? 'Uploaded!' : 'Error'));
  if (r.success) {
    fileEl.value = '';
    var wrap = document.getElementById('img-preview-wrap');
    if (wrap) wrap.style.display = 'none';
    var grid = document.getElementById('img-grid');
    var slot = document.getElementById('imgslot-' + key);
    if (!slot && grid) {
      slot = document.createElement('div');
      slot.className = 'img-slot';
      slot.id = 'imgslot-' + key;
      grid.appendChild(slot);
    }
    if (slot) {
      slot.innerHTML = '<img src="' + escH(data) + '" style="object-fit:contain" onclick="openLightbox(this.src)">'
        + '<div class="img-slot-key">' + escH(key) + '</div>'
        + '<button class="btn-danger" style="margin-top:4px;width:100%" onclick="deleteImage(\\'' + escH(key) + '\\')">Delete</button>';
    }
  }
}
async function deleteImage(key) {
  var r = await apiPost('/api/admin/image/delete', { key: key });
  if (r.success) { var s = document.getElementById('imgslot-' + key); if (s) s.remove(); }
  else showAlert('img-alert', false, r.message);
}

/* ── Coupons ── */
async function addCoupon() {
  var code    = (document.getElementById('c-code') || {}).value || '';
  var rewards = (document.getElementById('c-rewards') || {}).value || '';
  var expiry  = (document.getElementById('c-expiry') || {}).value || '';
  code = code.trim(); rewards = rewards.trim(); expiry = expiry.trim();
  if (!code) { showAlert('coupon-alert', false, 'Code is required'); return; }
  var r = await apiPost('/api/admin/coupon/add', { code: code, rewards: rewards, expiry: expiry || null });
  showAlert('coupon-alert', r.success, r.message);
  if (r.success) {
    document.getElementById('c-code').value = '';
    document.getElementById('c-rewards').value = '';
    document.getElementById('c-expiry').value = '';
    var div = document.createElement('div');
    div.className = 'admin-item';
    div.id = 'coupon-' + r.id;
    div.innerHTML = '<div class="admin-item-info"><strong>' + escH(code) + '</strong> — ' + escH(rewards) + ' · Active</div>'
      + '<button class="btn-danger" onclick="deleteCoupon(' + r.id + ')">Delete</button>';
    var list = document.getElementById('coupon-list');
    if (list) list.prepend(div);
  }
}
async function deleteCoupon(id) {
  var r = await apiPost('/api/admin/coupon/delete', { id: id });
  if (r.success) { var el = document.getElementById('coupon-' + id); if (el) el.remove(); }
  else showAlert('coupon-alert', false, r.message);
}

/* ── Compositions ── */
async function addComp() {
  var tier  = (document.getElementById('comp-tier') || {}).value || 'T1';
  var name  = ((document.getElementById('comp-name') || {}).value || '').trim();
  var type  = (document.getElementById('comp-type') || {}).value || 'ATK';
  var desc  = ((document.getElementById('comp-desc') || {}).value || '').trim();
  var cby   = ((document.getElementById('comp-cby') || {}).value || '').trim();
  if (!name) { showAlert('comp-alert', false, 'Name is required'); return; }
  var r = await apiPost('/api/admin/comp/add', { tier: tier, name: name, type: type, description: desc, countered_by: cby, last_updated: new Date().toISOString().slice(0,10) });
  showAlert('comp-alert', r.success, r.message);
  if (r.success) {
    document.getElementById('comp-name').value = '';
    document.getElementById('comp-desc').value = '';
    var isAtk = type === 'ATK';
    var badgeStyle = isAtk
      ? 'background:rgba(41,128,185,0.2);color:#5dade2;border:1px solid rgba(41,128,185,0.35)'
      : 'background:rgba(39,174,96,0.2);color:#2ecc71;border:1px solid rgba(39,174,96,0.35)';
    var badgeText = isAtk ? '⚔ ATK' : '🛡 DEF';
    var div = document.createElement('div');
    div.className = 'admin-item';
    div.id = 'comp-' + r.id;
    div.innerHTML = '<div class="admin-item-info"><strong>' + escH(tier) + ' — ' + escH(name) + '</strong>'
      + '<span style="display:inline-block;margin-left:0.5rem;font-size:0.72rem;padding:2px 8px;border-radius:3px;' + badgeStyle + '">' + badgeText + '</span></div>'
      + '<button class="btn-danger" onclick="deleteComp(' + r.id + ')">Delete</button>';
    var list = document.getElementById('comp-list');
    if (list) list.prepend(div);
  }
}
async function deleteComp(id) {
  var r = await apiPost('/api/admin/comp/delete', { id: id });
  if (r.success) { var el = document.getElementById('comp-' + id); if (el) el.remove(); }
  else showAlert('comp-alert', false, r.message);
}

/* ── Emotes ── */
async function addEmote() {
  var name      = ((document.getElementById('e-name') || {}).value || '').trim();
  var image_url = ((document.getElementById('e-url') || {}).value || '').trim();
  if (!name || !image_url) { showAlert('emote-alert', false, 'Name and URL required'); return; }
  var r = await apiPost('/api/admin/emote/add', { name: name, image_url: image_url });
  showAlert('emote-alert', r.success, r.message);
  if (r.success) {
    document.getElementById('e-name').value = '';
    document.getElementById('e-url').value = '';
    var div = document.createElement('div');
    div.className = 'admin-item';
    div.id = 'emote-' + r.id;
    div.innerHTML = '<div class="admin-item-info" style="display:flex;align-items:center;gap:0.75rem">'
      + '<img src="' + escH(image_url) + '" style="width:36px;height:36px;object-fit:cover;border-radius:4px" onerror="this.style.display=\\'none\\'">'
      + '<strong>' + escH(name) + '</strong></div>'
      + '<button class="btn-danger" onclick="deleteEmote(' + r.id + ')">Delete</button>';
    var list = document.getElementById('emote-list');
    if (list) list.prepend(div);
  }
}
async function deleteEmote(id) {
  var r = await apiPost('/api/admin/emote/delete', { id: id });
  if (r.success) { var el = document.getElementById('emote-' + id); if (el) el.remove(); }
  else showAlert('emote-alert', false, r.message);
}

/* ── T1 Notes ── */
async function loadNotes() {
  var charEl = document.getElementById('notes-char');
  if (!charEl) return;
  try {
    var res  = await fetch('/api/admin/t1/notes/get?char=' + encodeURIComponent(charEl.value));
    var data = await res.json();
    var textEl = document.getElementById('notes-text');
    if (textEl) textEl.value = data.notes || '';
  } catch(e) {}
}
async function saveNotes() {
  var charEl = document.getElementById('notes-char');
  var textEl = document.getElementById('notes-text');
  if (!charEl || !textEl) return;
  var r = await apiPost('/api/admin/t1/notes/save', { char: charEl.value, notes: textEl.value });
  showAlert('notes-alert', r.success, r.message);
}

/* ── T1 Unit Order ── */
async function loadOrder() {
  try {
    var res   = await fetch('/api/admin/t1/order/get');
    var data  = await res.json();
    var order = data.order || ['Rou','Seir','Lecliss','Scheherazade','Sylvia'];
    for (var i = 0; i < order.length; i++) {
      var sel = document.getElementById('order-' + (i + 1));
      if (sel) sel.value = order[i];
    }
  } catch(e) {}
}
async function saveOrder() {
  var order = [];
  for (var i = 1; i <= 5; i++) {
    var sel = document.getElementById('order-' + i);
    if (sel) order.push(sel.value);
  }
  var r = await apiPost('/api/admin/t1/order/save', { order: order });
  showAlert('order-alert', r.success, r.message);
}

/* ── Board Layout ── */
async function loadBoard() {
  try {
    var res  = await fetch('/api/admin/board/get');
    var data = await res.json();
    var b    = data.board || {};
    ['d1','d2','d3','d4','d5','d6','a1','a2','a3','a4','a5','a6'].forEach(function(k) {
      var el = document.getElementById('b' + k);
      if (el) el.value = b[k] || '';
    });
  } catch(e) {}
}
async function saveBoard() {
  var board = {};
  ['d1','d2','d3','d4','d5','d6','a1','a2','a3','a4','a5','a6'].forEach(function(k) {
    var el = document.getElementById('b' + k);
    board[k] = el ? el.value.trim() : '';
  });
  var r = await apiPost('/api/admin/board/save', { board: board });
  showAlert('board-alert', r.success, r.message);
}

/* ── Characters ── */
var _selectedCharSlug = '';
var _selectedCharName = '';
var _selectedCostumeSlug = '';

async function loadChars() {
  try {
    var res = await fetch('/api/admin/chars/list');
    var data = await res.json();
    var list = document.getElementById('char-list');
    if (!list) return;
    if (!data.chars || !data.chars.length) {
      list.innerHTML = '<p style="color:var(--text3);font-size:0.83rem">No characters yet.</p>';
      return;
    }
    list.innerHTML = data.chars.map(function(c) {
      return '<div class="admin-item" id="char-' + c.id + '" style="cursor:pointer" onclick="selectChar(' + c.id + ',\\'' + escH(c.name) + '\\',\\'' + escH(c.slug) + '\\')">'
        + '<div class="admin-item-info"><strong>' + escH(c.name) + '</strong>'
        + (c.status === 'upcoming' ? ' <span style="color:var(--gold);font-size:0.75rem">🔜</span>' : '')
        + '</div>'
        + '<button class="btn-danger" onclick="event.stopPropagation();deleteChar(' + c.id + ')">Delete</button>'
        + '</div>';
    }).join('');
  } catch(e) {}
}
async function addChar() {
  var name   = ((document.getElementById('new-char-name') || {}).value || '').trim();
  var slug   = ((document.getElementById('new-char-slug') || {}).value || '').trim();
  var status = (document.getElementById('new-char-status') || {}).value || 'active';
  if (!name || !slug) { showAlert('char-alert', false, 'Name and slug required'); return; }
  var r = await apiPost('/api/admin/chars/add', { name: name, slug: slug, status: status });
  showAlert('char-alert', r.success, r.message);
  if (r.success) {
    document.getElementById('new-char-name').value = '';
    document.getElementById('new-char-slug').value = '';
    loadChars();
  }
}
async function deleteChar(id) {
  var r = await apiPost('/api/admin/chars/delete', { id: id });
  if (r.success) { var el = document.getElementById('char-' + id); if (el) el.remove(); }
  else showAlert('char-alert', false, r.message);
}
async function selectChar(id, name, slug) {
  _selectedCharSlug = slug;
  _selectedCharName = name;
  var detail = document.getElementById('char-detail');
  var nameEl = document.getElementById('detail-char-name');
  if (detail) detail.style.display = 'block';
  if (nameEl) nameEl.textContent = name;
  var sec = document.getElementById('skills-section');
  if (sec) sec.style.display = 'none';
  loadCostumes(slug);
}
async function loadCostumes(charSlug) {
  try {
    var res = await fetch('/api/admin/costumes/list?char_slug=' + encodeURIComponent(charSlug));
    var data = await res.json();
    var list = document.getElementById('costume-list');
    if (!list) return;
    if (!data.costumes || !data.costumes.length) {
      list.innerHTML = '<p style="color:var(--text3);font-size:0.83rem">No costumes yet.</p>';
      return;
    }
    list.innerHTML = data.costumes.map(function(c) {
      return '<div class="admin-item" id="costume-' + c.id + '">'
        + '<div class="admin-item-info" style="cursor:pointer" onclick="selectCostume(' + c.id + ',\\'' + escH(c.costume_name) + '\\',\\'' + escH(c.costume_slug) + '\\')">'
        + '<strong>' + escH(c.costume_name) + '</strong>'
        + (c.bond_stats ? '<span style="font-size:0.75rem;color:var(--text3);display:block">' + escH(c.bond_stats.substring(0,60)) + '</span>' : '')
        + '</div>'
        + '<button class="btn-danger" onclick="deleteCostume(' + c.id + ')">Delete</button>'
        + '</div>';
    }).join('');
  } catch(e) {}
}
async function addCostume() {
  var name  = ((document.getElementById('cost-name') || {}).value || '').trim();
  var slug  = ((document.getElementById('cost-slug') || {}).value || '').trim();
  var stats = ((document.getElementById('cost-stats') || {}).value || '').trim();
  if (!name || !slug) { showAlert('cost-alert', false, 'Name and slug required'); return; }
  var r = await apiPost('/api/admin/costumes/add', { char_slug: _selectedCharSlug, costume_name: name, costume_slug: slug, bond_stats: stats });
  showAlert('cost-alert', r.success, r.message);
  if (r.success) {
    document.getElementById('cost-name').value = '';
    document.getElementById('cost-slug').value = '';
    loadCostumes(_selectedCharSlug);
  }
}
async function deleteCostume(id) {
  var r = await apiPost('/api/admin/costumes/delete', { id: id });
  if (r.success) { var el = document.getElementById('costume-' + id); if (el) el.remove(); }
  else showAlert('cost-alert', false, r.message);
}
function selectCostume(id, name, slug) {
  _selectedCostumeSlug = slug;
  var sec = document.getElementById('skills-section');
  var lbl = document.getElementById('skills-costume-label');
  if (sec) sec.style.display = 'block';
  if (lbl) lbl.textContent = name;
  loadSkills(slug);
}
async function loadSkills(costumeSlug) {
  try {
    var res = await fetch('/api/admin/skills/list?costume_slug=' + encodeURIComponent(costumeSlug));
    var data = await res.json();
    var list = document.getElementById('skill-list');
    if (!list) return;
    if (!data.skills || !data.skills.length) {
      list.innerHTML = '<p style="color:var(--text3);font-size:0.83rem">No skills yet.</p>';
      return;
    }
    list.innerHTML = data.skills.map(function(s) {
      return '<div class="admin-item" id="skill-' + s.id + '">'
        + '<div class="admin-item-info">'
        + '<strong>' + escH(s.skill_name) + '</strong> · SP ' + s.sp_cost + ' · CD ' + s.cooldown + ' · ' + escH(s.tile_type)
        + (s.description ? '<span style="font-size:0.72rem;color:var(--text3);display:block">' + escH(s.description.substring(0,80)) + '</span>' : '')
        + '</div>'
        + '<button class="btn-danger" onclick="deleteSkill(' + s.id + ')">Delete</button>'
        + '</div>';
    }).join('');
  } catch(e) {}
}
async function addSkill() {
  var name = ((document.getElementById('skill-name') || {}).value || '').trim();
  var tile = (document.getElementById('skill-tile') || {}).value || 'FRONT';
  var sp   = (document.getElementById('skill-sp') || {}).value || '3';
  var cd   = (document.getElementById('skill-cd') || {}).value || '5';
  var desc = ((document.getElementById('skill-desc') || {}).value || '').trim();
  if (!name) { showAlert('skill-alert', false, 'Skill name required'); return; }
  var r = await apiPost('/api/admin/skills/add', { char_slug: _selectedCharSlug, costume_slug: _selectedCostumeSlug, skill_name: name, sp_cost: +sp, cooldown: +cd, tile_type: tile, description: desc });
  showAlert('skill-alert', r.success, r.message);
  if (r.success) {
    document.getElementById('skill-name').value = '';
    document.getElementById('skill-desc').value = '';
    loadSkills(_selectedCostumeSlug);
  }
}
async function deleteSkill(id) {
  var r = await apiPost('/api/admin/skills/delete', { id: id });
  if (r.success) { var el = document.getElementById('skill-' + id); if (el) el.remove(); }
  else showAlert('skill-alert', false, r.message);
}

/* ── Init ── */
updateComputedKey();
</script>
`);
}

function renderLogin(error = '') {
  return layout('Admin', `
<div class="admin-login">
  <h2>Admin Access</h2>
  ${error ? `<div class="alert alert-error">${esc(error)}</div>` : ''}
  <form method="POST" action="/admin/login">
    <div class="form-group">
      <label>Password</label>
      <input type="password" name="password" autofocus>
    </div>
    <button type="submit" class="btn">Login</button>
  </form>
</div>
`);
}
