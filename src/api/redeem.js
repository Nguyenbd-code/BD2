import { json } from '../layout/layout.js';

export async function handleRedeem(request) {
  let body;
  try { body = await request.json(); } catch { return json({ success:false, message:'Invalid request body.' }, 400); }

  const { nickname, code } = body;
  if (!nickname || !code) return json({ success:false, message:'Missing nickname or code.' });

  try {
    const res = await fetch('https://redeem.bd2.pmang.cloud/bd2/coupon/use?lang=en-EN', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://redeem.bd2.pmang.cloud',
        'Referer': 'https://redeem.bd2.pmang.cloud/bd2/index.html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: new URLSearchParams({ nickname, coupon_code: code }).toString(),
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { result: text }; }

    const msg = (data.message || data.msg || data.result || data.resultCode || '').toString().toLowerCase();

    if (data.result === 'SUCCESS' || data.code === 0 || data.resultCode === 0 || msg.includes('success')) {
      return json({ success:true, message:'Success' });
    }
    if (msg.includes('already') || msg.includes('used') || data.code === 4 || data.resultCode === 4) {
      return json({ success:false, already_used:true, message:'Already Used' });
    }
    const errMsg = (data.message || data.msg || data.result || '').toString().substring(0, 120);
    return json({ success:false, message: errMsg || `BD2 responded: ${text.substring(0, 120)}` });
  } catch(e) {
    return json({ success:false, message:'Error connecting to BD2 servers: ' + e.message });
  }
}
