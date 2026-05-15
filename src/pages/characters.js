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

  const elemColors   = { Light:'#F4D03F', Dark:'#8E44AD', Water:'#2E86C1', Wind:'#27AE60', Fire:'#C0392B' };
  const elemGlows    = { Light:'rgba(244,208,63,0.18)', Dark:'rgba(142,68,173,0.18)', Water:'rgba(46,134,193,0.18)', Wind:'rgba(39,174,96,0.18)', Fire:'rgba(192,57,43,0.2)' };
  const elemGradient = { Light:'rgba(244,208,63,0.15),transparent', Dark:'rgba(142,68,173,0.15),transparent', Water:'rgba(46,134,193,0.15),transparent', Wind:'rgba(39,174,96,0.15),transparent', Fire:'rgba(192,57,43,0.18),transparent' };
  const elements     = ['Light','Dark','Fire','Water','Wind'];

  const cardHtml = chars.map(char => {
    const costumes   = costumesMap[char.slug] || [];
    const slug       = char.slug;
    const elRaw      = (char.element || 'Dark').toString().trim();
    const elNorm     = elRaw.charAt(0).toUpperCase() + elRaw.slice(1).toLowerCase();
    const el         = ['Light','Dark','Fire','Water','Wind'].includes(elNorm) ? elNorm : 'Dark';
    const elemColor  = elemColors[el]  || '#888';
    const elemGlow   = elemGlows[el]   || 'rgba(136,136,136,0.12)';
    const elemGrad   = elemGradient[el] || 'rgba(136,136,136,0.12),transparent';
    const baseCostume = costumes[0];
    const costumeOpts = costumes.map((c, idx) =>
      `<option value="${esc(c.costume_slug)}"${idx === 0 ? ' selected' : ''}>${esc(c.costume_name)}</option>`
    ).join('');
    const defaultImg = baseCostume
      ? `/img/char_${esc(slug)}_${esc(baseCostume.costume_slug)}_icon`
      : `/img/char_${esc(slug)}_portrait`;

    return `<div class="char-page-card" data-element="${esc(el)}" style="--el-color:${elemColor};--el-glow:${elemGlow}">
  <div class="char-img-wrap">
    <span class="char-initial">${esc(char.name.charAt(0))}</span>
    <img src="${defaultImg}" class="img-err-hide char-portrait-img" id="cp-portrait-${esc(slug)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1">
    <div class="char-elem-grad" style="background:linear-gradient(to top,${elemGrad})"></div>
    <div class="char-elem-badge">
      <img src="/img/element_${esc(el.toLowerCase())}" class="img-err-hide" style="width:100%;height:100%;object-fit:contain">
      <span class="char-elem-fallback" style="color:${elemColor}">${esc(el.charAt(0))}</span>
    </div>
    ${char.status === 'upcoming' ? '<div class="char-upcoming-badge">Upcoming</div>' : ''}
  </div>
  <div class="char-card-body">
    <div class="char-card-name-row">
      <div class="char-card-name">${esc(char.name)}</div>
    </div>
    <div class="char-card-elem" style="color:${elemColor}">${esc(el)}</div>
    ${costumes.length
      ? `<select class="char-costume-picker" data-slug="${esc(slug)}" style="width:100%;background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:5px 8px;border-radius:4px;font-size:0.78rem">
          ${costumeOpts}
        </select>
        <div style="font-size:0.65rem;color:var(--text3);margin-top:0.3rem">${costumes.length} costume${costumes.length !== 1 ? 's' : ''}</div>`
      : '<div style="font-size:0.72rem;color:var(--text3)">No costumes yet</div>'
    }
  </div>
</div>`;
  }).join('');

  return layout('Characters', `
<div style="max-width:1400px;margin:0 auto;padding:2rem 1.5rem">
  <h1 style="font-family:'Cinzel',serif;color:var(--gold);font-size:1.8rem;margin-bottom:0.25rem">Characters</h1>
  <div style="width:40px;height:2px;background:var(--gold);margin-bottom:0.5rem;opacity:0.5"></div>
  <p style="color:var(--text3);font-size:0.85rem;margin-bottom:1.5rem">PvP characters and costumes. Select a costume from the dropdown to preview its portrait.</p>

  <div class="elem-filter-bar" id="elem-filter">
    <button class="elem-filter-btn active" data-element="all">
      <span class="efb-all">✦</span>
      <span>All</span>
    </button>
    ${elements.map(el => `
    <button class="elem-filter-btn" data-element="${esc(el)}" style="--el:${elemColors[el]}">
      <span class="efb-icon-wrap">
        <img src="/img/element_${esc(el.toLowerCase())}" class="img-err-hide efb-icon" alt="">
        <span class="efb-fallback" style="color:${elemColors[el]}">${esc(el.charAt(0))}</span>
      </span>
      <span>${esc(el)}</span>
    </button>`).join('')}
  </div>

  <div id="char-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:1.1rem">
    ${cardHtml}
    <div class="char-page-card char-coming-soon">
      <div class="char-img-wrap">
        <span style="font-size:2.5rem;z-index:1;position:relative">⏳</span>
      </div>
      <div class="char-card-body">
        <div class="char-card-name">Coming Soon</div>
        <div style="font-size:0.72rem;color:var(--text3);margin-top:0.2rem">More characters being added</div>
      </div>
    </div>
  </div>
</div>

<style>
.char-page-card {
  background: var(--bg2);
  border: 1px solid var(--border2);
  border-top: 2px solid var(--el-color, var(--border2));
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s;
  cursor: default;
}
.char-page-card:hover {
  border-color: var(--el-color, rgba(201,168,76,0.6));
  transform: translateY(-3px);
  box-shadow: 0 8px 24px var(--el-glow, rgba(201,168,76,0.15));
}
.char-coming-soon { opacity:0.5; border-top-color: var(--border2) !important; --el-color:var(--border2); }
.char-img-wrap {
  position:relative;height:230px;background:var(--bg4);overflow:hidden;
  display:flex;align-items:center;justify-content:center;
}
.char-initial {
  position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  font-family:'Cinzel',serif;font-size:3.5rem;color:var(--bg3);font-weight:700;z-index:0;pointer-events:none;
}
.char-elem-grad {
  position:absolute;bottom:0;left:0;right:0;height:60px;z-index:3;pointer-events:none;
}
.char-elem-badge {
  position:absolute;top:8px;right:8px;width:28px;height:28px;z-index:4;
  background:rgba(0,0,0,0.55);border-radius:50%;padding:3px;
  display:flex;align-items:center;justify-content:center;
}
.char-elem-fallback {
  font-size:0.75rem;font-weight:700;font-family:'Cinzel',serif;position:absolute;
}
.char-elem-badge img.errored + .char-elem-fallback { display:block; }
.char-elem-badge img:not(.errored) + .char-elem-fallback { display:none; }
.char-upcoming-badge {
  position:absolute;top:8px;left:8px;z-index:4;background:rgba(201,168,76,0.85);
  color:#000;font-size:0.6rem;font-weight:700;padding:2px 7px;border-radius:3px;
  font-family:'Cinzel',serif;letter-spacing:0.05em;
}
.char-card-body { padding:0.75rem; }
.char-card-name-row { display:flex;align-items:center;gap:0.4rem;margin-bottom:0.1rem; }
.char-card-name { font-family:'Cinzel',serif;font-weight:700;font-size:0.93rem;color:var(--text); }
.char-card-elem { font-size:0.68rem;font-weight:600;margin-bottom:0.55rem;letter-spacing:0.04em; }

/* Element filter bar */
.elem-filter-bar {
  display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1.5rem;
}
.elem-filter-btn {
  display:inline-flex;align-items:center;gap:0.4rem;
  padding:6px 14px;border-radius:20px;border:1px solid var(--border2);
  background:var(--bg3);color:var(--text2);cursor:pointer;
  font-size:0.82rem;font-family:inherit;transition:all 0.15s;
}
.elem-filter-btn:hover { border-color:var(--el,var(--gold));color:var(--el,var(--gold)); }
.elem-filter-btn.active { background:rgba(201,168,76,0.12);border-color:var(--el,var(--gold));color:var(--el,var(--gold));font-weight:600; }
.efb-icon-wrap { position:relative;width:18px;height:18px;display:flex;align-items:center;justify-content:center; }
.efb-icon { width:18px;height:18px;object-fit:contain; }
.efb-fallback { font-size:0.72rem;font-weight:700;position:absolute; }
.efb-icon.errored + .efb-fallback { display:block; }
.efb-icon:not(.errored) + .efb-fallback { display:none; }
.efb-all { font-size:1rem;color:var(--gold); }
</style>

<script>
document.addEventListener('error', function(e) {
  if (e.target.tagName !== 'IMG') return;
  if (e.target.classList.contains('img-err-hide')) e.target.classList.add('errored');
}, true);

/* Element filter */
var KITSU_SETS = null;
fetch('/api/emote-sets').then(function(r) { return r.json(); }).then(function(d) { KITSU_SETS = d.sets || []; }).catch(function() {});

document.querySelectorAll('.elem-filter-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.elem-filter-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    var el = (btn.dataset.element || '').toLowerCase();
    document.querySelectorAll('#char-grid .char-page-card').forEach(function(card) {
      if (card.classList.contains('char-coming-soon')) return;
      var ce = (card.dataset.element || '').toLowerCase();
      card.style.display = (el === 'all' || ce === el) ? '' : 'none';
    });
    if (el && el !== 'all' && KITSU_SETS) {
      KITSU_SETS.forEach(function(s) {
        if ((s.unlock_page || '') !== 'characters') return;
        if ((s.unlock_target || '').toLowerCase() !== el) return;
        if (localStorage.getItem('kitsu_set_' + s.set_num) === '1') return;
        var key = 'kitsu_set_' + s.set_num + '_count';
        var c = parseInt(localStorage.getItem(key) || '0', 10) + 1;
        localStorage.setItem(key, String(c));
        if (c >= (s.unlock_count || 7)) {
          localStorage.setItem('kitsu_set_' + s.set_num, '1');
          showUnlockToast(s.set_num);
        }
      });
    }
  });
});

function showUnlockToast(n) {
  var t = document.createElement('div');
  t.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;background:rgba(46,204,113,0.95);color:#fff;padding:0.9rem 1.2rem;border-radius:8px;font-family:Cinzel,serif;font-size:0.9rem;box-shadow:0 8px 32px rgba(0,0,0,0.6)';
  t.textContent = "Set " + n + " unlocked! Visit Kitsu's Emotes to see.";
  document.body.appendChild(t);
  setTimeout(function() { t.style.transition = 'opacity 0.4s'; t.style.opacity = '0'; setTimeout(function() { t.remove(); }, 400); }, 4000);
}

/* Costume picker */
document.querySelectorAll('.char-costume-picker').forEach(function(sel) {
  sel.addEventListener('change', function() {
    var slug       = sel.dataset.slug;
    var cosSlug    = sel.value;
    var portraitEl = document.getElementById('cp-portrait-' + slug);
    if (!portraitEl || !cosSlug) return;
    portraitEl.classList.remove('errored');
    portraitEl.src = '/img/char_' + slug + '_' + cosSlug + '_icon';
  });
});
</script>
`, 'characters');
}
