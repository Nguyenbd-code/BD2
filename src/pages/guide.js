import { layout, esc } from '../layout/layout.js';
import { T1_DATA, SCHERA_ICONS } from '../data/t1.js';

const STATIC_COMPS = [
  { id:'t2', tier:'T2', name:'Eleaneer+Roxy Dispel', type:'ATK', warning:null,
    chars:[{name:'Rou',bond:'Red Riding Hood'},{name:'Zenith',bond:'Robin Hood'},{name:'Roxy',bond:'Respected Master'},{name:'Eleaneer',bond:'B-Rank Idol'},{name:'Scheherazade',bond:'Magic Professor'}],
    notes:['Rou needs at least 21,000 HP and 50% Critical Rate','Rou wants 1 HP/Res piece to survive an empowered basic','Roxy wants 50% Critical Rate','Zenith wants 105% Magic Res and at least 21,000 HP','Eleaneer wants 50% Critical Rate','Scheherazade wants 50% Critical Rate','Any DPS can alternate between Def/Res'],
    counters:[], countered_by:['Counter Granhildr','Blade if can\'t kill T1'] },
  { id:'t3', tier:'T3', name:'Justia Double Taunt', type:'ATK', warning:null,
    chars:[{name:'Roxy',bond:'Respected Master'},{name:'Lecliss',bond:'Android Queen'},{name:'Seir',bond:'B-Rank Idol'},{name:'Justia',bond:'Knight of Blood'},{name:'Teresse',bond:'Beachside Angel'}],
    notes:['Lecliss needs at least 33,000 HP and 90% Defence','Seir needs at least 29,000 HP and 105% Magic Res','Justia wants as much ATK as possible','Roxy wants 100% Critical Rate','Teresse wants 100% Critical Rate'],
    counters:[], countered_by:['T6'] },
  { id:'t4', tier:'T4', name:'Blade Counter', type:'DEF', warning:null,
    chars:[{name:'Rou',bond:'Red Riding Hood'},{name:'Lecliss',bond:'Android Queen'},{name:'Blade',bond:'Onsen Sword Fighter'},{name:'Olivier',bond:'Fallen Wings'},{name:'Mamonir',bond:'Night of Death'}],
    notes:['Olivier can alternate between Magic and Defence Armor','Rou needs at least 21,000 HP and 50% Critical Rate','Rou wants 1 HP/Res piece to survive an empowered basic','Blade needs 50% Critical Rate and can alternate Def/Res','Lecliss needs at least 33,000 HP and 90% Defence','Mamonir needs at least 32,000 HP and 90% Defence','Can replace Mamonir with Granhildr Taunt Pre-em'],
    counters:[], countered_by:['Venaka','Schera','Double Taunt'] },
  { id:'t5', tier:'T5', name:'Alec+Elise (Michaela Counter)', type:'DEF', warning:'LOW WIN RATE — counters specific team comps only',
    chars:[{name:'Elise',bond:'Lovely Lady'},{name:'Zenith',bond:'Robin Hood'},{name:'Alec',bond:'Sword Breaker'},{name:'Olivier',bond:'Fallen Wings'},{name:'Granhildr',bond:'Comeback Idol'}],
    notes:['Olivier can alternate between Magic and Defence Armor','Zenith wants 105% Magic Res and as much HP as possible','Alec wants 90% Mres and HP necklaces with ATK subs','Elise needs 100% Critical Rate','Granhildr wants 90–110% and as much HP as possible'],
    counters:['Michaela'], countered_by:['Need Data'] },
  { id:'t6', tier:'T6', name:'Alec+Justia Anti Taunt', type:'DEF', warning:null,
    chars:[{name:'Granhildr',bond:'Comeback Idol'},{name:'Justia',bond:'Knight of Blood'},{name:'Alec',bond:'Sword Breaker'},{name:'Olivier',bond:'Fallen Wings'},{name:'Libertia',bond:'Dark Saintess'}],
    notes:['Olivier can alternate between Magic and Defence Armor','Justia wants as much ATK as possible','Alec wants 90% Mres and HP necklaces with ATK subs','Libertia wants 110% Mres and as much HP as possible','Granhildr wants 90–110% and as much HP as possible'],
    counters:['T3','Double Taunt Teams'], countered_by:['T2','T1'] },
];

function tileCls(type) {
  return { ALL:'tile-all', FRONT:'tile-front', SKIP:'tile-skip', SELF:'tile-self' }[type] || 'tile-front';
}

function cSlug(name) {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

// Horizontal character strip with flip cards (used by T2-T6 and DB comps)
function charStrip(chars, compId) {
  const colors = ['#e74c3c','#3498db','#2ecc71','#9b59b6','#e67e22'];
  return chars.map((c, idx) => {
    const slug = cSlug(c.name);
    const col  = colors[idx % colors.length];
    const cid  = `${slug}-${compId}`;
    const en   = esc(c.name);
    const eb   = esc(c.bond);
    return `<div class="char-card-wrap" style="flex:1;min-width:150px;max-width:220px" data-action="card-flip" data-slug="${cid}">
  <div class="char-card-inner" id="card-${cid}">
    <div class="char-face">
      <div style="height:140px;position:relative;background:var(--bg4);display:flex;align-items:center;justify-content:center;overflow:hidden">
        <span style="font-family:'Cinzel',serif;font-size:2.5rem;color:${col};font-weight:700">${esc(c.name.charAt(0))}</span>
        <img src="/img/char_${slug}_portrait" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">
      </div>
      <div style="padding:0.5rem 0.6rem;text-align:center">
        <div style="font-family:'Cinzel',serif;font-weight:700;font-size:0.83rem;color:var(--text)">${en}</div>
        <div style="font-size:0.68rem;color:var(--gold);margin-top:2px">${eb}</div>
      </div>
      <button data-action="card-pin" data-slug="${cid}" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.55);border:none;color:var(--text3);cursor:pointer;border-radius:3px;padding:2px 5px;font-size:0.65rem;z-index:5" title="Pin">📌</button>
    </div>
    <div class="char-face char-face-back">
      <div style="position:absolute;inset:0;background:var(--bg2);display:flex;align-items:center;justify-content:center">
        <span style="color:var(--text3);font-size:0.75rem">No gear image</span>
        <img src="/img/char_${slug}_gear" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:var(--bg2)" onerror="this.style.display='none'">
      </div>
      <button data-action="expand-img" data-src="/img/char_${slug}_gear" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.55);border:none;color:var(--gold);cursor:pointer;border-radius:3px;padding:2px 5px;font-size:0.65rem;z-index:5">⤢</button>
    </div>
  </div>
</div>`;
  }).join('');
}

// Board + video layout for the middle column of the 3-col grid
function boardMediaBox(tier, type, mediaMap) {
  const imageKey = tier === 'T1' ? 'board_pos' : `comp_${tier.toLowerCase()}_board`;
  const videoUrl = (mediaMap[tier] || {}).video || '';
  const isAtk    = type !== 'DEF';
  const arrow     = isAtk ? '⟶' : '⟵';

  const boxStyle = 'flex:1;min-height:220px;border:1px solid rgba(201,168,76,0.3);border-radius:6px;overflow:hidden;position:relative;display:flex;align-items:center;justify-content:center;background:var(--bg4)';

  const imgBox = `<div style="${boxStyle}">
    <span style="color:var(--text3);font-size:0.75rem">Coming soon</span>
    <img src="/img/${esc(imageKey)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain" onerror="this.style.display='none'">
  </div>`;

  const vidBox = `<div style="${boxStyle}">
    ${videoUrl
      ? `<video src="${esc(videoUrl)}" controls style="width:100%;height:100%;object-fit:contain"></video>`
      : '<span style="color:var(--text3);font-size:0.75rem">N/A</span>'}
  </div>`;

  const arrowEl = `<div style="color:var(--gold);font-size:1.4rem;flex-shrink:0;padding:0 0.4rem">${arrow}</div>`;

  return `<div style="border:2px solid var(--gold);border-radius:8px;padding:0.6rem;min-height:260px;display:flex;flex-direction:column;justify-content:center">
  <div style="display:flex;align-items:stretch;gap:0;flex:1">
    ${isAtk ? imgBox + arrowEl + vidBox : vidBox + arrowEl + imgBox}
  </div></div>`;
}

function t1Section(board, mediaMap) {
  const chars  = ['Rou','Seir','Lecliss','Scheherazade','Sylvia'];
  const bonds  = T1_DATA.bonds;
  const rot    = T1_DATA.rotation;
  const order  = T1_DATA.unitOrder;
  const colors = ['#e74c3c','#3498db','#2ecc71','#9b59b6','#e67e22'];

  // T1 character strip — portrait front, gear back, 220px, with tooltips
  const charCards = chars.map((name, idx) => {
    const b    = bonds[name];
    const slug = cSlug(name);
    const col  = colors[idx];
    const cid  = `${slug}-t1`;
    return `
<div class="char-card-wrap" style="flex:1;min-width:150px;max-width:220px" data-action="card-flip" data-slug="${cid}">
  <div class="char-card-inner tt-parent" id="card-${cid}">
    <div class="char-face">
      <div style="height:140px;position:relative;background:var(--bg4);display:flex;align-items:center;justify-content:center;overflow:hidden">
        <span style="font-family:'Cinzel',serif;font-size:2.5rem;color:${col};font-weight:700">${esc(name.charAt(0))}</span>
        <img src="/img/char_${slug}_portrait" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">
      </div>
      <div style="padding:0.5rem 0.6rem;text-align:center">
        <div style="font-family:'Cinzel',serif;font-weight:700;font-size:0.83rem;color:var(--text)">${esc(name)}</div>
        <div style="font-size:0.68rem;color:var(--gold);margin-top:2px">${esc(b.costume)}</div>
      </div>
      <div class="tt-popup">
        <div class="tt-name">${esc(name)} — ${esc(b.costume)}</div>
        <div class="tt-stats">${b.stats.map(s=>`<span class="tt-stat">${esc(s)}</span>`).join('')}</div>
        <div class="tt-desc">${esc(b.notes)}</div>
      </div>
    </div>
    <div class="char-face char-face-back">
      <div style="position:absolute;inset:0;background:var(--bg2);display:flex;align-items:center;justify-content:center">
        <span style="color:var(--text3);font-size:0.75rem">No gear image</span>
        <img src="/img/char_${slug}_gear" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:var(--bg2)" onerror="this.style.display='none'">
      </div>
      <button data-action="expand-img" data-src="/img/char_${slug}_gear" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.55);border:none;color:var(--gold);cursor:pointer;border-radius:3px;padding:2px 5px;font-size:0.65rem;z-index:5">⤢</button>
    </div>
  </div>
</div>`;
  }).join('');

  // Skill rotation rows (T1 only)
  const rotRows = chars.map(name => {
    const skills = rot[name];
    const icons  = skills.map((sk, i) => {
      const iconContent = sk.icon
        ? `<img src="${SCHERA_ICONS[sk.icon]}" alt="${esc(sk.costume.substring(0,3).toUpperCase())}" style="width:32px;height:32px;object-fit:cover;border-radius:50%;border:2px solid var(--border2)" onerror="this.outerHTML='<span class=\\'skill-abbr\\'>${esc(sk.costume.substring(0,3).toUpperCase())}</span>'">`
        : `<div class="skill-abbr">${esc(sk.costume.substring(0,3).toUpperCase())}</div>`;
      return `
<div class="skill-wrap">
  <div class="skill-icon-box" style="width:44px">
    <div class="skill-num">${i+1}</div>
    ${iconContent}
  </div>
  <div class="tt-popup">
    <div class="tt-name">${esc(sk.name)}</div>
    <div class="tt-stats">
      <span class="tt-stat">${esc(sk.sp)}</span>
      <span class="tt-stat">${esc(sk.cd)}</span>
      <span class="tt-stat ${tileCls(sk.tile)}">${esc(sk.tile)}</span>
    </div>
    <div class="tt-desc">${esc(sk.desc)}</div>
  </div>
</div>`;
    }).join('');
    return `<div class="rot-row"><div class="rot-char" style="width:80px;font-size:0.78rem">${esc(name)}</div><div class="rot-skills">${icons}</div></div>`;
  }).join('');

  const orderPills = order.map(u =>
    `<div style="display:flex;align-items:center;gap:0.4rem;padding:0.2rem 0.4rem;background:var(--bg4);border-radius:4px">
  <div style="width:15px;height:15px;border-radius:50%;background:var(--gold3);color:var(--bg);font-weight:700;font-size:0.58rem;display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;flex-shrink:0">${u.pos}</div>
  <div style="font-weight:700;font-size:0.72rem;color:var(--text)">${esc(u.name)}</div>
</div>`
  ).join('');

  return `
<div class="comp-section" id="t1">
  <div class="comp-header">
    <div>
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.4rem">
        <span class="tier-badge t1">T1</span>
        <h2 style="font-family:'Cinzel',serif;font-size:1.6rem;font-weight:700">Sylvia Double Taunt</h2>
        <span class="atk">⚔ Attack Composition</span>
      </div>
      <div style="display:inline-block;background:rgba(192,57,43,0.1);border:1px solid rgba(192,57,43,0.3);color:#e74c3c;font-size:0.78rem;padding:4px 12px;border-radius:3px">
        ⚠ Do Not Use unless going for Rank 1 — last hour only
      </div>
    </div>
  </div>

  <div style="font-family:'Cinzel',serif;font-size:0.78rem;color:var(--gold);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.75rem">Character Bonds</div>
  <div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-bottom:1.5rem">
    ${charCards}
  </div>

  <div style="display:grid;grid-template-columns:0.8fr 1.4fr 0.8fr;gap:1rem;align-items:start">
    <div class="card">
      <div class="card-title">Skill Rotation</div>
      <div class="rot-table">${rotRows}</div>
    </div>
    <div class="card">
      <div class="card-title">Board Positioning</div>
      ${boardMediaBox('T1', 'ATK', mediaMap)}
    </div>
    <div>
      <div class="card" style="margin-bottom:1rem">
        <div class="card-title">Build Notes</div>
        <ul class="notes-list" style="max-height:160px;overflow-y:auto">
          <li>Rou ≥21,000 HP · 50% Crit Rate · 1 HP/Res piece</li>
          <li>Lecliss ≥33,000 HP · 90% Defence</li>
          <li>Seir ≥29,000 HP · 105% Magic Resist</li>
          <li>Sylvia 50% Crit Rate · max ATK% substats</li>
          <li>Scheherazade 50% Crit Rate · MATK + CDMG build</li>
        </ul>
      </div>
      <div class="card" style="margin-bottom:1rem">
        <div class="card-title">Unit Order</div>
        <div style="display:flex;flex-direction:column;gap:0.15rem;margin-top:0.25rem">${orderPills}</div>
      </div>
      <div class="card">
        <div class="card-title">Matchups</div>
        <div style="font-size:0.78rem;color:var(--text3)">Counters: N/A</div>
        <div style="font-size:0.78rem;color:var(--text3);margin-top:0.3rem">Countered By: N/A</div>
      </div>
    </div>
  </div>
</div>`;
}

function compSection(comp, mediaMap) {
  const tc = { T1:'t1',T2:'t2',T3:'t3',T4:'t4',T5:'t5',T6:'t6' };
  const bc = tc[comp.tier] || 't2';
  const typeLabel = comp.type === 'ATK' ? '⚔ Attack Composition' : '🛡 Defence Composition';

  const strip = charStrip(comp.chars, comp.id);

  const notes = comp.notes.map(n => `<li>${esc(n)}</li>`).join('');
  const countersHtml = comp.counters.length
    ? `<div style="margin-bottom:0.4rem"><span style="font-size:0.75rem;color:var(--text3)">Counters </span>${comp.counters.map(c=>`<span class="beats-tag">${esc(c)}</span>`).join('')}</div>` : '';
  const beatenHtml = comp.countered_by.length
    ? `<div><span style="font-size:0.75rem;color:var(--text3)">Countered By </span>${comp.countered_by.map(c=>`<span class="counter-tag">${esc(c)}</span>`).join('')}</div>` : '';

  return `
<div class="comp-section" id="${comp.id}">
  <div class="comp-header">
    <div>
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.4rem">
        <span class="tier-badge ${bc}">${esc(comp.tier)}</span>
        <h2>${esc(comp.name)}</h2>
        <span class="${comp.type === 'ATK' ? 'atk' : 'def'}">${typeLabel}</span>
      </div>
      ${comp.warning ? `<div style="display:inline-block;background:rgba(192,57,43,0.1);border:1px solid rgba(192,57,43,0.3);color:#e74c3c;font-size:0.78rem;padding:4px 12px;border-radius:3px">⚠ ${esc(comp.warning)}</div>` : ''}
    </div>
  </div>

  <div style="font-family:'Cinzel',serif;font-size:0.78rem;color:var(--gold);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.75rem">Character Bonds</div>
  <div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-bottom:1.5rem">${strip}</div>

  <div style="display:grid;grid-template-columns:0.8fr 1.4fr 0.8fr;gap:1rem;align-items:start">
    <div class="card">
      <div class="card-title">Skill Rotation</div>
      <div style="color:var(--text3);font-size:0.82rem;text-align:center;padding:1rem 0">Skill data coming soon</div>
    </div>
    <div class="card">
      <div class="card-title">Board Positioning</div>
      ${boardMediaBox(comp.tier, comp.type, mediaMap)}
    </div>
    <div>
      <div class="card" style="margin-bottom:1rem">
        <div class="card-title">Build Notes</div>
        <ul class="notes-list" style="max-height:160px;overflow-y:auto">${notes}</ul>
      </div>
      <div class="card">
        <div class="card-title">Matchups</div>
        ${countersHtml}${beatenHtml}
        ${!comp.counters.length && !comp.countered_by.length ? '<span style="color:var(--text3);font-size:0.82rem">Data pending</span>' : ''}
      </div>
    </div>
  </div>
</div>`;
}

const DEFAULT_BOARD = {
  d1:'Seir', d2:'', d3:'Lecliss', d4:'', d5:'', d6:'',
  a1:'Rou',  a2:'Schera', a3:'', a4:'Sylvia', a5:'', a6:'',
};

export async function handleGuide(request, env) {
  let dbComps = [], board = DEFAULT_BOARD, mediaMap = {};
  try {
    const [compRes, boardRow, mediaRes] = await Promise.all([
      env.DB.prepare('SELECT tier, name, type, description, countered_by FROM compositions ORDER BY tier, id').all(),
      env.DB.prepare("SELECT data FROM images WHERE key='board_layout'").first(),
      env.DB.prepare('SELECT * FROM comp_media').all().catch(() => ({ results: [] })),
    ]);
    dbComps = compRes.results || [];
    if (boardRow) board = { ...DEFAULT_BOARD, ...JSON.parse(boardRow.data) };
    for (const m of (mediaRes.results || [])) {
      if (!mediaMap[m.tier]) mediaMap[m.tier] = {};
      mediaMap[m.tier][m.media_type] = m.value;
    }
  } catch { /* ignore */ }

  const sidebarLinks = [
    ['#t1','T1','Sylvia Double Taunt','t1'],
    ['#t2','T2','Eleaneer+Roxy Dispel','t2'],
    ['#t3','T3','Justia Double Taunt','t3'],
    ['#t4','T4','Blade Counter','t4'],
    ['#t5','T5','Alec+Elise','t5'],
    ['#t6','T6','Alec+Justia Anti Taunt','t6'],
    ...dbComps.map(c => [`#${slugify(c.name)}`, c.tier, c.name, (c.tier||'t1').toLowerCase()]),
  ].map(([href,tier,name,cls]) => `
<a href="${href}" class="sidebar-link">
  <span class="sidebar-badge ${cls}">${esc(tier)}</span>
  <span class="sidebar-name">${esc(name)}</span>
</a>`).join('');

  let compsHtml = t1Section(board, mediaMap);
  for (const comp of STATIC_COMPS) {
    compsHtml += compSection(comp, mediaMap);
  }
  for (const comp of dbComps) {
    const tc  = {T1:'t1',T2:'t2',T3:'t3',T4:'t4',T5:'t5',T6:'t6'};
    const bc  = tc[comp.tier] || 't2';
    const isAtk = comp.type === 'ATK';
    compsHtml += `
<div class="comp-section" id="${slugify(comp.name)}">
  <div class="comp-header">
    <div style="display:flex;align-items:center;gap:0.75rem">
      <span class="tier-badge ${bc}">${esc(comp.tier)}</span>
      <h2>${esc(comp.name)}</h2>
      <span class="${isAtk?'atk':'def'}">${isAtk?'⚔ Attack':'🛡 Defence'}</span>
    </div>
    ${comp.countered_by ? `<div style="margin-top:0.5rem"><span class="counter-tag">Countered By: ${esc(comp.countered_by)}</span></div>` : ''}
  </div>
  <div class="card" style="margin-bottom:1rem">
    <div class="card-title">Board Positioning</div>
    ${boardMediaBox(comp.tier, comp.type, mediaMap)}
  </div>
  <div class="card">
    <div class="tt-desc">${esc(comp.description||'')}</div>
  </div>
</div>`;
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
  if (action === 'card-pin')   togglePin(b.dataset.slug, e);
});

function toggleFlip(cardId) {
  var inner = document.getElementById('card-' + cardId);
  if (!inner || inner.dataset.pinned === 'true') return;
  inner.classList.toggle('flipped');
}

function togglePin(cardId, e) {
  e.stopPropagation();
  var inner = document.getElementById('card-' + cardId);
  if (!inner) return;
  var btn = e.target.closest('button');
  var pinned = inner.dataset.pinned === 'true';
  inner.dataset.pinned = pinned ? 'false' : 'true';
  if (btn) btn.style.color = pinned ? 'var(--text3)' : 'var(--gold)';
  if (!pinned) inner.classList.add('flipped');
}

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

function slugify(str) {
  return (str||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
