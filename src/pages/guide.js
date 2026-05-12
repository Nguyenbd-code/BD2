import { layout, esc } from '../layout/layout.js';
import { T1_DATA, SCHERA_ICONS, T1_IMAGES } from '../data/t1.js';

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

function charCard(name, bond) {
  const initial = name.charAt(0);
  return `
<div class="char-item">
  <div class="char-portrait">${esc(initial)}</div>
  <div class="char-info">
    <div class="char-name">${esc(name)}</div>
    <div class="char-bond">${esc(bond)}</div>
  </div>
</div>`;
}

function t1Section() {
  const chars = ['Rou','Seir','Lecliss','Scheherazade','Sylvia'];
  const bonds = T1_DATA.bonds;
  const rot   = T1_DATA.rotation;
  const order = T1_DATA.unitOrder;
  const colors = ['#e74c3c','#3498db','#2ecc71','#9b59b6','#e67e22'];

  // Character strip cards
  const charCards = chars.map((name, idx) => {
    const b = bonds[name];
    const gearKey = name.toLowerCase().replace('scheherazade','schera') + '_gear';
    const col = colors[idx];
    return `
<div class="t1-char tt-parent" style="flex:1;min-width:150px;max-width:220px">
  <div style="width:100%;height:90px;border-radius:6px;background:var(--bg4);border:1px solid var(--border2);margin-bottom:0.6rem;display:flex;align-items:center;justify-content:center;overflow:hidden;">
    <img src="/img/${esc(gearKey)}" alt="${esc(name)}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<span style=\\'font-family:Cinzel,serif;font-size:2rem;color:${col};font-weight:700\\'>${esc(name.charAt(0))}</span>'">
  </div>
  <div style="font-family:'Cinzel',serif;font-weight:700;font-size:0.9rem;color:var(--text)">${esc(name)}</div>
  <div style="font-size:0.75rem;color:var(--gold);margin-bottom:0.25rem">${esc(b.costume)}</div>
  <div style="font-size:0.7rem;color:var(--text3)">${b.stats.join(' · ')}</div>
  <div class="tt-popup">
    <div class="tt-name">${esc(name)} — ${esc(b.costume)}</div>
    <div class="tt-stats">${b.stats.map(s=>`<span class="tt-stat">${esc(s)}</span>`).join('')}</div>
    <div class="tt-desc">${esc(b.notes)}</div>
  </div>
</div>`;
  }).join('');

  // Skill rotation rows
  const rotRows = chars.map(name => {
    const skills = rot[name];
    const icons = skills.map((sk, i) => {
      const tileCl = tileCls(sk.tile);
      const iconContent = sk.icon
        ? `<img src="${SCHERA_ICONS[sk.icon]}" alt="${esc(sk.costume.substring(0,3).toUpperCase())}" style="width:38px;height:38px;object-fit:cover;border-radius:50%;border:2px solid var(--border2)" onerror="this.outerHTML='<span class=\\'skill-abbr\\'>${esc(sk.costume.substring(0,3).toUpperCase())}</span>'">`
        : `<div class="skill-abbr">${esc(sk.costume.substring(0,3).toUpperCase())}</div>`;
      return `
<div class="skill-wrap">
  <div class="skill-icon-box">
    <div class="skill-num">${i+1}</div>
    ${iconContent}
  </div>
  <div class="tt-popup">
    <div class="tt-name">${esc(sk.name)}</div>
    <div class="tt-stats">
      <span class="tt-stat">${esc(sk.sp)}</span>
      <span class="tt-stat">${esc(sk.cd)}</span>
      <span class="tt-stat tile-stat ${tileCls(sk.tile)}">${esc(sk.tile)}</span>
    </div>
    <div class="tt-desc">${esc(sk.desc)}</div>
  </div>
</div>`;
    }).join('');
    return `
<div class="rot-row">
  <div class="rot-char">${esc(name)}</div>
  <div class="rot-skills">${icons}</div>
</div>`;
  }).join('');

  // Unit order pills
  const orderPills = order.map(u => `
<div class="order-row">
  <div class="order-num">${u.pos}</div>
  <div class="order-char">${esc(u.name)}</div>
</div>`).join('');

  return `
<div class="comp-section" id="t1">
  <div class="comp-header">
    <div>
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.4rem">
        <span class="tier-badge t1">T1</span>
        <h2 style="font-family:'Cinzel',serif;font-size:1.6rem;font-weight:700">Sylvia Double Taunt</h2>
        <span class="atk">⚔ Attack Composition</span>
      </div>
      <div class="comp-meta">
        <div style="display:inline-block;background:rgba(192,57,43,0.1);border:1px solid rgba(192,57,43,0.3);color:#e74c3c;font-size:0.78rem;padding:4px 12px;border-radius:3px">
          ⚠ Do Not Use unless going for Rank 1 — last hour only
        </div>
      </div>
    </div>
  </div>

  <div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-bottom:1.5rem">
    ${charCards}
  </div>

  <div class="comp-grid" style="margin-bottom:1.5rem">
    <div class="card">
      <div class="card-title">Build Notes</div>
      <ul class="notes-list">
        <li>Rou ≥21,000 HP · 50% Crit Rate · 1 HP/Res piece</li>
        <li>Lecliss ≥33,000 HP · 90% Defence</li>
        <li>Seir ≥29,000 HP · 105% Magic Resist</li>
        <li>Sylvia 50% Crit Rate · max ATK% substats</li>
        <li>Scheherazade 50% Crit Rate · MATK + CDMG build</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-title">Unit Order</div>
      <div class="order-list">${orderPills}</div>
    </div>
  </div>

  <div class="card" style="margin-bottom:1.5rem">
    <div class="card-title">Matchups</div>
    <div>
      <span style="font-size:0.78rem;color:var(--text3);margin-right:0.5rem">Countered By</span>
      <span class="counter-tag">Granhildr Counter</span>
      <span class="counter-tag">T6 Anti-Taunt</span>
    </div>
  </div>

  <div class="card" style="margin-bottom:1.5rem">
    <div class="card-title">Skill Rotation — hover each skill for details</div>
    <div class="rot-table">${rotRows}</div>
  </div>

  <div class="card">
    <div class="card-title">Board Positioning</div>
    <div style="margin-top:0.5rem">
      <img src="/img/board_pos" alt="Board Positioning" style="max-width:340px;border-radius:6px;border:1px solid var(--border2)" onerror="this.outerHTML='<div style=\\'color:var(--text3);font-size:0.82rem\\'>Image not yet set — upload via Admin → Images</div>'">
    </div>
  </div>
</div>`;
}

function compSection(comp) {
  const tc = { T1:'t1',T2:'t2',T3:'t3',T4:'t4',T5:'t5',T6:'t6' };
  const bc = tc[comp.tier] || 't1';
  const typeLabel = comp.type === 'ATK' ? '⚔ Attack Composition' : '🛡 Defence Composition';
  const chars = comp.chars.map(c => charCard(c.name, c.bond)).join('');
  const notes = comp.notes.map(n => `<li>${esc(n)}</li>`).join('');
  const countersHtml = comp.counters.length
    ? `<div style="margin-bottom:0.5rem"><span style="font-size:0.78rem;color:var(--text3);margin-right:0.5rem">Counters</span>${comp.counters.map(c=>`<span class="beats-tag">${esc(c)}</span>`).join('')}</div>` : '';
  const beatenHtml = comp.countered_by.length
    ? `<div><span style="font-size:0.78rem;color:var(--text3);margin-right:0.5rem">Countered By</span>${comp.countered_by.map(c=>`<span class="counter-tag">${esc(c)}</span>`).join('')}</div>` : '';

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
  <div class="comp-grid">
    <div class="card">
      <div class="card-title">Character Bonds</div>
      <div class="char-list">${chars}</div>
    </div>
    <div>
      <div class="card" style="margin-bottom:1rem">
        <div class="card-title">Build Notes</div>
        <ul class="notes-list">${notes}</ul>
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

export async function handleGuide(request, env) {
  // Load any DB-added compositions
  let dbComps = [];
  try {
    const { results } = await env.DB.prepare(
      'SELECT tier, name, type, description, countered_by FROM compositions ORDER BY tier, id'
    ).all();
    dbComps = results;
  } catch { /* ignore */ }

  const sidebarLinks = [
    ['#t1','T1','Sylvia Double Taunt','t1','ATK'],
    ['#t2','T2','Eleaneer+Roxy Dispel','t2','ATK'],
    ['#t3','T3','Justia Double Taunt','t3','ATK'],
    ['#t4','T4','Blade Counter','t4','DEF'],
    ['#t5','T5','Alec+Elise','t5','DEF'],
    ['#t6','T6','Alec+Justia Anti Taunt','t6','DEF'],
    ...dbComps.map(c => [`#${slugify(c.name)}`, c.tier, c.name, (c.tier||'t1').toLowerCase(), c.type||'ATK']),
  ].map(([href,tier,name,cls,type]) => `
<a href="${href}" class="sidebar-link">
  <span class="sidebar-badge ${cls}">${esc(tier)}</span>
  <span class="sidebar-name">${esc(name)}</span>
</a>`).join('');

  let compsHtml = t1Section();
  for (const comp of STATIC_COMPS) {
    compsHtml += compSection(comp);
  }
  for (const comp of dbComps) {
    const tc = {T1:'t1',T2:'t2',T3:'t3',T4:'t4',T5:'t5',T6:'t6'};
    const bc = tc[comp.tier] || 't1';
    compsHtml += `
<div class="comp-section" id="${slugify(comp.name)}">
  <div class="comp-header">
    <div style="display:flex;align-items:center;gap:0.75rem">
      <span class="tier-badge ${bc}">${esc(comp.tier)}</span>
      <h2>${esc(comp.name)}</h2>
      <span class="${comp.type==='ATK'?'atk':'def'}">${comp.type==='ATK'?'⚔ Attack':'🛡 Defence'}</span>
    </div>
    ${comp.countered_by ? `<div style="margin-top:0.5rem"><span class="counter-tag">Countered By: ${esc(comp.countered_by)}</span></div>` : ''}
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
`, 'guide');
}

function slugify(str) {
  return (str||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
