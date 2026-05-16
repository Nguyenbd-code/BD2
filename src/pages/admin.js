import { layout, esc } from '../layout/layout.js';

const ADMIN_PASSWORD = 'Anime0404!';

function isAuthed(request) {
  const cookie = request.headers.get('Cookie') || '';
  return cookie.split(';').some(c => c.trim() === 'admin=true');
}

async function getAdminPassword(env) {
  try {
    const row = await env.DB.prepare("SELECT data FROM images WHERE key='admin_password'").first();
    if (row && row.data) return row.data;
  } catch {}
  return ADMIN_PASSWORD;
}

export async function handleAdminLogin(request, env) {
  const form = await request.formData();
  const correctPassword = await getAdminPassword(env);
  if (form.get('password') === correctPassword) {
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
  let mamonirTapCount = 7;
  let emoteLockHint = 'One character keeps something unusual by their side. The octopus there isn’t just decoration.';
  try { await env.DB.prepare("ALTER TABLE compositions ADD COLUMN guide_label TEXT DEFAULT ''").run(); } catch {}
  try {
    const [cr, er, compr, imgr, charr, mamRow, lockHintRow] = await Promise.all([
      env.DB.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all(),
      env.DB.prepare('SELECT * FROM emotes ORDER BY created_at DESC').all(),
      env.DB.prepare("SELECT * FROM compositions ORDER BY type ASC, COALESCE(NULLIF(sort_order,0),id*10) ASC, id ASC").all().catch(() => env.DB.prepare('SELECT * FROM compositions ORDER BY type ASC, id ASC').all()),
      env.DB.prepare("SELECT key FROM images WHERE key NOT LIKE 'notes_%' AND key NOT LIKE '%_migrated' AND key != 'unit_order' AND key != 'board_layout' AND key != 'mamonir_tap_count' AND key != 'special_code_config' AND key != 'home_secret_passcode' AND key != 'emote_lock_hint' ORDER BY key").all().catch(() => ({ results: [] })),
      env.DB.prepare('SELECT * FROM char_registry ORDER BY name ASC').all().catch(() => ({ results: [] })),
      env.DB.prepare("SELECT data FROM images WHERE key='mamonir_tap_count'").first().catch(() => null),
      env.DB.prepare("SELECT data FROM images WHERE key='emote_lock_hint'").first().catch(() => null),
    ]);
    coupons = cr.results || [];
    emotes  = er.results || [];
    comps   = compr.results || [];
    images  = imgr.results || [];
    chars   = charr.results || [];
    if (mamRow && mamRow.data) mamonirTapCount = Math.max(1, parseInt(mamRow.data, 10) || 7);
    if (lockHintRow && lockHintRow.data) emoteLockHint = lockHintRow.data;
  } catch(e) {}

  const tierOptions = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]
    .map(n => '<option value="T' + n + '">T' + n + '</option>').join('');

  const imgGridHtml = images.length ? images.map(img =>
    '<div class="img-slot" id="imgslot-' + esc(img.key) + '">'
    + '<img src="/img/' + esc(img.key) + '" alt="' + esc(img.key) + '" style="object-fit:contain;background:var(--bg2)" class="img-err-hide" data-action="admin-lightbox" data-src="/img/' + esc(img.key) + '">'
    + '<div class="img-slot-key">' + esc(img.key) + '</div>'
    + '<button class="btn-danger" style="margin-top:4px;width:100%" data-action="image-delete" data-key="' + esc(img.key) + '">Delete</button>'
    + '</div>'
  ).join('') : '<p style="color:var(--text3);font-size:0.83rem">No images uploaded yet.</p>';

  const atkComps = comps.filter(c => (c.type||'ATK').toUpperCase() === 'ATK');
  const defComps = comps.filter(c => (c.type||'ATK').toUpperCase() === 'DEF');
  const compRowHtml = (c) => {
    const isAtk = (c.type || '').toUpperCase() === 'ATK';
    const badgeStyle = isAtk
      ? 'background:rgba(41,128,185,0.2);color:#5dade2;border:1px solid rgba(41,128,185,0.35)'
      : 'background:rgba(39,174,96,0.2);color:#2ecc71;border:1px solid rgba(39,174,96,0.35)';
    const badgeText = isAtk ? '&#9876; ATK' : '&#128737; DEF';
    const color = c.color || '#c9a84c';
    return '<div class="admin-item" id="comp-' + c.id + '" draggable="true" style="cursor:grab">'
      + '<span style="color:var(--text3);font-size:1rem;cursor:grab;user-select:none;margin-right:6px;flex-shrink:0">&#10783;</span>'
      + '<div class="admin-item-info" style="display:flex;align-items:center;gap:0.5rem;flex:1">'
      + '<span style="display:inline-block;width:10px;height:10px;border-radius:2px;flex-shrink:0;background:' + color + '"></span>'
      + '<strong>' + esc(c.tier) + ' &mdash; ' + esc(c.name) + '</strong>'
      + '<span style="display:inline-block;margin-left:0.5rem;font-size:0.72rem;padding:2px 8px;border-radius:3px;' + badgeStyle + '">' + badgeText + '</span>'
      + '</div>'
      + '<div style="display:flex;gap:0.3rem;align-items:center">'
      + '<button class="btn" style="padding:2px 7px;font-size:0.75rem;min-width:0;background:var(--bg4);color:var(--text2)" data-action="comp-move-up" data-id="' + c.id + '" title="Move up">&#9650;</button>'
      + '<button class="btn" style="padding:2px 7px;font-size:0.75rem;min-width:0;background:var(--bg4);color:var(--text2)" data-action="comp-move-down" data-id="' + c.id + '" title="Move down">&#9660;</button>'
      + '<button class="btn-danger" data-action="comp-delete" data-id="' + c.id + '">Delete</button>'
      + '</div>'
      + '</div>';
  };
  let compsListHtml = '';
  if (atkComps.length) {
    compsListHtml += '<div style="font-size:0.7rem;font-weight:700;color:#5dade2;text-transform:uppercase;letter-spacing:0.08em;padding:0.3rem 0.2rem 0.15rem;margin-top:0.25rem">&#9876; Attacking</div>';
    compsListHtml += atkComps.map(compRowHtml).join('');
  }
  if (defComps.length) {
    compsListHtml += '<div style="font-size:0.7rem;font-weight:700;color:#2ecc71;text-transform:uppercase;letter-spacing:0.08em;padding:0.3rem 0.2rem 0.15rem;margin-top:0.5rem;border-top:1px solid var(--border2);padding-top:0.5rem">&#128737; Defence</div>';
    compsListHtml += defComps.map(compRowHtml).join('');
  }
  if (!compsListHtml) compsListHtml = '<p style="color:var(--text3);font-size:0.83rem">No compositions yet.</p>';

  const elemColorsServer = { Light:'#F4D03F', Dark:'#8E44AD', Water:'#2E86C1', Wind:'#27AE60', Fire:'#C0392B' };
  const elemOrderServer  = ['Light','Dark','Fire','Water','Wind'];
  const groupedChars     = {};
  for (const c of chars) {
    const raw = (c.element || 'Dark').toString().trim();
    const norm = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    const el = elemOrderServer.includes(norm) ? norm : 'Dark';
    if (!groupedChars[el]) groupedChars[el]=[];
    groupedChars[el].push(c);
  }
  let charsListHtml = '';
  for (const el of elemOrderServer) {
    const grp = groupedChars[el];
    if (!grp || !grp.length) continue;
    charsListHtml += '<div class="elem-group-label" data-elem="' + esc(el) + '" style="font-size:0.7rem;font-weight:700;color:' + (elemColorsServer[el]||'#888') + ';text-transform:uppercase;letter-spacing:0.08em;padding:0.3rem 0.2rem 0.15rem;margin-top:0.25rem">' + esc(el) + '</div>';
    charsListHtml += grp.map(c => {
      const elemColor = elemColorsServer[c.element] || '#888';
      return '<div class="char-row" id="char-' + c.id + '" data-action="char-select" data-id="' + c.id + '" data-name="' + esc(c.name) + '" data-slug="' + esc(c.slug) + '" data-element="' + esc(el) + '">'
        + '<img src="/img/element_' + esc(el.toLowerCase()) + '" class="img-err-hide elem-icon" style="width:14px;height:14px;object-fit:contain;flex-shrink:0">'
        + '<span style="flex:1;font-size:0.85rem;font-weight:600">' + esc(c.name) + '</span>'
        + (c.status === 'upcoming' ? '<span style="font-size:0.7rem;color:var(--gold)">&#128284;</span>' : '')
        + '<button class="btn-danger" data-action="char-delete" data-id="' + c.id + '" style="font-size:0.72rem;padding:3px 8px">&#x2715;</button>'
        + '</div>';
    }).join('');
  }
  if (!charsListHtml) charsListHtml = '<p style="color:var(--text3);font-size:0.83rem;padding:0.5rem 0">No characters yet.</p>';

  const charSelectOptions = chars.map(c =>
    '<option value="' + esc(c.slug) + '">' + esc(c.name) + '</option>'
  ).join('');

  const dbCompOptions = comps.map(c =>
    '<option value="' + c.id + '" data-tier="' + esc(c.tier) + '" data-name="' + esc(c.name) + '" data-type="' + esc(c.type||'ATK') + '" data-color="' + esc(c.color||'#c9a84c') + '" data-short-desc="' + esc(c.short_description||'') + '" data-guide-label="' + esc(c.guide_label||'') + '" data-notes="' + esc(c.description||'') + '" data-unit-order="' + esc(c.unit_order||'[]') + '" data-cby="' + esc(c.countered_by||'') + '">' + esc(c.tier) + ' &mdash; ' + esc(c.name) + ' (' + esc(c.type || '') + ')</option>'
  ).join('');

  return await layout('Admin Panel', `
<div class="admin-wrap">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
    <h1 style="font-family:'Cinzel',serif;font-size:1.5rem;color:var(--gold2)">Admin Panel</h1>
    <a href="/admin/logout" style="font-size:0.82rem;color:var(--text3)">Logout</a>
  </div>

  <!-- Early, isolated tab-switching script: always wires tabs even if later JS errors -->
  <script>
  (function(){
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('.tab-btn[data-tab]');
      if (!btn) return;
      var name = btn.dataset.tab;
      document.querySelectorAll('.admin-section').forEach(function(s){ s.classList.remove('active'); });
      document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
      var t = document.getElementById('tab-' + name);
      if (t) t.classList.add('active');
      btn.classList.add('active');
      // Defer load* calls — they're defined in the main script which loads later
      try {
        if (name === 'chars'    && typeof loadChars     === 'function') loadChars();
        if (name === 'images'   && typeof updateImgKey  === 'function') updateImgKey();
        if (name === 'homepage' && typeof loadHomeNotes === 'function') loadHomeNotes();
        if (name === 'settings' && typeof loadEmoteSets === 'function') loadEmoteSets();
      } catch(err) {}
    });
  })();
  </script>

  <div class="admin-tabs">
    <button class="tab-btn active" data-action="tab-switch" data-tab="homepage">&#127968; Home</button>
    <button class="tab-btn"        data-action="tab-switch" data-tab="chars">Characters</button>
    <button class="tab-btn"        data-action="tab-switch" data-tab="comps">Compositions</button>
    <button class="tab-btn"        data-action="tab-switch" data-tab="coupons">Coupons</button>
    <button class="tab-btn"        data-action="tab-switch" data-tab="images">Images</button>
    <button class="tab-btn"        data-action="tab-switch" data-tab="emotes">Emotes</button>
    <button class="tab-btn"        data-action="tab-switch" data-tab="settings">&#9881; Settings</button>
  </div>

  <div id="admin-debug" style="color:#e74c3c;font-size:0.75rem;min-height:1rem;padding:4px 0"></div>

  <!-- ═══════════════════════════════════════════════════════════ COUPONS -->
  <div class="admin-section" id="tab-coupons">
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
      ${coupons.map(c =>
        '<div class="admin-item" id="coupon-' + c.id + '">'
        + '<div class="admin-item-info">'
        + '<strong>' + esc(c.code) + '</strong> &mdash; ' + esc(c.rewards || '')
        + (c.expiry ? ' &middot; Expires ' + esc(c.expiry) : '') + ' &middot; ' + (c.active ? 'Active' : 'Inactive')
        + '</div>'
        + '<button class="btn-danger" data-action="coupon-delete" data-id="' + c.id + '">Delete</button>'
        + '</div>'
      ).join('') || '<p style="color:var(--text3);font-size:0.83rem">No coupons yet.</p>'}
    </div>

    <!-- Special Code Config -->
    <div class="admin-form" style="margin-top:1.5rem">
      <h3>Special Code Configuration</h3>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1rem">Set a special passcode-gated code and its lock image. Users enter the passcode on the Coupons page to reveal it.</p>
      <div id="special-cfg-alert"></div>
      <div class="form-row">
        <div class="form-group">
          <label>Special Code <span style="color:var(--text3);font-size:0.7rem">(the code users will redeem)</span></label>
          <input type="text" id="sc-code" placeholder="SPECIALCODE2026" autocomplete="off">
        </div>
        <div class="form-group">
          <label>Passcode <span style="color:var(--text3);font-size:0.7rem">(required to unlock)</span></label>
          <input type="text" id="sc-passcode" placeholder="SecretPass123" autocomplete="off">
        </div>
      </div>
      <div class="form-group">
        <label>Lock Image <span style="color:var(--text3);font-size:0.7rem">(shown as lock icon on coupons page)</span></label>
        <div style="display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap">
          <div style="width:80px;height:80px;border:1px solid var(--border2);border-radius:6px;background:var(--bg4);overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <img src="/img/special_code_lock_image" class="img-err-hide" style="width:100%;height:100%;object-fit:contain">
          </div>
          <div style="flex:1;min-width:180px">
            <input type="file" id="sc-lock-img-file" accept="image/*" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:5px;width:100%">
            <canvas id="sc-lock-img-canvas" style="display:none"></canvas>
            <button class="btn" style="width:auto;padding:6px 16px;font-size:0.8rem;margin-top:0.4rem" data-action="upload-special-lock-img">Upload Lock Image</button>
          </div>
        </div>
      </div>
      <button class="btn" style="width:auto;padding:10px 24px" data-action="save-special-code-config">Save Special Code</button>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════ COMPOSITIONS -->
  <div class="admin-section" id="tab-comps">
    <div class="admin-form">
      <h3>Edit Composition Content</h3>
      <div class="form-group">
        <label>Select Composition</label>
        <select id="comp-select" onchange="selectComp()">
          <option value="">— Select Composition —</option>
          ${dbCompOptions}
          <option value="new">+ Add New Composition</option>
        </select>
      </div>

      <!-- Comp editor (shown when a tier is selected) -->
      <div id="comp-editor" style="display:none;margin-top:1rem">
        <div style="font-family:'Cinzel',serif;font-size:0.9rem;color:var(--gold);margin-bottom:1rem" id="comp-editor-tier-label"></div>

        <!-- Team Name -->
        <div class="form-group">
          <label>TEAM NAME</label>
          <input type="text" id="comp-name" placeholder="Team name...">
        </div>

        <!-- Home Overview Label -->
        <div class="form-group">
          <label>HOME OVERVIEW LABEL <span style="color:var(--text3);font-size:0.7rem;font-weight:400">— short description shown on the Home page overview card</span></label>
          <input type="text" id="comp-card-label" placeholder="e.g. Strong pick · Best in current meta" style="width:100%">
          <div style="display:flex;gap:0.5rem;margin-top:0.4rem">
            <button class="btn" style="width:auto;padding:6px 16px;font-size:0.8rem" data-action="save-card-label">Save Home Label</button>
            <span id="comp-card-label-alert" style="font-size:0.75rem;align-self:center"></span>
          </div>
        </div>

        <!-- Guide Card Label -->
        <div class="form-group">
          <label>GUIDE CARD LABEL <span style="color:var(--text3);font-size:0.7rem;font-weight:400">— highlighted line shown under the team name on the PvP Guide page</span></label>
          <div style="display:flex;gap:0.5rem;align-items:stretch">
            <select id="comp-guide-label-color" style="width:120px;flex:0 0 120px;background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px 10px;border-radius:5px;font-size:0.85rem">
              <option value="">None / Gold</option>
              <option value="green">● Green</option>
              <option value="red">● Red</option>
            </select>
            <input type="text" id="comp-guide-label" placeholder="e.g. Meta pick · Highly recommended" style="flex:1;min-width:0">
          </div>
          <div style="display:flex;gap:0.5rem;margin-top:0.4rem">
            <button class="btn" style="width:auto;padding:6px 16px;font-size:0.8rem" data-action="save-guide-label">Save Guide Label</button>
            <span id="comp-guide-label-alert" style="font-size:0.75rem;align-self:center"></span>
          </div>
        </div>

        <!-- Color row -->
        <div class="form-group">
          <label>TIER COLOR</label>
          <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.4rem">
            <input type="color" id="comp-color" value="#c9a84c" style="width:44px;height:36px;border:1px solid var(--border);border-radius:4px;background:none;cursor:pointer;padding:2px">
            <span style="font-size:0.75rem;color:var(--text3)">Badge color</span>
          </div>
          <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
            <button data-action="preset-color" data-color="#e74c3c" style="width:22px;height:22px;border-radius:3px;background:#e74c3c;border:none;cursor:pointer" title="Red"></button>
            <button data-action="preset-color" data-color="#3498db" style="width:22px;height:22px;border-radius:3px;background:#3498db;border:none;cursor:pointer" title="Blue"></button>
            <button data-action="preset-color" data-color="#9b59b6" style="width:22px;height:22px;border-radius:3px;background:#9b59b6;border:none;cursor:pointer" title="Purple"></button>
            <button data-action="preset-color" data-color="#27ae60" style="width:22px;height:22px;border-radius:3px;background:#27ae60;border:none;cursor:pointer" title="Green"></button>
            <button data-action="preset-color" data-color="#e67e22" style="width:22px;height:22px;border-radius:3px;background:#e67e22;border:none;cursor:pointer" title="Orange"></button>
            <button data-action="preset-color" data-color="#c9a84c" style="width:22px;height:22px;border-radius:3px;background:#c9a84c;border:none;cursor:pointer" title="Gold"></button>
            <button data-action="preset-color" data-color="#1abc9c" style="width:22px;height:22px;border-radius:3px;background:#1abc9c;border:none;cursor:pointer" title="Teal"></button>
            <button data-action="preset-color" data-color="#e91e63" style="width:22px;height:22px;border-radius:3px;background:#e91e63;border:none;cursor:pointer" title="Pink"></button>
            <button data-action="preset-color" data-color="#00bcd4" style="width:22px;height:22px;border-radius:3px;background:#00bcd4;border:none;cursor:pointer" title="Cyan"></button>
            <button data-action="preset-color" data-color="#ff5722" style="width:22px;height:22px;border-radius:3px;background:#ff5722;border:none;cursor:pointer" title="Deep Orange"></button>
            <button data-action="preset-color" data-color="#607d8b" style="width:22px;height:22px;border-radius:3px;background:#607d8b;border:none;cursor:pointer" title="Blue Grey"></button>
            <button data-action="preset-color" data-color="#795548" style="width:22px;height:22px;border-radius:3px;background:#795548;border:none;cursor:pointer" title="Brown"></button>
          </div>
        </div>

        <!-- Build Notes (all tiers) -->
        <div class="form-group">
          <label>BUILD NOTES</label>
          <textarea id="comp-build-notes" rows="4" placeholder="One note per line..."></textarea>
          <div style="display:flex;gap:0.5rem;margin-top:0.4rem">
            <button class="btn" style="width:auto;padding:8px 20px" onclick="saveCompMeta()">Save Notes + Color</button>
          </div>
          <div id="comp-meta-alert"></div>
        </div>

        <!-- Character Bonds -->
        <div class="form-group" style="border-top:1px solid var(--border2);padding-top:1rem">
          <label>CHARACTER BONDS</label>
          <!-- 5 portrait summary slots -->
          <div id="bonds-summary" style="display:flex;gap:0.5rem;margin-bottom:0.75rem;flex-wrap:wrap">
            <span style="color:var(--text3);font-size:0.82rem">Select a composition to set bonds</span>
          </div>
          <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
            <button class="btn" style="width:auto;padding:8px 20px" id="open-bonds-modal-btn">Edit Bonds</button>
            <button class="btn" style="width:auto;padding:8px 20px" data-action="save-comp-bonds">Save Bonds</button>
            <div id="comp-bonds-alert" style="font-size:0.78rem"></div>
          </div>
        </div>

        <!-- Unit Order -->
        <div class="form-group" style="border-top:1px solid var(--border2);padding-top:1rem" id="unit-order-section">
          <label>UNIT ORDER</label>
          <div id="unit-order-gated" style="pointer-events:none;opacity:0.35;transition:opacity 0.2s">
            <p style="font-size:0.8rem;color:var(--text3);margin-bottom:0.6rem">Set Character Bonds first to enable unit ordering.</p>
          </div>
          <div id="unit-order-active" style="display:none">
            <!-- Summary of chosen order -->
            <div id="unit-order-summary" style="display:flex;gap:0.5rem;margin-bottom:0.6rem;flex-wrap:wrap"></div>
            <button class="btn" style="width:auto;padding:8px 20px" id="open-unit-order-btn">Configure Order</button>
            <button class="btn" style="width:auto;padding:8px 20px;margin-left:0.5rem" onclick="saveCompUnitOrder()">Save Unit Order</button>
            <div id="comp-order-alert" style="font-size:0.78rem;margin-top:0.4rem"></div>
          </div>
        </div>

        <!-- Skill Rotation (all tiers) -->
        <div style="border-top:1px solid var(--border2);margin:1rem 0;padding-top:1rem" id="skill-rotation-section">
          <h4 style="font-family:'Cinzel',serif;font-size:0.85rem;color:var(--gold2);margin-bottom:0.4rem">Skill Rotation</h4>
          <div id="skill-rotation-gated" style="pointer-events:none;opacity:0.35;transition:opacity 0.2s">
            <p style="font-size:0.8rem;color:var(--text3)">Set Character Bonds first to enable skill rotation.</p>
          </div>
          <div id="skill-rotation-active" style="display:none">
            <div id="rot-char-selectors" style="display:grid;grid-template-columns:repeat(5,1fr);gap:0.5rem;margin-bottom:0.75rem"></div>
            <div id="rot-alert" style="margin-bottom:0.5rem"></div>
            <div id="rot-grid"></div>
          </div>
        </div>

        <!-- How and When to Play -->
        <div class="form-group" style="border-top:1px solid var(--border2);padding-top:1rem">
          <label>HOW AND WHEN TO PLAY</label>
          <textarea id="comp-how-to-play" rows="4" placeholder="One tip per line — when to use, matchup notes, timing..."></textarea>
          <button class="btn" style="width:auto;padding:8px 20px;margin-top:0.4rem" data-action="save-how-to-play">Save How To Play</button>
          <div id="comp-howtoplay-alert"></div>
        </div>

        <!-- Matchups -->
        <div class="form-group" style="border-top:1px solid var(--border2);padding-top:1rem">
          <label>MATCHUPS</label>
          <div class="form-row" style="align-items:start;margin-top:0.5rem">
            <div class="form-group">
              <label style="font-size:0.75rem;color:#2ecc71">COUNTERS <span style="color:var(--text3);font-weight:400">(comma-separated)</span></label>
              <textarea id="comp-counters" rows="2" placeholder="T3, Double Taunt Teams"></textarea>
            </div>
            <div class="form-group">
              <label style="font-size:0.75rem;color:#e74c3c">COUNTERED BY <span style="color:var(--text3);font-weight:400">(comma-separated)</span></label>
              <textarea id="comp-countered-by" rows="2" placeholder="T2, T1, Schera teams"></textarea>
            </div>
          </div>
          <button class="btn" style="width:auto;padding:8px 20px;margin-top:0.1rem" data-action="save-matchups">Save Matchups</button>
          <div id="comp-matchups-alert"></div>
        </div>

        <!-- Board images (front / back) -->
        <div class="form-group" style="border-top:1px solid var(--border2);padding-top:1rem">
          <label>Board Image — Front</label>
          <input type="file" id="comp-board-file" accept="image/*" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:10px 14px;border-radius:5px;width:100%">
          <canvas id="comp-canvas" style="display:none"></canvas>
          <button class="btn" style="width:auto;padding:8px 20px;margin-top:0.5rem" data-action="upload-board-front">Upload Front</button>
          <div id="comp-board-preview" style="margin-top:0.5rem"></div>
        </div>
        <div class="form-group">
          <label>Board Image — Back</label>
          <input type="file" id="comp-board-back-file" accept="image/*" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:10px 14px;border-radius:5px;width:100%">
          <canvas id="comp-canvas-back" style="display:none"></canvas>
          <button class="btn" style="width:auto;padding:8px 20px;margin-top:0.5rem" data-action="upload-board-back">Upload Back</button>
          <div id="comp-board-back-preview" style="margin-top:0.5rem"></div>
        </div>

        <!-- Preemptive Skills -->
        <div class="form-group" style="border-top:1px solid var(--border2);padding-top:1rem">
          <label>PREEMPTIVE SKILLS</label>
          <div id="preemptive-list" style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.5rem;min-height:48px"></div>
          <input type="file" id="preemptive-file" accept="image/*" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:5px;width:100%;margin-bottom:0.4rem">
          <canvas id="preemptive-canvas" style="display:none"></canvas>
          <button class="btn" style="width:auto;padding:8px 20px" data-action="add-preemptive">Add Preemptive Image</button>
          <div id="comp-preemptive-alert"></div>
        </div>

        <!-- Video URL -->
        <div class="form-group" style="border-top:1px solid var(--border2);padding-top:1rem">
          <label>Battle Video URL</label>
          <div style="display:flex;gap:0.5rem;align-items:center">
            <input type="url" id="comp-video-url" placeholder="https://... or upload below" style="flex:1">
            <button class="btn" style="width:auto;padding:8px 20px;white-space:nowrap" onclick="saveCompVideo()">Save URL</button>
          </div>
          <div style="display:flex;gap:0.5rem;align-items:center;margin-top:0.5rem">
            <input type="file" id="comp-video-file" accept="video/*" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:5px;flex:1">
            <button class="btn" style="width:auto;padding:8px 20px;white-space:nowrap" onclick="uploadCompVideoFile()">Upload Video</button>
          </div>
          <div style="font-size:0.7rem;color:var(--text3);margin-top:0.25rem">Tip: keep files under ~5 MB; trim/compress clips before uploading.</div>
          <div id="comp-video-alert"></div>
        </div>

        <!-- Comp-Specific Gear Images -->
        <div class="form-group" style="border-top:1px solid var(--border2);padding-top:1rem">
          <label>COMP GEAR IMAGES <span style="color:var(--text3);font-size:0.7rem;font-weight:400">— override a character's base gear image for this team's flip card only</span></label>
          <p style="font-size:0.78rem;color:var(--text3);margin-bottom:0.75rem">Select a bonded character below. Left square shows their base gear; right square lets you upload a comp-specific alternate used on the PvP Guide flip card.</p>
          <select id="comp-gear-char-sel" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:5px;width:100%;margin-bottom:0.75rem" onchange="onCompGearCharChange()">
            <option value="">— Select a character —</option>
          </select>
          <div id="comp-gear-preview" style="display:none">
            <div style="display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap">
              <div style="flex:1;min-width:120px;max-width:180px">
                <div style="font-size:0.72rem;color:var(--text3);margin-bottom:0.4rem;text-align:center">Base Gear</div>
                <div style="width:100%;aspect-ratio:1;border:1px solid var(--border2);border-radius:6px;background:var(--bg4);overflow:hidden;display:flex;align-items:center;justify-content:center;position:relative">
                  <span style="font-size:0.65rem;color:var(--text3)" id="comp-gear-base-placeholder">No image</span>
                  <img id="comp-gear-base-img" src="" class="img-err-hide" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:var(--bg4)">
                </div>
              </div>
              <div style="flex:1;min-width:120px;max-width:180px">
                <div style="font-size:0.72rem;color:var(--text3);margin-bottom:0.4rem;text-align:center">Comp Override</div>
                <div style="width:100%;aspect-ratio:1;border:2px dashed var(--border2);border-radius:6px;background:var(--bg4);overflow:hidden;display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer" id="comp-gear-alt-box" onclick="document.getElementById('comp-gear-alt-file').click()">
                  <span style="font-size:0.65rem;color:var(--text3);text-align:center;padding:0.25rem" id="comp-gear-alt-placeholder">Click to upload</span>
                  <img id="comp-gear-alt-img" src="" class="img-err-hide" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:var(--bg4)">
                </div>
              </div>
            </div>
            <input type="file" id="comp-gear-alt-file" accept="image/*" style="display:none">
            <canvas id="comp-gear-alt-canvas" style="display:none"></canvas>
            <div style="display:flex;gap:0.5rem;margin-top:0.75rem;flex-wrap:wrap">
              <button class="btn" style="width:auto;padding:6px 16px;font-size:0.8rem" data-action="upload-comp-gear">Upload Override</button>
              <button class="btn" style="width:auto;padding:6px 16px;font-size:0.8rem;background:var(--bg4);color:var(--text3)" data-action="clear-comp-gear">Clear Override</button>
              <span id="comp-gear-alert" style="font-size:0.75rem;align-self:center"></span>
            </div>
          </div>
        </div>

        <div id="comp-editor-alert"></div>

        <!-- Save All -->
        <div style="border-top:2px solid var(--border);padding-top:1.25rem;margin-top:0.5rem;display:flex;align-items:center;gap:1rem">
          <button class="btn" style="width:auto;padding:10px 28px;font-size:0.95rem;font-weight:700" data-action="save-all-comp">Save All</button>
          <span id="comp-save-all-alert" style="font-size:0.82rem"></span>
        </div>
      </div>

      <!-- Add new comp form -->
      <div id="comp-add-form" style="display:none;margin-top:1rem">
        <h4 style="font-family:'Cinzel',serif;font-size:0.85rem;color:var(--gold2);margin-bottom:0.75rem">New Composition</h4>
        <div class="form-row">
          <div class="form-group">
            <label>Tier Label <span style="color:var(--text3);font-size:0.7rem">(e.g. T1 for ATK, D1 for DEF)</span></label>
            <input type="text" id="new-comp-tier" placeholder="T1" maxlength="8" style="width:100%">
          </div>
          <div class="form-group">
            <label>Type</label>
            <select id="new-comp-type"><option value="ATK">&#9876; ATK (Attacking)</option><option value="DEF">&#128737; DEF (Defence)</option></select>
          </div>
        </div>
        <div class="form-group"><label>Name</label><input type="text" id="new-comp-name" placeholder="Team Name"></div>
        <div class="form-group"><label>Description / Notes</label><textarea id="new-comp-desc" rows="3" placeholder="Build notes and details..."></textarea></div>
        <div class="form-group"><label>Countered By</label><input type="text" id="new-comp-cby" placeholder="T1, Schera teams"></div>
        <div id="comp-add-alert"></div>
        <button class="btn" style="width:auto;padding:10px 24px" onclick="addComp()">Add Composition</button>
      </div>
    </div>

    <!-- Bonds Picker Modal -->
    <div id="bonds-modal" style="display:none;position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,0.8);align-items:flex-start;justify-content:center;overflow-y:auto;padding:2rem 1rem">
      <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:10px;padding:1.5rem;max-width:700px;width:100%;margin:auto;position:relative">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <div style="font-family:'Cinzel',serif;font-size:1rem;color:var(--gold)">Select Character Bonds</div>
          <button id="close-bonds-modal-btn" style="background:none;border:1px solid var(--border2);color:var(--text2);border-radius:4px;padding:4px 10px;cursor:pointer;font-size:0.85rem">&#x2715; Close</button>
        </div>
        <!-- 5 bond slots at top -->
        <div id="bonds-modal-slots" style="display:flex;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap"></div>
        <!-- Element filter -->
        <div id="bonds-elem-filter" style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.75rem">
          <button class="bond-elem-btn active" data-elem="all" style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:4px;border:1px solid var(--border2);background:var(--gold);color:#0a0a0f;font-size:0.78rem;cursor:pointer;font-family:'Cinzel',serif"><span style="font-size:0.9rem">✦</span>All</button>
          <button class="bond-elem-btn" data-elem="water" style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:4px;border:1px solid var(--border2);background:var(--bg3);color:var(--text2);font-size:0.78rem;cursor:pointer"><img src="/img/element_water" class="img-err-hide" style="width:14px;height:14px;object-fit:contain">Water</button>
          <button class="bond-elem-btn" data-elem="fire" style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:4px;border:1px solid var(--border2);background:var(--bg3);color:var(--text2);font-size:0.78rem;cursor:pointer"><img src="/img/element_fire" class="img-err-hide" style="width:14px;height:14px;object-fit:contain">Fire</button>
          <button class="bond-elem-btn" data-elem="light" style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:4px;border:1px solid var(--border2);background:var(--bg3);color:var(--text2);font-size:0.78rem;cursor:pointer"><img src="/img/element_light" class="img-err-hide" style="width:14px;height:14px;object-fit:contain">Light</button>
          <button class="bond-elem-btn" data-elem="dark" style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:4px;border:1px solid var(--border2);background:var(--bg3);color:var(--text2);font-size:0.78rem;cursor:pointer"><img src="/img/element_dark" class="img-err-hide" style="width:14px;height:14px;object-fit:contain">Dark</button>
          <button class="bond-elem-btn" data-elem="wind" style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:4px;border:1px solid var(--border2);background:var(--bg3);color:var(--text2);font-size:0.78rem;cursor:pointer"><img src="/img/element_wind" class="img-err-hide" style="width:14px;height:14px;object-fit:contain">Wind</button>
        </div>
        <!-- Search -->
        <input id="bonds-char-search" type="text" placeholder="Search characters..." style="width:100%;box-sizing:border-box;background:var(--bg3);border:1px solid var(--border2);color:var(--text);padding:7px 10px;border-radius:5px;font-size:0.88rem;outline:none;margin-bottom:0.75rem">
        <!-- Character grid -->
        <div id="bonds-char-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:0.6rem;max-height:360px;overflow-y:auto"></div>
        <!-- Costume select -->
        <div id="bonds-costume-area" style="margin-top:1rem;padding-top:0.75rem;border-top:1px solid var(--border2);display:none">
          <div style="font-size:0.78rem;color:var(--text3);margin-bottom:0.4rem" id="bonds-costume-label">Costume for slot:</div>
          <select id="bonds-costume-sel" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:6px 10px;border-radius:4px;width:100%;font-size:0.85rem">
            <option value="">&#8212; Default &#8212;</option>
          </select>
          <button class="btn" style="width:auto;padding:6px 16px;margin-top:0.5rem;font-size:0.82rem" id="bonds-confirm-slot-btn">Confirm</button>
        </div>
      </div>
    </div>

    <!-- Unit Order Modal -->
    <div id="unit-order-modal" style="display:none;position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,0.8);align-items:center;justify-content:center;padding:2rem 1rem">
      <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:10px;padding:1.5rem;max-width:420px;width:100%;position:relative">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <div style="font-family:'Cinzel',serif;font-size:1rem;color:var(--gold)">Unit Order</div>
          <button id="close-unit-order-btn" style="background:none;border:1px solid var(--border2);color:var(--text2);border-radius:4px;padding:4px 10px;cursor:pointer;font-size:0.85rem">&#x2715; Close</button>
        </div>
        <p style="font-size:0.78rem;color:var(--text3);margin-bottom:0.75rem">Arrange positions 1&#8211;5. Only bonded characters are available.</p>
        <div id="unit-order-slots" style="display:flex;flex-direction:column;gap:0.6rem;margin-bottom:1rem">
          <!-- slots populated by JS -->
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn" style="width:auto;padding:8px 20px" onclick="saveCompUnitOrder();closeUnitOrderModal()">Save &amp; Close</button>
        </div>
        <div id="comp-order-alert-modal" style="font-size:0.78rem;margin-top:0.4rem"></div>
      </div>
    </div>

    <!-- Skill Rotation Edit Modal -->
    <div id="rot-edit-modal" style="display:none;position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,0.8);align-items:flex-start;justify-content:center;overflow-y:auto;padding:2rem 1rem">
      <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:10px;padding:1.5rem;max-width:480px;width:100%;margin:auto">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <div id="rot-edit-title" style="font-family:'Cinzel',serif;font-size:1rem;color:var(--gold)">Skill Rotation</div>
          <button id="close-rot-edit-btn" style="background:none;border:1px solid var(--border2);color:var(--text2);border-radius:4px;padding:4px 10px;cursor:pointer;font-size:0.85rem">&#x2715; Close</button>
        </div>
        <p style="font-size:0.78rem;color:var(--text3);margin-bottom:0.75rem">Pick a costume for each of the 10 rotation slots. Changes save automatically.</p>
        <div id="rot-edit-body"></div>
        <div style="margin-top:1rem">
          <button class="btn" style="width:auto;padding:8px 20px" onclick="closeRotEditModal()">Done</button>
        </div>
      </div>
    </div>

    <!-- Comp list -->
    <div class="admin-form">
      <h3>Compositions (DB)</h3>
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;flex-wrap:wrap">
        <span style="font-size:0.75rem;color:var(--text3)">ATK → A1, A2… &nbsp; DEF → D1, D2…</span>
        <button class="btn" style="width:auto;padding:4px 12px;font-size:0.75rem" data-action="normalize-tiers">Normalize Tier Labels</button>
        <div id="normalize-alert" style="font-size:0.75rem"></div>
      </div>
      <div id="comp-list" style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:0.5rem">
        ${compsListHtml}
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════ EMOTES -->
  <div class="admin-section" id="tab-emotes">
    <div class="admin-form">
      <h3>Emote Sets</h3>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1.25rem">Pick a set to manage its cover image and emote bundle.</p>

      <div class="form-group" style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:0">
        <label style="margin:0;white-space:nowrap">Set</label>
        <select id="emote-set-select" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:5px;width:200px">
          <option value="1">Set 1</option><option value="2">Set 2</option><option value="3">Set 3</option><option value="4">Set 4</option><option value="5">Set 5</option><option value="6">Set 6</option>
        </select>
      </div>

      <!-- Cover Image -->
      <div style="border:1px solid var(--border2);border-radius:6px;padding:1rem;background:var(--bg3);margin-top:1rem">
        <div style="font-family:'Cinzel',serif;font-size:0.85rem;color:var(--gold2);margin-bottom:0.75rem">Cover Image</div>
        <div style="display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap">
          <div id="es-cover-preview-img" style="width:120px;height:120px;border:1px solid var(--border2);border-radius:6px;background:var(--bg4);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">
            <span style="font-size:0.7rem;color:var(--text3);text-align:center">No cover</span>
          </div>
          <div style="flex:1;min-width:200px">
            <div class="form-group">
              <label>Upload New Cover</label>
              <input type="file" id="es-cover-file" accept="image/*" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:5px;width:100%">
              <canvas id="es-cover-canvas" style="display:none"></canvas>
            </div>
            <button class="btn" style="width:auto;padding:8px 20px" data-action="save-emote-set">Save Cover</button>
            <span id="es-alert" style="font-size:0.78rem;margin-left:0.5rem"></span>
          </div>
        </div>
      </div>

      <!-- Lock Image -->
      <div style="border:1px solid var(--border2);border-radius:6px;padding:1rem;background:var(--bg3);margin-top:1rem">
        <div style="font-family:'Cinzel',serif;font-size:0.85rem;color:var(--gold2);margin-bottom:0.75rem">Page Lock Image</div>
        <p style="font-size:0.78rem;color:var(--text3);margin-bottom:0.75rem">Shown on locked sets. Upload the lock emote image here.</p>
        <div style="display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap">
          <div id="lock-img-preview" style="width:80px;height:80px;border:1px solid var(--border2);border-radius:6px;background:var(--bg4);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">
            <img src="/img/emote_lock_image" class="img-err-hide" style="width:100%;height:100%;object-fit:contain">
          </div>
          <div style="flex:1;min-width:200px">
            <input type="file" id="lock-img-file" accept="image/*" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:5px;width:100%">
            <canvas id="lock-img-canvas" style="display:none"></canvas>
            <button class="btn" style="width:auto;padding:8px 20px;margin-top:0.5rem" data-action="upload-lock-img">Upload Lock Image</button>
            <span id="lock-img-alert" style="font-size:0.78rem;margin-left:0.5rem"></span>
          </div>
        </div>
      </div>

      <!-- Emote Bundle -->
      <div style="border:1px solid var(--border2);border-radius:6px;padding:1rem;background:var(--bg3);margin-top:1rem">
        <div style="font-family:'Cinzel',serif;font-size:0.85rem;color:var(--gold2);margin-bottom:0.75rem">Emote Bundle</div>
        <div class="form-group">
          <label>Upload Images <span style="color:var(--text3);font-weight:400">(select multiple files)</span></label>
          <input type="file" id="es-bulk-files" accept="image/*" multiple style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:5px;width:100%">
          <canvas id="es-bulk-canvas" style="display:none"></canvas>
        </div>
        <div class="form-group">
          <label>Paste Images <span style="color:var(--text3);font-weight:400">(click below then Ctrl+V)</span></label>
          <div id="es-paste-zone" tabindex="0" style="padding:1rem;border:2px dashed var(--border2);border-radius:6px;text-align:center;color:var(--text3);font-size:0.82rem;outline:none">Click here, then paste images with Ctrl+V</div>
        </div>
        <button class="btn" style="width:auto;padding:10px 24px" data-action="bulk-add-emotes">Upload to Set</button>
        <div id="es-bulk-alert" style="margin-top:0.4rem"></div>
        <div id="es-emote-list" style="max-height:360px;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:0.5rem;margin-top:0.75rem"></div>
      </div>

    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════ IMAGES -->
  <div class="admin-section" id="tab-images">
    <div class="admin-form">
      <h3>Upload Image</h3>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1rem">Select a category, configure the slot, pick a file. Auto-compressed to 340px JPEG.</p>
      <div id="img-alert"></div>

      <!-- Category sub-tabs -->
      <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:1rem">
        <button class="img-cat-btn active" data-action="img-cat" data-cat="all">All</button>
        <button class="img-cat-btn"        data-action="img-cat" data-cat="chars">Characters</button>
        <button class="img-cat-btn"        data-action="img-cat" data-cat="comps">Compositions</button>
        <button class="img-cat-btn"        data-action="img-cat" data-cat="tiles">Skills/Tiles</button>
        <button class="img-cat-btn"        data-action="img-cat" data-cat="other">Other</button>
      </div>

      <!-- Characters category -->
      <div id="imgcat-chars" style="display:none">
        <div class="form-row">
          <div class="form-group">
            <label>Character</label>
            <select id="img-char-sel" onchange="updateImgKey()">
              ${charSelectOptions || '<option value="rou">Rou</option><option value="seir">Seir</option><option value="lecliss">Lecliss</option><option value="scheherazade">Scheherazade</option><option value="sylvia">Sylvia</option>'}
            </select>
          </div>
          <div class="form-group">
            <label>Slot Type</label>
            <select id="img-slot-type" onchange="updateImgKey()">
              <option value="portrait">Portrait</option>
              <option value="gear">Gear</option>
              <option value="icon">Costume Icon</option>
            </select>
          </div>
        </div>
        <div id="img-costume-sel-wrap" style="display:none">
          <div class="form-group">
            <label>Costume</label>
            <select id="img-costume-slug-sel" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:6px;border-radius:4px;width:100%" onchange="updateImgKey()">
              <option value="">— Select Costume —</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Compositions category -->
      <div id="imgcat-comps" style="display:none">
        <div class="form-group">
          <label>Tier</label>
          <select id="img-comp-tier" onchange="updateImgKey()">
            ${[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(n => '<option value="T' + n + '">T' + n + '</option>').join('')}
          </select>
        </div>
        <p style="font-size:0.8rem;color:var(--text3)">Slot: Board Image (fixed)</p>
      </div>

      <!-- Skills/Tiles category -->
      <div id="imgcat-tiles" style="display:none">
        <div class="form-row">
          <div class="form-group">
            <label>Character</label>
            <select id="img-tile-char" onchange="updateImgKey()">
              <option value="Rou">Rou</option>
              <option value="Seir">Seir</option>
              <option value="Lecliss">Lecliss</option>
              <option value="Scheherazade">Scheherazade</option>
              <option value="Sylvia">Sylvia</option>
            </select>
          </div>
          <div class="form-group">
            <label>Slot Number</label>
            <select id="img-tile-slot" onchange="updateImgKey()">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Other category -->
      <div id="imgcat-other" style="display:none">
        <div class="form-group">
          <label>Custom Key</label>
          <input type="text" id="img-other-key" placeholder="my_image_key" oninput="updateImgKey()">
        </div>
      </div>

      <!-- Computed key display -->
      <div id="img-computed-key-display" style="margin-bottom:0.75rem;font-size:0.83rem;color:var(--text3)">
        Key: <span id="img-computed-key" style="color:var(--gold);font-family:monospace"></span>
      </div>

      <!-- File input -->
      <div class="form-group">
        <label>Image File</label>
        <input type="file" id="img-file" accept="image/*" onchange="previewImage(this)" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:10px 14px;border-radius:5px;width:100%">
      </div>

      <!-- Preview -->
      <div id="img-preview-wrap" style="display:none;margin-bottom:0.75rem">
        <img id="img-preview" style="height:280px;object-fit:contain;width:100%;background:var(--bg2);border-radius:6px;border:1px solid var(--border2)">
        <div id="img-preview-info" style="font-size:0.75rem;color:var(--text3);margin-top:0.25rem"></div>
      </div>

      <canvas id="compress-canvas" style="display:none"></canvas>
      <button class="btn" style="width:auto;padding:10px 24px;margin-top:0.5rem" onclick="uploadImage()">Upload Image</button>
    </div>

    <!-- Image grid -->
    <div class="admin-form">
      <h3>Uploaded Images (${images.length})</h3>
      <div class="img-grid" id="img-grid">
        ${imgGridHtml}
      </div>
    </div>

    <!-- Admin lightbox -->
    <div id="admin-lightbox" onclick="closeAdminLightbox()">
      <img id="admin-lightbox-img" src="" alt="">
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════════ CHARACTERS -->
  <div class="admin-section" id="tab-chars">
    <div style="display:grid;grid-template-columns:220px 1fr;gap:1.5rem;align-items:start">

      <!-- Left panel: character list -->
      <div class="admin-form">
        <h3>Characters</h3>
        <div id="char-alert"></div>
        <div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.5rem" id="admin-elem-filter">
          <button class="elem-dot-btn active" data-action="admin-elem-filter" data-elem="all"><span style="color:var(--gold);font-size:0.85rem">✦</span> All</button>
          ${['Light','Dark','Fire','Water','Wind'].map(el =>
            '<button class="elem-dot-btn" data-action="admin-elem-filter" data-elem="' + esc(el) + '" style="--el-c:' + (elemColorsServer[el]||'#888') + '"><img src="/img/element_' + esc(el.toLowerCase()) + '" class="img-err-hide" style="width:14px;height:14px;object-fit:contain;vertical-align:middle;margin-right:4px">' + esc(el) + '</button>'
          ).join('')}
        </div>
        <div id="char-list" style="max-height:320px;overflow-y:auto;display:flex;flex-direction:column;gap:0.4rem;margin-bottom:0.75rem">
          ${charsListHtml}
        </div>
        <button class="btn" style="width:100%;padding:8px" onclick="toggleAddCharForm()">+ Add Character</button>
        <div style="border-top:1px solid rgba(192,57,43,0.3);margin-top:0.75rem;padding-top:0.75rem">
          <div style="font-size:0.68rem;color:#e74c3c;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:0.4rem">&#9888; Danger Zone</div>
          <button class="btn-danger" style="width:100%;padding:6px;font-size:0.78rem" onclick="resetAllChars()">Reset All Characters &amp; Images</button>
          <div id="reset-chars-alert"></div>
          <button class="btn-danger" style="width:100%;padding:6px;font-size:0.78rem;margin-top:0.35rem" onclick="resetAllRotations()">Clear All Skill Rotations</button>
          <div id="reset-rotations-alert"></div>
        </div>
        <div id="add-char-form" style="display:none;margin-top:0.75rem">
          <div class="form-group"><label>Name</label><input id="new-char-name" placeholder="Rou" oninput="autoCharSlug()"></div>
          <div class="form-group"><label>Slug <span style="color:var(--text3);font-size:0.7rem">(auto-generated)</span></label><input id="new-char-slug" placeholder="rou" readonly style="background:var(--bg4);color:var(--text3);cursor:not-allowed"></div>
          <div class="form-group"><label>Element</label>
            <select id="new-char-element">
              <option value="Dark">Dark</option>
              <option value="Water">Water</option>
              <option value="Wind">Wind</option>
              <option value="Fire">Fire</option>
              <option value="Light">Light</option>
            </select>
          </div>
          <div class="form-group"><label>Status</label>
            <select id="new-char-status">
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>
          <div class="form-group">
            <label>Portrait Image <span style="color:var(--text3);font-size:0.7rem">(base character image)</span></label>
            <input type="file" id="new-char-portrait" accept="image/*" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:5px;width:100%">
            <canvas id="new-char-canvas" style="display:none"></canvas>
          </div>
          <div class="form-group">
            <label>Base Costume Name <span style="color:var(--text3);font-size:0.7rem">(optional — the default costume name shown in bonds, e.g. "Red Riding Hood")</span></label>
            <input id="new-char-base-costume" placeholder="Base costume name">
          </div>
          <button class="btn" onclick="addChar()">Add Character</button>
        </div>
      </div>

      <!-- Right panel: character detail -->
      <div id="char-detail" style="display:none">
        <div class="admin-form">
          <h3><span id="detail-char-name"></span></h3>

          <!-- Sub-tab buttons -->
          <div style="display:flex;gap:0.4rem;margin-bottom:1rem;flex-wrap:wrap">
            <button class="char-subtab-btn active" data-action="char-tab" data-subtab="costumes">Costumes</button>
            <button class="char-subtab-btn"        data-action="char-tab" data-subtab="skills">Skills</button>
            <button class="char-subtab-btn"        data-action="char-tab" data-subtab="images">Images</button>
          </div>

          <!-- Costumes sub-tab -->
          <div id="char-subtab-costumes">
            <div style="margin-bottom:1rem">
              <div class="form-row">
                <div class="form-group"><label>Costume Name</label><input id="cost-name" placeholder="Red Riding Hood" oninput="autoCostumeSlug()"></div>
                <div class="form-group"><label>Costume Slug <span style="color:var(--text3);font-size:0.7rem">(auto)</span></label><input id="cost-slug" placeholder="red_riding_hood" readonly style="background:var(--bg4);color:var(--text3);cursor:not-allowed"></div>
              </div>
              <div class="form-group">
                <label>Costume Image <span style="color:var(--text3);font-size:0.7rem">(optional — overrides portrait when this costume is picked)</span></label>
                <input type="file" id="cost-img" accept="image/*" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:5px;width:100%">
                <canvas id="cost-img-canvas" style="display:none"></canvas>
              </div>
              <div id="cost-alert"></div>
              <button class="btn" onclick="addCostume()">Add Costume</button>
            </div>
            <div id="costume-list" style="max-height:200px;overflow-y:auto;display:flex;flex-direction:column;gap:0.4rem"></div>
          </div>

          <!-- Skills sub-tab -->
          <div id="char-subtab-skills" style="display:none">
            <div class="form-group" style="margin-bottom:0.75rem">
              <label>Select Costume</label>
              <select id="skills-costume-sel" onchange="loadSkillsForCostume()"></select>
            </div>
            <div class="form-group" style="margin-bottom:0.75rem;border:1px solid var(--border2);border-radius:6px;padding:0.75rem;background:var(--bg4)">
              <label>Bond Stats <span style="color:var(--text3);font-size:0.7rem">(for selected costume)</span></label>
              <textarea id="skill-bond-stats" rows="2" placeholder="HP: +62.40%, DEF: +13.40%" style="margin-bottom:0.5rem"></textarea>
              <button class="btn" style="width:auto;padding:6px 16px" onclick="saveBondStats()">Save Bond Stats</button>
              <div id="bond-stats-alert"></div>
            </div>
            <div style="margin-bottom:1rem">
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
            </div>
            <canvas id="skill-tile-canvas" style="display:none"></canvas>
            <div id="skill-list" style="max-height:250px;overflow-y:auto;display:flex;flex-direction:column;gap:0.4rem"></div>
          </div>

          <!-- Images sub-tab -->
          <div id="char-subtab-images" style="display:none">
            <div class="form-group">
              <label>Slot</label>
              <select id="char-img-slot" onchange="updateCharImgKey()">
                <option value="portrait">Portrait</option>
                <option value="gear">Gear</option>
                <option value="icon">Costume Icon</option>
              </select>
            </div>
            <div id="char-img-costume-wrap" style="display:none">
              <div class="form-group">
                <label>Costume Slug</label>
                <input type="text" id="char-img-costume-slug" placeholder="costume_slug" oninput="updateCharImgKey()">
              </div>
            </div>
            <div id="char-img-computed-key" style="font-size:0.83rem;color:var(--text3);margin-bottom:0.75rem"></div>
            <input type="file" id="char-img-file" accept="image/*" onchange="previewCharImage(this)" style="display:none">
            <button class="btn" style="width:auto;padding:8px 20px" data-action="upload-trigger" data-slot="char-img">Upload Image</button>
            <div id="char-img-preview-wrap" style="display:none;margin-bottom:0.75rem">
              <img id="char-img-preview" style="height:200px;width:100%;object-fit:contain;background:var(--bg2);border-radius:6px;border:1px solid var(--border2)">
            </div>
            <canvas id="char-compress-canvas" style="display:none"></canvas>
            <div id="char-img-alert"></div>
            <div id="char-img-grid" style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:1rem"></div>
          </div>

        </div>
      </div>

    </div>
  </div>

  <!-- ══════════════════════════════════════════════════ HOME PAGE -->
  <div class="admin-section active" id="tab-homepage">
    <div class="admin-form">
      <h3>Home Page Strategy Notes</h3>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1rem">Edit the 4 strategy note cards shown on the home page.</p>
      ${[1,2,3,4].map(i =>
        '<div style="border:1px solid var(--border2);border-radius:6px;padding:1rem;margin-bottom:1rem">'
        + '<div class="form-row">'
        + '<div class="form-group"><label>Title (Card ' + i + ')</label><input type="text" id="home-note-title-' + i + '" placeholder="Strategy note title"></div>'
        + '</div>'
        + '<div class="form-group"><label>Content</label><textarea id="home-note-content-' + i + '" rows="4" placeholder="• Note line 1\n• Note line 2"></textarea></div>'
        + '<div id="home-note-alert-' + i + '"></div>'
        + '<button class="btn" style="width:auto;padding:8px 20px" data-action="home-note-save" data-slot="' + i + '">Save Card ' + i + '</button>'
        + '</div>'
      ).join('')}
    </div>
    <div class="admin-form">
      <h3>Overview Cards</h3>
      <p style="font-size:0.8rem;color:var(--text3)">Edit short descriptions and colors via the Compositions tab → select each comp.</p>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════ SETTINGS -->
  <div class="admin-section" id="tab-settings">
    <div class="admin-form">
      <h3>Emotes Page Lock Screen Hint</h3>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1rem">The hint shown on the locked emotes page (under "LOCATION: HOME") that points visitors to the home page secret. Newlines are preserved.</p>
      <div id="emote-lock-hint-alert"></div>
      <div class="form-group">
        <label>Hint Text</label>
        <textarea id="emote-lock-hint" rows="4" placeholder="e.g. One character keeps something unusual by their side...">${esc(emoteLockHint)}</textarea>
      </div>
      <button class="btn" style="width:auto;padding:10px 24px" data-action="save-emote-lock-hint">Save Hint</button>
    </div>

    <div class="admin-form" style="margin-top:1.5rem">
      <h3>Home Page Secret Code</h3>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1rem">Change the secret code visitors enter on the home page to unlock the secret emotes section.</p>
      <div id="secret-code-alert"></div>
      <div class="form-group">
        <label>New Secret Code <span style="color:var(--text3);font-size:0.7rem">(min 4 characters)</span></label>
        <input type="text" id="new-secret-code" placeholder="e.g. Seji404" autocomplete="off">
      </div>
      <button class="btn" style="width:auto;padding:10px 24px" data-action="save-secret-code">Save Secret Code</button>
    </div>

    <div class="admin-form" style="margin-top:1.5rem">
      <h3>Emote Set Configuration</h3>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1.25rem">Configure the unlock mechanic, hint, and letter for each of the six emote sets.</p>
      <div class="form-group" style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:0">
        <label style="margin:0;white-space:nowrap">Set</label>
        <select id="settings-emote-set-select" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:5px;width:220px">
          <option value="1">Set 1</option><option value="2">Set 2</option><option value="3">Set 3</option>
          <option value="4">Set 4</option><option value="5">Set 5</option><option value="6">Set 6</option>
        </select>
      </div>
      <div style="border:1px solid var(--border2);border-radius:6px;padding:1rem;background:var(--bg3);margin-top:1rem">
        <div class="form-row">
          <div class="form-group">
            <label>Display Name <span style="font-size:0.7rem;font-weight:400;color:var(--text3)">(shown on emotes page)</span></label>
            <input type="text" id="set-cfg-name" placeholder="S">
          </div>
          <div class="form-group">
            <label>Set Letter <span style="font-size:0.7rem;font-weight:400;color:var(--text3)">(used in sequence mechanic)</span></label>
            <input type="text" id="set-cfg-letter" placeholder="S" maxlength="4">
          </div>
        </div>
        <div style="font-size:0.78rem;color:var(--gold);font-family:'Cinzel',serif;margin-bottom:0.4rem" id="set-cfg-location-display">Location: Characters</div>
        <div class="form-group">
          <label>Hint <span style="font-size:0.7rem;font-weight:400;color:var(--text3)">(shown when player clicks a locked set)</span></label>
          <textarea id="set-cfg-hint" rows="4" placeholder="Write a riddle or clue..."></textarea>
        </div>
        <!-- Hidden page field — auto-set by JS, not editable (placements are fixed) -->
        <input type="hidden" id="set-cfg-page" value="characters">

        <div class="form-group">
          <label>Unlock Mode</label>
          <select id="set-cfg-mode" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:5px;width:100%">
            <option value="count">Count (click element N times)</option>
            <option value="sequence">Sequence (elements in exact order)</option>
            <option value="letter_sequence">Letter Sequence (click set cards)</option>
            <option value="who_am_i">Who Am I? (ghost portrait)</option>
            <option value="nav_icon_tap">Nav Icon Tap (Mamonir icon in navbar)</option>
          </select>
        </div>

        <!-- Count / sequence fields -->
        <div id="set-cfg-target-wrap" class="form-row">
          <div class="form-group">
            <label id="set-cfg-target-label">Element Target</label>
            <div class="elem-picker" style="position:relative">
              <input type="hidden" id="set-cfg-target" value="">
              <button type="button" id="set-cfg-target-btn" data-action="elem-picker-toggle" style="display:flex;align-items:center;gap:8px;width:100%;background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:5px;cursor:pointer;text-align:left;font-family:inherit">
                <span id="set-cfg-target-display" style="display:flex;align-items:center;gap:8px;flex:1">— Select Element —</span>
                <span style="color:var(--text3)">▾</span>
              </button>
              <div id="set-cfg-target-menu" style="display:none;position:absolute;top:100%;left:0;right:0;margin-top:2px;background:var(--bg2);border:1px solid var(--border);border-radius:5px;z-index:50;box-shadow:0 6px 20px rgba(0,0,0,0.5)">
                <div class="elem-opt" data-elem="water" style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer"><img src="/img/element_water" class="img-err-hide" style="width:18px;height:18px;object-fit:contain">Water</div>
                <div class="elem-opt" data-elem="fire" style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer"><img src="/img/element_fire" class="img-err-hide" style="width:18px;height:18px;object-fit:contain">Fire</div>
                <div class="elem-opt" data-elem="light" style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer"><img src="/img/element_light" class="img-err-hide" style="width:18px;height:18px;object-fit:contain">Light</div>
                <div class="elem-opt" data-elem="dark" style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer"><img src="/img/element_dark" class="img-err-hide" style="width:18px;height:18px;object-fit:contain">Dark</div>
                <div class="elem-opt" data-elem="wind" style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer"><img src="/img/element_wind" class="img-err-hide" style="width:18px;height:18px;object-fit:contain">Wind</div>
              </div>
            </div>
          </div>
          <div id="set-cfg-count-wrap" class="form-group">
            <label>Click Count</label>
            <input type="number" id="set-cfg-count" min="1" max="99" value="7">
          </div>
        </div>
        <div id="set-cfg-sequence-wrap" class="form-group" style="display:none">
          <label id="set-cfg-sequence-label">Sequence</label>
          <!-- Hidden input keeps the comma-separated value for saving -->
          <input type="hidden" id="set-cfg-sequence">
          <div id="set-cfg-sequence-selects" style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.25rem">
            <!-- 5 positional selects built by updateSetCfgModeUI -->
          </div>
          <div id="set-cfg-sequence-note" style="font-size:0.7rem;color:var(--text3);margin-top:0.25rem"></div>
        </div>

        <!-- Who Am I fields (shown for who_am_i mode) -->
        <div id="set-cfg-who-am-i-wrap" style="display:none">
          <div class="form-group">
            <label>Ghost Portrait Character <span style="font-size:0.7rem;font-weight:400;color:var(--text3)">(character whose dropdown shows "Who Am I?")</span></label>
            <select id="set-cfg-wai-char" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:5px;width:100%">
              <option value="">— Loading characters... —</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.75rem">
            <div id="set-cfg-wai-portrait" style="width:90px;height:90px;border:1px solid var(--border2);border-radius:8px;background:var(--bg4);overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <span style="font-size:0.65rem;color:var(--text3);text-align:center">No portrait</span>
            </div>
            <div style="font-size:0.72rem;color:var(--text3);line-height:1.6">Portrait preview — change above to update</div>
          </div>
          <div class="form-group">
            <label>Correct Answer <span style="font-size:0.7rem;font-weight:400;color:var(--text3)">(what player must type to unlock)</span></label>
            <input type="text" id="set-cfg-wai-answer" placeholder="e.g. Synae">
            <div style="font-size:0.7rem;color:var(--text3);margin-top:0.25rem">Case-insensitive. The name the player enters in the "Who Am I?" input.</div>
          </div>
        </div>
        <!-- Unlock Reveal (image + message) -->
        <div style="border:1px solid var(--border2);border-radius:6px;padding:0.85rem 1rem;background:rgba(46,204,113,0.04);margin-top:1rem">
          <div style="font-family:'Cinzel',serif;font-size:0.78rem;color:#2ecc71;letter-spacing:0.08em;margin-bottom:0.6rem">UNLOCK REVEAL</div>
          <p style="font-size:0.72rem;color:var(--text3);margin-bottom:0.75rem">Shown to the player after they unlock this set. Both fields are optional.</p>
          <div class="form-group">
            <label>Unlock Message <span style="font-size:0.7rem;font-weight:400;color:var(--text3)">(text displayed in the popup)</span></label>
            <textarea id="set-cfg-unlock-msg" rows="3" placeholder="e.g. The figure could not withstand your persistence. This set is now yours."></textarea>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label>Unlock Image <span style="font-size:0.7rem;font-weight:400;color:var(--text3)">(shown above the message)</span></label>
            <div style="display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap;margin-top:0.4rem">
              <div style="width:90px;height:90px;border:1px solid var(--border2);border-radius:6px;background:var(--bg4);overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <img id="set-cfg-unlock-img-preview" src="" class="img-err-hide" style="width:100%;height:100%;object-fit:contain">
              </div>
              <div style="flex:1;min-width:200px">
                <input type="file" id="set-cfg-unlock-img-file" accept="image/*" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:5px;width:100%">
                <canvas id="set-cfg-unlock-img-canvas" style="display:none"></canvas>
                <div style="display:flex;gap:0.5rem;margin-top:0.4rem;flex-wrap:wrap">
                  <button class="btn" style="width:auto;padding:6px 16px;font-size:0.8rem" data-action="upload-unlock-img">Upload Image</button>
                  <button class="btn" style="width:auto;padding:6px 16px;font-size:0.8rem;background:var(--bg4);color:var(--text3)" data-action="clear-unlock-img">Clear Image</button>
                  <span id="set-cfg-unlock-img-alert" style="font-size:0.75rem;align-self:center"></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="set-cfg-alert" style="font-size:0.78rem;margin-bottom:0.5rem;margin-top:1rem;min-height:1.2em"></div>
        <button class="btn" style="width:auto;padding:8px 20px" data-action="save-set-cfg">Save Set Configuration</button>
      </div>

      <div class="card" style="margin-top:1rem">
        <div style="font-family:'Cinzel',serif;font-size:0.85rem;color:var(--gold2);margin-bottom:0.5rem">Testing / Reset Local State</div>
        <p style="font-size:0.78rem;color:var(--text3);margin-bottom:0.75rem">Clears the localStorage flags used by Kitsu's emotes lock flow for THIS browser only. Use when testing the page lock and per-set unlock mechanics.</p>
        <div id="kitsu-reset-alert" style="font-size:0.78rem;margin-bottom:0.5rem;min-height:1.2em"></div>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
          <button class="btn-danger" style="width:auto;padding:6px 14px;font-size:0.78rem" data-action="kitsu-reset-page">Re-lock Page (clear kitsu_unlocked)</button>
          <button class="btn-danger" style="width:auto;padding:6px 14px;font-size:0.78rem" data-action="kitsu-reset-sets">Re-lock All Sets (clear kitsu_set_*)</button>
          <button class="btn-danger" style="width:auto;padding:6px 14px;font-size:0.78rem" data-action="kitsu-reset-all">Reset Everything (page + sets + click trackers)</button>
        </div>
      </div>

      <div class="card" style="margin-top:1rem">
        <div style="font-family:'Cinzel',serif;font-size:0.85rem;color:var(--gold2);margin-bottom:0.5rem">Nav Icon Settings</div>
        <p style="font-size:0.78rem;color:var(--text3);margin-bottom:0.75rem">The Mamonir icon appears in the navigation bar. Configure how many taps are required before it falls and unlocks Set 3 (K).</p>
        <div class="form-group">
          <label style="font-size:0.78rem">Taps to Fall (default 7)</label>
          <input type="number" id="mamonir-tap-count" min="1" max="99" value="${mamonirTapCount}" style="width:100px;background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:5px">
        </div>
        <div class="form-group" style="margin-top:0.6rem">
          <label style="font-size:0.78rem">Replace Nav Icon Image (PNG/WEBP)</label>
          <div style="display:flex;align-items:center;gap:0.75rem;margin-top:0.25rem">
            <img src="/img/mamonir_nav" alt="" class="img-err-hide" style="width:48px;height:48px;object-fit:contain;background:var(--bg2);border:1px solid var(--border2);border-radius:4px">
            <input type="file" id="mamonir-nav-file" accept="image/*" style="flex:1;font-size:0.78rem;color:var(--text2)">
            <button class="btn" style="width:auto;padding:6px 14px;font-size:0.78rem" data-action="upload-mamonir-nav">Upload</button>
          </div>
          <div style="font-size:0.7rem;color:var(--text3);margin-top:0.25rem">Stored under key <code>mamonir_nav</code>. Hard-refresh any page to see the new icon.</div>
        </div>
        <div id="nav-icon-alert" style="font-size:0.78rem;margin-bottom:0.5rem;min-height:1.2em"></div>
        <button class="btn" style="width:auto;padding:8px 20px" data-action="save-nav-icon-settings">Save Nav Icon Settings</button>
      </div>
    </div>

  </div>
</div>

<style>
.img-cat-btn { display:inline-block; background:var(--bg4); border:1px solid var(--border2); color:var(--text2); padding:6px 12px; border-radius:4px; font-size:0.8rem; cursor:pointer; }
.img-cat-btn.active { background:rgba(201,168,76,0.15); border-color:var(--gold); color:var(--gold); }
.char-subtab-btn { display:inline-block; background:var(--bg4); border:1px solid var(--border2); color:var(--text2); padding:5px 12px; border-radius:4px; font-size:0.78rem; cursor:pointer; }
.char-subtab-btn.active { background:rgba(201,168,76,0.15); border-color:var(--gold); color:var(--gold); }
.elem-dot-btn { display:inline-block; background:var(--bg4); border:1px solid var(--el-c,var(--border2)); color:var(--el-c,var(--text2)); padding:3px 9px; border-radius:12px; font-size:0.72rem; cursor:pointer; opacity:0.65; transition:opacity 0.15s; }
.elem-dot-btn.active { opacity:1; background:rgba(201,168,76,0.08); font-weight:700; }
.char-row { display:flex; align-items:center; gap:0.5rem; padding:0.5rem 0.75rem; background:var(--bg4); border-radius:5px; cursor:pointer; border:1px solid transparent; }
.char-row:hover { border-color:var(--border2); }
.char-row.selected { border-color:var(--gold); background:rgba(201,168,76,0.08); }
.elem-dot { display:inline-block; width:8px; height:8px; border-radius:50%; flex-shrink:0; }
#admin-lightbox { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.87); z-index:9999; align-items:center; justify-content:center; cursor:zoom-out; }
#admin-lightbox.open { display:flex; }
#admin-lightbox img { max-width:90vw; max-height:90vh; object-fit:contain; border-radius:8px; }
.img-err-hide { }
.img-err-hide.errored { display:none; }
.img-err-dim.errored { opacity:0.2; }
.elem-opt:hover { background:var(--bg3); }
</style>

<script>
/* ═══════════════════════════════════════════════════════ STATE VARS ══ */
var _selectedCharId   = 0;
var _selectedCharSlug = '';
var _selectedCharName = '';
var _selectedCostumeSlug = '';
var _compTier = '';
var _compId = 0;
var _compBoardKey = '';
var _imgCat = 'all';

var _bondedCharNames  = [];   // names of currently set bond chars (for gating)
var _bondsPendingSlot = null; // which slot index (0-4) is being assigned in modal
var _bondsPendingChar = null; // { name, slug } being confirmed
var _bondsModalChars  = [];   // all chars loaded for bonds modal
var _bondsSelections  = [null,null,null,null,null]; // {name, slug, costume} per slot
var _currentUnitOrder = [];
var _bondsCurElem     = 'all';

var elemColors = { Light:'#F4D03F', Dark:'#8E44AD', Water:'#2E86C1', Wind:'#27AE60', Fire:'#C0392B' };

/* ═══════════════════════════════════════════════════════════ HELPERS ══ */
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

function compressToDataUrl(file, canvasId, maxW, quality) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var scale = img.width > maxW ? maxW / img.width : 1;
        var canvas = document.getElementById(canvasId);
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

/* ══════════════════════════════════════════════════════ TAB SWITCHING ══ */
function showTab(name) {
  document.querySelectorAll('.admin-section').forEach(function(s) { s.classList.remove('active'); });
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  var t = document.getElementById('tab-' + name);
  if (t) t.classList.add('active');
  var btn = document.querySelector('[data-tab="' + name + '"]');
  if (btn) btn.classList.add('active');
  if (name === 'chars')    loadChars();
  if (name === 'images')   updateImgKey();
  if (name === 'homepage') loadHomeNotes();
  if (name === 'settings') loadEmoteSets();
}

/* ══════════════════════════════════════════════════════════ COUPONS ══ */
async function addCoupon() {
  var code    = ((document.getElementById('c-code')    || {}).value || '').trim();
  var rewards = ((document.getElementById('c-rewards') || {}).value || '').trim();
  var expiry  = ((document.getElementById('c-expiry')  || {}).value || '').trim();
  if (!code) { showAlert('coupon-alert', false, 'Code is required'); return; }
  var r = await apiPost('/api/admin/coupon/add', { code: code, rewards: rewards, expiry: expiry || null });
  showAlert('coupon-alert', r.success, r.message);
  if (r.success) {
    document.getElementById('c-code').value    = '';
    document.getElementById('c-rewards').value = '';
    document.getElementById('c-expiry').value  = '';
    var div = document.createElement('div');
    div.className = 'admin-item';
    div.id = 'coupon-' + r.id;
    div.innerHTML = '<div class="admin-item-info"><strong>' + escH(code) + '</strong> &mdash; ' + escH(rewards) + ' &middot; Active</div>'
      + '<button class="btn-danger" data-action="coupon-delete" data-id="' + r.id + '">Delete</button>';
    var list = document.getElementById('coupon-list');
    if (list) list.prepend(div);
  }
}

async function deleteCoupon(id) {
  var r = await apiPost('/api/admin/coupon/delete', { id: id });
  if (r.success) { var el = document.getElementById('coupon-' + id); if (el) el.remove(); }
  else showAlert('coupon-alert', false, r.message);
}

/* ══════════════════════════════════════════════════════ COMPOSITIONS ══ */
function selectComp() {
  var sel       = document.getElementById('comp-select');
  var val       = sel ? sel.value : '';
  var editorEl  = document.getElementById('comp-editor');
  var addFormEl = document.getElementById('comp-add-form');
  var labelEl   = document.getElementById('comp-editor-tier-label');
  var boardLbl  = document.getElementById('comp-board-label');

  if (!val) {
    if (editorEl)  editorEl.style.display  = 'none';
    if (addFormEl) addFormEl.style.display = 'none';
    return;
  }
  if (val === 'new') {
    if (editorEl)  editorEl.style.display  = 'none';
    if (addFormEl) addFormEl.style.display = 'block';
    return;
  }

  if (addFormEl) addFormEl.style.display = 'none';
  if (editorEl)  editorEl.style.display  = 'block';

  _compId   = parseInt(val, 10) || 0;
  _compTier = sel.options[sel.selectedIndex] ? (sel.options[sel.selectedIndex].dataset.tier || '') : '';
  _compBoardKey = _compTier === 'T1' ? 'board_pos' : 'comp_' + _compTier.toLowerCase() + '_board';

  if (labelEl) labelEl.textContent = _compTier + ' — Editing content';
  if (boardLbl) boardLbl.textContent = 'Board Image (key: ' + _compBoardKey + ')';

  try { loadCompData(_compId);     } catch(e) { console.error('loadCompData', e); }
  try { loadCompChars();           } catch(e) { console.error('loadCompChars', e); }
  try { loadCompMedia(_compTier);  } catch(e) { console.error('loadCompMedia', e); }
  try { loadCompRotation();        } catch(e) { console.error('loadCompRotation', e); }
  try { loadHowToPlay(_compTier);  } catch(e) { console.error('loadHowToPlay', e); }
  try { loadPreemptive(_compTier); } catch(e) { console.error('loadPreemptive', e); }
  try { loadMatchups(_compTier);   } catch(e) { console.error('loadMatchups', e); }
  // Reset gear section when switching comps
  var gearPrev = document.getElementById('comp-gear-preview');
  if (gearPrev) gearPrev.style.display = 'none';
  var gearSel = document.getElementById('comp-gear-char-sel');
  if (gearSel) gearSel.value = '';
}
window.selectComp = selectComp;

async function uploadCompBoard(suffix, fileInputId, canvasId, previewId) {
  suffix    = suffix    || '';
  fileInputId = fileInputId || 'comp-board-file';
  canvasId  = canvasId  || 'comp-canvas';
  previewId = previewId || 'comp-board-preview';
  var fileEl = document.getElementById(fileInputId);
  var file = fileEl && fileEl.files[0];
  if (!file) { showAlert('comp-editor-alert', false, 'Select an image file'); return; }
  if (!_compTier) { showAlert('comp-editor-alert', false, 'Select a composition first'); return; }
  showAlert('comp-editor-alert', true, 'Compressing…');
  var data = await compressToDataUrl(file, canvasId, 340, 0.85);
  var r = await apiPost('/api/admin/comp/board/save', { tier: _compTier, data: data, suffix: suffix });
  showAlert('comp-editor-alert', r.success, r.message || (r.success ? 'Uploaded!' : 'Error'));
  if (r.success) {
    var preview = document.getElementById(previewId);
    if (preview) {
      preview.innerHTML = '<img src="' + escH(data) + '" style="max-height:180px;object-fit:contain;border-radius:4px;border:1px solid var(--border2);margin-top:0.25rem">';
    }
    if (fileEl) fileEl.value = '';
  }
}

async function saveHowToPlay() {
  if (!_compTier) { showAlert('comp-howtoplay-alert', false, 'Select a composition first'); return; }
  var content = ((document.getElementById('comp-how-to-play')||{}).value||'').trim();
  var r = await apiPost('/api/admin/comp/howtoplay/save', { tier: _compTier, content: content });
  showAlert('comp-howtoplay-alert', r.success, r.message);
}

async function loadHowToPlay(tier) {
  try {
    var res  = await fetch('/api/admin/comp/howtoplay/get?tier=' + encodeURIComponent(tier));
    var data = await res.json();
    var el = document.getElementById('comp-how-to-play');
    if (el) el.value = data.content || '';
  } catch(e) {}
}

async function loadPreemptive(tier) {
  try {
    var res  = await fetch('/api/admin/comp/preemptive/get?tier=' + encodeURIComponent(tier));
    var data = await res.json();
    renderPreemptiveList(data.items || []);
  } catch(e) {}
}

function renderPreemptiveList(items) {
  var list = document.getElementById('preemptive-list');
  if (!list) return;
  if (!items.length) { list.innerHTML = '<span style="color:var(--text3);font-size:0.82rem">No images yet.</span>'; return; }
  list.innerHTML = items.map(function(src, i) {
    return '<div style="position:relative;display:inline-block">'
      + '<img src="' + escH(src) + '" style="height:48px;width:auto;object-fit:contain;border-radius:4px;border:1px solid var(--border2)">'
      + '<button class="btn-danger" data-action="preemptive-delete" data-index="' + i + '" style="position:absolute;top:-4px;right:-4px;font-size:0.65rem;padding:1px 4px;border-radius:50%;line-height:1">×</button>'
      + '</div>';
  }).join('');
}

async function addPreemptive() {
  if (!_compTier) { showAlert('comp-preemptive-alert', false, 'Select a composition first'); return; }
  var fileEl = document.getElementById('preemptive-file');
  var file = fileEl && fileEl.files[0];
  if (!file) { showAlert('comp-preemptive-alert', false, 'Select an image file'); return; }
  showAlert('comp-preemptive-alert', true, 'Compressing…');
  var data = await compressToDataUrl(file, 'preemptive-canvas', 200, 0.85);
  var r = await apiPost('/api/admin/comp/preemptive/add', { tier: _compTier, data: data });
  showAlert('comp-preemptive-alert', r.success, r.message || (r.success ? 'Added!' : 'Error'));
  if (r.success) { if (fileEl) fileEl.value = ''; loadPreemptive(_compTier); }
}

async function deletePreemptive(index) {
  if (!_compTier) return;
  var r = await apiPost('/api/admin/comp/preemptive/delete', { tier: _compTier, index: index });
  showAlert('comp-preemptive-alert', r.success, r.message);
  if (r.success) loadPreemptive(_compTier);
}

async function loadMatchups(tier) {
  try {
    var res = await fetch('/api/admin/comp/matchups/get?tier=' + encodeURIComponent(tier) + '&id=' + _compId);
    var data = await res.json();
    var countersEl = document.getElementById('comp-counters');
    var cbyEl      = document.getElementById('comp-countered-by');
    if (countersEl) countersEl.value = data.counters || '';
    if (cbyEl)      cbyEl.value      = data.countered_by || '';
  } catch(e) {}
}

async function saveMatchups() {
  if (!_compId || !_compTier) { showAlert('comp-matchups-alert', false, 'Select a composition first'); return; }
  var counters = ((document.getElementById('comp-counters')||{}).value||'').trim();
  var cby      = ((document.getElementById('comp-countered-by')||{}).value||'').trim();
  var r = await apiPost('/api/admin/comp/matchups/save', { tier: _compTier, id: _compId, counters: counters, countered_by: cby });
  showAlert('comp-matchups-alert', r.success, r.message);
  if (r.success) {
    var sel = document.getElementById('comp-select');
    var opt = sel ? sel.options[sel.selectedIndex] : null;
    if (opt) opt.dataset.cby = cby;
  }
}


async function uploadSkillTile(skillId) {
  if (!_selectedCharSlug) { showAlert('skill-alert', false, 'Select a character first'); return; }
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async function() {
    if (!input.files || !input.files[0]) return;
    showAlert('skill-alert', true, 'Uploading tile...');
    try {
      var data = await compressToDataUrl(input.files[0], 'skill-tile-canvas', 128, 0.9);
      var key  = 'char_skill_' + _selectedCharSlug + '_' + skillId;
      var r    = await apiPost('/api/admin/image/upload', { key: key, data: data });
      showAlert('skill-alert', r.success, r.message || (r.success ? 'Tile uploaded!' : 'Error'));
      if (r.success) {
        var img = document.querySelector('#skill-' + skillId + ' .skill-tile-img');
        if (img) { img.src = '/img/' + key + '?t=' + Date.now(); img.classList.remove('errored'); }
      }
    } catch(e) { showAlert('skill-alert', false, 'Upload failed'); }
  };
  input.click();
}

async function saveCompVideo() {
  var urlEl = document.getElementById('comp-video-url');
  var url = urlEl ? urlEl.value.trim() : '';
  if (!_compTier) { showAlert('comp-video-alert', false, 'Select a composition first'); return; }
  var r = await apiPost('/api/admin/comp/media/save', { tier: _compTier, media_type: 'video', value: url });
  showAlert('comp-video-alert', r.success, r.message || (r.success ? 'Saved!' : 'Error'));
}

async function uploadCompVideoFile() {
  if (!_compTier) { showAlert('comp-video-alert', false, 'Select a composition first'); return; }
  var fileEl = document.getElementById('comp-video-file');
  var file   = fileEl && fileEl.files && fileEl.files[0];
  if (!file) { showAlert('comp-video-alert', false, 'Select a video file'); return; }
  if (file.size > 12 * 1024 * 1024) { showAlert('comp-video-alert', false, 'Video too large (' + (file.size/1024/1024).toFixed(1) + ' MB). Keep under ~12 MB.'); return; }
  showAlert('comp-video-alert', true, 'Reading video…');
  var dataUrl = await new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload  = function() { resolve(reader.result); };
    reader.onerror = function() { reject(reader.error); };
    reader.readAsDataURL(file);
  }).catch(function() { return ''; });
  if (!dataUrl) { showAlert('comp-video-alert', false, 'Could not read file'); return; }
  var key = 'comp_' + _compTier.toLowerCase() + '_video';
  showAlert('comp-video-alert', true, 'Uploading…');
  var r = await apiPost('/api/admin/image/upload', { key: key, data: dataUrl });
  if (!r.success) { showAlert('comp-video-alert', false, r.message); return; }
  var videoUrl = '/img/' + key;
  var urlEl = document.getElementById('comp-video-url');
  if (urlEl) urlEl.value = videoUrl;
  var r2 = await apiPost('/api/admin/comp/media/save', { tier: _compTier, media_type: 'video', value: videoUrl });
  showAlert('comp-video-alert', r2.success, r2.success ? 'Video uploaded and saved.' : r2.message);
  if (r2.success && fileEl) fileEl.value = '';
}

async function loadCompMedia(tier) {
  try {
    var res  = await fetch('/api/admin/comp/media/get?tier=' + encodeURIComponent(tier));
    var data = await res.json();
    var urlEl = document.getElementById('comp-video-url');
    if (urlEl) urlEl.value = data.video || '';
    var tierLow = tier.toLowerCase();
    var frontKey = 'comp_' + tierLow + '_board';
    var backKey  = 'comp_' + tierLow + '_board_back';
    var preview = document.getElementById('comp-board-preview');
    if (preview) {
      preview.innerHTML = '<img src="/img/' + escH(frontKey) + '" class="img-err-hide" style="max-height:180px;object-fit:contain;border-radius:4px;border:1px solid var(--border2);margin-top:0.25rem">';
    }
    var backPreview = document.getElementById('comp-board-back-preview');
    if (backPreview) {
      backPreview.innerHTML = '<img src="/img/' + escH(backKey) + '" class="img-err-hide" style="max-height:180px;object-fit:contain;border-radius:4px;border:1px solid var(--border2);margin-top:0.25rem">';
    }
  } catch(e) {}
}

async function addComp() {
  var tier  = ((document.getElementById('new-comp-tier')  || {}).value || '').trim().toUpperCase() || 'T1';
  var name  = ((document.getElementById('new-comp-name') || {}).value || '').trim();
  var type  = (document.getElementById('new-comp-type')  || {}).value || 'ATK';
  var desc  = ((document.getElementById('new-comp-desc') || {}).value || '').trim();
  var cby   = ((document.getElementById('new-comp-cby')  || {}).value || '').trim();
  if (!name) { showAlert('comp-add-alert', false, 'Name is required'); return; }
  var r = await apiPost('/api/admin/comp/add', { tier: tier, name: name, type: type, description: desc, countered_by: cby, last_updated: new Date().toISOString().slice(0,10) });
  showAlert('comp-add-alert', r.success, r.message);
  if (r.success) {
    document.getElementById('new-comp-name').value = '';
    document.getElementById('new-comp-desc').value = '';
    var isAtk = type === 'ATK';
    var badgeStyle = isAtk
      ? 'background:rgba(41,128,185,0.2);color:#5dade2;border:1px solid rgba(41,128,185,0.35)'
      : 'background:rgba(39,174,96,0.2);color:#2ecc71;border:1px solid rgba(39,174,96,0.35)';
    var badgeText = isAtk ? '&#9876; ATK' : '&#128737; DEF';
    var div = document.createElement('div');
    div.className = 'admin-item';
    div.id = 'comp-' + r.id;
    div.innerHTML = '<div class="admin-item-info"><strong>' + escH(tier) + ' &mdash; ' + escH(name) + '</strong>'
      + '<span style="display:inline-block;margin-left:0.5rem;font-size:0.72rem;padding:2px 8px;border-radius:3px;' + badgeStyle + '">' + badgeText + '</span></div>'
      + '<button class="btn-danger" data-action="comp-delete" data-id="' + r.id + '">Delete</button>';
    var list = document.getElementById('comp-list');
    if (list) list.prepend(div);
    var compSel = document.getElementById('comp-select');
    if (compSel) {
      var opt = document.createElement('option');
      opt.value = 'db-' + r.id;
      opt.dataset.tier = tier;
      opt.textContent = tier + ' — ' + name + ' (' + type + ')';
      var newOpt = compSel.querySelector('option[value="new"]');
      if (newOpt) compSel.insertBefore(opt, newOpt);
      else compSel.appendChild(opt);
    }
  }
}

async function deleteComp(id) {
  var r = await apiPost('/api/admin/comp/delete', { id: id });
  if (r.success) { var el = document.getElementById('comp-' + id); if (el) el.remove(); }
  else showAlert('comp-add-alert', false, r.message);
}

async function loadCompData(id) {
  if (!id) return;
  try {
    var charsRes = await fetch('/api/admin/chars/list');
    var charsData = await charsRes.json();
    var allChars = charsData.chars || [];

    var sel = document.getElementById('comp-select');
    var opt = sel ? sel.options[sel.selectedIndex] : null;
    if (!opt) return;

    var nameEl = document.getElementById('comp-name');
    if (nameEl && opt.dataset.name !== undefined) nameEl.value = opt.dataset.name;
    var colorEl = document.getElementById('comp-color');
    if (colorEl && opt.dataset.color) colorEl.value = opt.dataset.color;
    var sdRaw = opt.dataset.shortDesc || '';
    var labelTextEl  = document.getElementById('comp-card-label');
    if (labelTextEl) labelTextEl.value = sdRaw;
    var guideLabelRaw = opt.dataset.guideLabel || '';
    var guideLabelColorEl = document.getElementById('comp-guide-label-color');
    var guideLabelTextEl  = document.getElementById('comp-guide-label');
    if (guideLabelColorEl && guideLabelTextEl) {
      var glMatch = guideLabelRaw.match(/^(green|red):(.*)$/s);
      if (glMatch) { guideLabelColorEl.value = glMatch[1]; guideLabelTextEl.value = glMatch[2]; }
      else { guideLabelColorEl.value = ''; guideLabelTextEl.value = guideLabelRaw; }
    }
    var notesEl = document.getElementById('comp-build-notes');
    if (notesEl && opt.dataset.notes !== undefined) notesEl.value = opt.dataset.notes;

    var currentOrder = [];
    try { currentOrder = JSON.parse(opt.dataset.unitOrder || '[]'); } catch(e) {}
    _currentUnitOrder = currentOrder.slice(0, 5);
    updateUnitOrderSummary();
  } catch(e) {}
}

async function saveAllComp() {
  if (!_compId) { showAlert('comp-save-all-alert', false, 'Select a composition first'); return; }
  var alertEl = document.getElementById('comp-save-all-alert');
  if (alertEl) { alertEl.style.color = 'var(--text3)'; alertEl.textContent = 'Saving...'; }
  var errors = [];
  try { await saveCompMeta(); } catch(e) { errors.push('Notes/Color'); }
  try { await saveCompUnitOrder(); } catch(e) { errors.push('Unit Order'); }
  try { await saveMatchups(); } catch(e) { errors.push('Matchups'); }
  try { await saveHowToPlay(); } catch(e) { errors.push('How To Play'); }
  if (alertEl) {
    alertEl.style.color = errors.length ? '#e74c3c' : '#2ecc71';
    alertEl.textContent = errors.length ? 'Some saves failed: ' + errors.join(', ') : 'All saved! Refresh guide to see changes.';
    setTimeout(function() { if (alertEl) alertEl.textContent = ''; }, 4000);
  }
}

async function saveCardLabel() {
  if (!_compId) { showAlert('comp-card-label-alert', false, 'Select a composition first'); return; }
  var labelText = ((document.getElementById('comp-card-label')||{}).value||'').trim();
  var sel  = document.getElementById('comp-select');
  var opt  = sel ? sel.options[sel.selectedIndex] : null;
  var name = opt ? opt.dataset.name  || '' : '';
  var type = opt ? opt.dataset.type  || 'ATK' : 'ATK';
  var color= opt ? opt.dataset.color || '#c9a84c' : '#c9a84c';
  var cby  = opt ? opt.dataset.cby   || '' : '';
  var notes= opt ? opt.dataset.notes || '' : '';
  var uorder = opt ? opt.dataset.unitOrder || '[]' : '[]';
  var r = await apiPost('/api/admin/comp/update', { id: _compId, name: name, type: type, color: color, short_description: labelText, description: notes, countered_by: cby, unit_order: uorder });
  if (r.success && opt) opt.dataset.shortDesc = labelText;
  var el = document.getElementById('comp-card-label-alert');
  if (el) {
    el.style.color = r.success ? '#2ecc71' : '#e74c3c';
    el.textContent = r.success ? '✓ Saved — refresh home page to see' : (r.message || 'Error');
    setTimeout(function() { el.textContent = ''; }, 3500);
  }
}

async function saveGuideLabel() {
  if (!_compId) { showAlert('comp-guide-label-alert', false, 'Select a composition first'); return; }
  var labelColor = ((document.getElementById('comp-guide-label-color')||{}).value||'').trim();
  var labelText  = ((document.getElementById('comp-guide-label')||{}).value||'').trim();
  var gl = labelText ? (labelColor ? labelColor + ':' + labelText : labelText) : '';
  var r = await apiPost('/api/admin/comp/guide-label', { id: _compId, guide_label: gl });
  var sel = document.getElementById('comp-select');
  var opt = sel ? sel.options[sel.selectedIndex] : null;
  if (r.success && opt) opt.dataset.guideLabel = gl;
  var el = document.getElementById('comp-guide-label-alert');
  if (el) {
    el.style.color = r.success ? '#2ecc71' : '#e74c3c';
    el.textContent = r.success ? '✓ Saved — refresh the guide to see' : (r.message || 'Error');
    setTimeout(function() { el.textContent = ''; }, 3500);
  }
}

async function saveCompMeta() {
  if (!_compId) { showAlert('comp-meta-alert', false, 'Select a composition first'); return; }
  var color  = (document.getElementById('comp-color')       || {}).value || '#c9a84c';
  var notes  = ((document.getElementById('comp-build-notes') || {}).value || '').trim();
  var name   = ((document.getElementById('comp-name') || {}).value || '').trim();
  var sel    = document.getElementById('comp-select');
  var opt    = sel ? sel.options[sel.selectedIndex] : null;
  if (!name && opt) name = opt.dataset.name || '';
  var type   = opt ? opt.dataset.type  || 'ATK' : 'ATK';
  var cby    = opt ? opt.dataset.cby   || '' : '';
  var uorder = opt ? opt.dataset.unitOrder || '[]' : '[]';
  var sd = ((document.getElementById('comp-card-label')||{}).value||'').trim();
  var r = await apiPost('/api/admin/comp/update', { id: _compId, name: name, type: type, color: color, short_description: sd, description: notes, countered_by: cby, unit_order: uorder });
  if (r.success) {
    apiPost('/api/admin/comp/notes/save', { tier: _compTier, content: notes });
    if (opt) { opt.dataset.name = name; opt.dataset.color = color; opt.dataset.notes = notes; opt.dataset.shortDesc = sd; opt.text = opt.dataset.tier + ' — ' + name + ' (' + type + ')'; }
  }
  showAlert('comp-meta-alert', r.success, r.message);
}

async function saveCompUnitOrder() {
  if (!_compId) { showAlert('comp-order-alert', false, 'Select a composition first'); return; }
  // Sync from modal selects if open
  onUnitOrderChange();
  var order = (_currentUnitOrder||[]).filter(Boolean);
  var sel  = document.getElementById('comp-select');
  var opt  = sel ? sel.options[sel.selectedIndex] : null;
  var name = opt ? opt.dataset.name  || '' : '';
  var type = opt ? opt.dataset.type  || 'ATK' : 'ATK';
  var cby  = opt ? opt.dataset.cby   || '' : '';
  var color= opt ? opt.dataset.color || '#c9a84c' : '#c9a84c';
  var sd   = opt ? opt.dataset.shortDesc || '' : '';
  var notes= opt ? opt.dataset.notes || '' : '';
  var uorderStr = JSON.stringify(order);
  var r = await apiPost('/api/admin/comp/update', { id: _compId, name: name, type: type, color: color, short_description: sd, description: notes, countered_by: cby, unit_order: uorderStr });
  showAlert('comp-order-alert', r.success, r.message);
  if (r.success && opt) opt.dataset.unitOrder = uorderStr;
}

/* ══════════════════════════════════════════════════ COMP CHAR BONDS ══ */
async function loadCompChars() {
  if (!_compTier) return;
  try {
    if (_bondsModalChars.length === 0) {
      var charsRes = await fetch('/api/admin/chars/list');
      var charsData = await charsRes.json();
      _bondsModalChars = charsData.chars || [];
    }
    var existingRes = await fetch('/api/admin/comp/chars/get?tier=' + encodeURIComponent(_compTier));
    var existingData = await existingRes.json();
    var existingChars = existingData.chars || [];
    _bondsSelections = [null,null,null,null,null];
    existingChars.forEach(function(ex) {
      var idx = (ex.position || 1) - 1;
      if (idx >= 0 && idx < 5) {
        _bondsSelections[idx] = { name: ex.char_name, slug: ex.char_slug || '', costume: ex.costume_name || '' };
      }
    });
    _bondedCharNames = _bondsSelections.filter(Boolean).map(function(s) { return s.name; });
    renderBondsSummary();
    updateBondGating();
    updateUnitOrderSummary();
    loadCompGearCharList();
  } catch(e) {}
}

function updateBondGating() {
  var hasBonds = _bondedCharNames.length > 0;
  var gated  = document.getElementById('unit-order-gated');
  var active = document.getElementById('unit-order-active');
  var rotGated  = document.getElementById('skill-rotation-gated');
  var rotActive = document.getElementById('skill-rotation-active');
  if (gated)    gated.style.display    = hasBonds ? 'none' : 'block';
  if (active)   active.style.display   = hasBonds ? 'block' : 'none';
  if (rotGated)  rotGated.style.display  = hasBonds ? 'none' : 'block';
  if (rotActive) rotActive.style.display = hasBonds ? 'block' : 'none';
  if (hasBonds) refreshRotationWithBonds();
}

function refreshRotationWithBonds() {
  buildRotationSelectors(_bondedCharNames.map(function(n) {
    var found = _bondsModalChars.find(function(c) { return c.name === n; });
    return found || { name: n, slug: n.toLowerCase().replace(/[^a-z0-9]/g,'') };
  }));
}

function openBondsModal() {
  if (!_compTier) { alert('Select a composition first'); return; }
  var modal = document.getElementById('bonds-modal');
  if (modal) { modal.style.display = 'flex'; }
  loadBondsModalChars();
}
function closeBondsModal() {
  var modal = document.getElementById('bonds-modal');
  if (modal) modal.style.display = 'none';
}

async function loadBondsModalChars() {
  if (_bondsModalChars.length === 0) {
    try {
      var res = await fetch('/api/admin/chars/list');
      var data = await res.json();
      _bondsModalChars = data.chars || [];
    } catch(e) {}
  }
  renderBondsCharGrid('all');
  renderBondsModalSlots();
}

function renderBondsCharGrid(elemFilter) {
  var grid = document.getElementById('bonds-char-grid');
  var search = (document.getElementById('bonds-char-search')||{}).value || '';
  if (!grid) return;
  var chars = _bondsModalChars.filter(function(c) {
    if (elemFilter && elemFilter !== 'all' && (c.element||'').toLowerCase() !== elemFilter) return false;
    if (search && c.name.toLowerCase().indexOf(search.toLowerCase()) < 0) return false;
    return true;
  });
  var selectedNames = _bondsSelections.filter(Boolean).map(function(s) { return s.name; });
  grid.innerHTML = chars.map(function(c) {
    var isSelected = selectedNames.indexOf(c.name) >= 0;
    var elem = (c.element||'').toLowerCase();
    return '<div class="bond-char-card" data-slug="' + escH(c.slug) + '" data-name="' + escH(c.name) + '" data-elem="' + escH(c.element||'') + '" style="border:2px solid ' + (isSelected ? 'var(--gold)' : 'var(--border2)') + ';border-radius:8px;overflow:hidden;cursor:pointer;background:var(--bg3);text-align:center;padding-bottom:0.35rem;transition:border-color 0.15s;position:relative">'
      + (elem ? '<img src="/img/element_' + escH(elem) + '" class="img-err-hide" style="position:absolute;top:4px;right:4px;width:18px;height:18px;object-fit:contain;z-index:2;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.8))">' : '')
      + '<div style="height:70px;overflow:hidden;background:var(--bg4)">'
      + '<img src="/img/char_' + escH(c.slug) + '_portrait" class="img-err-dim" style="width:100%;height:100%;object-fit:cover">'
      + '</div>'
      + '<div style="font-size:0.68rem;padding:0.25rem 0.15rem 0;color:' + (isSelected ? 'var(--gold)' : 'var(--text)') + ';line-height:1.2">' + escH(c.name) + '</div>'
      + '<div style="display:inline-flex;align-items:center;gap:3px;font-size:0.6rem;color:var(--text3);text-transform:capitalize">'
      + (elem ? '<img src="/img/element_' + escH(elem) + '" class="img-err-hide" style="width:10px;height:10px;object-fit:contain">' : '')
      + escH(c.element||'') + '</div>'
      + '</div>';
  }).join('');
  grid.querySelectorAll('.bond-char-card').forEach(function(card) {
    card.addEventListener('click', function() { onBondsCharClick(card.dataset.name, card.dataset.slug); });
  });
}

function renderBondsModalSlots() {
  var slotsEl = document.getElementById('bonds-modal-slots');
  if (!slotsEl) return;
  slotsEl.innerHTML = _bondsSelections.map(function(s, i) {
    var isEmpty = !s;
    var cosSlug = s && s.costume ? s.costume.toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'') : '';
    var imgSrc = s ? (cosSlug ? '/img/char_' + s.slug + '_' + cosSlug + '_icon' : '/img/char_' + s.slug + '_portrait') : '';
    var fallback = s ? '/img/char_' + s.slug + '_portrait' : '';
    return '<div class="bond-modal-slot" data-slot="' + i + '" style="width:64px;text-align:center;cursor:pointer" title="' + (isEmpty ? 'Empty slot ' + (i+1) : escH(s.name) + (s.costume ? ' — ' + escH(s.costume) : '')) + '">'
      + '<div style="width:60px;height:60px;border:2px solid ' + (isEmpty ? 'var(--border2)' : 'var(--gold)') + ';border-radius:8px;overflow:hidden;background:var(--bg4);margin:0 auto;position:relative">'
      + (isEmpty ? '<span style="font-size:1.5rem;line-height:60px;color:var(--text3)">' + (i+1) + '</span>'
        : '<img src="' + escH(imgSrc) + '" onerror="this.onerror=null;this.src=\\'' + escH(fallback) + '\\'" class="img-err-dim" style="width:100%;height:100%;object-fit:cover">'
          + '<button onclick="clearBondSlot(' + i + ')" style="position:absolute;top:1px;right:1px;background:rgba(0,0,0,0.7);border:none;color:#fff;font-size:0.6rem;border-radius:3px;padding:1px 3px;cursor:pointer;line-height:1">&#x2715;</button>')
      + '</div>'
      + '<div style="font-size:0.6rem;color:' + (isEmpty ? 'var(--text3)' : 'var(--gold)') + ';margin-top:0.2rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:64px">' + (isEmpty ? 'Slot '+(i+1) : escH(s.name)) + '</div>'
      + '</div>';
  }).join('');
  slotsEl.querySelectorAll('.bond-modal-slot').forEach(function(el) {
    el.addEventListener('click', function() { _bondsPendingSlot = parseInt(el.dataset.slot, 10); });
  });
}

function onBondsCharClick(name, slug) {
  var existing = _bondsSelections.findIndex(function(s) { return s && s.name === name; });
  if (existing >= 0) {
    _bondsSelections[existing] = null;
    renderBondsCharGrid(_bondsCurElem || 'all');
    renderBondsModalSlots();
    return;
  }
  var targetSlot = (_bondsPendingSlot !== null && !_bondsSelections[_bondsPendingSlot]) ? _bondsPendingSlot : _bondsSelections.findIndex(function(s) { return !s; });
  if (targetSlot < 0) { alert('All 5 slots are filled. Click a slot above to replace it.'); return; }
  _bondsPendingChar = { name: name, slug: slug };
  _bondsPendingSlot = targetSlot;
  showBondsCostumeArea(name, slug, targetSlot);
}

async function showBondsCostumeArea(name, slug, slot) {
  var area = document.getElementById('bonds-costume-area');
  var label = document.getElementById('bonds-costume-label');
  var sel = document.getElementById('bonds-costume-sel');
  var confirmBtn = document.getElementById('bonds-confirm-slot-btn');
  if (!area || !sel) return;
  area.style.display = 'block';
  if (label) label.textContent = 'Costume for ' + name + ' (Slot ' + (slot+1) + '):';
  sel.innerHTML = '<option value="">&#8212; Default &#8212;</option>';
  try {
    var res = await fetch('/api/admin/costumes/list?char_slug=' + encodeURIComponent(slug));
    var data = await res.json();
    (data.costumes||[]).forEach(function(c) {
      sel.innerHTML += '<option value="' + escH(c.costume_name) + '">' + escH(c.costume_name) + '</option>';
    });
  } catch(e) {}
  if (confirmBtn) confirmBtn.onclick = function() { confirmBondSlot(); };
}

function confirmBondSlot() {
  if (_bondsPendingSlot === null || !_bondsPendingChar) return;
  var sel = document.getElementById('bonds-costume-sel');
  var costume = sel ? sel.value : '';
  _bondsSelections[_bondsPendingSlot] = { name: _bondsPendingChar.name, slug: _bondsPendingChar.slug, costume: costume };
  _bondsPendingChar = null;
  var area = document.getElementById('bonds-costume-area');
  if (area) area.style.display = 'none';
  renderBondsCharGrid(_bondsCurElem || 'all');
  renderBondsModalSlots();
  renderBondsSummary();
}

function clearBondSlot(idx) {
  _bondsSelections[idx] = null;
  renderBondsModalSlots();
  renderBondsCharGrid(_bondsCurElem || 'all');
  renderBondsSummary();
}

function renderBondsSummary() {
  var summary = document.getElementById('bonds-summary');
  if (!summary) return;
  var filled = _bondsSelections.filter(Boolean);
  if (!filled.length) {
    summary.innerHTML = '<span style="color:var(--text3);font-size:0.82rem">No bonds set &#8212; click Edit Bonds to pick characters</span>';
    return;
  }
  summary.innerHTML = _bondsSelections.map(function(s, i) {
    if (!s) return '<div style="width:48px;height:48px;border:1px dashed var(--border2);border-radius:6px;display:inline-flex;align-items:center;justify-content:center;color:var(--text3);font-size:0.7rem">' + (i+1) + '</div>';
    var cosSlug = s.costume ? s.costume.toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'') : '';
    var imgSrc = cosSlug ? '/img/char_' + s.slug + '_' + cosSlug + '_icon' : '/img/char_' + s.slug + '_portrait';
    var fallback = '/img/char_' + s.slug + '_portrait';
    return '<div style="width:48px;height:48px;border:1px solid var(--gold);border-radius:6px;overflow:hidden;display:inline-block" title="' + escH(s.name) + (s.costume ? ' — ' + escH(s.costume) : '') + '">'
      + '<img src="' + escH(imgSrc) + '" onerror="this.onerror=null;this.src=\\'' + escH(fallback) + '\\'" class="img-err-dim" style="width:100%;height:100%;object-fit:cover">'
      + '</div>';
  }).join('');
}

async function saveCompBonds() {
  if (!_compTier) { showAlert('comp-bonds-alert', false, 'Select a composition first'); return; }
  var chars = [];
  _bondsSelections.forEach(function(s, i) {
    if (s) chars.push({ position: i+1, char_name: s.name, char_slug: s.slug, costume_name: s.costume || '', bond_stats: '' });
  });
  var r = await apiPost('/api/admin/comp/chars/save', { tier: _compTier, chars: chars });
  showAlert('comp-bonds-alert', r.success, r.message);
  if (r.success) {
    _bondedCharNames = chars.map(function(c) { return c.char_name; });
    updateBondGating();
    updateUnitOrderSummary();
  }
}

/* ══════════════════════════════════════════════ UNIT ORDER MODAL ══ */
function openUnitOrderModal() {
  if (!_compTier) { alert('Select a composition first'); return; }
  var modal = document.getElementById('unit-order-modal');
  if (modal) modal.style.display = 'flex';
  renderUnitOrderSlots();
}
function closeUnitOrderModal() {
  var modal = document.getElementById('unit-order-modal');
  if (modal) modal.style.display = 'none';
}

function renderUnitOrderSlots() {
  var slotsEl = document.getElementById('unit-order-slots');
  if (!slotsEl) return;
  var bondedNames = _bondedCharNames;
  slotsEl.innerHTML = [1,2,3,4,5].map(function(n) {
    var cur = _currentUnitOrder[n-1] || '';
    var opts = '<option value="">&#8212; Select &#8212;</option>' + bondedNames.map(function(name) {
      return '<option value="' + escH(name) + '"' + (name === cur ? ' selected' : '') + '>' + escH(name) + '</option>';
    }).join('');
    return '<div style="display:flex;align-items:center;gap:0.6rem">'
      + '<div style="font-size:0.7rem;color:var(--text3);width:16px;text-align:right;flex-shrink:0">' + n + '</div>'
      + '<select id="uorder-sel-' + n + '" style="flex:1;background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:6px;border-radius:4px;font-size:0.85rem" onchange="onUnitOrderChange()">'
      + opts + '</select></div>';
  }).join('');
}

function onUnitOrderChange() {
  _currentUnitOrder = [];
  for (var i = 1; i <= 5; i++) {
    var v = ((document.getElementById('uorder-sel-' + i)||{}).value||'').trim();
    _currentUnitOrder[i-1] = v || '';
  }
  updateUnitOrderSummary();
}

function updateUnitOrderSummary() {
  var summary = document.getElementById('unit-order-summary');
  if (!summary) return;
  var filled = (_currentUnitOrder||[]).filter(Boolean);
  if (!filled.length) {
    summary.innerHTML = '<span style="color:var(--text3);font-size:0.82rem">No order set &#8212; click Configure Order</span>';
    return;
  }
  summary.innerHTML = (_currentUnitOrder||[]).map(function(name, i) {
    if (!name) return '<div style="width:40px;height:40px;border:1px dashed var(--border2);border-radius:5px;display:inline-flex;align-items:center;justify-content:center;color:var(--text3);font-size:0.7rem">' + (i+1) + '</div>';
    var found = _bondsModalChars.find(function(c) { return c.name === name; });
    var slug = found ? found.slug : '';
    return '<div style="width:40px;height:40px;border:1px solid var(--border2);border-radius:5px;overflow:hidden;display:inline-block" title="' + escH(name) + '">'
      + (slug ? '<img src="/img/char_' + escH(slug) + '_portrait" class="img-err-dim" style="width:100%;height:100%;object-fit:cover">' : '<span style="font-size:0.6rem;color:var(--text);display:flex;align-items:center;justify-content:center;height:100%">' + escH(name.slice(0,4)) + '</span>')
      + '</div>';
  }).join('');
}

/* ══════════════════════════════════════════════════════════ EMOTES ══ */
async function addEmoteWithData(name, image_url) {
  if (!name || !image_url) { showAlert('emote-alert', false, 'Name and image required'); return; }
  var r = await apiPost('/api/admin/emote/add', { name: name, image_url: image_url });
  showAlert('emote-alert', r.success, r.message);
  if (r.success) {
    var nameEl = document.getElementById('e-name');
    var urlEl  = document.getElementById('e-url');
    var fileEl = document.getElementById('e-file');
    if (nameEl) nameEl.value = '';
    if (urlEl)  urlEl.value  = '';
    if (fileEl) fileEl.value = '';
    var div = document.createElement('div');
    div.className = 'admin-item';
    div.id = 'emote-' + r.id;
    div.innerHTML = '<div class="admin-item-info" style="display:flex;align-items:center;gap:0.75rem">'
      + '<img src="' + escH(image_url) + '" style="width:36px;height:36px;object-fit:cover;border-radius:4px" class="img-err-hide">'
      + '<strong>' + escH(name) + '</strong></div>'
      + '<button class="btn-danger" data-action="emote-delete" data-id="' + r.id + '">Delete</button>';
    var list = document.getElementById('emote-list');
    if (list) list.prepend(div);
  }
}

async function addEmote() {
  var name      = ((document.getElementById('e-name') || {}).value || '').trim();
  var image_url = ((document.getElementById('e-url')  || {}).value || '').trim();
  var fileEl    = document.getElementById('e-file');
  var file      = fileEl && fileEl.files[0];
  if (!name) { showAlert('emote-alert', false, 'Name required'); return; }
  if (file) {
    showAlert('emote-alert', true, 'Compressing…');
    var data = await compressToDataUrl(file, 'emote-canvas', 200, 0.85);
    await addEmoteWithData(name, data);
  } else if (image_url) {
    await addEmoteWithData(name, image_url);
  } else {
    showAlert('emote-alert', false, 'Provide an image URL or upload a file');
  }
}

async function deleteEmote(id) {
  var r = await apiPost('/api/admin/emote/delete', { id: id });
  if (r.success) { var el = document.getElementById('emote-' + id); if (el) el.remove(); var el2 = document.getElementById('es-emote-' + id); if (el2) el2.remove(); }
  else showAlert('es-bulk-alert', false, r.message);
}

/* ══════════════════════════════════════════════════════ EMOTE SETS ══ */
var _esSets = {};
var _esCurrentSet = 1;
var _esPendingCover = '';
var _settingsCurrentSet = 1;

async function loadEmoteSets() {
  try {
    var r = await fetch('/api/admin/emote-set/list');
    var d = await r.json();
    var arr = (d && d.sets) || [];
    _esSets = {};
    arr.forEach(function(s) { _esSets[s.set_num] = s; });
    renderEmoteSet(_esCurrentSet);
    loadEmoteSetEmotes(_esCurrentSet);
    // Update emote tab selector with set names
    var sel = document.getElementById('emote-set-select');
    if (sel) {
      sel.innerHTML = [1,2,3,4,5,6].map(function(n) {
        var sv = _esSets[n];
        var lbl = sv ? (sv.name || ('Set '+n)) : ('Set '+n);
        return '<option value="'+n+'"'+(String(n)===String(_esCurrentSet)?' selected':'')+'>'+n+' ('+escH(lbl)+')</option>';
      }).join('');
    }
    // Update settings tab selector with set names
    var settingsSel = document.getElementById('settings-emote-set-select');
    if (settingsSel) {
      settingsSel.innerHTML = [1,2,3,4,5,6].map(function(n) {
        var sv = _esSets[n];
        var lbl = sv ? (sv.name || ('Set '+n)) : ('Set '+n);
        return '<option value="'+n+'"'+(String(n)===String(_settingsCurrentSet)?' selected':'')+'>'+n+' ('+escH(lbl)+')</option>';
      }).join('');
    }
    renderSetConfig(_settingsCurrentSet || 1);
  } catch(e) {}
}

function renderEmoteSet(sn) {
  var s = _esSets[sn] || { name: 'Set ' + sn, hint: '', unlock_page: 'characters', unlock_target: 'water', unlock_count: 7, cover_key: '', unlock_mode: 'count', unlock_sequence: '' };
  var nameEl = document.getElementById('es-name'); if (nameEl) nameEl.value = s.name || ('Set ' + sn);
  var pageEl = document.getElementById('es-page'); if (pageEl) pageEl.value = s.unlock_page || 'characters';
  var tEl = document.getElementById('es-target'); if (tEl) tEl.value = (s.unlock_target || 'water').toLowerCase();
  var cEl = document.getElementById('es-count'); if (cEl) cEl.value = s.unlock_count || 7;
  var hEl = document.getElementById('es-hint'); if (hEl) hEl.value = s.hint || '';
  var mEl = document.getElementById('es-mode'); if (mEl) mEl.value = s.unlock_mode || 'count';
  var seqEl = document.getElementById('es-sequence'); if (seqEl) seqEl.value = s.unlock_sequence || '';
  var modeCount = document.getElementById('es-mode-count');
  var modeSeq = document.getElementById('es-mode-sequence');
  var isSeq = (s.unlock_mode === 'sequence');
  if (modeCount) modeCount.style.display = isSeq ? 'none' : '';
  if (modeSeq) modeSeq.style.display = isSeq ? '' : 'none';
  var prev = document.getElementById('es-cover-preview-img');
  if (prev) {
    if (s.cover_key) {
      prev.innerHTML = '<img src="/img/' + escH(s.cover_key) + '" style="width:100%;height:100%;object-fit:cover" class="img-err-hide">';
    } else {
      prev.innerHTML = '<span style="font-size:0.7rem;color:var(--text3);text-align:center">No cover</span>';
    }
  }
  _esPendingCover = '';
}

async function loadEmoteSetEmotes(sn) {
  var listEl = document.getElementById('es-emote-list');
  if (!listEl) return;
  listEl.innerHTML = '<div style="color:var(--text3);font-size:0.8rem;grid-column:1/-1">Loading...</div>';
  try {
    var r = await fetch('/api/admin/emote/list-by-set?set_num=' + sn);
    var d = await r.json();
    var arr = (d && d.emotes) || [];
    if (!arr.length) { listEl.innerHTML = '<div style="color:var(--text3);font-size:0.8rem;grid-column:1/-1">No emotes in this set yet.</div>'; return; }
    listEl.innerHTML = arr.map(function(e) {
      return '<div class="admin-item" id="es-emote-' + e.id + '" style="flex-direction:column;align-items:stretch;padding:0.5rem;gap:0.4rem">'
        + '<img src="' + escH(e.image_url) + '" style="width:100%;height:80px;object-fit:contain;background:var(--bg4);border-radius:4px" class="img-err-hide">'
        + '<div style="font-size:0.72rem;word-break:break-word">' + escH(e.name) + '</div>'
        + '<button class="btn-danger" data-action="emote-delete" data-id="' + e.id + '" style="font-size:0.7rem;padding:3px 8px">Delete</button>'
        + '</div>';
    }).join('');
  } catch(e) { listEl.innerHTML = '<div style="color:#e74c3c;font-size:0.8rem;grid-column:1/-1">Failed to load.</div>'; }
}

async function saveEmoteSet() {
  var sn = _esCurrentSet;
  var body = {
    set_num: sn,
    name: (document.getElementById('es-name')||{}).value || ('Set ' + sn),
    hint: (document.getElementById('es-hint')||{}).value || '',
    unlock_page: (document.getElementById('es-page')||{}).value || 'characters',
    unlock_target: (document.getElementById('es-target')||{}).value || '',
    unlock_count: parseInt((document.getElementById('es-count')||{}).value, 10) || 7,
    unlock_mode: (document.getElementById('es-mode')||{}).value || 'count',
    unlock_sequence: (document.getElementById('es-sequence')||{}).value || '',
    cover_key: (_esSets[sn] && _esSets[sn].cover_key) || '',
  };
  if (_esPendingCover) {
    var key = 'emote_set_' + sn + '_cover';
    var up = await apiPost('/api/admin/image/upload', { key: key, data: _esPendingCover });
    if (up.success) body.cover_key = key;
  }
  var r = await apiPost('/api/admin/emote-set/save', body);
  var alertEl = document.getElementById('es-alert');
  if (alertEl) { alertEl.style.color = r.success ? '#2ecc71' : '#e74c3c'; alertEl.textContent = r.success ? 'Saved!' : (r.message || 'Error'); setTimeout(function() { alertEl.textContent = ''; }, 3000); }
  if (r.success) { _esSets[sn] = Object.assign({}, _esSets[sn] || {}, body); renderEmoteSet(sn); }
}

function renderSetConfig(sn) {
  var s = _esSets[sn] || {};
  function g(id) { return document.getElementById(id); }
  if (g('set-cfg-name')) g('set-cfg-name').value = s.name || ('Set ' + sn);
  if (g('set-cfg-letter')) g('set-cfg-letter').value = s.set_letter || '';
  if (g('set-cfg-hint')) g('set-cfg-hint').value = s.hint || '';
  if (g('set-cfg-unlock-msg')) g('set-cfg-unlock-msg').value = s.unlock_message || '';
  var imgPrev = g('set-cfg-unlock-img-preview');
  if (imgPrev) {
    imgPrev.classList.remove('errored');
    imgPrev.style.display = '';
    imgPrev.src = '/img/emote_set_' + sn + '_unlock_img?t=' + Date.now();
  }
  var imgFile = g('set-cfg-unlock-img-file');
  if (imgFile) imgFile.value = '';
  if (g('set-cfg-mode')) g('set-cfg-mode').value = s.unlock_mode || 'count';
  // Auto-set page based on set number (Set 2 = emotes, all others = characters)
  var fixedPage = (sn === 2) ? 'emotes' : 'characters';
  if (g('set-cfg-page')) g('set-cfg-page').value = fixedPage;
  if (g('set-cfg-location-display')) {
    var loc = fixedPage.charAt(0).toUpperCase() + fixedPage.slice(1);
    g('set-cfg-location-display').textContent = 'Location: ' + loc;
  }
  if (g('set-cfg-target')) { g('set-cfg-target').value = s.unlock_target || ''; updateElemPickerDisplay(s.unlock_target || ''); }
  if (g('set-cfg-count')) g('set-cfg-count').value = s.unlock_count || 7;
  if (g('set-cfg-sequence')) g('set-cfg-sequence').value = s.unlock_sequence || '';
  // who_am_i fields
  if ((s.unlock_mode || 'count') === 'who_am_i') {
    if (g('set-cfg-wai-answer')) g('set-cfg-wai-answer').value = s.unlock_sequence || '';
  }
  updateSetCfgModeUI(s.unlock_mode || 'count');
  // If who_am_i, load char list with preselect AFTER updateSetCfgModeUI shows the wrap
  if ((s.unlock_mode || 'count') === 'who_am_i') {
    loadWAICharList(s.unlock_target);
  }
  // Rebuild sequence selects with current value (after updateSetCfgModeUI built them)
  buildSequenceSelects(s.unlock_mode || 'count');
}

function updateElemPickerDisplay(elem) {
  var d = document.getElementById('set-cfg-target-display');
  if (!d) return;
  var lbl = { water:'Water', fire:'Fire', light:'Light', dark:'Dark', wind:'Wind' }[elem];
  if (!lbl) { d.textContent = '— Select Element —'; return; }
  d.innerHTML = '<img src="/img/element_' + elem + '" class="img-err-hide" style="width:18px;height:18px;object-fit:contain">' + lbl;
}

function updateSetCfgModeUI(mode) {
  function g(id) { return document.getElementById(id); }
  var isCount = mode === 'count';
  var isWho   = mode === 'who_am_i';
  var isSeq   = mode === 'sequence' || mode === 'letter_sequence';
  // Show/hide standard fields
  if (g('set-cfg-target-wrap'))    g('set-cfg-target-wrap').style.display    = isCount ? '' : 'none';
  if (g('set-cfg-sequence-wrap'))  g('set-cfg-sequence-wrap').style.display  = isSeq   ? '' : 'none';
  if (g('set-cfg-count-wrap'))     g('set-cfg-count-wrap').style.display     = isCount ? '' : 'none';
  // Show/hide who_am_i block
  if (g('set-cfg-who-am-i-wrap'))  g('set-cfg-who-am-i-wrap').style.display  = isWho   ? '' : 'none';
  // Update sequence labels
  if (g('set-cfg-sequence-label')) g('set-cfg-sequence-label').textContent = mode === 'letter_sequence' ? 'Letter Sequence' : 'Element Sequence';
  if (g('set-cfg-sequence-note'))  g('set-cfg-sequence-note').textContent   = mode === 'letter_sequence' ? 'Player must click these set cards in this order on the Emotes page.' : 'Player must click elements in this order on the Characters page.';
  // Build the 5 positional selects for the sequence
  buildSequenceSelects(mode);
  // (who_am_i char list loaded by renderSetConfig after this runs)
}

function buildSequenceSelects(mode) {
  var container = document.getElementById('set-cfg-sequence-selects');
  if (!container) return;
  var hidden = document.getElementById('set-cfg-sequence');
  var curVal = hidden ? hidden.value : '';
  var curParts = curVal ? curVal.split(',').map(function(x){return x.trim();}) : [];

  var elemOpts = ['water','fire','light','dark','wind'].map(function(el) {
    return '<option value="' + el + '">' + el.charAt(0).toUpperCase() + el.slice(1) + '</option>';
  }).join('');

  // For letter_sequence, get currently configured set letters
  var letterOpts = '';
  if (mode === 'letter_sequence' && typeof _esSets !== 'undefined') {
    Object.keys(_esSets).forEach(function(sn) {
      var s = _esSets[sn];
      var ltr = (s && (s.set_letter || s.name || '')).toUpperCase();
      if (ltr) letterOpts += '<option value="' + ltr + '">' + ltr + '</option>';
    });
  }

  var opts = mode === 'letter_sequence' ? letterOpts : elemOpts;
  container.innerHTML = [1,2,3,4,5].map(function(pos) {
    var cur = curParts[pos-1] || '';
    var selOpts = '<option value="">—</option>' + opts;
    // Mark selected
    selOpts = selOpts.replace('value="' + cur + '"', 'value="' + cur + '" selected');
    return '<div style="text-align:center">'
      + '<div style="font-size:0.6rem;color:var(--text3);margin-bottom:2px">' + pos + '</div>'
      + '<select class="seq-pos-sel" data-pos="' + pos + '" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:5px 8px;border-radius:4px;font-size:0.82rem;width:90px">'
      + selOpts + '</select>'
      + '</div>';
  }).join('');

  // Wire change events to sync hidden input
  container.querySelectorAll('.seq-pos-sel').forEach(function(sel) {
    sel.addEventListener('change', function() {
      var vals = Array.from(container.querySelectorAll('.seq-pos-sel')).map(function(s){return s.value;}).filter(Boolean);
      if (hidden) hidden.value = vals.join(',');
    });
  });
}

var _waiCharsLoaded = false;
async function loadWAICharList(preselect) {
  var sel = document.getElementById('set-cfg-wai-char');
  if (!sel) return;
  if (!_waiCharsLoaded) {
    try {
      var res = await fetch('/api/admin/chars/list');
      var data = await res.json();
      var chars = data.chars || [];
      sel.innerHTML = '<option value="">— Select character —</option>' + chars.map(function(c) {
        return '<option value="' + escH(c.slug) + '" data-slug="' + escH(c.slug) + '">' + escH(c.name) + ' (' + escH(c.element||'?') + ')</option>';
      }).join('');
      _waiCharsLoaded = true;
    } catch(e) {
      sel.innerHTML = '<option value="">— Failed to load —</option>';
    }
  }
  if (preselect) {
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === preselect) { sel.selectedIndex = i; break; }
    }
  }
  refreshWAIPortrait(sel.value);
}

function refreshWAIPortrait(slug) {
  var prev = document.getElementById('set-cfg-wai-portrait');
  if (!prev) return;
  if (!slug) { prev.innerHTML = '<span style="font-size:0.65rem;color:var(--text3);text-align:center">No portrait</span>'; return; }
  prev.innerHTML = '<img src="/img/char_' + escH(slug) + '_portrait?t=' + Date.now() + '" class="img-err-dim" style="width:100%;height:100%;object-fit:cover">';
}

async function saveSetConfig() {
  var sn = _settingsCurrentSet || 1;
  function gv(id) { var el = document.getElementById(id); return el ? el.value : ''; }
  var mode = gv('set-cfg-mode') || 'count';
  var isWho = mode === 'who_am_i';
  var body = {
    set_num: sn,
    name: gv('set-cfg-name') || ('Set ' + sn),
    set_letter: gv('set-cfg-letter'),
    hint: gv('set-cfg-hint'),
    unlock_page: gv('set-cfg-page') || 'characters',
    unlock_target: isWho ? gv('set-cfg-wai-char') : gv('set-cfg-target'),
    unlock_count: parseInt(gv('set-cfg-count'), 10) || 0,
    unlock_mode: mode,
    unlock_sequence: isWho ? gv('set-cfg-wai-answer') : gv('set-cfg-sequence'),
    cover_key: (_esSets[sn] && _esSets[sn].cover_key) || '',
    unlock_message: gv('set-cfg-unlock-msg'),
  };
  var r = await apiPost('/api/admin/emote-set/save', body);
  var alertEl = document.getElementById('set-cfg-alert');
  if (alertEl) {
    alertEl.style.color = r.success ? '#2ecc71' : '#e74c3c';
    alertEl.textContent = r.success ? 'Saved!' : (r.message || 'Error');
    setTimeout(function() { alertEl.textContent = ''; }, 3000);
  }
  if (r.success) { _esSets[sn] = Object.assign({}, _esSets[sn] || {}, body); renderSetConfig(sn); }
}

async function bulkAddEmotes() {
  var sn = _esCurrentSet;
  var fileEl = document.getElementById('es-bulk-files');
  var files = (fileEl && fileEl.files) ? Array.from(fileEl.files) : [];
  if (_esPasteBuffer && _esPasteBuffer.length) files = files.concat(_esPasteBuffer);
  if (!files.length) { showAlert('es-bulk-alert', false, 'Select files or paste images first'); return; }
  showAlert('es-bulk-alert', true, 'Uploading ' + files.length + ' emote(s)...');
  var items = [];
  for (var i = 0; i < files.length; i++) {
    try {
      var data = await compressToDataUrl(files[i], 'es-bulk-canvas', 200, 0.85);
      var nm = (files[i].name || ('emote_' + (i+1))).replace(/\.[^.]+$/, '');
      items.push({ name: nm, data: data });
    } catch(e) {}
  }
  var r = await apiPost('/api/admin/emote/bulk-add', { set_num: sn, items: items });
  showAlert('es-bulk-alert', r.success, r.message);
  if (r.success) {
    if (fileEl) fileEl.value = '';
    _esPasteBuffer = [];
    var pz = document.getElementById('es-paste-zone');
    if (pz) pz.textContent = 'Click here, then paste images with Ctrl+V (or Cmd+V)';
    loadEmoteSetEmotes(sn);
  }
}

async function uploadUnlockImg() {
  var sn = _settingsCurrentSet || 1;
  var fileEl = document.getElementById('set-cfg-unlock-img-file');
  var file = fileEl && fileEl.files[0];
  if (!file) { showAlert('set-cfg-unlock-img-alert', false, 'Select an image first'); return; }
  showAlert('set-cfg-unlock-img-alert', true, 'Compressing…');
  var data = await compressToDataUrl(file, 'set-cfg-unlock-img-canvas', 360, 0.9);
  var key = 'emote_set_' + sn + '_unlock_img';
  var r = await apiPost('/api/admin/image/upload', { key: key, data: data });
  if (r.success) {
    var prev = document.getElementById('set-cfg-unlock-img-preview');
    if (prev) { prev.classList.remove('errored'); prev.style.display = ''; prev.src = '/img/' + key + '?t=' + Date.now(); }
    if (fileEl) fileEl.value = '';
  }
  showAlert('set-cfg-unlock-img-alert', r.success, r.success ? '✓ Uploaded' : (r.message || 'Error'));
}

async function clearUnlockImg() {
  var sn = _settingsCurrentSet || 1;
  if (!confirm('Remove the unlock image for set ' + sn + '?')) return;
  var key = 'emote_set_' + sn + '_unlock_img';
  var r = await apiPost('/api/admin/image/delete', { key: key });
  if (r.success) {
    var prev = document.getElementById('set-cfg-unlock-img-preview');
    if (prev) prev.src = '';
  }
  showAlert('set-cfg-unlock-img-alert', r.success, r.success ? 'Cleared' : (r.message || 'Error'));
}

async function uploadLockImg() {
  var fileEl = document.getElementById('lock-img-file');
  var file = fileEl && fileEl.files[0];
  if (!file) { showAlert('lock-img-alert', false, 'Select an image file'); return; }
  showAlert('lock-img-alert', true, 'Compressing…');
  var data = await compressToDataUrl(file, 'lock-img-canvas', 200, 0.9);
  var r = await apiPost('/api/admin/image/upload', { key: 'emote_lock_image', data: data });
  var alertEl = document.getElementById('lock-img-alert');
  if (alertEl) { alertEl.style.color = r.success ? '#2ecc71' : '#e74c3c'; alertEl.textContent = r.success ? 'Uploaded!' : (r.message || 'Error'); setTimeout(function() { alertEl.textContent = ''; }, 3000); }
  if (r.success) {
    var prev = document.getElementById('lock-img-preview');
    if (prev) prev.innerHTML = '<img src="' + escH(data) + '" style="width:100%;height:100%;object-fit:contain">';
    if (fileEl) fileEl.value = '';
  }
}

async function uploadMamonirNav() {
  var fileInput = document.getElementById('mamonir-nav-file');
  var file = fileInput && fileInput.files && fileInput.files[0];
  if (!file) { showAlert('nav-icon-alert', false, 'Choose an image first.'); return; }
  var reader = new FileReader();
  reader.onload = async function() {
    var dataUrl = reader.result;
    var r = await apiPost('/api/admin/image/upload', { key: 'mamonir_nav', data: dataUrl });
    showAlert('nav-icon-alert', r.success, r.success ? 'Icon uploaded! Hard refresh to see it.' : (r.message || 'Error'));
  };
  reader.readAsDataURL(file);
}

async function saveNavIconSettings() {
  var inp = document.getElementById('mamonir-tap-count');
  var count = parseInt((inp && inp.value) || '7', 10);
  if (!count || count < 1) count = 7;
  var r = await apiPost('/api/admin/image/upload', { key: 'mamonir_tap_count', data: String(count) });
  showAlert('nav-icon-alert', r.success, r.success ? 'Saved! Icon will fall after ' + count + ' taps (refresh to apply).' : (r.message || 'Error'));
}

/* ══════════════════════════════════════════════ COMP GEAR OVERRIDES ══ */
function loadCompGearCharList() {
  var sel = document.getElementById('comp-gear-char-sel');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Select a character —</option>';
  var bonded = (_bondsSelections || []).filter(Boolean);
  if (!bonded.length) {
    sel.innerHTML = '<option value="">Set bonds first</option>';
    return;
  }
  bonded.forEach(function(b) {
    var opt = document.createElement('option');
    opt.value = b.slug || '';
    opt.textContent = b.name || b.slug || '';
    sel.appendChild(opt);
  });
}

function onCompGearCharChange() {
  var sel = document.getElementById('comp-gear-char-sel');
  var slug = sel ? sel.value : '';
  var preview = document.getElementById('comp-gear-preview');
  if (!preview) return;
  if (!slug) { preview.style.display = 'none'; return; }
  preview.style.display = 'block';
  // Base gear
  var baseImg = document.getElementById('comp-gear-base-img');
  var basePlh = document.getElementById('comp-gear-base-placeholder');
  var baseKey = '/img/char_' + slug + '_gear';
  if (baseImg) { baseImg.src = baseKey; baseImg.style.display = 'block'; }
  if (basePlh) basePlh.style.display = 'none';
  // Alt gear (comp-specific)
  var altImg = document.getElementById('comp-gear-alt-img');
  var altPlh = document.getElementById('comp-gear-alt-placeholder');
  var tier = (_compTier || '').toLowerCase();
  var altKey = '/img/comp_gear_' + tier + '_' + slug;
  if (altImg) { altImg.src = altKey; altImg.style.display = 'block'; }
  if (altPlh) altPlh.textContent = 'Click to upload';
  // Reset file input
  var fi = document.getElementById('comp-gear-alt-file');
  if (fi) fi.value = '';
}

async function uploadCompGear() {
  if (!_compTier) { showAlert('comp-gear-alert', false, 'Select a composition first'); return; }
  var sel = document.getElementById('comp-gear-char-sel');
  var slug = sel ? sel.value : '';
  if (!slug) { showAlert('comp-gear-alert', false, 'Select a character first'); return; }
  var fileInput = document.getElementById('comp-gear-alt-file');
  var file = fileInput && fileInput.files && fileInput.files[0];
  if (!file) { showAlert('comp-gear-alert', false, 'Choose an image file first'); return; }
  showAlert('comp-gear-alert', true, 'Uploading…');
  var data = await compressToDataUrl(file, 'comp-gear-alt-canvas', 480, 0.92);
  var key = 'comp_gear_' + _compTier.toLowerCase() + '_' + slug;
  var r = await apiPost('/api/admin/image/upload', { key: key, data: data });
  if (r.success) {
    var altImg = document.getElementById('comp-gear-alt-img');
    if (altImg) { altImg.src = '/img/' + key + '?t=' + Date.now(); altImg.style.display = 'block'; }
  }
  showAlert('comp-gear-alert', r.success, r.success ? '✓ Override uploaded — refresh guide to see it' : (r.message || 'Error'));
}

async function clearCompGear() {
  if (!_compTier) { showAlert('comp-gear-alert', false, 'Select a composition first'); return; }
  var sel = document.getElementById('comp-gear-char-sel');
  var slug = sel ? sel.value : '';
  if (!slug) { showAlert('comp-gear-alert', false, 'Select a character first'); return; }
  if (!confirm('Remove the gear override for ' + (sel.options[sel.selectedIndex] && sel.options[sel.selectedIndex].text || slug) + ' in this comp?')) return;
  var key = 'comp_gear_' + _compTier.toLowerCase() + '_' + slug;
  var r = await apiPost('/api/admin/image/delete', { key: key });
  if (r.success) {
    var altImg = document.getElementById('comp-gear-alt-img');
    if (altImg) { altImg.src = ''; altImg.style.display = 'none'; }
    var altPlh = document.getElementById('comp-gear-alt-placeholder');
    if (altPlh) altPlh.textContent = 'Click to upload';
  }
  showAlert('comp-gear-alert', r.success, r.success ? 'Override cleared' : (r.message || 'Error'));
}

async function saveSpecialCodeConfig() {
  var code = ((document.getElementById('sc-code') || {}).value || '').trim();
  var passcode = ((document.getElementById('sc-passcode') || {}).value || '').trim();
  if (!code || !passcode) { showAlert('special-cfg-alert', false, 'Both code and passcode are required'); return; }
  var config = JSON.stringify({ code: code, passcode: passcode });
  var r = await apiPost('/api/admin/image/upload', { key: 'special_code_config', data: config });
  showAlert('special-cfg-alert', r.success, r.success ? 'Special code saved! Reload coupons page to see it.' : (r.message || 'Error'));
}

async function uploadSpecialLockImg() {
  var fileEl = document.getElementById('sc-lock-img-file');
  var file = fileEl && fileEl.files[0];
  if (!file) { showAlert('special-cfg-alert', false, 'Select an image file'); return; }
  showAlert('special-cfg-alert', true, 'Uploading…');
  var data = await compressToDataUrl(file, 'sc-lock-img-canvas', 200, 0.9);
  var r = await apiPost('/api/admin/image/upload', { key: 'special_code_lock_image', data: data });
  showAlert('special-cfg-alert', r.success, r.success ? 'Lock image uploaded!' : (r.message || 'Error'));
}

var _esPasteBuffer = [];
function setupEmoteSetUI() {
  var sel = document.getElementById('emote-set-select');
  if (sel) {
    sel.addEventListener('change', function() {
      _esCurrentSet = parseInt(sel.value, 10) || 1;
      renderEmoteSet(_esCurrentSet);
      loadEmoteSetEmotes(_esCurrentSet);
    });
  }
  var modeSel = document.getElementById('es-mode');
  if (modeSel) {
    modeSel.addEventListener('change', function() {
      var isSeq = modeSel.value === 'sequence';
      var modeCount = document.getElementById('es-mode-count');
      var modeSeq = document.getElementById('es-mode-sequence');
      if (modeCount) modeCount.style.display = isSeq ? 'none' : '';
      if (modeSeq) modeSeq.style.display = isSeq ? '' : 'none';
    });
  }
  var coverInput = document.getElementById('es-cover-file');
  if (coverInput) {
    coverInput.addEventListener('change', async function() {
      if (!coverInput.files || !coverInput.files[0]) return;
      try {
        _esPendingCover = await compressToDataUrl(coverInput.files[0], 'es-cover-canvas', 400, 0.85);
        var prev = document.getElementById('es-cover-preview');
        if (prev) prev.innerHTML = 'New cover ready (save settings to apply)';
      } catch(e) {}
    });
  }
  var pz = document.getElementById('es-paste-zone');
  if (pz) {
    pz.addEventListener('paste', function(ev) {
      var items = ev.clipboardData && ev.clipboardData.items;
      if (!items) return;
      var added = 0;
      for (var i = 0; i < items.length; i++) {
        if (items[i].kind === 'file' && items[i].type.indexOf('image/') === 0) {
          var f = items[i].getAsFile();
          if (f) { _esPasteBuffer.push(f); added++; }
        }
      }
      if (added) pz.textContent = _esPasteBuffer.length + ' pasted image(s) queued. Click "Upload Selected Files" to save.';
    });
  }
  var settingsSel = document.getElementById('settings-emote-set-select');
  if (settingsSel) {
    settingsSel.addEventListener('change', function() {
      _settingsCurrentSet = parseInt(settingsSel.value, 10) || 1;
      renderSetConfig(_settingsCurrentSet);
    });
  }
  var modeSel2 = document.getElementById('set-cfg-mode');
  if (modeSel2) {
    modeSel2.addEventListener('change', function() {
      updateSetCfgModeUI(modeSel2.value);
    });
  }
  var waiCharSel = document.getElementById('set-cfg-wai-char');
  if (waiCharSel) {
    waiCharSel.addEventListener('change', function() {
      refreshWAIPortrait(waiCharSel.value);
    });
  }
  loadEmoteSets();

  // Gear override file input — show preview immediately on selection
  var gearFileInput = document.getElementById('comp-gear-alt-file');
  if (gearFileInput) {
    gearFileInput.addEventListener('change', function() {
      var file = gearFileInput.files && gearFileInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function() {
        var altImg = document.getElementById('comp-gear-alt-img');
        var altPlh = document.getElementById('comp-gear-alt-placeholder');
        if (altImg) { altImg.src = reader.result; altImg.style.display = 'block'; }
        if (altPlh) altPlh.style.display = 'none';
      };
      reader.readAsDataURL(file);
    });
  }
}

/* ══════════════════════════════════════════════════════════ IMAGES ══ */
function setImgCat(cat) {
  _imgCat = cat;
  var cats = ['chars','comps','tiles','other'];
  for (var i = 0; i < cats.length; i++) {
    var d = document.getElementById('imgcat-' + cats[i]);
    if (d) d.style.display = cats[i] === cat ? 'block' : 'none';
  }
  document.querySelectorAll('.img-cat-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });
  updateImgKey();
}

var _imgCostumeCache = {};
async function loadImgCostumeOptions(charSlug) {
  var sel = document.getElementById('img-costume-slug-sel');
  if (!sel || !charSlug) return;
  if (_imgCostumeCache[charSlug]) {
    var curVal = sel.value;
    sel.innerHTML = '<option value="">— Select Costume —</option>'
      + _imgCostumeCache[charSlug].map(function(c) {
        return '<option value="' + escH(c.costume_slug) + '"' + (c.costume_slug === curVal ? ' selected' : '') + '>' + escH(c.costume_name) + '</option>';
      }).join('');
    updateImgKey();
    return;
  }
  try {
    var res  = await fetch('/api/admin/costumes/list?char_slug=' + encodeURIComponent(charSlug));
    var data = await res.json();
    _imgCostumeCache[charSlug] = data.costumes || [];
    sel.innerHTML = '<option value="">— Select Costume —</option>'
      + _imgCostumeCache[charSlug].map(function(c) {
        return '<option value="' + escH(c.costume_slug) + '">' + escH(c.costume_name) + '</option>';
      }).join('');
  } catch(e) {}
  updateImgKey();
}

function updateImgKey() {
  var key = '';
  if (_imgCat === 'chars') {
    var charSel = document.getElementById('img-char-sel');
    var slotSel = document.getElementById('img-slot-type');
    var ch  = charSel ? charSel.value : 'rou';
    var sl  = slotSel ? slotSel.value : 'portrait';
    var slug = ch.toLowerCase();
    var costumeWrap = document.getElementById('img-costume-sel-wrap');
    if (sl === 'portrait') {
      key = 'char_' + slug + '_portrait';
      if (costumeWrap) costumeWrap.style.display = 'none';
    } else if (sl === 'gear') {
      key = 'char_' + slug + '_gear';
      if (costumeWrap) costumeWrap.style.display = 'none';
    } else {
      var cs = ((document.getElementById('img-costume-slug-sel') || {}).value || '').trim();
      key = 'char_' + slug + '_' + (cs || 'costume') + '_icon';
      if (costumeWrap) {
        costumeWrap.style.display = 'block';
        loadImgCostumeOptions(slug);
      }
    }
  } else if (_imgCat === 'comps') {
    var t = (document.getElementById('img-comp-tier') || {}).value || 'T1';
    key = t === 'T1' ? 'board_pos' : 'comp_' + t.toLowerCase() + '_board';
  } else if (_imgCat === 'tiles') {
    var tch  = (document.getElementById('img-tile-char') || {}).value || 'Rou';
    var tsl  = (document.getElementById('img-tile-slot') || {}).value || '1';
    var tslug = tch.toLowerCase();
    key = 'tile_' + tslug + '_' + tsl;
  } else if (_imgCat === 'other') {
    key = ((document.getElementById('img-other-key') || {}).value || '').trim();
  }
  var el = document.getElementById('img-computed-key');
  if (el) el.textContent = key;
  var display = document.getElementById('img-computed-key-display');
  if (display) display.style.display = (_imgCat === 'all') ? 'none' : '';
}

function previewImage(input) {
  if (!input.files || !input.files[0]) return;
  var file  = input.files[0];
  var url   = URL.createObjectURL(file);
  var wrap  = document.getElementById('img-preview-wrap');
  var imgEl = document.getElementById('img-preview');
  var info  = document.getElementById('img-preview-info');
  if (!wrap || !imgEl) return;
  imgEl.onload = function() {
    if (info) info.textContent = imgEl.naturalWidth + ' \xd7 ' + imgEl.naturalHeight + '  \xb7  ~' + (file.size / 1024).toFixed(0) + ' kb';
    wrap.style.display = 'block';
  };
  imgEl.src = url;
}

async function uploadImage() {
  var keyEl = document.getElementById('img-computed-key');
  var key   = keyEl ? keyEl.textContent.trim() : '';
  if (!key) { showAlert('img-alert', false, 'Select a category and configure the slot'); return; }
  var fileEl = document.getElementById('img-file');
  var file   = fileEl && fileEl.files[0];
  if (!file) { showAlert('img-alert', false, 'Select an image file'); return; }
  showAlert('img-alert', true, 'Compressing…');
  var data = await compressToDataUrl(file, 'compress-canvas', 340, 0.85);
  var r = await apiPost('/api/admin/image/upload', { key: key, data: data });
  showAlert('img-alert', r.success, r.message || (r.success ? 'Uploaded!' : 'Error'));
  if (r.success) {
    if (fileEl) fileEl.value = '';
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
      slot.innerHTML = '<img src="' + escH(data) + '" style="object-fit:contain;background:var(--bg2)" data-action="admin-lightbox" data-src="' + escH(data) + '">'
        + '<div class="img-slot-key">' + escH(key) + '</div>'
        + '<button class="btn-danger" style="margin-top:4px;width:100%" data-action="image-delete" data-key="' + escH(key) + '">Delete</button>';
    }
  }
}

async function deleteImage(key) {
  var r = await apiPost('/api/admin/image/delete', { key: key });
  if (r.success) { var s = document.getElementById('imgslot-' + key); if (s) s.remove(); }
  else showAlert('img-alert', false, r.message);
}

function openAdminLightbox(src) {
  var lb  = document.getElementById('admin-lightbox');
  var img = document.getElementById('admin-lightbox-img');
  if (!lb || !img) return;
  img.src = src;
  lb.classList.add('open');
}

function closeAdminLightbox() {
  var lb = document.getElementById('admin-lightbox');
  if (lb) lb.classList.remove('open');
}

/* ══════════════════════════════════════════════════════ CHARACTERS ══ */
function toggleAddCharForm() {
  var f = document.getElementById('add-char-form');
  if (!f) return;
  f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

function autoCharSlug() {
  var nameEl = document.getElementById('new-char-name');
  var slugEl = document.getElementById('new-char-slug');
  if (!nameEl || !slugEl) return;
  slugEl.value = (nameEl.value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function autoCostumeSlug() {
  var nameEl = document.getElementById('cost-name');
  var slugEl = document.getElementById('cost-slug');
  if (!nameEl || !slugEl) return;
  slugEl.value = (nameEl.value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

async function loadChars() {
  try {
    var res  = await fetch('/api/admin/chars/list');
    var data = await res.json();
    var list = document.getElementById('char-list');
    if (!list) return;
    if (!data.chars || !data.chars.length) {
      list.innerHTML = '<p style="color:var(--text3);font-size:0.83rem">No characters yet.</p>';
      return;
    }
    var elemOrder = ['Light','Dark','Fire','Water','Wind'];
    var grouped = {};
    data.chars.forEach(function(c) { var el = c.element||'Dark'; if (!grouped[el]) grouped[el]=[]; grouped[el].push(c); });
    var html = '';
    elemOrder.forEach(function(el) {
      var grp = grouped[el];
      if (!grp || !grp.length) return;
      html += '<div class="elem-group-label" data-elem="' + escH(el) + '" style="font-size:0.7rem;font-weight:700;color:' + (elemColors[el]||'#888') + ';text-transform:uppercase;letter-spacing:0.08em;padding:0.3rem 0.2rem 0.15rem;margin-top:0.25rem">' + el + '</div>';
      grp.forEach(function(c) {
        var col = elemColors[c.element] || '#888';
        html += '<div class="char-row" id="char-' + c.id + '" data-action="char-select" data-id="' + c.id + '" data-name="' + escH(c.name) + '" data-slug="' + escH(c.slug) + '" data-element="' + escH(el) + '">'
          + '<img src="/img/element_' + escH(el.toLowerCase()) + '" class="img-err-hide elem-icon" style="width:14px;height:14px;object-fit:contain;flex-shrink:0">'
          + '<span style="flex:1;font-size:0.85rem;font-weight:600">' + escH(c.name) + '</span>'
          + (c.status === 'upcoming' ? '<span style="font-size:0.7rem;color:var(--gold)">&#128284;</span>' : '')
          + '<button class="btn-danger" data-action="char-delete" data-id="' + c.id + '" style="font-size:0.72rem;padding:3px 8px">&#x2715;</button>'
          + '</div>';
      });
    });
    list.innerHTML = html;
  } catch(e) {}
}

async function addChar() {
  var name    = ((document.getElementById('new-char-name')    || {}).value || '').trim();
  var slug    = ((document.getElementById('new-char-slug')    || {}).value || '').trim();
  var element = (document.getElementById('new-char-element')  || {}).value || 'Dark';
  var status  = (document.getElementById('new-char-status')   || {}).value || 'active';
  var baseCostume = ((document.getElementById('new-char-base-costume') || {}).value || '').trim();
  var portraitEl = document.getElementById('new-char-portrait');
  var portraitFile = portraitEl && portraitEl.files && portraitEl.files[0];
  if (!name || !slug) { showAlert('char-alert', false, 'Name and slug required'); return; }
  var r = await apiPost('/api/admin/chars/add', { name: name, slug: slug, element: element, status: status });
  var portraitData = '';
  if (r.success && portraitFile) {
    showAlert('char-alert', true, 'Uploading portrait…');
    try {
      portraitData = await compressToDataUrl(portraitFile, 'new-char-canvas', 340, 0.85);
      await apiPost('/api/admin/image/upload', { key: 'char_' + slug.toLowerCase() + '_portrait', data: portraitData });
    } catch(e) {}
  }
  if (r.success && baseCostume) {
    var costumeSlug = baseCostume.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (costumeSlug) {
      await apiPost('/api/admin/costumes/add', { char_slug: slug, costume_name: baseCostume, costume_slug: costumeSlug, bond_stats: '' });
      if (portraitData) {
        await apiPost('/api/admin/image/upload', { key: 'char_' + slug.toLowerCase() + '_' + costumeSlug + '_icon', data: portraitData });
      }
    }
  }
  showAlert('char-alert', r.success, r.message);
  if (r.success) {
    document.getElementById('new-char-name').value = '';
    document.getElementById('new-char-slug').value = '';
    var bcEl = document.getElementById('new-char-base-costume');
    if (bcEl) bcEl.value = '';
    if (portraitEl) portraitEl.value = '';
    loadChars();
  }
}

async function moveComp(id, direction) {
  var r = await apiPost('/api/admin/comp/reorder', { id: parseInt(id, 10), direction: direction });
  if (!r.success) { showAlert('comp-add-alert', false, r.message || 'Reorder failed'); return; }
  if (r.comps) updateCompListInPlace(r.comps);
}

function compRowHtmlJs(c) {
  var isAtk = (c.type || 'ATK') === 'ATK';
  var badgeStyle = isAtk
    ? 'background:rgba(41,128,185,0.2);color:#5dade2;border:1px solid rgba(41,128,185,0.35)'
    : 'background:rgba(39,174,96,0.2);color:#2ecc71;border:1px solid rgba(39,174,96,0.35)';
  var badgeText = isAtk ? '&#9876; ATK' : '&#128737; DEF';
  var color = c.color || '#c9a84c';
  return '<div class="admin-item" id="comp-' + c.id + '">'
    + '<div class="admin-item-info" style="display:flex;align-items:center;gap:0.5rem;flex:1">'
    + '<span style="display:inline-block;width:10px;height:10px;border-radius:2px;flex-shrink:0;background:' + color + '"></span>'
    + '<strong>' + escH(c.tier) + ' &mdash; ' + escH(c.name) + '</strong>'
    + '<span style="display:inline-block;margin-left:0.5rem;font-size:0.72rem;padding:2px 8px;border-radius:3px;' + badgeStyle + '">' + badgeText + '</span>'
    + '</div>'
    + '<div style="display:flex;gap:0.3rem;align-items:center">'
    + '<button class="btn" style="padding:2px 7px;font-size:0.75rem;min-width:0;background:var(--bg4);color:var(--text2)" data-action="comp-move-up" data-id="' + c.id + '" title="Move up">&#9650;</button>'
    + '<button class="btn" style="padding:2px 7px;font-size:0.75rem;min-width:0;background:var(--bg4);color:var(--text2)" data-action="comp-move-down" data-id="' + c.id + '" title="Move down">&#9660;</button>'
    + '<button class="btn-danger" data-action="comp-delete" data-id="' + c.id + '">Delete</button>'
    + '</div>'
    + '</div>';
}

function updateCompListInPlace(comps) {
  // Update comp-select dropdown
  var sel = document.getElementById('comp-select');
  if (sel) {
    var curVal = sel.value;
    var newOpt = sel.querySelector('option[value="new"]');
    Array.from(sel.options).forEach(function(o) { if (o.value && o.value !== 'new') o.remove(); });
    comps.forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c.id;
      opt.dataset.tier      = c.tier;
      opt.dataset.name      = c.name || '';
      opt.dataset.type      = c.type || 'ATK';
      opt.dataset.color     = c.color || '#c9a84c';
      opt.dataset.shortDesc  = c.short_description || '';
      opt.dataset.guideLabel = c.guide_label || '';
      opt.dataset.notes      = c.description || '';
      opt.dataset.unitOrder  = c.unit_order || '[]';
      opt.dataset.cby        = c.countered_by || '';
      opt.text = c.tier + ' — ' + c.name + ' (' + (c.type || 'ATK') + ')';
      if (newOpt) sel.insertBefore(opt, newOpt);
      else sel.appendChild(opt);
    });
    // Restore selection; update _compTier if selected comp was renamed
    if (curVal && curVal !== 'new') {
      sel.value = curVal;
      var cur = comps.find(function(c) { return String(c.id) === String(curVal); });
      if (cur) {
        _compTier = cur.tier;
        var label = document.getElementById('comp-editor-tier-label');
        if (label) label.textContent = cur.tier + ' — Editing content';
      }
    }
  }
  // Update comp list panel
  var list = document.getElementById('comp-list');
  if (!list) return;
  var atkComps = comps.filter(function(c) { return (c.type || 'ATK') === 'ATK'; });
  var defComps = comps.filter(function(c) { return (c.type || 'ATK') === 'DEF'; });
  var html = '';
  if (atkComps.length) {
    html += '<div style="font-size:0.7rem;font-weight:700;color:#5dade2;text-transform:uppercase;letter-spacing:0.08em;padding:0.3rem 0.2rem 0.15rem;margin-top:0.25rem">&#9876; Attacking</div>';
    html += atkComps.map(compRowHtmlJs).join('');
  }
  if (defComps.length) {
    html += '<div style="font-size:0.7rem;font-weight:700;color:#2ecc71;text-transform:uppercase;letter-spacing:0.08em;padding:0.3rem 0.2rem 0.15rem;margin-top:0.5rem;border-top:1px solid var(--border2);padding-top:0.5rem">&#128737; Defence</div>';
    html += defComps.map(compRowHtmlJs).join('');
  }
  list.innerHTML = html || '<p style="color:var(--text3);font-size:0.83rem">No compositions yet.</p>';
}

async function normalizeCompTiers() {
  showAlert('normalize-alert', true, 'Normalizing…');
  var r = await apiPost('/api/admin/comp/normalize-tiers', {});
  showAlert('normalize-alert', r.success, r.message);
  if (r.success) {
    // Reload comps from server
    try {
      var res = await fetch('/api/admin/chars/list'); // reuse pattern: fetch comps fresh
    } catch(e) {}
    window.location.reload();
  }
}

async function resetAllChars() {
  if (!confirm('DELETE all characters, costumes, skills, bonds, portraits and gear images?\\n\\nThis cannot be undone.')) return;
  showAlert('reset-chars-alert', true, 'Deleting…');
  var r = await apiPost('/api/admin/chars/reset', {});
  showAlert('reset-chars-alert', r.success, r.message);
  if (r.success) { loadChars(); loadCompChars && loadCompChars(); }
}

async function resetAllRotations() {
  if (!confirm('DELETE all skill rotation data?\\n\\nThis cannot be undone.')) return;
  showAlert('reset-rotations-alert', true, 'Deleting…');
  var r = await apiPost('/api/admin/rotations/reset', {});
  showAlert('reset-rotations-alert', r.success, r.message);
}

async function saveSecretCode() {
  var code = ((document.getElementById('new-secret-code') || {}).value || '').trim();
  if (!code || code.length < 4) { showAlert('secret-code-alert', false, 'Code must be at least 4 characters'); return; }
  var r = await apiPost('/api/admin/secret/save', { code: code });
  showAlert('secret-code-alert', r.success, r.message);
  if (r.success) document.getElementById('new-secret-code').value = '';
}

async function saveEmoteLockHint() {
  var hint = ((document.getElementById('emote-lock-hint') || {}).value || '').trim();
  if (!hint) { showAlert('emote-lock-hint-alert', false, 'Hint cannot be empty'); return; }
  var r = await apiPost('/api/admin/emote-lock-hint/save', { hint: hint });
  showAlert('emote-lock-hint-alert', r.success, r.message);
}

async function deleteChar(id) {
  var r = await apiPost('/api/admin/chars/delete', { id: id });
  if (r.success) { var el = document.getElementById('char-' + id); if (el) el.remove(); }
  else showAlert('char-alert', false, r.message);
}

function selectChar(id, name, slug) {
  _selectedCharId   = id;
  _selectedCharSlug = slug;
  _selectedCharName = name;

  document.querySelectorAll('#char-list .char-row').forEach(function(el) {
    el.classList.remove('selected');
  });
  var row = document.getElementById('char-' + id);
  if (row) row.classList.add('selected');

  var detail = document.getElementById('char-detail');
  var nameEl = document.getElementById('detail-char-name');
  if (detail) detail.style.display = 'block';
  if (nameEl) nameEl.textContent = name;

  showCharSubtab('costumes');
  loadCostumes(slug);
  updateCharImgKey();
  loadCharImgGrid();
}

function showCharSubtab(name) {
  var subtabs = ['costumes','skills','images'];
  for (var i = 0; i < subtabs.length; i++) {
    var el = document.getElementById('char-subtab-' + subtabs[i]);
    if (el) el.style.display = subtabs[i] === name ? 'block' : 'none';
  }
  document.querySelectorAll('.char-subtab-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.subtab === name);
  });
}

async function loadCostumes(charSlug) {
  try {
    var res  = await fetch('/api/admin/costumes/list?char_slug=' + encodeURIComponent(charSlug));
    var data = await res.json();
    var list = document.getElementById('costume-list');
    if (!list) return;

    var skillsSel = document.getElementById('skills-costume-sel');

    if (!data.costumes || !data.costumes.length) {
      list.innerHTML = '<p style="color:var(--text3);font-size:0.83rem">No costumes yet.</p>';
      if (skillsSel) skillsSel.innerHTML = '<option value="">— No costumes —</option>';
      return;
    }
    list.innerHTML = data.costumes.map(function(c) {
      return '<div class="admin-item" id="costume-' + c.id + '">'
        + '<div class="admin-item-info" data-action="costume-select" data-id="' + c.id + '" data-name="' + escH(c.costume_name) + '" data-slug="' + escH(c.costume_slug) + '" style="cursor:pointer">'
        + '<strong>' + escH(c.costume_name) + '</strong>'
        + (c.bond_stats ? '<span style="font-size:0.75rem;color:var(--text3);display:block">' + escH(c.bond_stats.substring(0,60)) + '</span>' : '')
        + '</div>'
        + '<button class="btn-danger" data-action="costume-delete" data-id="' + c.id + '">Delete</button>'
        + '</div>';
    }).join('');

    if (skillsSel) {
      skillsSel.innerHTML = data.costumes.map(function(c) {
        return '<option value="' + escH(c.costume_slug) + '">' + escH(c.costume_name) + '</option>';
      }).join('');
    }
  } catch(e) {}
}

async function addCostume() {
  var name  = ((document.getElementById('cost-name')  || {}).value || '').trim();
  var slug  = ((document.getElementById('cost-slug')  || {}).value || '').trim();
  var imgEl = document.getElementById('cost-img');
  var imgFile = imgEl && imgEl.files && imgEl.files[0];
  if (!name || !slug) { showAlert('cost-alert', false, 'Name and slug required'); return; }
  var r = await apiPost('/api/admin/costumes/add', { char_slug: _selectedCharSlug, costume_name: name, costume_slug: slug, bond_stats: '' });
  if (r.success && imgFile && _selectedCharSlug) {
    showAlert('cost-alert', true, 'Uploading costume image…');
    try {
      var data = await compressToDataUrl(imgFile, 'cost-img-canvas', 340, 0.85);
      await apiPost('/api/admin/image/upload', { key: 'char_' + _selectedCharSlug.toLowerCase() + '_' + slug + '_icon', data: data });
    } catch(e) {}
  }
  showAlert('cost-alert', r.success, r.message);
  if (r.success) {
    document.getElementById('cost-name').value  = '';
    document.getElementById('cost-slug').value  = '';
    if (imgEl) imgEl.value = '';
    loadCostumes(_selectedCharSlug);
  }
}

async function saveBondStats() {
  var sel = document.getElementById('skills-costume-sel');
  var slug = sel ? sel.value : _selectedCostumeSlug;
  if (!slug) { showAlert('bond-stats-alert', false, 'Select a costume first'); return; }
  var stats = ((document.getElementById('skill-bond-stats') || {}).value || '').trim();
  var r = await apiPost('/api/admin/costumes/update', { char_slug: _selectedCharSlug, costume_slug: slug, bond_stats: stats });
  showAlert('bond-stats-alert', r.success, r.message);
}

async function loadBondStatsForCostume(slug) {
  if (!_selectedCharSlug || !slug) return;
  try {
    var res = await fetch('/api/admin/costumes/list?char_slug=' + encodeURIComponent(_selectedCharSlug));
    var data = await res.json();
    var match = (data.costumes||[]).find(function(c) { return c.costume_slug === slug; });
    var ta = document.getElementById('skill-bond-stats');
    if (ta) ta.value = match ? (match.bond_stats || '') : '';
  } catch(e) {}
}

async function deleteCostume(id) {
  var r = await apiPost('/api/admin/costumes/delete', { id: id });
  if (r.success) { var el = document.getElementById('costume-' + id); if (el) el.remove(); }
  else showAlert('cost-alert', false, r.message);
}

function selectCostume(id, name, slug) {
  _selectedCostumeSlug = slug;
  var skillsSel = document.getElementById('skills-costume-sel');
  if (skillsSel) skillsSel.value = slug;
  loadSkills(slug);
  loadBondStatsForCostume(slug);
}

function loadSkillsForCostume() {
  var sel = document.getElementById('skills-costume-sel');
  if (!sel || !sel.value) return;
  _selectedCostumeSlug = sel.value;
  loadSkills(sel.value);
  loadBondStatsForCostume(sel.value);
}

async function loadSkills(costumeSlug) {
  try {
    var res  = await fetch('/api/admin/skills/list?costume_slug=' + encodeURIComponent(costumeSlug));
    var data = await res.json();
    var list = document.getElementById('skill-list');
    if (!list) return;
    if (!data.skills || !data.skills.length) {
      list.innerHTML = '<p style="color:var(--text3);font-size:0.83rem">No skills yet.</p>';
      return;
    }
    var charSlug = _selectedCharSlug || '';
    list.innerHTML = data.skills.map(function(s) {
      var tileKey = 'char_skill_' + charSlug + '_' + s.id;
      return '<div class="admin-item" id="skill-' + s.id + '">'
        + '<div class="admin-item-info" style="display:flex;align-items:center;gap:0.5rem;flex:1">'
        + '<img src="/img/' + escH(tileKey) + '" class="img-err-dim skill-tile-img" style="width:32px;height:32px;object-fit:contain;border-radius:4px;background:var(--bg2);border:1px solid var(--border2);flex-shrink:0">'
        + '<div>'
        + '<strong>' + escH(s.skill_name) + '</strong> \xb7 SP ' + s.sp_cost + ' \xb7 CD ' + s.cooldown + ' \xb7 ' + escH(s.tile_type)
        + (s.description ? '<span style="font-size:0.72rem;color:var(--text3);display:block">' + escH(s.description.substring(0,80)) + '</span>' : '')
        + '</div></div>'
        + '<div style="display:flex;gap:0.3rem;align-items:center">'
        + '<button class="btn" data-action="skill-tile-upload" data-skill-id="' + s.id + '" style="font-size:0.72rem;padding:3px 8px" title="Upload tile image">📷</button>'
        + '<button class="btn-danger" data-action="skill-delete" data-id="' + s.id + '">Delete</button>'
        + '</div>'
        + '</div>';
    }).join('');
  } catch(e) {}
}

async function addSkill() {
  var name = ((document.getElementById('skill-name') || {}).value || '').trim();
  var tile = (document.getElementById('skill-tile')  || {}).value || 'FRONT';
  var sp   = (document.getElementById('skill-sp')    || {}).value || '3';
  var cd   = (document.getElementById('skill-cd')    || {}).value || '5';
  var desc = ((document.getElementById('skill-desc') || {}).value || '').trim();
  if (!name) { showAlert('skill-alert', false, 'Skill name required'); return; }
  var costSel = document.getElementById('skills-costume-sel');
  var cosSlug = costSel ? costSel.value : _selectedCostumeSlug;
  var r = await apiPost('/api/admin/skills/add', { char_slug: _selectedCharSlug, costume_slug: cosSlug, skill_name: name, sp_cost: +sp, cooldown: +cd, tile_type: tile, description: desc });
  showAlert('skill-alert', r.success, r.message);
  if (r.success) {
    document.getElementById('skill-name').value = '';
    document.getElementById('skill-desc').value = '';
    loadSkills(cosSlug);
  }
}

async function deleteSkill(id) {
  var r = await apiPost('/api/admin/skills/delete', { id: id });
  if (r.success) { var el = document.getElementById('skill-' + id); if (el) el.remove(); }
  else showAlert('skill-alert', false, r.message);
}

/* ═══════════════════════════════════════════ CHARACTER IMAGES ══ */
function updateCharImgKey() {
  var slotSel = document.getElementById('char-img-slot');
  var slot    = slotSel ? slotSel.value : 'portrait';
  var slug    = _selectedCharSlug ? _selectedCharSlug.toLowerCase() : '';
  var wrap    = document.getElementById('char-img-costume-wrap');
  var display = document.getElementById('char-img-computed-key');
  var key     = '';

  if (slot === 'portrait') {
    key = slug ? 'char_' + slug + '_portrait' : '';
    if (wrap) wrap.style.display = 'none';
  } else if (slot === 'gear') {
    key = slug ? 'char_' + slug + '_gear' : '';
    if (wrap) wrap.style.display = 'none';
  } else {
    var cs = ((document.getElementById('char-img-costume-slug') || {}).value || '').trim();
    key = slug ? 'char_' + slug + '_' + (cs || 'costume') + '_icon' : '';
    if (wrap) wrap.style.display = 'block';
  }
  if (display) display.textContent = key ? 'Key: ' + key : '';
}

function previewCharImage(input) {
  if (!input.files || !input.files[0]) return;
  var file  = input.files[0];
  var url   = URL.createObjectURL(file);
  var wrap  = document.getElementById('char-img-preview-wrap');
  var imgEl = document.getElementById('char-img-preview');
  if (!wrap || !imgEl) return;
  imgEl.onload = function() { wrap.style.display = 'block'; };
  imgEl.src = url;
  uploadCharImage(
    (document.getElementById('char-img-slot') || {}).value || 'portrait',
    file
  );
}

async function uploadCharImage(slot, file) {
  var slug = _selectedCharSlug ? _selectedCharSlug.toLowerCase() : '';
  if (!slug) { showAlert('char-img-alert', false, 'Select a character first'); return; }
  if (!file) {
    var fileEl = document.getElementById('char-img-file');
    file = fileEl && fileEl.files[0];
  }
  if (!file) { showAlert('char-img-alert', false, 'Select an image file'); return; }
  var key = '';
  if (slot === 'portrait') {
    key = 'char_' + slug + '_portrait';
  } else if (slot === 'gear') {
    key = 'char_' + slug + '_gear';
  } else {
    var cs = ((document.getElementById('char-img-costume-slug') || {}).value || '').trim();
    if (!cs) { showAlert('char-img-alert', false, 'Enter costume slug'); return; }
    key = 'char_' + slug + '_' + cs + '_icon';
  }
  showAlert('char-img-alert', true, 'Compressing…');
  var data = await compressToDataUrl(file, 'char-compress-canvas', 340, 0.85);
  var r = await apiPost('/api/admin/image/upload', { key: key, data: data });
  showAlert('char-img-alert', r.success, r.message || (r.success ? 'Uploaded!' : 'Error'));
  if (r.success) {
    var fileEl2 = document.getElementById('char-img-file');
    if (fileEl2) fileEl2.value = '';
    var wrap = document.getElementById('char-img-preview-wrap');
    if (wrap) wrap.style.display = 'none';
    loadCharImgGrid();
  }
}

function triggerCharUpload(slot) {
  var fileEl = document.getElementById('char-img-file');
  if (!fileEl) return;
  fileEl.onchange = function() {
    if (fileEl.files && fileEl.files[0]) {
      var wrap  = document.getElementById('char-img-preview-wrap');
      var imgEl = document.getElementById('char-img-preview');
      if (wrap && imgEl) {
        var url = URL.createObjectURL(fileEl.files[0]);
        imgEl.onload = function() { wrap.style.display = 'block'; };
        imgEl.src = url;
      }
      uploadCharImage(slot, fileEl.files[0]);
    }
  };
  fileEl.click();
}

async function loadCharImgGrid() {
  var grid = document.getElementById('char-img-grid');
  if (!grid || !_selectedCharSlug) return;
  var slug = _selectedCharSlug.toLowerCase();
  var slots = [
    { key: 'char_' + slug + '_portrait', label: 'Portrait',  slot: 'portrait' },
    { key: 'char_' + slug + '_gear',     label: 'Gear',      slot: 'gear' },
  ];
  var cosInput = document.getElementById('char-img-costume-slug');
  var cs = cosInput ? cosInput.value.trim() : '';
  if (cs) slots.push({ key: 'char_' + slug + '_' + cs + '_icon', label: cs + ' Icon', slot: 'icon' });

  grid.innerHTML = slots.map(function(s) {
    return '<div style="text-align:center;width:100px">'
      + '<img src="/img/' + escH(s.key) + '" class="img-err-dim" style="width:100px;height:100px;object-fit:contain;background:var(--bg2);border-radius:6px;border:1px solid var(--border2)" data-action="admin-lightbox" data-src="/img/' + escH(s.key) + '">'
      + '<div style="font-size:0.7rem;color:var(--text3);margin-top:3px">' + escH(s.label) + '</div>'
      + '<button class="btn" style="font-size:0.68rem;padding:3px 8px;margin-top:4px" data-action="upload-trigger" data-slot="' + escH(s.slot) + '">Upload</button>'
      + '</div>';
  }).join('');
}

/* ══════════════════════════════════════════ COMP ROTATION ══ */
var _rotSaved   = {};   // { char_name: { slot: costume_name } }
var _rotCostMap = {};   // { char_name: [costume_name, ...] }

async function loadCompRotation() {
  if (!_compTier) return;
  // Load saved rotation rows
  try {
    var res  = await fetch('/api/admin/comp/rotation/get?tier=' + encodeURIComponent(_compTier));
    var data = await res.json();
    _rotSaved = {};
    (data.rotation || []).forEach(function(r) {
      if (!_rotSaved[r.char_name]) _rotSaved[r.char_name] = {};
      _rotSaved[r.char_name][r.slot] = r.costume || r.skill_name || '';
    });
  } catch(e) {}
  // Load comp chars to pre-fill selectors
  var chars = [];
  try {
    var cres  = await fetch('/api/admin/chars/list');
    var cdata = await cres.json();
    chars = cdata.chars || [];
  } catch(e) {}
  buildRotationSelectors(chars);
}

function buildRotationSelectors(allChars) {
  var box = document.getElementById('rot-char-selectors');
  if (!box) return;
  var opts = '<option value="">— None —</option>' + allChars.map(function(c) {
    return '<option value="' + escH(c.name) + '" data-slug="' + escH(c.slug) + '">' + escH(c.name) + '</option>';
  }).join('');
  // Pre-fill from existing saved chars
  var savedChars = Object.keys(_rotSaved);
  box.innerHTML = [1,2,3,4,5].map(function(i) {
    var preselect = savedChars[i-1] || '';
    var selOpts = opts.replace(
      'value="' + escH(preselect) + '"',
      'value="' + escH(preselect) + '" selected'
    );
    return '<div>'
      + '<div style="font-size:0.7rem;color:var(--text3);margin-bottom:2px">Char ' + i + '</div>'
      + '<select class="rot-char-sel" data-pos="' + i + '" style="width:100%;font-size:0.8rem;background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:5px;border-radius:4px" data-action="rot-char-change">' + selOpts + '</select>'
      + '</div>';
  }).join('');
  buildRotationGrid();
}

async function onRotCharChange(sel) {
  var charName = sel.value;
  if (charName && !_rotCostMap[charName]) {
    var slug = sel.options[sel.selectedIndex] ? (sel.options[sel.selectedIndex].dataset.slug || '') : '';
    await loadRotCostumes(charName, slug);
  }
  buildRotationGrid();
}

async function loadRotCostumes(charName, charSlug) {
  if (!charSlug) charSlug = charName.toLowerCase().replace(/[^a-z0-9]/g, '');
  try {
    var res  = await fetch('/api/admin/costumes/list?char_slug=' + encodeURIComponent(charSlug));
    var data = await res.json();
    _rotCostMap[charName] = (data.costumes || []).map(function(c) { return c.costume_name || c.name || ''; }).filter(Boolean);
  } catch(e) { _rotCostMap[charName] = []; }
}

function buildRotationGrid() {
  var grid = document.getElementById('rot-grid');
  if (!grid) return;
  var sels = document.querySelectorAll('.rot-char-sel');
  var selected = [];
  sels.forEach(function(s) {
    if (s.value) {
      var opt = s.options[s.selectedIndex];
      selected.push({ name: s.value, slug: opt ? (opt.dataset.slug || '') : '' });
    }
  });
  if (!selected.length) { grid.innerHTML = '<p style="color:var(--text3);font-size:0.83rem">Select characters above to build the rotation grid.</p>'; return; }

  // Show summary cards per character with an "Edit Rotation" button
  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:0.6rem">';
  selected.forEach(function(c) {
    var saved   = _rotSaved[c.name] || {};
    var filled  = Object.keys(saved).filter(function(k){ return saved[k]; }).length;
    var portrait = c.slug ? '/img/char_' + escH(c.slug) + '_portrait' : '';
    html += '<div style="background:var(--bg4);border:1px solid var(--border2);border-radius:6px;padding:0.5rem;display:flex;flex-direction:column;align-items:center;gap:0.4rem">'
         + (portrait ? '<div style="width:48px;height:48px;border-radius:50%;overflow:hidden;background:var(--bg2);border:1px solid var(--border2)"><img src="' + portrait + '" class="img-err-dim" style="width:100%;height:100%;object-fit:cover"></div>' : '')
         + '<div style="font-weight:700;font-size:0.78rem;color:var(--gold2);text-align:center">' + escH(c.name) + '</div>'
         + '<div style="font-size:0.7rem;color:var(--text3)">' + filled + ' / 10 slots</div>'
         + '<button class="btn" style="width:auto;padding:5px 12px;font-size:0.75rem" data-action="rot-edit-char" data-char="' + escH(c.name) + '">Edit Rotation</button>'
         + '</div>';
  });
  html += '</div>';
  grid.innerHTML = html;
}

/* Rotation Edit Modal — single character, 10 slots */
var _rotEditChar = null;

async function openRotEditModal(charName) {
  _rotEditChar = charName;
  var modal = document.getElementById('rot-edit-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  if (!_rotCostMap[charName]) await loadRotCostumes(charName);
  renderRotEditModal();
}

function closeRotEditModal() {
  var modal = document.getElementById('rot-edit-modal');
  if (modal) modal.style.display = 'none';
  _rotEditChar = null;
  buildRotationGrid();
}

function renderRotEditModal() {
  var charName = _rotEditChar;
  if (!charName) return;
  var titleEl = document.getElementById('rot-edit-title');
  if (titleEl) titleEl.textContent = charName + " — Skill Rotation";
  var body = document.getElementById('rot-edit-body');
  if (!body) return;
  var costumes = _rotCostMap[charName] || [];
  var saved    = _rotSaved[charName]   || {};
  var costOpts = '<option value="">— None —</option>' + costumes.map(function(cn) {
    return '<option value="' + escH(cn) + '">' + escH(cn) + '</option>';
  }).join('');
  var selStyle = 'background:var(--bg2);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:0.85rem;padding:6px 8px;flex:1';
  var html = '<div style="display:flex;flex-direction:column;gap:0.5rem">';
  for (var slot = 1; slot <= 10; slot++) {
    var cur = saved[slot] || '';
    var selOpts = costOpts.replace('value="' + escH(cur) + '">', 'value="' + escH(cur) + '" selected>');
    html += '<div style="display:flex;align-items:center;gap:0.5rem">'
         + '<span style="font-size:0.8rem;color:var(--text3);width:24px;flex-shrink:0;text-align:right;font-family:Cinzel,serif">' + slot + '</span>'
         + '<select style="' + selStyle + '"'
         +   ' data-action="rot-slot-change"'
         +   ' data-char="' + escH(charName) + '"'
         +   ' data-slot="' + slot + '">'
         +   selOpts + '</select>';
    if (cur) {
      html += '<button class="btn-danger" style="font-size:0.75rem;padding:4px 9px;flex-shrink:0"'
           +   ' data-action="rot-delete"'
           +   ' data-char="' + escH(charName) + '"'
           +   ' data-slot="' + slot + '">×</button>';
    }
    html += '</div>';
  }
  html += '</div>';
  body.innerHTML = html;
}

async function saveRotationSlot(charName, slot, costumeName) {
  if (!_compTier || !charName || !slot) return;
  if (!costumeName) { await deleteCompRotationSlot(charName, slot); return; }
  var r = await apiPost('/api/admin/comp/rotation/save', {
    tier: _compTier, char_name: charName, slot: +slot,
    skill_name: costumeName, costume: costumeName,
    sp_cost: 1, cooldown: 5, tile_type: 'FRONT', description: ''
  });
  if (r.success) {
    if (!_rotSaved[charName]) _rotSaved[charName] = {};
    _rotSaved[charName][slot] = costumeName;
    if (_rotEditChar === charName) renderRotEditModal();
  } else showAlert('rot-alert', false, r.message);
}

async function deleteCompRotationSlot(charName, slot) {
  if (!_compTier) return;
  var r = await apiPost('/api/admin/comp/rotation/delete', { tier: _compTier, char_name: charName, slot: +slot });
  if (r.success) {
    if (_rotSaved[charName]) delete _rotSaved[charName][slot];
    if (_rotEditChar === charName) renderRotEditModal();
    else buildRotationGrid();
  } else showAlert('rot-alert', false, r.message);
}

/* ════════════════════════════════════════════ HOME NOTES ══ */
async function saveHomeNote(slot) {
  var title   = ((document.getElementById('home-note-title-'   + slot)||{}).value||'').trim();
  var content = ((document.getElementById('home-note-content-' + slot)||{}).value||'').trim();
  var r = await apiPost('/api/admin/home/notes/save', { slot: slot, title: title, content: content });
  showAlert('home-note-alert-' + slot, r.success, r.message);
}

async function loadHomeNotes() {
  for (var i = 1; i <= 4; i++) {
    (function(slot) {
      fetch('/api/admin/home/notes/get?slot=' + slot).then(function(res) { return res.json(); }).then(function(data) {
        if (!data.data) return;
        var titleEl   = document.getElementById('home-note-title-'   + slot);
        var contentEl = document.getElementById('home-note-content-' + slot);
        if (titleEl)   titleEl.value   = data.data.title   || '';
        if (contentEl) contentEl.value = data.data.content || '';
      }).catch(function(){});
    })(i);
  }
}

/* ═════════════════════════════════════════ ADMIN LIGHTBOX ══ */
/* (openAdminLightbox / closeAdminLightbox already defined above) */

/* ════════════════════════════════════════════ ERROR DISPLAY ══ */
window.onerror = function(msg, src, line) {
  var el = document.getElementById('admin-debug');
  if (el) el.textContent = 'JS Error line ' + line + ': ' + msg;
};

/* ══════════════════════════════════════ DELEGATED CLICK LISTENER ══ */
document.addEventListener('click', function(e) {
  // Close the element picker when clicking outside it
  var pickerMenu = document.getElementById('set-cfg-target-menu');
  if (pickerMenu && pickerMenu.style.display === 'block' && !e.target.closest('.elem-picker')) {
    pickerMenu.style.display = 'none';
  }
  var b = e.target.closest('[data-action]');
  if (!b) return;
  var action = b.dataset.action;
  var id     = b.dataset.id;
  var key    = b.dataset.key;
  try {
  if (action === 'coupon-delete')   deleteCoupon(id);
  if (action === 'comp-delete')     deleteComp(id);
  if (action === 'comp-move-up')    moveComp(id, 'up');
  if (action === 'comp-move-down')  moveComp(id, 'down');
  if (action === 'emote-delete')    deleteEmote(id);
  if (action === 'image-delete')    deleteImage(key);
  if (action === 'char-delete')     deleteChar(id);
  if (action === 'costume-delete')  deleteCostume(id);
  if (action === 'skill-delete')    deleteSkill(id);
  if (action === 'char-select')     selectChar(parseInt(b.dataset.id, 10), b.dataset.name, b.dataset.slug);
  if (action === 'costume-select')  selectCostume(parseInt(b.dataset.id, 10), b.dataset.name, b.dataset.slug);
  if (action === 'admin-lightbox')  openAdminLightbox(b.dataset.src);
  if (action === 'elem-picker-toggle') {
    e.stopPropagation();
    var menu = document.getElementById('set-cfg-target-menu');
    if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  }
  var opt = e.target.closest('#set-cfg-target-menu .elem-opt');
  if (opt) {
    e.stopPropagation();
    var v = opt.dataset.elem || '';
    var hid = document.getElementById('set-cfg-target');
    if (hid) hid.value = v;
    updateElemPickerDisplay(v);
    var menu2 = document.getElementById('set-cfg-target-menu');
    if (menu2) menu2.style.display = 'none';
  }
  if (action === 'upload-trigger')  triggerCharUpload(b.dataset.slot);
  if (action === 'char-tab')        showCharSubtab(b.dataset.subtab);
  if (action === 'img-cat')         setImgCat(b.dataset.cat);
  if (action === 'tab-switch')      showTab(b.dataset.tab);
  if (action === 'rot-delete')       deleteCompRotationSlot(b.dataset.char, parseInt(b.dataset.slot, 10));
  if (action === 'rot-edit-char')    openRotEditModal(b.dataset.char);
  if (action === 'preset-color')     { var ce = document.getElementById('comp-color'); if (ce) ce.value = b.dataset.color; }
  if (action === 'home-note-save')   saveHomeNote(parseInt(b.dataset.slot, 10));
  if (action === 'save-secret-code') saveSecretCode();
  if (action === 'save-emote-lock-hint') saveEmoteLockHint();
  if (action === 'normalize-tiers')  normalizeCompTiers();
  if (action === 'save-comp-bonds')  saveCompBonds();
  if (action === 'upload-board-front') uploadCompBoard('', 'comp-board-file', 'comp-canvas', 'comp-board-preview');
  if (action === 'upload-board-back')  uploadCompBoard('_back', 'comp-board-back-file', 'comp-canvas-back', 'comp-board-back-preview');
  if (action === 'save-how-to-play') saveHowToPlay();
  if (action === 'add-preemptive')   addPreemptive();
  if (action === 'preemptive-delete') deletePreemptive(parseInt(b.dataset.index, 10));
  if (action === 'add-emote')        addEmote();
  if (action === 'save-emote-set')   saveEmoteSet();
  if (action === 'save-set-cfg')     saveSetConfig();
  if (action === 'upload-unlock-img') uploadUnlockImg();
  if (action === 'clear-unlock-img')  clearUnlockImg();
  if (action === 'bulk-add-emotes')  bulkAddEmotes();
  if (action === 'upload-lock-img')  uploadLockImg();
  if (action === 'save-special-code-config') saveSpecialCodeConfig();
  if (action === 'upload-special-lock-img') uploadSpecialLockImg();
  if (action === 'save-matchups')    saveMatchups();
  if (action === 'save-card-label')  saveCardLabel();
  if (action === 'save-guide-label') saveGuideLabel();
  if (action === 'save-all-comp')    saveAllComp();
  if (action === 'skill-tile-upload') uploadSkillTile(parseInt(b.dataset.skillId, 10));
  if (action === 'kitsu-reset-page') {
    localStorage.removeItem('kitsu_unlocked');
    showAlert('kitsu-reset-alert', true, 'Page lock reset. Reload the emotes page to see the lock screen.');
  }
  if (action === 'kitsu-reset-sets') {
    var n = 0;
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var k = localStorage.key(i);
      if (k && k.indexOf('kitsu_set_') === 0) { localStorage.removeItem(k); n++; }
    }
    showAlert('kitsu-reset-alert', true, 'Cleared ' + n + ' per-set unlock keys.');
  }
  if (action === 'kitsu-reset-all') {
    var m = 0;
    for (var j = localStorage.length - 1; j >= 0; j--) {
      var kk = localStorage.key(j);
      if (kk && kk.indexOf('kitsu_') === 0) { localStorage.removeItem(kk); m++; }
    }
    localStorage.removeItem('kitsu_mamonir_taps');
    showAlert('kitsu-reset-alert', true, 'Cleared ' + m + ' kitsu_* keys (page lock, set unlocks, click trackers).');
  }
  if (action === 'save-nav-icon-settings') saveNavIconSettings();
  if (action === 'upload-mamonir-nav') uploadMamonirNav();
  if (action === 'upload-comp-gear') uploadCompGear();
  if (action === 'clear-comp-gear')  clearCompGear();
  if (action === 'admin-elem-filter') {
    document.querySelectorAll('.elem-dot-btn').forEach(function(x) { x.classList.remove('active'); });
    b.classList.add('active');
    var filterEl = (b.dataset.elem || '').toLowerCase();
    document.querySelectorAll('#char-list .char-row').forEach(function(row) {
      var re = (row.dataset.element || '').toLowerCase();
      row.style.display = (filterEl === 'all' || re === filterEl) ? '' : 'none';
    });
    document.querySelectorAll('#char-list .elem-group-label').forEach(function(label) {
      var le = (label.dataset.elem || '').toLowerCase();
      label.style.display = (filterEl === 'all' || le === filterEl) ? '' : 'none';
    });
  }
  } catch(err) {
    console.error('[admin click handler]', action, err);
    var dbg = document.getElementById('admin-debug');
    if (dbg) dbg.textContent = 'Click error on ' + action + ': ' + (err && err.message);
  }
});

/* ═════════════════════════════════ DELEGATED CHANGE LISTENER ══ */
document.addEventListener('change', function(e) {
  var sel = e.target;
  if (!sel || sel.tagName !== 'SELECT') return;
  var action = sel.dataset && sel.dataset.action;
  if (!action) return;
  if (action === 'rot-char-change') onRotCharChange(sel);
  if (action === 'rot-slot-change') saveRotationSlot(sel.dataset.char, parseInt(sel.dataset.slot, 10), sel.value);
});

/* ═════════════════════════════════════════════════════ INIT ══ */
document.addEventListener('error', function(e) {
  var t = e.target;
  if (t.tagName !== 'IMG') return;
  if (t.classList.contains('img-err-hide')) t.classList.add('errored');
  if (t.classList.contains('img-err-dim'))  t.classList.add('errored');
}, true);
try { updateImgKey(); } catch(_e) {}
try { setupEmoteSetUI(); } catch(_e) {}

/* ═══════════════════════════ BONDS / UNIT-ORDER MODAL WIRING ══ */
try { (function() {
  var openBondsBtn  = document.getElementById('open-bonds-modal-btn');
  var closeBondsBtn = document.getElementById('close-bonds-modal-btn');
  var openUOBtn     = document.getElementById('open-unit-order-btn');
  var closeUOBtn    = document.getElementById('close-unit-order-btn');
  if (openBondsBtn)  openBondsBtn.addEventListener('click',  openBondsModal);
  if (closeBondsBtn) closeBondsBtn.addEventListener('click', closeBondsModal);
  if (openUOBtn)     openUOBtn.addEventListener('click',     openUnitOrderModal);
  if (closeUOBtn)    closeUOBtn.addEventListener('click',    closeUnitOrderModal);

  // Close on backdrop click
  var bm = document.getElementById('bonds-modal');
  if (bm) bm.addEventListener('click', function(e) { if (e.target === bm) closeBondsModal(); });
  var um = document.getElementById('unit-order-modal');
  if (um) um.addEventListener('click', function(e) { if (e.target === um) closeUnitOrderModal(); });
  var rm = document.getElementById('rot-edit-modal');
  if (rm) rm.addEventListener('click', function(e) { if (e.target === rm) closeRotEditModal(); });
  var closeRotBtn = document.getElementById('close-rot-edit-btn');
  if (closeRotBtn) closeRotBtn.addEventListener('click', closeRotEditModal);

  // Element filter buttons
  document.querySelectorAll('.bond-elem-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      _bondsCurElem = btn.dataset.elem || 'all';
      document.querySelectorAll('.bond-elem-btn').forEach(function(b) {
        b.style.background = b === btn ? 'var(--gold)' : 'var(--bg3)';
        b.style.color      = b === btn ? '#0a0a0f'     : 'var(--text2)';
      });
      renderBondsCharGrid(_bondsCurElem);
    });
  });

  // Character search
  var cs = document.getElementById('bonds-char-search');
  if (cs) cs.addEventListener('input', function() { renderBondsCharGrid(_bondsCurElem || 'all'); });
})(); } catch(_e) {}

/* ═══════════════════════════════════════ COMP LIST DRAG & DROP ══ */
function initCompDragDrop() {
  var list = document.getElementById('comp-list');
  if (!list) return;
  var dragging = null;
  list.addEventListener('dragstart', function(e) {
    dragging = e.target.closest('.admin-item[draggable]');
    if (dragging) { setTimeout(function() { dragging.style.opacity = '0.4'; }, 0); e.dataTransfer.effectAllowed = 'move'; }
  });
  list.addEventListener('dragend', function() {
    if (dragging) { dragging.style.opacity = ''; dragging = null; }
  });
  list.addEventListener('dragover', function(e) {
    e.preventDefault();
    var over = e.target.closest('.admin-item[draggable]');
    if (!over || over === dragging || !dragging) return;
    var rect = over.getBoundingClientRect();
    var insertBefore = e.clientY < rect.top + rect.height / 2 ? over : over.nextSibling;
    list.insertBefore(dragging, insertBefore);
  });
  list.addEventListener('drop', async function(e) {
    e.preventDefault();
    var ids = Array.from(list.querySelectorAll('.admin-item[id^="comp-"]')).map(function(el) {
      return parseInt(el.id.replace('comp-', ''), 10);
    }).filter(Boolean);
    if (!ids.length) return;
    var r = await apiPost('/api/admin/comp/reorder', { ids: ids });
    var alert = document.getElementById('normalize-alert');
    if (alert) {
      alert.style.color = r.success ? '#2ecc71' : '#e74c3c';
      alert.textContent = r.success ? 'Order saved!' : 'Reorder failed';
      setTimeout(function() { if (alert) alert.textContent = ''; }, 2500);
    }
  });
}
try { initCompDragDrop(); } catch(_e) {}
</script>
`, undefined, env);
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
