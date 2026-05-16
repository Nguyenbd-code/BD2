import { FALLBACKS } from './image_fallbacks.js';

export async function handleImage(request, env) {
  const url = new URL(request.url);
  const key = url.pathname.slice(5); // strip /img/

  if (!key) return new Response('Not Found', { status: 404 });

  let row;
  try {
    row = await env.DB.prepare('SELECT data FROM images WHERE key = ?')
      .bind(key)
      .first();
  } catch {
    row = null;
  }

  if (!row || !row.data) {
    const fb = FALLBACKS[key];
    if (fb) {
      const body = fb.text != null ? fb.text : fb.bytes().buffer;
      return new Response(body, {
        headers: {
          'Content-Type': fb.mime,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
    return new Response('Not Found', { status: 404 });
  }

  const dataUrl = row.data;

  // Extract MIME type and base64 payload from data URL
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return new Response('Invalid image data', { status: 500 });

  const [, mimeType, b64] = match;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Response(bytes.buffer, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
}
