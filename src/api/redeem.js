import { json } from '../layout/layout.js';

// Map pmang result_code numbers to friendly status strings
function parseResult(data, statusCode) {
  const rc  = data.result_code ?? data.resultCode ?? data.code ?? null;
  const msg = String(data.message || data.msg || data.result || '').toLowerCase();
  const res = String(data.result || '');

  // Explicit success
  if (res === 'SUCCESS' || res === 'Success' || rc === 0 || msg.includes('success')) {
    return { status: 'Success', message: 'Redeemed successfully!' };
  }

  // Already used / duplicate
  if (rc === 4 || msg.includes('already') || msg.includes('duplicate') || msg.includes('used')) {
    return { status: 'AlreadyUsed', message: 'Code already used on this account' };
  }

  // Expired code
  if (rc === 3 || msg.includes('expir')) {
    return { status: 'ExpiredCode', message: 'Code has expired' };
  }

  // Invalid code
  if (rc === 2 || msg.includes('invalid') || msg.includes('not found') || msg.includes('wrong code')) {
    return { status: 'InvalidCode', message: 'Invalid code' };
  }

  // User not found / wrong nickname
  if (rc === 1 || msg.includes('user') || msg.includes('nickname') || msg.includes('character')) {
    return { status: 'IncorrectUser', message: 'Nickname not found — check your in-game name' };
  }

  // Unknown
  const raw = String(data.message || data.msg || data.result || JSON.stringify(data)).substring(0, 120);
  return { status: 'Error', message: raw || `HTTP ${statusCode}` };
}

export async function handleRedeem(request) {
  let body;
  try { body = await request.json(); } catch { return json({ success: false, status: 'Error', message: 'Invalid request body.' }, 400); }

  const { nickname, code } = body;
  if (!nickname || !code) return json({ success: false, status: 'Error', message: 'Missing nickname or code.' });

  let rawText = '';
  let statusCode = 0;
  try {
    const res = await fetch('https://redeem.bd2.pmang.cloud/bd2/coupon/use', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://redeem.bd2.pmang.cloud',
        'Referer': 'https://redeem.bd2.pmang.cloud/bd2/index.html?lang=en-EN',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      body: new URLSearchParams({ nickname, coupon_code: code }).toString(),
    });

    statusCode = res.status;
    rawText    = await res.text();

    let data;
    try { data = JSON.parse(rawText); } catch { data = {}; }

    const result = parseResult(data, statusCode);
    const success = result.status === 'Success';
    if (!success && result.status === 'Error') {
      result.message = `HTTP ${statusCode}: ${(rawText || '(empty)').substring(0, 200)}`;
    }
    return json({ success, ...result, http: statusCode, raw: rawText.substring(0, 300) });

  } catch(e) {
    return json({
      success: false,
      status: 'NetworkError',
      message: 'Network error: ' + e.message,
    });
  }
}
