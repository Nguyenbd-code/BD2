import { layout, esc } from '../layout/layout.js';

function compCard(comp) {
  const color    = comp.color || '#c9a84c';
  const shortDesc = esc((comp.short_description || comp.description || '').substring(0, 80));
  const typeIcon  = comp.type === 'ATK' ? '⚔' : '🛡';
  const tier      = comp.tier || '';
  const anchor    = tier.toLowerCase().replace(/[^a-z0-9]/g,'');
  return `<a href="/guide#${anchor}" style="text-decoration:none">
    <div style="background:var(--bg3);border:1px solid rgba(201,168,76,0.1);border-top:3px solid ${color};border-radius:8px;padding:1rem;transition:border-color 0.2s" onmouseenter="this.style.borderColor='${color}'" onmouseleave="this.style.borderColor='rgba(201,168,76,0.1)'">
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem">
        <span style="background:${color};color:#fff;font-family:'Cinzel',serif;font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:3px">${esc(tier)}</span>
        <span style="font-size:0.72rem;color:var(--text3)">${typeIcon} ${esc(comp.type||'')}</span>
      </div>
      <div style="font-family:'Cinzel',serif;font-size:0.9rem;font-weight:700;color:var(--text);margin-bottom:0.35rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(comp.name||'')}</div>
      <div style="font-size:0.75rem;color:var(--text3);line-height:1.4">${shortDesc}</div>
    </div>
  </a>`;
}

export async function handleHome(request, env) {
  let compRows = [];
  try {
    const res = await env.DB.prepare('SELECT * FROM compositions ORDER BY tier ASC').all();
    compRows = res.results || [];
  } catch { /* ignore */ }

  return layout('Home', `
<div class="hero">
  <div class="hero-tag">GrandMasters PvP Resource</div>
  <h1>Brown Dust 2 <span>BnKitsu Guide</span></h1>
  <p>Curated PvP team compositions for Top 30 — Rank 1 competitive play. Updated by BnKitsu.</p>
  <div class="hero-disclaimer">⚠ These compositions are intended for Top 30 to Rank 1 ranked play. Meta may shift with balance updates.</div>
</div>

<div class="section" style="padding-top:0">
  <div class="section-title">Strategy Notes</div>
  <div class="section-sub">Key rules for GrandMasters ranked play</div>
  <div class="comp-grid">
    <div class="card">
      <div class="card-title">Tier Usage</div>
      <ul class="notes-list">
        <li>Use T2 for general attacking and climbing</li>
        <li>Use T4 for general defence</li>
        <li>Only use T1 going for Rank 1 — last hour only</li>
        <li>T5 only counters Michaela, loses to most Double Taunt</li>
        <li>T6 counters T3 and Double Taunt — loses to T2 and T1</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-title">Targeting Top 10</div>
      <ul class="notes-list">
        <li>Hit 3 hours before end and sit in Top 10</li>
        <li>Defend until 2–1.5 hours remain</li>
        <li>Then spam attack</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-title">Targeting Rank 1</div>
      <ul class="notes-list">
        <li>Sit Top 1–3 at the 3-hour mark</li>
        <li>Use T6 as blocker to feed one player into R1</li>
        <li>The R1 player uses T1 or T2</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-title">Building PvP Characters</div>
      <ul class="notes-list">
        <li>Tanks: target 105% Magic Resist, Defence at 90%</li>
        <li>Damage carries: 50% Crit Rate with buffer, 100% without</li>
        <li>Justia &amp; Alec: HP ring with ATK substats + Magic Resist Armor</li>
        <li>All compositions can swap lanes</li>
      </ul>
    </div>
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

<div style="text-align:center;padding:2rem 0 0.5rem;opacity:0.18">
  <span id="egg-trigger" title="" style="cursor:pointer;font-size:0.9rem;user-select:none;transition:opacity 0.2s" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.18'">⚔</span>
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

  window.checkEgg = function() {
    var val = input.value;
    if (val === 'Seji404') {
      localStorage.setItem('kitsu_unlocked', 'true');
      result.textContent = '✓ Access Granted';
      result.style.color = '#d4af37';
      input.style.borderColor = '#d4af37';
    } else {
      result.textContent = '✗ Invalid Code';
      result.style.color = '#e74c3c';
      input.style.borderColor = '#e74c3c';
      input.classList.remove('egg-shake');
      void input.offsetWidth;
      input.classList.add('egg-shake');
    }
  };
})();
</script>
`, 'home');
}
