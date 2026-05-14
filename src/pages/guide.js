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

const NA = '<div style="color:var(--gold);opacity:0.4;font-family:\'Cinzel\',serif;font-size:0.85rem;text-align:center;padding:1.5rem 0">N/A</div>';

function tileCls(type) {
  return { ALL:'tile-all', FRONT:'tile-front', SKIP:'tile-skip', SELF:'tile-self' }[type] || 'tile-front';
}

function cSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
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
      <button data-action="expand-img" data-src="/img/char_${slug}_gear" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.55);border:none;color:var(--gold);cursor:pointer;border-radius:3px;padding:4px 9px;font-size:0.85rem;z-index:5">⤢</button>
    </div>
  </div>
</div>`;
  }).join('');
}

function renderComp(comp, mediaMap) {
  const tier    = comp.tier;
  const color   = comp.color || '#c9a84c';
  const video   = (mediaMap[tier] && mediaMap[tier].video) ? mediaMap[tier].video : '';
  const tierCls = tier.toLowerCase().replace(/[^a-z0-9]/g, '');
  const anchorId = comp.anchorId || tierCls;
  const typeLabel = comp.type === 'ATK' ? '⚔ Attack Composition' : '🛡 Defence Composition';
  const typeCls   = comp.type === 'ATK' ? 'atk' : 'def';

  // Character strip
  const stripHtml = (comp.chars||[]).length
    ? charStrip(comp.chars, anchorId, comp.bondsData||null)
    : [1,2,3,4,5].map(() => `<div class="char-card-wrap" style="flex:1;min-width:150px;max-width:220px">
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

  // Skill rotation
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
    rotHtml = rows
      ? `<div class="rot-table" style="flex:1;overflow-x:auto;overflow-y:auto;min-height:0">${rows}</div>`
      : `<div style="flex:1;display:flex;align-items:center;justify-content:center">${NA}</div>`;
  } else {
    rotHtml = `<div style="flex:1;display:flex;align-items:center;justify-content:center">${NA}</div>`;
  }

  // Unit order — always 5 rows so height is identical across all tiers
  const unitOrder = comp.unitOrder || [];
  const orderPills = [1,2,3,4,5].map(i => {
    const u    = unitOrder[i-1];
    const name = u ? (typeof u === 'object' ? u.name : u) : '—';
    return `<div style="display:flex;align-items:center;gap:0.4rem;padding:0.2rem 0.4rem;background:var(--bg4);border-radius:4px">
  <div style="width:15px;height:15px;border-radius:50%;background:#c9a84c;color:#000;font-weight:700;font-size:0.58rem;display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;flex-shrink:0">${i}</div>
  <div style="font-weight:700;font-size:0.72rem;color:var(--text)">${esc(String(name))}</div>
</div>`;
  }).join('');
  const orderHtml = `<div class="card">
  <div class="card-title">Unit Order</div>
  <div style="display:flex;flex-direction:column;gap:0.15rem;margin-top:0.25rem">${orderPills}</div>
</div>`;

  // Board positioning — flip card (front + back)
  const frontKey = tier === 'T1' ? 'board_pos' : `comp_${tier.toLowerCase()}_board`;
  const backKey  = `comp_${tier.toLowerCase()}_board_back`;
  const boardHtml = `<div class="board-flip-wrap" style="position:relative;min-height:200px;perspective:1000px" data-action="board-flip" data-tier="${esc(tier)}">
  <div class="board-card-inner" id="board-card-${esc(tier)}" style="position:relative;width:100%;min-height:200px;transition:transform 0.5s;transform-style:preserve-3d;cursor:pointer">
    <div class="board-face" style="backface-visibility:hidden;position:relative;min-height:200px;background:var(--bg4);border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center">
      <span style="color:var(--text3);font-size:0.75rem">No image yet</span>
      <img src="/img/${esc(frontKey)}" class="img-err-hide" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain">
      <button data-action="expand-img" data-src="/img/${esc(frontKey)}" style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.6);border:none;color:var(--gold);cursor:pointer;border-radius:4px;padding:3px 7px;font-size:0.75rem;z-index:10">⤢</button>
    </div>
    <div class="board-face" style="backface-visibility:hidden;position:absolute;inset:0;transform:rotateY(180deg);background:var(--bg4);border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center">
      <span style="color:var(--text3);font-size:0.75rem">No back image yet</span>
      <img src="/img/${esc(backKey)}" class="img-err-hide" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain">
      <button data-action="expand-img" data-src="/img/${esc(backKey)}" style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.6);border:none;color:var(--gold);cursor:pointer;border-radius:4px;padding:3px 7px;font-size:0.75rem;z-index:10">⤢</button>
    </div>
  </div>
  <div style="font-size:0.65rem;color:var(--text3);text-align:center;margin-top:4px">Click to flip</div>
</div>`;

  // Board section — ATK/DEF dual-box with arrow
  const isAtk = comp.type === 'ATK';
  const arrow = isAtk
    ? '<div style="font-size:1.8rem;color:var(--gold);display:flex;align-items:center;padding:0 0.5rem;flex-shrink:0">⟶</div>'
    : '<div style="font-size:1.8rem;color:var(--gold);display:flex;align-items:center;padding:0 0.5rem;flex-shrink:0">⟵</div>';
  const imageBox = `<div style="flex:1;min-height:200px;border:2px solid var(--gold);border-radius:8px;overflow:hidden;position:relative;background:var(--bg4)">${boardHtml}</div>`;
  const videoBox = `<div style="flex:1;min-height:200px;border:2px solid var(--gold);border-radius:8px;overflow:hidden;background:var(--bg4);display:flex;align-items:center;justify-content:center">${
    video
      ? `<video controls style="width:100%;height:100%;object-fit:contain"><source src="${esc(video)}"></video>`
      : '<div style="text-align:center"><div style="font-family:Cinzel,serif;color:var(--gold);opacity:0.5;font-size:0.85rem;margin-bottom:0.25rem">Video</div><div style="font-size:0.75rem;color:var(--text3)">N/A</div></div>'
  }</div>`;
  const boardSectionHtml = `<div style="display:flex;align-items:stretch;gap:0.5rem;min-height:200px">${isAtk ? imageBox + arrow + videoBox : videoBox + arrow + imageBox}</div>`;

  // How and When to Play
  const howToPlayHtml = `<div class="card" style="padding:1rem;margin-top:0.75rem">
  <div class="card-title" style="margin-bottom:0.5rem">How and When to Play</div>
  <div style="color:var(--text3);font-size:0.82rem;min-height:40px;line-height:1.6;white-space:pre-wrap">${comp.howToPlay ? esc(comp.howToPlay) : '<span style="color:var(--gold);opacity:0.4;font-family:Cinzel,serif">Coming soon</span>'}</div>
</div>`;

  // Build notes
  const notesHtml = (comp.notes||[]).map(n=>`<li>${esc(n)}</li>`).join('');

  // Preemptive skills
  const preemptive = comp.preemptive || [];
  const preemptiveHtml = preemptive.length
    ? preemptive.map(src => `<img src="${esc(src)}" style="height:40px;width:auto;object-fit:contain;border-radius:4px;border:1px solid var(--border2)" class="img-err-hide">`).join('')
    : '<span style="color:var(--gold);opacity:0.4;font-family:\'Cinzel\',serif;font-size:0.8rem">N/A</span>';

  // Matchups
  const counters    = comp.counters || [];
  const counteredBy = comp.countered_by || [];

  return `
<div class="comp-section" id="${anchorId}">
  <div class="comp-header">
    <div>
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.4rem">
        <span class="tier-badge ${tierCls}" style="background:${color};color:#fff">${esc(tier)}</span>
        <h2 style="font-family:'Cinzel',serif;font-size:1.6rem;font-weight:700">${esc(comp.name)}</h2>
        <span class="${typeCls}">${typeLabel}</span>
      </div>
      ${comp.warning ? `<div style="display:inline-block;background:rgba(192,57,43,0.1);border:1px solid rgba(192,57,43,0.3);color:#e74c3c;font-size:0.78rem;padding:4px 12px;border-radius:3px">⚠ ${esc(comp.warning)}</div>` : ''}
    </div>
  </div>

  <div style="font-family:'Cinzel',serif;font-size:0.78rem;color:var(--gold);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.75rem">Character Bonds</div>
  <div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-bottom:1.5rem">${stripHtml}</div>

  <div style="display:grid;grid-template-columns:0.85fr 1.3fr 0.85fr;gap:1rem;align-items:stretch">
    <div style="display:flex;flex-direction:column;gap:0.75rem;height:100%">
      <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column">
        <div class="card-title" style="flex-shrink:0">Skill Rotation</div>
        ${rotHtml}
      </div>
      ${orderHtml}
    </div>
    <div>
      <div class="card" style="padding:1rem">
        <div class="card-title">Board Positioning</div>
        ${boardSectionHtml}
      </div>
      ${howToPlayHtml}
    </div>
    <div>
      <div class="card" style="min-height:200px;max-height:240px;overflow-y:auto;margin-bottom:1rem;display:flex;flex-direction:column">
        <div class="card-title">Build Notes</div>
        <ul class="notes-list">${notesHtml || `<li>${NA}</li>`}</ul>
      </div>
      <div class="card" style="padding:1rem;min-height:140px;margin-bottom:1rem">
        <div class="card-title" style="margin-bottom:0.5rem">Preemptive Skills</div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:flex-start;min-height:100px">${preemptiveHtml}</div>
      </div>
      <div class="card" style="padding:1rem;min-height:220px;display:flex;flex-direction:column">
        <div class="card-title">Matchups</div>
        <div style="margin-bottom:0.5rem">
          <div style="font-size:0.7rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.3rem">Counters</div>
          ${counters.length ? counters.map(c=>`<span class="beats-tag">${esc(c)}</span>`).join('') : '<span style="color:var(--gold);opacity:0.4;font-family:Cinzel,serif;font-size:0.8rem">N/A</span>'}
        </div>
        <div>
          <div style="font-size:0.7rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.3rem">Countered By</div>
          ${counteredBy.length ? counteredBy.map(c=>`<span class="counter-tag">${esc(c)}</span>`).join('') : '<span style="color:var(--gold);opacity:0.4;font-family:Cinzel,serif;font-size:0.8rem">N/A</span>'}
        </div>
      </div>
    </div>
  </div>
</div>`;
}

export async function handleGuide(request, env) {
  let mediaMap = {}, rotationMap = {}, allComps = [], compCharsMap = {}, dbNotes = {}, extraMap = {};
  try {
    const [compRes, mediaRes, rotRes, compCharsRes, noteRes, extraRes] = await Promise.all([
      env.DB.prepare('SELECT * FROM compositions ORDER BY tier, id').all(),
      env.DB.prepare('SELECT * FROM comp_media').all().catch(() => ({results:[]})),
      env.DB.prepare('SELECT * FROM comp_rotations ORDER BY tier, char_name, slot').all().catch(() => ({results:[]})),
      env.DB.prepare('SELECT * FROM comp_chars ORDER BY tier, position').all().catch(() => ({results:[]})),
      env.DB.prepare("SELECT key, data FROM images WHERE key LIKE 'notes_%'").all().catch(() => ({results:[]})),
      env.DB.prepare("SELECT key, data FROM images WHERE key LIKE 'preemptive_%' OR key LIKE 'how_to_play_%'").all().catch(() => ({results:[]})),
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
      const k = r.key.replace('notes_', '');
      dbNotes[k] = r.data;
      dbNotes[k.toUpperCase()] = r.data;
    }
    for (const r of (extraRes.results||[])) {
      extraMap[r.key] = r.data;
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
    const tier    = dbComp.tier;
    const tierLow = tier.toLowerCase();
    const isKnown = KNOWN.has(tier);
    const dbRot   = rotationMap[tier] || null;

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

    // Build notes: T1 always uses static (DB char-level keys may have corrupt data)
    let notes;
    if (tier === 'T1') {
      notes = STATIC_NOTES.T1 || [];
    } else {
      const tierNoteKey = dbNotes[tier] || dbNotes[tier.toLowerCase()];
      if (tierNoteKey) {
        notes = String(tierNoteKey).split('\n').filter(Boolean);
      } else if (isKnown) {
        notes = dbComp.description
          ? dbComp.description.split('\n').filter(Boolean)
          : (STATIC_NOTES[tier] || []);
      } else {
        notes = dbComp.description ? dbComp.description.split('\n').filter(Boolean) : [];
      }
    }

    const staticMatchup = STATIC_MATCHUPS[tier] || {counters:[],countered_by:[]};
    const counteredBy = dbComp.countered_by
      ? dbComp.countered_by.split(',').map(s=>s.trim()).filter(Boolean)
      : staticMatchup.countered_by;

    let preemptive = [];
    const preemptiveRaw = extraMap[`preemptive_${tierLow}`];
    if (preemptiveRaw) { try { preemptive = JSON.parse(preemptiveRaw); } catch {} }

    const howToPlay = extraMap[`how_to_play_${tierLow}`] || '';

    compsHtml += renderComp({
      tier,
      name: dbComp.name,
      type: dbComp.type || 'ATK',
      color: dbComp.color || '#c9a84c',
      anchorId: tierLow,
      chars,
      bondsData: tier === 'T1' ? T1_DATA.bonds : null,
      rotation,
      unitOrder,
      notes,
      counters: staticMatchup.counters,
      countered_by: counteredBy,
      warning: STATIC_WARNINGS[tier] || null,
      preemptive,
      howToPlay,
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
  if (action === 'expand-img')  { e.stopPropagation(); openLightbox(b.dataset.src); }
  if (action === 'card-flip')   toggleFlip(b.dataset.slug);
  if (action === 'board-flip') {
    var wrap = b.closest('[data-action="board-flip"]');
    if (wrap) toggleBoardFlip(wrap.dataset.tier);
  }
});

function toggleFlip(cardId) {
  var inner = document.getElementById('card-' + cardId);
  if (!inner) return;
  inner.classList.toggle('flipped');
}

function toggleBoardFlip(tier) {
  var inner = document.getElementById('board-card-' + tier);
  if (!inner) return;
  inner.classList.toggle('flipped');
}

document.addEventListener('mouseover', function(e) {
  var wrap = e.target.closest('.skill-wrap');
  if (!wrap) return;
  var popup = wrap.querySelector('.tt-popup');
  if (!popup) return;
  popup.style.visibility = 'hidden';
  popup.style.display = 'block';
  popup.style.position = 'fixed';
  popup.style.zIndex = '99999';
  popup.style.left = '0px';
  popup.style.top = '0px';
  popup.style.background = '#0f0f18';
  popup.style.border = '1px solid rgba(201,168,76,0.2)';
  popup.style.boxShadow = '0 8px 32px rgba(0,0,0,0.8)';
  var ph = popup.offsetHeight;
  var pw = popup.offsetWidth;
  var rect = wrap.getBoundingClientRect();
  var left = Math.min(rect.left, window.innerWidth - pw - 8);
  var top = rect.top - ph - 8;
  if (top < 4) top = rect.bottom + 8;
  popup.style.left = Math.max(4, left) + 'px';
  popup.style.top = Math.max(4, top) + 'px';
  popup.style.visibility = 'visible';
});
document.addEventListener('mouseout', function(e) {
  var wrap = e.target.closest('.skill-wrap');
  if (!wrap || wrap.contains(e.relatedTarget)) return;
  var popup = wrap.querySelector('.tt-popup');
  if (popup) popup.style.display = 'none';
});

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
