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
  <div class="code-rewards">${esc(c.rewards || '')}</div>
  ${c.expiry ? `<div class="code-expiry">Expires: ${esc(c.expiry)}</div>` : ''}
</div>`).join('')
    : '<p style="text-align:center;color:var(--text3);padding:2rem">No active codes right now — check back soon!</p>';

  const codesJson = JSON.stringify(codes.map(c => ({ code: c.code, rewards: c.rewards || '' })));

  return layout('Coupons', `
<div class="hero" style="padding-bottom:2rem">
  <div class="hero-tag">Rewards</div>
  <h1>Coupon <span>Codes</span></h1>
  <p>Enter your in-game nickname and click Redeem All — every active code is tried automatically</p>
</div>

<div class="coupon-form">
  <h3>Auto-Redeem All Codes</h3>
  <div class="form-group">
    <label>In-Game Nickname</label>
    <input type="text" id="nickname" placeholder="Your BD2 nickname" autocomplete="off">
  </div>
  <button class="btn" id="redeem-btn" onclick="redeemAll()">Redeem All Active Codes</button>
  <div id="redeem-results" style="display:none;margin-top:1.5rem">
    <div style="font-family:'Cinzel',serif;font-size:0.88rem;color:var(--gold);margin-bottom:0.75rem">Results</div>
    <div id="results-list"></div>
  </div>
</div>

<div style="max-width:1200px;margin:0 auto;padding:0 2rem 1rem">
  <div class="section-title" style="margin-bottom:0.5rem">Active Codes</div>
  <div class="section-sub">All codes below are tried automatically when you enter your nickname above</div>
</div>
<div class="code-grid">${codeCards}</div>

<script>
var CODES = ${codesJson};
var BD2_URL = 'https://redeem.bd2.pmang.cloud/bd2/coupon/use';
var BD2_PAGE = 'https://redeem.bd2.pmang.cloud/bd2/index.html?lang=en-EN';

function escH(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function delay(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

async function tryRedeemDirect(nickname, code) {
  var res = await fetch(BD2_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ nickname: nickname, coupon_code: code }).toString(),
  });
  var text = await res.text();
  var data;
  try { data = JSON.parse(text); } catch { data = {}; }
  var rc  = data.result_code !== undefined ? data.result_code : (data.resultCode !== undefined ? data.resultCode : (data.code !== undefined ? data.code : null));
  var msg = String(data.message || data.msg || data.result || '').toLowerCase();
  if (data.result === 'SUCCESS' || rc === 0 || msg.includes('success')) return { success: true };
  if (rc === 4 || msg.includes('already') || msg.includes('used') || msg.includes('expired')) return { already_used: true };
  return { failed: true, raw: text.replace(/<[^>]*>/g,'').trim().substring(0,100) };
}

function setManualFallback(row, code) {
  var badge = row.querySelector('.result-badge');
  badge.className = 'result-badge rb-failed';
  badge.style.display = 'none';
  var extra = document.createElement('span');
  extra.style.cssText = 'display:inline-flex;gap:0.4rem;align-items:center;flex-wrap:wrap';
  extra.innerHTML = '<span class="result-badge rb-failed" style="font-size:0.7rem">Manual</span>'
    + '<button class="copy-btn" onclick="navigator.clipboard.writeText(\\'' + escH(code) + '\\').then(function(){this.textContent=\\'Copied!\\';setTimeout(function(){document.querySelector(\\'[data-copy=\\"' + escH(code) + '\\"]\\')||0},1500)}.bind(this))" style="font-size:0.72rem">Copy Code</button>'
    + '<a href="' + BD2_PAGE + '" target="_blank" class="copy-btn" style="font-size:0.72rem;text-decoration:none">Open BD2 Page</a>';
  row.appendChild(extra);
}

async function redeemAll() {
  var nickname = document.getElementById('nickname').value.trim();
  if (!nickname) { alert('Please enter your in-game nickname.'); return; }
  if (!CODES.length) { alert('No active codes to redeem.'); return; }

  var btn = document.getElementById('redeem-btn');
  btn.disabled = true;
  btn.textContent = 'Redeeming…';

  var resultsList = document.getElementById('results-list');
  document.getElementById('redeem-results').style.display = 'block';

  resultsList.innerHTML = CODES.map(function(c) {
    return '<div class="result-row" id="r-' + escH(c.code) + '">'
      + '<span class="result-code">' + escH(c.code) + '</span>'
      + '<span class="result-badge rb-pending">Pending…</span>'
      + '</div>';
  }).join('');

  for (var i = 0; i < CODES.length; i++) {
    var code = CODES[i].code;
    var row  = document.getElementById('r-' + escH(code));
    if (row) row.querySelector('.result-badge').textContent = 'Trying…';
    await delay(400);

    try {
      var result = await tryRedeemDirect(nickname, code);
      if (!row) continue;
      var badge = row.querySelector('.result-badge');
      if (result.success) {
        badge.className = 'result-badge rb-success';
        badge.textContent = '✓ Success!';
      } else if (result.already_used) {
        badge.className = 'result-badge rb-used';
        badge.textContent = 'Already Used';
      } else {
        badge.className = 'result-badge rb-failed';
        badge.textContent = result.raw || 'Failed';
        badge.title = result.raw || '';
      }
    } catch(e) {
      // CORS blocked or network error — show manual fallback
      if (row) setManualFallback(row, code);
    }
  }

  btn.disabled = false;
  btn.textContent = 'Redeem All Active Codes';
}

function copyCode(code, btn) {
  navigator.clipboard.writeText(code).then(function() {
    var orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(function() { btn.textContent = orig; }, 1500);
  }).catch(function() {
    btn.textContent = 'Error';
    setTimeout(function() { btn.textContent = 'Copy'; }, 1500);
  });
}
</script>
`, 'coupons');
}
