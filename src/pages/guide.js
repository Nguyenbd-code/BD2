import { layout, escHtml } from '../layout/layout.js';
import { T1_DATA } from '../data/t1.js';
import { STATIC_COMPS } from '../data/compositions.js';

export async function handleGuide(request, env) {
  // Fetch per-character notes from DB
  const charNotes = {};
  for (const char of T1_DATA.characters) {
    try {
      const key = `notes_${char.name.toLowerCase()}`;
      const row = await env.DB.prepare('SELECT data FROM images WHERE key = ?')
        .bind(key).first();
      if (row) charNotes[char.name] = row.data;
    } catch { /* ignore */ }
  }

  // Fetch unit order
  let unitOrder = T1_DATA.characters.map(c => c.name);
  try {
    const row = await env.DB.prepare('SELECT data FROM images WHERE key = ?')
      .bind('unit_order').first();
    if (row) {
      const parsed = JSON.parse(row.data);
      if (Array.isArray(parsed) && parsed.length) unitOrder = parsed;
    }
  } catch { /* ignore */ }

  // Load DB compositions
  let dbComps = [];
  try {
    const { results } = await env.DB.prepare(
      `SELECT tier, name, type, counters, countered_by, characters, notes
       FROM compositions ORDER BY tier, id`
    ).all();
    dbComps = results.map(r => ({
      ...r,
      characters: tryParse(r.characters, []),
      notes: tryParse(r.notes, []),
    }));
  } catch { /* ignore */ }

  const allComps = [...STATIC_COMPS, ...dbComps];

  // Sidebar nav links
  const sidebarLinks = [
    ['#t1', 'T1 — Sylvia Double Taunt'],
    ...allComps.map(c => [`#${slugify(c.name)}`, `${c.tier} — ${c.name}`]),
  ].map(([href, label]) => `<a href="${href}">${escHtml(label)}</a>`).join('');

  // T1 section
  const t1Html = renderT1Section(T1_DATA, charNotes, unitOrder, env);

  // T2–T6 sections
  const compSections = allComps.map(c => renderCompSection(c)).join('');

  const content = `
<div class="container" style="padding-top:1.5rem">
  <h1 class="page-title">PvP Guide</h1>
  <div class="guide-layout">
    <aside class="guide-sidebar">
      <h3>Navigation</h3>
      ${sidebarLinks}
    </aside>
    <main class="guide-content">
      ${t1Html}
      ${compSections}
    </main>
  </div>
</div>`;

  return layout('PvP Guide', content);
}

function renderT1Section(data, charNotes, unitOrder, env) {
  const orderedChars = unitOrder
    .map(name => data.characters.find(c => c.name === name))
    .filter(Boolean);

  const charStrips = orderedChars.map(char => {
    const notes = charNotes[char.name] || '';
    const noteItems = notes
      ? notes.split('\n').filter(Boolean).map(n => `<li>${escHtml(n)}</li>`).join('')
      : '';
    return `
<div class="t1-char">
  <img src="/img/${escHtml(char.gearKey)}" alt="${escHtml(char.name)} gear"
       class="t1-char-img"
       onerror="this.style.display='none'">
  <div class="t1-char-name">${escHtml(char.name)}</div>
  <div class="t1-char-costume">${escHtml(char.costume)}</div>
  <div class="t1-char-stats">${escHtml(char.bondStats)}</div>
  ${noteItems ? `<ul class="notes-list">${noteItems}</ul>` : ''}
</div>`;
  }).join('');

  const rotationRows = buildRotationRows(data, orderedChars);

  const boardImg = `
<div style="margin-bottom:1rem">
  <img src="/img/board_pos" alt="Board Positioning" style="max-width:340px;border-radius:8px;border:1px solid var(--border)"
       onerror="this.style.display='none'">
</div>`;

  return `
<section id="t1" style="margin-bottom:3rem">
  <div class="section-title">
    <span class="tier-badge t1">T1</span>
    ${escHtml(data.name)}
    <span class="tier-card-type">${escHtml(data.type)}</span>
  </div>
  <div class="warning-banner">⚠ ${escHtml(data.warning)}</div>
  ${boardImg}
  <div class="t1-chars">${charStrips}</div>
  <div class="rotation-section">
    <h3>Skill Rotation</h3>
    <div style="overflow-x:auto">
      <table class="rotation-table">
        <thead>
          <tr>
            <th>#</th>
            ${orderedChars.map(c => `<th>${escHtml(c.name)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rotationRows}
        </tbody>
      </table>
    </div>
  </div>
</section>`;
}

function buildRotationRows(data, orderedChars) {
  const maxSkills = Math.max(...data.rotation.map(r => r.skills.length));
  let rows = '';
  for (let i = 0; i < maxSkills; i++) {
    const cells = orderedChars.map(char => {
      const rot = data.rotation.find(r => r.character === char.name);
      const skill = rot?.skills[i];
      if (!skill) return '<td>—</td>';

      const tileCls = skill.tile || 'SELF';
      const iconHtml = skill.iconKey
        ? `<img src="/img/${escHtml(skill.iconKey)}" alt="${escHtml(skill.abbr)}" class="skill-icon-img"
               onerror="this.style.display='none'">`
        : '';

      const inner = `
<div class="skill-cell tt-parent" style="overflow:visible">
  ${iconHtml}
  <div>
    <div class="skill-abbr">${escHtml(skill.abbr)}</div>
    <div class="skill-sp" style="display:flex;gap:0.4rem">
      <span style="color:var(--gold3)">SP:${skill.sp}</span>
      <span>CD:${skill.cd}</span>
    </div>
  </div>
  <span class="tile-badge ${tileCls}" style="margin-left:0.2rem">${tileCls}</span>
  <div class="tt-popup">${escHtml(skill.desc)}</div>
</div>`;

      return `<td>${inner}</td>`;
    }).join('');

    rows += `<tr><td style="color:var(--text3);font-weight:700">${i + 1}</td>${cells}</tr>`;
  }
  return rows;
}

function renderCompSection(comp) {
  const tier = comp.tier || 'T?';
  const chars = (comp.characters || []).map(c => `
<div class="comp-char">
  <div class="comp-char-name">${escHtml(c.name)}</div>
  <div class="comp-char-costume">${escHtml(c.costume || '')} ${c.stats ? `— ${escHtml(c.stats)}` : ''}</div>
</div>`).join('');

  const notes = (comp.notes || []).map(n => `<li>${escHtml(n)}</li>`).join('');

  const counters = comp.counters
    ? `<span class="beats-tag">Beats: ${escHtml(comp.counters)}</span>` : '';
  const beaten = (comp.counteredBy || comp.countered_by)
    ? `<span class="counter-tag">Weak to: ${escHtml(comp.counteredBy || comp.countered_by)}</span>` : '';

  return `
<section id="${slugify(comp.name)}" style="margin-bottom:2.5rem">
  <div class="section-title">
    <span class="tier-badge ${tier.toLowerCase()}">${escHtml(tier)}</span>
    ${escHtml(comp.name)}
    <span class="tier-card-type">${escHtml(comp.type || '')}</span>
  </div>
  <div class="comp-card">
    <div class="comp-card-meta">${counters}${beaten}</div>
    <div class="comp-chars">${chars}</div>
    ${notes ? `<ul class="notes-list">${notes}</ul>` : ''}
  </div>
</section>`;
}

function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function tryParse(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}
