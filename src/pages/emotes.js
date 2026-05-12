import { layout, escHtml } from '../layout/layout.js';

export async function handleEmotes(request, env) {
  let emotes = [];
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, name, url FROM emotes ORDER BY id DESC'
    ).all();
    emotes = results;
  } catch { /* empty */ }

  const emoteCards = emotes.length
    ? emotes.map(e => `
<div class="emote-card">
  <img src="${escHtml(e.url)}" alt="${escHtml(e.name)}" loading="lazy">
  <div class="emote-card-name">${escHtml(e.name)}</div>
  <a href="${escHtml(e.url)}" download="${escHtml(e.name)}" class="emote-download">
    ↓ Download
  </a>
</div>`).join('')
    : '<p style="color:var(--text3);font-size:0.85rem">No emotes available yet.</p>';

  const content = `
<div class="container">
  <h1 class="page-title">Custom Emotes</h1>
  <p class="page-subtitle">Download custom emotes for use in Brown Dust 2 chat.</p>
  <div class="emote-grid">
    ${emoteCards}
  </div>
</div>`;

  return layout('Emotes', content);
}
