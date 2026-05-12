export async function handleRedeem(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonErr('Invalid request body');
  }

  const { nickname, coupon_code } = body;
  if (!nickname || !coupon_code) {
    return jsonErr('Missing nickname or coupon_code');
  }

  const params = new URLSearchParams({ nickname, coupon_code });

  let upstream;
  try {
    upstream = await fetch(
      'https://redeem.bd2.pmang.cloud/bd2/coupon/use?lang=en-EN',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      }
    );
  } catch (err) {
    return jsonErr('Failed to reach redemption server');
  }

  let data;
  const text = await upstream.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  // Determine success — BD2 API returns result_code 0 on success
  const isSuccess =
    upstream.ok &&
    (data.result_code === 0 || data.result_code === '0' || data.result === 'success');

  return new Response(JSON.stringify({ ok: isSuccess, data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonErr(msg) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}
