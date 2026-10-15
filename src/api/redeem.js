import { json } from '../layout/layout.js';
import { clientIp } from '../lib/auth.js';
import { rateLimited } from '../lib/kitsu.js';

const API_ENDPOINT = 'https://loj2urwaua.execute-api.ap-northeast-1.amazonaws.com/prod/coupon';
const APP_ID = 'bd2-live';

function mapError(err) {
  switch (err) {
    case 'ValidationFailed':
    case 'InvalidCode':        return { status: 'InvalidCode',   message: 'Invalid code — please double-check the coupon code.' };
    case 'ExpiredCode':        return { status: 'ExpiredCode',   message: 'This coupon code has expired.' };
    case 'AlreadyUsed':        return { status: 'AlreadyUsed',   message: 'This coupon code has already been used.' };
    case 'ExceededUses':       return { status: 'ExpiredCode',   message: 'This coupon has exceeded its number of uses.' };
    case 'UnavailableCode':    return { status: 'InvalidCode',   message: 'Unable to use this coupon code.' };
    case 'IncorrectUser':      return { status: 'IncorrectUser', message: 'Incorrect nickname — please double-check.' };
    case 'ClaimRewardsFailed': return { status: 'Error',         message: 'Claim failed — please try again.' };
    default:                   return { status: 'Error',         message: err ? ('Error: ' + err) : 'Unknown error.' };
  }
}

// Coupon codes are short and alphanumeric; nicknames are capped to keep
// requests to the game's API small and well-formed.
const CODE_RE = /^[A-Za-z0-9_-]{3,32}$/;
const MAX_NICKNAME = 32;

export async function handleRedeem(request) {
  // Per-IP limit so this endpoint can't be used to mass-guess codes against
  // the game's coupon API. Redeeming every listed code at once fits easily.
  if (rateLimited(clientIp(request), 'redeem', 20)) {
    return json({ success: false, status: 'Error', message: 'Too many redeem attempts. Wait a minute and try again.' }, 429);
  }

  let body;
  try { body = await request.json(); } catch { return json({ success: false, status: 'Error', message: 'Invalid request body.' }, 400); }

  const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : '';
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!nickname || !code) return json({ success: false, status: 'Error', message: 'Missing nickname or code.' });
  if (nickname.length > MAX_NICKNAME) return json({ success: false, status: 'IncorrectUser', message: 'Nickname is too long.' }, 400);
  if (!CODE_RE.test(code)) return json({ success: false, status: 'InvalidCode', message: 'Invalid code format: use letters and numbers only.' }, 400);

  let res, text;
  try {
    res = await fetch(API_ENDPOINT, {
      method: 'POST',
      // The coupon API only accepts requests that carry the official redeem
      // page's Origin/Referer and a browser User-Agent, so these are sent as
      // that page would send them. The rate limit above keeps this endpoint
      // from being used for anything beyond normal redeeming.
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://redeem.bd2.pmang.cloud',
        'Referer': 'https://redeem.bd2.pmang.cloud/bd2/index.html?lang=en-EN',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ appId: APP_ID, userId: nickname, code }),
    });
    text = await res.text();
  } catch (e) {
    return json({ success: false, status: 'NetworkError', message: 'Network error: ' + e.message });
  }

  let data = null;
  try { data = JSON.parse(text); } catch {}

  if (!data || typeof data !== 'object') {
    return json({
      success: false,
      status: 'Error',
      message: 'Unexpected response (not JSON)',
      http: res.status,
      raw: (text || '').substring(0, 400),
    });
  }

  if (data.success) {
    return json({
      success: true,
      status: 'Success',
      message: 'Redeemed successfully! Check your in-game mailbox.',
      http: res.status,
    });
  }

  const mapped = mapError(data.error);
  return json({
    success: false,
    ...mapped,
    http: res.status,
    raw: (text || '').substring(0, 400),
  });
}
