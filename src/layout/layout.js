import { getStyles } from '../css/styles.js';

export function layout(title, content, opts = {}) {
  const { extraHead = '', bodyClass = '' } = opts;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${escHtml(title)} — BnKitsu BD2 PvP Guide</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
<style>${getStyles()}</style>
${extraHead}
</head>
<body${bodyClass ? ` class="${escHtml(bodyClass)}"` : ''}>
<nav class="site-nav">
  <a href="/" class="nav-brand">BnKitsu</a>
  <div class="nav-links">
    <a href="/">Home</a>
    <a href="/guide">Guide</a>
    <a href="/coupons">Coupons</a>
    <a href="/emotes">Emotes</a>
  </div>
</nav>
${content}
</body>
</html>`;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

export function escHtml(str) {
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
