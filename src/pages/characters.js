import { layout, esc } from '../layout/layout.js';

export async function handleCharacters(request, env) {
  let chars = [];
  const costumesMap = {};

  try {
    const r = await env.DB.prepare('SELECT * FROM char_registry ORDER BY name').all();
    chars = r.results || [];
    if (chars.length) {
      const cr = await env.DB.prepare('SELECT * FROM char_costumes ORDER BY char_slug, id').all();
      for (const c of (cr.results || [])) {
        if (!costumesMap[c.char_slug]) costumesMap[c.char_slug] = [];
        costumesMap[c.char_slug].push(c);
      }
    }
  } catch { /* ignore */ }

  const elemColors = { Light:'#F4D03F', Dark:'#8E44AD', Water:'#2E86C1', Wind:'#27AE60', Fire:'#C0392B' };

  const cardHtml = chars.map(char => {
    const costumes = costumesMap[char.slug] || [];
    const slug = char.slug;
    const elemColor = elemColors[char.element] || '#888';
    const costumeOpts = costumes.map(c =>
      `<option value="${esc(c.costume_slug)}">${esc(c.costume_name)}</option>`
    ).join('');

    return `<div class="char-page-card">
  <div style="position:relative;height:220px;background:var(--bg4);overflow:hidden;border-radius:6px 6px 0 0">
    <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Cinzel',serif;font-size:3rem;color:var(--bg3);font-weight:700;z-index:0;pointer-events:none">${esc(char.name.charAt(0))}</span>
    <img src="/img/char_${esc(slug)}_portrait" class="img-err-hide char-portrait-img" id="cp-portrait-${esc(slug)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1">
    <img src="" class="img-err-hide" id="cp-costume-${esc(slug)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:2;display:none">
  </div>
  <div style="padding:0.75rem">
    <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.2rem">
      <span style="width:8px;height:8px;border-radius:50%;background:${elemColor};flex-shrink:0;display:inline-block"></span>
      <div style="font-family:'Cinzel',serif;font-weight:700;font-size:0.95rem;color:var(--text)">${esc(char.name)}</div>
      ${char.status === 'upcoming' ? '<span style="font-size:0.65rem;color:var(--gold);margin-left:auto">Upcoming</span>' : ''}
    </div>
    <div style="font-size:0.7rem;color:var(--text3);margin-bottom:0.6rem">${esc(char.element || '')}</div>
    ${costumes.length
      ? `<select class="char-costume-picker" data-slug="${esc(slug)}" style="width:100%;background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:5px 8px;border-radius:4px;font-size:0.78rem">
          <option value="">Base Portrait</option>
          ${costumeOpts}
        </select>
        <div style="font-size:0.68rem;color:var(--text3);margin-top:0.35rem">${costumes.length} costume${costumes.length !== 1 ? 's' : ''}</div>`
      : '<div style="font-size:0.72rem;color:var(--text3)">No costumes yet</div>'
    }
  </div>
</div>`;
  }).join('');

  return layout('Characters', `
<div style="max-width:1200px;margin:0 auto;padding:2rem 1.5rem">
  <h1 style="font-family:'Cinzel',serif;color:var(--gold);font-size:1.8rem;margin-bottom:0.5rem">Characters</h1>
  <div style="width:40px;height:2px;background:var(--gold);margin-bottom:0.5rem;opacity:0.5"></div>
  <p style="color:var(--text3);font-size:0.85rem;margin-bottom:2rem">PvP characters and costumes. Select a costume from the dropdown to preview its portrait.</p>

  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem">
    ${cardHtml}
    <div class="char-page-card" style="opacity:0.55">
      <div style="height:220px;background:var(--bg4);border-radius:6px 6px 0 0;display:flex;align-items:center;justify-content:center">
        <span style="font-size:2.5rem">⏳</span>
      </div>
      <div style="padding:0.75rem">
        <div style="font-family:'Cinzel',serif;font-weight:700;font-size:0.95rem;color:var(--text);margin-bottom:0.2rem">Coming Soon</div>
        <div style="font-size:0.72rem;color:var(--text3)">More characters being added</div>
      </div>
    </div>
  </div>
</div>

<style>
.char-page-card {
  background: var(--bg2);
  border: 1px solid var(--border2);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s, transform 0.15s;
}
.char-page-card:hover {
  border-color: rgba(201,168,76,0.4);
  transform: translateY(-2px);
}
</style>

<script>
document.addEventListener('error', function(e) {
  if (e.target.tagName !== 'IMG') return;
  if (e.target.classList.contains('img-err-hide')) e.target.classList.add('errored');
}, true);

document.querySelectorAll('.char-costume-picker').forEach(function(sel) {
  sel.addEventListener('change', function() {
    var slug       = sel.dataset.slug;
    var cosSlug    = sel.value;
    var portraitEl = document.getElementById('cp-portrait-' + slug);
    var costumeEl  = document.getElementById('cp-costume-'  + slug);
    if (!portraitEl || !costumeEl) return;
    portraitEl.classList.remove('errored');
    if (!cosSlug) {
      costumeEl.style.display  = 'none';
      portraitEl.style.display = 'block';
      return;
    }
    costumeEl.classList.remove('errored');
    costumeEl.onerror = function() {
      costumeEl.style.display  = 'none';
      portraitEl.style.display = 'block';
    };
    costumeEl.onload = function() {
      portraitEl.style.display = 'none';
      costumeEl.style.display  = 'block';
    };
    costumeEl.src = '/img/char_' + slug + '_' + cosSlug + '_icon';
  });
});
</script>
`, 'characters');
}
