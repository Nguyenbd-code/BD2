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
  try {
    const [cr, er, compr, imgr, charr] = await Promise.all([
      env.DB.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all(),
      env.DB.prepare('SELECT * FROM emotes ORDER BY created_at DESC').all(),
      env.DB.prepare("SELECT * FROM compositions ORDER BY type ASC, COALESCE(NULLIF(sort_order,0),id*10) ASC, id ASC").all().catch(() => env.DB.prepare('SELECT * FROM compositions ORDER BY type ASC, id ASC').all()),
      env.DB.prepare("SELECT key FROM images WHERE key NOT LIKE 'notes_%' AND key != 'unit_order' AND key != 'board_layout' ORDER BY key").all().catch(() => ({ results: [] })),
      env.DB.prepare('SELECT * FROM char_registry ORDER BY name ASC').all().catch(() => ({ results: [] })),
    ]);
    coupons = cr.results || [];
    emotes  = er.results || [];
    comps   = compr.results || [];
    images  = imgr.results || [];
    chars   = charr.results || [];
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
    return '<div class="admin-item" id="comp-' + c.id + '">'
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
  for (const c of chars) { const el = c.element||'Dark'; if (!groupedChars[el]) groupedChars[el]=[]; groupedChars[el].push(c); }
  let charsListHtml = '';
  for (const el of elemOrderServer) {
    const grp = groupedChars[el];
    if (!grp || !grp.length) continue;
    charsListHtml += '<div style="font-size:0.7rem;font-weight:700;color:' + (elemColorsServer[el]||'#888') + ';text-transform:uppercase;letter-spacing:0.08em;padding:0.3rem 0.2rem 0.15rem;margin-top:0.25rem">' + esc(el) + '</div>';
    charsListHtml += grp.map(c => {
      const elemColor = elemColorsServer[c.element] || '#888';
      return '<div class="char-row" id="char-' + c.id + '" data-action="char-select" data-id="' + c.id + '" data-name="' + esc(c.name) + '" data-slug="' + esc(c.slug) + '" data-element="' + esc(c.element||'Dark') + '">'
        + '<span class="elem-dot" style="background:' + elemColor + '"></span>'
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
    '<option value="' + c.id + '" data-tier="' + esc(c.tier) + '" data-name="' + esc(c.name) + '" data-type="' + esc(c.type||'ATK') + '" data-color="' + esc(c.color||'#c9a84c') + '" data-short-desc="' + esc(c.short_description||'') + '" data-notes="' + esc(c.description||'') + '" data-unit-order="' + esc(c.unit_order||'[]') + '" data-cby="' + esc(c.countered_by||'') + '">' + esc(c.tier) + ' &mdash; ' + esc(c.name) + ' (' + esc(c.type || '') + ')</option>'
  ).join('');

  return layout('Admin Panel', `
<div class="admin-wrap">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
    <h1 style="font-family:'Cinzel',serif;font-size:1.5rem;color:var(--gold2)">Admin Panel</h1>
    <a href="/admin/logout" style="font-size:0.82rem;color:var(--text3)">Logout</a>
  </div>

  <div class="admin-tabs">
    <button class="tab-btn active" data-action="tab-switch" data-tab="coupons">Coupons</button>
    <button class="tab-btn"        data-action="tab-switch" data-tab="comps">Compositions</button>
    <button class="tab-btn"        data-action="tab-switch" data-tab="emotes">Emotes</button>
    <button class="tab-btn"        data-action="tab-switch" data-tab="images">Images</button>
    <button class="tab-btn"        data-action="tab-switch" data-tab="chars">Characters</button>
    <button class="tab-btn"        data-action="tab-switch" data-tab="homepage">&#127968; Home</button>
    <button class="tab-btn"        data-action="tab-switch" data-tab="settings">&#9881; Settings</button>
  </div>

  <div id="admin-debug" style="color:#e74c3c;font-size:0.75rem;min-height:1rem;padding:4px 0"></div>

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

        <!-- Card Label -->
        <div class="form-group">
          <label>CARD LABEL <span style="color:var(--text3);font-size:0.7rem;font-weight:400">— short line shown under the comp title on the guide page</span></label>
          <div style="display:flex;gap:0.5rem;align-items:center">
            <select id="comp-card-label-color" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px;border-radius:5px;min-width:105px">
              <option value="">None</option>
              <option value="green">● Green</option>
              <option value="red">● Red</option>
            </select>
            <input type="text" id="comp-card-label" placeholder="e.g. Strong pick · Best in current meta" style="flex:1">
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

        <!-- Unit Order (all tiers) -->
        <div class="form-group" style="border-top:1px solid var(--border2);padding-top:1rem">
          <label>UNIT ORDER</label>
          <div id="unit-order-slots" style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.5rem">
            <span style="color:var(--text3);font-size:0.82rem">Select a composition to load unit order</span>
          </div>
          <button class="btn" style="width:auto;padding:8px 20px;margin-top:0" onclick="saveCompUnitOrder()">Save Unit Order</button>
          <div id="comp-order-alert"></div>
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

        <!-- Video URL -->
        <div class="form-group">
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

        <!-- Preemptive Skills -->
        <div class="form-group" style="border-top:1px solid var(--border2);padding-top:1rem">
          <label>PREEMPTIVE SKILLS</label>
          <div id="preemptive-list" style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.5rem;min-height:48px"></div>
          <input type="file" id="preemptive-file" accept="image/*" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:5px;width:100%;margin-bottom:0.4rem">
          <canvas id="preemptive-canvas" style="display:none"></canvas>
          <button class="btn" style="width:auto;padding:8px 20px" data-action="add-preemptive">Add Preemptive Image</button>
          <div id="comp-preemptive-alert"></div>
        </div>

        <!-- Character Bonds -->
        <div style="border-top:1px solid var(--border2);margin:1rem 0;padding-top:1rem">
          <h4 style="font-family:'Cinzel',serif;font-size:0.85rem;color:var(--gold2);margin-bottom:0.75rem">Character Bonds</h4>
          <div id="comp-bonds-grid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:0.75rem;margin-bottom:0.75rem">
            <span style="color:var(--text3);font-size:0.82rem;grid-column:1/-1">Select a composition to edit character bonds</span>
          </div>
          <button class="btn" style="width:auto;padding:8px 20px" data-action="save-comp-bonds">Save Character Bonds</button>
          <div id="comp-bonds-alert"></div>
        </div>

        <!-- Skill Rotation (all tiers) -->
        <div style="border-top:1px solid var(--border2);margin:1rem 0;padding-top:1rem">
          <h4 style="font-family:'Cinzel',serif;font-size:0.85rem;color:var(--gold2);margin-bottom:0.75rem">Skill Rotation</h4>
          <div id="rot-char-selectors" style="display:grid;grid-template-columns:repeat(5,1fr);gap:0.5rem;margin-bottom:0.75rem"></div>
          <div id="rot-alert" style="margin-bottom:0.5rem"></div>
          <div id="rot-grid"></div>
        </div>

        <div id="comp-editor-alert"></div>
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
      <h3>Add Emote</h3>
      <div id="emote-alert"></div>
      <div class="form-row">
        <div class="form-group"><label>Name</label><input type="text" id="e-name" placeholder="Happy Sylvia"></div>
        <div class="form-group"><label>Image URL <span style="color:var(--text3);font-weight:400">(or upload below)</span></label><input type="text" id="e-url" placeholder="https://..."></div>
      </div>
      <div class="form-group">
        <label>Upload Image File <span style="color:var(--text3);font-weight:400">(optional — replaces URL)</span></label>
        <input type="file" id="e-file" accept="image/*" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:5px;width:100%">
        <canvas id="emote-canvas" style="display:none"></canvas>
      </div>
      <button class="btn" style="width:auto;padding:10px 24px" data-action="add-emote">Add Emote</button>
    </div>
    <div id="emote-list" style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:0.5rem">
      ${emotes.map(e =>
        '<div class="admin-item" id="emote-' + e.id + '">'
        + '<div class="admin-item-info" style="display:flex;align-items:center;gap:0.75rem">'
        + '<img src="' + esc(e.image_url) + '" style="width:36px;height:36px;object-fit:cover;border-radius:4px" class="img-err-hide">'
        + '<strong>' + esc(e.name) + '</strong>'
        + '</div>'
        + '<button class="btn-danger" data-action="emote-delete" data-id="' + e.id + '">Delete</button>'
        + '</div>'
      ).join('') || '<p style="color:var(--text3);font-size:0.83rem">No emotes yet.</p>'}
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
          <button class="elem-dot-btn active" data-action="admin-elem-filter" data-elem="all">All</button>
          ${['Light','Dark','Fire','Water','Wind'].map(el =>
            '<button class="elem-dot-btn" data-action="admin-elem-filter" data-elem="' + esc(el) + '" style="--el-c:' + (elemColorsServer[el]||'#888') + '">' + esc(el) + '</button>'
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
  <div class="admin-section" id="tab-homepage">
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
      <h3>Home Page Secret Code</h3>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1rem">Change the secret code visitors enter on the home page to unlock the secret emotes section.</p>
      <div id="secret-code-alert"></div>
      <div class="form-group">
        <label>New Secret Code <span style="color:var(--text3);font-size:0.7rem">(min 4 characters)</span></label>
        <input type="text" id="new-secret-code" placeholder="e.g. Seji404" autocomplete="off">
      </div>
      <button class="btn" style="width:auto;padding:10px 24px" data-action="save-secret-code">Save Secret Code</button>
    </div>

    <div class="admin-form">
      <h3>Element Icons</h3>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1rem">Upload icons for the 5 elements — shown on character cards across the site. Auto-compressed to 80px PNG/JPEG.</p>
      <div id="element-icon-alert"></div>
      <canvas id="element-icon-canvas" style="display:none"></canvas>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:0.75rem">
        ${['dark','light','fire','water','wind'].map(el =>
          '<div style="background:var(--bg4);border:1px solid var(--border2);border-radius:6px;padding:0.75rem">'
          + '<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem">'
          + '<img src="/img/element_' + el + '" class="img-err-hide" style="width:36px;height:36px;object-fit:contain;background:var(--bg2);border-radius:4px">'
          + '<div style="font-family:Cinzel,serif;font-size:0.85rem;color:var(--gold);text-transform:capitalize">' + el + '</div>'
          + '</div>'
          + '<input type="file" id="elem-file-' + el + '" accept="image/*" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:5px 8px;border-radius:4px;width:100%;font-size:0.75rem;margin-bottom:0.4rem">'
          + '<button class="btn" style="width:100%;padding:5px;font-size:0.78rem" data-action="upload-element" data-element="' + el + '">Upload</button>'
          + '</div>'
        ).join('')}
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

  loadCompData(_compId);
  loadCompChars();
  loadCompMedia(_compTier);
  loadCompRotation();
  loadHowToPlay(_compTier);
  loadPreemptive(_compTier);
  loadMatchups(_compTier);
}

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

async function uploadElementIcon(element) {
  var fileEl = document.getElementById('elem-file-' + element);
  var file   = fileEl && fileEl.files && fileEl.files[0];
  if (!file) { showAlert('element-icon-alert', false, 'Select an image file for ' + element); return; }
  showAlert('element-icon-alert', true, 'Uploading...');
  try {
    var data = await compressToDataUrl(file, 'element-icon-canvas', 80, 0.9);
    var r    = await apiPost('/api/admin/image/upload', { key: 'element_' + element, data: data });
    showAlert('element-icon-alert', r.success, r.message || (r.success ? 'Uploaded!' : 'Error'));
    if (r.success) {
      if (fileEl) fileEl.value = '';
      document.querySelectorAll('img[src*="element_' + element + '"]').forEach(function(img) {
        img.src = '/img/element_' + element + '?t=' + Date.now();
        img.classList.remove('errored');
      });
    }
  } catch(e) { showAlert('element-icon-alert', false, 'Upload failed'); }
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
    var labelColorEl = document.getElementById('comp-card-label-color');
    var labelTextEl  = document.getElementById('comp-card-label');
    if (labelColorEl && labelTextEl) {
      var sdMatch = sdRaw.match(/^(green|red):(.*)$/s);
      if (sdMatch) { labelColorEl.value = sdMatch[1]; labelTextEl.value = sdMatch[2]; }
      else { labelColorEl.value = ''; labelTextEl.value = sdRaw; }
    }
    var notesEl = document.getElementById('comp-build-notes');
    if (notesEl && opt.dataset.notes !== undefined) notesEl.value = opt.dataset.notes;

    var currentOrder = [];
    try { currentOrder = JSON.parse(opt.dataset.unitOrder || '[]'); } catch(e) {}

    var slotsEl = document.getElementById('unit-order-slots');
    if (slotsEl) {
      slotsEl.innerHTML = [1,2,3,4,5].map(function(n) {
        var cur = currentOrder[n-1] || '';
        var opts = '<option value="">— Select —</option>' + allChars.map(function(c) {
          return '<option value="' + escH(c.name) + '"' + (c.name === cur ? ' selected' : '') + '>' + escH(c.name) + '</option>';
        }).join('');
        return '<div style="text-align:center">'
          + '<div style="font-size:0.65rem;color:var(--text3);margin-bottom:3px">' + n + '</div>'
          + '<select id="uorder-sel-' + n + '" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:6px;border-radius:4px;width:120px;font-size:0.82rem">'
          + opts + '</select></div>';
      }).join('');
    }
  } catch(e) {}
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
  var labelColor = ((document.getElementById('comp-card-label-color')||{}).value||'').trim();
  var labelText  = ((document.getElementById('comp-card-label')||{}).value||'').trim();
  var sd = labelText ? (labelColor ? labelColor + ':' + labelText : labelText) : '';
  var r = await apiPost('/api/admin/comp/update', { id: _compId, name: name, type: type, color: color, short_description: sd, description: notes, countered_by: cby, unit_order: uorder });
  if (r.success) {
    apiPost('/api/admin/comp/notes/save', { tier: _compTier, content: notes });
    if (opt) { opt.dataset.name = name; opt.dataset.color = color; opt.dataset.notes = notes; opt.dataset.shortDesc = sd; opt.text = opt.dataset.tier + ' — ' + name + ' (' + type + ')'; }
  }
  showAlert('comp-meta-alert', r.success, r.message);
}

async function saveCompUnitOrder() {
  if (!_compId) { showAlert('comp-order-alert', false, 'Select a composition first'); return; }
  var order = [];
  for (var i = 1; i <= 5; i++) {
    var v = ((document.getElementById('uorder-sel-' + i)||{}).value||'').trim();
    if (v) order.push(v);
  }
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
  var grid = document.getElementById('comp-bonds-grid');
  if (!grid) return;
  try {
    var charsRes = await fetch('/api/admin/chars/list');
    var charsData = await charsRes.json();
    var allChars = charsData.chars || [];
    var existingRes = await fetch('/api/admin/comp/chars/get?tier=' + encodeURIComponent(_compTier));
    var existingData = await existingRes.json();
    var existingChars = existingData.chars || [];

    var charOptions = '<option value="">— None —</option>' + allChars.map(function(c) {
      return '<option value="' + escH(c.name) + '" data-slug="' + escH(c.slug) + '">' + escH(c.name) + '</option>';
    }).join('');

    grid.innerHTML = [1,2,3,4,5].map(function(n) {
      var ex = existingChars.find(function(c) { return c.position === n; }) || {};
      var charOpts = '<option value="">— None —</option>' + allChars.map(function(c) {
        return '<option value="' + escH(c.name) + '" data-slug="' + escH(c.slug) + '"' + (c.name === (ex.char_name||'') ? ' selected' : '') + '>' + escH(c.name) + '</option>';
      }).join('');
      var portraitSrc = ex.char_slug ? '/img/char_' + ex.char_slug + '_portrait' : '';
      return '<div style="border:1px solid var(--border2);border-radius:8px;padding:0.75rem;background:var(--bg4)">'
        + '<div style="font-size:0.7rem;color:var(--text3);margin-bottom:0.4rem;font-family:Cinzel,serif">SLOT ' + n + '</div>'
        + '<select id="bond-char-' + n + '" style="width:100%;background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:6px;border-radius:4px;font-size:0.8rem;margin-bottom:0.4rem">'
        + charOpts + '</select>'
        + '<select id="bond-cost-' + n + '" style="width:100%;background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:6px;border-radius:4px;font-size:0.8rem;margin-bottom:0.4rem">'
        + '<option value="">— Costume —</option></select>'
        + '<div style="height:50px;background:var(--bg2);border-radius:4px;overflow:hidden;position:relative">'
        + (portraitSrc ? '<img id="bond-portrait-' + n + '" src="' + escH(portraitSrc) + '" style="width:100%;height:100%;object-fit:cover" class="img-err-hide">' : '<img id="bond-portrait-' + n + '" src="" style="width:100%;height:100%;object-fit:cover;display:none" class="img-err-hide">')
        + '</div></div>';
    }).join('');

    for (var n = 1; n <= 5; n++) {
      (function(slot) {
        var ex = existingChars.find(function(c) { return c.position === slot; }) || {};
        var charSel = document.getElementById('bond-char-' + slot);
        var costSel = document.getElementById('bond-cost-' + slot);
        function refreshPortrait() {
          var img = document.getElementById('bond-portrait-' + slot);
          if (!img) return;
          var charOpt = charSel ? charSel.options[charSel.selectedIndex] : null;
          var slug = charOpt ? (charOpt.dataset.slug || '') : '';
          if (!slug) { img.src = ''; img.style.display = 'none'; return; }
          var costName = costSel ? costSel.value : '';
          var cosSlug  = (costName||'').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
          var url = cosSlug
            ? '/img/char_' + slug + '_' + cosSlug + '_icon'
            : '/img/char_' + slug + '_portrait';
          img.onerror = function() {
            img.onerror = null;
            img.src = '/img/char_' + slug + '_portrait?t=' + Date.now();
          };
          img.src = url + '?t=' + Date.now();
          img.style.display = 'block';
        }
        if (charSel) {
          if (ex.char_slug) loadBondCostumes(slot, ex.char_slug, ex.costume_name || '', refreshPortrait);
          charSel.addEventListener('change', function() {
            var opt = charSel.options[charSel.selectedIndex];
            var slug = opt ? (opt.dataset.slug || '') : '';
            loadBondCostumes(slot, slug, '', refreshPortrait);
            refreshPortrait();
          });
        }
        if (costSel) costSel.addEventListener('change', refreshPortrait);
      })(n);
    }
  } catch(e) {}
}

async function loadBondCostumes(slot, charSlug, selectedCostume, done) {
  var sel = document.getElementById('bond-cost-' + slot);
  if (!sel || !charSlug) { if (done) done(); return; }
  try {
    var res = await fetch('/api/admin/costumes/list?char_slug=' + encodeURIComponent(charSlug));
    var data = await res.json();
    sel.innerHTML = '<option value="">— Costume —</option>' + (data.costumes||[]).map(function(c) {
      return '<option value="' + escH(c.costume_name) + '"' + (c.costume_name === selectedCostume ? ' selected' : '') + '>' + escH(c.costume_name) + '</option>';
    }).join('');
  } catch(e) {
    sel.innerHTML = '<option value="">— No costumes —</option>';
  }
  if (done) done();
}

async function saveCompBonds() {
  if (!_compTier) { showAlert('comp-bonds-alert', false, 'Select a composition first'); return; }
  var charsRes = await fetch('/api/admin/chars/list').then(function(r) { return r.json(); }).catch(function() { return { chars: [] }; });
  var allChars = charsRes.chars || [];
  var chars = [];
  for (var n = 1; n <= 5; n++) {
    var charSel = document.getElementById('bond-char-' + n);
    var costSel = document.getElementById('bond-cost-' + n);
    var charName = charSel ? charSel.value : '';
    if (!charName) continue;
    var charObj = allChars.find(function(c) { return c.name === charName; }) || {};
    chars.push({
      position: n,
      char_name: charName,
      char_slug: charObj.slug || charName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      costume_name: costSel ? costSel.value : '',
      bond_stats: '',
    });
  }
  var r = await apiPost('/api/admin/comp/chars/save', { tier: _compTier, chars: chars });
  showAlert('comp-bonds-alert', r.success, r.message);
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
  if (r.success) { var el = document.getElementById('emote-' + id); if (el) el.remove(); }
  else showAlert('emote-alert', false, r.message);
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
      html += '<div style="font-size:0.7rem;font-weight:700;color:' + (elemColors[el]||'#888') + ';text-transform:uppercase;letter-spacing:0.08em;padding:0.3rem 0.2rem 0.15rem;margin-top:0.25rem">' + el + '</div>';
      grp.forEach(function(c) {
        var col = elemColors[c.element] || '#888';
        html += '<div class="char-row" id="char-' + c.id + '" data-action="char-select" data-id="' + c.id + '" data-name="' + escH(c.name) + '" data-slug="' + escH(c.slug) + '">'
          + '<span class="elem-dot" style="background:' + col + '"></span>'
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
      opt.dataset.shortDesc = c.short_description || '';
      opt.dataset.notes     = c.description || '';
      opt.dataset.unitOrder = c.unit_order || '[]';
      opt.dataset.cby       = c.countered_by || '';
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
  // Collect selected chars from selectors
  var sels = document.querySelectorAll('.rot-char-sel');
  var selected = [];
  sels.forEach(function(s) { if (s.value) selected.push(s.value); });
  if (!selected.length) { grid.innerHTML = '<p style="color:var(--text3);font-size:0.83rem">Select characters above to build the rotation grid.</p>'; return; }

  var selStyle = 'background:var(--bg2);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:0.75rem;padding:2px 4px;width:100%';
  var html = '<div style="display:grid;grid-template-columns:repeat(' + Math.min(selected.length, 5) + ',1fr);gap:0.75rem">';
  selected.forEach(function(charName) {
    var costumes  = _rotCostMap[charName] || [];
    var saved     = _rotSaved[charName]   || {};
    var costOpts  = '<option value="">— None —</option>' + costumes.map(function(cn) {
      return '<option value="' + escH(cn) + '">' + escH(cn) + '</option>';
    }).join('');
    html += '<div style="background:var(--bg4);border:1px solid var(--border2);border-radius:6px;padding:0.5rem">';
    html += '<div style="font-weight:700;font-size:0.78rem;color:var(--gold2);margin-bottom:0.4rem;text-align:center">' + escH(charName) + '</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.25rem">';
    for (var slot = 1; slot <= 10; slot++) {
      var cur = saved[slot] || '';
      var selOpts = costOpts.replace('value="' + escH(cur) + '">', 'value="' + escH(cur) + '" selected>');
      html += '<div style="display:flex;align-items:center;gap:0.2rem">';
      html += '<span style="font-size:0.65rem;color:var(--text3);width:12px;flex-shrink:0;text-align:right">' + slot + '</span>';
      html += '<select style="' + selStyle + '"'
            + ' data-action="rot-slot-change"'
            + ' data-char="' + escH(charName) + '"'
            + ' data-slot="' + slot + '">'
            + selOpts + '</select>';
      if (cur) {
        html += '<button class="btn-danger" style="font-size:0.65rem;padding:1px 4px;flex-shrink:0;line-height:1"'
              + ' data-action="rot-delete"'
              + ' data-char="' + escH(charName) + '"'
              + ' data-slot="' + slot + '">×</button>';
      }
      html += '</div>';
    }
    html += '</div></div>';
  });
  html += '</div>';
  grid.innerHTML = html;
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
    buildRotationGrid();
  } else showAlert('rot-alert', false, r.message);
}

async function deleteCompRotationSlot(charName, slot) {
  if (!_compTier) return;
  var r = await apiPost('/api/admin/comp/rotation/delete', { tier: _compTier, char_name: charName, slot: +slot });
  if (r.success) {
    if (_rotSaved[charName]) delete _rotSaved[charName][slot];
    buildRotationGrid();
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
  var b = e.target.closest('[data-action]');
  if (!b) return;
  var action = b.dataset.action;
  var id     = b.dataset.id;
  var key    = b.dataset.key;
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
  if (action === 'upload-trigger')  triggerCharUpload(b.dataset.slot);
  if (action === 'char-tab')        showCharSubtab(b.dataset.subtab);
  if (action === 'img-cat')         setImgCat(b.dataset.cat);
  if (action === 'tab-switch')      showTab(b.dataset.tab);
  if (action === 'rot-delete')       deleteCompRotationSlot(b.dataset.char, parseInt(b.dataset.slot, 10));
  if (action === 'preset-color')     { var ce = document.getElementById('comp-color'); if (ce) ce.value = b.dataset.color; }
  if (action === 'home-note-save')   saveHomeNote(parseInt(b.dataset.slot, 10));
  if (action === 'save-secret-code') saveSecretCode();
  if (action === 'normalize-tiers')  normalizeCompTiers();
  if (action === 'save-comp-bonds')  saveCompBonds();
  if (action === 'upload-board-front') uploadCompBoard('', 'comp-board-file', 'comp-canvas', 'comp-board-preview');
  if (action === 'upload-board-back')  uploadCompBoard('_back', 'comp-board-back-file', 'comp-canvas-back', 'comp-board-back-preview');
  if (action === 'save-how-to-play') saveHowToPlay();
  if (action === 'add-preemptive')   addPreemptive();
  if (action === 'preemptive-delete') deletePreemptive(parseInt(b.dataset.index, 10));
  if (action === 'add-emote')        addEmote();
  if (action === 'save-matchups')    saveMatchups();
  if (action === 'upload-element')   uploadElementIcon(b.dataset.element);
  if (action === 'skill-tile-upload') uploadSkillTile(parseInt(b.dataset.skillId, 10));
  if (action === 'admin-elem-filter') {
    document.querySelectorAll('.elem-dot-btn').forEach(function(x) { x.classList.remove('active'); });
    b.classList.add('active');
    var filterEl = b.dataset.elem;
    document.querySelectorAll('#char-list .char-row').forEach(function(row) {
      row.style.display = (filterEl === 'all' || row.dataset.element === filterEl) ? '' : 'none';
    });
    document.querySelectorAll('#char-list div[style*="font-size:0.7rem"]').forEach(function(label) {
      label.style.display = '';
    });
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
updateImgKey();
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
