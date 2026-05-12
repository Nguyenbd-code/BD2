import { layout, esc } from '../layout/layout.js';

export async function handleEmotes(request, env) {
  let emotes = [];
  try {
    const res = await env.DB.prepare('SELECT * FROM emotes ORDER BY created_at DESC').all();
    emotes = res.results || [];
  } catch(e) {}

  const emoteCards = emotes.length
    ? emotes.map(e => `
<div class="emote-card">
  <img src="${esc(e.image_url)}" alt="${esc(e.name)}" loading="lazy">
  <div class="emote-name">${esc(e.name)}</div>
  <a href="${esc(e.image_url)}" download="${esc(e.name)}" class="emote-dl">Download</a>
</div>`).join('')
    : `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text3)">
        <div style="font-size:1.5rem;margin-bottom:0.75rem">🎭</div>
        Emotes coming soon!
       </div>`;

  return layout("Kitsu's Emotes", `
<div class="hero" style="padding-bottom:2rem">
  <div class="hero-tag">Custom Emotes</div>
  <h1>Kitsu's <span>Emotes</span></h1>
  <p>Custom emotes made by BnKitsu for the BD2 community — free to download</p>
</div>

<div id="emote-locked" style="text-align:center;padding:4rem 2rem">
  <div style="font-size:3rem;margin-bottom:1rem">🔒</div>
  <div style="font-size:1rem;color:var(--text2);font-weight:600">Find the secret to unlock</div>
</div>

<div id="emote-grid-wrap" style="display:none">
  <div class="emote-grid">${emoteCards}</div>
</div>

<script>
(function() {
  if (localStorage.getItem('kitsu_unlocked') === 'true') {
    document.getElementById('emote-locked').style.display = 'none';
    document.getElementById('emote-grid-wrap').style.display = '';
  }
})();
</script>
`, 'emotes');
}
