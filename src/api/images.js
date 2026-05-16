const FALLBACK_SVGS = {
  element_physical: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33.26 33.26"><path fill="#95A5A6" d="M4.07,31.28H2.69c-.49,0-.7-.21-.7-.71q0-1.37,0-2.73c0-.45.2-.61.63-.46a1.7,1.7,0,0,0,1.9-.45l3-3a.64.64,0,0,0,.13-1q-1.89-3.51-3.79-7a.42.42,0,0,1,.08-.56l2.15-2.19c.17-.18.24-.17.37.06l2.22,4,.09.15a.51.51,0,0,0,.86.16l1.07-.91c2.08-1.78,4.17-3.55,6.25-5.34s4-3.45,6-5.2a15,15,0,0,1,4.11-2.49L31,2a.64.64,0,0,1,.28,0,.88.88,0,0,1,0,.28c-.25.68-.48,1.36-.76,2C30,5.4,29.56,6.5,29,7.57a14.74,14.74,0,0,1-2.26,3.28l-3.19,3.63-3.85,4.46-4.09,4.8c-.27.32-.22.53.15.74l4.08,2.27c.34.19.35.32.08.58l-2,1.91a.58.58,0,0,1-.79.11l-4.05-2.19-2.9-1.58a.67.67,0,0,0-.92.14c-1,1-2,2-3,3.06a1.66,1.66,0,0,0-.43,1.8c.18.55.05.7-.52.7C4.91,31.27,4.49,31.28,4.07,31.28Zm7.42-9.19a1.37,1.37,0,0,0,.25-.15c1.35-1.35,2.69-2.7,4-4l3.75-3.75c.37-.37.74-.73,1.1-1.11a.41.41,0,0,0,.08-.35.37.37,0,0,0-.3-.16c-.08,0-.18.09-.25.17l-8.77,8.76c-.05.05-.12.1-.14.17a.36.36,0,0,0,0,.27A.78.78,0,0,0,11.49,22.09Z"/></svg>',
  element_magic: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33.26 33.26"><path fill="#16A085" d="M30.87,10.75l-.09,5.57c0,.58,0,1.16,0,1.74s-.2.8-.8.83l-4.48.25-6.26.34c-.5,0-.65.19-.66.69s0,1-.07,1.5a.7.7,0,0,1-.74.72l-4.43.05c-.56,0-.71.16-.72.72,0,.27,0,.54,0,.81a1,1,0,0,1-.47.86L8.44,27.28,4.1,30.16c-.51.34-.75.27-1.06-.26a3.33,3.33,0,0,0-.49-.63c-.32-.34-.33-.48,0-.8,2-2,4-4,6-5.93a1.48,1.48,0,0,0,.49-1.42c-.12-.7-.18-1.42-.27-2.13,0-.35.06-.49.42-.52L13,18.18c.37,0,.49-.15.45-.52-.09-.83-.19-1.67-.29-2.51l0-.28a.57.57,0,0,1,.6-.69l2.53-.1,4.38-.17,4.76-.18h.18c.27,0,.36-.13.36-.4,0-.88,0-1.76,0-2.64,0-1.09,0-2.18-.05-3.27,0-.22-.08-.29-.3-.29l-6.2,0a1.09,1.09,0,0,0-.26,0c-.27,0-.37.14-.38.41s0,.75,0,1.12,0,.77,0,1.16a.53.53,0,0,1-.55.62l-1.89.23a.49.49,0,0,1-.62-.49c-.12-1.09-.22-2.18-.32-3.27-.09-.89-.17-1.79-.26-2.68a1.94,1.94,0,0,1,0-.24.45.45,0,0,1,.47-.51l3.64-.14,5-.2,4-.15,2.24-.09c.46,0,.55.08.55.54q0,3.06-.07,6.12c0,.4,0,.79,0,1.19Z"/></svg>',
};

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
    if (FALLBACK_SVGS[key]) {
      return new Response(FALLBACK_SVGS[key], {
        headers: {
          'Content-Type': 'image/svg+xml',
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
