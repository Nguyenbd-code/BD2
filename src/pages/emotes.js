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
  await env.DB.prepare("ALTER TABLE emote_sets ADD COLUMN difficulty TEXT DEFAULT 'easy'").run().catch(()=>{});
  await env.DB.prepare("ALTER TABLE emote_sets ADD COLUMN extra_hint TEXT DEFAULT ''").run().catch(()=>{});
  await env.DB.prepare("ALTER TABLE emote_sets ADD COLUMN display_location TEXT DEFAULT ''").run().catch(()=>{});

  const set1Riddle = "The one I cherish hides a number in the length of her name. Uncover it, then awaken her element with that same number of touches, and when the awakening is complete, seal it with Magic.";
  const set3Riddle = "Some things endure attention.\nOthers break beneath persistence.\n\nA certain symbol watches from above, unmoving and silent.\nMost pass by it without thought.\n\nBut those who insist, repeating the act without stopping,\nmay discover that even fixed things can fall.";
  const set2Riddle = "Six marks lie hidden where expressions live.\nFive belong to the name you seek. One does not.\nPress what feels out of place last.\nBefore it, trace the name that was always there: not spoken in order, but remembered in feeling.\nBegin where silence feels sharp, not soft, and end with what does not belong.";
  const set4Riddle = "I start where silence learns to walk without being seen, I follow the edge of warmth that lingers just behind it, I move into the call that answers the night in numbers rather than voice, I rise into the shadow that wears the shape of command, and I end where thought dissolves beneath a patient, endless depth.";
  const set5Riddle = "The sea answers before the flame remembers.\nWhat is pure stands quietly between shadow and sky, though shadow never comes first.\nThe wind forgets nothing, yet speaks last, and only after the tide has already moved.\n\nYou must press the elements in order.";
  const set6Hint = "Among the many who are remembered, one does not belong to memory.\nNot in strength, not in name… but in presence.\n\nLook carefully through those who should feel familiar.\nSomething exists that was never meant to be part of them.\n\nA portrait that does not match the world around it.\nA face that does not answer to any story.\n\nWhen you find what should not exist, do not treat it as a character.\nOpen it. Listen. Then ask the question it offers you.\n\n\"Who am I?\"\n\nThe answer is already known, it only forgot its shape.";

  const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM emote_sets').first().catch(()=>null);
  if (!r || !r.n) {
    const newSet4Riddle = "In the quiet fields, the small one with quick feet hides when danger comes near.\nThe one with sharp eyes and the one with striped strength both chase through night and shadow.\n\nWhat are they?";
    const set6ExtraHint = "Look for the one who feels almost familiar — a portrait without a story attached to it. The answer is in the name nobody asks for.";
    // Letters are shuffled; sets still spell KITSU when pressed in the right order.
    // set_num → letter map: 1=K, 2=I, 3=S, 4=T, 5=U, 6=M
    const defaults = [
      // set_num, letter, hint, page, target, count, mode, seq, difficulty, extra_hint, display_location
      [1, 'K', set1Riddle, 'characters', 'water', 7, 'count_then_seal', 'magic',                       'easy',   '', ''],
      [2, 'I', set2Riddle, 'emotes',     '',      0, 'letter_sequence', 'K,I,T,S,U',                  'medium', '', "Kitsu's Emotes"],
      [3, 'S', set3Riddle, 'navigation', '',      0, 'nav_icon_tap',    '',                            'easy',   '', '?????'],
      [4, 'T', newSet4Riddle, 'sidebar', '',      0, 'char_sequence',   'rou,dalvi,yuri',              'medium', '', 'Hamburger'],
      [5, 'U', set5Riddle, 'characters', '',      0, 'sequence',        'water,fire,light,dark,wind',  'hard',   '', ''],
      [6, 'M', set6Hint,   'characters', 'synae', 0, 'who_am_i',        'Synae',                       'hard',   set6ExtraHint, ''],
    ];
    for (const [sn, letter, hint, page, target, count, mode, seq, diff, extra, loc] of defaults) {
      await env.DB.prepare('INSERT OR IGNORE INTO emote_sets (set_num, name, set_letter, hint, unlock_page, unlock_target, unlock_count, unlock_mode, unlock_sequence, difficulty, extra_hint, display_location) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind(sn, letter, letter, hint, page, target, count, mode, seq, diff, extra, loc).run().catch(()=>{});
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
    // Migrate set 3 to nav_icon_tap mode (once)
    const set3MigDone = await env.DB.prepare("SELECT data FROM images WHERE key='emote_set3_nav_migrated'").first().catch(()=>null);
    if (!set3MigDone) {
      await env.DB.prepare("INSERT OR IGNORE INTO images (key,data) VALUES ('emote_set3_nav_migrated','1')").run().catch(()=>{});
      await env.DB.prepare("UPDATE emote_sets SET hint=?, unlock_page='navigation', unlock_target='', unlock_count=0, unlock_mode='nav_icon_tap', unlock_sequence='' WHERE set_num=3").bind(set3Riddle).run().catch(()=>{});
    }
    // v3 migration: set 1 -> count_then_seal (+magic), set 4 -> char_sequence
    const v3 = await env.DB.prepare("SELECT data FROM images WHERE key='emote_v3_migrated'").first().catch(()=>null);
    if (!v3) {
      await env.DB.prepare("INSERT OR IGNORE INTO images (key,data) VALUES ('emote_v3_migrated','1')").run().catch(()=>{});
      await env.DB.prepare("UPDATE emote_sets SET hint=?, unlock_mode='count_then_seal', unlock_sequence='magic' WHERE set_num=1").bind(set1Riddle).run().catch(()=>{});
      await env.DB.prepare("UPDATE emote_sets SET hint=?, unlock_page='sidebar', unlock_target='', unlock_count=0, unlock_mode='char_sequence', unlock_sequence='dalvi,rou,tyr,yuri,mamonir' WHERE set_num=4").bind(set4Riddle).run().catch(()=>{});
    }
    // v4 migration: shuffle letters, difficulty tiers, Set 7, new Set I riddle, location overrides, Set M extra hint
    const v4 = await env.DB.prepare("SELECT data FROM images WHERE key='emote_v4_migrated'").first().catch(()=>null);
    if (!v4) {
      await env.DB.prepare("INSERT OR IGNORE INTO images (key,data) VALUES ('emote_v4_migrated','1')").run().catch(()=>{});
      // Letter shuffle — letters still spell KITSU when sets are pressed in the right order.
      // Old → New: S→K (1), T→I (2), K→S (3), I→T (4), M→U (5), U→M (6).
      await env.DB.prepare("UPDATE emote_sets SET name='K', set_letter='K' WHERE set_num=1").run().catch(()=>{});
      await env.DB.prepare("UPDATE emote_sets SET name='I', set_letter='I' WHERE set_num=2").run().catch(()=>{});
      await env.DB.prepare("UPDATE emote_sets SET name='S', set_letter='S' WHERE set_num=3").run().catch(()=>{});
      await env.DB.prepare("UPDATE emote_sets SET name='T', set_letter='T' WHERE set_num=4").run().catch(()=>{});
      await env.DB.prepare("UPDATE emote_sets SET name='U', set_letter='U' WHERE set_num=5").run().catch(()=>{});
      await env.DB.prepare("UPDATE emote_sets SET name='M', set_letter='M' WHERE set_num=6").run().catch(()=>{});
      // Difficulty tiers
      await env.DB.prepare("UPDATE emote_sets SET difficulty='easy'   WHERE set_num IN (1,3)").run().catch(()=>{});
      await env.DB.prepare("UPDATE emote_sets SET difficulty='medium' WHERE set_num IN (2,4)").run().catch(()=>{});
      await env.DB.prepare("UPDATE emote_sets SET difficulty='hard'   WHERE set_num IN (5,6)").run().catch(()=>{});
      // Set 4 (now letter T): new riddle and shorter character sequence
      const newSet4Riddle = "In the quiet fields, the small one with quick feet hides when danger comes near.\nThe one with sharp eyes and the one with striped strength both chase through night and shadow.\n\nWhat are they?";
      await env.DB.prepare("UPDATE emote_sets SET hint=?, unlock_sequence='rou,dalvi,yuri' WHERE set_num=4").bind(newSet4Riddle).run().catch(()=>{});
      // Location overrides shown in the hint modal
      await env.DB.prepare("UPDATE emote_sets SET display_location='?????'        WHERE set_num=3").run().catch(()=>{});
      await env.DB.prepare("UPDATE emote_sets SET display_location='Kitsu''s Emotes' WHERE set_num=2").run().catch(()=>{});
      await env.DB.prepare("UPDATE emote_sets SET display_location='Hamburger'    WHERE set_num=4").run().catch(()=>{});
      // Set M (letter M, set_num=6) gets an extra hint surfaced via a second ? button.
      const set6ExtraHint = "Look for the one who feels almost familiar — a portrait without a story attached to it. The answer is in the name nobody asks for.";
      await env.DB.prepare("UPDATE emote_sets SET extra_hint=? WHERE set_num=6").bind(set6ExtraHint).run().catch(()=>{});
    }
    // Idempotent re-sync of Set 4's riddle text. Lives outside the v4 guard
    // so already-migrated installs pick up the "What are they?" addition.
    const set4RiddleCurrent = "In the quiet fields, the small one with quick feet hides when danger comes near.\nThe one with sharp eyes and the one with striped strength both chase through night and shadow.\n\nWhat are they?";
    await env.DB.prepare("UPDATE emote_sets SET hint=? WHERE set_num=4 AND unlock_mode='char_sequence' AND hint LIKE 'In the quiet fields%'").bind(set4RiddleCurrent).run().catch(()=>{});
  }
}

export async function handleEmotes(request, env) {
  await ensureSchema(env);

  const lockImgRow = await env.DB.prepare("SELECT data FROM images WHERE key='emote_lock_image'").first().catch(() => null);
  const lockImgSrc = lockImgRow ? '/img/emote_lock_image' : '';

  const DEFAULT_LOCK_HINT = 'One character keeps something unusual by their side. The octopus there isn’t just decoration.';
  const lockHintRow = await env.DB.prepare("SELECT data FROM images WHERE key='emote_lock_hint'").first().catch(() => null);
  const lockHintText = (lockHintRow && lockHintRow.data) ? lockHintRow.data : DEFAULT_LOCK_HINT;

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
    extra_hint: s.extra_hint || '',
    display_location: s.display_location || '',
    difficulty: s.difficulty || 'easy',
    unlock_page: s.unlock_page || '',
    unlock_target: s.unlock_target || '',
    unlock_count: s.unlock_count || 7,
    unlock_mode: s.unlock_mode || 'count',
    unlock_sequence: s.unlock_sequence || '',
    unlock_message: s.unlock_message || '',
    cover_key: s.cover_key || '',
    count: (emotesBySet[s.set_num] || []).length,
  }))).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  const setCardFor = (s) => {
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
    const hasExtra = !!(s.extra_hint && String(s.extra_hint).trim());
    return `
    <div class="set-card" data-set="${sn}" data-difficulty="${esc(s.difficulty || 'easy')}">
      <div class="set-cover" data-cover-set="${sn}">
        ${cover ? `<img src="${cover}" alt="${displayName}" class="img-err-hide">` : `<span class="set-cover-placeholder">${displayName}</span>`}
        <div class="set-lock-overlay">
          <div class="set-lock-img-wrap"></div>
          <div class="set-lock-icon">&#128274;</div>
          <div class="set-lock-text">Locked</div>
        </div>
        <div class="set-tier-overlay" style="display:none">
          <div class="set-tier-icon">&#128274;</div>
          <div class="set-tier-text">Locked — complete previous tier first</div>
        </div>
      </div>
      <div class="set-info">
        <div class="set-title">
          <span class="set-letter-btn" data-letter-set="${sn}" tabindex="0">${displayName}</span>
          <span class="set-hint-icon" data-set="${sn}" style="cursor:pointer">?</span>
          ${hasExtra ? `<span class="set-hint-icon set-extra-hint-icon" data-extra-set="${sn}" style="cursor:pointer" title="Extra hint">?</span>` : ''}
        </div>
        <div class="set-meta">${list.length} emote${list.length === 1 ? '' : 's'}</div>
      </div>
      <div class="set-emotes" style="display:none">
        ${emoteHtml || '<div style="text-align:center;color:var(--text3);padding:1.5rem">No emotes in this set yet.</div>'}
      </div>
    </div>`;
  };
  const byDifficulty = { easy: [], medium: [], hard: [] };
  sets.forEach(s => {
    const d = (s.difficulty || 'easy').toLowerCase();
    (byDifficulty[d] || byDifficulty.easy).push(s);
  });
  const difficultyLabels = {
    easy:   { label: 'Easy',   sub: 'Open from the start' },
    medium: { label: 'Medium', sub: 'Locked until every Easy set is unlocked' },
    hard:   { label: 'Hard',   sub: 'Locked until every Medium set is unlocked' },
  };
  const setCards = ['easy', 'medium', 'hard'].map(tier => {
    const list = byDifficulty[tier];
    if (!list || !list.length) return '';
    const meta = difficultyLabels[tier];
    return `
      <div class="diff-tier" data-tier="${tier}">
        <div class="diff-tier-head">
          <span class="diff-tier-label diff-tier-label-${tier}">${meta.label}</span>
          <span class="diff-tier-sub">${meta.sub}</span>
        </div>
        <div class="sets-grid">${list.map(setCardFor).join('')}</div>
      </div>`;
  }).join('');

  return await layout("Kitsu's Emotes", `
<!-- Page lock screen — shown only if kitsu_unlocked not set -->
<div id="emote-lock-screen" style="display:none;position:fixed;inset:0;z-index:10000;background:var(--bg);flex-direction:column;align-items:center;justify-content:center;padding:2rem;overflow-y:auto">
  <div style="max-width:460px;width:100%;text-align:center;position:relative">
    <button id="lock-hint-btn" type="button" aria-label="How to unlock" style="position:absolute;top:0;right:0;width:32px;height:32px;border-radius:50%;background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.45);color:var(--gold);font-family:'Cinzel',serif;font-size:1rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1">?</button>
    <div id="emote-lock-img-wrap" style="width:130px;height:130px;margin:0 auto 1.5rem;border-radius:12px;overflow:hidden;background:var(--bg3);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center">
      <span style="font-size:3.5rem">&#128274;</span>
    </div>
    <div style="font-family:'Cinzel',serif;font-size:1.3rem;color:var(--gold);margin-bottom:0.35rem;letter-spacing:0.04em">Kitsu's Emotes</div>
    <div style="font-size:0.75rem;color:var(--gold2);font-family:'Cinzel',serif;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:1rem">Secret Sets</div>
    <div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:8px;padding:1rem 1.25rem;margin-bottom:1.5rem;text-align:left">
      <div style="font-size:0.72rem;color:var(--gold);font-family:'Cinzel',serif;letter-spacing:0.06em;margin-bottom:0.4rem">LOCATION: HOME</div>
      <div style="font-size:0.85rem;color:var(--text2);line-height:1.6;white-space:pre-line">${esc(lockHintText)}</div>
    </div>
    <a href="/" style="display:block;width:100%;box-sizing:border-box;text-align:center;background:var(--gold);color:#0a0a0f;border:none;padding:0.7rem;border-radius:6px;font-weight:700;cursor:pointer;font-family:'Cinzel',serif;font-size:0.9rem;letter-spacing:0.06em;text-decoration:none">Go to Home Page</a>
    <div id="lock-hint-bubble" style="display:none;margin-top:1rem;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.35);border-radius:6px;padding:0.75rem 1rem;font-size:0.8rem;color:var(--gold2);font-style:italic;line-height:1.6">hit the red rabbit twice and the green rabbit thrice</div>
  </div>
</div>
<script>(function(){
  var btn = document.getElementById('lock-hint-btn');
  var bubble = document.getElementById('lock-hint-bubble');
  if (btn && bubble) {
    btn.addEventListener('click', function(){
      bubble.style.display = bubble.style.display === 'none' ? 'block' : 'none';
    });
  }
})();</script>

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

<div class="diff-tiers">${setCards}</div>
</div><!-- /emote-page-content -->

<style>
.diff-tiers { max-width:1200px;margin:0 auto;padding:0 1.5rem 3rem;display:flex;flex-direction:column;gap:2.25rem; }
.diff-tier-head { display:flex;align-items:baseline;gap:0.75rem;margin-bottom:0.85rem;padding-bottom:0.5rem;border-bottom:1px solid rgba(201,168,76,0.12); }
.diff-tier-label { font-family:'Fraunces',Georgia,serif;font-weight:600;font-variation-settings:'opsz' 96;font-size:1.4rem;letter-spacing:-0.01em;color:#eef0fa; }
.diff-tier-label-easy   { color:#7cd9a1; }
.diff-tier-label-medium { color:#e8c76a; }
.diff-tier-label-hard   { color:#e88a7d; }
.diff-tier-sub { font-family:'Inter',system-ui,sans-serif;font-size:0.7rem;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:rgba(220,228,245,0.42); }
.diff-tier.tier-locked .diff-tier-sub { color:rgba(232,138,125,0.6); }
.sets-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem; }
.set-card.tier-locked { filter:grayscale(0.7);opacity:0.55;pointer-events:none; }
.set-card.tier-locked .set-tier-overlay { display:flex !important;position:absolute;inset:0;background:rgba(8,8,14,0.78);align-items:center;justify-content:center;flex-direction:column;gap:0.4rem;color:#e88a7d;font-family:'Inter',system-ui,sans-serif;font-size:0.7rem;text-align:center;padding:1rem;letter-spacing:0.05em;z-index:5; }
.set-card.tier-locked .set-tier-icon { font-size:1.6rem;line-height:1; }
.set-card.tier-locked .set-cover { position:relative; }
.set-card.tier-locked .set-lock-overlay { display:none !important; }
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
.emote-modal-overlay { position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.82);display:none;align-items:center;justify-content:center;padding:2rem 1rem;overflow-y:auto; }
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
  function setsOfDifficulty(d) { return SETS.filter(function(s){ return (s.difficulty||'easy') === d; }); }
  function allUnlocked(list) { return list.length > 0 && list.every(function(s){ return isUnlocked(s.set_num); }); }
  // A difficulty tier is *available* (its puzzles can fire) only after every set in the previous tier is solved.
  function tierUnlocked(d) {
    if (d === 'easy') return true;
    if (d === 'medium') return allUnlocked(setsOfDifficulty('easy'));
    if (d === 'hard')   return allUnlocked(setsOfDifficulty('medium'));
    return true;
  }
  function isSetAvailable(setNum) {
    var s = SETS.find(function(x){ return x.set_num === setNum; });
    if (!s) return false;
    return tierUnlocked(s.difficulty || 'easy');
  }
  // Expose for layout.js (char-circle widget) and characters.js (who_am_i).
  window.__BD2_SET_AVAILABLE = isSetAvailable;
  window.__BD2_TIER_UNLOCKED = tierUnlocked;
  function paint() {
    SETS.forEach(function(s) {
      var card = document.querySelector('.set-card[data-set="' + s.set_num + '"]');
      if (!card) return;
      if (isUnlocked(s.set_num)) card.classList.add('unlocked');
      else card.classList.remove('unlocked');
      // Tier-locked cards get a stronger lock state that overlays the standard one.
      var tier = (s.difficulty || 'easy');
      var avail = tierUnlocked(tier);
      card.classList.toggle('tier-locked', !avail && !isUnlocked(s.set_num));
    });
    document.querySelectorAll('.diff-tier').forEach(function(t){
      var d = t.dataset.tier;
      t.classList.toggle('tier-locked', !tierUnlocked(d));
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
    showHintModal('HOW TO UNLOCK', 'Look closely at each set\\'s hint (?) for a clue about where and how to unlock it.');
  });

  function getLetter(s) { return (s.set_letter || s.name || String(s.set_num)).toUpperCase(); }

  function checkLetterSequence(lclicks) {
    SETS.forEach(function(s) {
      if ((s.unlock_mode || '') !== 'letter_sequence') return;
      if (isUnlocked(s.set_num)) return;
      if (!isSetAvailable(s.set_num)) return;
      var seq = (s.unlock_sequence || '').split(',').map(function(x) { return x.trim().toUpperCase(); }).filter(Boolean);
      if (!seq.length) return;
      var tail = lclicks.slice(-seq.length);
      if (tail.length === seq.length && tail.every(function(v, i) { return v === seq[i]; })) {
        localStorage.setItem('kitsu_set_' + s.set_num, '1');
        paint();
        if (window.showSetUnlockModal) {
          window.showSetUnlockModal(s.set_num, s.name || ('Set ' + s.set_num), s.unlock_message || 'You found the secret! This set is now unlocked.');
        }
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

    var extraBtn = e.target.closest('.set-extra-hint-icon');
    if (extraBtn && extraBtn.dataset.extraSet) {
      e.stopPropagation();
      var en = parseInt(extraBtn.dataset.extraSet, 10);
      var es = SETS.find(function(x){ return x.set_num === en; });
      if (es && !isSetAvailable(en)) {
        showHintModal('LOCKED', 'This hint becomes available once the previous difficulty tier is fully unlocked.');
        return;
      }
      var extraBody = (es && es.extra_hint) ? es.extra_hint : 'No extra hint available yet.';
      showHintModal('EXTRA HINT — ' + (es ? (es.name || en) : en), extraBody);
      return;
    }

    var hintBtn = e.target.closest('.set-hint-icon');
    if (hintBtn && hintBtn.dataset.set) {
      e.stopPropagation();
      var n = parseInt(hintBtn.dataset.set, 10);
      var s = SETS.find(function(x) { return x.set_num === n; });
      if (s && !isSetAvailable(n)) {
        showHintModal('LOCKED', 'This puzzle is sealed until the previous difficulty tier is fully unlocked. Solve those first.');
        return;
      }
      var loc = (s && s.display_location)
        ? s.display_location
        : ((s && s.unlock_page) ? s.unlock_page.charAt(0).toUpperCase() + s.unlock_page.slice(1) : 'Unknown');
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
`, 'emotes', env);
}
