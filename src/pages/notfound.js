import { layout, esc } from '../layout/layout.js';

export async function handleNotFound(request, env) {
  const url = new URL(request.url);
  const wanted = url.pathname;

  const html = await layout('Page Not Found', `
<div class="hero" style="padding-bottom:2rem">
  <div class="hero-tag">404 · Path Unknown</div>
  <h1>This Page <span>Slipped Away</span></h1>
  <p>The route <code class="nf-path">${esc(wanted)}</code> isn't on the codex.</p>
</div>

<div class="codex-card nf-card">
  <p class="nf-lead">A few places worth wandering instead:</p>
  <div class="nf-links">
    <a class="nf-link" href="/">
      <span class="nf-link-label">Home</span>
      <span class="nf-link-sub">Tier overview and strategy notes</span>
    </a>
    <a class="nf-link" href="/guide">
      <span class="nf-link-label">PvP Guide</span>
      <span class="nf-link-sub">Compositions by tier and role</span>
    </a>
    <a class="nf-link" href="/coupons">
      <span class="nf-link-label">Coupons</span>
      <span class="nf-link-sub">Auto-redeem active codes</span>
    </a>
    <a class="nf-link" href="/characters">
      <span class="nf-link-label">Characters</span>
      <span class="nf-link-sub">Roster reference</span>
    </a>
  </div>
</div>
`, '', env, request);

  return new Response(html, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
