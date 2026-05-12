import { layout, esc } from '../layout/layout.js';
import { T1_DATA, T1_IMAGE_KEYS } from '../data/t1.js';

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
    board_pos:'Board Positioning',rou_gear:'Rou Gear',seir_gear:'Seir Gear',
    lecliss_gear:'Lecliss Gear',schera_gear:'Scheherazade Gear',sylvia_gear:'Sylvia Gear',
    icon_msp:'Schera: Magic Professor',icon_lw:'Schera: Lapis Witch',
    icon_cns:'Schera: Code Name S',icon_pp:'Schera: Purple Prince',
  };

  const skillSlots = [
    { char:'Rou',           slots:['Snack Time','Half Moon Kick','Hide & Seek 1','Terra Burst','Hide & Seek 2'] },
    { char:'Seir',          slots:['Protective Instinct 1','He is Bullying Me 1','Protective Instinct 2','He is Bullying Me 2','Protective Instinct 3'] },
    { char:'Lecliss',       slots:['Curse Replica 1','Auto Defense Mode 1','Curse Replica 2','Auto Defense Mode 2','Curse Replica 3'] },
    { char:'Scheherazade',  slots:['Sapphire Boomerang 1','Aqua Break 1','Aqua Silence','Sapphire Boomerang 2','Aqua Break 2'] },
    { char:'Sylvia',        slots:['CBFS 1','Bikini Blaster 1','The Punisher','CBFS 2','Bikini Blaster 2'] },
  ];

  const tileOptHtml = skillSlots.map(({char,slots}) =>
    slots.map((_,i) => {
      const k = `tile_${char.toLowerCase()}_${i+1}`;
      return `<option value="${esc(k)}">${esc(char)} — ${esc(slots[i])}${existingKeys.has(k)?' ✓':''}</option>`;
    }).join('')
  ).join('');

  const tileStatusHtml = skillSlots.map(({char,slots}) => `
<div style="margin-bottom:0.75rem">
  <div style="font-family:'Cinzel',serif;font-size:0.8rem;color:var(--gold);margin-bottom:0.4rem">${esc(char)}</div>
  ${slots.map((_,i) => {
    const k = `tile_${char.toLowerCase()}_${i+1}`;
    const has = existingKeys.has(k);
    return `<span style="display:inline-block;margin:2px 4px 2px 0;font-size:0.72rem;padding:2px 8px;border-radius:3px;background:${has?'rgba(39,174,96,0.15)':'var(--bg4)'};border:1px solid ${has?'rgba(39,174,96,0.3)':'var(--border2)'};color:${has?'#2ecc71':'var(--text3)'}">Slot ${i+1}: ${esc(slots[i])} ${has?'✓':'✗'}</span>`;
  }).join('')}
</div>`).join('');

  const currentImagesHtml = images.length ? `
<div class="img-grid">
  ${images.map(img => `
  <div class="img-slot" id="imgslot-${esc(img.key)}">
    <img src="/img/${esc(img.key)}" alt="${esc(img.key)}" onerror="this.style.display='none'">
    <div class="img-slot-key">${esc(img.key)}</div>
    <button class="btn-danger" style="margin-top:4px;width:100%" onclick="deleteImage('${esc(img.key)}')">Delete</button>
  </div>`).join('')}
</div>` : '<p style="color:var(--text3);font-size:0.83rem">No images uploaded yet.</p>';

  return layout('Admin Panel', `
<div class="admin-wrap">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
    <h1 style="font-family:'Cinzel',serif;font-size:1.5rem;color:var(--gold2)">Admin Panel</h1>
    <a href="/admin/logout" style="font-size:0.82rem;color:var(--text3)">Logout</a>
  </div>

  <div class="admin-tabs">
    <button class="tab-btn active" onclick="switchTab('coupons',this)">Coupons</button>
    <button class="tab-btn" onclick="switchTab('compositions',this)">Compositions</button>
    <button class="tab-btn" onclick="switchTab('emotes',this)">Emotes</button>
    <button class="tab-btn" onclick="switchTab('images',this)">📷 Images</button>
    <button class="tab-btn" onclick="switchTab('t1content',this)">⚙ T1 Content</button>
  </div>

  <!-- COUPONS -->
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
          <strong>${esc(c.code)}</strong> — ${esc(c.rewards||'')}
          ${c.expiry ? ` · Expires ${esc(c.expiry)}` : ''} · ${c.active ? 'Active' : 'Inactive'}
        </div>
        <button class="btn-danger" onclick="deleteCoupon(${c.id})">Delete</button>
      </div>`).join('') || '<p style="color:var(--text3);font-size:0.83rem">No coupons yet.</p>'}
    </div>
  </div>

  <!-- COMPOSITIONS -->
  <div class="admin-section" id="tab-compositions">
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
      <div class="form-group"><label>Countered By (comma separated)</label><input type="text" id="comp-cby" placeholder="T1, Schera teams"></div>
      <button class="btn" style="width:auto;padding:10px 24px" onclick="addComp()">Add Composition</button>
    </div>
    <div class="admin-list" id="comp-list">
      ${comps.map(c => `
      <div class="admin-item" id="comp-${c.id}">
        <div class="admin-item-info">
          <strong>${esc(c.tier)} — ${esc(c.name)}</strong> · ${esc(c.type||'')}
          ${c.last_updated ? ` · ${esc(c.last_updated)}` : ''}
        </div>
        <button class="btn-danger" onclick="deleteComp(${c.id})">Delete</button>
      </div>`).join('') || '<p style="color:var(--text3);font-size:0.83rem">No custom compositions yet.</p>'}
    </div>
  </div>

  <!-- EMOTES -->
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

  <!-- IMAGES -->
  <div class="admin-section" id="tab-images">
    <div class="admin-form">
      <h3>Upload Image</h3>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1rem">Select a slot, pick a file. Images are auto-compressed to ~340px JPEG. ✓ = already uploaded.</p>
      <div id="img-alert"></div>
      <div class="form-row">
        <div class="form-group">
          <label>Image Slot</label>
          <select id="img-key">
            <optgroup label="T1 Gear &amp; Icons">
              ${imgKeys.map(k => `<option value="${esc(k)}">${esc(imgLabels[k]||k)}${existingKeys.has(k)?' ✓':''}</option>`).join('')}
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
      <h3>Current Images (${images.length})</h3>
      ${currentImagesHtml}
    </div>
  </div>

  <!-- T1 CONTENT -->
  <div class="admin-section" id="tab-t1content">
    <div class="admin-form">
      <h3>T1 Character Build Notes</h3>
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
      <h3>T1 Unit Order</h3>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1rem">Edit the numbered placement order (1–5) shown in the guide.</p>
      ${[1,2,3,4,5].map(i => `
      <div class="form-group">
        <label>Position ${i}</label>
        <select id="order-${i}">
          ${['Rou','Seir','Lecliss','Scheherazade','Sylvia'].map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('')}
        </select>
      </div>`).join('')}
      <div id="order-alert"></div>
      <button class="btn" style="width:auto;padding:10px 24px" onclick="saveOrder()">Save Unit Order</button>
    </div>

    <div class="admin-form">
      <h3>Skill Tile Patterns</h3>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1rem">Upload tile pattern screenshots via the 📷 Images tab. They appear in skill hover tooltips.</p>
      ${tileStatusHtml}
    </div>
  </div>
</div>

<script>
function switchTab(name, btn) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
  if (name === 't1content') loadNotes();
  if (name === 't1content') loadOrder();
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function alert2(id, ok, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '<div class="alert ' + (ok?'alert-success':'alert-error') + '">' + esc(msg) + '</div>';
  setTimeout(() => el.innerHTML = '', 3000);
}

async function post(path, body) {
  const r = await fetch(path, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  return r.json();
}

/* COUPONS */
async function addCoupon() {
  const code = document.getElementById('c-code').value.trim();
  const rewards = document.getElementById('c-rewards').value.trim();
  const expiry = document.getElementById('c-expiry').value.trim();
  if (!code) return alert2('coupon-alert', false, 'Code is required');
  const r = await post('/api/admin/coupon/add', { code, rewards, expiry: expiry||null });
  alert2('coupon-alert', r.success, r.message);
  if (r.success) {
    document.getElementById('c-code').value = '';
    document.getElementById('c-rewards').value = '';
    document.getElementById('c-expiry').value = '';
    const list = document.getElementById('coupon-list');
    const div = document.createElement('div');
    div.className = 'admin-item'; div.id = 'coupon-' + r.id;
    div.innerHTML = '<div class="admin-item-info"><strong>' + esc(code) + '</strong> — ' + esc(rewards) + ' · Active</div><button class="btn-danger" onclick="deleteCoupon(' + r.id + ')">Delete</button>';
    list.prepend(div);
  }
}
async function deleteCoupon(id) {
  const r = await post('/api/admin/coupon/delete', { id });
  if (r.success) document.getElementById('coupon-' + id)?.remove();
}

/* COMPOSITIONS */
async function addComp() {
  const tier = document.getElementById('comp-tier').value;
  const name = document.getElementById('comp-name').value.trim();
  const type = document.getElementById('comp-type').value;
  const description = document.getElementById('comp-desc').value.trim();
  const countered_by = document.getElementById('comp-cby').value.trim();
  const last_updated = new Date().toISOString().slice(0,10);
  if (!name) return alert2('comp-alert', false, 'Name is required');
  const r = await post('/api/admin/comp/add', { tier, name, type, description, countered_by, last_updated });
  alert2('comp-alert', r.success, r.message);
  if (r.success) {
    document.getElementById('comp-name').value = '';
    document.getElementById('comp-desc').value = '';
    const list = document.getElementById('comp-list');
    const div = document.createElement('div');
    div.className = 'admin-item'; div.id = 'comp-' + r.id;
    div.innerHTML = '<div class="admin-item-info"><strong>' + esc(tier) + ' — ' + esc(name) + '</strong> · ' + esc(type) + '</div><button class="btn-danger" onclick="deleteComp(' + r.id + ')">Delete</button>';
    list.prepend(div);
  }
}
async function deleteComp(id) {
  const r = await post('/api/admin/comp/delete', { id });
  if (r.success) document.getElementById('comp-' + id)?.remove();
}

/* EMOTES */
async function addEmote() {
  const name = document.getElementById('e-name').value.trim();
  const image_url = document.getElementById('e-url').value.trim();
  if (!name || !image_url) return alert2('emote-alert', false, 'Name and URL are required');
  const r = await post('/api/admin/emote/add', { name, image_url });
  alert2('emote-alert', r.success, r.message);
  if (r.success) {
    document.getElementById('e-name').value = '';
    document.getElementById('e-url').value = '';
    const list = document.getElementById('emote-list');
    const div = document.createElement('div');
    div.className = 'admin-item'; div.id = 'emote-' + r.id;
    div.innerHTML = '<div class="admin-item-info" style="display:flex;align-items:center;gap:0.75rem"><img src="' + esc(image_url) + '" style="width:36px;height:36px;object-fit:cover;border-radius:4px"><strong>' + esc(name) + '</strong></div><button class="btn-danger" onclick="deleteEmote(' + r.id + ')">Delete</button>';
    list.prepend(div);
  }
}
async function deleteEmote(id) {
  const r = await post('/api/admin/emote/delete', { id });
  if (r.success) document.getElementById('emote-' + id)?.remove();
}

/* IMAGES */
document.getElementById('img-key').addEventListener('change', function() {
  document.getElementById('custom-key-group').style.display = this.value === '__custom__' ? 'block' : 'none';
});

async function uploadImage() {
  let key = document.getElementById('img-key').value;
  if (key === '__custom__') key = document.getElementById('img-custom-key').value.trim();
  const file = document.getElementById('img-file').files[0];
  if (!key) return alert2('img-alert', false, 'Select or enter a key');
  if (!file) return alert2('img-alert', false, 'Select an image file');
  alert2('img-alert', true, 'Compressing...');
  const data = await compressImage(file, 340, 0.85);
  const r = await post('/api/admin/image/upload', { key, data });
  alert2('img-alert', r.success, r.message);
  if (r.success) {
    document.getElementById('img-file').value = '';
    let slot = document.getElementById('imgslot-' + key);
    if (!slot) {
      const grid = document.querySelector('.img-grid');
      if (grid) { slot = document.createElement('div'); slot.className='img-slot'; slot.id='imgslot-'+key; grid.appendChild(slot); }
    }
    if (slot) slot.innerHTML = '<img src="' + esc(data) + '"><div class="img-slot-key">' + esc(key) + '</div><button class="btn-danger" style="margin-top:4px;width:100%" onclick="deleteImage(\'' + esc(key) + '\')">Delete</button>';
  }
}
async function deleteImage(key) {
  const r = await post('/api/admin/image/delete', { key });
  if (r.success) { const s = document.getElementById('imgslot-' + key); if(s) s.remove(); }
}

function compressImage(file, maxWidth, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.getElementById('compress-canvas');
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

/* T1 NOTES */
async function loadNotes() {
  const char = document.getElementById('notes-char').value;
  try {
    const r = await fetch('/api/admin/t1/notes/get?char=' + encodeURIComponent(char));
    const data = await r.json();
    document.getElementById('notes-text').value = data.notes || '';
  } catch(e) {}
}
async function saveNotes() {
  const char = document.getElementById('notes-char').value;
  const notes = document.getElementById('notes-text').value;
  const r = await post('/api/admin/t1/notes/save', { char, notes });
  alert2('notes-alert', r.success, r.message);
}

/* T1 ORDER */
async function loadOrder() {
  try {
    const r = await fetch('/api/admin/t1/order/get');
    const data = await r.json();
    const order = data.order || ['Rou','Seir','Lecliss','Scheherazade','Sylvia'];
    order.forEach((name, i) => {
      const sel = document.getElementById('order-' + (i+1));
      if (sel) sel.value = name;
    });
  } catch(e) {}
}
async function saveOrder() {
  const order = [1,2,3,4,5].map(i => document.getElementById('order-' + i).value);
  const r = await post('/api/admin/t1/order/save', { order });
  alert2('order-alert', r.success, r.message);
}

// Load notes/order on initial T1 tab open if already active
if (document.getElementById('tab-t1content').classList.contains('active')) {
  loadNotes(); loadOrder();
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
