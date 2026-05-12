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

  let coupons = [], emotes = [], comps = [], images = [];
  try {
    const [cr, er, compr, imgr] = await Promise.all([
      env.DB.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all(),
      env.DB.prepare('SELECT * FROM emotes ORDER BY created_at DESC').all(),
      env.DB.prepare('SELECT * FROM compositions ORDER BY tier ASC').all(),
      env.DB.prepare("SELECT key FROM images WHERE key NOT LIKE 'notes_%' AND key != 'unit_order' ORDER BY key").all(),
    ]);
    coupons = cr.results || [];
    emotes  = er.results || [];
    comps   = compr.results || [];
    images  = imgr.results || [];
  } catch(e) {}

  const existingKeys = new Set(images.map(i => i.key));

  const imgKeys = ['board_pos','rou_gear','seir_gear','lecliss_gear','schera_gear','sylvia_gear','icon_msp','icon_lw','icon_cns','icon_pp'];
  const imgLabels = {
    board_pos:'Board Positioning', rou_gear:'Rou Gear', seir_gear:'Seir Gear',
    lecliss_gear:'Lecliss Gear', schera_gear:'Scheherazade Gear', sylvia_gear:'Sylvia Gear',
    icon_msp:'Schera: Magic Professor', icon_lw:'Schera: Lapis Witch',
    icon_cns:'Schera: Code Name S', icon_pp:'Schera: Purple Prince',
  };

  const skillSlots = [
    { char:'Rou',          slots:['Snack Time','Half Moon Kick','Hide & Seek 1','Terra Burst','Hide & Seek 2'] },
    { char:'Seir',         slots:['Protective Instinct 1','He is Bullying Me 1','Protective Instinct 2','He is Bullying Me 2','Protective Instinct 3'] },
    { char:'Lecliss',      slots:['Curse Replica 1','Auto Defense Mode 1','Curse Replica 2','Auto Defense Mode 2','Curse Replica 3'] },
    { char:'Scheherazade', slots:['Sapphire Boomerang 1','Aqua Break 1','Aqua Silence','Sapphire Boomerang 2','Aqua Break 2'] },
    { char:'Sylvia',       slots:['CBFS 1','Bikini Blaster 1','The Punisher','CBFS 2','Bikini Blaster 2'] },
  ];

  const tileOptHtml = skillSlots.map(({char, slots}) =>
    slots.map((name, i) => {
      const k = `tile_${char.toLowerCase()}_${i+1}`;
      return `<option value="${esc(k)}">${esc(char)} — ${esc(name)}${existingKeys.has(k) ? ' ✓' : ''}</option>`;
    }).join('')
  ).join('');

  const tileStatusHtml = skillSlots.map(({char, slots}) => `
<div style="margin-bottom:0.75rem">
  <div style="font-family:'Cinzel',serif;font-size:0.8rem;color:var(--gold);margin-bottom:0.4rem">${esc(char)}</div>
  ${slots.map((name, i) => {
    const k = `tile_${char.toLowerCase()}_${i+1}`;
    const has = existingKeys.has(k);
    return `<span style="display:inline-block;margin:2px 4px 2px 0;font-size:0.72rem;padding:2px 8px;border-radius:3px;background:${has ? 'rgba(39,174,96,0.15)' : 'var(--bg4)'};border:1px solid ${has ? 'rgba(39,174,96,0.3)' : 'var(--border2)'};color:${has ? '#2ecc71' : 'var(--text3)'}">Slot ${i+1}: ${esc(name)} ${has ? '✓' : '✗'}</span>`;
  }).join('')}
</div>`).join('');

  const imgGridHtml = images.length ? `
<div class="img-grid" id="img-grid">
  ${images.map(img => `
  <div class="img-slot" id="imgslot-${esc(img.key)}">
    <img src="/img/${esc(img.key)}" alt="${esc(img.key)}" onerror="this.style.display='none'">
    <div class="img-slot-key">${esc(img.key)}</div>
    <button class="btn-danger" style="margin-top:4px;width:100%" onclick="deleteImage('${esc(img.key)}')">Delete</button>
  </div>`).join('')}
</div>` : '<div id="img-grid"><p style="color:var(--text3);font-size:0.83rem">No images uploaded yet.</p></div>';

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
  </div>

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
    <div class="admin-list" id="coupon-list">
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

  <div class="admin-section" id="tab-comps">
    <div class="admin-form">
      <h3>Add Composition</h3>
      <div id="comp-alert"></div>
      <div class="form-row">
        <div class="form-group"><label>Tier</label>
          <select id="comp-tier"><option>T1</option><option>T2</option><option>T3</option><option>T4</option><option>T5</option><option>T6</option></select>
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
    <div class="admin-list" id="comp-list">
      ${comps.map(c => `
      <div class="admin-item" id="comp-${c.id}">
        <div class="admin-item-info">
          <strong>${esc(c.tier)} — ${esc(c.name)}</strong> · ${esc(c.type || '')}
        </div>
        <button class="btn-danger" onclick="deleteComp(${c.id})">Delete</button>
      </div>`).join('') || '<p style="color:var(--text3);font-size:0.83rem">No custom compositions yet.</p>'}
    </div>
  </div>

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
    <div class="admin-list" id="emote-list">
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

  <div class="admin-section" id="tab-images">
    <div class="admin-form">
      <h3>Upload Image</h3>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1rem">Select a slot, pick a file. Auto-compressed to 340px JPEG. ✓ = already uploaded.</p>
      <div id="img-alert"></div>
      <div class="form-row">
        <div class="form-group">
          <label>Image Slot</label>
          <select id="img-key">
            <optgroup label="T1 Gear &amp; Icons">
              ${imgKeys.map(k => `<option value="${esc(k)}">${esc(imgLabels[k] || k)}${existingKeys.has(k) ? ' ✓' : ''}</option>`).join('')}
            </optgroup>
            <optgroup label="Skill Tile Patterns">${tileOptHtml}</optgroup>
            <option value="__custom__">— Custom key...</option>
          </select>
        </div>
        <div class="form-group">
          <label>Image File</label>
          <input type="file" id="img-file" accept="image/*" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:10px 14px;border-radius:5px;width:100%">
        </div>
      </div>
      <div class="form-group" id="custom-key-group" style="display:none">
        <label>Custom Key</label>
        <input type="text" id="img-custom-key" placeholder="my_image_key">
      </div>
      <canvas id="compress-canvas" style="display:none"></canvas>
      <button class="btn" style="width:auto;padding:10px 24px" onclick="uploadImage()">Upload Image</button>
    </div>
    <div class="admin-form">
      <h3>Uploaded Images (${images.length})</h3>
      ${imgGridHtml}
    </div>
  </div>

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
  </div>
</div>

<script>
/* ── Tab switching ── */
function showTab(name) {
  console.log('showTab:', name);
  var sections = document.querySelectorAll('.admin-section');
  var buttons  = document.querySelectorAll('.tab-btn');
  for (var i = 0; i < sections.length; i++) sections[i].classList.remove('active');
  for (var i = 0; i < buttons.length;  i++)  buttons[i].classList.remove('active');
  var target = document.getElementById('tab-' + name);
  if (target) {
    target.classList.add('active');
  } else {
    console.warn('showTab: no element with id=tab-' + name);
  }
  var activeBtn = document.querySelector('[data-tab="' + name + '"]');
  if (activeBtn) activeBtn.classList.add('active');
  if (name === 't1') { loadNotes(); loadOrder(); }
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

/* ── img-key select ── */
document.getElementById('img-key').addEventListener('change', function() {
  var g = document.getElementById('custom-key-group');
  if (g) g.style.display = this.value === '__custom__' ? 'block' : 'none';
});

/* ── Coupons ── */
async function addCoupon() {
  var code    = document.getElementById('c-code').value.trim();
  var rewards = document.getElementById('c-rewards').value.trim();
  var expiry  = document.getElementById('c-expiry').value.trim();
  if (!code) { showAlert('coupon-alert', false, 'Code is required'); return; }
  var r = await apiPost('/api/admin/coupon/add', { code, rewards, expiry: expiry || null });
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
    document.getElementById('coupon-list').prepend(div);
  }
}
async function deleteCoupon(id) {
  var r = await apiPost('/api/admin/coupon/delete', { id });
  if (r.success) { var el = document.getElementById('coupon-' + id); if (el) el.remove(); }
  else showAlert('coupon-alert', false, r.message);
}

/* ── Compositions ── */
async function addComp() {
  var tier  = document.getElementById('comp-tier').value;
  var name  = document.getElementById('comp-name').value.trim();
  var type  = document.getElementById('comp-type').value;
  var desc  = document.getElementById('comp-desc').value.trim();
  var cby   = document.getElementById('comp-cby').value.trim();
  if (!name) { showAlert('comp-alert', false, 'Name is required'); return; }
  var r = await apiPost('/api/admin/comp/add', { tier, name, type, description: desc, countered_by: cby, last_updated: new Date().toISOString().slice(0,10) });
  showAlert('comp-alert', r.success, r.message);
  if (r.success) {
    document.getElementById('comp-name').value = '';
    document.getElementById('comp-desc').value = '';
    var div = document.createElement('div');
    div.className = 'admin-item';
    div.id = 'comp-' + r.id;
    div.innerHTML = '<div class="admin-item-info"><strong>' + escH(tier) + ' — ' + escH(name) + '</strong> · ' + escH(type) + '</div>'
      + '<button class="btn-danger" onclick="deleteComp(' + r.id + ')">Delete</button>';
    document.getElementById('comp-list').prepend(div);
  }
}
async function deleteComp(id) {
  var r = await apiPost('/api/admin/comp/delete', { id });
  if (r.success) { var el = document.getElementById('comp-' + id); if (el) el.remove(); }
  else showAlert('comp-alert', false, r.message);
}

/* ── Emotes ── */
async function addEmote() {
  var name      = document.getElementById('e-name').value.trim();
  var image_url = document.getElementById('e-url').value.trim();
  if (!name || !image_url) { showAlert('emote-alert', false, 'Name and URL required'); return; }
  var r = await apiPost('/api/admin/emote/add', { name, image_url });
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
    document.getElementById('emote-list').prepend(div);
  }
}
async function deleteEmote(id) {
  var r = await apiPost('/api/admin/emote/delete', { id });
  if (r.success) { var el = document.getElementById('emote-' + id); if (el) el.remove(); }
  else showAlert('emote-alert', false, r.message);
}

/* ── Images ── */
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
  var keyEl   = document.getElementById('img-key');
  var fileEl  = document.getElementById('img-file');
  var customEl = document.getElementById('img-custom-key');
  var key  = keyEl.value === '__custom__' ? (customEl ? customEl.value.trim() : '') : keyEl.value;
  var file = fileEl.files[0];
  if (!key)  { showAlert('img-alert', false, 'Select or enter a key'); return; }
  if (!file) { showAlert('img-alert', false, 'Select an image file'); return; }
  showAlert('img-alert', true, 'Compressing…');
  var data = await compressImage(file, 340, 0.85);
  var r = await apiPost('/api/admin/image/upload', { key, data });
  showAlert('img-alert', r.success, r.message || (r.success ? 'Uploaded!' : 'Error'));
  if (r.success) {
    fileEl.value = '';
    var grid = document.getElementById('img-grid');
    var slot = document.getElementById('imgslot-' + key);
    if (!slot) {
      slot = document.createElement('div');
      slot.className = 'img-slot';
      slot.id = 'imgslot-' + key;
      if (grid) grid.appendChild(slot);
    }
    slot.innerHTML = '<img src="' + escH(data) + '"><div class="img-slot-key">' + escH(key) + '</div>'
      + '<button class="btn-danger" style="margin-top:4px;width:100%" onclick="deleteImage(\\'' + escH(key) + '\\')">Delete</button>';
  }
}
async function deleteImage(key) {
  var r = await apiPost('/api/admin/image/delete', { key });
  if (r.success) { var s = document.getElementById('imgslot-' + key); if (s) s.remove(); }
  else showAlert('img-alert', false, r.message);
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
  var r = await apiPost('/api/admin/t1/order/save', { order });
  showAlert('order-alert', r.success, r.message);
}
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
