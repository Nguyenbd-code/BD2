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
    <button class="copy-btn" data-action="copy-code" data-code="${esc(c.code)}">Copy</button>
  </div>
  <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-top:0.4rem">
    ${c.rewards ? `<div class="code-expiry" style="flex:1">${esc(c.rewards)}</div>` : ''}
    ${c.expiry ? `<div class="code-expiry">Expires: ${esc(c.expiry)}</div>` : ''}
    <button class="copy-btn" style="font-size:0.72rem" data-action="redeem-one" data-code="${esc(c.code)}">Quick Redeem</button>
  </div>
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
    <input type="text" id="nickname" placeholder="Your BD2 nickname (case-sensitive)" autocomplete="off"
      style="font-size:1rem">
  </div>
  <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
    <button class="btn" id="redeem-btn" data-action="redeem-all" style="flex:1;min-width:200px">
      Redeem All Active Codes
    </button>
  </div>
  <div id="redeem-status" style="font-size:0.8rem;color:var(--text3);margin-top:0.5rem;min-height:1.2em"></div>

  <div id="redeem-results" style="display:none;margin-top:1.5rem">
    <div style="font-family:'Cinzel',serif;font-size:0.88rem;color:var(--gold);margin-bottom:0.75rem">Results</div>
    <div id="results-list"></div>
    <div id="redeem-summary" style="margin-top:0.75rem;font-size:0.82rem;color:var(--text3)"></div>
  </div>
</div>

<div style="max-width:1200px;margin:0 auto;padding:0 2rem 1rem">
  <div class="section-title" style="margin-bottom:0.5rem">Active Codes</div>
  <div class="section-sub">All codes below are tried automatically when you enter your nickname above</div>
</div>
<div class="code-grid">${codeCards}</div>

<style>
.rb-success  { background:rgba(46,204,113,0.15);color:#2ecc71;border:1px solid rgba(46,204,113,0.3); }
.rb-used     { background:rgba(243,156,18,0.12);color:#f39c12;border:1px solid rgba(243,156,18,0.3); }
.rb-expired  { background:rgba(149,165,166,0.12);color:#95a5a6;border:1px solid rgba(149,165,166,0.3); }
.rb-invalid  { background:rgba(231,76,60,0.12);color:#e74c3c;border:1px solid rgba(231,76,60,0.3); }
.rb-user     { background:rgba(231,76,60,0.12);color:#e74c3c;border:1px solid rgba(231,76,60,0.3); }
.rb-pending  { background:rgba(201,168,76,0.1);color:var(--gold);border:1px solid rgba(201,168,76,0.2); }
.rb-error    { background:rgba(231,76,60,0.12);color:#e74c3c;border:1px solid rgba(231,76,60,0.3); }
.result-badge {
  display:inline-block;font-size:0.72rem;padding:3px 10px;border-radius:3px;
  font-family:'Cinzel',serif;white-space:nowrap;
}
.result-row {
  display:flex;align-items:center;gap:0.75rem;padding:0.55rem 0.75rem;
  background:var(--bg3);border-radius:5px;margin-bottom:0.4rem;
  border:1px solid var(--border2);flex-wrap:wrap;
}
.result-code { font-family:monospace;font-size:0.85rem;color:var(--text);flex:1;min-width:120px; }
.result-rewards { font-size:0.72rem;color:var(--text3);flex:2; }
</style>

<script>
var CODES = ${codesJson};

function escH(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function delay(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

function statusClass(status) {
  return {
    Success:      'rb-success',
    AlreadyUsed:  'rb-used',
    ExpiredCode:  'rb-expired',
    InvalidCode:  'rb-invalid',
    IncorrectUser:'rb-user',
    NetworkError: 'rb-error',
    Error:        'rb-error',
  }[status] || 'rb-error';
}

function statusLabel(status) {
  return {
    Success:      '✓ Redeemed!',
    AlreadyUsed:  'Already Used',
    ExpiredCode:  'Expired',
    InvalidCode:  'Invalid Code',
    IncorrectUser:'Wrong Nickname',
    NetworkError: 'Network Error',
    Error:        'Error',
  }[status] || status;
}

function getNickname() {
  return (document.getElementById('nickname').value || '').trim();
}

// Call Worker proxy — avoids CORS by making request server-side
async function redeemViaProxy(nickname, code) {
  var res = await fetch('/api/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname: nickname, code: code }),
  });
  return await res.json();
}

async function redeemAll() {
  var nickname = getNickname();
  if (!nickname) { document.getElementById('redeem-status').textContent = 'Please enter your in-game nickname.'; document.getElementById('nickname').focus(); return; }
  if (!CODES.length) { document.getElementById('redeem-status').textContent = 'No active codes to redeem.'; return; }

  var btn = document.getElementById('redeem-btn');
  btn.disabled = true;
  btn.textContent = 'Redeeming…';
  document.getElementById('redeem-status').textContent = '';

  var resultsList = document.getElementById('results-list');
  var summary     = document.getElementById('redeem-summary');
  document.getElementById('redeem-results').style.display = 'block';
  summary.textContent = '';

  resultsList.innerHTML = CODES.map(function(c) {
    return '<div class="result-row" id="r-' + escH(c.code) + '">'
      + '<span class="result-code">' + escH(c.code) + '</span>'
      + (c.rewards ? '<span class="result-rewards">' + escH(c.rewards) + '</span>' : '')
      + '<span class="result-badge rb-pending">Pending…</span>'
      + '</div>';
  }).join('');

  var counts = { success: 0, used: 0, other: 0 };

  for (var i = 0; i < CODES.length; i++) {
    var code = CODES[i].code;
    var row  = document.getElementById('r-' + escH(code));
    var badge = row ? row.querySelector('.result-badge') : null;
    if (badge) badge.textContent = 'Trying…';

    await delay(300);

    try {
      var result = await redeemViaProxy(nickname, code);
      if (!badge) continue;
      badge.className = 'result-badge ' + statusClass(result.status || (result.success ? 'Success' : 'Error'));
      badge.textContent = statusLabel(result.status || (result.success ? 'Success' : 'Error'));
      if (result.message && result.status !== 'Success' && result.status !== 'AlreadyUsed') {
        badge.title = result.message;
      }
      if (result.success) counts.success++;
      else if (result.status === 'AlreadyUsed') counts.used++;
      else counts.other++;
    } catch(e) {
      if (badge) { badge.className = 'result-badge rb-error'; badge.textContent = 'Error'; badge.title = e.message; }
      counts.other++;
    }
  }

  btn.disabled = false;
  btn.textContent = 'Redeem All Active Codes';

  var parts = [];
  if (counts.success) parts.push(counts.success + ' redeemed');
  if (counts.used)    parts.push(counts.used + ' already used');
  if (counts.other)   parts.push(counts.other + ' failed');
  summary.textContent = parts.join(' · ');
}

async function redeemOne(code) {
  var nickname = getNickname();
  if (!nickname) { document.getElementById('redeem-status').textContent = 'Enter your in-game nickname first.'; document.getElementById('nickname').focus(); return; }

  document.getElementById('redeem-results').style.display = 'block';
  var resultsList = document.getElementById('results-list');
  var rowId = 'r-' + code;
  if (!document.getElementById(rowId)) {
    var div = document.createElement('div');
    div.id = rowId;
    div.className = 'result-row';
    div.innerHTML = '<span class="result-code">' + escH(code) + '</span><span class="result-badge rb-pending">Trying…</span>';
    resultsList.prepend(div);
  }
  var row   = document.getElementById(rowId);
  var badge = row.querySelector('.result-badge');
  if (badge) { badge.className = 'result-badge rb-pending'; badge.textContent = 'Trying…'; }

  try {
    var result = await redeemViaProxy(nickname, code);
    if (badge) {
      badge.className = 'result-badge ' + statusClass(result.status || (result.success ? 'Success' : 'Error'));
      badge.textContent = statusLabel(result.status || (result.success ? 'Success' : 'Error'));
      if (result.message) badge.title = result.message;
    }
  } catch(e) {
    if (badge) { badge.className = 'result-badge rb-error'; badge.textContent = 'Error'; badge.title = e.message; }
  }
}

document.addEventListener('click', function(e) {
  var btn = e.target.closest('[data-action]');
  if (!btn) return;
  var action = btn.dataset.action;
  var code   = btn.dataset.code || '';

  if (action === 'copy-code') {
    navigator.clipboard.writeText(code).then(function() {
      var orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(function() { btn.textContent = orig; }, 1500);
    }).catch(function() {
      btn.textContent = 'Error';
      setTimeout(function() { btn.textContent = 'Copy'; }, 1500);
    });
  }
  if (action === 'redeem-all')  redeemAll();
  if (action === 'redeem-one')  redeemOne(code);
});
</script>
`, 'coupons');
}
