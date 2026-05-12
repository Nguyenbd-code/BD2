import { layout, escHtml } from '../layout/layout.js';
import { T1_DATA, T1_IMAGE_KEYS } from '../data/t1.js';

const ADMIN_PASSWORD = 'Anime0404!';

function isAuthed(request) {
  const cookie = request.headers.get('Cookie') || '';
  return cookie.split(';').some(c => c.trim() === 'admin=true');
}

export async function handleAdminPost(request, env) {
  const form = await request.formData();
  const pw = form.get('password');
  if (pw === ADMIN_PASSWORD) {
    return new Response('', {
      status: 302,
      headers: {
        Location: '/admin',
        'Set-Cookie': 'admin=true; Path=/; HttpOnly; SameSite=Strict',
      },
    });
  }
  return renderLogin('Incorrect password.');
}

export async function handleAdmin(request, env) {
  if (!isAuthed(request)) return renderLogin();

  // Preload data for initial render
  let coupons = [], emotes = [], compositions = [], imageKeys = [];
  try {
    ({ results: coupons } = await env.DB.prepare(
      'SELECT id, code, rewards, expiry FROM coupons ORDER BY id DESC'
    ).all());
  } catch { /* empty */ }
  try {
    ({ results: emotes } = await env.DB.prepare(
      'SELECT id, name, url FROM emotes ORDER BY id DESC'
    ).all());
  } catch { /* empty */ }
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, tier, name, type, counters, countered_by FROM compositions ORDER BY tier, id'
    ).all();
    compositions = results;
  } catch { /* empty */ }
  try {
    const { results } = await env.DB.prepare(
      "SELECT key FROM images WHERE key NOT LIKE 'notes_%' AND key != 'unit_order' ORDER BY key"
    ).all();
    imageKeys = results.map(r => r.key);
  } catch { /* empty */ }

  // Per-character notes
  const charNotesMap = {};
  for (const char of T1_DATA.characters) {
    try {
      const key = `notes_${char.name.toLowerCase()}`;
      const row = await env.DB.prepare('SELECT data FROM images WHERE key = ?').bind(key).first();
      charNotesMap[char.name] = row?.data || '';
    } catch { charNotesMap[char.name] = ''; }
  }

  // Unit order
  let unitOrder = T1_DATA.characters.map(c => c.name);
  try {
    const row = await env.DB.prepare('SELECT data FROM images WHERE key = ?').bind('unit_order').first();
    if (row) {
      const p = JSON.parse(row.data);
      if (Array.isArray(p) && p.length) unitOrder = p;
    }
  } catch { /* ignore */ }

  const content = buildAdminPanel(coupons, emotes, compositions, imageKeys, charNotesMap, unitOrder);
  return layout('Admin', content);
}

function renderLogin(error = '') {
  const errHtml = error ? `<div class="status-msg err" style="margin-bottom:1rem">${escHtml(error)}</div>` : '';
  const content = `
<div class="login-page">
  <h2>Admin Login</h2>
  ${errHtml}
  <form method="POST" action="/admin">
    <input type="password" name="password" placeholder="Password" autofocus>
    <button type="submit" class="btn btn-primary">Login</button>
  </form>
</div>`;
  return layout('Admin Login', content);
}

function buildAdminPanel(coupons, emotes, compositions, imageKeys, charNotes, unitOrder) {
  const couponRows = coupons.map(c => `
<div class="admin-item" id="coupon-${c.id}">
  <div class="admin-item-info">
    <div class="admin-item-label">${escHtml(c.code)}</div>
    <div class="admin-item-sub">${escHtml(c.rewards || '')}${c.expiry ? ` · Expires: ${escHtml(c.expiry)}` : ''}</div>
  </div>
  <button class="btn btn-danger btn-sm" onclick="deleteCoupon(${c.id})">Delete</button>
</div>`).join('') || '<p style="color:var(--text3);font-size:0.83rem">No coupons.</p>';

  const emoteRows = emotes.map(e => `
<div class="admin-item" id="emote-${e.id}">
  <div class="admin-item-info" style="display:flex;align-items:center;gap:0.75rem">
    <img src="${escHtml(e.url)}" style="width:40px;height:40px;object-fit:cover;border-radius:4px" onerror="this.style.display='none'">
    <div>
      <div class="admin-item-label">${escHtml(e.name)}</div>
      <div class="admin-item-sub" style="word-break:break-all">${escHtml(e.url)}</div>
    </div>
  </div>
  <button class="btn btn-danger btn-sm" onclick="deleteEmote(${e.id})">Delete</button>
</div>`).join('') || '<p style="color:var(--text3);font-size:0.83rem">No emotes.</p>';

  const compRows = compositions.map(c => `
<div class="admin-item" id="comp-${c.id}">
  <div class="admin-item-info">
    <div class="admin-item-label"><span class="tier-badge ${(c.tier||'').toLowerCase()}">${escHtml(c.tier)}</span> ${escHtml(c.name)}</div>
    <div class="admin-item-sub">${escHtml(c.type||'')}${c.counters ? ` · Beats: ${escHtml(c.counters)}` : ''}${c.countered_by ? ` · Loses to: ${escHtml(c.countered_by)}` : ''}</div>
  </div>
  <button class="btn btn-danger btn-sm" onclick="deleteComp(${c.id})">Delete</button>
</div>`).join('') || '<p style="color:var(--text3);font-size:0.83rem">No custom compositions.</p>';

  // Image grid — show all defined slots
  const imageSlots = T1_IMAGE_KEYS.map(k => {
    const has = imageKeys.includes(k);
    const imgHtml = has
      ? `<img src="/img/${escHtml(k)}" alt="${escHtml(k)}" onerror="this.src=''">`
      : `<div class="image-slot-empty">empty</div>`;
    return `
<div class="image-slot" id="imgslot-${escHtml(k)}">
  ${imgHtml}
  <div class="image-slot-key">${escHtml(k)}</div>
  ${has ? `<button class="btn btn-danger btn-sm" onclick="deleteImg('${escHtml(k)}')">×</button>` : ''}
</div>`;
  }).join('');

  // T1 character notes editors
  const notesEditors = T1_DATA.characters.map(char => `
<div class="admin-section">
  <h3>${escHtml(char.name)} — Build Notes</h3>
  <textarea id="notes-${escHtml(char.name.toLowerCase())}" rows="4"
    style="width:100%;background:var(--bg3);border:1px solid var(--border);color:var(--text);
           padding:0.6rem;border-radius:5px;font-family:'Nunito',sans-serif;font-size:0.83rem;resize:vertical"
    placeholder="One note per line">${escHtml(charNotes[char.name] || '')}</textarea>
  <div style="margin-top:0.4rem">
    <button class="btn btn-primary btn-sm" onclick="saveNotes('${escHtml(char.name)}')">Save Notes</button>
    <span id="notes-status-${escHtml(char.name.toLowerCase())}" class="status-msg" style="margin-left:0.5rem"></span>
  </div>
</div>`).join('');

  // Unit order editor
  const unitOrderHtml = `
<div class="admin-section">
  <h3>Unit Order (positions 1–5)</h3>
  <div style="font-size:0.8rem;color:var(--text3);margin-bottom:0.5rem">Comma-separated character names in display order</div>
  <input id="unit-order-input" type="text" value="${escHtml(unitOrder.join(','))}"
    style="width:100%;background:var(--bg3);border:1px solid var(--border);color:var(--text);
           padding:0.6rem;border-radius:5px;font-family:'Nunito',sans-serif;font-size:0.85rem">
  <div style="margin-top:0.4rem">
    <button class="btn btn-primary btn-sm" onclick="saveUnitOrder()">Save Order</button>
    <span id="unit-order-status" class="status-msg" style="margin-left:0.5rem"></span>
  </div>
</div>`;

  // Tile pattern overview
  const tileOverview = T1_DATA.characters.map(char => {
    const slots = Array.from({ length: 5 }, (_, i) => {
      const k = `${char.tilePrefix}_${i + 1}`;
      const has = imageKeys.includes(k);
      return `<span style="display:inline-block;width:20px;height:20px;border-radius:3px;
                font-size:0.6rem;text-align:center;line-height:20px;
                background:${has ? 'var(--gold)' : 'var(--bg4)'};
                color:${has ? '#1a1a10' : 'var(--text3)'};
                border:1px solid var(--border)">${i + 1}</span>`;
    }).join(' ');
    return `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem">
      <span style="font-size:0.8rem;font-family:'Cinzel',serif;width:110px;color:var(--text2)">${escHtml(char.name)}</span>
      ${slots}
    </div>`;
  }).join('');

  return `
<div class="admin-layout">
  <h1 class="admin-title">Admin Panel</h1>
  <div style="margin-bottom:0.5rem">
    <a href="/" style="font-size:0.8rem;color:var(--text3)">← Back to site</a>
    <span style="margin-left:1rem;font-size:0.8rem">
      <a href="/admin?logout=1" style="color:var(--text3)" onclick="document.cookie='admin=;Path=/;Max-Age=0';location.href='/admin';return false">Logout</a>
    </span>
  </div>

  <div class="tab-bar">
    <button class="tab-btn active" onclick="switchTab('coupons',this)">Coupons</button>
    <button class="tab-btn" onclick="switchTab('compositions',this)">Compositions</button>
    <button class="tab-btn" onclick="switchTab('emotes',this)">Emotes</button>
    <button class="tab-btn" onclick="switchTab('images',this)">📷 Images</button>
    <button class="tab-btn" onclick="switchTab('t1content',this)">⚙ T1 Content</button>
  </div>

  <!-- Coupons Tab -->
  <div class="tab-pane active" id="tab-coupons">
    <div class="admin-section">
      <h3>Add Coupon</h3>
      <div class="admin-form">
        <label>Code<input type="text" id="c-code" placeholder="BDCODE2024"></label>
        <label>Rewards<input type="text" id="c-rewards" placeholder="100 gems, 10 tickets"></label>
        <label>Expiry (optional)<input type="text" id="c-expiry" placeholder="2024-12-31"></label>
        <button class="btn btn-primary" onclick="addCoupon()">Add Coupon</button>
        <span id="coupon-add-status" class="status-msg"></span>
      </div>
    </div>
    <div class="admin-section">
      <h3>Active Coupons</h3>
      <div class="admin-list" id="coupon-list">${couponRows}</div>
    </div>
  </div>

  <!-- Compositions Tab -->
  <div class="tab-pane" id="tab-compositions">
    <div class="admin-section">
      <h3>Add Composition</h3>
      <div class="admin-form">
        <label>Tier
          <select id="comp-tier">
            <option>T2</option><option>T3</option><option>T4</option><option>T5</option><option>T6</option>
          </select>
        </label>
        <label>Name<input type="text" id="comp-name" placeholder="My Team"></label>
        <label>Type
          <select id="comp-type"><option>ATK</option><option>DEF</option></select>
        </label>
        <label>Counters<input type="text" id="comp-counters" placeholder="Team A, Team B"></label>
        <label>Countered By<input type="text" id="comp-cby" placeholder="Team C"></label>
      </div>
      <div style="font-size:0.78rem;color:var(--text3);margin-bottom:0.4rem">
        Characters (JSON array of {name,costume,stats} objects):
      </div>
      <textarea id="comp-chars" rows="3"
        style="width:100%;background:var(--bg3);border:1px solid var(--border);color:var(--text);
               padding:0.6rem;border-radius:5px;font-size:0.8rem;font-family:monospace;resize:vertical"
        placeholder='[{"name":"Rou","costume":"Red Riding Hood","stats":"HP +62%"}]'></textarea>
      <div style="font-size:0.78rem;color:var(--text3);margin:0.4rem 0">Build notes (JSON array of strings):</div>
      <textarea id="comp-notes" rows="3"
        style="width:100%;background:var(--bg3);border:1px solid var(--border);color:var(--text);
               padding:0.6rem;border-radius:5px;font-size:0.8rem;font-family:monospace;resize:vertical"
        placeholder='["Note 1","Note 2"]'></textarea>
      <div style="margin-top:0.5rem">
        <button class="btn btn-primary" onclick="addComp()">Add Composition</button>
        <span id="comp-add-status" class="status-msg" style="margin-left:0.5rem"></span>
      </div>
    </div>
    <div class="admin-section">
      <h3>Custom Compositions</h3>
      <div class="admin-list" id="comp-list">${compRows}</div>
    </div>
  </div>

  <!-- Emotes Tab -->
  <div class="tab-pane" id="tab-emotes">
    <div class="admin-section">
      <h3>Add Emote</h3>
      <div class="admin-form">
        <label>Name<input type="text" id="e-name" placeholder="Happy Sylvia"></label>
        <label>Image URL<input type="text" id="e-url" placeholder="https://..."></label>
        <button class="btn btn-primary" onclick="addEmote()">Add Emote</button>
        <span id="emote-add-status" class="status-msg"></span>
      </div>
    </div>
    <div class="admin-section">
      <h3>Emotes</h3>
      <div class="admin-list" id="emote-list">${emoteRows}</div>
    </div>
  </div>

  <!-- Images Tab -->
  <div class="tab-pane" id="tab-images">
    <div class="admin-section">
      <h3>Upload Image</h3>
      <div style="font-size:0.8rem;color:var(--text3);margin-bottom:0.75rem">
        Images are auto-compressed to max 340px wide JPEG before upload.
      </div>
      <div class="admin-form">
        <label>Slot Key
          <select id="img-key">
            ${T1_IMAGE_KEYS.map(k => `<option value="${escHtml(k)}">${escHtml(k)}</option>`).join('')}
          </select>
        </label>
        <label>Image File
          <input type="file" id="img-file" accept="image/*" style="cursor:pointer">
        </label>
        <button class="btn btn-primary" onclick="uploadImage()">Upload</button>
        <span id="img-upload-status" class="status-msg"></span>
      </div>
      <canvas id="compress-canvas" style="display:none"></canvas>
    </div>
    <div class="admin-section">
      <h3>Image Slots</h3>
      <div class="image-grid" id="image-grid">${imageSlots}</div>
    </div>
  </div>

  <!-- T1 Content Tab -->
  <div class="tab-pane" id="tab-t1content">
    <div class="admin-section">
      <h3>Tile Pattern Status</h3>
      <div>${tileOverview}</div>
    </div>
    ${unitOrderHtml}
    ${notesEditors}
  </div>
</div>

<script>
/* ── Tab switching ── */
function switchTab(name, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
}

/* ── Helpers ── */
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function setStatus(id, ok, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'status-msg ' + (ok ? 'ok' : 'err');
  setTimeout(() => { el.textContent = ''; el.className = 'status-msg'; }, 3000);
}
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch('/api/admin/' + path, opts);
  return res.json();
}

/* ── Coupons ── */
async function addCoupon() {
  const code = document.getElementById('c-code').value.trim();
  const rewards = document.getElementById('c-rewards').value.trim();
  const expiry = document.getElementById('c-expiry').value.trim();
  if (!code) return setStatus('coupon-add-status', false, 'Code required');
  const r = await api('POST', 'coupons', { code, rewards, expiry: expiry || null });
  if (r.ok) {
    setStatus('coupon-add-status', true, 'Added!');
    document.getElementById('c-code').value = '';
    document.getElementById('c-rewards').value = '';
    document.getElementById('c-expiry').value = '';
    const list = document.getElementById('coupon-list');
    const div = document.createElement('div');
    div.className = 'admin-item';
    div.id = 'coupon-' + r.id;
    div.innerHTML = '<div class="admin-item-info"><div class="admin-item-label">' + escHtml(code) + '</div>' +
      (rewards ? '<div class="admin-item-sub">' + escHtml(rewards) + '</div>' : '') + '</div>' +
      '<button class="btn btn-danger btn-sm" onclick="deleteCoupon(' + r.id + ')">Delete</button>';
    list.prepend(div);
  } else {
    setStatus('coupon-add-status', false, r.error || 'Error');
  }
}
async function deleteCoupon(id) {
  const r = await api('DELETE', 'coupons/' + id);
  if (r.ok) document.getElementById('coupon-' + id)?.remove();
}

/* ── Compositions ── */
async function addComp() {
  const tier = document.getElementById('comp-tier').value;
  const name = document.getElementById('comp-name').value.trim();
  const type = document.getElementById('comp-type').value;
  const counters = document.getElementById('comp-counters').value.trim();
  const counteredBy = document.getElementById('comp-cby').value.trim();
  let characters = [], notes = [];
  try { characters = JSON.parse(document.getElementById('comp-chars').value || '[]'); } catch { return setStatus('comp-add-status', false, 'Invalid characters JSON'); }
  try { notes = JSON.parse(document.getElementById('comp-notes').value || '[]'); } catch { return setStatus('comp-add-status', false, 'Invalid notes JSON'); }
  if (!name) return setStatus('comp-add-status', false, 'Name required');
  const r = await api('POST', 'compositions', { tier, name, type, counters, counteredBy, characters, notes });
  if (r.ok) {
    setStatus('comp-add-status', true, 'Added!');
    document.getElementById('comp-name').value = '';
    const list = document.getElementById('comp-list');
    const div = document.createElement('div');
    div.className = 'admin-item';
    div.id = 'comp-' + r.id;
    div.innerHTML = '<div class="admin-item-info"><div class="admin-item-label"><span class="tier-badge ' + tier.toLowerCase() + '">' + tier + '</span> ' + escHtml(name) + '</div><div class="admin-item-sub">' + escHtml(type) + '</div></div>' +
      '<button class="btn btn-danger btn-sm" onclick="deleteComp(' + r.id + ')">Delete</button>';
    list.prepend(div);
  } else {
    setStatus('comp-add-status', false, r.error || 'Error');
  }
}
async function deleteComp(id) {
  const r = await api('DELETE', 'compositions/' + id);
  if (r.ok) document.getElementById('comp-' + id)?.remove();
}

/* ── Emotes ── */
async function addEmote() {
  const name = document.getElementById('e-name').value.trim();
  const url = document.getElementById('e-url').value.trim();
  if (!name || !url) return setStatus('emote-add-status', false, 'Name and URL required');
  const r = await api('POST', 'emotes', { name, url });
  if (r.ok) {
    setStatus('emote-add-status', true, 'Added!');
    document.getElementById('e-name').value = '';
    document.getElementById('e-url').value = '';
    const list = document.getElementById('emote-list');
    const div = document.createElement('div');
    div.className = 'admin-item';
    div.id = 'emote-' + r.id;
    div.innerHTML = '<div class="admin-item-info" style="display:flex;align-items:center;gap:0.75rem">' +
      '<img src="' + escHtml(url) + '" style="width:40px;height:40px;object-fit:cover;border-radius:4px" onerror="this.style.display=\'none\'">' +
      '<div><div class="admin-item-label">' + escHtml(name) + '</div></div></div>' +
      '<button class="btn btn-danger btn-sm" onclick="deleteEmote(' + r.id + ')">Delete</button>';
    list.prepend(div);
  } else {
    setStatus('emote-add-status', false, r.error || 'Error');
  }
}
async function deleteEmote(id) {
  const r = await api('DELETE', 'emotes/' + id);
  if (r.ok) document.getElementById('emote-' + id)?.remove();
}

/* ── Images ── */
async function uploadImage() {
  const key = document.getElementById('img-key').value;
  const fileEl = document.getElementById('img-file');
  const file = fileEl.files[0];
  if (!file) return setStatus('img-upload-status', false, 'Select a file');
  setStatus('img-upload-status', true, 'Compressing…');

  const dataUrl = await compressImage(file, 340, 0.85);
  const r = await api('POST', 'images', { key, data: dataUrl });
  if (r.ok) {
    setStatus('img-upload-status', true, 'Uploaded!');
    fileEl.value = '';
    refreshImageSlot(key, dataUrl);
  } else {
    setStatus('img-upload-status', false, r.error || 'Error');
  }
}

function compressImage(file, maxWidth, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.getElementById('compress-canvas');
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = Math.round(img.width * scale);
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

function refreshImageSlot(key, dataUrl) {
  const slot = document.getElementById('imgslot-' + key);
  if (!slot) return;
  slot.innerHTML =
    '<img src="' + escHtml(dataUrl) + '" alt="' + escHtml(key) + '">' +
    '<div class="image-slot-key">' + escHtml(key) + '</div>' +
    '<button class="btn btn-danger btn-sm" onclick="deleteImg(\'' + escHtml(key) + '\')">×</button>';
}

async function deleteImg(key) {
  const r = await api('DELETE', 'images/' + key);
  if (r.ok) {
    const slot = document.getElementById('imgslot-' + key);
    if (slot) {
      slot.innerHTML = '<div class="image-slot-empty">empty</div><div class="image-slot-key">' + escHtml(key) + '</div>';
    }
  }
}

/* ── Notes ── */
async function saveNotes(charName) {
  const key = charName.toLowerCase();
  const notes = document.getElementById('notes-' + key).value;
  const r = await api('POST', 'notes/' + key, { notes });
  setStatus('notes-status-' + key, r.ok, r.ok ? 'Saved!' : (r.error || 'Error'));
}

/* ── Unit Order ── */
async function saveUnitOrder() {
  const val = document.getElementById('unit-order-input').value;
  const order = val.split(',').map(s => s.trim()).filter(Boolean);
  const r = await api('POST', 'unit-order', { order });
  setStatus('unit-order-status', r.ok, r.ok ? 'Saved!' : (r.error || 'Error'));
}
</script>`;
}
