import { layout } from '../layout/layout.js';

export async function handleHome(request, env) {
  return layout('Home', `
<div class="hero">
  <div class="hero-tag">GrandMasters PvP Resource</div>
  <h1>Brown Dust 2 <span>BnKitsu Guide</span></h1>
  <p>Curated PvP team compositions for Top 30 — Rank 1 competitive play. Updated by BnKitsu.</p>
  <div class="hero-disclaimer">⚠ These compositions are intended for Top 30 to Rank 1 ranked play. Meta may shift with balance updates.</div>
</div>

<div class="section">
  <div class="section-title">Composition Overview</div>
  <div class="section-sub">Click any tier to jump to the full breakdown</div>
  <div class="tier-grid">
    <a href="/guide#t1" class="tier-card">
      <div class="tier-badge t1">T1</div> <span class="atk">ATK</span>
      <h3>Sylvia Double Taunt</h3>
      <p>Do Not Use unless going for Rank 1 — last hour only</p>
    </a>
    <a href="/guide#t2" class="tier-card">
      <div class="tier-badge t2">T2</div> <span class="atk">ATK</span>
      <h3>Eleaneer+Roxy Dispel</h3>
      <p>General PvP attacking and climbing</p>
    </a>
    <a href="/guide#t3" class="tier-card">
      <div class="tier-badge t3">T3</div> <span class="atk">ATK</span>
      <h3>Justia Double Taunt</h3>
      <p>Strong attack composition</p>
    </a>
    <a href="/guide#t4" class="tier-card">
      <div class="tier-badge t4">T4</div> <span class="def">DEF</span>
      <h3>Blade Counter</h3>
      <p>General PvP defence</p>
    </a>
    <a href="/guide#t5" class="tier-card">
      <div class="tier-badge t5">T5</div> <span class="def">DEF</span>
      <h3>Alec+Elise</h3>
      <p>Michaela Counter — low win rate outside niche</p>
    </a>
    <a href="/guide#t6" class="tier-card">
      <div class="tier-badge t6">T6</div> <span class="def">DEF</span>
      <h3>Alec+Justia Anti Taunt</h3>
      <p>Counters T3 and Double Taunt teams</p>
    </a>
  </div>
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
`, 'home');
}
