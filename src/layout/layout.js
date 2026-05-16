import { getStyles } from '../css/styles.js';

export async function layout(title, content, activePage = '', env = null) {
  let tapTarget = 7;
  let hasMamonir = false;
  if (env) {
    try {
      const row = await env.DB.prepare("SELECT data FROM images WHERE key='mamonir_nav'").first();
      if (row && row.data) hasMamonir = true;
    } catch {}
    try {
      const row = await env.DB.prepare("SELECT data FROM images WHERE key='mamonir_tap_count'").first();
      if (row && row.data) tapTarget = Math.max(1, parseInt(row.data, 10) || 7);
    } catch {}
  }

  const mamonirHtml = hasMamonir ? `
  <div id="mam-wrap" style="position:relative;display:inline-flex;align-items:center;margin-left:6px;cursor:pointer" title="...">
    <img id="mam-icon" src="/img/mamonir_nav" alt="" style="height:120px;width:auto;display:block;image-rendering:auto;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.7));transition:transform 0.08s ease" draggable="false">
  </div>
  <script>
  (function(){
    var KEY = 'kitsu_mamonir_taps';
    var TARGET = ${tapTarget};
    var wrap = document.getElementById('mam-wrap');
    var icon = document.getElementById('mam-icon');
    if (!wrap || !icon) return;
    if (localStorage.getItem('kitsu_set_3') === '1') { wrap.style.display='none'; return; }
    var n = parseInt(localStorage.getItem(KEY) || '0', 10);
    wrap.addEventListener('click', function(e) {
      e.preventDefault();
      n++;
      localStorage.setItem(KEY, String(n));
      icon.style.transform = 'scale(0.85)';
      setTimeout(function() { icon.style.transform = ''; }, 120);
      if (n >= TARGET) {
        localStorage.setItem('kitsu_set_3', '1');
        localStorage.removeItem(KEY);
        wrap.style.transition = 'transform 0.7s ease-in, opacity 0.7s ease-in';
        wrap.style.transformOrigin = 'top center';
        wrap.style.transform = 'translateY(80px) rotate(25deg)';
        wrap.style.opacity = '0';
        setTimeout(function() {
          wrap.style.display = 'none';
          var ov = document.createElement('div');
          ov.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.82);display:flex;align-items:center;justify-content:center;animation:fadeIn 0.3s ease';
          ov.innerHTML = '<div style="background:#13131a;border:1px solid rgba(201,168,76,0.35);border-radius:12px;padding:2rem 2.5rem;max-width:420px;width:90%;text-align:center;font-family:Cinzel,serif;box-shadow:0 8px 40px rgba(0,0,0,0.7)">'
            + '<div style="font-size:2rem;margin-bottom:0.75rem">&#127381;</div>'
            + '<div style="color:#c9a84c;font-size:1.1rem;font-weight:700;letter-spacing:0.08em;margin-bottom:0.5rem">UNLOCKED &mdash; Set K (K)</div>'
            + '<div style="color:#888;font-size:0.85rem;font-family:inherit;line-height:1.6;margin-bottom:1.25rem">The figure could not withstand your persistence.<br>This set is now yours.</div>'
            + '<button style="background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.4);color:#c9a84c;padding:8px 28px;border-radius:6px;font-size:0.9rem;cursor:pointer;font-family:Cinzel,serif" onclick="this.closest(\'div[style*=fixed]\').remove()">Close</button>'
            + '</div>';
          document.body.appendChild(ov);
          ov.addEventListener('click', function(e) { if (e.target === ov) ov.remove(); });
        }, 750);
      }
    });
  })();
  </script>` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(title)} — BnKitsu BD2 Guide</title>
<style>${getStyles()}</style>
</head>
<body>
<nav>
  <a href="/" class="nav-logo">⚔ BnKitsu</a>
  <div class="nav-links">
    <a href="/"${activePage === 'home' ? ' style="color:var(--gold)"' : ''}>Home</a>
    <a href="/guide"${activePage === 'guide' ? ' style="color:var(--gold)"' : ''}>PvP Guide</a>
    <a href="/coupons"${activePage === 'coupons' ? ' style="color:var(--gold)"' : ''}>Coupons</a>
    <a href="/emotes"${activePage === 'emotes' ? ' style="color:var(--gold)"' : ''}>Kitsu's Emotes</a>
    <a href="/characters"${activePage === 'characters' ? ' style="color:var(--gold)"' : ''}>Characters</a>
  </div>
  <div class="nav-admin" style="display:flex;align-items:center;gap:4px">
    ${mamonirHtml}
    <a href="/admin">Admin</a>
  </div>
</nav>
<main>${content}</main>
<footer>
  BnKitsu BD2 Guide — browndust2-bnkitsu.com<br>
  <span>Not affiliated with Neowiz or GAMFS. Fan-made guide.</span>
</footer>
</body>
</html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

export function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
