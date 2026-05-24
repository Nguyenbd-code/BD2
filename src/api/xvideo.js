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

function parsePathParts(url, expectedPrefix) {
  const parts = url.pathname.split('/').filter(Boolean);
  // /api/<prefix>/{user}/{id}
  if (parts.length < 4) return null;
  if (parts[1] !== expectedPrefix) return null;
  const username = parts[2];
  const id = parts[3];
  if (!/^[A-Za-z0-9_]{1,20}$/.test(username)) return null;
  if (!/^\d{1,25}$/.test(id)) return null;
  return { username, id };
}

async function fetchTweet(username, id) {
  const apiRes = await fetch(`${FX_BASE}/${encodeURIComponent(username)}/status/${encodeURIComponent(id)}`, {
    headers: { 'User-Agent': 'browndust2-bnkitsu/1.0' },
  });
  if (!apiRes.ok) return null;
  const data = await apiRes.json();
  if (!data || data.code !== 200 || !data.tweet) return null;
  return data.tweet;
}

async function proxyMedia(upstreamUrl, request, fallbackType) {
  let target;
  try { target = new URL(upstreamUrl); } catch { return new Response('Bad upstream URL', { status: 502 }); }
  if (!ALLOWED_HOSTS.has(target.host)) return new Response('Upstream not allowed', { status: 502 });

  const upstreamHeaders = { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://twitter.com/' };
  const range = request.headers.get('Range');
  if (range) upstreamHeaders['Range'] = range;

  let upstream;
  try {
    upstream = await fetch(upstreamUrl, { headers: upstreamHeaders });
  } catch (e) {
    return new Response('Upstream fetch failed: ' + (e.message || 'unknown'), { status: 502 });
  }

  const headers = new Headers();
  const passthrough = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified'];
  for (const h of passthrough) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  if (!headers.get('content-type')) headers.set('content-type', fallbackType);
  headers.set('cache-control', 'public, max-age=86400, immutable');

  return new Response(upstream.body, { status: upstream.status, headers });
}

export async function handleXVideo(request) {
  const url = new URL(request.url);
  const parsed = parsePathParts(url, 'x-video');
  if (!parsed) return new Response('Bad path', { status: 400 });

  let tweet;
  try { tweet = await fetchTweet(parsed.username, parsed.id); }
  catch (e) { return new Response('Tweet fetch error: ' + (e.message || 'unknown'), { status: 502 }); }
  if (!tweet) return new Response('Tweet unavailable', { status: 404 });

  const videoMeta = tweet.media && tweet.media.videos && tweet.media.videos[0];
  if (!videoMeta) return new Response('No video on tweet', { status: 404 });
  const mp4Url = pickMp4Url(videoMeta);
  if (!mp4Url) return new Response('No MP4 variant', { status: 404 });

  return proxyMedia(mp4Url, request, 'video/mp4');
}

export async function handleXThumb(request) {
  const url = new URL(request.url);
  const parsed = parsePathParts(url, 'x-thumb');
  if (!parsed) return new Response('Bad path', { status: 400 });

  let tweet;
  try { tweet = await fetchTweet(parsed.username, parsed.id); }
  catch (e) { return new Response('Tweet fetch error: ' + (e.message || 'unknown'), { status: 502 }); }
  if (!tweet) return new Response('Tweet unavailable', { status: 404 });

  const media = tweet.media || {};
  const video = (media.videos && media.videos[0]) || null;
  const photo = (media.photos && media.photos[0]) || null;
  const all   = media.all && media.all[0];

  const thumbUrl =
    (video && (video.thumbnail_url || video.preview_image_url)) ||
    (photo && photo.url) ||
    (all   && (all.thumbnail_url || all.url)) ||
    '';

  if (!thumbUrl) return new Response('No thumbnail', { status: 404 });
  return proxyMedia(thumbUrl, request, 'image/jpeg');
}
