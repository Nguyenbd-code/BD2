import { layout, esc } from '../layout/layout.js';
import { T1_DATA, SCHERA_ICONS } from '../data/t1.js';

const STATIC_CHARS = {
  T1: [{name:'Rou',bond:'Red Riding Hood'},{name:'Seir',bond:'B-Rank Idol'},{name:'Lecliss',bond:'Android Queen'},{name:'Scheherazade',bond:'Magic Professor'},{name:'Sylvia',bond:'Bikini Agent'}],
  T2: [{name:'Rou',bond:'Red Riding Hood'},{name:'Zenith',bond:'Robin Hood'},{name:'Roxy',bond:'Respected Master'},{name:'Eleaneer',bond:'B-Rank Idol'},{name:'Scheherazade',bond:'Magic Professor'}],
  T3: [{name:'Roxy',bond:'Respected Master'},{name:'Lecliss',bond:'Android Queen'},{name:'Seir',bond:'B-Rank Idol'},{name:'Justia',bond:'Knight of Blood'},{name:'Teresse',bond:'Beachside Angel'}],
  T4: [{name:'Rou',bond:'Red Riding Hood'},{name:'Lecliss',bond:'Android Queen'},{name:'Blade',bond:'Onsen Sword Fighter'},{name:'Olivier',bond:'Fallen Wings'},{name:'Mamonir',bond:'Night of Death'}],
  T5: [{name:'Elise',bond:'Lovely Lady'},{name:'Zenith',bond:'Robin Hood'},{name:'Alec',bond:'Sword Breaker'},{name:'Olivier',bond:'Fallen Wings'},{name:'Granhildr',bond:'Comeback Idol'}],
  T6: [{name:'Granhildr',bond:'Comeback Idol'},{name:'Justia',bond:'Knight of Blood'},{name:'Alec',bond:'Sword Breaker'},{name:'Olivier',bond:'Fallen Wings'},{name:'Libertia',bond:'Dark Saintess'}],
};

const STATIC_NOTES = {
  T1: ['Rou ≥21,000 HP · 50% Crit Rate · 1 HP/Res piece','Lecliss ≥33,000 HP · 90% Defence','Seir ≥29,000 HP · 105% Magic Resist','Sylvia 50% Crit Rate · max ATK% substats','Scheherazade 50% Crit Rate · MATK + CDMG build'],
  T2: ['Rou needs at least 21,000 HP and 50% Critical Rate','Rou wants 1 HP/Res piece to survive an empowered basic','Roxy wants 50% Critical Rate','Zenith wants 105% Magic Res and at least 21,000 HP','Eleaneer wants 50% Critical Rate','Scheherazade wants 50% Critical Rate','Any DPS can alternate between Def/Res'],
  T3: ['Lecliss needs at least 33,000 HP and 90% Defence','Seir needs at least 29,000 HP and 105% Magic Res','Justia wants as much ATK as possible','Roxy wants 100% Critical Rate','Teresse wants 100% Critical Rate'],
  T4: ['Olivier can alternate between Magic and Defence Armor','Rou needs at least 21,000 HP and 50% Critical Rate','Rou wants 1 HP/Res piece to survive an empowered basic','Blade needs 50% Critical Rate and can alternate Def/Res','Lecliss needs at least 33,000 HP and 90% Defence','Mamonir needs at least 32,000 HP and 90% Defence','Can replace Mamonir with Granhildr Taunt Pre-em'],
  T5: ['Olivier can alternate between Magic and Defence Armor','Zenith wants 105% Magic Res and as much HP as possible','Alec wants 90% Mres and HP necklaces with ATK subs','Elise needs 100% Critical Rate','Granhildr wants 90–110% and as much HP as possible'],
  T6: ['Olivier can alternate between Magic and Defence Armor','Justia wants as much ATK as possible','Alec wants 90% Mres and HP necklaces with ATK subs','Libertia wants 110% Mres and as much HP as possible','Granhildr wants 90–110% and as much HP as possible'],
};

const STATIC_MATCHUPS = {
  T1: {counters:[],countered_by:['Granhildr Counter','T6 Anti-Taunt']},
  T2: {counters:[],countered_by:["Counter Granhildr","Blade if can't kill T1"]},
  T3: {counters:[],countered_by:['T6']},
  T4: {counters:[],countered_by:['Venaka','Schera','Double Taunt']},
  T5: {counters:['Michaela'],countered_by:['Need Data']},
  T6: {counters:['T3','Double Taunt Teams'],countered_by:['T2','T1']},
};

const STATIC_UNIT_ORDER = {
  T1: ['Rou','Seir','Lecliss','Scheherazade','Sylvia'],
  T2: ['Rou','Zenith','Roxy','Eleaneer','Scheherazade'],
  T3: ['Roxy','Lecliss','Seir','Justia','Teresse'],
  T4: ['Rou','Lecliss','Blade','Olivier','Mamonir'],
  T5: ['Elise','Zenith','Alec','Olivier','Granhildr'],
  T6: ['Granhildr','Justia','Alec','Olivier','Libertia'],
};

const STATIC_WARNINGS = {
  T1: 'Do Not Use unless going for Rank 1 — last hour only',
  T5: 'LOW WIN RATE — counters specific team comps only',
};

const NA = '<div style="color:var(--gold);opacity:0.4;font-family:\'Cinzel\',serif;font-size:0.85rem;text-align:center;padding:1.5rem 0">N/A</div>';

function tileCls(type) {
  return { ALL:'tile-all', FRONT:'tile-front', SKIP:'tile-skip', SELF:'tile-self' }[type] || 'tile-front';
}

function cSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function charStrip(chars, compId, bondsData, compGear, elementBySlug) {
  const fallback = ['#e74c3c','#3498db','#2ecc71','#9b59b6','#e67e22'];
  const elemColors = { Water:'#2E86C1', Fire:'#C0392B', Wind:'#27AE60', Light:'#F4D03F', Dark:'#8E44AD' };
  const costumeSlug = (n) => (n||'').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return chars.map((c, idx) => {
    const slug = c.slug || cSlug(c.name);
    const elem = elementBySlug ? (elementBySlug[slug] || elementBySlug[cSlug(c.name)] || '') : '';
    const col  = elemColors[elem] || fallback[idx % fallback.length];
    const cid  = `${slug}-${compId}`;
    const bond = bondsData && bondsData[c.name];
    const cosSlug = costumeSlug(c.costume_name || (bond && bond.costume) || '');
    const costumeIcon = cosSlug ? `<img src="/img/char_${slug}_${cosSlug}_icon" class="img-err-hide" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:2">` : '';
    const tooltip = bond ? `
      <div class="tt-popup">
        <div class="tt-name">${esc(c.name)} — ${esc(bond.costume)}</div>
        <div class="tt-stats">${bond.stats.map(s=>`<span class="tt-stat">${esc(s)}</span>`).join('')}</div>
        <div class="tt-desc">${esc(bond.notes)}</div>
      </div>` : '';
    // Use comp-specific gear override if it exists, otherwise fall back to base
    // compId param is anchorId = "a1-atk" or "d1-def"; tier = part before first '-'
    const tierKey = compId.split('-')[0];
    const hasCompGear = compGear && compGear[slug];
    const gearSrc = hasCompGear
      ? `/img/comp_gear_${tierKey}_${slug}`
      : `/img/char_${slug}_gear`;
    return `<div class="char-card-wrap" style="flex:1;min-width:150px;max-width:220px;--codex-i:${idx}" data-action="card-flip" data-slug="${cid}">
  <div class="char-card-inner${bond?' tt-parent':''}" id="card-${cid}">
    <div class="char-face">
      <div style="height:154px;position:relative;background:#0e0c14;display:flex;align-items:center;justify-content:center;overflow:hidden">
        <span style="font-family:'Fraunces',Georgia,serif;font-weight:600;font-variation-settings:'opsz' 144;font-size:3.2rem;color:${col};opacity:0.45;letter-spacing:-0.04em">${esc(c.name.charAt(0))}</span>
        <img src="/img/char_${slug}_portrait" class="img-err-hide" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1">
        ${costumeIcon}
        <div style="position:absolute;left:0;right:0;bottom:0;height:42%;background:linear-gradient(to top,rgba(10,10,15,0.85),transparent);z-index:3;pointer-events:none"></div>
        <div style="position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(to right,transparent,${col},transparent);z-index:4;pointer-events:none;opacity:0.85"></div>
      </div>
      <div style="height:66px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0.4rem 0.6rem 0;background:#14141e">
        <div style="font-family:'Fraunces',Georgia,serif;font-weight:500;font-variation-settings:'opsz' 36;font-size:0.95rem;color:#eef0fa;text-align:center;letter-spacing:-0.005em;line-height:1.1">${esc(c.name)}</div>
        <div style="font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.6rem;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:rgba(201,168,76,0.85);margin-top:4px;text-align:center">${esc(c.bond||'')}</div>
      </div>
      ${tooltip}
    </div>
    <div class="char-face char-face-back">
      <div style="position:absolute;inset:0;background:var(--bg2);display:flex;align-items:center;justify-content:center">
        <span style="color:var(--text3);font-size:0.75rem">No gear image</span>
        <img src="${gearSrc}" class="img-err-hide" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:var(--bg2)">
      </div>
    </div>
  </div>
  <button class="card-zoom-overlay" onclick="event.stopPropagation();event.preventDefault();openLightbox('${gearSrc}');return false;" style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.7);border:1px solid rgba(201,168,76,0.5);color:var(--gold);cursor:pointer;border-radius:4px;padding:4px 10px;font-size:0.9rem;z-index:100;display:none;pointer-events:auto">⤢</button>
</div>`;
  }).join('');
}

function renderComp(comp, mediaMap, elementBySlug) {
  const tier    = comp.tier;
  const color   = comp.color || '#c9a84c';
  const video   = (mediaMap[tier] && mediaMap[tier].video) ? mediaMap[tier].video : '';
  const tierCls = tier.toLowerCase().replace(/[^a-z0-9]/g, '');
  const anchorId = comp.anchorId || tierCls;
  const typeLabel = comp.type === 'ATK' ? '⚔ Attack Composition' : '🛡 Defence Composition';
  const typeCls   = comp.type === 'ATK' ? 'atk' : 'def';

  // Character strip
  const stripHtml = (comp.chars||[]).length
    ? charStrip(comp.chars, anchorId, comp.bondsData||null, comp.compGear||{}, elementBySlug)
    : [1,2,3,4,5].map(() => `<div class="char-card-wrap" style="flex:1;min-width:150px;max-width:220px">
  <div class="char-card-inner">
    <div class="char-face">
      <div style="height:154px;background:var(--bg4);display:flex;align-items:center;justify-content:center">
        <span style="font-size:1.5rem;color:var(--text3)">?</span>
      </div>
      <div style="height:66px;display:flex;align-items:center;justify-content:center;padding:0.5rem">
        <div style="font-size:0.75rem;color:var(--text3);text-align:center">Not set</div>
      </div>
    </div>
  </div>
</div>`).join('');

  // Skill rotation
  let rotHtml;
  const rot = comp.rotation;
  if (rot && Object.keys(rot).length > 0) {
    const costumeSlug = (n) => (n||'').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const slugByName = {};
    for (const c of (comp.chars||[])) slugByName[c.name] = c.slug || cSlug(c.name);
    const charNames = (comp.chars||[]).length ? comp.chars.map(c=>c.name) : Object.keys(rot);
    const rows = charNames.map(name => {
      const skills = rot[name];
      if (!skills || !skills.length) return '';
      const slug = slugByName[name] || cSlug(name);
      const icons = skills.map((sk, i) => {
        const cos = sk.costume || '';
        const cosSlug = costumeSlug(cos);
        const abbr = (cos || '???').substring(0,3).toUpperCase();
        const portrait = cosSlug
          ? `<div style="width:32px;height:32px;border-radius:50%;border:2px solid var(--border2);overflow:hidden;margin:0 auto"><img src="/img/char_${esc(slug)}_${esc(cosSlug)}_icon" alt="${esc(abbr)}" style="width:32px;height:32px;object-fit:cover;display:block;transform:scale(1.7);transform-origin:50% 22%" class="img-err-hide"></div>`
          : `<div class="skill-abbr" style="border-radius:50%">${esc(abbr)}</div>`;
        return `<div class="skill-wrap">
  <div class="skill-icon-box" style="width:38px;flex-shrink:0">
    <div class="skill-num">${i+1}</div>
    ${portrait}
  </div>
  ${cos ? `<div class="tt-popup"><div class="tt-name">${esc(cos)}</div></div>` : ''}
</div>`;
      }).join('');
      return `<div class="rot-row"><div class="rot-skills">${icons}</div></div>`;
    }).filter(Boolean).join('');
    rotHtml = rows
      ? `<div class="rot-table">${rows}</div>`
      : `<div style="flex:1;display:flex;align-items:center;justify-content:center">${NA}</div>`;
  } else {
    rotHtml = `<div style="flex:1;display:flex;align-items:center;justify-content:center">${NA}</div>`;
  }

  // Unit order — always 5 rows so height is identical across all tiers
  const unitOrder = comp.unitOrder || [];
  const orderPills = [1,2,3,4,5].map(i => {
    const u    = unitOrder[i-1];
    const name = u ? (typeof u === 'object' ? u.name : u) : '—';
    const empty = !u;
    return `<div class="unit-order-row${empty ? ' unit-order-row-empty' : ''}">
  <div class="unit-order-num">${i}</div>
  <div class="unit-order-name">${esc(String(name))}</div>
</div>`;
  }).join('');
  const orderHtml = `<div class="card">
  <div class="card-title">Unit Order</div>
  <div style="margin-top:0.25rem">${orderPills}</div>
</div>`;

  // Board positioning — flip card (front + back)
  const frontKey = tier === 'T1' ? 'board_pos' : `comp_${tier.toLowerCase()}_board`;
  const backKey  = `comp_${tier.toLowerCase()}_board_back`;
  const boardHtml = `<div class="board-flip-wrap" data-action="board-flip" data-tier="${esc(tier)}">
  <div class="board-card-inner" id="board-card-${esc(tier)}">
    <div class="board-face">
      <div class="board-face-empty">No image yet</div>
      <img src="/img/${esc(frontKey)}" class="img-err-hide board-face-img">
      <button class="board-face-zoom" onclick="event.stopPropagation();event.preventDefault();openLightbox('/img/${esc(frontKey)}');return false;" aria-label="Zoom front">&#x2922;</button>
    </div>
    <div class="board-face board-face-back">
      <div class="board-face-empty">No back image yet</div>
      <img src="/img/${esc(backKey)}" class="img-err-hide board-face-img">
      <button class="board-face-zoom board-face-zoom-left" onclick="event.stopPropagation();event.preventDefault();openLightbox('/img/${esc(backKey)}');return false;" aria-label="Zoom back">&#x2922;</button>
    </div>
  </div>
</div>
<div class="board-flip-hint">Tap to flip</div>`;

  // Board section — ATK/DEF dual-box with arrow
  const isAtk = comp.type === 'ATK';
  const arrow = isAtk
    ? '<div style="font-size:1.8rem;color:var(--gold);display:flex;align-items:center;padding:0 0.5rem;flex-shrink:0">⟶</div>'
    : '<div style="font-size:1.8rem;color:var(--gold);display:flex;align-items:center;padding:0 0.5rem;flex-shrink:0">⟵</div>';
  const imageBox = `<div style="flex:1;border:2px solid var(--gold);border-radius:8px;overflow:hidden;position:relative;background:var(--bg4);">${boardHtml}</div>`;
  // YouTube videos are rendered as a thumbnail with a play overlay; tapping
  // opens a fullscreen modal where the player controls (fullscreen, sound,
  // progress bar) are actually usable. The inline iframe at 220px tall was
  // useless — YouTube's control bar overflows and fullscreen is unreachable.
  // Detect YouTube and X/Twitter URLs separately. Both open in the same
  // fullscreen modal but each shows a different thumbnail/embed.
  const ytMatch = video.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  const xMatch = video.match(/(?:x\.com|twitter\.com)\/(?:i\/status|[A-Za-z0-9_]+\/status)\/(\d+)/i);
  const playSvg = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="28" fill="rgba(10,10,15,0.78)" stroke="#c9a84c" stroke-width="1.5"/><path d="M26 20 L46 32 L26 44 Z" fill="#c9a84c"/></svg>';
  // X/Twitter doesn't expose a public thumbnail URL, so we render a styled
  // placeholder with the X logo glyph.
  const xLogoSvg = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#c9a84c" style="width:48px;height:48px;opacity:0.32"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
  const videoInner = !video
    ? '<div style="text-align:center;padding:1rem"><div style="font-family:Fraunces,Georgia,serif;color:var(--gold);opacity:0.55;font-size:1rem;font-style:italic;margin-bottom:0.3rem">Video</div><div style="font-size:0.7rem;color:var(--text3);font-family:IBM Plex Sans,system-ui,sans-serif;letter-spacing:0.22em;text-transform:uppercase">No replay yet</div></div>'
    : (ytMatch
        ? `<button type="button" class="video-thumb" data-action="open-video" data-video-id="${esc(ytMatch[1])}" data-video-kind="yt" aria-label="Play video">
             <img src="https://img.youtube.com/vi/${esc(ytMatch[1])}/hqdefault.jpg" alt="" class="video-thumb-img" loading="lazy">
             <span class="video-thumb-shade" aria-hidden="true"></span>
             <span class="video-thumb-play" aria-hidden="true">${playSvg}</span>
             <span class="video-thumb-label">Watch Replay</span>
           </button>`
        : xMatch
        ? `<button type="button" class="video-thumb video-thumb-file" data-action="open-video" data-video-id="${esc(xMatch[1])}" data-video-kind="tweet" aria-label="Play tweet">
             <span class="video-thumb-xlogo" aria-hidden="true">${xLogoSvg}</span>
             <span class="video-thumb-play" aria-hidden="true">${playSvg}</span>
             <span class="video-thumb-label">View Post on X</span>
           </button>`
        : `<button type="button" class="video-thumb video-thumb-file" data-action="open-video" data-video-src="${esc(video)}" data-video-kind="file" aria-label="Play video">
             <span class="video-thumb-play" aria-hidden="true">${playSvg}</span>
             <span class="video-thumb-label">Watch Replay</span>
           </button>`);
  const videoBox = `<div class="board-video-box">${videoInner}</div>`;
  const boardSectionHtml = `<div style="display:flex;align-items:stretch;gap:0.5rem;height:220px">${isAtk ? imageBox + arrow + videoBox : videoBox + arrow + imageBox}</div>`;


  // Build notes
  const notesHtml = (comp.notes||[]).map(n=>`<li>${esc(n)}</li>`).join('');

  // Preemptive skills
  const preemptive = comp.preemptive || [];
  const preemptiveHtml = preemptive.length
    ? preemptive.slice(0, 3).map(src => `<img src="${esc(src)}" style="flex:1;min-height:0;width:100%;object-fit:contain;border-radius:4px;border:1px solid var(--border2);display:block" class="img-err-hide">`).join('')
    : '<span style="color:var(--gold);opacity:0.4;font-family:\'Cinzel\',serif;font-size:0.8rem">N/A</span>';

  // Matchups
  const counters    = comp.counters || [];
  const counteredBy = comp.countered_by || [];

  // Parse guide card label (stored as "green:text" or "red:text" in guide_label)
  let cardLabelHtml = '';
  const glRaw = comp.guide_label || '';
  if (glRaw) {
    const glMatch = glRaw.match(/^(green|red):(.+)$/s);
    const tagClass = glMatch ? (glMatch[1] === 'green' ? 'codex-tag-pos' : 'codex-tag-neg') : '';
    const labelText  = glMatch ? glMatch[2] : glRaw;
    cardLabelHtml = `<span class="codex-tag ${tagClass}">${esc(labelText)}</span>`;
  }
  const typeMetaLabel = comp.type === 'ATK' ? 'Attack Composition' : 'Defence Composition';

  return `
<div class="comp-section" id="${anchorId}" style="--codex-accent:${color}">
  <div class="codex-section-head">
    <div class="codex-section-tier">${esc(tier)}</div>
    <div class="codex-section-body">
      <div class="codex-section-meta">
        <span class="codex-section-meta-dot"></span>
        <span>${esc(typeMetaLabel)}</span>
      </div>
      <h2 class="codex-section-name">${esc(comp.name)}</h2>
      ${(comp.warning || cardLabelHtml) ? `<div class="codex-section-tags">${comp.warning ? `<span class="codex-tag codex-tag-warn">${esc(comp.warning)}</span>` : ''}${cardLabelHtml}</div>` : ''}
    </div>
  </div>

  <div class="card-title" style="border:none;padding:0;margin-bottom:0.25rem">Character Bonds</div>
  <div style="font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.74rem;color:rgba(220,228,245,0.5);font-style:italic;margin-bottom:0.85rem;letter-spacing:0.01em">Flip the bond portraits for gearing examples.</div>
  <div data-codex-reveal style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-bottom:1.5rem">${stripHtml}</div>

  <div class="comp-expand-grid" style="display:grid;grid-template-columns:0.75fr 1.5fr 0.75fr;gap:1rem;align-items:stretch;min-width:0;">
    <div style="display:flex;flex-direction:column;gap:0.75rem;min-width:0;overflow:hidden;">
      <div class="card" style="height:430px;overflow:hidden;display:flex;flex-direction:column;flex-shrink:0;">
        <div class="card-title" style="flex-shrink:0">Skill Rotation</div>
        ${rotHtml}
      </div>
      ${orderHtml}
    </div>
    <div style="min-width:0;display:flex;flex-direction:column;gap:0.75rem;">
      <div class="card" style="padding:1rem;flex-shrink:0">
        <div class="card-title">Board Positioning</div>
        ${boardSectionHtml}
      </div>
      <div class="comp-howmatch-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;flex-shrink:0;height:240px;">
        <div class="card" style="padding:1.25rem;overflow:hidden;display:flex;flex-direction:column;">
          <div class="card-title" style="margin-bottom:0.75rem;flex-shrink:0">How and When to Play</div>
          <div style="color:var(--text3);font-size:0.82rem;flex:1;line-height:1.6;white-space:pre-wrap;overflow:auto">${comp.howToPlay ? esc(comp.howToPlay) : '<span style="color:var(--gold);opacity:0.4;font-family:Cormorant Unicase,serif">Coming soon</span>'}</div>
        </div>
        <div class="card" style="padding:1rem;overflow:hidden;display:flex;flex-direction:column;">
          <div class="card-title" style="flex-shrink:0">Matchups</div>
          <div style="margin-top:0.5rem;margin-bottom:0.4rem;flex-shrink:0">
            <div style="font-size:0.7rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.3rem">Counters</div>
            ${counters.length ? counters.map(c=>`<span class="beats-tag">${esc(c)}</span>`).join('') : '<span class="beats-tag" style="opacity:0.55">Need data</span>'}
          </div>
          <div style="flex-shrink:0">
            <div style="font-size:0.7rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.3rem">Countered By</div>
            ${counteredBy.length ? counteredBy.map(c=>`<span class="counter-tag">${esc(c)}</span>`).join('') : '<span class="counter-tag" style="opacity:0.55">Need data</span>'}
          </div>
        </div>
      </div>
      <div style="flex:1;min-height:0;border:1px dashed var(--border2);border-radius:6px;opacity:0.35"></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:0.75rem;min-width:0;">
      <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column;min-height:0;">
        <div class="card-title" style="flex-shrink:0">Build Notes</div>
        <ul class="notes-list" style="flex:1;overflow:auto;">${notesHtml || `<li>${NA}</li>`}</ul>
      </div>
      <div class="card" style="padding:1rem;flex-shrink:0;height:280px;overflow:hidden;display:flex;flex-direction:column;">
        <div class="card-title" style="margin-bottom:0.5rem;flex-shrink:0">Preemptive Skills</div>
        <div style="flex:1;display:flex;flex-direction:column;gap:0.4rem;min-height:0;">${preemptiveHtml}</div>
      </div>
    </div>
  </div>
</div>`;
}

export async function handleGuide(request, env) {
  let mediaMap = {}, rotationMap = {}, allComps = [], compCharsMap = {}, dbNotes = {}, extraMap = {}, compGearMap = {}, elementBySlug = {};
  try { await env.DB.prepare("ALTER TABLE compositions ADD COLUMN guide_label TEXT DEFAULT ''").run(); } catch {}
  try {
    const [compRes, mediaRes, rotRes, compCharsRes, noteRes, extraRes, gearRes, regRes] = await Promise.all([
      env.DB.prepare("SELECT * FROM compositions ORDER BY type ASC, COALESCE(NULLIF(sort_order,0),id*10) ASC, id ASC").all().catch(() => env.DB.prepare('SELECT * FROM compositions ORDER BY type ASC, id ASC').all()),
      env.DB.prepare('SELECT * FROM comp_media').all().catch(() => ({results:[]})),
      env.DB.prepare('SELECT * FROM comp_rotations ORDER BY tier, char_name, slot').all().catch(() => ({results:[]})),
      env.DB.prepare('SELECT * FROM comp_chars ORDER BY tier, position').all().catch(() => ({results:[]})),
      env.DB.prepare("SELECT key, data FROM images WHERE key LIKE 'notes_%'").all().catch(() => ({results:[]})),
      env.DB.prepare("SELECT key, data FROM images WHERE key LIKE 'preemptive_%' OR key LIKE 'how_to_play_%' OR key LIKE 'counters_%'").all().catch(() => ({results:[]})),
      env.DB.prepare("SELECT key FROM images WHERE key LIKE 'comp_gear_%'").all().catch(() => ({results:[]})),
      env.DB.prepare("SELECT slug, name, element FROM char_registry").all().catch(() => ({results:[]})),
    ]);
    for (const r of (regRes.results||[])) {
      const el = (r.element || '').toString().trim();
      const norm = el ? el.charAt(0).toUpperCase() + el.slice(1).toLowerCase() : '';
      if (r.slug) elementBySlug[r.slug] = norm;
      if (r.name) elementBySlug[cSlug(r.name)] = norm;
    }
    allComps = compRes.results || [];
    for (const m of (mediaRes.results||[])) {
      if (!mediaMap[m.tier]) mediaMap[m.tier] = {};
      mediaMap[m.tier][m.media_type] = m.value;
    }
    for (const r of (rotRes.results||[])) {
      if (!rotationMap[r.tier]) rotationMap[r.tier] = {};
      if (!rotationMap[r.tier][r.char_name]) rotationMap[r.tier][r.char_name] = [];
      rotationMap[r.tier][r.char_name].push({name:r.skill_name,costume:r.costume||'',sp:'SP '+r.sp_cost,cd:'CD '+r.cooldown,tile:r.tile_type||'FRONT',desc:r.description||''});
    }
    for (const c of (compCharsRes.results||[])) {
      if (!compCharsMap[c.tier]) compCharsMap[c.tier] = [];
      compCharsMap[c.tier].push(c);
    }
    for (const r of (noteRes.results||[])) {
      const k = r.key.replace('notes_', '');
      dbNotes[k] = r.data;
      dbNotes[k.toUpperCase()] = r.data;
    }
    for (const r of (extraRes.results||[])) {
      extraMap[r.key] = r.data;
    }
    // comp_gear_{tierlower}_{slug} → compGearMap[tierlower][slug] = true
    for (const r of (gearRes.results||[])) {
      const m = r.key.match(/^comp_gear_([^_]+)_(.+)$/);
      if (m) {
        if (!compGearMap[m[1]]) compGearMap[m[1]] = {};
        compGearMap[m[1]][m[2]] = true;
      }
    }
  } catch { /* ignore */ }

  const KNOWN = new Set(['T1','T2','T3','T4','T5','T6']);

  // Anchor is unique per comp: tier + type suffix (e.g. t1-atk, t1-def)
  const compAnchor = (c) => c.tier.toLowerCase().replace(/[^a-z0-9]/g,'') + '-' + (c.type||'ATK').toLowerCase();

  const atkComps = allComps.filter(c => (c.type||'ATK').toUpperCase() === 'ATK');
  const defComps = allComps.filter(c => (c.type||'ATK').toUpperCase() === 'DEF');

  const sidebarLinks = [
    atkComps.length ? `<div style="font-size:0.63rem;font-weight:700;color:#5dade2;text-transform:uppercase;letter-spacing:0.1em;padding:0.25rem 0.5rem 0.1rem">Attacking</div>` : '',
    ...atkComps.map(c => `<a href="#${compAnchor(c)}" class="sidebar-link">
  <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:3px;background:${c.color||'#c9a84c'};color:#fff;font-family:Cormorant Unicase,serif;font-size:0.6rem;font-weight:700;flex-shrink:0">${esc(c.tier)}</span>
  <span class="sidebar-name">${esc(c.name)}</span>
</a>`),
    defComps.length ? `<div style="font-size:0.63rem;font-weight:700;color:#2ecc71;text-transform:uppercase;letter-spacing:0.1em;padding:0.5rem 0.5rem 0.1rem;border-top:1px solid var(--border2);margin-top:0.35rem">Defence</div>` : '',
    ...defComps.map(c => `<a href="#${compAnchor(c)}" class="sidebar-link">
  <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:3px;background:${c.color||'#c9a84c'};color:#fff;font-family:Cormorant Unicase,serif;font-size:0.6rem;font-weight:700;flex-shrink:0">${esc(c.tier)}</span>
  <span class="sidebar-name">${esc(c.name)}</span>
</a>`),
  ].filter(Boolean).join('');

  const buildCompHtml = (dbComp) => {
    const tier    = dbComp.tier;
    const tierLow = tier.toLowerCase();
    const isKnown = KNOWN.has(tier);
    const dbRot   = rotationMap[tier] || null;

    const chars = isKnown
      ? (STATIC_CHARS[tier] || [])
      : (compCharsMap[tier]||[]).map(c=>({name:c.char_name, bond:c.costume_name||'', slug:c.char_slug, costume_name:c.costume_name||''}));

    let rotation;
    if (dbRot && Object.keys(dbRot).length > 0) {
      rotation = dbRot;
    } else {
      rotation = {};
    }

    let unitOrder;
    if (dbComp.unit_order && dbComp.unit_order !== '[]') {
      try { unitOrder = JSON.parse(dbComp.unit_order); } catch { unitOrder = STATIC_UNIT_ORDER[tier] || []; }
    } else {
      unitOrder = STATIC_UNIT_ORDER[tier] || [];
    }

    let notes;
    if (tier === 'T1' && (dbComp.type||'ATK') === 'ATK') {
      notes = STATIC_NOTES.T1 || [];
    } else {
      const tierNoteKey = dbNotes[tier] || dbNotes[tier.toLowerCase()];
      if (tierNoteKey) {
        notes = String(tierNoteKey).split('\n').filter(Boolean);
      } else if (isKnown) {
        notes = dbComp.description ? dbComp.description.split('\n').filter(Boolean) : (STATIC_NOTES[tier] || []);
      } else {
        notes = dbComp.description ? dbComp.description.split('\n').filter(Boolean) : [];
      }
    }

    const staticMatchup = STATIC_MATCHUPS[tier] || {counters:[],countered_by:[]};
    const counteredBy = dbComp.countered_by
      ? dbComp.countered_by.split(',').map(s=>s.trim()).filter(Boolean)
      : staticMatchup.countered_by;

    let preemptive = [];
    const preemptiveRaw = extraMap[`preemptive_${tierLow}`];
    if (preemptiveRaw) { try { preemptive = JSON.parse(preemptiveRaw); } catch {} }

    const howToPlay = extraMap[`how_to_play_${tierLow}`] || '';
    const countersRaw = extraMap[`counters_${tierLow}`] || '';
    const dbCounters = countersRaw ? countersRaw.split(',').map(s=>s.trim()).filter(Boolean) : [];

    return renderComp({
      tier,
      name: dbComp.name,
      type: dbComp.type || 'ATK',
      color: dbComp.color || '#c9a84c',
      anchorId: compAnchor(dbComp),
      chars,
      bondsData: (tier === 'T1' && (dbComp.type||'ATK') === 'ATK') ? T1_DATA.bonds : null,
      rotation,
      unitOrder,
      notes,
      counters: dbCounters.length ? dbCounters : staticMatchup.counters,
      countered_by: counteredBy,
      warning: STATIC_WARNINGS[tier] || null,
      preemptive,
      howToPlay,
      guide_label: dbComp.guide_label || '',
      compGear: compGearMap[tier.toLowerCase()] || {},
    }, mediaMap, elementBySlug);
  };

  let compsHtml = '';

  // Comp sections get a codex-divider between each so the page reads as
  // a sequence of chapters instead of a single endless scroll. Type-section
  // headers (Attacking / Defence) get the same eyebrow rule treatment as
  // section-title across the rest of the codex direction.
  const sectionHeader = (label, color, hairlineRgba) => `
<div class="guide-type-head" style="margin:2.5rem 0 1.75rem;">
  <div style="font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.66rem;font-weight:600;color:${color};letter-spacing:0.28em;text-transform:uppercase;display:inline-flex;align-items:center;gap:0.85rem;">
    <span style="display:inline-block;width:28px;height:1px;background:${color};opacity:0.75"></span>
    ${label}
  </div>
  <div style="font-family:'Fraunces',Georgia,serif;font-weight:500;font-variation-settings:'opsz' 96;font-size:1.4rem;color:#eef0fa;letter-spacing:-0.01em;margin-top:0.35rem;">${label === 'Attacking' ? 'Attack Compositions' : 'Defence Compositions'}</div>
</div>`;

  if (atkComps.length) {
    compsHtml += sectionHeader('Attacking', '#5dade2');
    compsHtml += atkComps.map((c, i) => buildCompHtml(c) + (i < atkComps.length - 1 ? '<div class="codex-divider"><span></span></div>' : '')).join('');
  }

  if (defComps.length) {
    compsHtml += sectionHeader('Defence', '#2ecc71');
    compsHtml += defComps.map((c, i) => buildCompHtml(c) + (i < defComps.length - 1 ? '<div class="codex-divider"><span></span></div>' : '')).join('');
  }

  return await layout('PvP Guide', `
<div style="display:flex;padding-top:1rem">
  <div class="section" style="flex:1;min-width:0;padding-right:0">
    <div class="hero" style="padding:2rem 2rem 2rem;text-align:left">
      <div class="hero-tag">Mirror Wars</div>
      <h1>PvP Composition <span>Guide</span></h1>
      <p style="margin:0">Top 30 — Rank 1 team compositions curated by BnKitsu</p>
    </div>
    ${compsHtml}
  </div>
  <div class="guide-sidebar">
    <div class="guide-sidebar-title">Jump To</div>
    ${sidebarLinks}
  </div>
</div>

<script>
document.addEventListener('click', function(e) {
  // Maximize button must win over the card-flip wrap it sits inside.
  var expandBtn = e.target.closest('[data-action="expand-img"]');
  if (expandBtn) {
    e.preventDefault();
    e.stopPropagation();
    try { openLightbox(expandBtn.dataset.src); }
    catch (err) { console.error('openLightbox failed', err); }
    return;
  }
  var b = e.target.closest('[data-action]');
  if (!b) return;
  var action = b.dataset.action;
  if (action === 'card-flip')   toggleFlip(b.dataset.slug);
  if (action === 'board-flip') {
    var wrap = b.closest('[data-action="board-flip"]');
    if (wrap) toggleBoardFlip(wrap.dataset.tier);
  }
});

function toggleFlip(cardId) {
  var inner = document.getElementById('card-' + cardId);
  if (!inner) return;
  inner.classList.toggle('flipped');
  var wrap = inner.parentElement;
  if (wrap) wrap.classList.toggle('flipped', inner.classList.contains('flipped'));
}

function toggleBoardFlip(tier) {
  var inner = document.getElementById('board-card-' + tier);
  if (!inner) return;
  inner.classList.toggle('flipped');
}

document.addEventListener('mouseover', function(e) {
  var wrap = e.target.closest('.skill-wrap');
  if (!wrap) return;
  var popup = wrap.querySelector('.tt-popup');
  if (!popup) return;
  popup.style.visibility = 'hidden';
  popup.style.display = 'block';
  popup.style.position = 'fixed';
  popup.style.zIndex = '99999';
  // Clear CSS defaults that fight our inline positioning
  popup.style.transform = 'none';
  popup.style.bottom = 'auto';
  popup.style.right = 'auto';
  popup.style.width = 'auto';
  popup.style.left = '0px';
  popup.style.top = '0px';
  popup.style.background = '#0f0f18';
  popup.style.border = '1px solid rgba(201,168,76,0.35)';
  popup.style.borderRadius = '6px';
  popup.style.boxShadow = '0 8px 32px rgba(0,0,0,0.8)';
  popup.style.padding = '6px 10px';
  popup.style.whiteSpace = 'nowrap';
  popup.style.minWidth = '80px';
  popup.style.textAlign = 'center';
  var ph = popup.offsetHeight;
  var pw = popup.offsetWidth;
  var iconBox = wrap.querySelector('.skill-icon-box') || wrap;
  var rect = iconBox.getBoundingClientRect();
  var left = rect.left + rect.width / 2 - pw / 2;
  left = Math.max(4, Math.min(left, window.innerWidth - pw - 8));
  var top = rect.top - ph - 6;
  if (top < 4) top = rect.bottom + 6;
  popup.style.left = left + 'px';
  popup.style.top = top + 'px';
  popup.style.visibility = 'visible';
});
document.addEventListener('mouseout', function(e) {
  var wrap = e.target.closest('.skill-wrap');
  if (!wrap || wrap.contains(e.relatedTarget)) return;
  var popup = wrap.querySelector('.tt-popup');
  if (popup) popup.style.display = 'none';
});

document.addEventListener('error', function(e) {
  if (e.target.classList && e.target.classList.contains('img-err-hide')) {
    e.target.classList.add('errored');
  }
}, true);

function openLightbox(src) {
  if (!src || src.indexOf('undefined') !== -1) return;
  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.93);z-index:99999;display:flex;align-items:center;justify-content:center;padding:2rem;cursor:zoom-out;animation:vm-fade 0.2s ease-out';
  // Frame the image with the codex pattern: brass corner brackets via
  // pseudo-element on a relatively-positioned wrap, soft amber ambient glow.
  var wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;max-width:92vw;max-height:90vh;cursor:default;filter:drop-shadow(0 12px 32px rgba(0,0,0,0.7)) drop-shadow(0 0 24px rgba(201,168,76,0.18))';
  var img = document.createElement('img');
  img.src = src;
  img.style.cssText = 'display:block;max-width:92vw;max-height:90vh;object-fit:contain;border-radius:3px;box-shadow:0 0 0 1px rgba(201,168,76,0.4)';
  wrap.appendChild(img);
  var corners = document.createElement('div');
  corners.style.cssText = 'position:absolute;inset:0;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27 preserveAspectRatio=%27none%27%3E%3Cg fill=%27none%27 stroke=%27%23c9a84c%27 stroke-width=%270.3%27 opacity=%270.7%27%3E%3Cpath d=%27M0 5 L0 0 L5 0%27/%3E%3Cpath d=%2795 0 L100 0 L100 5%27/%3E%3Cpath d=%27M100 95 L100 100 L95 100%27/%3E%3Cpath d=%27M5 100 L0 100 L0 95%27/%3E%3C/g%3E%3C/svg%3E");background-size:100% 100%';
  wrap.appendChild(corners);
  ov.appendChild(wrap);
  wrap.addEventListener('click', function(e){ e.stopPropagation(); });
  ov.onclick = function() { if (document.body.contains(ov)) document.body.removeChild(ov); };
  document.addEventListener('keydown', function escFn(ev) {
    if (ev.key === 'Escape' && document.body.contains(ov)) { document.body.removeChild(ov); document.removeEventListener('keydown', escFn); }
  }, { once: true });
  document.body.appendChild(ov);
}

// Video modal — opens a centered 16:9 iframe (YouTube) or <video> (file)
// on click of any .video-thumb. The iframe is created lazily so we never
// load a YouTube player until the user actually wants to watch.
(function(){
  document.addEventListener('click', function(e){
    var btn = e.target.closest('[data-action="open-video"]');
    if (!btn) return;
    e.preventDefault();
    var kind = btn.dataset.videoKind;
    var id = btn.dataset.videoId;
    var src = btn.dataset.videoSrc;
    var ov = document.createElement('div');
    ov.className = 'video-modal';
    var inner = '';
    var stageClass = 'video-modal-stage';
    if (kind === 'yt' && id) {
      inner = '<iframe src="https://www.youtube.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
    } else if (kind === 'tweet' && id) {
      stageClass = 'video-modal-stage video-modal-stage-tweet';
      inner = '<div class="tweet-host" id="tweet-host-' + id + '"></div>'
        + '<div class="tweet-loading" id="tweet-loading-' + id + '"><span class="loading-spinner"></span>Loading post</div>'
        + '<a class="tweet-fallback" href="https://x.com/i/status/' + encodeURIComponent(id) + '" target="_blank" rel="noopener">Open on X &#8599;</a>';
    } else if (kind === 'file' && src) {
      inner = '<video controls autoplay playsinline src="' + src.replace(/"/g,'&quot;') + '"></video>';
    }
    ov.innerHTML = '<div class="' + stageClass + '">' + inner + '<button type="button" class="video-modal-close" aria-label="Close">&#10005;</button></div>';
    function close(){ if (ov.parentNode) ov.parentNode.removeChild(ov); document.removeEventListener('keydown', onKey); }
    function onKey(ev){ if (ev.key === 'Escape') close(); }
    ov.addEventListener('click', function(ev){ if (ev.target === ov || ev.target.classList.contains('video-modal-close')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(ov);

    if (kind === 'tweet' && id) {
      var escA = function(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
      var pickMp4 = function(video){
        var variants = (video && video.variants) || [];
        var mp4s = variants.filter(function(v){
          var ct = (v.content_type || '').toLowerCase();
          var u = (v.url || '').toLowerCase();
          return ct === 'video/mp4' || /\\.mp4(?:$|\\?)/.test(u);
        });
        if (mp4s.length) {
          mp4s.sort(function(a, b){ return (b.bitrate || 0) - (a.bitrate || 0); });
          return mp4s[0].url;
        }
        var url = (video && video.url) || '';
        if (/\\.m3u8(?:$|\\?)/i.test(url)) return '';
        return url;
      };
      fetch('https://api.fxtwitter.com/i/status/' + encodeURIComponent(id))
        .then(function(r){ return r.json(); })
        .then(function(data){
          var host = document.getElementById('tweet-host-' + id);
          var loading = document.getElementById('tweet-loading-' + id);
          if (loading) loading.remove();
          if (!host) return;
          var tw = data && data.tweet;
          if (!tw || data.code !== 200) {
            host.innerHTML = '<div class="tweet-unavailable">This post is unavailable, private, or has been removed.</div>';
            return;
          }
          var video = tw.media && tw.media.videos && tw.media.videos[0];
          var photo = tw.media && tw.media.photos && tw.media.photos[0];
          var author = (tw.author && tw.author.name) || '';
          var handle = (tw.author && tw.author.screen_name) || '';
          var text = tw.text || '';
          var videoUrl = video ? pickMp4(video) : '';
          var mediaHtml = '';
          if (videoUrl) {
            mediaHtml = '<video class="tweet-video" controls autoplay muted playsinline preload="auto"'
              + (video.thumbnail_url ? ' poster="' + escA(video.thumbnail_url) + '"' : '')
              + ' src="' + escA(videoUrl) + '"></video>';
          } else if (photo && photo.url) {
            mediaHtml = '<img class="tweet-image" src="' + escA(photo.url) + '" alt="">';
          }
          var header = author
            ? '<div class="tweet-author">' + escA(author)
              + (handle ? ' <span class="tweet-handle">@' + escA(handle) + '</span>' : '')
              + '</div>'
            : '';
          var body = text ? '<div class="tweet-text">' + escA(text).replace(/\\n/g,'<br>') + '</div>' : '';
          host.innerHTML = '<div class="tweet-card">' + header + (mediaHtml ? '<div class="tweet-media">' + mediaHtml + '</div>' : '') + body + '</div>';
          var vEl = host.querySelector('video.tweet-video');
          if (vEl) {
            vEl.addEventListener('error', function(){
              var box = vEl.parentNode;
              if (!box) return;
              box.innerHTML = '<div class="tweet-unavailable">This video can\\'t play here. Use the Open on X link below.</div>';
            });
          }
        })
        .catch(function(){
          var host = document.getElementById('tweet-host-' + id);
          var loading = document.getElementById('tweet-loading-' + id);
          if (loading) loading.remove();
          if (host) host.innerHTML = '<div class="tweet-unavailable">Couldn\\'t reach the post proxy — try the Open on X link below.</div>';
        });
    }
  });
})();
</script>
`, 'guide', env, request);
}
