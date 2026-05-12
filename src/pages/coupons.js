import { layout, escHtml } from '../layout/layout.js';

export async function handleCoupons(request, env) {
  let coupons = [];
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, code, rewards, expiry FROM coupons ORDER BY id DESC'
    ).all();
    coupons = results;
  } catch { /* empty */ }

  const couponRows = coupons.length
    ? coupons.map(c => `
<div class="coupon-item" data-id="${c.id}">
  <div>
    <div class="coupon-code">${escHtml(c.code)}</div>
    ${c.rewards ? `<div class="coupon-rewards">${escHtml(c.rewards)}</div>` : ''}
    ${c.expiry ? `<div class="coupon-expiry">Expires: ${escHtml(c.expiry)}</div>` : ''}
  </div>
</div>`).join('')
    : '<p style="color:var(--text3);font-size:0.85rem">No active coupons.</p>';

  const content = `
<div class="container">
  <h1 class="page-title">Coupon Codes</h1>
  <p class="page-subtitle">Enter your in-game nickname below to redeem all active codes at once.</p>

  <div class="card" style="margin-bottom:1.5rem">
    <div style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:flex-end">
      <label style="display:flex;flex-direction:column;gap:0.25rem;font-size:0.8rem;color:var(--text3);font-weight:600;flex:1;min-width:180px">
        In-Game Nickname
        <input type="text" id="nickname" placeholder="Your BD2 nickname"
               style="background:var(--bg3);border:1px solid var(--border);color:var(--text);
                      padding:0.6rem 1rem;border-radius:6px;font-family:'Nunito',sans-serif;font-size:0.9rem">
      </label>
      <button class="btn btn-primary" onclick="redeemAll()">Redeem All Codes</button>
    </div>
    <div id="redeem-status" style="margin-top:0.75rem"></div>
  </div>

  <div class="card">
    <h2 style="font-family:'Cinzel',serif;font-size:1rem;color:var(--gold);margin-bottom:1rem">Active Codes</h2>
    <div class="coupon-list" id="coupon-list">
      ${couponRows}
    </div>
  </div>
</div>

<script>
const codes = ${JSON.stringify(coupons.map(c => c.code))};

async function redeemAll() {
  const nickname = document.getElementById('nickname').value.trim();
  const statusEl = document.getElementById('redeem-status');
  if (!nickname) {
    statusEl.innerHTML = '<div class="redeem-result error">Please enter your nickname.</div>';
    return;
  }
  if (!codes.length) {
    statusEl.innerHTML = '<div class="redeem-result error">No codes to redeem.</div>';
    return;
  }
  statusEl.innerHTML = '<div class="redeem-result" style="color:var(--text2)">Redeeming ' + codes.length + ' code(s)…</div>';

  const results = [];
  for (const code of codes) {
    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, coupon_code: code }),
      });
      const data = await res.json();
      results.push({ code, ok: data.ok, msg: data.data?.result_message || (data.ok ? 'Success' : 'Failed') });
    } catch {
      results.push({ code, ok: false, msg: 'Network error' });
    }
  }

  const html = results.map(r =>
    '<div class="redeem-result ' + (r.ok ? 'success' : 'error') + '">' +
    '<strong>' + escHtml(r.code) + '</strong> — ' + escHtml(r.msg) + '</div>'
  ).join('');
  statusEl.innerHTML = html;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
</script>`;

  return layout('Coupons', content);
}
