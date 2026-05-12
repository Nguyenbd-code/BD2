import { json } from '../layout/layout.js';

export async function handleRedeem(request) {
  let body;
  try { body = await request.json(); } catch { return json({ success: false, message: 'Invalid request body.' }, 400); }

  const { nickname, code } = body;
  if (!nickname || !code) return json({ success: false, message: 'Missing nickname or code.' });

  let rawText = '';
  try {
    const res = await fetch('https://redeem.bd2.pmang.cloud/bd2/coupon/use?lang=en-EN', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://redeem.bd2.pmang.cloud',
        'Referer': 'https://redeem.bd2.pmang.cloud/bd2/index.html?lang=en-EN',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: new URLSearchParams({ nickname, coupon_code: code }).toString(),
    });

    rawText = await res.text();
    let data;
    try { data = JSON.parse(rawText); } catch { data = {}; }

    const rc  = data.result_code ?? data.resultCode ?? data.code ?? null;
    const msg = String(data.message || data.msg || data.result || '').toLowerCase();

    // Success
    if (data.result === 'SUCCESS' || rc === 0 || msg.includes('success')) {
      return json({ success: true, message: 'Success' });
    }
    // Already used / expired
    if (rc === 4 || msg.includes('already') || msg.includes('used') || msg.includes('expired')) {
      return json({ success: false, already_used: true, message: 'Already Used' });
    }
    // Any other failure — return raw response for debugging
    return json({ success: false, message: rawText.substring(0, 200) });

  } catch(e) {
    return json({ success: false, message: 'Error connecting to BD2 servers: ' + e.message + (rawText ? ' | raw: ' + rawText.substring(0, 100) : '') });
  }
}
