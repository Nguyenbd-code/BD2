import { layout, esc } from '../layout/layout.js';

function compCard(comp) {
  const color = (comp.color && comp.color !== 'undefined') ? comp.color : '#b48e3c';
  const rawDesc = (comp.short_description || comp.description || '').replace(/^(green|red):/, '');
  const tier = comp.tier || '';
  const type = (comp.type || 'ATK').toUpperCase();
  const typeLabel = type === 'ATK' ? 'Attack' : 'Defense';
  const anchor = tier.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `<a class="codex-card" style="--codex-accent:${color}" href="/guide#${anchor}">
    <div class="codex-card-inner">
      <div class="codex-tier">${esc(tier)}</div>
      <div class="codex-body">
        <div class="codex-meta">
          <span class="codex-meta-dot"></span>
          <span>${esc(typeLabel)}</span>
        </div>
        <h3 class="codex-name">${esc(comp.name || '')}</h3>
        <p class="codex-desc">${esc(rawDesc)}</p>
      </div>
    </div>
  </a>`;
}

const DEFAULT_HOME_NOTES = {
  1: { title: 'Tier Usage', content: 'Use T2 for general attacking and climbing\nUse T4 for general defence\nOnly use T1 going for Rank 1 — last hour only\nT5 only counters Michaela, loses to most Double Taunt\nT6 counters T3 and Double Taunt — loses to T2 and T1' },
  2: { title: 'Targeting Top 10', content: 'Hit 3 hours before end and sit in Top 10\nDefend until 2–1.5 hours remain\nThen spam attack' },
  3: { title: 'Targeting Rank 1', content: 'Sit Top 1–3 at the 3-hour mark\nUse T6 as blocker to feed one player into R1\nThe R1 player uses T1 or T2' },
  4: { title: 'Building PvP Characters', content: 'Tanks: target 105% Magic Resist, Defence at 90%\nDamage carries: 50% Crit Rate with buffer, 100% without\nJustia & Alec: HP ring with ATK substats + Magic Resist Armor\nAll compositions can swap lanes' },
};

function strategyCard(note) {
  const lines = (note.content || '').split('\n').map(l => l.trim()).filter(Boolean);
  const items = lines.map(l => `<li>${esc(l)}</li>`).join('') || '<li style="list-style:none;color:var(--text3);font-size:0.85rem">No content.</li>';
  return `<div class="card" style="height:100%;display:flex;flex-direction:column;min-height:160px">
      <div class="card-title" style="flex-shrink:0">${esc(note.title || '')}</div>
      <ul class="notes-list" style="flex:1">${items}</ul>
    </div>`;
}

export async function handleHome(request, env) {
  let compRows = [];
  let homeNotes = { 1: DEFAULT_HOME_NOTES[1], 2: DEFAULT_HOME_NOTES[2], 3: DEFAULT_HOME_NOTES[3], 4: DEFAULT_HOME_NOTES[4] };
  try {
    const res = await env.DB.prepare("SELECT * FROM compositions ORDER BY type ASC, COALESCE(NULLIF(sort_order,0),id*10) ASC, id ASC").all()
      .catch(() => env.DB.prepare('SELECT * FROM compositions ORDER BY type ASC, id ASC').all());
    compRows = res.results || [];
  } catch { /* ignore */ }

  try {
    const r = await env.DB.prepare("SELECT key, data FROM images WHERE key LIKE 'home_strategy_%'").all();
    for (const row of (r.results || [])) {
      const slot = parseInt(row.key.replace('home_strategy_', ''), 10);
      if (slot >= 1 && slot <= 4) {
        try { homeNotes[slot] = JSON.parse(row.data); } catch {}
      }
    }
  } catch { /* ignore */ }

  return await layout('Home', `
<div class="hero">
  <div class="hero-tag">PvP Resource</div>
  <h1>Brown Dust 2 <span>BnKitsu Guide</span></h1>
  <p>Team compositions for Top 30 — Rank 1 competitive play. Updated by BnKitsu. Mamonir Lover.</p>
  <div class="hero-disclaimer">⚠ These compositions are intended for Top 30 to Rank 1 ranked play. Meta may shift with balance updates.</div>
</div>

<div class="section" style="padding-top:0">
  <div class="section-title">Strategy Notes</div>
  <div class="section-sub">Key rules for GrandMasters ranked play</div>
  <div class="comp-grid">
    ${strategyCard(homeNotes[1])}
    ${strategyCard(homeNotes[2])}
    ${strategyCard(homeNotes[3])}
    ${strategyCard(homeNotes[4])}
  </div>
</div>

<section style="max-width:1100px;margin:0 auto 4rem;padding:0 1.5rem">
  <h2 style="font-family:'Cinzel',serif;color:var(--gold);font-size:1.4rem;margin-bottom:0.5rem;letter-spacing:0.05em">Overview</h2>
  <div style="width:40px;height:2px;background:var(--gold);margin-bottom:1.5rem;opacity:0.5"></div>
  ${compRows.length === 0
    ? '<p style="color:var(--text3);font-size:0.9rem">No information yet.</p>'
    : '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem">' + compRows.map(c => compCard(c)).join('') + '</div>'
  }
</section>

<div id="egg-wrap" style="text-align:center;padding:2rem 0 0.5rem;opacity:0.05;transition:opacity 0.4s">
  <span id="egg-trigger" title="" style="cursor:default;font-size:0.75rem;user-select:none" onmouseover="document.getElementById('egg-wrap').style.opacity='0.15'" onmouseout="document.getElementById('egg-wrap').style.opacity='0.05'">⚔</span>
</div>

<div id="egg-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;align-items:center;justify-content:center">
  <div id="egg-box" style="background:var(--bg2);border:1px solid var(--border2);border-radius:8px;padding:2rem;max-width:340px;width:90%;text-align:center">
    <div style="font-family:'Cinzel',serif;font-size:1.1rem;color:var(--text);margin-bottom:1rem">Secret Code</div>
    <input id="egg-input" type="password" placeholder="Enter code..." autocomplete="off"
      style="width:100%;box-sizing:border-box;background:var(--bg3);border:1px solid var(--border2);color:var(--text);padding:0.6rem 0.8rem;border-radius:4px;font-size:0.95rem;outline:none;margin-bottom:0.75rem">
    <div id="egg-result" style="font-size:0.88rem;min-height:1.2em;margin-bottom:0.75rem"></div>
    <button onclick="checkEgg()" style="background:var(--gold);color:#0a0a0f;border:none;padding:0.55rem 1.5rem;border-radius:4px;font-weight:700;cursor:pointer;font-size:0.9rem">Submit</button>
  </div>
</div>

<script>
(function(){
  var trigger = document.getElementById('egg-trigger');
  var modal   = document.getElementById('egg-modal');
  var box     = document.getElementById('egg-box');
  var input   = document.getElementById('egg-input');
  var result  = document.getElementById('egg-result');

  if (trigger) trigger.addEventListener('click', function() {
    modal.style.display = 'flex';
    input.value = '';
    result.textContent = '';
    setTimeout(function(){ input.focus(); }, 50);
  });

  if (modal) modal.addEventListener('click', function(e) {
    if (e.target === modal) closeEgg();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeEgg();
    if (e.key === 'Enter' && modal && modal.style.display === 'flex') checkEgg();
  });

  window.closeEgg = function() {
    modal.style.display = 'none';
  };

  window.checkEgg = async function() {
    var val = input.value;
    if (!val) return;
    result.textContent = '…';
    result.style.color = 'var(--text3)';
    try {
      var res  = await fetch('/api/secret/check', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code: val }) });
      var data = await res.json();
      if (data.success) {
        localStorage.setItem('kitsu_unlocked', 'true');
        result.textContent = '✓ Access Granted — Emotes page is now unlocked!';
        result.style.color = '#d4af37';
        input.style.borderColor = '#d4af37';
        modal.style.transition = 'background 0.8s ease';
        modal.style.background = 'rgba(201,168,76,0.15)';
        setTimeout(function() { modal.style.background = 'rgba(0,0,0,0.88)'; }, 100);
        setTimeout(closeEgg, 2000);
      } else {
        result.textContent = '✗ Invalid Code';
        result.style.color = '#e74c3c';
        input.style.borderColor = '#e74c3c';
        input.classList.remove('egg-shake');
        void input.offsetWidth;
        input.classList.add('egg-shake');
      }
    } catch(e) {
      result.textContent = '✗ Error';
      result.style.color = '#e74c3c';
    }
  };
})();
</script>
`, 'home', env);
}
