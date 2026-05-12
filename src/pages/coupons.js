import { layout, esc } from '../layout/layout.js';

export async function handleCoupons(request, env) {
  let codes = [];
  try {
    const res = await env.DB.prepare('SELECT * FROM coupons WHERE active=1 ORDER BY created_at DESC').all();
    codes = res.results || [];
  } catch(e) {}

  const codeCards = codes.length
    ? codes.map(c => `
<div class="code-card">
  <div class="code-value">
    ${esc(c.code)}
    <button class="copy-btn" onclick="copyCode('${esc(c.code)}',this)">Copy</button>
  </div>
  <div class="code-rewards">${esc(c.rewards||'')}</div>
  ${c.expiry ? `<div class="code-expiry">Expires: ${esc(c.expiry)}</div>` : ''}
</div>`).join('')
    : '<p style="text-align:center;color:var(--text3);padding:2rem">No active codes at this time. Check back soon!</p>';

  const codesJson = JSON.stringify(codes.map(c => c.code));

  return layout('Coupons', `
<div class="hero" style="padding-bottom:2rem">
  <div class="hero-tag">Rewards</div>
  <h1>Coupon <span>Codes</span></h1>
  <p>Enter your in-game nickname and the site will automatically try every active code for you</p>
</div>

<div class="coupon-form">
  <h3>Auto-Redeem All Codes</h3>
  <div class="form-group">
    <label>In-Game Nickname</label>
    <input type="text" id="nickname" placeholder="Your BD2 nickname" autocomplete="off">
  </div>
  <button class="btn" id="redeem-btn" onclick="redeemAll()">Redeem All Active Codes</button>
  <div class="redeem-results" id="redeem-results">
    <div class="redeem-results-title">Results</div>
    <div id="results-list"></div>
  </div>
</div>

<div style="max-width:1200px;margin:0 auto;padding:0 2rem 1rem">
  <div class="section-title" style="margin-bottom:0.5rem">Active Codes</div>
  <div class="section-sub">All codes below are tried automatically when you enter your nickname</div>
</div>
<div class="code-grid">${codeCards}</div>

<script>
const CODES = ${codesJson};

async function redeemAll() {
  const nickname = document.getElementById('nickname').value.trim();
  if (!nickname) { alert('Please enter your in-game nickname.'); return; }
  if (!CODES.length) { alert('No active codes to redeem.'); return; }

  const btn = document.getElementById('redeem-btn');
  btn.disabled = true;
  btn.textContent = 'Redeeming...';

  const resultsList = document.getElementById('results-list');
  const resultsDiv  = document.getElementById('redeem-results');
  resultsDiv.style.display = 'block';
  resultsList.innerHTML = CODES.map(c =>
    '<div class="result-row" id="r-'+esc(c)+'"><span class="result-code">'+esc(c)+'</span><span class="result-badge rb-pending">Pending...</span></div>'
  ).join('');

  for (const code of CODES) {
    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, code }),
      });
      const data = await res.json();
      const row = document.getElementById('r-'+esc(code));
      if (!row) continue;
      let badgeClass, badgeText;
      if (data.success) {
        badgeClass = 'rb-success'; badgeText = 'Success!';
      } else if (data.already_used) {
        badgeClass = 'rb-used'; badgeText = 'Already Used';
      } else {
        badgeClass = 'rb-failed'; badgeText = data.message || 'Failed';
      }
      row.querySelector('.result-badge').className = 'result-badge ' + badgeClass;
      row.querySelector('.result-badge').textContent = badgeText;
    } catch(e) {
      const row = document.getElementById('r-'+esc(code));
      if (row) { row.querySelector('.result-badge').className='result-badge rb-failed'; row.querySelector('.result-badge').textContent='Error'; }
    }
  }

  btn.disabled = false;
  btn.textContent = 'Redeem All Active Codes';
}

function copyCode(code, btn) {
  navigator.clipboard.writeText(code).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = orig, 1500);
  });
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
</script>
`, 'coupons');
}
