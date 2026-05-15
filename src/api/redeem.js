import { json } from '../layout/layout.js';

// Parse the pmang response into a status string used by the UI
function parseResult(data, statusCode, rawText) {
  // Numeric result code in various property names
  const rc  = data.result_code ?? data.resultCode ?? data.code ?? data.errorCode ?? null;
  const msgRaw = String(data.message || data.msg || data.result || data.error || '').trim();
  const msg = msgRaw.toLowerCase();
  const res = String(data.result || data.status || '').toLowerCase();

  if (res === 'success' || rc === 0 || rc === '0' || msg.includes('success') || msg.includes('redeem') && msg.includes('complete')) {
    return { status: 'Success', message: 'Redeemed successfully!' };
  }
  if (rc === 4 || rc === '4' || msg.includes('already') || msg.includes('duplicate') || msg.includes('used')) {
    return { status: 'AlreadyUsed', message: 'Code already used on this account' };
  }
  if (rc === 3 || rc === '3' || msg.includes('expir') || msg.includes('ended')) {
    return { status: 'ExpiredCode', message: 'Code has expired' };
  }
  if (rc === 2 || rc === '2' || msg.includes('invalid') || msg.includes('not found') || msg.includes('wrong code') || msg.includes('does not exist')) {
    return { status: 'InvalidCode', message: 'Invalid code' };
  }
  if (rc === 1 || rc === '1' || msg.includes('user') || msg.includes('nickname') || msg.includes('character') || msg.includes('player')) {
    return { status: 'IncorrectUser', message: 'Nickname not found — check your in-game name' };
  }

  // Unknown — bubble the raw text up
  const snippet = (msgRaw || rawText || '').substring(0, 180);
  return { status: 'Error', message: snippet || `HTTP ${statusCode} (empty response)` };
}

async function tryEndpoint(url, nickname, code, asJson) {
  const headers = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://redeem.bd2.pmang.cloud',
    'Referer': 'https://redeem.bd2.pmang.cloud/bd2/index.html?lang=en-EN',
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  };
  let body;
  if (asJson) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({ nickname, coupon_code: code, code });
  } else {
    headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
    body = new URLSearchParams({ nickname, coupon_code: code }).toString();
  }
  const res = await fetch(url, { method: 'POST', headers, body });
  const text = await res.text();
  return { status: res.status, text, ct: res.headers.get('content-type') || '' };
}

export async function handleRedeem(request) {
  let body;
  try { body = await request.json(); } catch { return json({ success: false, status: 'Error', message: 'Invalid request body.' }, 400); }

  const { nickname, code } = body;
  if (!nickname || !code) return json({ success: false, status: 'Error', message: 'Missing nickname or code.' });

  // Try the primary endpoint first; if it returns HTML / empty / non-2xx, attempt alternates so we can see which works.
  const candidates = [
    { url: 'https://redeem.bd2.pmang.cloud/bd2/coupon/use',  asJson: false, label: 'form' },
    { url: 'https://redeem.bd2.pmang.cloud/bd2/coupon/use',  asJson: true,  label: 'json' },
    { url: 'https://redeem.bd2.pmang.cloud/bd2/coupons/use', asJson: false, label: 'form-plural' },
  ];

  const attempts = [];
  let chosen = null;

  for (const c of candidates) {
    try {
      const r = await tryEndpoint(c.url, nickname, code, c.asJson);
      attempts.push({ label: c.label, status: r.status, ct: r.ct, snippet: (r.text || '').substring(0, 200) });
      // Pick first attempt whose body parses as JSON (regardless of result_code)
      let parsed = null;
      try { parsed = JSON.parse(r.text); } catch {}
      if (parsed && typeof parsed === 'object') { chosen = { ...c, ...r, parsed }; break; }
      // Or first attempt that's a 2xx, even if non-JSON
      if (!chosen && r.status >= 200 && r.status < 300 && r.text) { chosen = { ...c, ...r, parsed: {} }; }
    } catch (e) {
      attempts.push({ label: c.label, status: 0, snippet: 'network: ' + e.message });
    }
  }

  if (!chosen) {
    return json({
      success: false,
      status: 'Error',
      message: 'All endpoints failed. See debug.',
      debug: attempts,
    });
  }

  const result = parseResult(chosen.parsed, chosen.status, chosen.text);
  const success = result.status === 'Success';
  return json({
    success,
    ...result,
    http: chosen.status,
    via: chosen.label,
    raw: (chosen.text || '').substring(0, 400),
    debug: attempts,
  });
}
