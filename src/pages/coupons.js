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
    : '<p style="text-align:center;color:var(--text3);padding:2rem">No active codes right now - check back soon!</p>';

  // Safe JSON injection: escape </ to prevent </script> from breaking the HTML parser
  const codesJson = JSON.stringify(codes.map(c => ({ code: c.code, rewards: c.rewards || '' })))
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  return layout('Coupons', `
<div class="hero" style="padding-bottom:2rem">
  <div class="hero-tag">Rewards</div>
  <h1>Coupon <span>Codes</span></h1>
  <p>Enter your in-game nickname and click Redeem All - every active code is tried automatically</p>
</div>

<div class="coupon-form">
  <h3>Auto-Redeem All Codes</h3>
  <div class="form-group">
    <label for="nickname">In-Game Nickname</label>
    <input type="text" id="nickname" name="nickname" placeholder="Your BD2 nickname (case-sensitive)" autocomplete="off"
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
.rb-debug {
  flex-basis:100%;margin-top:0.4rem;padding:0.5rem 0.7rem;
  background:rgba(0,0,0,0.35);border:1px dashed rgba(231,76,60,0.4);border-radius:4px;
  font-family:'Courier New',monospace;font-size:0.7rem;color:#e67e22;
  white-space:pre-wrap;word-break:break-all;line-height:1.5;
}
#toast-stack {
  position:fixed;bottom:2.5rem;left:50%;transform:translateX(-50%);z-index:9999;
  display:flex;flex-direction:column;gap:0.5rem;width:340px;pointer-events:none;align-items:stretch;
}
.toast {
  pointer-events:auto;padding:0.75rem 1rem;border-radius:6px;
  font-size:0.85rem;line-height:1.4;font-family:inherit;
  box-shadow:0 6px 24px rgba(0,0,0,0.35);
  animation:toast-in 0.2s ease-out;
}
.toast.t-success { background:rgba(46,204,113,0.95); color:#fff; border:1px solid rgba(46,204,113,1); }
.toast.t-warn    { background:rgba(243,156,18,0.95); color:#fff; border:1px solid rgba(243,156,18,1); }
.toast.t-error   { background:rgba(231,76,60,0.95);  color:#fff; border:1px solid rgba(231,76,60,1); }
.toast.t-info    { background:rgba(52,73,94,0.95);   color:#fff; border:1px solid rgba(52,73,94,1); }
.toast b { font-family:'Cinzel',serif;display:block;margin-bottom:0.15rem;font-size:0.78rem;letter-spacing:0.04em; }
@keyframes toast-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
</style>

<div id="toast-stack"></div>

<script>
var CODES = ${codesJson};

function showToast(kind, title, msg) {
  var stack = document.getElementById('toast-stack');
  if (!stack) return;
  var t = document.createElement('div');
  t.className = 'toast t-' + kind;
  t.innerHTML = '<b>' + escH(title) + '</b>' + escH(msg || '');
  stack.appendChild(t);
  var delay = kind === 'success' ? 4000 : 5500;
  setTimeout(function() {
    t.style.transition = 'opacity 0.3s';
    t.style.opacity = '0';
    setTimeout(function() { t.remove(); }, 300);
  }, delay);
}

function toastForResult(code, result) {
  var s = result.status;
  if (s === 'Success')       { showToast('success', code + ' - Redeemed!', result.message || 'Check your in-game mailbox.'); return; }
  if (s === 'AlreadyUsed')   { showToast('warn',    code + ' - Already Used', result.message || ''); return; }
  if (s === 'ExpiredCode')   { showToast('warn',    code + ' - Expired', result.message || ''); return; }
  if (s === 'InvalidCode')   { showToast('error',   code + ' - Invalid Code', result.message || ''); return; }
  if (s === 'IncorrectUser') { showToast('error',   'Wrong Nickname', result.message || 'Check your in-game name.'); return; }
  showToast('error', code + ' - Error', result.message || 'Unknown error');
}

function escH(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function delay(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

function statusClass(s) {
  var m = { Success:'rb-success', AlreadyUsed:'rb-used', ExpiredCode:'rb-expired', InvalidCode:'rb-invalid', IncorrectUser:'rb-user', NetworkError:'rb-error', Error:'rb-error' };
  return m[s] || 'rb-error';
}

function statusLabel(s) {
  var m = { Success:'Redeemed!', AlreadyUsed:'Already Used', ExpiredCode:'Expired', InvalidCode:'Invalid Code', IncorrectUser:'Wrong Nickname', NetworkError:'Network Error', Error:'Error' };
  return m[s] || s;
}

function getNickname() {
  var el = document.getElementById('nickname');
  return el ? (el.value || '').trim() : '';
}

async function redeemViaProxy(nickname, code) {
  var res = await fetch('/api/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname: nickname, code: code }),
  });
  return await res.json();
}

function renderDebug(row, result) {
  if (!row || row.querySelector('.rb-debug')) return;
  var lines = [];
  lines.push('msg: ' + (result.message || '-'));
  lines.push('http: ' + (result.http != null ? result.http : '-'));
  if (result.raw) lines.push('raw: ' + result.raw);
  var div = document.createElement('div');
  div.className = 'rb-debug';
  div.textContent = lines.join('\\n');
  row.appendChild(div);
}

async function redeemAll() {
  var nickname = getNickname();
  if (!nickname) {
    document.getElementById('redeem-status').textContent = 'Please enter your in-game nickname.';
    showToast('warn', 'Nickname required', 'Please enter your in-game nickname first.');
    document.getElementById('nickname').focus();
    return;
  }
  if (!CODES.length) {
    document.getElementById('redeem-status').textContent = 'No active codes to redeem.';
    showToast('info', 'No codes', 'There are no active codes right now.');
    return;
  }

  var btn = document.getElementById('redeem-btn');
  btn.disabled = true;
  btn.textContent = 'Redeeming...';
  document.getElementById('redeem-status').textContent = '';

  var resultsList = document.getElementById('results-list');
  var summary = document.getElementById('redeem-summary');
  document.getElementById('redeem-results').style.display = 'block';
  summary.textContent = '';

  resultsList.innerHTML = CODES.map(function(c) {
    return '<div class="result-row" id="r-' + escH(c.code) + '">'
      + '<span class="result-code">' + escH(c.code) + '</span>'
      + '<span class="result-badge rb-pending">Pending...</span>'
      + '</div>';
  }).join('');

  var counts = { success: 0, used: 0, other: 0 };

  for (var i = 0; i < CODES.length; i++) {
    var code = CODES[i].code;
    var row = document.getElementById('r-' + escH(code));
    var badge = row ? row.querySelector('.result-badge') : null;
    if (badge) badge.textContent = 'Trying...';
    await delay(300);
    try {
      var result = await redeemViaProxy(nickname, code);
      if (badge) {
        badge.className = 'result-badge ' + statusClass(result.status || (result.success ? 'Success' : 'Error'));
        badge.textContent = statusLabel(result.status || (result.success ? 'Success' : 'Error'));
      }
      if (result.status !== 'Success' && result.status !== 'AlreadyUsed' && result.status !== 'IncorrectUser') renderDebug(row, result);
      toastForResult(code, result);
      if (result.success) counts.success++;
      else if (result.status === 'AlreadyUsed') counts.used++;
      else counts.other++;
    } catch(e) {
      if (badge) { badge.className = 'result-badge rb-error'; badge.textContent = 'Error'; }
      showToast('error', code + ' - Error', e.message || 'Request failed');
      counts.other++;
    }
  }

  btn.disabled = false;
  btn.textContent = 'Redeem All Active Codes';

  var parts = [];
  if (counts.success) parts.push(counts.success + ' redeemed');
  if (counts.used)    parts.push(counts.used + ' already used');
  if (counts.other)   parts.push(counts.other + ' failed');
  summary.textContent = parts.join(' | ');
  showToast(counts.success ? 'success' : (counts.other ? 'warn' : 'info'), 'Done', parts.join(' | ') || 'Nothing to do');
}

async function redeemOne(code) {
  var nickname = getNickname();
  if (!nickname) {
    document.getElementById('redeem-status').textContent = 'Enter your in-game nickname first.';
    showToast('warn', 'Nickname required', 'Enter your in-game nickname first.');
    document.getElementById('nickname').focus();
    return;
  }

  document.getElementById('redeem-results').style.display = 'block';
  var resultsList = document.getElementById('results-list');
  var rowId = 'r-' + code;
  if (!document.getElementById(rowId)) {
    var div = document.createElement('div');
    div.id = rowId;
    div.className = 'result-row';
    div.innerHTML = '<span class="result-code">' + escH(code) + '</span><span class="result-badge rb-pending">Trying...</span>';
    resultsList.prepend(div);
  }
  var row = document.getElementById(rowId);
  var badge = row.querySelector('.result-badge');
  if (badge) { badge.className = 'result-badge rb-pending'; badge.textContent = 'Trying...'; }
  var prev = row.querySelector('.rb-debug');
  if (prev) prev.remove();

  try {
    var result = await redeemViaProxy(nickname, code);
    if (badge) {
      badge.className = 'result-badge ' + statusClass(result.status || (result.success ? 'Success' : 'Error'));
      badge.textContent = statusLabel(result.status || (result.success ? 'Success' : 'Error'));
    }
    if (result.status !== 'Success' && result.status !== 'AlreadyUsed' && result.status !== 'IncorrectUser') renderDebug(row, result);
    toastForResult(code, result);
  } catch(e) {
    if (badge) { badge.className = 'result-badge rb-error'; badge.textContent = 'Error'; }
    showToast('error', code + ' - Error', e.message || 'Request failed');
  }
}

document.addEventListener('click', function(e) {
  var btn = e.target.closest('[data-action]');
  if (!btn) return;
  var action = btn.dataset.action;
  var code = btn.dataset.code || '';
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
  if (action === 'redeem-all') redeemAll();
  if (action === 'redeem-one') redeemOne(code);
});
</script>
`, 'coupons');
}
