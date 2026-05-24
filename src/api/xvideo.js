const FX_BASE = 'https://api.fxtwitter.com';
const ALLOWED_HOSTS = new Set(['video.twimg.com', 'pbs.twimg.com']);

function pickMp4Url(video) {
  const variants = (video && video.variants) || [];
  const mp4s = variants
    .filter(v => {
      const ct = (v.content_type || '').toLowerCase();
      const u = (v.url || '').toLowerCase();
      return ct === 'video/mp4' || /\.mp4(?:$|\?)/.test(u);
    })
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
  if (mp4s.length) return mp4s[0].url;
  const url = (video && video.url) || '';
  if (!url || /\.m3u8(?:$|\?)/i.test(url)) return '';
  return url;
}

export async function handleXVideo(request) {
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  // /api/x-video/{user}/{id}
  if (parts.length < 4) return new Response('Bad path', { status: 400 });
  const username = parts[2];
  const id = parts[3];
  if (!/^[A-Za-z0-9_]{1,20}$/.test(username)) return new Response('Bad user', { status: 400 });
  if (!/^\d{1,25}$/.test(id)) return new Response('Bad id', { status: 400 });

  let apiData;
  try {
    const apiRes = await fetch(`${FX_BASE}/${encodeURIComponent(username)}/status/${encodeURIComponent(id)}`, {
      headers: { 'User-Agent': 'browndust2-bnkitsu/1.0' },
    });
    if (!apiRes.ok) return new Response('Tweet fetch failed', { status: 502 });
    apiData = await apiRes.json();
  } catch (e) {
    return new Response('Tweet fetch error: ' + (e.message || 'unknown'), { status: 502 });
  }

  const tw = apiData && apiData.tweet;
  if (!tw || apiData.code !== 200) return new Response('Tweet unavailable', { status: 404 });

  const videoMeta = tw.media && tw.media.videos && tw.media.videos[0];
  if (!videoMeta) return new Response('No video on tweet', { status: 404 });
  const mp4Url = pickMp4Url(videoMeta);
  if (!mp4Url) return new Response('No MP4 variant', { status: 404 });

  let target;
  try { target = new URL(mp4Url); } catch { return new Response('Bad upstream URL', { status: 502 }); }
  if (!ALLOWED_HOSTS.has(target.host)) return new Response('Upstream not allowed', { status: 502 });

  const upstreamHeaders = { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://twitter.com/' };
  const range = request.headers.get('Range');
  if (range) upstreamHeaders['Range'] = range;

  let upstream;
  try {
    upstream = await fetch(mp4Url, { headers: upstreamHeaders });
  } catch (e) {
    return new Response('Upstream fetch failed: ' + (e.message || 'unknown'), { status: 502 });
  }

  const headers = new Headers();
  const passthrough = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified'];
  for (const h of passthrough) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  if (!headers.get('content-type')) headers.set('content-type', 'video/mp4');
  headers.set('cache-control', 'public, max-age=86400, immutable');

  return new Response(upstream.body, { status: upstream.status, headers });
}
