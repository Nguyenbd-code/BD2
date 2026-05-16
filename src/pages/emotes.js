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
  await env.DB.prepare("ALTER TABLE emote_sets ADD COLUMN unlock_mode TEXT DEFAULT 'count'").run().catch(()=>{});
  await env.DB.prepare("ALTER TABLE emote_sets ADD COLUMN unlock_sequence TEXT DEFAULT ''").run().catch(()=>{});
  await env.DB.prepare("ALTER TABLE emote_sets ADD COLUMN set_letter TEXT DEFAULT ''").run().catch(()=>{});

  const set2Riddle = "Six marks lie hidden where expressions live.\nFive belong to the name you seek. One does not.\nPress what feels out of place last.\nBefore it, trace the name that was always there: not spoken in order, but remembered in feeling.\nBegin where silence feels sharp, not soft, and end with what does not belong.";
  const set5Riddle = "The sea answers before the flame remembers.\nWhat is pure stands quietly between shadow and sky, though shadow never comes first.\nThe wind forgets nothing, yet speaks last, and only after the tide has already moved.\n\nYou must press the elements in order.";
  const set6Hint = "Among the many who are remembered, one does not belong to memory.\nNot in strength, not in name… but in presence.\n\nLook carefully through those who should feel familiar.\nSomething exists that was never meant to be part of them.\n\nA portrait that does not match the world around it.\nA face that does not answer to any story.\n\nWhen you find what should not exist, do not treat it as a character.\nOpen it. Listen. Then ask the question it offers you.\n\n\"Who am I?\"\n\nThe answer is already known, it only forgot its shape.";

  const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM emote_sets').first().catch(()=>null);
  if (!r || !r.n) {
    const defaults = [
      [1, 'S', 'S', 'My favorite girl has how many letters? Count them and click her element that many times on the Characters page.', 'characters', 'water', 7, 'count', ''],
      [2, 'T', 'T', set2Riddle, 'emotes', '', 0, 'letter_sequence', 'K,I,T,S,U'],
      [3, 'K', 'K', 'Secret hint coming soon.', 'characters', 'wind', 5, 'count', ''],
      [4, 'I', 'I', 'Secret hint coming soon.', 'characters', 'light', 5, 'count', ''],
      [5, 'M', 'M', set5Riddle, 'characters', '', 0, 'sequence', 'water,fire,light,dark,wind'],
      [6, 'U', 'U', set6Hint, 'characters', 'synae', 0, 'who_am_i', 'Synae'],
    ];
    for (const [sn, nm, sl, hint, page, target, count, mode, seq] of defaults) {
      await env.DB.prepare('INSERT OR IGNORE INTO emote_sets (set_num, name, set_letter, hint, unlock_page, unlock_target, unlock_count, unlock_mode, unlock_sequence) VALUES (?,?,?,?,?,?,?,?,?)').bind(sn, nm, sl, hint, page, target, count, mode, seq).run().catch(()=>{});
    }
  } else {
    // One-time v2 migration: update sets to new config if not yet done
    const v2 = await env.DB.prepare("SELECT data FROM images WHERE key='emote_v2_migrated'").first().catch(()=>null);
    if (!v2) {
      await env.DB.prepare("INSERT OR IGNORE INTO images (key,data) VALUES ('emote_v2_migrated','1')").run().catch(()=>{});
      await env.DB.prepare("UPDATE emote_sets SET name='S', set_letter='S' WHERE set_num=1 AND (name='Set 1' OR name IS NULL)").run().catch(()=>{});
      await env.DB.prepare("UPDATE emote_sets SET name='T', set_letter='T', hint=?, unlock_page='emotes', unlock_target='', unlock_count=0, unlock_mode='letter_sequence', unlock_sequence='K,I,T,S,U' WHERE set_num=2").bind(set2Riddle).run().catch(()=>{});
      await env.DB.prepare("UPDATE emote_sets SET name='K', set_letter='K' WHERE set_num=3 AND (name='Set 3' OR name IS NULL)").run().catch(()=>{});
      await env.DB.prepare("UPDATE emote_sets SET name='I', set_letter='I' WHERE set_num=4 AND (name='Set 4' OR name IS NULL)").run().catch(()=>{});
      await env.DB.prepare("UPDATE emote_sets SET name='M', set_letter='M', hint=?, unlock_mode='sequence', unlock_sequence='water,fire,light,dark,wind', unlock_count=0 WHERE set_num=5").bind(set5Riddle).run().catch(()=>{});
      await env.DB.prepare("INSERT OR IGNORE INTO emote_sets (set_num, name, set_letter, hint, unlock_page, unlock_target, unlock_count, unlock_mode, unlock_sequence) VALUES (6,'U','U',?,'characters','synae',0,'who_am_i','Synae')").bind(set6Hint).run().catch(()=>{});
      // Force update set 6 hint to new text
      await env.DB.prepare("UPDATE emote_sets SET hint=? WHERE set_num=6").bind(set6Hint).run().catch(()=>{});
    }
    // Always ensure set 6 exists
    await env.DB.prepare("INSERT OR IGNORE INTO emote_sets (set_num, name, set_letter, hint, unlock_page, unlock_target, unlock_count, unlock_mode, unlock_sequence) VALUES (6,'U','U',?,'characters','synae',0,'who_am_i','Synae')").bind(set6Hint).run().catch(()=>{});
  }
}

export async function handleEmotes(request, env) {
  await ensureSchema(env);

  const lockImgRow = await env.DB.prepare("SELECT data FROM images WHERE key='emote_lock_image'").first().catch(() => null);
  const lockImgSrc = lockImgRow ? '/img/emote_lock_image' : '';

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
    set_letter: s.set_letter || s.name || String(s.set_num),
    hint: s.hint || '',
    unlock_page: s.unlock_page || '',
    unlock_target: s.unlock_target || '',
    unlock_count: s.unlock_count || 7,
    unlock_mode: s.unlock_mode || 'count',
    unlock_sequence: s.unlock_sequence || '',
    cover_key: s.cover_key || '',
    count: (emotesBySet[s.set_num] || []).length,
  }))).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  const setCards = sets.map(s => {
    const sn = s.set_num;
    const list = emotesBySet[sn] || [];
    const cover = s.cover_key ? `/img/${esc(s.cover_key)}` : (list[0] ? esc(list[0].image_url) : '');
    const displayName = esc(s.name || String(sn));
    const emoteHtml = list.map(e => `
      <div class="emote-card">
        <img src="${esc(e.image_url)}" alt="${esc(e.name)}" loading="lazy">
        <div class="emote-name">${esc(e.name)}</div>
        <a href="${esc(e.image_url)}" download="${esc(e.name)}" class="emote-dl">Download</a>
      </div>`).join('');
    return `
    <div class="set-card" data-set="${sn}">
      <div class="set-cover" data-cover-set="${sn}">
        ${cover ? `<img src="${cover}" alt="${displayName}" class="img-err-hide">` : `<span class="set-cover-placeholder">${displayName}</span>`}
        <div class="set-lock-overlay">
          <div class="set-lock-img-wrap"></div>
          <div class="set-lock-icon">&#128274;</div>
          <div class="set-lock-text">Locked</div>
        </div>
      </div>
      <div class="set-info">
        <div class="set-title">
          <span class="set-letter-btn" data-letter-set="${sn}" tabindex="0">${displayName}</span>
          <span class="set-hint-icon" data-set="${sn}" style="cursor:pointer">?</span>
        </div>
        <div class="set-meta">${list.length} emote${list.length === 1 ? '' : 's'}</div>
      </div>
      <div class="set-emotes" style="display:none">
        ${emoteHtml || '<div style="text-align:center;color:var(--text3);padding:1.5rem">No emotes in this set yet.</div>'}
      </div>
    </div>`;
  }).join('');

  return layout("Kitsu's Emotes", `
<!-- Page lock screen — shown only if kitsu_unlocked not set -->
<div id="emote-lock-screen" style="display:none;position:fixed;inset:0;z-index:10000;background:var(--bg);flex-direction:column;align-items:center;justify-content:center;padding:2rem;overflow-y:auto">
  <div style="max-width:460px;width:100%;text-align:center">
    <div id="emote-lock-img-wrap" style="width:130px;height:130px;margin:0 auto 1.5rem;border-radius:12px;overflow:hidden;background:var(--bg3);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center">
      <span style="font-size:3.5rem">&#128274;</span>
    </div>
    <div style="font-family:'Cinzel',serif;font-size:1.3rem;color:var(--gold);margin-bottom:0.35rem;letter-spacing:0.04em">Kitsu's Emotes</div>
    <div style="font-size:0.75rem;color:var(--gold2);font-family:'Cinzel',serif;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:1rem">Secret Sets</div>
    <div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:8px;padding:1rem 1.25rem;margin-bottom:1.5rem;text-align:left">
      <div style="font-size:0.72rem;color:var(--gold);font-family:'Cinzel',serif;letter-spacing:0.06em;margin-bottom:0.4rem">LOCATION: HOME</div>
      <div style="font-size:0.85rem;color:var(--text2);line-height:1.6">One character keeps something unusual by their side. The octopus there isn&rsquo;t just decoration.</div>
    </div>
    <a href="/" style="display:block;width:100%;box-sizing:border-box;text-align:center;background:var(--gold);color:#0a0a0f;border:none;padding:0.7rem;border-radius:6px;font-weight:700;cursor:pointer;font-family:'Cinzel',serif;font-size:0.9rem;letter-spacing:0.06em;text-decoration:none">Go to Home Page</a>
  </div>
</div>

<script>(function(){if(localStorage.getItem('kitsu_unlocked')!=='true'){var ls=document.getElementById('emote-lock-screen');var pc=document.getElementById('emote-page-content');if(ls)ls.style.display='flex';if(pc)pc.style.display='none';}})();</script>
<!-- Main page content (hidden until unlocked) -->
<div id="emote-page-content">
<div class="hero" style="padding-bottom:2rem">
  <div class="hero-tag">Secret Sets</div>
  <h1>Kitsu's <span>Emotes</span></h1>
  <p>Six locked sets. Each one hides behind a small secret somewhere on the site.</p>
  <button id="page-unlock-hint" style="margin-top:0.75rem;display:inline-flex;align-items:center;gap:0.5rem;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.3);border-radius:6px;padding:7px 14px;cursor:pointer;font-family:'Cinzel',serif;color:var(--gold);font-size:0.88rem;letter-spacing:0.04em">
    Find the Secret to Unlock
    <span class="set-hint-icon" style="flex-shrink:0;pointer-events:none">?</span>
  </button>
</div>

<div id="hint-modal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.7);align-items:center;justify-content:center">
  <div style="background:var(--bg2);border:1px solid rgba(201,168,76,0.5);border-radius:12px;padding:1.5rem 1.75rem;max-width:440px;width:90%;box-shadow:0 16px 48px rgba(0,0,0,0.9);position:relative">
    <div style="font-family:'Cinzel',serif;color:var(--gold);font-size:0.82rem;letter-spacing:0.08em;margin-bottom:0.5rem" id="hint-modal-title">HINT</div>
    <div id="hint-modal-body" style="color:var(--text);font-size:0.9rem;line-height:1.65;margin-bottom:1rem;white-space:pre-line"></div>
    <button id="hint-modal-close" style="background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.4);color:var(--gold);padding:6px 20px;border-radius:5px;cursor:pointer;font-family:'Cinzel',serif;font-size:0.78rem;letter-spacing:0.05em">Dismiss</button>
  </div>
</div>

<div id="emote-modal-overlay" class="emote-modal-overlay">
  <div class="emote-modal">
    <div class="emote-modal-header">
      <div class="emote-modal-title" id="emote-modal-title">Set</div>
      <button class="emote-modal-close" id="emote-modal-close">&#10005;</button>
    </div>
    <div id="emote-modal-body"></div>
  </div>
</div>

<div class="sets-grid">${setCards}</div>
</div><!-- /emote-page-content -->

<style>
.sets-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem;max-width:1200px;margin:0 auto;padding:0 1.5rem 3rem; }
.set-card { background:var(--bg2);border:1px solid var(--border2);border-radius:8px;overflow:hidden;transition:border-color 0.2s,transform 0.15s;cursor:pointer; }
.set-card:hover { border-color:rgba(201,168,76,0.5);transform:translateY(-2px); }
.set-card.unlocked { border-color:rgba(46,204,113,0.4); }
.set-card.unlocked:hover { border-color:rgba(46,204,113,0.7); }
.set-card.open .set-emotes { display:grid !important; }
.set-cover { position:relative;height:180px;background:var(--bg4);overflow:hidden;display:flex;align-items:center;justify-content:center; }
.set-cover img { width:100%;height:100%;object-fit:cover; }
.set-cover-placeholder { font-family:'Cinzel',serif;color:var(--bg3);font-size:3rem;font-weight:700; }
.set-lock-overlay { position:absolute;inset:0;background:rgba(0,0,0,0.78);display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text2);transition:opacity 0.2s; }
.set-card.unlocked .set-lock-overlay { display:none; }
.set-lock-icon { font-size:2rem;margin-bottom:0.3rem; }
.set-lock-text { font-family:'Cinzel',serif;font-size:0.82rem;letter-spacing:0.08em; }
.set-info { padding:0.85rem 1rem;display:flex;align-items:center;justify-content:space-between;gap:0.5rem; }
.set-title { font-family:'Cinzel',serif;font-weight:700;font-size:0.95rem;color:var(--gold);display:flex;align-items:center;gap:0.5rem; }
.set-letter-btn { display:inline-flex;align-items:center;justify-content:center;min-width:22px;padding:2px 8px;border-radius:5px;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.25);color:var(--gold);cursor:pointer;user-select:none;transition:transform 0.08s ease,background 0.15s ease,box-shadow 0.15s ease;box-shadow:0 1px 0 rgba(201,168,76,0.25),0 2px 6px rgba(0,0,0,0.4); }
.set-letter-btn:hover { background:rgba(201,168,76,0.18); }
.set-letter-btn:active, .set-letter-btn.pressed { transform:translateY(1px) scale(0.96);background:rgba(201,168,76,0.32);box-shadow:inset 0 2px 4px rgba(0,0,0,0.5); }
.set-cover { cursor:pointer; }
.set-hint-icon { display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:rgba(201,168,76,0.18);border:1px solid rgba(201,168,76,0.4);color:var(--gold);font-size:0.7rem;font-weight:700;cursor:help;flex-shrink:0; }
.set-hint-icon:hover { background:rgba(201,168,76,0.32); }
.set-meta { font-size:0.72rem;color:var(--text3); }
.set-emotes { display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:0.6rem;padding:0.6rem 1rem 1rem;border-top:1px solid var(--border2); }
.emote-card { background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:0.5rem;text-align:center; }
.emote-card img { width:100%;height:80px;object-fit:contain; }
.emote-name { font-size:0.7rem;color:var(--text2);margin-top:0.25rem;word-break:break-word; }
.emote-dl { display:inline-block;font-size:0.65rem;color:var(--gold);margin-top:0.25rem;text-decoration:none; }
.emote-dl:hover { text-decoration:underline; }
.set-lock-img-wrap { width:80px;height:80px;margin-bottom:0.5rem;display:none; }
.set-lock-img-wrap img { width:100%;height:100%;object-fit:contain; }
.emote-modal-overlay { position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.82);display:none;align-items:flex-start;justify-content:center;padding:2rem 1rem;overflow-y:auto; }
.emote-modal-overlay.open { display:flex; }
.emote-modal { background:var(--bg2);border:1px solid rgba(201,168,76,0.4);border-radius:12px;padding:1.5rem;max-width:800px;width:100%;box-shadow:0 16px 48px rgba(0,0,0,0.9);position:relative; }
.emote-modal-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem; }
.emote-modal-title { font-family:'Cinzel',serif;color:var(--gold);font-size:1.1rem; }
.emote-modal-close { background:none;border:1px solid var(--border2);color:var(--text2);width:28px;height:28px;border-radius:4px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center; }
.emote-items-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:0.6rem;margin-top:1rem; }
.emote-dl-all { font-size:0.7rem;background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.35);color:var(--gold);padding:3px 10px;border-radius:4px;cursor:pointer;white-space:nowrap; }
</style>

<script>
(function() {
  var SETS = ${setsJson};
  var LOCK_IMG = ${JSON.stringify(lockImgSrc)};

  /* ── Page lock screen ── */
  // Locked state handled by inline <script> + CSS above; just swap lock image if one is uploaded
  if (LOCK_IMG) {
    var lockImgWrap = document.getElementById('emote-lock-img-wrap');
    if (lockImgWrap) lockImgWrap.innerHTML = '<img src="' + LOCK_IMG + '" style="width:100%;height:100%;object-fit:contain">';
  }

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

  function applyLockImg() {
    if (!LOCK_IMG) return;
    document.querySelectorAll('.set-lock-img-wrap').forEach(function(w) {
      w.innerHTML = '<img src="' + LOCK_IMG + '" alt="Locked">';
      w.style.display = 'block';
      var icon = w.nextElementSibling;
      if (icon && icon.classList.contains('set-lock-icon')) icon.style.display = 'none';
    });
  }
  applyLockImg();

  function showHintModal(title, body) {
    var m = document.getElementById('hint-modal');
    document.getElementById('hint-modal-title').textContent = title;
    document.getElementById('hint-modal-body').textContent = body;
    m.style.display = 'flex';
  }
  document.getElementById('hint-modal-close').addEventListener('click', function() {
    document.getElementById('hint-modal').style.display = 'none';
  });
  document.getElementById('hint-modal').addEventListener('click', function(e) {
    if (e.target === this) this.style.display = 'none';
  });

  document.getElementById('page-unlock-hint').addEventListener('click', function(e) {
    e.stopPropagation();
    showHintModal('HOW TO UNLOCK', 'Look closely at each set\\'s hint (?) for a clue about where and how to unlock it.\\n\\nSome require clicking elements on the Characters page. Others need a specific sequence or a hidden discovery.');
  });

  function getLetter(s) { return (s.set_letter || s.name || String(s.set_num)).toUpperCase(); }

  function checkLetterSequence(lclicks) {
    SETS.forEach(function(s) {
      if ((s.unlock_mode || '') !== 'letter_sequence') return;
      if (isUnlocked(s.set_num)) return;
      var seq = (s.unlock_sequence || '').split(',').map(function(x) { return x.trim().toUpperCase(); }).filter(Boolean);
      if (!seq.length) return;
      var tail = lclicks.slice(-seq.length);
      if (tail.length === seq.length && tail.every(function(v, i) { return v === seq[i]; })) {
        localStorage.setItem('kitsu_set_' + s.set_num, '1');
        paint();
        showHintModal('UNLOCKED — ' + (s.name || s.set_num), 'You found the secret! This set is now unlocked. Refresh the page to view its emotes, or click it now.');
      }
    });
  }

  function escH2(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function openEmoteModal(sn, setData) {
    var overlay = document.getElementById('emote-modal-overlay');
    var title = document.getElementById('emote-modal-title');
    var body = document.getElementById('emote-modal-body');
    if (!overlay || !body) return;
    if (title) title.textContent = (setData ? (setData.name || 'Set ' + sn) : 'Set ' + sn) + "'s Emotes";
    body.innerHTML = '<div style="color:var(--text3);font-size:0.82rem">Loading emotes...</div>';
    overlay.classList.add('open');
    fetch('/api/emotes/by-set?set_num=' + sn)
      .then(function(r) { return r.json(); })
      .then(function(d) {
        var emotes = d.emotes || [];
        if (!emotes.length) {
          body.innerHTML = '<p style="color:var(--text3);text-align:center;padding:2rem">No emotes in this set yet.</p>';
          return;
        }
        var html = '<div class="emote-items-grid">';
        emotes.forEach(function(e) {
          html += '<div class="emote-card">'
            + '<img src="' + escH2(e.image_url) + '" alt="' + escH2(e.name) + '" loading="lazy">'
            + '<div class="emote-name">' + escH2(e.name) + '</div>'
            + '<a href="' + escH2(e.image_url) + '" download="' + escH2(e.name) + '" class="emote-dl">Download</a>'
            + '</div>';
        });
        html += '</div>';
        html += '<div style="margin-top:1rem;text-align:center">'
          + '<button class="emote-dl-all" data-action="download-all-emotes" style="font-size:0.8rem;padding:6px 18px">&#11015; Download All</button>'
          + '</div>';
        body.innerHTML = html;
        body._emotes = emotes;
      })
      .catch(function() {
        body.innerHTML = '<p style="color:#e74c3c">Failed to load emotes.</p>';
      });
  }

  document.getElementById('emote-modal-close').addEventListener('click', function() {
    document.getElementById('emote-modal-overlay').classList.remove('open');
  });
  document.getElementById('emote-modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('open');
  });

  document.addEventListener('click', function(e) {
    var dlBtn = e.target.closest('[data-action="download-all-emotes"]');
    if (dlBtn) {
      var modalBody = document.getElementById('emote-modal-body');
      var emotes = modalBody && modalBody._emotes;
      if (emotes && emotes.length) {
        emotes.forEach(function(em, i) {
          setTimeout(function() {
            var a = document.createElement('a');
            a.href = em.image_url;
            a.download = em.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }, i * 150);
        });
      }
      return;
    }

    var hintBtn = e.target.closest('.set-hint-icon');
    if (hintBtn && hintBtn.dataset.set) {
      e.stopPropagation();
      var n = parseInt(hintBtn.dataset.set, 10);
      var s = SETS.find(function(x) { return x.set_num === n; });
      var loc = (s && s.unlock_page) ? s.unlock_page.charAt(0).toUpperCase() + s.unlock_page.slice(1) : 'Unknown';
      var hintBody = 'Location: ' + loc + '\\n\\n' + ((s && s.hint) ? s.hint : 'No hint available yet.');
      showHintModal('HINT — ' + (s ? (s.name || n) : n), hintBody);
      return;
    }

    var letterBtn = e.target.closest('.set-letter-btn');
    if (letterBtn && letterBtn.dataset.letterSet) {
      e.stopPropagation();
      var lsn = parseInt(letterBtn.dataset.letterSet, 10);
      var lsetData = SETS.find(function(x) { return x.set_num === lsn; });
      letterBtn.classList.add('pressed');
      setTimeout(function() { letterBtn.classList.remove('pressed'); }, 160);
      if (lsetData) {
        var letter = getLetter(lsetData);
        if (letter) {
          var lclicks = [];
          try { lclicks = JSON.parse(localStorage.getItem('kitsu_letter_clicks') || '[]'); } catch(ex) {}
          lclicks.push(letter);
          if (lclicks.length > 20) lclicks = lclicks.slice(-20);
          localStorage.setItem('kitsu_letter_clicks', JSON.stringify(lclicks));
          checkLetterSequence(lclicks);
        }
      }
      return;
    }

    var cover = e.target.closest('[data-cover-set]');
    if (!cover) return;
    var sn = parseInt(cover.dataset.coverSet, 10);
    var setData = SETS.find(function(x) { return x.set_num === sn; });
    if (!isUnlocked(sn)) return;
    openEmoteModal(sn, setData);
  });

  document.addEventListener('error', function(e) {
    if (e.target.classList && e.target.classList.contains('img-err-hide')) e.target.style.display = 'none';
  }, true);
})();
</script>
`, 'emotes');
}
