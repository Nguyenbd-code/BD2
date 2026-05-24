import { layout, esc } from '../layout/layout.js';

export async function handleCharacters(request, env) {
  let chars = [];
  const costumesMap = {};

  try {
    await env.DB.prepare("ALTER TABLE char_registry ADD COLUMN atk_type TEXT DEFAULT 'Physical'").run().catch(()=>{});
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

  const elemColors   = { Water:'#2E86C1', Fire:'#C0392B', Wind:'#27AE60', Light:'#F4D03F', Dark:'#8E44AD' };
  const elemGlows    = { Water:'rgba(46,134,193,0.18)', Fire:'rgba(192,57,43,0.2)', Wind:'rgba(39,174,96,0.18)', Light:'rgba(244,208,63,0.18)', Dark:'rgba(142,68,173,0.18)' };
  const elemGradient = { Water:'rgba(46,134,193,0.15),transparent', Fire:'rgba(192,57,43,0.18),transparent', Wind:'rgba(39,174,96,0.15),transparent', Light:'rgba(244,208,63,0.15),transparent', Dark:'rgba(142,68,173,0.15),transparent' };
  const elements     = ['Water','Fire','Wind','Light','Dark'];
  const atkTypes     = ['Physical','Magic'];

  const cardHtml = chars.map((char, i) => {
    const costumes   = costumesMap[char.slug] || [];
    const slug       = char.slug;
    const elRaw      = (char.element || 'Dark').toString().trim();
    const elNorm     = elRaw.charAt(0).toUpperCase() + elRaw.slice(1).toLowerCase();
    const el         = elements.includes(elNorm) ? elNorm : 'Dark';
    const atkRaw     = (char.atk_type || 'Physical').toString().trim();
    const atkNorm    = atkRaw.charAt(0).toUpperCase() + atkRaw.slice(1).toLowerCase();
    const atk        = atkTypes.includes(atkNorm) ? atkNorm : 'Physical';
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

    return `<div class="char-page-card" data-element="${esc(el)}" data-atk-type="${esc(atk)}" style="--el-color:${elemColor};--el-glow:${elemGlow};--codex-i:${i}">
  <div class="char-img-wrap">
    <span class="char-initial">${esc(char.name.charAt(0))}</span>
    <img src="${defaultImg}" class="img-err-hide char-portrait-img" id="cp-portrait-${esc(slug)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1">
    <div class="char-elem-grad" style="background:linear-gradient(to top,${elemGrad})"></div>
    <div class="char-elem-badge">
      <img src="/img/element_${esc(el.toLowerCase())}" class="img-err-hide" style="width:100%;height:100%;object-fit:contain">
      <span class="char-elem-fallback" style="color:${elemColor}">${esc(el.charAt(0))}</span>
    </div>
    <div class="char-atk-badge" title="${esc(atk)}">
      <img src="/img/atk_${esc(atk.toLowerCase())}" class="img-err-hide" style="width:100%;height:100%;object-fit:contain">
    </div>
    ${char.status === 'upcoming' ? '<div class="char-upcoming-badge">Upcoming</div>' : ''}
  </div>
  <div class="char-card-body">
    <div class="char-card-name-row">
      <div class="char-card-name">${esc(char.name)}</div>
    </div>
    <div class="char-card-elem" style="display:inline-flex;align-items:center;gap:6px;color:${elemColor}">
      <img src="/img/element_${esc(el.toLowerCase())}" class="img-err-hide" style="width:14px;height:14px;object-fit:contain">
      <span>${esc(el)}</span>
      <img src="/img/atk_${esc(atk.toLowerCase())}" class="img-err-hide" style="width:13px;height:13px;object-fit:contain;margin-left:4px" title="${esc(atk)}">
    </div>
    ${costumes.length
      ? `<select class="char-costume-picker" data-slug="${esc(slug)}" aria-label="Choose costume for ${esc(char.name)}" style="width:100%;background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:5px 8px;border-radius:4px;font-size:0.78rem">
          ${costumeOpts}
        </select>
        <div style="font-size:0.65rem;color:var(--text3);margin-top:0.3rem">${costumes.length} costume${costumes.length !== 1 ? 's' : ''}</div>`
      : '<div style="font-size:0.72rem;color:var(--text3)">No costumes yet</div>'
    }
  </div>
</div>`;
  }).join('');

  return await layout('Characters', `
<div class="hero" style="padding:3rem 1.5rem 1.5rem;text-align:center">
  <h1>Characters</h1>
  <p>PvP characters and costumes. Select a costume from the dropdown to preview its portrait.</p>
</div>
<div style="max-width:1400px;margin:0 auto;padding:0 1.5rem 2rem">

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
    ${atkTypes.map(at => `
    <button class="elem-filter-btn atk-filter-btn" data-atk-type="${esc(at)}" style="--el:#FFFFFF">
      <span class="efb-icon-wrap">
        <img src="/img/atk_${esc(at.toLowerCase())}" class="img-err-hide efb-icon" alt="">
      </span>
      <span>${esc(at)}</span>
    </button>`).join('')}
  </div>

  <div id="char-grid" data-codex-reveal style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:1.1rem">
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
  font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:3.5rem;color:var(--bg3);font-weight:700;z-index:0;pointer-events:none;
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
  font-size:0.75rem;font-weight:700;font-family:'IBM Plex Sans',system-ui,sans-serif;position:absolute;
}
.char-elem-badge img.errored + .char-elem-fallback { display:block; }
.char-elem-badge img:not(.errored) + .char-elem-fallback { display:none; }
.char-atk-badge {
  position:absolute;top:8px;right:42px;width:24px;height:24px;z-index:4;
  background:rgba(0,0,0,0.55);border-radius:50%;padding:3px;
  display:flex;align-items:center;justify-content:center;
}
.char-upcoming-badge {
  position:absolute;top:8px;left:8px;z-index:4;background:rgba(201,168,76,0.85);
  color:#000;font-size:0.6rem;font-weight:700;padding:2px 7px;border-radius:3px;
  font-family:'IBM Plex Sans',system-ui,sans-serif;letter-spacing:0.05em;
}
.char-card-body { padding:0.75rem; }
.char-card-name-row { display:flex;align-items:center;gap:0.4rem;margin-bottom:0.1rem; }
.char-card-name { font-family:'IBM Plex Sans',system-ui,sans-serif;font-weight:700;font-size:0.93rem;color:var(--text); }
.char-card-elem { font-size:0.68rem;font-weight:600;margin-bottom:0.55rem;letter-spacing:0.04em; }

/* Element filter bar */
.elem-filter-bar {
  display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:1.75rem;padding:0.35rem 0 0.85rem;
  border-bottom:1px solid rgba(220,230,255,0.05);
}
/* Element / atk-type filter button — codex pill style. Bottom-only border
   on rest state, full edge on hover, gold underline when active. */
.elem-filter-btn {
  display:inline-flex;align-items:center;gap:0.45rem;
  padding:7px 14px;border-radius:2px;
  background:transparent;border:1px solid transparent;
  color:rgba(220,228,245,0.55);cursor:pointer;
  font-family:'IBM Plex Sans',system-ui,sans-serif;
  font-size:0.7rem;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;
  transition:color 0.16s ease,border-color 0.16s ease,background 0.16s ease;
}
.elem-filter-btn:hover {
  color:var(--el,var(--gold2));
  border-color:rgba(220,230,255,0.08);
  background:rgba(220,230,255,0.025);
}
.elem-filter-btn.active {
  color:var(--el,var(--gold2));
  border-color:transparent;
  background:rgba(220,230,255,0.04);
  box-shadow:inset 0 -2px 0 0 var(--el,var(--gold));
}
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
fetch('/api/emote-sets').then(function(r) { return r.json(); }).then(function(d) {
  KITSU_SETS = d.sets || [];
  setupWhoAmI();
}).catch(function() {});

function tierUnlocked(d) {
  if (d === 'easy') return true;
  if (!KITSU_SETS) return false;
  var prev = d === 'medium' ? 'easy' : 'medium';
  var list = KITSU_SETS.filter(function(x){ return (x.difficulty || 'easy') === prev; });
  return list.length > 0 && list.every(function(x){ return localStorage.getItem('kitsu_set_' + x.set_num) === '1'; });
}

function setupWhoAmI() {
  if (!KITSU_SETS) return;
  KITSU_SETS.forEach(function(s) {
    if ((s.unlock_mode || '') !== 'who_am_i') return;
    var targetSlug = (s.unlock_target || '').toLowerCase();
    if (!targetSlug) return;
    var picker = document.querySelector('.char-costume-picker[data-slug="' + targetSlug + '"]');
    var ghostCard = picker ? picker.closest('.char-page-card') : null;
    if (localStorage.getItem('kitsu_set_' + s.set_num) === '1') {
      if (ghostCard) ghostCard.style.display = 'none';
      return;
    }
    // Ghost card stays hidden until the Hard difficulty tier is available.
    if (!tierUnlocked(s.difficulty || 'easy')) {
      if (ghostCard) ghostCard.style.display = 'none';
      return;
    }
    if (!picker) return;
    var opt = document.createElement('option');
    opt.value = '__who_am_i__';
    opt.textContent = '~ Who Am I? ~';
    picker.appendChild(opt);
    var inputDiv = document.createElement('div');
    inputDiv.style.cssText = 'display:none;margin-top:0.4rem';
    var answer = (s.unlock_sequence || '').trim();
    var setNum = s.set_num;
    inputDiv.innerHTML = '<input type="text" placeholder="Enter name..." autocomplete="off" style="width:100%;background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:6px 10px;border-radius:4px;font-size:0.82rem;font-family:inherit">'
      + '<button style="width:100%;margin-top:0.25rem;background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.4);color:var(--gold);padding:5px;border-radius:4px;cursor:pointer;font-size:0.78rem;font-family:Cormorant Unicase,serif;letter-spacing:0.04em">Submit</button>'
      + '<div style="font-size:0.7rem;color:#e74c3c;margin-top:0.2rem;min-height:1rem" class="wai-err"></div>';
    picker.parentNode.insertBefore(inputDiv, picker.nextSibling);
    picker.addEventListener('change', function() {
      inputDiv.style.display = picker.value === '__who_am_i__' ? 'block' : 'none';
    });
    var btn = inputDiv.querySelector('button');
    var inp = inputDiv.querySelector('input');
    var errEl = inputDiv.querySelector('.wai-err');
    function checkWhoAmI() {
      var val = (inp ? inp.value : '').trim();
      if (val.toLowerCase() === answer.toLowerCase()) {
        localStorage.setItem('kitsu_set_' + setNum, '1');
        inputDiv.style.display = 'none';
        for (var i = picker.options.length - 1; i >= 0; i--) {
          if (picker.options[i].value === '__who_am_i__') { picker.remove(i); break; }
        }
        picker.selectedIndex = 0;
        showUnlockToast(setNum);
        if (ghostCard) {
          ghostCard.style.transition = 'opacity 0.6s ease';
          ghostCard.style.opacity = '0';
          setTimeout(function() { ghostCard.style.display = 'none'; }, 650);
        }
      } else {
        if (errEl) { errEl.textContent = 'Incorrect. Try again.'; setTimeout(function() { if (errEl) errEl.textContent = ''; }, 2000); }
        if (inp) { inp.value = ''; inp.focus(); }
      }
    }
    if (btn) btn.addEventListener('click', checkWhoAmI);
    if (inp) inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') checkWhoAmI(); });
  });
}

// Delegated element-filter handler — survives if KITSU_SETS load fails
document.addEventListener('click', function(e) {
  var atkBtn = e.target.closest('.atk-filter-btn');
  if (atkBtn) {
    try {
      document.querySelectorAll('.elem-filter-btn').forEach(function(b) { b.classList.remove('active'); });
      atkBtn.classList.add('active');
      var at = (atkBtn.dataset.atkType || '').toLowerCase();
      document.querySelectorAll('#char-grid .char-page-card').forEach(function(card) {
        if (card.classList.contains('char-coming-soon')) return;
        var ca = (card.dataset.atkType || '').toLowerCase();
        card.style.display = (!at || ca === at) ? '' : 'none';
      });
      // Track atk-type click for count_then_seal sealing
      if (at && (window.KITSU_SETS || []).length) {
        window.KITSU_SETS.forEach(function(s) {
          if (localStorage.getItem('kitsu_set_' + s.set_num) === '1') return;
          if (!tierUnlocked(s.difficulty || 'easy')) return;
          if ((s.unlock_mode || '') !== 'count_then_seal') return;
          var countKey = 'kitsu_set_' + s.set_num + '_count';
          var c = parseInt(localStorage.getItem(countKey) || '0', 10);
          var needed = s.unlock_count || 7;
          var seal = (s.unlock_sequence || '').toLowerCase().trim();
          if (c >= needed && seal && at === seal) {
            localStorage.setItem('kitsu_set_' + s.set_num, '1');
            localStorage.removeItem(countKey);
            showUnlockToast(s.set_num);
          }
        });
      }
    } catch (err) {}
    return;
  }
  var btn = e.target.closest('.elem-filter-btn');
  if (!btn) return;
  try {
    document.querySelectorAll('.elem-filter-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    var el = (btn.dataset.element || '').toLowerCase();
    document.querySelectorAll('#char-grid .char-page-card').forEach(function(card) {
      if (card.classList.contains('char-coming-soon')) return;
      var ce = (card.dataset.element || '').toLowerCase();
      card.style.display = (el === 'all' || ce === el) ? '' : 'none';
    });
    if (el && el !== 'all' && KITSU_SETS) {
      var recent = [];
      try { recent = JSON.parse(localStorage.getItem('kitsu_recent_clicks') || '[]'); } catch(e) {}
      recent.push(el);
      if (recent.length > 30) recent = recent.slice(-30);
      localStorage.setItem('kitsu_recent_clicks', JSON.stringify(recent));

      KITSU_SETS.forEach(function(s) {
        if ((s.unlock_page || '') !== 'characters') return;
        if (localStorage.getItem('kitsu_set_' + s.set_num) === '1') return;
        if (!tierUnlocked(s.difficulty || 'easy')) return;
        var mode = s.unlock_mode || 'count';
        if (mode === 'sequence') {
          var seq = (s.unlock_sequence || '').split(',').map(function(x) { return x.trim().toLowerCase(); }).filter(Boolean);
          if (!seq.length) return;
          var tail = recent.slice(-seq.length);
          if (tail.length === seq.length && tail.every(function(v, i) { return v === seq[i]; })) {
            localStorage.setItem('kitsu_set_' + s.set_num, '1');
            showUnlockToast(s.set_num);
          }
        } else if (mode === 'count') {
          if (!(s.unlock_target || '')) return;
          if ((s.unlock_target || '').toLowerCase() !== el) return;
          var key = 'kitsu_set_' + s.set_num + '_count';
          var c = parseInt(localStorage.getItem(key) || '0', 10) + 1;
          localStorage.setItem(key, String(c));
          if (c >= (s.unlock_count || 7)) {
            localStorage.setItem('kitsu_set_' + s.set_num, '1');
            showUnlockToast(s.set_num);
          }
        } else if (mode === 'count_then_seal') {
          if (!(s.unlock_target || '')) return;
          if ((s.unlock_target || '').toLowerCase() !== el) return;
          var ckey = 'kitsu_set_' + s.set_num + '_count';
          var cc = parseInt(localStorage.getItem(ckey) || '0', 10);
          if (cc < (s.unlock_count || 7)) {
            cc++;
            localStorage.setItem(ckey, String(cc));
          }
          // Unlock only after the seal atk-type click — see atk-filter handler.
        }
        // letter_sequence and who_am_i handled elsewhere
      });
    }
  } catch(err) {}
});

function showUnlockToast(n) {
  var s = (KITSU_SETS || []).find(function(x) { return x.set_num === n; }) || {};
  var name = s.name || ('Set ' + n);
  var msg = s.unlock_message || ("Unlocked! Visit Kitsu's Emotes to see set " + n + '.');
  if (window.showSetUnlockModal) {
    window.showSetUnlockModal(n, name, msg);
  } else {
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:2.5rem;left:50%;transform:translateX(-50%);z-index:9999;background:rgba(46,204,113,0.95);color:#fff;padding:0.9rem 1.4rem;border-radius:8px;font-family:Cormorant Unicase,serif;font-size:0.88rem;box-shadow:0 8px 32px rgba(0,0,0,0.6);white-space:nowrap';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() { t.style.transition = 'opacity 0.4s'; t.style.opacity = '0'; setTimeout(function() { t.remove(); }, 400); }, 4000);
  }
}

/* Costume picker — delegated so it works even if some cards render late */
document.addEventListener('change', function(e) {
  var sel = e.target;
  if (!sel || !sel.classList || !sel.classList.contains('char-costume-picker')) return;
  try {
    var slug    = sel.dataset.slug;
    var cosSlug = sel.value;
    var portraitEl = document.getElementById('cp-portrait-' + slug);
    if (!portraitEl) return;
    portraitEl.classList.remove('errored');
    portraitEl.style.display = '';
    if (cosSlug && cosSlug !== '__who_am_i__') {
      portraitEl.src = '/img/char_' + slug + '_' + cosSlug + '_icon';
    } else if (!cosSlug) {
      portraitEl.src = '/img/char_' + slug + '_portrait';
    }
  } catch(err) {}
});
</script>
`, 'characters', env, request);
}
