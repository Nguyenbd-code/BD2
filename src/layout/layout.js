import { getStyles, getCssVersion } from '../css/styles.js';

export async function layout(title, content, activePage = '', env = null) {
  let tapTarget = 7;
  let hasMamonir = false;
  if (env) {
    try {
      const row = await env.DB.prepare("SELECT data FROM images WHERE key='mamonir_nav'").first();
      if (row && row.data) hasMamonir = true;
    } catch {}
    try {
      const row = await env.DB.prepare("SELECT data FROM images WHERE key='mamonir_tap_count'").first();
      if (row && row.data) tapTarget = Math.max(1, parseInt(row.data, 10) || 7);
    } catch {}
  }

  const mamonirHtml = hasMamonir ? `
  <div id="mam-wrap" class="mam-wrap" aria-label="Octovius">
    <div class="mam-clip">
      <img id="mam-icon" src="/img/mamonir_nav" alt="" draggable="false">
    </div>
    <span class="mam-bubble" id="mam-bubble"></span>
  </div>
  <script>
  (function(){
    var KEY = 'kitsu_mamonir_taps';
    var TARGET = ${tapTarget};
    var wrap = document.getElementById('mam-wrap');
    var icon = document.getElementById('mam-icon');
    var bubble = document.getElementById('mam-bubble');
    if (!wrap || !icon) return;
    if (localStorage.getItem('kitsu_set_3') === '1') { wrap.style.display='none'; return; }
    var n = parseInt(localStorage.getItem(KEY) || '0', 10);
    var regularLines = ['Owch!', 'Stop!', 'Octovius, finish it off!', 'Die!'];
    var climaxLines = ['I-I', "I'm!", "I'm Coming!"];
    var lastRegular = -1;
    var bubbleTimer = null;
    function showBubble(text) {
      if (!bubble) return;
      bubble.textContent = text;
      bubble.classList.remove('mam-bubble-show');
      void bubble.offsetWidth;
      bubble.classList.add('mam-bubble-show');
      if (bubbleTimer) clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(function(){ bubble.classList.remove('mam-bubble-show'); }, 1400);
    }
    function pickLine(tapNumber) {
      // Last 3 taps before unlock get the climax lines in order.
      var remaining = TARGET - tapNumber;
      if (remaining >= 0 && remaining < climaxLines.length) {
        return climaxLines[climaxLines.length - 1 - remaining];
      }
      var idx;
      do { idx = Math.floor(Math.random() * regularLines.length); } while (idx === lastRegular && regularLines.length > 1);
      lastRegular = idx;
      return regularLines[idx];
    }
    wrap.addEventListener('click', function(e) {
      e.preventDefault();
      if (localStorage.getItem('kitsu_set_3') === '1') return;
      n++;
      localStorage.setItem(KEY, String(n));
      icon.classList.add('mam-press');
      setTimeout(function() { icon.classList.remove('mam-press'); }, 120);
      showBubble(pickLine(n));
      if (n >= TARGET) {
        localStorage.setItem('kitsu_set_3', '1');
        localStorage.removeItem(KEY);
        wrap.style.transition = 'transform 0.7s ease-in, opacity 0.7s ease-in';
        wrap.style.transformOrigin = 'top center';
        wrap.style.transform = 'translateY(80px) rotate(25deg)';
        wrap.style.opacity = '0';
        setTimeout(function() {
          wrap.style.display = 'none';
          fetch('/api/emote-sets').then(function(r) { return r.json(); }).then(function(d) {
            var s = (d.sets || []).find(function(x) { return x.set_num === 3; }) || {};
            var name = s.name || 'Set K';
            var msg = s.unlock_message || 'The figure could not withstand your persistence. This set is now yours.';
            if (window.showSetUnlockModal) window.showSetUnlockModal(3, name, msg);
          }).catch(function() {
            if (window.showSetUnlockModal) window.showSetUnlockModal(3, 'Set K', 'This set is now yours.');
          });
        }, 750);
      }
    });
  })();
  </script>` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(title)} — BnKitsu BD2 Guide</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400..700&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400..700&display=swap" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400..700&display=swap"></noscript>
<link rel="stylesheet" href="/styles.css?v=${getCssVersion()}">
<script>try{if(localStorage.getItem('kitsu_set_3')==='1'){var s=document.createElement('style');s.textContent='#mam-wrap{display:none!important}';document.head.appendChild(s);}}catch(e){}</script>
<script>try{
  // One-time migration: if the player solved the /emotes secret on an old
  // build (localStorage only), mirror the unlock into a cookie so the server
  // can lean-render the locked page. Reload exactly once per session if we
  // landed on /emotes so the freshly-set cookie reaches the worker.
  if (localStorage.getItem('kitsu_unlocked') === 'true' && !/(?:^|;\\s*)kitsu_unlocked=1/.test(document.cookie)) {
    document.cookie = 'kitsu_unlocked=1; Path=/; Max-Age=31536000; SameSite=Lax';
    if (location.pathname === '/emotes' && !sessionStorage.getItem('kitsu_cookie_migrated')) {
      sessionStorage.setItem('kitsu_cookie_migrated', '1');
      location.reload();
    }
  }
}catch(e){}</script>
</head>
<body>
<script>
window.showSetUnlockModal = function(setNum, setName, message) {
  var existing = document.getElementById('kitsu-unlock-ov');
  if (existing) existing.remove();
  var ov = document.createElement('div');
  ov.id = 'kitsu-unlock-ov';
  ov.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.82);display:flex;align-items:center;justify-content:center;padding:1rem';
  var imgUrl = '/img/emote_set_' + setNum + '_unlock_img';
  var safeName = String(setName || ('Set ' + setNum));
  var safeMsg = String(message || 'This set is now yours.');
  var html = '<div style="background:#13131a;border:1px solid rgba(201,168,76,0.35);border-radius:12px;padding:2rem 2.5rem;max-width:440px;width:100%;text-align:center;font-family:Cinzel,serif;box-shadow:0 8px 40px rgba(0,0,0,0.7)">'
    + '<div style="width:130px;height:130px;margin:0 auto 1rem;border-radius:10px;overflow:hidden;background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);display:flex;align-items:center;justify-content:center">'
    +   '<img src="' + imgUrl + '" alt="" class="kus-img" style="width:100%;height:100%;object-fit:contain">'
    +   '<div class="kus-fallback" style="font-size:2.4rem;display:none">&#127381;</div>'
    + '</div>'
    + '<div style="color:#c9a84c;font-size:1.1rem;font-weight:700;letter-spacing:0.08em;margin-bottom:0.5rem">UNLOCKED &mdash; ' + safeName.replace(/[<>&"]/g, function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c];}) + '</div>'
    + '<div style="color:#888;font-size:0.85rem;font-family:inherit;line-height:1.65;margin-bottom:1.25rem;white-space:pre-line">' + safeMsg.replace(/[<>&"]/g, function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c];}) + '</div>'
    + '<button id="kus-close-btn" style="background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.4);color:#c9a84c;padding:8px 28px;border-radius:6px;font-size:0.9rem;cursor:pointer;font-family:Cinzel,serif">Close</button>'
    + '</div>';
  ov.innerHTML = html;
  document.body.appendChild(ov);
  var img = ov.querySelector('.kus-img');
  var fb = ov.querySelector('.kus-fallback');
  if (img) img.addEventListener('error', function() { img.style.display = 'none'; if (fb) fb.style.display = 'block'; });
  ov.addEventListener('click', function(e) { if (e.target === ov) ov.remove(); });
  var btn = document.getElementById('kus-close-btn');
  if (btn) btn.addEventListener('click', function() { ov.remove(); });
};
</script>
<nav>
  <button id="nav-toggle" class="nav-toggle" aria-label="Open menu" aria-expanded="false">
    <span></span><span></span><span></span>
  </button>
  <a href="/" class="nav-logo">⚔ BnKitsu</a>
  <div class="nav-spacer"></div>
  <div class="nav-admin">
    ${mamonirHtml}
    <a href="/admin">Admin</a>
  </div>
</nav>
<aside id="nav-side" class="nav-side" aria-hidden="true">
  <div class="nav-side-header">Navigation</div>
  <a href="/"${activePage === 'home' ? ' class="nav-active"' : ''}>Home</a>
  <a href="/guide"${activePage === 'guide' ? ' class="nav-active"' : ''}>PvP Guide</a>
  <a href="/coupons"${activePage === 'coupons' ? ' class="nav-active"' : ''}>Coupons</a>
  <a href="/emotes"${activePage === 'emotes' ? ' class="nav-active"' : ''}>Kitsu's Emotes</a>
  <a href="/characters"${activePage === 'characters' ? ' class="nav-active"' : ''}>Characters</a>
  <div id="char-circle" class="char-circle" aria-hidden="true">
    <button type="button" class="char-pos char-pos-center" data-char="mamonir" aria-label="Mamonir">
      <img src="/img/char_idle_mamonir" alt="" draggable="false">
    </button>
    <button type="button" class="char-pos" style="--a:0deg" data-char="zenith" aria-label="Zenith"><img src="/img/char_idle_zenith" alt="" draggable="false"></button>
    <button type="button" class="char-pos" style="--a:60deg" data-char="rou" aria-label="Rou"><img src="/img/char_idle_rou" alt="" draggable="false"></button>
    <button type="button" class="char-pos" style="--a:120deg" data-char="tyr" aria-label="Tyr"><img src="/img/char_idle_tyr" alt="" draggable="false"></button>
    <button type="button" class="char-pos" style="--a:180deg" data-char="yuri" aria-label="Yuri"><img src="/img/char_idle_yuri" alt="" draggable="false"></button>
    <button type="button" class="char-pos" style="--a:240deg" data-char="liatris" aria-label="Liatris"><img src="/img/char_idle_liatris" alt="" draggable="false"></button>
    <button type="button" class="char-pos" style="--a:300deg" data-char="dalvi" aria-label="Dalvi"><img src="/img/char_idle_dalvi" alt="" draggable="false"></button>
  </div>
</aside>
<div id="nav-backdrop" class="nav-backdrop"></div>
<script>
(function(){
  var btn = document.getElementById('nav-toggle');
  var side = document.getElementById('nav-side');
  var bd = document.getElementById('nav-backdrop');
  if (!btn || !side) return;
  function close(){
    side.classList.remove('open');
    side.setAttribute('aria-hidden','true');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
    if (bd) bd.classList.remove('open');
  }
  function open(){
    side.classList.add('open');
    side.setAttribute('aria-hidden','false');
    btn.classList.add('open');
    btn.setAttribute('aria-expanded','true');
    if (bd) bd.classList.add('open');
  }
  btn.addEventListener('click', function(){ side.classList.contains('open') ? close() : open(); });
  if (bd) bd.addEventListener('click', close);
  side.addEventListener('click', function(e){ if (e.target.tagName === 'A') close(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });
})();

// Character-circle widget — Set 4 (char_sequence) unlock mechanic.
// Stays visible after the set is solved (icons remain as side-nav decor).
(function(){
  var circle = document.getElementById('char-circle');
  if (!circle) return;
  var charSetCache = null;
  function loadSets() {
    if (charSetCache) return Promise.resolve(charSetCache);
    return fetch('/api/emote-sets').then(function(r){return r.json();}).then(function(d){
      charSetCache = (d && d.sets) || [];
      return charSetCache;
    }).catch(function(){ return []; });
  }
  // Rabbit-tap shortcut — 2x Liatris + 3x Zenith reveals where the lock-screen
  // secret-code lives. Only short-circuits once the user is properly unlocked;
  // the popup itself can re-trigger as many times as the player wants, since
  // each trigger clears the counters and forces them to do the sequence again.
  function checkRabbitShortcut() {
    if (localStorage.getItem('kitsu_unlocked') === 'true') return;
    var li = parseInt(localStorage.getItem('kitsu_rabbit_liatris') || '0', 10);
    var ze = parseInt(localStorage.getItem('kitsu_rabbit_zenith')  || '0', 10);
    if (li >= 2 && ze >= 3) {
      localStorage.removeItem('kitsu_rabbit_liatris');
      localStorage.removeItem('kitsu_rabbit_zenith');
      showRabbitHint();
    }
  }
  function showRabbitHint() {
    var existing = document.getElementById('rabbit-hint-modal');
    if (existing) existing.remove();
    var m = document.createElement('div');
    m.id = 'rabbit-hint-modal';
    m.style.cssText = 'position:fixed;inset:0;z-index:11000;background:rgba(0,0,0,0.78);display:flex;align-items:center;justify-content:center;padding:1.5rem;cursor:pointer;';
    m.innerHTML = '<div style="background:#14141e;border:1px solid rgba(201,168,76,0.45);border-radius:8px;padding:2rem 2.25rem;max-width:420px;width:100%;text-align:center;font-family:\\'Inter\\',system-ui,sans-serif;cursor:default;box-shadow:0 20px 60px rgba(0,0,0,0.6)" onclick="event.stopPropagation()">'
      + '<div style="font-family:\\'Fraunces\\',Georgia,serif;font-weight:600;font-size:1.4rem;color:#c9a84c;margin-bottom:0.85rem;letter-spacing:-0.01em">A whisper reaches you</div>'
      + '<div style="font-size:0.9rem;color:#eef0fa;line-height:1.6;margin-bottom:1.25rem;font-style:italic">The answer lies at the bottom of the Home page.</div>'
      + '<button id="rabbit-hint-close" style="background:rgba(201,168,76,0.18);border:1px solid rgba(201,168,76,0.45);color:#c9a84c;padding:7px 22px;border-radius:5px;cursor:pointer;font-family:inherit;font-size:0.78rem;letter-spacing:0.12em;text-transform:uppercase">Close</button>'
      + '</div>';
    document.body.appendChild(m);
    m.addEventListener('click', function(){ m.remove(); });
    var cb = document.getElementById('rabbit-hint-close');
    if (cb) cb.addEventListener('click', function(){ m.remove(); });
  }

  circle.addEventListener('click', function(e){
    var b = e.target.closest('.char-pos');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    var slug = (b.dataset.char || '').toLowerCase();
    if (!slug) return;
    // Bump rabbit-tap counters before everything else. Only gated by
    // kitsu_unlocked so a locked player can always re-attempt the shortcut.
    if (localStorage.getItem('kitsu_unlocked') !== 'true') {
      if (slug === 'liatris') {
        var n = parseInt(localStorage.getItem('kitsu_rabbit_liatris') || '0', 10) + 1;
        localStorage.setItem('kitsu_rabbit_liatris', String(n));
      } else if (slug === 'zenith') {
        var n2 = parseInt(localStorage.getItem('kitsu_rabbit_zenith') || '0', 10) + 1;
        localStorage.setItem('kitsu_rabbit_zenith', String(n2));
      }
      checkRabbitShortcut();
    }
    b.classList.remove('char-pos-tap');
    void b.offsetWidth;
    b.classList.add('char-pos-tap');
    setTimeout(function(){ b.classList.remove('char-pos-tap'); }, 250);

    // Centralize the click-buffer push here so neither the Set M sub-puzzle
    // check nor the per-set forEach loop has to do its own. Previously both
    // pushed, so a single tap landed in kitsu_char_clicks twice and the
    // sequence tail never matched.
    var clicks = [];
    try { clicks = JSON.parse(localStorage.getItem('kitsu_char_clicks') || '[]'); } catch(_){}
    clicks.push(slug);
    if (clicks.length > 30) clicks = clicks.slice(-30);
    localStorage.setItem('kitsu_char_clicks', JSON.stringify(clicks));

    loadSets().then(function(sets){
      // Difficulty gating — a tier is available only after every set in the previous tier is solved.
      function unlocked(n){ return localStorage.getItem('kitsu_set_' + n) === '1'; }
      function tierUnlocked(d){
        if (d === 'easy') return true;
        var prev = d === 'medium' ? 'easy' : 'medium';
        var list = sets.filter(function(x){ return (x.difficulty||'easy') === prev; });
        return list.length > 0 && list.every(function(x){ return unlocked(x.set_num); });
      }
      // Generic extra_hint sub-puzzle: any set with an extra_sequence (a
      // comma-list of char-circle slugs) and a non-empty extra_reveal gets
      // a nested puzzle inside its EXTRA HINT modal. The reveal text appends
      // to the modal after the player matches the slug sequence as the tail
      // of kitsu_char_clicks. Gated to the set's difficulty tier so the
      // sub-puzzle only arms when the player can legitimately reach the
      // extra hint. Toast is suppressed per browser session via sessionStorage.
      sets.forEach(function(s){
        if (unlocked(s.set_num)) {
          // Once the parent set is solved, the extra hint isn't visible
          // anyway — no reason to keep firing the sub-puzzle.
          return;
        }
        var extraSeq = (s.extra_sequence||'').split(',').map(function(x){return x.trim().toLowerCase();}).filter(Boolean);
        if (!extraSeq.length) return;
        if (!(s.extra_reveal||'').trim()) return;
        if (!tierUnlocked(s.difficulty || 'easy')) return;
        var revealKey = 'kitsu_set_' + s.set_num + '_extra_revealed';
        var subTail = clicks.slice(-extraSeq.length);
        if (subTail.length === extraSeq.length && subTail.every(function(v,i){return v === extraSeq[i];})) {
          localStorage.setItem(revealKey, '1');
          var toastKey = 'kitsu_set_' + s.set_num + '_toast_shown';
          var alreadyToasted = false;
          try { alreadyToasted = sessionStorage.getItem(toastKey) === '1'; } catch(_){}
          if (!alreadyToasted) {
            try { sessionStorage.setItem(toastKey, '1'); } catch(_){}
            var toast = document.createElement('div');
            toast.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:#14141e;border:1px solid rgba(201,168,76,0.45);color:#c9a84c;padding:0.8rem 1.4rem;border-radius:6px;font-family:Inter,system-ui,sans-serif;font-size:0.82rem;letter-spacing:0.04em;box-shadow:0 12px 36px rgba(0,0,0,0.55);z-index:11000;transition:opacity 0.4s;';
            toast.textContent = 'A new whisper rests inside Set ' + (s.set_letter || s.name || s.set_num) + '’s extra hint.';
            document.body.appendChild(toast);
            setTimeout(function(){ toast.style.opacity='0'; setTimeout(function(){toast.remove();},400); }, 3500);
          }
        }
      });
      sets.forEach(function(s){
        if ((s.unlock_mode||'') !== 'char_sequence') return;
        if (unlocked(s.set_num)) return;
        if (!tierUnlocked(s.difficulty || 'easy')) return;
        var seq = (s.unlock_sequence||'').split(',').map(function(x){return x.trim().toLowerCase();}).filter(Boolean);
        if (!seq.length) return;
        var tail = clicks.slice(-seq.length);
        if (tail.length === seq.length && tail.every(function(v,i){return v === seq[i];})) {
          localStorage.setItem('kitsu_set_' + s.set_num, '1');
          localStorage.removeItem('kitsu_char_clicks');
          if (window.showSetUnlockModal) {
            var name = s.name || ('Set ' + s.set_num);
            var msg = s.unlock_message || 'Set unlocked!';
            window.showSetUnlockModal(s.set_num, name, msg);
          }
        }
      });
    });
  });
})();
</script>
<main>${content}</main>
<footer>
  <div class="footer-copyright">&copy; 2026 <span>BD2Guide</span> by BnKitsu. All rights reserved.</div>
  <div class="footer-disclaimer">This website is not affiliated with or endorsed by Brown Dust 2. All trademarks and copyrights of the game and its characters are owned by their respective owners.</div>
</footer>
</body>
</html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

export function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
