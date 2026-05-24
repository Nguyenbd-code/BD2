import { layout, esc } from '../layout/layout.js';

export async function handleCoupons(request, env) {
  let codes = [];
  try {
    const res = await env.DB.prepare('SELECT * FROM coupons WHERE active=1 ORDER BY created_at DESC').all();
    codes = res.results || [];
  } catch(e) {}

  let specialConfig = { enabled: false, passcode: '', code: '' };
  try {
    const scRow = await env.DB.prepare("SELECT data FROM images WHERE key='special_code_config'").first().catch(() => null);
    if (scRow && scRow.data) {
      const sc = JSON.parse(scRow.data);
      // Only expose: whether it's enabled and whether there's a code (not the passcode or code itself)
      specialConfig.enabled = !!(sc.code && sc.passcode);
    }
  } catch(e) {}

  // Read-only table view of every active coupon. Redeemed state lives in
  // localStorage per-browser; the Copy button mirrors the existing copy-code
  // handler. Empty state if there's nothing in the DB.
  const codeTableRows = codes.length
    ? codes.map(c => `
        <tr data-row-code="${esc(c.code)}">
          <td class="ct-code">${esc(c.code)}</td>
          <td class="ct-reward">${esc(c.rewards || '—')}</td>
          <td class="ct-expiry">${esc(c.expiry || '—')}</td>
          <td class="ct-action"><button class="copy-btn ct-copy-btn" data-action="copy-code" data-code="${esc(c.code)}" aria-label="Copy code ${esc(c.code)}">Copy</button></td>
        </tr>`).join('')
    : `<tr><td colspan="4" class="empty-state-cell">No active codes right now — check back soon</td></tr>`;

  // Safe JSON injection: escape </ to prevent </script> from breaking the HTML parser
  const codesJson = JSON.stringify(codes.map(c => ({ code: c.code, rewards: c.rewards || '' })))
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  return await layout('Coupons', `
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
    <div class="coupon-eyebrow">Results</div>
    <div id="results-list"></div>
    <div id="redeem-summary" style="margin-top:0.75rem;font-size:0.82rem;color:var(--text3)"></div>
  </div>

  <div class="coupon-divider">
    <div class="coupon-eyebrow">Manual Code Redeem</div>
    <div style="display:flex;gap:0.5rem;align-items:stretch;flex-wrap:wrap">
      <input type="text" id="manual-code" placeholder="Enter code manually..." autocomplete="off"
        style="flex:1;min-width:160px;font-size:0.95rem;background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:0.6rem 0.8rem;border-radius:4px;outline:none">
      <button class="btn" data-action="redeem-manual" style="white-space:nowrap;flex-shrink:0">
        Redeem Code
      </button>
    </div>
  </div>
</div>

<div class="coupon-table-wrap">
  <div class="coupon-table-head">
    <h3 class="coupon-table-title">Coupon Codes</h3>
  </div>
  <div class="coupon-table-scroll">
    <table class="coupon-table">
      <thead>
        <tr>
          <th class="ct-col-code">Code</th>
          <th class="ct-col-reward">Reward</th>
          <th class="ct-col-expiry">End Date</th>
          <th class="ct-col-action">Action</th>
        </tr>
      </thead>
      <tbody>
        ${codeTableRows}
      </tbody>
    </table>
  </div>
</div>

${specialConfig.enabled ? `
<div class="coupon-form" style="margin-top:1.5rem" id="special-redeem-section">
  <h3 style="display:flex;align-items:center;gap:0.75rem">
    <span>Special Code</span>
    <span style="font-size:0.72rem;color:var(--text3);font-family:inherit;font-weight:400">— Passcode required</span>
  </h3>
  <div id="special-locked-view">
    <div style="text-align:center;padding:1.5rem 0">
      <div style="width:100px;height:100px;margin:0 auto 1rem;border-radius:8px;background:var(--bg3);border:1px solid var(--border2);overflow:hidden;display:flex;align-items:center;justify-content:center">
        <img src="/img/special_code_lock_image" class="img-err-hide" style="width:100%;height:100%;object-fit:contain" id="special-lock-img">
        <span id="special-lock-fallback" style="font-size:3rem">&#128274;</span>
      </div>
      <div style="font-size:0.85rem;color:var(--text3);margin-bottom:1rem">Enter the passcode to access the special code</div>
      <div class="form-group" style="max-width:300px;margin:0 auto">
        <input type="password" id="special-passcode" placeholder="Enter passcode..." autocomplete="off" style="text-align:center;font-size:1rem;letter-spacing:0.1em">
      </div>
      <div id="special-passcode-error" style="font-size:0.8rem;color:#e74c3c;margin-top:0.4rem;min-height:1.2em"></div>
      <button class="btn" data-action="check-special-passcode" style="margin-top:0.5rem">Unlock</button>
    </div>
  </div>
  <div id="special-unlocked-view" style="display:none">
    <div style="font-size:0.82rem;color:var(--text3);margin-bottom:1rem">Your special code is ready. Enter your in-game nickname above, then click Redeem.</div>
    <div class="code-card" id="special-code-display" style="font-size:1.1rem;letter-spacing:0.08em;font-family:monospace;text-align:center;padding:1rem">
      <span id="special-code-value" class="loading-state"><span class="loading-spinner"></span>Loading</span>
      <button class="copy-btn" data-action="copy-special-code" style="margin-left:0.75rem" aria-label="Copy special code">Copy</button>
    </div>
    <button class="btn" data-action="redeem-special-code" style="width:100%;margin-top:0.75rem">Redeem Special Code</button>
    <div id="special-redeem-result" style="margin-top:0.5rem;min-height:1.2em;font-size:0.82rem"></div>
  </div>
</div>` : ''}

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
  font-family:'IBM Plex Sans',system-ui,sans-serif;white-space:nowrap;
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
.toast b { font-family:'IBM Plex Sans',system-ui,sans-serif;display:block;margin-bottom:0.15rem;font-size:0.78rem;letter-spacing:0.04em; }
@keyframes toast-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

/* Coupon-codes table — read-only view of all active codes with a per-device
   "redeemed" checkbox and per-row Copy button. */
.coupon-table-wrap { max-width:1100px;margin:1.5rem auto 0;padding:0 1.5rem;width:100%;box-sizing:border-box; }
.coupon-table-head { margin-bottom:0.85rem; }
.coupon-table-title { font-family:'Fraunces',Georgia,serif;font-weight:600;font-variation-settings:'opsz' 96;font-size:1.35rem;color:#eef0fa;letter-spacing:-0.01em; }
.coupon-table-scroll { overflow-x:auto;border-radius:6px;background:#14141e;box-shadow:0 1px 0 rgba(220,230,255,0.06) inset,0 0 0 1px rgba(220,230,255,0.04),0 8px 22px rgba(0,0,0,0.5); }
.coupon-table { width:100%;border-collapse:collapse;min-width:480px;font-family:'IBM Plex Sans',system-ui,sans-serif; }
.coupon-table thead th { font-size:0.66rem;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:rgba(220,228,245,0.5);padding:0.85rem 1rem;text-align:left;border-bottom:1px solid rgba(220,230,255,0.06); }
.coupon-table tbody td { padding:0.75rem 1rem;font-size:0.85rem;color:#eef0fa;border-bottom:1px solid rgba(220,230,255,0.05);vertical-align:middle; }
.coupon-table tbody tr:last-child td { border-bottom:none; }
.coupon-table tbody tr:hover td { background:rgba(220,230,255,0.025); }
.ct-col-action { width:90px; }
.ct-code { font-family:'JetBrains Mono','Consolas',monospace;font-size:0.82rem;letter-spacing:0.04em;color:#c9a84c; }
.ct-reward { color:rgba(220,228,245,0.8); }
.ct-expiry { color:rgba(220,228,245,0.55);font-size:0.78rem; }
.ct-copy-btn { background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.35);color:#c9a84c;font-size:0.72rem;padding:4px 12px;border-radius:3px;cursor:pointer;font-family:inherit;letter-spacing:0.06em;transition:background 0.15s; }
.ct-copy-btn:hover { background:rgba(201,168,76,0.22); }
.coupon-eyebrow {
  display:inline-flex;align-items:center;gap:0.6rem;
  font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.62rem;font-weight:600;
  letter-spacing:0.24em;text-transform:uppercase;color:rgba(220,228,245,0.5);
  margin-bottom:0.65rem;
}
.coupon-eyebrow::before {
  content:'';width:20px;height:1px;background:var(--gold);opacity:0.7;
}
.coupon-divider {
  margin-top:1.5rem;padding-top:1.4rem;
  border-top:1px solid rgba(220,230,255,0.06);
}
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

async function redeemManual() {
  var nickname = getNickname();
  var codeEl = document.getElementById('manual-code');
  var code = codeEl ? (codeEl.value || '').trim() : '';
  if (!nickname) {
    showToast('warn', 'Nickname required', 'Enter your in-game nickname first.');
    document.getElementById('nickname').focus();
    return;
  }
  if (!code) {
    showToast('warn', 'Code required', 'Enter a code to redeem manually.');
    if (codeEl) codeEl.focus();
    return;
  }
  document.getElementById('redeem-results').style.display = 'block';
  var resultsList = document.getElementById('results-list');
  var rowId = 'r-manual-' + code.replace(/[^a-z0-9]/gi, '');
  var existing = document.getElementById(rowId);
  if (existing) existing.remove();
  var div = document.createElement('div');
  div.id = rowId;
  div.className = 'result-row';
  div.innerHTML = '<span class="result-code">' + escH(code) + '</span><span class="result-badge rb-pending">Trying...</span>';
  resultsList.prepend(div);
  var row = document.getElementById(rowId);
  var badge = row.querySelector('.result-badge');
  try {
    var result = await redeemViaProxy(nickname, code);
    if (badge) {
      badge.className = 'result-badge ' + statusClass(result.status || (result.success ? 'Success' : 'Error'));
      badge.textContent = statusLabel(result.status || (result.success ? 'Success' : 'Error'));
    }
    if (result.status !== 'Success' && result.status !== 'AlreadyUsed' && result.status !== 'IncorrectUser') renderDebug(row, result);
    toastForResult(code, result);
    if (result.success && codeEl) codeEl.value = '';
  } catch(e) {
    if (badge) { badge.className = 'result-badge rb-error'; badge.textContent = 'Error'; }
    showToast('error', code + ' - Error', e.message || 'Request failed');
  }
}

var _specialCodeUnlocked = false;
var _specialCode = '';

async function checkSpecialPasscode() {
  var passcode = (document.getElementById('special-passcode') || {}).value || '';
  if (!passcode) { setSpecialError('Enter the passcode.'); return; }
  var errEl = document.getElementById('special-passcode-error');
  if (errEl) { errEl.textContent = 'Checking...'; errEl.style.color = 'var(--text3)'; }
  try {
    var res = await fetch('/api/special-code/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: passcode }),
    });
    var data = await res.json();
    if (data.success) {
      _specialCode = data.code || '';
      var valEl = document.getElementById('special-code-value');
      if (valEl) valEl.textContent = _specialCode;
      document.getElementById('special-locked-view').style.display = 'none';
      document.getElementById('special-unlocked-view').style.display = 'block';
      _specialCodeUnlocked = true;
    } else {
      setSpecialError(data.message || 'Incorrect passcode.');
    }
  } catch(e) {
    setSpecialError('Network error. Try again.');
  }
}

function setSpecialError(msg) {
  var errEl = document.getElementById('special-passcode-error');
  if (errEl) { errEl.textContent = msg; errEl.style.color = '#e74c3c'; }
}

async function redeemSpecialCode() {
  var nickname = getNickname();
  if (!nickname) { showToast('warn', 'Nickname required', 'Enter your in-game nickname first.'); return; }
  if (!_specialCode) { showToast('error', 'No code', 'Unlock the special code first.'); return; }
  var resultEl = document.getElementById('special-redeem-result');
  if (resultEl) { resultEl.textContent = 'Redeeming...'; resultEl.style.color = 'var(--text3)'; }
  try {
    var result = await redeemViaProxy(nickname, _specialCode);
    toastForResult(_specialCode, result);
    if (resultEl) {
      resultEl.style.color = result.success ? '#2ecc71' : '#e74c3c';
      resultEl.textContent = result.message || (result.success ? 'Redeemed!' : 'Error');
    }
  } catch(e) {
    if (resultEl) { resultEl.style.color = '#e74c3c'; resultEl.textContent = 'Network error.'; }
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
  if (action === 'redeem-manual') redeemManual();
  if (action === 'check-special-passcode') checkSpecialPasscode();
  if (action === 'copy-special-code') {
    navigator.clipboard.writeText(_specialCode).then(function() {
      var orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(function() { btn.textContent = orig; }, 1500);
    });
  }
  if (action === 'redeem-special-code') redeemSpecialCode();
});

var manualInput = document.getElementById('manual-code');
if (manualInput) manualInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') redeemManual(); });

var specialInput = document.getElementById('special-passcode');
if (specialInput) specialInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') checkSpecialPasscode(); });
</script>
`, 'coupons', env, request);
}
