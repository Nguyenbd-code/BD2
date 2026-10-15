import { layout, esc } from '../layout/layout.js';
import { readProgress } from '../lib/kitsu.js';
import { memoTTL } from '../lib/memo.js';

// Module-level latch — Workers reuses module state across requests within an
// isolate, so ensureSchema only fires the first time the isolate handles
// /emotes.
let _schemaReady = false;

// Any database that already shows this marker can skip the schema setup on
// cold-isolate startup, turning ~10 D1 round-trips into 1.
const SCHEMA_MARKER_KEY = 'emote_schema_v10';

async function ensureSchema(env) {
  if (_schemaReady) return;
  // Fast path — if the umbrella marker is present, all migrations have
  // already run on this DB and there is nothing to do.
  const lock = await env.DB.prepare('SELECT data FROM images WHERE key=?')
    .bind(SCHEMA_MARKER_KEY).first().catch(() => null);
  if (lock) { _schemaReady = true; return; }
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
  // extra_sequence/extra_reveal: optional nested sub-puzzle inside extra_hint.
  // When extra_sequence is a comma-list of char-circle slugs and the player
  // matches it in the side menu (checked by /api/kitsu/attempt), extra_reveal
  // gets appended to the extra_hint modal. Per-set so admin can drive it
  // without code changes.
  await env.DB.prepare("ALTER TABLE emote_sets ADD COLUMN extra_sequence TEXT DEFAULT ''").run().catch(()=>{});
  await env.DB.prepare("ALTER TABLE emote_sets ADD COLUMN extra_reveal TEXT DEFAULT ''").run().catch(()=>{});

  // Puzzle content (riddles, unlock modes, answers) is managed from the admin
  // panel and lives only in D1. Older builds seeded and migrated it from
  // here; every live database already carries those changes (see the
  // emote_schema_v10 marker), so that code has been removed.

  // Stamp the umbrella marker so future cold isolates can take the fast path.
  await env.DB.prepare('INSERT OR REPLACE INTO images (key,data) VALUES (?,?)')
    .bind(SCHEMA_MARKER_KEY, '1').run().catch(()=>{});
  _schemaReady = true;
}

export async function handleEmotes(request, env) {
  await ensureSchema(env);

  const DEFAULT_LOCK_HINT = 'One character keeps something unusual by their side. The octopus there isn’t just decoration.';

  // Cookie-gate: if the player hasn't solved the secret code (set by /home),
  // skip every D1 read for the puzzle content and ship a slim lock-screen
  // page. Saves ~60% of the HTML payload + 6 image lookups for locked users.
  // The Home secret is recorded in the signed kitsu_progress cookie, so the
  // server can trust it.
  const isUnlocked = (await readProgress(request, env)).home;

  // Full-HTML memoisation. The rendered page is identical for every visitor
  // sharing the same lock state (locked vs unlocked) — neither path embeds
  // per-user data; each player's set progress is read in the browser from
  // their own signed cookie. Cache hits
  // bypass D1, the schema check, the JSON build, and layout() entirely.
  // 30s TTL; admin writes invalidate via handleAdminApi → invalidateMemo.
  const cacheKey = `emotes:html:${isUnlocked ? 'u' : 'l'}`;
  const html = await memoTTL(cacheKey, 30_000, () => buildEmotesHtml(isUnlocked, env, request, DEFAULT_LOCK_HINT));
  return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

async function buildEmotesHtml(isUnlocked, env, request, DEFAULT_LOCK_HINT) {
  if (!isUnlocked) {
    const lockHintRow = await env.DB.prepare("SELECT data FROM images WHERE key='emote_lock_hint'").first().catch(() => null);
    const lockHintText = (lockHintRow && lockHintRow.data) ? lockHintRow.data : DEFAULT_LOCK_HINT;
    const resp = await renderLocked(lockHintText, env, request);
    return await resp.text();
  }
  return await buildUnlockedEmotesHtml(env, request, DEFAULT_LOCK_HINT);
}

async function buildUnlockedEmotesHtml(env, request, DEFAULT_LOCK_HINT) {

  // 30s in-memory cache wrapping a single D1 batch. On warm isolate cache
  // hits the entire page render skips D1; on misses we still get one HTTP
  // round-trip (batch) instead of five parallel ones. Falls back to
  // per-statement reads if batch errors. Admin edits propagate within 30s.
  const { lockImgRow, lockHintRow, setsRes, countsRes, fallbackCoverRes } =
    await memoTTL('emotes:page-reads', 30_000, async () => {
      let li = null, lh = null;
      let sr = { results: [] }, cr = { results: [] }, fr = { results: [] };
      try {
        const batch = await env.DB.batch([
          env.DB.prepare("SELECT data FROM images WHERE key='emote_lock_image'"),
          env.DB.prepare("SELECT data FROM images WHERE key='emote_lock_hint'"),
          env.DB.prepare('SELECT * FROM emote_sets ORDER BY set_num'),
          env.DB.prepare('SELECT set_num, COUNT(*) AS c FROM emotes GROUP BY set_num'),
          env.DB.prepare("SELECT set_num, image_url FROM emotes WHERE id IN (SELECT MIN(id) FROM emotes GROUP BY set_num)"),
        ]);
        li = (batch[0] && batch[0].results && batch[0].results[0]) || null;
        lh = (batch[1] && batch[1].results && batch[1].results[0]) || null;
        sr = batch[2] || sr;
        cr = batch[3] || cr;
        fr = batch[4] || fr;
      } catch {
        [li, lh, sr, cr, fr] = await Promise.all([
          env.DB.prepare("SELECT data FROM images WHERE key='emote_lock_image'").first().catch(() => null),
          env.DB.prepare("SELECT data FROM images WHERE key='emote_lock_hint'").first().catch(() => null),
          env.DB.prepare('SELECT * FROM emote_sets ORDER BY set_num').all().catch(() => ({results:[]})),
          env.DB.prepare('SELECT set_num, COUNT(*) AS c FROM emotes GROUP BY set_num').all().catch(() => ({results:[]})),
          env.DB.prepare("SELECT set_num, image_url FROM emotes WHERE id IN (SELECT MIN(id) FROM emotes GROUP BY set_num)").all().catch(() => ({results:[]})),
        ]);
      }
      return { lockImgRow: li, lockHintRow: lh, setsRes: sr, countsRes: cr, fallbackCoverRes: fr };
    });

  const lockImgSrc = lockImgRow ? '/img/emote_lock_image' : '';
  const lockHintText = (lockHintRow && lockHintRow.data) ? lockHintRow.data : DEFAULT_LOCK_HINT;
  const sets = setsRes.results || [];

  // Build a {set_num -> count} map and a {set_num -> first-image-url} map.
  // emotesBySet keeps its previous shape — an array — but the array entries
  // are placeholders; the only consumer of it on the server side reads
  // emotesBySet[sn].length and emotesBySet[sn][0]?.image_url.
  const countMap = {};
  for (const row of (countsRes.results || [])) countMap[row.set_num || 0] = row.c || 0;
  const firstCoverMap = {};
  for (const row of (fallbackCoverRes.results || [])) firstCoverMap[row.set_num || 0] = row.image_url || '';
  const emotesBySet = {};
  for (const s of sets) {
    const sn = s.set_num;
    const count = countMap[sn] || 0;
    const arr = new Array(count);
    if (count > 0 && firstCoverMap[sn]) arr[0] = { image_url: firstCoverMap[sn] };
    emotesBySet[sn] = arr;
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
    unlock_count: s.unlock_count || 7,
    unlock_mode: s.unlock_mode || 'count',
    unlock_message: s.unlock_message || '',
    cover_key: s.cover_key || '',
    count: (emotesBySet[s.set_num] || []).length,
  }))).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  const setCardFor = (s) => {
    const sn = s.set_num;
    const list = emotesBySet[sn] || [];
    const cover = s.cover_key ? `/img/${esc(s.cover_key)}` : (list[0] ? esc(list[0].image_url) : '');
    const displayName = esc(s.name || String(sn));
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
  const setCards = ['easy', 'medium', 'hard'].map((tier, ti) => {
    const list = byDifficulty[tier];
    if (!list || !list.length) return '';
    const meta = difficultyLabels[tier];
    // Stagger ties: every set card across the page reveals in sequence, so
    // Easy → Medium → Hard cascades on first paint.
    const baseOffset = ti * (byDifficulty.easy.length + (ti >= 1 ? byDifficulty.medium.length : 0));
    return `
      <div class="diff-tier" data-tier="${tier}">
        <div class="diff-tier-head">
          <span class="diff-tier-label diff-tier-label-${tier}">${meta.label}</span>
          <span class="diff-tier-sub">${meta.sub}</span>
        </div>
        <div class="sets-grid" data-codex-reveal>${list.map((s, si) => `<div style="--codex-i:${baseOffset + si}">${setCardFor(s)}</div>`).join('')}</div>
      </div>`;
  }).join('');

  const resp = await layout("Kitsu's Emotes", `
<!-- Page lock screen — shown only until the Home secret is solved -->
<div id="emote-lock-screen" style="display:none;position:fixed;inset:0;z-index:90;background:var(--bg);flex-direction:column;align-items:center;justify-content:center;padding:2rem;overflow-y:auto">
  <div style="max-width:460px;width:100%;text-align:center;position:relative">
    <button id="lock-hint-btn" type="button" aria-label="How to unlock" style="position:absolute;top:0;right:0;width:32px;height:32px;border-radius:50%;background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.45);color:var(--gold);font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:1rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1">?</button>
    <div id="emote-lock-img-wrap" style="width:130px;height:130px;margin:0 auto 1.5rem;border-radius:12px;overflow:hidden;background:var(--bg3);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center">
      <span style="font-size:3.5rem">&#128274;</span>
    </div>
    <div style="font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:1.3rem;color:var(--gold);margin-bottom:0.35rem;letter-spacing:0.04em">Kitsu's Emotes</div>
    <div style="font-size:0.75rem;color:var(--gold2);font-family:'IBM Plex Sans',system-ui,sans-serif;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:1rem">Secret Sets</div>
    <div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:8px;padding:1rem 1.25rem;margin-bottom:1.5rem;text-align:left">
      <div style="font-size:0.72rem;color:var(--gold);font-family:'IBM Plex Sans',system-ui,sans-serif;letter-spacing:0.06em;margin-bottom:0.4rem">LOCATION: HOME</div>
      <div style="font-size:0.85rem;color:var(--text2);line-height:1.6;white-space:pre-line">${esc(lockHintText)}</div>
    </div>
    <a href="/" style="display:block;width:100%;box-sizing:border-box;text-align:center;background:var(--gold);color:#0a0a0f;border:none;padding:0.7rem;border-radius:6px;font-weight:700;cursor:pointer;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.9rem;letter-spacing:0.06em;text-decoration:none">Go to Home Page</a>
    <div id="lock-hint-bubble" style="display:none;margin-top:1rem;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.35);border-radius:6px;padding:0.75rem 1rem;font-size:0.8rem;color:var(--gold2);font-style:italic;line-height:1.6;text-align:left">
      <div style="font-size:0.7rem;color:var(--gold);font-family:'IBM Plex Sans',system-ui,sans-serif;letter-spacing:0.06em;margin-bottom:0.4rem;text-transform:uppercase;font-style:normal">Location: Side Menu</div>
      Hit the red rabbit twice and the green rabbit thrice.
    </div>
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

<script>(function(){if(!(window.kitsuHome&&window.kitsuHome())){var ls=document.getElementById('emote-lock-screen');var pc=document.getElementById('emote-page-content');if(ls)ls.style.display='flex';if(pc)pc.style.display='none';}})();</script>
<!-- Main page content (hidden until unlocked) -->
<div id="emote-page-content">
<div class="hero" style="padding-bottom:2rem">
  <div class="hero-tag">Secret Sets</div>
  <h1>Kitsu's <span>Emotes</span></h1>
  <p>Six locked sets. Each one hides behind a small secret somewhere on the site.</p>
  <button id="page-unlock-hint" style="margin-top:0.75rem;display:inline-flex;align-items:center;gap:0.5rem;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.3);border-radius:6px;padding:7px 14px;cursor:pointer;font-family:'IBM Plex Sans',system-ui,sans-serif;color:var(--gold);font-size:0.88rem;letter-spacing:0.04em">
    Find the Secret to Unlock
    <span class="set-hint-icon" style="flex-shrink:0;pointer-events:none">?</span>
  </button>
</div>

<div id="hint-modal" class="hint-modal">
  <div class="hint-modal-card">
    <div class="hint-modal-eyebrow"><span class="hint-modal-rule"></span><span id="hint-modal-title">Riddle</span><span class="hint-modal-rule"></span></div>
    <div id="hint-modal-body" class="hint-modal-body"></div>
    <button id="hint-modal-close" class="btn-ghost hint-modal-close">Dismiss</button>
  </div>
</div>

<div id="emote-modal-overlay" class="emote-modal-overlay">
  <div class="emote-modal">
    <div class="emote-modal-header">
      <div class="emote-modal-title" id="emote-modal-title">Set</div>
      <button class="emote-modal-close" id="emote-modal-close" aria-label="Close emote viewer">&#10005;</button>
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
.diff-tier-sub { font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.7rem;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:rgba(220,228,245,0.42); }
.diff-tier.tier-locked .diff-tier-sub { color:rgba(232,138,125,0.6); }
.sets-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem; }
.set-card.tier-locked { filter:grayscale(0.7);opacity:0.55;cursor:default; }
.set-card.tier-locked .set-cover,
.set-card.tier-locked .set-hint-icon { pointer-events:none;cursor:default; }
/* Letter buttons stay clickable on tier-locked cards so the letter_sequence
   puzzle (Set T) can still receive K-I-T-S-U input — U + M live on Hard. */
.set-card.tier-locked .set-letter-btn { pointer-events:auto;filter:none;opacity:1;cursor:pointer; }
.set-card.tier-locked .set-tier-overlay { display:flex !important;position:absolute;inset:0;background:rgba(8,8,14,0.78);align-items:center;justify-content:center;flex-direction:column;gap:0.4rem;color:#e88a7d;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.7rem;text-align:center;padding:1rem;letter-spacing:0.05em;z-index:5; }
.set-card.tier-locked .set-tier-icon { font-size:1.6rem;line-height:1; }
.set-card.tier-locked .set-cover { position:relative; }
.set-card.tier-locked .set-lock-overlay { display:none !important; }
/* Emote set card — codex-aligned. Ink-blue surface, no border, layered
   drop shadow + 1px gold edge ring that brightens on hover. Unlocked
   variant swaps to a green edge to signal completion at a glance. */
.set-card { position:relative;background:#14141e;border-radius:4px;overflow:hidden;cursor:pointer;box-shadow:0 1px 0 rgba(220,230,255,0.06) inset,0 0 0 1px rgba(220,230,255,0.05),0 8px 22px rgba(0,0,0,0.5),0 2px 4px rgba(0,0,0,0.55);transition:transform 0.22s cubic-bezier(0.22,1,0.36,1),box-shadow 0.28s ease;isolation:isolate; }
.set-card:hover { transform:translateY(-3px);box-shadow:0 1px 0 rgba(220,230,255,0.08) inset,0 0 0 1px rgba(201,168,76,0.5),0 16px 36px rgba(0,0,0,0.6),0 0 28px rgba(201,168,76,0.18); }
.set-card.unlocked { box-shadow:0 1px 0 rgba(220,230,255,0.06) inset,0 0 0 1px rgba(46,204,113,0.4),0 8px 22px rgba(0,0,0,0.5),0 2px 4px rgba(0,0,0,0.55); }
.set-card.unlocked:hover { box-shadow:0 1px 0 rgba(220,230,255,0.08) inset,0 0 0 1px rgba(46,204,113,0.7),0 16px 36px rgba(0,0,0,0.6),0 0 28px rgba(46,204,113,0.22); }
.set-card.open .set-emotes { display:grid !important; }
.set-cover { position:relative;height:180px;background:#0e0c14;overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:pointer; }
.set-cover img { width:100%;height:100%;object-fit:cover;transition:transform 0.6s cubic-bezier(0.22,1,0.36,1); }
.set-card:hover .set-cover img { transform:scale(1.04); }
.set-cover-placeholder { font-family:'Fraunces',Georgia,serif;font-weight:600;font-variation-settings:'opsz' 144;color:rgba(201,168,76,0.18);font-size:4rem;letter-spacing:-0.04em; }
.set-lock-overlay { position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.55) 0%,rgba(8,8,14,0.85) 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;color:rgba(220,228,245,0.65);transition:opacity 0.25s ease;gap:0.4rem; }
.set-card.unlocked .set-lock-overlay { display:none; }
.set-lock-icon { font-size:1.8rem;line-height:1;opacity:0.85; }
.set-lock-text { font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.66rem;font-weight:600;letter-spacing:0.32em;text-transform:uppercase;color:var(--gold2); }
.set-info { padding:0.85rem 1.1rem;display:flex;align-items:center;justify-content:space-between;gap:0.5rem;border-top:1px solid rgba(220,230,255,0.05); }
.set-title { font-family:'Fraunces',Georgia,serif;font-weight:600;font-variation-settings:'opsz' 96;font-size:1rem;color:var(--gold2);display:flex;align-items:center;gap:0.55rem;letter-spacing:-0.005em; }
.set-letter-btn { display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:28px;padding:0 9px;border-radius:3px;background:linear-gradient(180deg,rgba(232,199,106,0.18) 0%,rgba(160,120,48,0.14) 100%);border:1px solid rgba(201,168,76,0.4);color:var(--gold2);cursor:pointer;user-select:none;font-family:'Fraunces',Georgia,serif;font-weight:600;font-variation-settings:'opsz' 36;font-size:0.95rem;line-height:1;transition:transform 0.1s ease,filter 0.18s ease,box-shadow 0.18s ease;box-shadow:inset 0 1px 0 rgba(255,235,200,0.3),0 1px 2px rgba(0,0,0,0.4); }
.set-letter-btn:hover { filter:brightness(1.1);box-shadow:inset 0 1px 0 rgba(255,235,200,0.4),0 1px 2px rgba(0,0,0,0.5),0 0 12px rgba(201,168,76,0.3); }
.set-letter-btn:active, .set-letter-btn.pressed { transform:translateY(1px) scale(0.96);box-shadow:inset 0 2px 4px rgba(0,0,0,0.5); }
.set-hint-icon { display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:transparent;border:1px solid rgba(201,168,76,0.4);color:var(--gold2);font-family:'Fraunces',Georgia,serif;font-style:italic;font-size:0.78rem;font-weight:500;cursor:help;flex-shrink:0;transition:background 0.18s ease,border-color 0.18s ease; }
.set-hint-icon:hover { background:rgba(201,168,76,0.12);border-color:var(--gold); }
.set-meta { font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.62rem;font-weight:500;letter-spacing:0.24em;text-transform:uppercase;color:rgba(220,228,245,0.42); }
.set-emotes { display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:0.6rem;padding:0.75rem 1rem 1rem;border-top:1px solid rgba(220,230,255,0.05); }
.emote-card { background:#0e0c14;border-radius:3px;padding:0.5rem;text-align:center;box-shadow:0 0 0 1px rgba(220,230,255,0.05); }
.emote-card img { width:100%;height:80px;object-fit:contain; }
.emote-name { font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.7rem;color:rgba(220,228,245,0.7);margin-top:0.3rem;word-break:break-word; }
.emote-dl { display:inline-block;font-size:0.65rem;color:var(--gold);margin-top:0.25rem;text-decoration:none; }
.emote-dl:hover { text-decoration:underline; }
.set-lock-img-wrap { width:80px;height:80px;margin-bottom:0.5rem;display:none; }
.set-lock-img-wrap img { width:100%;height:100%;object-fit:contain; }
/* Emote-gallery modal — opens when an unlocked set cover is tapped. Same
   codex card pattern as the unlock / hint modals. */
.emote-modal-overlay { position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.86);display:none;align-items:center;justify-content:center;padding:2rem 1rem;overflow-y:auto;animation:hint-modal-fade 0.22s ease-out; }
.emote-modal-overlay.open { display:flex; }
.emote-modal { position:relative;background:#14141e;border-radius:4px;padding:1.75rem 1.85rem;max-width:840px;width:100%;isolation:isolate;box-shadow:0 1px 0 rgba(220,230,255,0.07) inset,0 0 0 1px rgba(220,230,255,0.05),0 24px 60px rgba(0,0,0,0.75),0 0 36px rgba(201,168,76,0.16);animation:hint-modal-in 0.32s cubic-bezier(0.22,1,0.36,1); }
.emote-modal::after { content:'';position:absolute;inset:0;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cg fill='none' stroke='%23c9a84c' stroke-width='0.4' opacity='0.45'%3E%3Cpath d='M0 6 L0 0 L6 0'/%3E%3Cpath d='M94 0 L100 0 L100 6'/%3E%3Cpath d='M100 94 L100 100 L94 100'/%3E%3Cpath d='M6 100 L0 100 L0 94'/%3E%3C/g%3E%3C/svg%3E");background-size:100% 100%;border-radius:4px; }
.emote-modal > * { position:relative;z-index:1; }
.emote-modal-header { display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid rgba(220,230,255,0.06); }
.emote-modal-title { font-family:'Fraunces',Georgia,serif;font-weight:500;font-variation-settings:'opsz' 96;color:#eef0fa;font-size:1.4rem;letter-spacing:-0.012em; }
.emote-modal-close { background:transparent;border:1px solid rgba(220,230,255,0.12);color:rgba(220,228,245,0.6);width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:0.95rem;display:flex;align-items:center;justify-content:center;line-height:1;transition:all 0.18s ease; }
.emote-modal-close:hover { border-color:var(--gold);color:var(--gold2);background:rgba(201,168,76,0.08);transform:scale(1.06); }
.emote-items-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:0.7rem;margin-top:0.75rem; }
.emote-dl-all { font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.66rem;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;background:transparent;border:1px solid rgba(201,168,76,0.4);color:var(--gold2);padding:6px 14px;border-radius:3px;cursor:pointer;white-space:nowrap;transition:all 0.18s ease; }
.emote-dl-all:hover { background:rgba(201,168,76,0.1);border-color:var(--gold);transform:translateY(-1px); }
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

  function isUnlocked(n) { return window.kitsuHas(n); }
  // Sub-Riddle reveal texts the player has earned, fetched from the server.
  var REVEALS = {};
  if (window.KITSU && window.KITSU.reveals.length) {
    fetch('/api/kitsu/state', { credentials: 'same-origin' }).then(function(r){ return r.json(); })
      .then(function(d){ REVEALS = (d && d.reveals) || {}; }).catch(function(){});
  }
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
    showHintModal('HOW TO UNLOCK', 'Tap the ? on each set for its riddle. Some sets also have a Sub-Riddle (the second ?) that hides an extra clue.');
  });

  function getLetter(s) { return (s.set_letter || s.name || String(s.set_num)).toUpperCase(); }

  function checkLetterSequence(lclicks) {
    var live = SETS.some(function(s) {
      return (s.unlock_mode || '') === 'letter_sequence' && !isUnlocked(s.set_num) && isSetAvailable(s.set_num);
    });
    if (!live) return;
    window.kitsuAttempt({ kind: 'letters', events: lclicks }).then(function(d) {
      if (!d.unlocked.length) return;
      localStorage.removeItem('kitsu_letter_clicks');
      paint();
      var won = d.unlocked[0];
      if (window.showSetUnlockModal) window.showSetUnlockModal(won.set_num, won.name, won.message);
    });
  }

  function escH2(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function openEmoteModal(sn, setData) {
    var overlay = document.getElementById('emote-modal-overlay');
    var title = document.getElementById('emote-modal-title');
    var body = document.getElementById('emote-modal-body');
    if (!overlay || !body) return;
    if (title) title.textContent = (setData ? (setData.name || 'Set ' + sn) : 'Set ' + sn) + "'s Emotes";
    body.innerHTML = '<div class="loading-state"><span class="loading-spinner"></span>Loading emotes</div>';
    overlay.classList.add('open');
    fetch('/api/emotes/by-set?set_num=' + sn)
      .then(function(r) { return r.json(); })
      .then(function(d) {
        var emotes = d.emotes || [];
        if (!emotes.length) {
          body.innerHTML = '<div class="empty-state"><div class="empty-state-eyebrow">Empty</div><div class="empty-state-title">No emotes in this set yet</div><div class="empty-state-sub">Check back once Kitsu adds more.</div></div>';
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
        showHintModal('LOCKED', 'This Sub-Riddle becomes available once the previous difficulty tier is fully unlocked.');
        return;
      }
      var extraBody = 'Location: Side Menu\\n\\n' + ((es && es.extra_hint) ? es.extra_hint : 'No Sub-Riddle available yet.');
      // Generic extra-reveal append. Any set whose extra_sequence has been
      // matched in the char-circle gets its extra_reveal appended below the
      // primary extra_hint via an em-dash divider.
      if (es && REVEALS[es.set_num]) {
        extraBody += '\\n\\n— — —\\n\\n' + REVEALS[es.set_num];
      }
      showHintModal('SUB-RIDDLE — ' + (es ? (es.name || en) : en), extraBody);
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
      showHintModal('RIDDLE — ' + (s ? (s.name || n) : n), hintBody);
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
`, 'emotes', env, request);
  return await resp.text();
}

// Slim render for locked users — just the lock screen + the layout chrome.
// No puzzle content, no setsJson, no image lookups for set covers. The
// /styles.css link in <head> still loads cached, and the side-nav circle
// (where the rabbit-tap shortcut lives) comes from layout.js so it's still
// fully functional for the player.
async function renderLocked(lockHintText, env, request) {
  return await layout("Kitsu's Emotes", `
<div id="emote-lock-screen" style="display:flex;position:fixed;inset:0;z-index:90;background:var(--bg);flex-direction:column;align-items:center;justify-content:center;padding:2rem;overflow-y:auto">
  <div style="max-width:460px;width:100%;text-align:center;position:relative">
    <button id="lock-hint-btn" type="button" aria-label="How to unlock" style="position:absolute;top:0;right:0;width:32px;height:32px;border-radius:50%;background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.45);color:var(--gold);font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:1rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1">?</button>
    <div id="emote-lock-img-wrap" style="width:130px;height:130px;margin:0 auto 1.5rem;border-radius:12px;overflow:hidden;background:var(--bg3);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center">
      <span style="font-size:3.5rem">&#128274;</span>
    </div>
    <div style="font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:1.3rem;color:var(--gold);margin-bottom:0.35rem;letter-spacing:0.04em">Kitsu's Emotes</div>
    <div style="font-size:0.75rem;color:var(--gold2);font-family:'IBM Plex Sans',system-ui,sans-serif;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:1rem">Secret Sets</div>
    <div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:8px;padding:1rem 1.25rem;margin-bottom:1.5rem;text-align:left">
      <div style="font-size:0.72rem;color:var(--gold);font-family:'IBM Plex Sans',system-ui,sans-serif;letter-spacing:0.06em;margin-bottom:0.4rem">LOCATION: HOME</div>
      <div style="font-size:0.85rem;color:var(--text2);line-height:1.6;white-space:pre-line">${esc(lockHintText)}</div>
    </div>
    <a href="/" style="display:block;width:100%;box-sizing:border-box;text-align:center;background:var(--gold);color:#0a0a0f;border:none;padding:0.7rem;border-radius:6px;font-weight:700;cursor:pointer;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.9rem;letter-spacing:0.06em;text-decoration:none">Go to Home Page</a>
    <div id="lock-hint-bubble" style="display:none;margin-top:1rem;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.35);border-radius:6px;padding:0.75rem 1rem;font-size:0.8rem;color:var(--gold2);font-style:italic;line-height:1.6;text-align:left">
      <div style="font-size:0.7rem;color:var(--gold);font-family:'IBM Plex Sans',system-ui,sans-serif;letter-spacing:0.06em;margin-bottom:0.4rem;text-transform:uppercase;font-style:normal">Location: Side Menu</div>
      Hit the red rabbit twice and the green rabbit thrice.
    </div>
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
`, 'emotes', env, request);
}
