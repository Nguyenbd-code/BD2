import { layout, escHtml } from '../layout/layout.js';
import { T1_DATA } from '../data/t1.js';
import { STATIC_COMPS } from '../data/compositions.js';

export async function handleHome(request, env) {
  // Load DB compositions (user-added T2–T6 entries) and merge with static data
  let dbComps = [];
  try {
    const { results } = await env.DB.prepare(
      'SELECT tier, name, type, counters, countered_by FROM compositions ORDER BY tier, id'
    ).all();
    dbComps = results;
  } catch { /* DB not yet seeded */ }

  const allComps = [...STATIC_COMPS, ...dbComps];

  const tierOrder = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
  const tierMap = { T1: [T1_DATA], T2: [], T3: [], T4: [], T5: [], T6: [] };
  for (const c of allComps) {
    const t = c.tier || c.type;
    if (tierMap[t]) tierMap[t].push(c);
  }

  const tierCards = tierOrder.map(t => {
    const comps = tierMap[t];
    const cards = comps.map(c => {
      const counters = c.counters ? `<div class="tier-card-counters">Counters: ${escHtml(c.counters)}</div>` : '';
      const counteredBy = c.counteredBy || c.countered_by;
      const beaten = counteredBy ? `<div class="tier-card-counters" style="color:var(--text3)">Beaten by: ${escHtml(counteredBy)}</div>` : '';
      return `
<div class="tier-card">
  <div class="tier-card-header">
    <span class="tier-badge ${t.toLowerCase()}">${escHtml(t)}</span>
    <span class="tier-card-name">${escHtml(c.name)}</span>
    <span class="tier-card-type">${escHtml(c.type)}</span>
  </div>
  ${counters}${beaten}
</div>`;
    }).join('');
    return cards;
  }).join('');

  const strategyCards = `
<div class="strategy-card">
  <h3>General PvP Strategy</h3>
  <p>In BD2 Arena, picking your rank tier wisely is more important than playing the strongest team. T1 (Sylvia Double Taunt) is extremely powerful but draws heavy counters — only use it in the final hour of rank push.</p>
</div>
<div class="strategy-card">
  <h3>Counter Picking</h3>
  <p>Always check what your opponents are running before selecting. T4 Blade Counter is nearly unbeatable unless the enemy runs Venaka, Schera-based teams, or Double Taunt comps.</p>
</div>
<div class="strategy-card">
  <h3>Late-Season Adjustments</h3>
  <p>As the season ends, more players switch to T1 for rank gains. Swap to T2 Eleaneer+Roxy Dispel or T4 Blade Counter to farm points off them before locking in your final rank.</p>
</div>
<div class="strategy-card">
  <h3>Defense Picks</h3>
  <p>T4 Blade Counter and T6 Alec+Justia are the strongest defense comps — they punish auto-battle players who run standard ATK teams. Your defense can protect rank overnight.</p>
</div>`;

  const content = `
<div class="container">
  <h1 class="page-title">BnKitsu BD2 PvP Guide</h1>
  <p class="page-subtitle">Season meta overview — ranked by effectiveness in current arena</p>

  <div class="tier-grid">
    ${tierCards}
  </div>

  <div class="strategy-section">
    <h2>Strategy Notes</h2>
    <div class="strategy-grid">
      ${strategyCards}
    </div>
  </div>

  <div style="margin-top:2rem;text-align:center;font-size:0.8rem;color:var(--text3)">
    <a href="/guide">→ Full detailed guide with skill rotations</a>
  </div>
</div>`;

  return layout('Home', content);
}
