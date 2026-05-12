import { getStyles } from '../css/styles.js';

export function layout(title, content, activePage = '') {
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
  </div>
  <div class="nav-admin"><a href="/admin">Admin</a></div>
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
