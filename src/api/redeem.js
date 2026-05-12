import { json } from '../layout/layout.js';

export async function handleRedeem(request) {
  let body;
  try { body = await request.json(); } catch { return json({ success: false, message: 'Invalid request body.' }, 400); }

  const { nickname, code } = body;
  if (!nickname || !code) return json({ success: false, message: 'Missing nickname or code.' });

  let rawText = '';
  let statusCode = 0;
  try {
    const res = await fetch('https://redeem.bd2.pmang.cloud/bd2/coupon/use', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '*/*',
        'Origin': 'https://redeem.bd2.pmang.cloud',
        'Referer': 'https://redeem.bd2.pmang.cloud/bd2/index.html?lang=en-EN',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      body: new URLSearchParams({ nickname, coupon_code: code }).toString(),
    });

    statusCode = res.status;
    rawText = await res.text();

    let data;
    try { data = JSON.parse(rawText); } catch { data = {}; }

    const rc  = data.result_code ?? data.resultCode ?? data.code ?? null;
    const msg = String(data.message || data.msg || data.result || '').toLowerCase();

    if (data.result === 'SUCCESS' || rc === 0 || msg.includes('success')) {
      return json({ success: true, message: 'Success' });
    }
    if (rc === 4 || msg.includes('already') || msg.includes('used') || msg.includes('expired')) {
      return json({ success: false, already_used: true, message: 'Already Used' });
    }

    const cleanMsg = rawText.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 80);
    return json({ success: false, message: 'Status: ' + statusCode + ' | ' + (cleanMsg || rawText.substring(0, 200)) });

  } catch(e) {
    return json({ success: false, message: 'Error: ' + e.message + (rawText ? ' | Status: ' + statusCode + ' | ' + rawText.replace(/<[^>]*>/g,'').trim().substring(0, 80) : '') });
  }
}
