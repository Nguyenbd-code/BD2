import { layout, esc } from '../layout/layout.js';
import { T1_DATA, SCHERA_ICONS } from '../data/t1.js';

const STATIC_CHARS = {
  T1: [{name:'Rou',bond:'Red Riding Hood'},{name:'Seir',bond:'B-Rank Idol'},{name:'Lecliss',bond:'Android Queen'},{name:'Scheherazade',bond:'Magic Professor'},{name:'Sylvia',bond:'Bikini Agent'}],
  T2: [{name:'Rou',bond:'Red Riding Hood'},{name:'Zenith',bond:'Robin Hood'},{name:'Roxy',bond:'Respected Master'},{name:'Eleaneer',bond:'B-Rank Idol'},{name:'Scheherazade',bond:'Magic Professor'}],
  T3: [{name:'Roxy',bond:'Respected Master'},{name:'Lecliss',bond:'Android Queen'},{name:'Seir',bond:'B-Rank Idol'},{name:'Justia',bond:'Knight of Blood'},{name:'Teresse',bond:'Beachside Angel'}],
  T4: [{name:'Rou',bond:'Red Riding Hood'},{name:'Lecliss',bond:'Android Queen'},{name:'Blade',bond:'Onsen Sword Fighter'},{name:'Olivier',bond:'Fallen Wings'},{name:'Mamonir',bond:'Night of Death'}],
  T5: [{name:'Elise',bond:'Lovely Lady'},{name:'Zenith',bond:'Robin Hood'},{name:'Alec',bond:'Sword Breaker'},{name:'Olivier',bond:'Fallen Wings'},{name:'Granhildr',bond:'Comeback Idol'}],
  T6: [{name:'Granhildr',bond:'Comeback Idol'},{name:'Justia',bond:'Knight of Blood'},{name:'Alec',bond:'Sword Breaker'},{name:'Olivier',bond:'Fallen Wings'},{name:'Libertia',bond:'Dark Saintess'}],
};

const STATIC_NOTES = {
  T1: ['Rou ≥21,000 HP · 50% Crit Rate · 1 HP/Res piece','Lecliss ≥33,000 HP · 90% Defence','Seir ≥29,000 HP · 105% Magic Resist','Sylvia 50% Crit Rate · max ATK% substats','Scheherazade 50% Crit Rate · MATK + CDMG build'],
  T2: ['Rou needs at least 21,000 HP and 50% Critical Rate','Rou wants 1 HP/Res piece to survive an empowered basic','Roxy wants 50% Critical Rate','Zenith wants 105% Magic Res and at least 21,000 HP','Eleaneer wants 50% Critical Rate','Scheherazade wants 50% Critical Rate','Any DPS can alternate between Def/Res'],
  T3: ['Lecliss needs at least 33,000 HP and 90% Defence','Seir needs at least 29,000 HP and 105% Magic Res','Justia wants as much ATK as possible','Roxy wants 100% Critical Rate','Teresse wants 100% Critical Rate'],
  T4: ['Olivier can alternate between Magic and Defence Armor','Rou needs at least 21,000 HP and 50% Critical Rate','Rou wants 1 HP/Res piece to survive an empowered basic','Blade needs 50% Critical Rate and can alternate Def/Res','Lecliss needs at least 33,000 HP and 90% Defence','Mamonir needs at least 32,000 HP and 90% Defence','Can replace Mamonir with Granhildr Taunt Pre-em'],
  T5: ['Olivier can alternate between Magic and Defence Armor','Zenith wants 105% Magic Res and as much HP as possible','Alec wants 90% Mres and HP necklaces with ATK subs','Elise needs 100% Critical Rate','Granhildr wants 90–110% and as much HP as possible'],
  T6: ['Olivier can alternate between Magic and Defence Armor','Justia wants as much ATK as possible','Alec wants 90% Mres and HP necklaces with ATK subs','Libertia wants 110% Mres and as much HP as possible','Granhildr wants 90–110% and as much HP as possible'],
};

const STATIC_MATCHUPS = {
  T1: {counters:[],countered_by:['Granhildr Counter','T6 Anti-Taunt']},
  T2: {counters:[],countered_by:["Counter Granhildr","Blade if can't kill T1"]},
  T3: {counters:[],countered_by:['T6']},
  T4: {counters:[],countered_by:['Venaka','Schera','Double Taunt']},
  T5: {counters:['Michaela'],countered_by:['Need Data']},
  T6: {counters:['T3','Double Taunt Teams'],countered_by:['T2','T1']},
};

const STATIC_UNIT_ORDER = {
  T1: ['Rou','Seir','Lecliss','Scheherazade','Sylvia'],
  T2: ['Rou','Zenith','Roxy','Eleaneer','Scheherazade'],
  T3: ['Roxy','Lecliss','Seir','Justia','Teresse'],
  T4: ['Rou','Lecliss','Blade','Olivier','Mamonir'],
  T5: ['Elise','Zenith','Alec','Olivier','Granhildr'],
  T6: ['Granhildr','Justia','Alec','Olivier','Libertia'],
};

const STATIC_WARNINGS = {
  T1: 'Do Not Use unless going for Rank 1 — last hour only',
  T5: 'LOW WIN RATE — counters specific team comps only',
};

const DEFAULT_BOARD = {
  d1:'Seir', d2:'', d3:'Lecliss', d4:'', d5:'', d6:'',
  a1:'Rou',  a2:'Schera', a3:'', a4:'Sylvia', a5:'', a6:'',
};

function tileCls(type) {
  return { ALL:'tile-all', FRONT:'tile-front', SKIP:'tile-skip', SELF:'tile-self' }[type] || 'tile-front';
}

function cSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function slugify(str) {
  return (str||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

function charStrip(chars, compId, bondsData) {
  const colors = ['#e74c3c','#3498db','#2ecc71','#9b59b6','#e67e22'];
  return chars.map((c, idx) => {
    const slug = c.slug || cSlug(c.name);
    const col  = colors[idx % colors.length];
    const cid  = `${slug}-${compId}`;
    const bond = bondsData && bondsData[c.name];
    const tooltip = bond ? `
      <div class="tt-popup">
        <div class="tt-name">${esc(c.name)} — ${esc(bond.costume)}</div>
        <div class="tt-stats">${bond.stats.map(s=>`<span class="tt-stat">${esc(s)}</span>`).join('')}</div>
        <div class="tt-desc">${esc(bond.notes)}</div>
      </div>` : '';
    return `<div class="char-card-wrap" style="flex:1;min-width:150px;max-width:220px" data-action="card-flip" data-slug="${cid}">
  <div class="char-card-inner${bond?' tt-parent':''}" id="card-${cid}">
    <div class="char-face">
      <div style="height:154px;position:relative;background:var(--bg4);display:flex;align-items:center;justify-content:center;overflow:hidden">
        <span style="font-family:'Cinzel',serif;font-size:2.5rem;color:${col};font-weight:700">${esc(c.name.charAt(0))}</span>
        <img src="/img/char_${slug}_portrait" class="img-err-hide" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
      </div>
      <div style="height:66px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 0.6rem;padding-top:0.5rem">
        <div style="font-family:'Cinzel',serif;font-weight:700;font-size:0.83rem;color:var(--text);text-align:center">${esc(c.name)}</div>
        <div style="font-size:0.68rem;color:var(--gold);margin-top:3px;text-align:center">${esc(c.bond||'')}</div>
      </div>
      ${tooltip}
    </div>
    <div class="char-face char-face-back">
      <div style="position:absolute;inset:0;background:var(--bg2);display:flex;align-items:center;justify-content:center">
        <span style="color:var(--text3);font-size:0.75rem">No gear image</span>
        <img src="/img/char_${slug}_gear" class="img-err-hide" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:var(--bg2)">
      </div>
      <button data-action="expand-img" data-src="/img/char_${slug}_gear" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.55);border:none;color:var(--gold);cursor:pointer;border-radius:3px;padding:2px 5px;font-size:0.65rem;z-index:5">⤢</button>
    </div>
  </div>
</div>`;
  }).join('');
}

function boardMediaBox(tier, type, mediaMap) {
  const imageKey = tier === 'T1' ? 'board_pos' : `comp_${tier.toLowerCase()}_board`;
  const videoUrl = (mediaMap[tier] || {}).video || '';
  const isAtk    = type !== 'DEF';
  const arrow    = isAtk ? '⟶' : '⟵';
  const boxStyle = 'flex:1;min-height:200px;border:1px solid rgba(201,168,76,0.25);border-radius:6px;overflow:hidden;position:relative;display:flex;align-items:center;justify-content:center;background:var(--bg4)';
  const imgBox = `<div style="${boxStyle}">
    <span style="color:var(--text3);font-size:0.75rem">No image yet</span>
    <img src="/img/${esc(imageKey)}" class="img-err-hide" data-action="expand-img" data-src="/img/${esc(imageKey)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;cursor:zoom-in">
  </div>`;
  const vidBox = videoUrl
    ? `<div style="${boxStyle}"><video src="${esc(videoUrl)}" controls style="width:100%;height:100%;object-fit:contain"></video></div>`
    : `<div style="${boxStyle}"><div style="text-align:center"><div style="font-family:Cinzel,serif;color:var(--gold);font-size:0.85rem;font-weight:700">Video</div><div style="font-size:0.75rem;color:var(--text3);margin-top:0.2rem">Coming soon</div></div></div>`;
  const arrowEl = `<div style="color:var(--gold);font-size:1.4rem;flex-shrink:0;padding:0 0.4rem;align-self:center">${arrow}</div>`;
  return `<div style="border:2px solid var(--gold);border-radius:8px;padding:0.5rem">
  <div style="display:flex;align-items:stretch;gap:0">
    ${isAtk ? imgBox + arrowEl + vidBox : vidBox + arrowEl + imgBox}
  </div></div>`;
}

function renderComp(comp, mediaMap) {
  const tier    = comp.tier;
  const color   = comp.color || '#c9a84c';
  const tierCls = tier.toLowerCase().replace(/[^a-z0-9]/g, '');
  const anchorId = comp.anchorId || tierCls;
  const typeLabel = comp.type === 'ATK' ? '⚔ Attack Composition' : '🛡 Defence Composition';
  const typeCls   = comp.type === 'ATK' ? 'atk' : 'def';

  const stripHtml = (comp.chars||[]).length
    ? charStrip(comp.chars, anchorId, comp.bondsData||null)
    : [1,2,3,4,5].map(i => `<div class="char-card-wrap" style="flex:1;min-width:150px;max-width:220px">
  <div class="char-card-inner">
    <div class="char-face">
      <div style="height:154px;background:var(--bg4);display:flex;align-items:center;justify-content:center">
        <span style="font-size:1.5rem;color:var(--text3)">?</span>
      </div>
      <div style="height:66px;display:flex;align-items:center;justify-content:center;padding:0.5rem">
        <div style="font-size:0.75rem;color:var(--text3);text-align:center">Not set</div>
      </div>
    </div>
  </div>
</div>`).join('');

  let rotHtml;
  const rot = comp.rotation;
  if (rot && Object.keys(rot).length > 0) {
    const charNames = (comp.chars||[]).length ? comp.chars.map(c=>c.name) : Object.keys(rot);
    const rows = charNames.map(name => {
      const skills = rot[name];
      if (!skills || !skills.length) return '';
      const icons = skills.map((sk, i) => {
        const abbr = (sk.costume||'???').substring(0,3).toUpperCase();
        const iconContent = sk.icon
          ? `<img src="${SCHERA_ICONS[sk.icon]}" alt="${esc(abbr)}" style="width:32px;height:32px;object-fit:cover;border-radius:50%;border:2px solid var(--border2)" class="img-err-hide">`
          : `<div class="skill-abbr">${esc(abbr)}</div>`;
        return `<div class="skill-wrap">
  <div class="skill-icon-box" style="width:38px;flex-shrink:0">
    <div class="skill-num">${i+1}</div>
    ${iconContent}
  </div>
  <div class="tt-popup">
    <div class="tt-name">${esc(sk.name||'')}</div>
    <div class="tt-stats">
      <span class="tt-stat">${esc(sk.sp||'')}</span>
      <span class="tt-stat">${esc(sk.cd||'')}</span>
      <span class="tt-stat ${tileCls(sk.tile)}">${esc(sk.tile||'FRONT')}</span>
    </div>
    <div class="tt-desc">${esc(sk.desc||'')}</div>
  </div>
</div>`;
      }).join('');
      return `<div class="rot-row"><div class="rot-char">${esc(name)}</div><div class="rot-skills">${icons}</div></div>`;
    }).filter(Boolean).join('');
    rotHtml = rows ? `<div class="rot-table">${rows}</div>` : `<div style="color:var(--text3);font-size:0.82rem;text-align:center;padding:1rem 0">Skill data coming soon</div>`;
  } else {
    rotHtml = `<div style="color:var(--text3);font-size:0.82rem;text-align:center;padding:1rem 0">Skill data coming soon</div>`;
  }

  let orderHtml = '';
  const unitOrder = comp.unitOrder || [];
  if (unitOrder.length) {
    const pills = unitOrder.map((u, i) => {
      const pos  = typeof u === 'object' ? (u.pos||i+1) : i+1;
      const name = typeof u === 'object' ? u.name : u;
      return `<div style="display:flex;align-items:center;gap:0.4rem;padding:0.2rem 0.4rem;background:var(--bg4);border-radius:4px">
  <div style="width:15px;height:15px;border-radius:50%;background:#c9a84c;color:#000;font-weight:700;font-size:0.58rem;display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;flex-shrink:0">${pos}</div>
  <div style="font-weight:700;font-size:0.72rem;color:var(--text)">${esc(String(name))}</div>
</div>`;
    }).join('');
    orderHtml = `<div class="card" style="margin-top:1rem">
  <div class="card-title">Unit Order</div>
  <div style="display:flex;flex-direction:column;gap:0.15rem;margin-top:0.25rem">${pills}</div>
</div>`;
  }

  const notesHtml = (comp.notes||[]).map(n=>`<li>${esc(n)}</li>`).join('');
  const counters    = comp.counters || [];
  const counteredBy = comp.countered_by || [];
  const cHtml  = counters.length ? `<div style="margin-bottom:0.4rem"><span style="font-size:0.75rem;color:var(--text3)">Counters </span>${counters.map(c=>`<span class="beats-tag">${esc(c)}</span>`).join('')}</div>` : '';
  const cbHtml = counteredBy.length ? `<div><span style="font-size:0.75rem;color:var(--text3)">Countered By </span>${counteredBy.map(c=>`<span class="counter-tag">${esc(c)}</span>`).join('')}</div>` : '';

  return `
<div class="comp-section" id="${anchorId}">
  <div class="comp-header">
    <div>
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.4rem">
        <span class="tier-badge ${tierCls}" style="background:${color}">${esc(tier)}</span>
        <h2 style="font-family:'Cinzel',serif;font-size:1.6rem;font-weight:700">${esc(comp.name)}</h2>
        <span class="${typeCls}">${typeLabel}</span>
      </div>
      ${comp.warning ? `<div style="display:inline-block;background:rgba(192,57,43,0.1);border:1px solid rgba(192,57,43,0.3);color:#e74c3c;font-size:0.78rem;padding:4px 12px;border-radius:3px">⚠ ${esc(comp.warning)}</div>` : ''}
    </div>
  </div>

  <div style="font-family:'Cinzel',serif;font-size:0.78rem;color:var(--gold);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.75rem">Character Bonds</div>
  <div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-bottom:1.5rem">${stripHtml}</div>

  <div style="display:grid;grid-template-columns:0.85fr 1.3fr 0.85fr;gap:1rem;align-items:start">
    <div>
      <div class="card">
        <div class="card-title">Skill Rotation</div>
        ${rotHtml}
      </div>
      ${orderHtml}
    </div>
    <div class="card">
      <div class="card-title">Board Positioning</div>
      ${boardMediaBox(tier, comp.type, mediaMap)}
      <div style="margin-top:0.75rem;border:1px dashed rgba(201,168,76,0.3);border-radius:6px;padding:1rem;text-align:center">
        <div style="font-family:'Cinzel',serif;font-size:0.8rem;color:var(--gold);margin-bottom:0.25rem">How and When to Play</div>
        <div style="font-size:0.75rem;color:var(--text3)">Coming soon</div>
      </div>
    </div>
    <div>
      <div class="card" style="margin-bottom:1rem">
        <div class="card-title">Build Notes</div>
        <ul class="notes-list" style="max-height:160px;overflow-y:auto">${notesHtml||'<li style="color:var(--text3)">Build data coming soon</li>'}</ul>
      </div>
      <div class="card">
        <div class="card-title">Matchups</div>
        ${cHtml}${cbHtml}
        ${!cHtml&&!cbHtml?'<span style="color:var(--text3);font-size:0.82rem">Data pending</span>':''}
      </div>
    </div>
  </div>
</div>`;
}

export async function handleGuide(request, env) {
  let mediaMap = {}, rotationMap = {}, allComps = [], compCharsMap = {}, dbNotes = {};
  try {
    const [compRes, mediaRes, rotRes, compCharsRes, noteRes] = await Promise.all([
      env.DB.prepare('SELECT * FROM compositions ORDER BY tier, id').all(),
      env.DB.prepare('SELECT * FROM comp_media').all().catch(() => ({results:[]})),
      env.DB.prepare('SELECT * FROM comp_rotations ORDER BY tier, char_name, slot').all().catch(() => ({results:[]})),
      env.DB.prepare('SELECT * FROM comp_chars ORDER BY tier, position').all().catch(() => ({results:[]})),
      env.DB.prepare("SELECT key, data FROM images WHERE key LIKE 'notes_%'").all().catch(() => ({results:[]})),
    ]);
    allComps = compRes.results || [];
    for (const m of (mediaRes.results||[])) {
      if (!mediaMap[m.tier]) mediaMap[m.tier] = {};
      mediaMap[m.tier][m.media_type] = m.value;
    }
    for (const r of (rotRes.results||[])) {
      if (!rotationMap[r.tier]) rotationMap[r.tier] = {};
      if (!rotationMap[r.tier][r.char_name]) rotationMap[r.tier][r.char_name] = [];
      rotationMap[r.tier][r.char_name].push({name:r.skill_name,costume:r.costume||'',sp:'SP '+r.sp_cost,cd:'CD '+r.cooldown,tile:r.tile_type||'FRONT',desc:r.description||''});
    }
    for (const c of (compCharsRes.results||[])) {
      if (!compCharsMap[c.tier]) compCharsMap[c.tier] = [];
      compCharsMap[c.tier].push(c);
    }
    for (const r of (noteRes.results||[])) {
      dbNotes[r.key.replace('notes_', '')] = r.data;
    }
  } catch { /* ignore */ }

  const KNOWN = new Set(['T1','T2','T3','T4','T5','T6']);

  const sidebarLinks = allComps.map(c => {
    const anchor = c.tier.toLowerCase();
    return `<a href="#${anchor}" class="sidebar-link">
  <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:3px;background:${c.color||'#c9a84c'};color:#ffffff;font-family:Cinzel,serif;font-size:0.6rem;font-weight:700;flex-shrink:0">${esc(c.tier)}</span>
  <span class="sidebar-name">${esc(c.name)}</span>
</a>`;
  }).join('');

  let compsHtml = '';
  for (const dbComp of allComps) {
    const tier = dbComp.tier;
    const isKnown = KNOWN.has(tier);
    const dbRot = rotationMap[tier] || null;

    const chars = isKnown
      ? (STATIC_CHARS[tier] || [])
      : (compCharsMap[tier]||[]).map(c=>({name:c.char_name, bond:c.costume_name||'', slug:c.char_slug}));

    let rotation;
    if (dbRot && Object.keys(dbRot).length > 0) {
      rotation = dbRot;
    } else if (tier === 'T1') {
      rotation = T1_DATA.rotation;
    } else {
      rotation = {};
    }

    let unitOrder;
    if (dbComp.unit_order && dbComp.unit_order !== '[]') {
      try { unitOrder = JSON.parse(dbComp.unit_order); } catch { unitOrder = STATIC_UNIT_ORDER[tier] || []; }
    } else {
      unitOrder = STATIC_UNIT_ORDER[tier] || [];
    }

    let notes;
    if (tier === 'T1') {
      notes = (STATIC_CHARS.T1 || []).map((c, idx) =>
        dbNotes[c.name] || (STATIC_NOTES.T1||[])[idx] || ''
      ).filter(Boolean);
    } else if (isKnown) {
      notes = dbComp.description
        ? dbComp.description.split('\n').filter(Boolean)
        : (STATIC_NOTES[tier] || []);
    } else {
      notes = dbComp.description ? dbComp.description.split('\n').filter(Boolean) : [];
    }

    const staticMatchup = STATIC_MATCHUPS[tier] || {counters:[],countered_by:[]};
    const counteredBy = dbComp.countered_by
      ? dbComp.countered_by.split(',').map(s=>s.trim()).filter(Boolean)
      : staticMatchup.countered_by;

    compsHtml += renderComp({
      tier,
      name: dbComp.name,
      type: dbComp.type || 'ATK',
      color: dbComp.color || '#c9a84c',
      anchorId: tier.toLowerCase(),
      chars,
      bondsData: tier === 'T1' ? T1_DATA.bonds : null,
      rotation,
      unitOrder,
      notes,
      counters: staticMatchup.counters,
      countered_by: counteredBy,
      warning: STATIC_WARNINGS[tier] || null,
    }, mediaMap);
  }

  return layout('PvP Guide', `
<div style="display:flex;padding-top:1rem">
  <div class="section" style="flex:1;min-width:0;padding-right:0">
    <div class="hero" style="padding:2rem 2rem 2rem;text-align:left">
      <div class="hero-tag">Mirror Wars</div>
      <h1 style="font-size:clamp(1.5rem,3vw,2.5rem)">PvP Composition <span>Guide</span></h1>
      <p style="margin:0">Top 30 — Rank 1 team compositions curated by BnKitsu</p>
    </div>
    ${compsHtml}
  </div>
  <div class="guide-sidebar">
    <div class="guide-sidebar-title">Jump To</div>
    ${sidebarLinks}
  </div>
</div>

<script>
document.addEventListener('click', function(e) {
  var b = e.target.closest('[data-action]');
  if (!b) return;
  var action = b.dataset.action;
  if (action === 'expand-img') openLightbox(b.dataset.src);
  if (action === 'card-flip')  toggleFlip(b.dataset.slug);
});

function toggleFlip(cardId) {
  var inner = document.getElementById('card-' + cardId);
  if (!inner) return;
  inner.classList.toggle('flipped');
}

document.addEventListener('error', function(e) {
  if (e.target.classList && e.target.classList.contains('img-err-hide')) {
    e.target.classList.add('errored');
  }
}, true);

function openLightbox(src) {
  if (!src || src.indexOf('undefined') !== -1) return;
  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:zoom-out';
  var img = document.createElement('img');
  img.src = src;
  img.style.cssText = 'max-width:90vw;max-height:90vh;object-fit:contain;border-radius:8px;border:2px solid #c9a84c';
  ov.appendChild(img);
  ov.onclick = function() { if (document.body.contains(ov)) document.body.removeChild(ov); };
  document.addEventListener('keydown', function escFn(ev) {
    if (ev.key === 'Escape' && document.body.contains(ov)) { document.body.removeChild(ov); document.removeEventListener('keydown', escFn); }
  }, { once: true });
  document.body.appendChild(ov);
}
</script>
`, 'guide');
}
