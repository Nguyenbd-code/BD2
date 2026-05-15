import { layout, esc } from '../layout/layout.js';

async function ensureSchema(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS emote_sets (
    set_num INTEGER PRIMARY KEY,
    name TEXT,
    hint TEXT,
    unlock_page TEXT,
    unlock_target TEXT,
    unlock_count INTEGER DEFAULT 7,
    cover_key TEXT
  )`).run().catch(()=>{});
  await env.DB.prepare('ALTER TABLE emotes ADD COLUMN set_num INTEGER DEFAULT 1').run().catch(()=>{});
  const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM emote_sets').first().catch(()=>null);
  if (!r || !r.n) {
    const defaults = [
      [1, 'Set 1', 'My favorite girl has how many letters? Count them and click her element that many times on the Characters page.', 'characters', 'water', 7],
      [2, 'Set 2', 'Secret hint coming soon.', 'characters', 'fire', 5],
      [3, 'Set 3', 'Secret hint coming soon.', 'characters', 'wind', 5],
      [4, 'Set 4', 'Secret hint coming soon.', 'characters', 'light', 5],
      [5, 'Set 5', 'Secret hint coming soon.', 'characters', 'dark', 5],
    ];
    for (const d of defaults) {
      await env.DB.prepare('INSERT OR IGNORE INTO emote_sets (set_num, name, hint, unlock_page, unlock_target, unlock_count) VALUES (?,?,?,?,?,?)').bind(...d).run().catch(()=>{});
    }
  }
}

export async function handleEmotes(request, env) {
  await ensureSchema(env);

  let sets = [];
  let emotes = [];
  try {
    const r1 = await env.DB.prepare('SELECT * FROM emote_sets ORDER BY set_num').all();
    sets = r1.results || [];
    const r2 = await env.DB.prepare('SELECT * FROM emotes ORDER BY set_num, created_at DESC').all();
    emotes = r2.results || [];
  } catch(e) {}

  const emotesBySet = {};
  for (const e of emotes) {
    const s = e.set_num || 1;
    if (!emotesBySet[s]) emotesBySet[s] = [];
    emotesBySet[s].push(e);
  }

  const setsJson = JSON.stringify(sets.map(s => ({
    set_num: s.set_num,
    name: s.name,
    hint: s.hint || '',
    unlock_page: s.unlock_page || '',
    unlock_target: s.unlock_target || '',
    unlock_count: s.unlock_count || 7,
    cover_key: s.cover_key || '',
    count: (emotesBySet[s.set_num] || []).length,
  })));

  const setCards = sets.map(s => {
    const sn = s.set_num;
    const list = emotesBySet[sn] || [];
    const cover = s.cover_key ? `/img/${esc(s.cover_key)}` : (list[0] ? esc(list[0].image_url) : '');
    const emoteHtml = list.map(e => `
      <div class="emote-card">
        <img src="${esc(e.image_url)}" alt="${esc(e.name)}" loading="lazy">
        <div class="emote-name">${esc(e.name)}</div>
        <a href="${esc(e.image_url)}" download="${esc(e.name)}" class="emote-dl">Download</a>
      </div>`).join('');
    return `
    <div class="set-card" data-set="${sn}">
      <div class="set-cover">
        ${cover ? `<img src="${cover}" alt="Set ${sn}" class="img-err-hide">` : `<span class="set-cover-placeholder">Set ${sn}</span>`}
        <div class="set-lock-overlay">
          <div class="set-lock-icon">&#128274;</div>
          <div class="set-lock-text">Locked</div>
        </div>
      </div>
      <div class="set-info">
        <div class="set-title">${esc(s.name || ('Set ' + sn))}
          <span class="set-hint-icon" data-set="${sn}" title="Hint">?</span>
        </div>
        <div class="set-meta">${list.length} emote${list.length === 1 ? '' : 's'}</div>
      </div>
      <div class="set-emotes" style="display:none">
        ${emoteHtml || '<div style="text-align:center;color:var(--text3);padding:1.5rem">No emotes in this set yet.</div>'}
      </div>
    </div>`;
  }).join('');

  return layout("Kitsu's Emotes", `
<div class="hero" style="padding-bottom:2rem">
  <div class="hero-tag">Secret Sets</div>
  <h1>Kitsu's <span>Emotes</span></h1>
  <p>Five locked sets. Each one hides behind a small secret on the site — find it to unlock.</p>
</div>

<div id="hint-toast" style="display:none;position:fixed;top:1rem;right:1rem;z-index:9999;background:rgba(15,15,24,0.96);border:1px solid rgba(201,168,76,0.4);border-radius:8px;padding:0.9rem 1.1rem;max-width:340px;color:var(--text);font-size:0.85rem;line-height:1.5;box-shadow:0 8px 32px rgba(0,0,0,0.7)">
  <div style="font-family:'Cinzel',serif;color:var(--gold);font-size:0.78rem;margin-bottom:0.3rem;letter-spacing:0.05em" id="hint-toast-title">HINT</div>
  <div id="hint-toast-body"></div>
</div>

<div class="sets-grid">${setCards}</div>

<style>
.sets-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem;max-width:1200px;margin:0 auto;padding:0 1.5rem 3rem; }
.set-card { background:var(--bg2);border:1px solid var(--border2);border-radius:8px;overflow:hidden;transition:border-color 0.2s,transform 0.15s;cursor:pointer; }
.set-card:hover { border-color:rgba(201,168,76,0.5);transform:translateY(-2px); }
.set-card.unlocked { border-color:rgba(46,204,113,0.4); }
.set-card.unlocked:hover { border-color:rgba(46,204,113,0.7); }
.set-card.open .set-emotes { display:grid !important; }
.set-cover { position:relative;height:180px;background:var(--bg4);overflow:hidden;display:flex;align-items:center;justify-content:center; }
.set-cover img { width:100%;height:100%;object-fit:cover; }
.set-cover-placeholder { font-family:'Cinzel',serif;color:var(--bg3);font-size:1.8rem;font-weight:700; }
.set-lock-overlay { position:absolute;inset:0;background:rgba(0,0,0,0.78);display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text2);transition:opacity 0.2s; }
.set-card.unlocked .set-lock-overlay { display:none; }
.set-lock-icon { font-size:2rem;margin-bottom:0.3rem; }
.set-lock-text { font-family:'Cinzel',serif;font-size:0.82rem;letter-spacing:0.08em; }
.set-info { padding:0.85rem 1rem;display:flex;align-items:center;justify-content:space-between;gap:0.5rem; }
.set-title { font-family:'Cinzel',serif;font-weight:700;font-size:0.95rem;color:var(--gold);display:flex;align-items:center;gap:0.5rem; }
.set-hint-icon { display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:rgba(201,168,76,0.18);border:1px solid rgba(201,168,76,0.4);color:var(--gold);font-size:0.7rem;font-weight:700;cursor:help; }
.set-hint-icon:hover { background:rgba(201,168,76,0.32); }
.set-meta { font-size:0.72rem;color:var(--text3); }
.set-emotes { display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:0.6rem;padding:0.6rem 1rem 1rem;border-top:1px solid var(--border2); }
.emote-card { background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:0.5rem;text-align:center; }
.emote-card img { width:100%;height:80px;object-fit:contain; }
.emote-name { font-size:0.7rem;color:var(--text2);margin-top:0.25rem;word-break:break-word; }
.emote-dl { display:inline-block;font-size:0.65rem;color:var(--gold);margin-top:0.25rem;text-decoration:none; }
.emote-dl:hover { text-decoration:underline; }
</style>

<script>
(function() {
  var SETS = ${setsJson};
  function isUnlocked(n) { return localStorage.getItem('kitsu_set_' + n) === '1'; }
  function paint() {
    SETS.forEach(function(s) {
      var card = document.querySelector('.set-card[data-set="' + s.set_num + '"]');
      if (!card) return;
      if (isUnlocked(s.set_num)) card.classList.add('unlocked');
      else card.classList.remove('unlocked');
    });
  }
  paint();

  document.addEventListener('click', function(e) {
    var hintBtn = e.target.closest('.set-hint-icon');
    if (hintBtn) {
      e.stopPropagation();
      var n = parseInt(hintBtn.dataset.set, 10);
      var s = SETS.find(function(x) { return x.set_num === n; });
      if (!s) return;
      var toast = document.getElementById('hint-toast');
      document.getElementById('hint-toast-title').textContent = 'HINT - SET ' + n;
      document.getElementById('hint-toast-body').textContent = s.hint || 'No hint set yet.';
      toast.style.display = 'block';
      clearTimeout(window._hintTo);
      window._hintTo = setTimeout(function() { toast.style.display = 'none'; }, 6000);
      return;
    }
    var card = e.target.closest('.set-card');
    if (!card) return;
    var sn = parseInt(card.dataset.set, 10);
    if (!isUnlocked(sn)) {
      var s = SETS.find(function(x) { return x.set_num === sn; });
      var toast = document.getElementById('hint-toast');
      document.getElementById('hint-toast-title').textContent = 'LOCKED - SET ' + sn;
      document.getElementById('hint-toast-body').textContent = (s && s.hint) ? s.hint : 'Find the secret to unlock.';
      toast.style.display = 'block';
      clearTimeout(window._hintTo);
      window._hintTo = setTimeout(function() { toast.style.display = 'none'; }, 6000);
      return;
    }
    card.classList.toggle('open');
  });

  document.addEventListener('error', function(e) {
    if (e.target.classList && e.target.classList.contains('img-err-hide')) e.target.style.display = 'none';
  }, true);
})();
</script>
`, 'emotes');
}
