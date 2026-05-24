// Cached CSS body + content-version hash. Computed once per isolate so the
// stylesheet response and the cache-busting query string come for free.
let _cssBody = null;
let _cssVer = null;

export function getCssVersion() {
  if (_cssVer) return _cssVer;
  const body = getStyles();
  let h = 0;
  for (let i = 0; i < body.length; i++) h = ((h << 5) - h + body.charCodeAt(i)) | 0;
  _cssVer = Math.abs(h).toString(36);
  return _cssVer;
}

export function handleStylesheet() {
  return new Response(getStyles(), {
    headers: {
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

export function getStyles() {
  if (_cssBody) return _cssBody;
  _cssBody = `
/* Fonts are now loaded via <link> tags in <head> (see layout.js) so the
   inline CSS doesn't block on a Google Fonts CSS request. The @import here
   was forcing every page to serialize on a separate HTTPS round-trip before
   the rest of the styles could parse. */

/* ── Codex card (Brown Dust Codex direction pilot) ────────────────────────
   Editorial dark-theme tier card. Used so far only by the home page's
   compCard(); we'll roll the same direction out to other components if
   this lands well. */
.codex-card{position:relative;display:flex;flex-direction:column;height:100%;min-height:160px;text-decoration:none;background:#14141e;border-radius:4px;overflow:hidden;isolation:isolate;box-shadow:inset 3px 0 0 var(--codex-accent,#c9a84c),0 1px 0 rgba(220,230,255,0.06) inset,0 0 0 1px rgba(220,230,255,0.04),0 10px 28px rgba(0,0,0,0.55),0 2px 4px rgba(0,0,0,0.6);transition:transform 0.25s cubic-bezier(0.22,1,0.36,1),box-shadow 0.3s ease;}
.codex-card:hover{transform:translateY(-3px);box-shadow:inset 3px 0 0 var(--codex-accent,#c9a84c),0 1px 0 rgba(220,230,255,0.09) inset,0 0 0 1px rgba(220,230,255,0.07),0 18px 38px rgba(0,0,0,0.65),0 3px 6px rgba(0,0,0,0.7),0 0 28px rgba(201,168,76,0.18);}
.codex-card::before{content:'';position:absolute;inset:0;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");mix-blend-mode:overlay;opacity:0.18;z-index:0;}
/* Ornate gold corner brackets — small JRPG-UI flourishes at each corner. */
.codex-card::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:3;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cg fill='none' stroke='%23c9a84c' stroke-width='0.6' opacity='0.55'%3E%3Cpath d='M0 8 L0 0 L8 0'/%3E%3Cpath d='M92 0 L100 0 L100 8'/%3E%3Cpath d='M100 92 L100 100 L92 100'/%3E%3Cpath d='M8 100 L0 100 L0 92'/%3E%3C/g%3E%3C/svg%3E");background-size:100% 100%;}
.codex-card-inner{position:relative;z-index:1;flex:1;padding:1.15rem 1.25rem 1.15rem 1.45rem;display:grid;grid-template-columns:auto 1fr;gap:1rem;align-items:start;}
.codex-tier{font-family:'Fraunces',Georgia,serif;font-weight:600;font-variation-settings:'opsz' 144;font-size:2.4rem;line-height:0.85;color:var(--codex-accent,#c9a84c);letter-spacing:-0.025em;margin-top:0.05em;text-shadow:0 1px 2px rgba(0,0,0,0.4);}
.codex-body{display:flex;flex-direction:column;gap:0.45rem;min-width:0;}
.codex-meta{display:flex;align-items:center;gap:0.55rem;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.62rem;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:rgba(220,228,245,0.42);}
.codex-meta-dot{width:4px;height:4px;border-radius:50%;background:var(--codex-accent,#c9a84c);box-shadow:0 0 6px var(--codex-accent,#c9a84c);}
.codex-name{font-family:'Fraunces',Georgia,serif;font-weight:500;font-variation-settings:'opsz' 36;font-size:1.05rem;line-height:1.25;color:#eef0fa;letter-spacing:-0.005em;margin:0;}
.codex-desc{font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.76rem;line-height:1.6;color:rgba(220,228,245,0.6);margin:0;}

/* Codex section header — large comp blocks on the PvP Guide page. */
.codex-section-head{display:grid;grid-template-columns:auto 1fr;gap:1.5rem;align-items:start;margin-bottom:2.25rem;padding-bottom:1.5rem;position:relative;}
.codex-section-head::after{content:'';position:absolute;left:0;right:0;bottom:0;height:1px;background:linear-gradient(to right,var(--codex-accent,#c9a84c) 0,var(--codex-accent,#c9a84c) 48px,rgba(220,228,245,0.06) 48px,rgba(220,228,245,0.06) 100%);}
.codex-section-tier{font-family:'Fraunces',Georgia,serif;font-weight:600;font-variation-settings:'opsz' 144;font-size:4.2rem;line-height:0.85;color:var(--codex-accent,#c9a84c);letter-spacing:-0.03em;margin:-0.05em 0 0 0;text-shadow:0 2px 4px rgba(0,0,0,0.5);}
.codex-section-body{display:flex;flex-direction:column;gap:0.5rem;min-width:0;padding-top:0.4rem;}
.codex-section-meta{display:flex;align-items:center;gap:0.7rem;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.64rem;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:rgba(220,228,245,0.45);}
.codex-section-meta-dot{width:5px;height:5px;border-radius:50%;background:var(--codex-accent,#c9a84c);box-shadow:0 0 8px var(--codex-accent,#c9a84c);}
.codex-section-name{font-family:'Fraunces',Georgia,serif;font-weight:500;font-variation-settings:'opsz' 96;font-size:1.85rem;line-height:1.15;color:#eef0fa;letter-spacing:-0.015em;margin:0;}
.codex-section-tags{display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.35rem;}
.codex-tag{display:inline-flex;align-items:center;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.7rem;font-weight:500;letter-spacing:0.04em;padding:5px 12px;border-radius:2px;background:rgba(220,228,245,0.04);color:rgba(220,228,245,0.7);border-left:2px solid var(--codex-accent,#c9a84c);}
.codex-tag-warn{background:var(--crimson-tint);color:#e0907a;border-left-color:var(--crimson);}
.codex-tag-pos{background:rgba(39,174,96,0.08);color:#7cd9a1;border-left-color:#27ae60;}
.codex-tag-neg{background:rgba(192,57,43,0.08);color:#e88a7d;border-left-color:#c0392b;}

/* Decorative section divider — small rhombus ornament centered between two
   gradient hairlines. Use anywhere a horizontal break feels right. */
.codex-divider{display:flex;align-items:center;justify-content:center;gap:0.85rem;max-width:560px;margin:2.75rem auto;color:var(--gold);opacity:0.8;pointer-events:none;}
.codex-divider::before,.codex-divider::after{content:'';flex:1;height:1px;background:linear-gradient(to right,transparent,rgba(201,168,76,0.55) 50%,transparent);}
.codex-divider::before{background:linear-gradient(to right,transparent,rgba(201,168,76,0.55));}
.codex-divider::after{background:linear-gradient(to right,rgba(201,168,76,0.55),transparent);}
.codex-divider span{display:inline-block;width:8px;height:8px;transform:rotate(45deg);background:linear-gradient(135deg,#e8c76a,#a07830);box-shadow:0 0 8px rgba(201,168,76,0.45);}

/* Codex hint / riddle modal — used on /emotes for the ? button. Same
   ink-blue + brass corner-bracket aesthetic as the set-unlock modal. */
.hint-modal{display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.78);align-items:center;justify-content:center;padding:1.25rem;animation:hint-modal-fade 0.22s ease-out;}
.hint-modal.show,.hint-modal[style*="flex"]{display:flex;}
.hint-modal-card{position:relative;background:#14141e;border-radius:4px;padding:2rem 2.25rem 1.5rem;max-width:460px;width:100%;text-align:center;isolation:isolate;box-shadow:0 1px 0 rgba(220,230,255,0.07) inset,0 0 0 1px rgba(220,230,255,0.05),0 22px 56px rgba(0,0,0,0.7),0 0 32px rgba(201,168,76,0.15);animation:hint-modal-in 0.32s cubic-bezier(0.22,1,0.36,1);}
.hint-modal-card::after{content:'';position:absolute;inset:0;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cg fill='none' stroke='%23c9a84c' stroke-width='0.5' opacity='0.5'%3E%3Cpath d='M0 8 L0 0 L8 0'/%3E%3Cpath d='M92 0 L100 0 L100 8'/%3E%3Cpath d='M100 92 L100 100 L92 100'/%3E%3Cpath d='M8 100 L0 100 L0 92'/%3E%3C/g%3E%3C/svg%3E");background-size:100% 100%;border-radius:4px;}
.hint-modal-eyebrow{display:flex;align-items:center;justify-content:center;gap:0.65rem;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.66rem;font-weight:600;letter-spacing:0.32em;text-transform:uppercase;color:var(--gold2);margin-bottom:1rem;}
.hint-modal-rule{display:inline-block;width:24px;height:1px;background:var(--gold);opacity:0.75;}
.hint-modal-body{font-family:'Fraunces',Georgia,serif;font-variation-settings:'opsz' 24;font-size:1rem;font-style:italic;line-height:1.65;color:#eef0fa;margin-bottom:1.5rem;white-space:pre-line;text-align:left;}
.hint-modal-close{display:inline-block;}
@keyframes hint-modal-fade{from{opacity:0;}to{opacity:1;}}
@keyframes hint-modal-in{from{opacity:0;transform:translateY(12px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);}}

/* Codex toast — small ephemeral notification that slides up from the bottom
   center. Used for sub-puzzle reveals + similar lightweight surfaces. */
.codex-toast{position:fixed;bottom:2.25rem;left:50%;transform:translateX(-50%) translateY(0);background:#14141e;color:var(--gold2);padding:0.85rem 1.5rem;border-radius:3px;font-family:'Fraunces',Georgia,serif;font-style:italic;font-variation-settings:'opsz' 24;font-size:0.92rem;letter-spacing:0.005em;z-index:11000;transition:opacity 0.4s ease,transform 0.4s ease;box-shadow:0 1px 0 rgba(220,230,255,0.07) inset,0 0 0 1px rgba(220,230,255,0.06),0 0 0 1px rgba(201,168,76,0.42),0 16px 40px rgba(0,0,0,0.6),0 0 26px rgba(201,168,76,0.2);animation:codex-toast-in 0.5s cubic-bezier(0.22,1,0.36,1);}
@keyframes codex-toast-in{from{opacity:0;transform:translateX(-50%) translateY(12px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}

/* Egg modal (the secret-code prompt at the bottom of /home) — same codex
   modal pattern as hint-modal + set-unlock. Inputs styled inline since
   this is a one-off field; matches form-group bottom-rule treatment. */
.egg-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.82);z-index:9999;align-items:center;justify-content:center;padding:1.25rem;animation:hint-modal-fade 0.22s ease-out;}
.egg-modal[style*="flex"]{display:flex;}
.egg-modal-card{position:relative;background:#14141e;border-radius:4px;padding:2rem 2.25rem 1.6rem;max-width:380px;width:100%;text-align:center;isolation:isolate;box-shadow:0 1px 0 rgba(220,230,255,0.07) inset,0 0 0 1px rgba(220,230,255,0.05),0 22px 56px rgba(0,0,0,0.7),0 0 32px rgba(201,168,76,0.15);animation:hint-modal-in 0.32s cubic-bezier(0.22,1,0.36,1);}
.egg-modal-card::after{content:'';position:absolute;inset:0;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cg fill='none' stroke='%23c9a84c' stroke-width='0.5' opacity='0.5'%3E%3Cpath d='M0 8 L0 0 L8 0'/%3E%3Cpath d='M92 0 L100 0 L100 8'/%3E%3Cpath d='M100 92 L100 100 L92 100'/%3E%3Cpath d='M8 100 L0 100 L0 92'/%3E%3C/g%3E%3C/svg%3E");background-size:100% 100%;border-radius:4px;}
.egg-modal-eyebrow{display:flex;align-items:center;justify-content:center;gap:0.65rem;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.66rem;font-weight:600;letter-spacing:0.32em;text-transform:uppercase;color:var(--gold2);margin-bottom:1rem;}
.egg-modal-rule{display:inline-block;width:22px;height:1px;background:var(--gold);opacity:0.75;}
.egg-modal-input{width:100%;box-sizing:border-box;background:rgba(220,230,255,0.025);border:none;border-bottom:1px solid rgba(220,230,255,0.18);color:#eef0fa;padding:10px 14px;border-radius:3px 3px 0 0;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.95rem;letter-spacing:0.06em;outline:none;text-align:center;margin-bottom:0.85rem;transition:border-color 0.18s ease,background 0.18s ease,box-shadow 0.18s ease;color-scheme:dark;}
.egg-modal-input:focus{border-bottom-color:var(--gold);background:rgba(220,230,255,0.04);box-shadow:0 1px 0 0 var(--gold);}
.egg-modal-input::placeholder{color:rgba(232,224,200,0.3);font-style:italic;letter-spacing:0.04em;}
.egg-modal-result{font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.84rem;min-height:1.3em;margin-bottom:1rem;color:rgba(220,228,245,0.75);}
.egg-modal-submit{width:auto;display:inline-block;}

/* Lightbox (image zoom on /guide) — soft codex frame around the zoomed
   image instead of the flat gold border. */
#guide-lightbox-overlay{cursor:zoom-out;}

/* Page-load stagger reveal — applied to any container with
   data-codex-reveal. Children fade up in sequence on first paint. */
[data-codex-reveal] > *{opacity:0;transform:translateY(8px);animation:codex-reveal-up 0.55s cubic-bezier(0.22,1,0.36,1) forwards;animation-delay:calc(var(--codex-i,0) * 60ms);}
@keyframes codex-reveal-up{to{opacity:1;transform:translateY(0);}}
@media (prefers-reduced-motion:reduce){
  [data-codex-reveal] > *{animation:none;opacity:1;transform:none;}
}
:root {
  --bg:#0a0a0f; --bg2:#0f0f18; --bg3:#13131e; --bg4:#1a1a28;
  --gold:#c9a84c; --gold2:#e8c76a; --gold3:#a07830;
  /* Crimson 2nd accent — used sparingly for danger/emphasis. Stops the page
     reading as pure mono-gold and gives a real second voice to the palette. */
  --crimson:#8e3a2d; --crimson-tint:rgba(142,58,45,0.14); --crimson-edge:rgba(142,58,45,0.55);
  --text:#e8e3d8; --text2:#b0a898; --text3:#706860;
  --border:rgba(201,168,76,0.2); --border2:rgba(201,168,76,0.1);
}
*{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{background:var(--bg);color:var(--text);font-family:'IBM Plex Sans',system-ui,sans-serif;min-height:100vh;overflow-x:hidden;}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 20% 0%,rgba(201,168,76,0.04),transparent 60%),radial-gradient(ellipse at 80% 100%,rgba(139,0,0,0.06),transparent 60%);pointer-events:none;z-index:0;}
/* Viewport vignette — darkens the edges so the page reads as a candlelit
   room. Keeps the centre clear so content isn't dimmed. */
body::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:1;background:radial-gradient(ellipse 110% 90% at 50% 50%,transparent 55%,rgba(0,0,0,0.55) 100%);}
nav{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(10,10,15,0.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);height:74px;display:flex;align-items:center;padding:0 1.5rem;gap:0.85rem;}
/* BnKitsu wordmark — custom designed signature. Layered composition:
   - Weapon (the spear) sits behind the wordmark, angled -22deg, anchored
     at the left so it reads as "raised behind the name".
   - "BnKitsu" rendered in Fraunces display, gold gradient text-fill so
     each letter has a subtle top-light highlight to base-shadow taper.
   - Thin gold rule under the name, fading off both ends, acts as the
     engraved baseline of a forge-stamped plate. */
.nav-logo{display:inline-flex;align-items:center;text-decoration:none;height:100%;padding:0.25rem 0;color:inherit;}
.nav-logo-mark{position:relative;display:inline-flex;align-items:center;padding:0.4rem 0.2rem 0.5rem 2.3rem;isolation:isolate;}
.nav-logo-weapon{
  position:absolute;left:-2px;top:50%;
  width:58px;height:58px;
  transform:translateY(-50%) rotate(-22deg);
  filter:drop-shadow(0 0 14px rgba(201,168,76,0.55)) drop-shadow(0 2px 4px rgba(0,0,0,0.7));
  pointer-events:none;z-index:1;opacity:0.92;
  transition:transform 0.45s cubic-bezier(0.22,1,0.36,1),filter 0.35s ease;
}
.nav-logo-name{
  position:relative;z-index:2;
  font-family:'Fraunces',Georgia,serif;
  font-weight:600;
  font-variation-settings:'opsz' 144;
  font-size:1.6rem;
  line-height:1;
  letter-spacing:-0.012em;
  /* Gold gradient text fill so each letter reads as polished brass with a
     top highlight tapering to a darker base. */
  background:linear-gradient(180deg,#f5dba0 0%,#e8c76a 35%,#c9a84c 65%,#8a6a2a 100%);
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
  -webkit-text-fill-color:transparent;
  /* A thin layered shadow under the gradient text gives the wordmark
     physical weight without breaking the metal-fill effect. */
  filter:drop-shadow(0 1px 0 rgba(0,0,0,0.55)) drop-shadow(0 0 10px rgba(201,168,76,0.18));
}
.nav-logo-rule{
  position:absolute;left:2.3rem;right:0.2rem;bottom:0.05rem;
  height:1px;z-index:2;
  background:linear-gradient(to right,transparent,var(--gold) 25%,var(--gold) 75%,transparent);
  opacity:0.55;
  transition:opacity 0.3s ease;
}
/* Hover: spear tips forward and brightens; the rule strengthens. */
.nav-logo:hover .nav-logo-weapon{transform:translateY(-50%) rotate(-30deg) scale(1.04);filter:drop-shadow(0 0 18px rgba(232,199,106,0.75)) drop-shadow(0 2px 5px rgba(0,0,0,0.75));opacity:1;}
.nav-logo:hover .nav-logo-rule{opacity:0.9;}
@media (max-width:640px){
  .nav-logo-mark{padding-left:1.85rem;}
  .nav-logo-name{font-size:1.35rem;}
  .nav-logo-weapon{width:48px;height:48px;}
}
.nav-spacer{flex:1;}
.nav-admin{display:flex;align-items:center;gap:4px;}
.nav-admin>a{background:var(--gold3);color:var(--bg);padding:6px 14px;border-radius:4px;text-decoration:none;font-size:0.8rem;font-weight:700;letter-spacing:0.05em;}
.nav-toggle{display:inline-flex;background:transparent;border:1px solid rgba(220,230,255,0.12);border-radius:3px;width:40px;height:36px;cursor:pointer;padding:0;flex-direction:column;align-items:center;justify-content:center;gap:5px;flex-shrink:0;transition:border-color 0.2s ease,background 0.2s ease,box-shadow 0.2s ease;}
.nav-toggle:hover{border-color:var(--gold);background:rgba(201,168,76,0.06);box-shadow:0 0 12px rgba(201,168,76,0.18);}
.nav-toggle span{display:block;width:20px;height:1.5px;background:var(--gold2);border-radius:1px;transition:transform 0.32s cubic-bezier(0.22,1,0.36,1),opacity 0.18s ease,background 0.18s ease;}
.nav-toggle.open{border-color:var(--gold);background:rgba(201,168,76,0.08);}
.nav-toggle.open span{background:var(--gold);}
.nav-toggle.open span:nth-child(1){transform:translateY(6.5px) rotate(45deg);}
.nav-toggle.open span:nth-child(2){opacity:0;transform:translateX(-8px);}
.nav-toggle.open span:nth-child(3){transform:translateY(-6.5px) rotate(-45deg);}
.nav-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99;}
.nav-backdrop.open{display:block;}
/* Side-nav drawer — codex-aligned. Slides in with a soft cubic ease, gets a
   right-edge gold hairline gradient and a gentle drop shadow so it reads as
   a sliding panel rather than a flat sheet. */
.nav-side{position:fixed;top:74px;bottom:0;left:0;width:300px;max-width:85vw;background:rgba(10,10,15,0.98);display:flex;flex-direction:column;align-items:stretch;padding:1.25rem 0 1rem;overflow-y:auto;z-index:110;transform:translateX(-100%);transition:transform 0.32s cubic-bezier(0.22,1,0.36,1),box-shadow 0.32s ease;box-shadow:0 0 0 transparent;}
.nav-side::after{content:'';position:absolute;top:0;bottom:0;right:0;width:1px;background:linear-gradient(180deg,transparent,rgba(201,168,76,0.4) 18%,rgba(201,168,76,0.4) 82%,transparent);pointer-events:none;}
.nav-side.open{transform:translateX(0);box-shadow:24px 0 60px rgba(0,0,0,0.55),0 0 80px rgba(201,168,76,0.06);}
.nav-side>a{position:relative;display:block;color:rgba(220,228,245,0.65);text-decoration:none;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.72rem;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;padding:0.95rem 1.6rem;transition:color 0.18s ease,background 0.18s ease,padding 0.22s ease;white-space:nowrap;}
.nav-side>a::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%) scaleY(0);transform-origin:center;width:3px;height:60%;background:var(--gold);transition:transform 0.22s cubic-bezier(0.22,1,0.36,1);}
.nav-side>a:hover{color:var(--gold2);background:rgba(201,168,76,0.04);padding-left:1.85rem;}
.nav-side>a:hover::before{transform:translateY(-50%) scaleY(1);}
.nav-side>a.nav-active{color:var(--gold2);background:rgba(201,168,76,0.08);}
.nav-side>a.nav-active::before{transform:translateY(-50%) scaleY(1);}
.nav-side-header{font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.62rem;color:rgba(220,228,245,0.42);letter-spacing:0.32em;text-transform:uppercase;padding:0.4rem 1.6rem 1.1rem;position:relative;margin-bottom:0.4rem;flex-shrink:0;}
.nav-side-header::after{content:'';position:absolute;left:1.6rem;right:1.6rem;bottom:0.4rem;height:1px;background:linear-gradient(to right,var(--gold) 0,var(--gold) 24px,rgba(220,230,255,0.06) 24px,rgba(220,230,255,0.06) 100%);}

/* Character circle — Set 4 unlock widget at the bottom of the side nav.
   Same approach as the Mamonir nav-icon: a small clip box with a much larger
   image inside positioned by bottom offset so the upper torso/head shows. */
.char-circle{position:relative;width:260px;height:260px;margin:1.5rem auto 1.25rem;flex-shrink:0;}
.char-pos{position:absolute;top:50%;left:50%;width:80px;height:90px;margin:-45px -40px;background:transparent;border:none;cursor:pointer;padding:0;overflow:hidden;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;}
.char-pos:not(.char-pos-center){transform:rotate(var(--a)) translateY(-100px) rotate(calc(-1 * var(--a)));}
.char-pos.char-pos-center{transform:translate(0,0);}
.char-pos img{height:170px;width:auto;display:block;position:absolute;bottom:-50px;left:50%;transform:translateX(-50%);filter:drop-shadow(0 2px 4px rgba(0,0,0,0.7));pointer-events:none;-webkit-user-drag:none;transition:transform 0.12s ease;}
.char-pos:hover img{filter:drop-shadow(0 0 6px rgba(201,168,76,0.6)) drop-shadow(0 2px 4px rgba(0,0,0,0.7));}
.char-pos.char-pos-tap img{transform:translateX(-50%) scale(0.85);}
/* Voice-line caption under the char-circle. Italic Fraunces in gold, fades
   in/out around 2.4s. Reserved minimum line height so the layout doesn't
   jump when a line appears. */
.char-voice-line{
  position:relative;display:block;margin:0.5rem 1.25rem 1.4rem;
  min-height:2.6em;text-align:center;
  font-family:'Fraunces',Georgia,serif;font-style:italic;
  font-variation-settings:'opsz' 24;font-size:0.9rem;
  line-height:1.45;letter-spacing:0.005em;
  color:rgba(232,199,106,0);
  transition:color 0.42s ease,transform 0.42s cubic-bezier(0.22,1,0.36,1);
  transform:translateY(4px);
  pointer-events:none;
}
.char-voice-line.show{color:var(--gold2);transform:translateY(0);text-shadow:0 0 12px rgba(201,168,76,0.25);}
/* Decorative quotation marks when active — engraved opener + closer in a
   dim gold so the line reads as a quote, not just a caption. */
.char-voice-line.show::before,.char-voice-line.show::after{position:absolute;font-family:'Fraunces',Georgia,serif;font-style:normal;font-variation-settings:'opsz' 96;color:rgba(201,168,76,0.32);font-size:1.6rem;line-height:1;}
.char-voice-line.show::before{content:'“';left:0.4rem;top:-0.1em;}
.char-voice-line.show::after{content:'”';right:0.4rem;bottom:-0.25em;}

/* Mamonir nav icon — the source image has transparent padding around the
   character, so we render the img larger than the wrap and clip the wrap
   with overflow:hidden. The visible character ends up nearly filling the
   navbar vertically. The bubble lives outside the clip so it can escape. */
.mam-wrap{position:relative;display:inline-block;width:64px;height:74px;cursor:pointer;margin-left:6px;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;vertical-align:middle;}
.mam-clip{position:absolute;inset:0;overflow:hidden;}
.mam-wrap img{height:160px;width:auto;display:block;position:absolute;bottom:-44px;left:50%;transform:translateX(-50%);image-rendering:auto;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.7));-webkit-user-drag:none;pointer-events:none;}
.mam-wrap img.mam-press{transform:translateX(-50%) scale(0.85);transition:transform 0.08s ease;}
/* Mamonir's dialogue bubble — italic Fraunces line so her voice reads as
   character speech rather than UI text. Brass-edged ink-blue card. */
.mam-bubble{position:absolute;top:calc(100% + 10px);left:50%;transform:translateX(-50%) translateY(-4px);background:#14141e;color:#eef0fa;font-family:'Fraunces',Georgia,serif;font-style:italic;font-variation-settings:'opsz' 24;font-size:0.85rem;letter-spacing:0.005em;padding:7px 14px;border-radius:3px;white-space:nowrap;opacity:0;pointer-events:none;z-index:102;box-shadow:0 1px 0 rgba(220,230,255,0.06) inset,0 0 0 1px rgba(220,230,255,0.06),0 0 0 1px rgba(201,168,76,0.4),0 8px 22px rgba(0,0,0,0.65),0 0 18px rgba(201,168,76,0.18);}
.mam-bubble::after{content:'';position:absolute;bottom:100%;left:50%;transform:translateX(-50%);border:5px solid transparent;border-bottom-color:rgba(201,168,76,0.5);}
.mam-bubble-show{animation:mam-bubble-pop 1.4s ease-out forwards;}
@keyframes mam-bubble-pop{0%{opacity:0;transform:translateX(-50%) translateY(-6px) scale(0.85);}15%{opacity:1;transform:translateX(-50%) translateY(0) scale(1);}80%{opacity:1;transform:translateX(-50%) translateY(2px) scale(1);}100%{opacity:0;transform:translateX(-50%) translateY(8px) scale(0.95);}}

@media(max-width:820px){
  nav{padding:0 1rem;gap:0.5rem;}
  .nav-admin{gap:6px;}
  .nav-admin>a{padding:5px 10px;font-size:0.72rem;}
  .mam-wrap{margin-left:0;width:56px;height:74px;}
  .mam-wrap img{height:150px;bottom:-40px;}
  .mam-bubble{font-size:0.72rem;padding:5px 10px;}
}
main{padding-top:74px;position:relative;z-index:1;}
.hero{padding:5rem 2rem 3rem;text-align:center;position:relative;}
/* Hero load motion — sequence of stagger reveals on hero children so the
   page entrance reads as an opening sequence rather than an instant snap.
   Per-element delays so each piece arrives in deliberate order. */
.hero > .hero-tag,.hero > h1,.hero > p,.hero > .hero-disclaimer{opacity:0;transform:translateY(10px);animation:hero-enter 0.7s cubic-bezier(0.22,1,0.36,1) forwards;}
.hero > .hero-tag{animation-delay:0.05s;}
.hero > h1{animation-delay:0.18s;}
.hero > p{animation-delay:0.32s;}
.hero > .hero-disclaimer{animation-delay:0.46s;}
@keyframes hero-enter{to{opacity:1;transform:translateY(0);}}
@media (prefers-reduced-motion:reduce){
  .hero > .hero-tag,.hero > h1,.hero > p,.hero > .hero-disclaimer{animation:none;opacity:1;transform:none;}
}
.hero::after{content:'';position:absolute;bottom:0;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);}
/* Hero eyebrow tag — codex small-caps strip. Two short gold hairlines
   flanking the label so it reads as engraved, not a pill button. */
.hero-tag{display:inline-flex;align-items:center;gap:0.7rem;color:var(--gold2);font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.66rem;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;margin-bottom:1.25rem;background:transparent;border:none;padding:0;}
.hero-tag::before,.hero-tag::after{content:'';display:inline-block;width:24px;height:1px;background:var(--gold);opacity:0.7;}
/* Hero headline — Fraunces at display optical-size for a Renaissance/JRPG
   title feel. Decorative gold rule sits above the heading. */
.hero h1{position:relative;font-family:'Fraunces',Georgia,serif;font-weight:600;font-variation-settings:'opsz' 144;font-size:clamp(2.1rem,5.2vw,3.8rem);line-height:1.05;letter-spacing:-0.018em;margin:0.4rem 0 1rem;color:#eef0fa;}
.hero h1::before{content:'';display:block;width:54px;height:2px;background:linear-gradient(to right,transparent,var(--gold),transparent);margin:0 auto 1.1rem;}
.hero h1 span{color:var(--gold);font-style:italic;font-variation-settings:'opsz' 144;}
.hero p{color:var(--text2);font-size:1rem;max-width:600px;margin:0 auto 2rem;line-height:1.7;}
.hero-disclaimer{display:inline-block;background:var(--crimson-tint);border:1px solid var(--crimson-edge);border-left:3px solid var(--crimson);color:#e0907a;font-size:0.8rem;padding:8px 18px;border-radius:2px;font-family:'IBM Plex Sans',system-ui,sans-serif;font-weight:500;}
.section{padding:4rem 2rem;max-width:1200px;margin:0 auto;}
/* Section title — Fraunces display heading with a small caps eyebrow rule
   above. Matches the hero h1 treatment in feel. */
.section-title{position:relative;font-family:'Fraunces',Georgia,serif;font-weight:500;font-variation-settings:'opsz' 96;font-size:1.65rem;line-height:1.1;color:#eef0fa;letter-spacing:-0.012em;margin:0.35rem 0 0.4rem;display:inline-block;}
.section-title::before{content:'';display:block;width:32px;height:1px;background:var(--gold);opacity:0.7;margin-bottom:0.7rem;}
.section-sub{font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.68rem;font-weight:500;letter-spacing:0.24em;text-transform:uppercase;color:rgba(220,228,245,0.42);margin-bottom:2rem;}
.tier-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem;}
.tier-card{background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:1.25rem;cursor:pointer;transition:all 0.2s;text-decoration:none;display:block;}
.tier-card:hover{border-color:var(--gold);background:var(--bg4);transform:translateY(-2px);}
.tier-badge{position:relative;display:inline-flex;align-items:center;justify-content:center;font-family:'Fraunces',Georgia,serif;font-weight:600;font-variation-settings:'opsz' 36;font-size:0.92rem;letter-spacing:-0.005em;padding:5px 14px;border-radius:2px;color:#0a0a0f;border:1px solid rgba(0,0,0,0.35);box-shadow:inset 0 1px 0 rgba(255,255,255,0.28),inset 0 -1px 0 rgba(0,0,0,0.4),0 1px 2px rgba(0,0,0,0.45),0 2px 6px rgba(0,0,0,0.3);text-shadow:0 1px 0 rgba(255,255,255,0.18);}
.t1{background:rgba(192,57,43,0.2);color:#e74c3c;border:1px solid rgba(192,57,43,0.4);}
.t2{background:rgba(41,128,185,0.2);color:#3498db;border:1px solid rgba(41,128,185,0.4);}
.t3{background:rgba(142,68,173,0.2);color:#9b59b6;border:1px solid rgba(142,68,173,0.4);}
.t4{background:rgba(39,174,96,0.2);color:#2ecc71;border:1px solid rgba(39,174,96,0.4);}
.t5{background:rgba(230,126,34,0.2);color:#e67e22;border:1px solid rgba(230,126,34,0.4);}
.t6{background:rgba(201,168,76,0.2);color:var(--gold);border:1px solid var(--border);}
.tier-card h3{font-size:0.9rem;font-weight:700;color:var(--text);margin-bottom:0.25rem;}
.tier-card p{font-size:0.78rem;color:var(--text3);}
.atk{color:#3498db;font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;}
.def{color:#2ecc71;font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;}
.guide-layout{display:flex;gap:0;align-items:flex-start;}
.guide-sidebar{width:auto;min-width:110px;max-width:160px;flex-shrink:0;position:sticky;top:72px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:0.5rem;margin:1.5rem 0 1.5rem 1rem;height:fit-content;max-height:calc(100vh - 90px);overflow-y:auto;align-self:flex-start;}
.guide-sidebar-title{font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.7rem;font-weight:600;color:var(--gold3);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:0.6rem;padding-bottom:0.4rem;border-bottom:1px solid var(--border2);}
.sidebar-link{display:flex;align-items:center;gap:0.4rem;padding:0.3rem 0.5rem;border-radius:4px;text-decoration:none;transition:background 0.15s;margin-bottom:1px;}
.sidebar-link:hover{background:var(--bg4);}
.sidebar-link.active{background:rgba(201,168,76,0.1);}
.sidebar-badge{font-family:'IBM Plex Sans',system-ui,sans-serif;font-weight:700;font-size:0.65rem;padding:1px 5px;border-radius:2px;flex-shrink:0;}
.sidebar-name{font-size:0.72rem;color:var(--text2);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px;}
.guide-content{flex:1;min-width:0;}
@media(max-width:900px){.guide-sidebar{display:none;}}
.comp-section{padding:2.5rem 1.5rem 2rem;max-width:1200px;margin:0 auto;scroll-margin-top:80px;}

/* Board video thumbnail — replaces the unusable inline iframe. Tap opens a
   real fullscreen-capable player in a modal. */
.board-video-box{flex:1;border:2px solid var(--gold);border-radius:8px;overflow:hidden;background:var(--bg4);display:flex;align-items:center;justify-content:center;position:relative;}
.video-thumb{position:relative;width:100%;height:100%;background:transparent;border:none;padding:0;cursor:pointer;display:block;overflow:hidden;-webkit-tap-highlight-color:transparent;}
.video-thumb-img{width:100%;height:100%;object-fit:cover;display:block;}
.video-thumb-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,0.7) 100%),radial-gradient(ellipse at center,transparent 30%,rgba(0,0,0,0.45) 100%);}
.video-thumb-play{position:absolute;top:50%;left:50%;width:64px;height:64px;transform:translate(-50%,-50%);filter:drop-shadow(0 4px 14px rgba(0,0,0,0.7));transition:transform 0.28s cubic-bezier(0.22,1,0.36,1);}
.video-thumb:hover .video-thumb-play{transform:translate(-50%,-50%) scale(1.08);}
.video-thumb-play svg{width:100%;height:100%;display:block;}
.video-thumb-label{position:absolute;left:0;right:0;bottom:0.5rem;text-align:center;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.62rem;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:var(--gold2);text-shadow:0 1px 2px rgba(0,0,0,0.8);}
.video-thumb-file{background:linear-gradient(180deg,#1a1a28 0%,#0e0e16 100%);}
.video-thumb-xlogo{position:absolute;top:50%;left:50%;transform:translate(-50%,calc(-50% - 18px));pointer-events:none;}
.video-thumb-xlogo svg{display:block;}

/* Modal-style fullscreen video player. Lazy-mounted on .video-thumb click. */
.video-modal{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;padding:2rem;animation:vm-fade 0.18s ease-out;cursor:pointer;}
.video-modal-stage{position:relative;width:min(90vw,1200px);aspect-ratio:16/9;max-height:85vh;cursor:default;box-shadow:0 30px 80px rgba(0,0,0,0.85),0 0 0 1px rgba(201,168,76,0.35),0 0 40px rgba(201,168,76,0.18);border-radius:6px;overflow:hidden;background:#000;}
.video-modal-stage iframe,.video-modal-stage video{width:100%;height:100%;display:block;border:0;}
/* Tweet variant — portrait-friendly fixed width, scrolls vertically inside.
   Twitter's iframe doesn't have a clean 16:9 aspect since tweets vary in
   height. We give it a usable column and let the embed handle the rest. */
.video-modal-stage-tweet{aspect-ratio:auto;width:min(96vw,540px);height:min(85vh,720px);background:#15131d;overflow:auto;}
.video-modal-stage-tweet iframe{height:100%;}
.video-modal-close{position:absolute;top:-2.6rem;right:0;width:36px;height:36px;background:rgba(20,20,30,0.85);border:1px solid var(--gold);color:var(--gold2);font-size:1.1rem;cursor:pointer;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:inherit;line-height:1;transition:background 0.2s ease,transform 0.2s ease;}
.video-modal-close:hover{background:var(--gold);color:#0a0a0f;transform:scale(1.06);}
@keyframes vm-fade{from{opacity:0;}to{opacity:1;}}
@media(max-width:680px){
  .video-modal{padding:1rem;}
  .video-modal-stage{width:100%;}
  .video-modal-close{top:-2.4rem;right:0.25rem;}
}
.comp-meta{color:var(--text3);font-size:0.85rem;margin-top:0.25rem;}
.comp-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;align-items:start;}
@media(max-width:768px){.comp-grid{grid-template-columns:1fr;}}

/* iPad / tablet: keep narrow side panels paired up, give Board Positioning
   its own full-width row underneath so it has room to breathe. */
@media(min-width:820px) and (max-width:1100px){
  .comp-expand-grid{grid-template-columns:1fr 1fr !important;grid-template-areas:"left right" "middle middle" !important;}
  .comp-expand-grid > :nth-child(1){grid-area:left;}
  .comp-expand-grid > :nth-child(2){grid-area:middle;}
  .comp-expand-grid > :nth-child(3){grid-area:right;}
}

/* Phones / very narrow: full single column. */
@media(max-width:820px){
  .comp-expand-grid{grid-template-columns:1fr !important;}
  .comp-howmatch-grid{grid-template-columns:1fr !important;height:auto !important;}
}

/* Mobile bond strip: lock to 2-up so a lone 5th card matches the row above
   instead of stretching to 220px. */
@media(max-width:600px){
  .char-card-wrap{flex:0 1 calc(50% - 0.375rem) !important;max-width:calc(50% - 0.375rem) !important;min-width:0 !important;}
}
.card{position:relative;background:#14141e;border-radius:4px;padding:1.5rem;isolation:isolate;box-shadow:0 1px 0 rgba(220,230,255,0.06) inset,0 0 0 1px rgba(220,230,255,0.04),0 8px 22px rgba(0,0,0,0.5),0 2px 4px rgba(0,0,0,0.55);}
.card::before{content:'';position:absolute;inset:0;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");mix-blend-mode:overlay;opacity:0.14;z-index:0;border-radius:4px;}
.card::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:2;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cg fill='none' stroke='%23c9a84c' stroke-width='0.5' opacity='0.45'%3E%3Cpath d='M0 6 L0 0 L6 0'/%3E%3Cpath d='M94 0 L100 0 L100 6'/%3E%3Cpath d='M100 94 L100 100 L94 100'/%3E%3Cpath d='M6 100 L0 100 L0 94'/%3E%3C/g%3E%3C/svg%3E");background-size:100% 100%;border-radius:4px;}
.card > *{position:relative;z-index:1;}
.card-title{display:inline-flex;align-items:center;gap:0.7rem;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.66rem;font-weight:600;color:rgba(220,228,245,0.5);letter-spacing:0.24em;text-transform:uppercase;margin:0 0 1.1rem 0;padding:0;border:none;}
.card-title::before{content:'';width:22px;height:1px;background:#c9a84c;flex-shrink:0;}
.char-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:0.6rem;}
.char-card-wrap{perspective:1000px;cursor:pointer;position:relative;transition:transform 0.32s cubic-bezier(0.22,1,0.36,1);}
.char-card-wrap:hover{transform:translateY(-3px);}
.char-card-inner{position:relative;width:100%;height:220px;transform-style:preserve-3d;transition:transform 0.55s cubic-bezier(0.22,1,0.36,1);}
.char-card-inner.flipped{transform:rotateY(180deg);}
.board-card-inner.flipped{transform:rotateY(180deg);}
.char-face{position:absolute;inset:0;-webkit-backface-visibility:hidden;backface-visibility:hidden;border-radius:4px;background:#14141e;border:none;overflow:hidden;transform:translateZ(0);-webkit-transform:translateZ(0);box-shadow:0 1px 0 rgba(220,230,255,0.06) inset,0 0 0 1px rgba(220,230,255,0.05),0 6px 18px rgba(0,0,0,0.5),0 2px 4px rgba(0,0,0,0.55);transition:box-shadow 0.25s ease;}
.char-card-wrap:hover .char-face{box-shadow:0 1px 0 rgba(220,230,255,0.08) inset,0 0 0 1px rgba(201,168,76,0.35),0 10px 26px rgba(0,0,0,0.6),0 2px 4px rgba(0,0,0,0.6),0 0 24px rgba(201,168,76,0.18);}
.char-face-back{transform:rotateY(180deg) translateZ(0);-webkit-transform:rotateY(180deg) translateZ(0);border-radius:4px;}
/* Bond card corner brackets — same brass flourish used on .codex-card */
.char-face::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:5;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cg fill='none' stroke='%23c9a84c' stroke-width='0.5' opacity='0.45'%3E%3Cpath d='M0 6 L0 0 L6 0'/%3E%3Cpath d='M94 0 L100 0 L100 6'/%3E%3Cpath d='M100 94 L100 100 L94 100'/%3E%3Cpath d='M6 100 L0 100 L0 94'/%3E%3C/g%3E%3C/svg%3E");background-size:100% 100%;border-radius:4px;}
.board-face{position:absolute;inset:0;background:#0e0c14;border-radius:4px;overflow:hidden;-webkit-backface-visibility:hidden !important;backface-visibility:hidden !important;}
.board-face:not(.board-face-back){transform:translateZ(0) !important;-webkit-transform:translateZ(0) !important;}
.board-face-back{transform:rotateY(180deg) translateZ(0) !important;-webkit-transform:rotateY(180deg) translateZ(0) !important;}
.board-flip-wrap{position:absolute;inset:0;}
.board-card-inner{width:100%;height:100%;position:relative;transition:transform 0.55s cubic-bezier(0.22,1,0.36,1);transform-style:preserve-3d;cursor:pointer;}
.board-face-img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;}
.board-face-empty{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Fraunces',Georgia,serif;font-style:italic;font-variation-settings:'opsz' 24;color:rgba(220,228,245,0.32);font-size:0.85rem;letter-spacing:0.01em;text-align:center;white-space:nowrap;}
.board-face-zoom{position:absolute;top:8px;right:8px;width:26px;height:26px;background:rgba(10,10,15,0.7);border:1px solid rgba(201,168,76,0.45);color:var(--gold2);cursor:pointer;border-radius:50%;font-size:0.78rem;display:flex;align-items:center;justify-content:center;line-height:1;z-index:10;pointer-events:auto;transition:all 0.18s ease;}
.board-face-zoom:hover{background:rgba(201,168,76,0.18);border-color:var(--gold);transform:scale(1.08);box-shadow:0 0 12px rgba(201,168,76,0.35);}
.board-face-zoom-left{right:auto;left:8px;}
.board-flip-hint{position:absolute;bottom:8px;left:0;right:0;text-align:center;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.6rem;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:rgba(220,228,245,0.32);pointer-events:none;z-index:5;}
.board-flip-wrap:hover ~ .board-flip-hint,.board-flip-wrap:hover .board-flip-hint{color:var(--gold2);}
.char-card-wrap.flipped .card-zoom-overlay{display:block !important;}
.card-zoom{position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);border:none;color:var(--gold);font-size:0.72rem;cursor:pointer;padding:2px 5px;border-radius:3px;z-index:2;line-height:1;}
#guide-lightbox{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.87);z-index:9999;align-items:center;justify-content:center;cursor:zoom-out;}
#guide-lightbox.open{display:flex;}
#guide-lightbox img{max-width:90vw;max-height:90vh;object-fit:contain;border-radius:8px;}
.char-item{display:flex;align-items:center;gap:0.6rem;background:var(--bg4);border-radius:5px;padding:0.5rem 0.6rem;}
.char-portrait{width:42px;height:42px;border-radius:5px;background:var(--bg2);border:1px solid var(--border2);object-fit:cover;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:1rem;color:var(--gold);font-weight:700;}
.char-info{flex:1;}
.char-name{font-weight:700;font-size:0.9rem;color:var(--text);}
.char-bond{font-size:0.78rem;color:var(--gold);}
.char-notes{font-size:0.75rem;color:var(--text3);margin-top:2px;}
.tile-badge{display:inline-flex;align-items:center;justify-content:center;width:38px;height:28px;border-radius:4px;font-size:0.62rem;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;border:1px solid;flex-shrink:0;}
.tile-all{background:rgba(52,152,219,0.15);border-color:rgba(52,152,219,0.5);color:#3498db;}
.tile-front{background:rgba(231,76,60,0.15);border-color:rgba(231,76,60,0.5);color:#e74c3c;}
.tile-skip{background:rgba(39,174,96,0.15);border-color:rgba(39,174,96,0.5);color:#2ecc71;}
.tile-self{background:rgba(201,168,76,0.15);border-color:rgba(201,168,76,0.5);color:var(--gold);}
.tile-tbd{background:rgba(112,104,96,0.2);border-color:rgba(112,104,96,0.4);color:var(--text3);}
/* TOOLTIPS */
.tt-parent{position:relative;}
/* Bond hover popup — codex card-style tooltip with the same brass corner
   brackets as every other surface. */
.tt-popup{display:none;position:absolute;z-index:9999;bottom:calc(100% + 10px);left:50%;transform:translateX(-50%);background:#14141e;border-radius:4px;padding:0.95rem 1.05rem;width:270px;box-shadow:0 1px 0 rgba(220,230,255,0.06) inset,0 0 0 1px rgba(220,230,255,0.05),0 14px 38px rgba(0,0,0,0.7),0 0 18px rgba(201,168,76,0.12);pointer-events:none;white-space:normal;isolation:isolate;}
.tt-popup::after{content:'';position:absolute;inset:0;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cg fill='none' stroke='%23c9a84c' stroke-width='0.5' opacity='0.45'%3E%3Cpath d='M0 8 L0 0 L8 0'/%3E%3Cpath d='M92 0 L100 0 L100 8'/%3E%3Cpath d='M100 92 L100 100 L92 100'/%3E%3Cpath d='M8 100 L0 100 L0 92'/%3E%3C/g%3E%3C/svg%3E");background-size:100% 100%;border-radius:4px;}
.tt-popup > *{position:relative;z-index:1;}
.skill-wrap{position:relative;cursor:pointer;overflow:visible;}
.tt-name{font-family:'Fraunces',Georgia,serif;font-weight:500;font-variation-settings:'opsz' 36;font-size:0.95rem;color:#eef0fa;letter-spacing:-0.005em;margin-bottom:0.6rem;line-height:1.2;}
.tt-stats{display:flex;gap:0.35rem;flex-wrap:wrap;margin-bottom:0.6rem;}
.tt-stat{background:rgba(201,168,76,0.08);padding:3px 9px;border-radius:2px;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.66rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--gold2);border-left:2px solid var(--gold3);}
.tt-desc{font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.78rem;color:rgba(220,228,245,0.75);line-height:1.55;}
.tt-tile-placeholder{margin-top:0.5rem;padding:6px;background:var(--bg3);border:1px dashed var(--border2);border-radius:4px;font-size:0.7rem;color:var(--text3);text-align:center;}
/* UNIT ORDER */
.order-list{display:flex;flex-direction:column;gap:0.4rem;}
.order-row{display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0.75rem;background:var(--bg4);border-radius:5px;}
.order-num{width:22px;height:22px;border-radius:50%;background:#c9a84c;color:#000;font-weight:700;font-size:0.75rem;display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Sans',system-ui,sans-serif;flex-shrink:0;}
/* Unit order rows on /guide — engraved number plate + name on a flush
   row so the list reads as a numbered list, not a list of pill chips. */
.unit-order-row{display:flex;align-items:center;gap:0.6rem;padding:0.4rem 0.55rem;border-bottom:1px solid rgba(220,230,255,0.04);}
.unit-order-row:last-child{border-bottom:none;}
.unit-order-num{display:flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:transparent;border:1px solid var(--gold);color:var(--gold2);font-family:'Fraunces',Georgia,serif;font-weight:600;font-variation-settings:'opsz' 18;font-size:0.66rem;flex-shrink:0;line-height:1;}
.unit-order-name{font-family:'IBM Plex Sans',system-ui,sans-serif;font-weight:500;font-size:0.78rem;letter-spacing:0.04em;color:#eef0fa;}
.unit-order-row-empty .unit-order-num{border-color:rgba(220,230,255,0.12);color:rgba(220,228,245,0.3);}
.unit-order-row-empty .unit-order-name{color:rgba(220,228,245,0.3);font-style:italic;}
.order-char{flex:1;font-weight:700;font-size:0.85rem;}
.order-stat{font-size:0.75rem;color:var(--gold);}
/* ROTATION */
.rot-table{display:flex;flex-direction:column;}
.rot-table{display:flex;flex-direction:column;align-items:flex-start;gap:0.45rem;padding:0.25rem 0;flex:1;overflow:visible;}
.rot-row{display:flex;justify-content:flex-start;padding:0.35rem 0;border-bottom:1px solid var(--border2);width:100%;}
.rot-row:last-child{border-bottom:none;}
/* 5 icons per visual row, all rows sharing the same left edge so short
   rows don't appear centered out from the middle of the card. */
.rot-skills{display:flex;flex-wrap:wrap;justify-content:flex-start;gap:0.45rem 0.35rem;max-width:225px;}
/* Skill rotation icon — small ink card with a brass edge on hover. The
   number badge floats above each portrait as a small caps tracker. */
.skill-icon-box{position:relative;width:38px;flex-shrink:0;background:#0e0c14;border:1px solid rgba(220,230,255,0.05);border-radius:3px;padding:3px;cursor:pointer;text-align:center;transition:border-color 0.18s ease,transform 0.15s ease,box-shadow 0.18s ease;}
.skill-icon-box:hover{border-color:rgba(201,168,76,0.55);transform:translateY(-1px);box-shadow:0 4px 10px rgba(0,0,0,0.45),0 0 12px rgba(201,168,76,0.18);}
.skill-num{font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.54rem;font-weight:600;letter-spacing:0.14em;color:rgba(220,228,245,0.55);margin-bottom:2px;}
.skill-abbr{font-family:'Fraunces',Georgia,serif;font-weight:500;font-variation-settings:'opsz' 24;font-size:0.78rem;color:#eef0fa;margin-bottom:3px;letter-spacing:-0.005em;}
.skill-tile-mini{display:inline-flex;align-items:center;justify-content:center;font-size:0.55rem;padding:1px 5px;border-radius:2px;height:auto;width:auto;}
/* T1 character strip */
.t1-char{background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:0.85rem;position:relative;cursor:default;transition:border-color 0.2s;}
.t1-char:hover{border-color:var(--border);}
.notes-list{list-style:none;display:flex;flex-direction:column;gap:0.45rem;margin:0;padding:0;}
.notes-list li{font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.82rem;color:rgba(220,228,245,0.78);padding-left:1.1rem;position:relative;line-height:1.55;word-break:break-word;}
.notes-list li::before{content:'';position:absolute;left:0;top:0.65em;width:5px;height:1px;background:var(--gold);opacity:0.7;}
.counter-tag{display:inline-block;background:rgba(192,57,43,0.15);border:1px solid rgba(192,57,43,0.3);color:#e74c3c;font-size:0.78rem;padding:3px 10px;border-radius:3px;margin:3px;}
.beats-tag{display:inline-block;background:rgba(39,174,96,0.15);border:1px solid rgba(39,174,96,0.3);color:#2ecc71;font-size:0.78rem;padding:3px 10px;border-radius:3px;margin:3px;}
/* COUPONS */
/* Coupon redeem form panel — codex card treatment, same as .codex-card
   shell. Inline-styled max-width retained via CSS so it doesn't push the
   page chrome wider on bigger viewports. */
.coupon-form{position:relative;background:#14141e;border-radius:4px;padding:2rem;max-width:600px;margin:0 auto 3rem;isolation:isolate;box-shadow:0 1px 0 rgba(220,230,255,0.06) inset,0 0 0 1px rgba(220,230,255,0.04),0 10px 28px rgba(0,0,0,0.55),0 2px 4px rgba(0,0,0,0.6);}
.coupon-form::before{content:'';position:absolute;inset:0;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");mix-blend-mode:overlay;opacity:0.14;z-index:0;border-radius:4px;}
.coupon-form::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:2;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cg fill='none' stroke='%23c9a84c' stroke-width='0.5' opacity='0.5'%3E%3Cpath d='M0 8 L0 0 L8 0'/%3E%3Cpath d='M92 0 L100 0 L100 8'/%3E%3Cpath d='M100 92 L100 100 L92 100'/%3E%3Cpath d='M8 100 L0 100 L0 92'/%3E%3C/g%3E%3C/svg%3E");background-size:100% 100%;border-radius:4px;}
.coupon-form > *{position:relative;z-index:1;}
.coupon-form h3{font-family:'Fraunces',Georgia,serif;font-weight:500;font-variation-settings:'opsz' 96;font-size:1.5rem;color:#eef0fa;margin-bottom:1.5rem;letter-spacing:-0.012em;}
/* Codex form fields — bottom-rule inputs, IBM Plex Sans body, gold focus */
.form-group{margin-bottom:1.1rem;}
.form-group label{display:block;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.66rem;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:rgba(220,228,245,0.55);margin-bottom:0.5rem;}
.form-group input{width:100%;background:rgba(220,230,255,0.025);border:none;border-bottom:1px solid rgba(220,230,255,0.12);color:#eef0fa;padding:9px 12px;border-radius:3px 3px 0 0;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.92rem;outline:none;transition:border-color 0.18s ease,background 0.18s ease,box-shadow 0.18s ease;}
.form-group input:focus{border-bottom-color:var(--gold);background:rgba(220,230,255,0.045);box-shadow:0 1px 0 0 var(--gold);}
.form-group input::placeholder,.form-group textarea::placeholder{color:rgba(232,224,200,0.28);font-style:italic;}
/* Gilded button — polished brass plate look with depth.
   Gradient + inset highlights give it the feel of stamped metal.
   Cormorant Unicase typeface so labels read as carved/engraved. */
.btn{
  position:relative;display:inline-block;
  background:linear-gradient(180deg,#e8c168 0%,#c9a84c 45%,#a07830 100%);
  color:#1a1612;border:1px solid #826019;
  padding:10px 26px;border-radius:3px;
  font-family:'IBM Plex Sans',system-ui,sans-serif;font-weight:700;
  font-size:0.9rem;letter-spacing:0.06em;
  cursor:pointer;width:100%;margin-top:0.5rem;
  text-shadow:0 1px 0 rgba(255,235,200,0.35);
  box-shadow:
    inset 0 1px 0 rgba(255,235,200,0.55),
    inset 0 -1px 0 rgba(0,0,0,0.35),
    0 1px 2px rgba(0,0,0,0.5),
    0 6px 14px rgba(0,0,0,0.4);
  transition:transform 0.12s ease,box-shadow 0.18s ease,filter 0.18s ease;
}
.btn:hover{
  filter:brightness(1.08);
  box-shadow:
    inset 0 1px 0 rgba(255,240,210,0.7),
    inset 0 -1px 0 rgba(0,0,0,0.35),
    0 1px 2px rgba(0,0,0,0.55),
    0 8px 22px rgba(0,0,0,0.45),
    0 0 20px rgba(232,193,104,0.35);
}
.btn:active{
  transform:translateY(1px);
  box-shadow:
    inset 0 2px 4px rgba(0,0,0,0.4),
    inset 0 -1px 0 rgba(255,235,200,0.18),
    0 1px 0 rgba(0,0,0,0.4);
}
.btn:disabled{opacity:0.5;cursor:not-allowed;}
.btn-outline{background:transparent;border:1px solid var(--gold);color:var(--gold);}
.redeem-results{margin-top:1.5rem;display:none;}
.redeem-results-title{font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.9rem;color:var(--gold);margin-bottom:0.75rem;}
.result-row{display:flex;align-items:center;justify-content:space-between;padding:0.6rem 0.75rem;background:var(--bg4);border-radius:5px;margin-bottom:0.4rem;}
.result-code{font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.85rem;color:var(--text);}
.result-badge{font-size:0.72rem;font-weight:700;padding:3px 10px;border-radius:3px;letter-spacing:0.05em;}
.rb-success{background:rgba(39,174,96,0.2);color:#2ecc71;border:1px solid rgba(39,174,96,0.4);}
.rb-used{background:rgba(52,152,219,0.2);color:#3498db;border:1px solid rgba(52,152,219,0.4);}
.rb-failed{background:rgba(192,57,43,0.2);color:#e74c3c;border:1px solid rgba(192,57,43,0.4);}
.rb-pending{background:rgba(201,168,76,0.1);color:var(--gold);border:1px solid var(--border);}
.code-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;max-width:1200px;margin:0 auto;padding:0 2rem 4rem;}
/* Single-code display card — used by the Special Code reveal. Matches the
   coupon-form panel but quieter (no corner brackets). */
.code-card{position:relative;background:rgba(220,230,255,0.03);border-radius:3px;padding:1.1rem 1.25rem;border-left:3px solid var(--gold);box-shadow:0 1px 0 rgba(220,230,255,0.05) inset,0 4px 14px rgba(0,0,0,0.45);}
.code-value{font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:1.1rem;color:var(--gold);font-weight:700;margin-bottom:0.5rem;display:flex;align-items:center;justify-content:space-between;}
.copy-btn{background:rgba(201,168,76,0.15);border:1px solid var(--border);color:var(--gold);padding:3px 10px;border-radius:3px;font-size:0.75rem;cursor:pointer;font-family:'IBM Plex Sans',system-ui,sans-serif;}
.code-rewards{font-size:0.83rem;color:var(--text2);margin-bottom:0.5rem;}
.code-expiry{font-size:0.75rem;color:var(--text3);}
/* EMOTES */
.emote-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;max-width:1200px;margin:0 auto;padding:0 2rem 4rem;}
.emote-card{background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:1rem;text-align:center;}
.emote-card img{width:100%;max-width:120px;height:120px;object-fit:contain;border-radius:4px;margin-bottom:0.75rem;}
.emote-name{font-size:0.83rem;font-weight:700;color:var(--text);margin-bottom:0.5rem;}
.emote-dl{display:inline-block;background:rgba(201,168,76,0.15);border:1px solid var(--border);color:var(--gold);padding:5px 14px;border-radius:3px;font-size:0.78rem;text-decoration:none;}
/* ADMIN */
/* ═══════════════════════════════════════════════════════════════════════
   Admin Codex shell — applies the public-site Codex direction (Fraunces
   display, IBM Plex Sans body, cool-ink panels with gold corner brackets
   and paper-grain noise) to every surface inside /admin. No behavioral
   changes; pure visual.
   ═══════════════════════════════════════════════════════════════════════ */
.admin-wrap{max-width:1200px;margin:0 auto;padding:1.75rem 1.5rem 4rem;}

/* Login screen */
.admin-login{max-width:420px;margin:6rem auto;position:relative;background:#14141e;border-radius:4px;padding:2.25rem 2rem;isolation:isolate;box-shadow:0 1px 0 rgba(220,230,255,0.06) inset,0 0 0 1px rgba(220,230,255,0.04),0 12px 30px rgba(0,0,0,0.55),0 2px 4px rgba(0,0,0,0.6);}
.admin-login::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:2;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cg fill='none' stroke='%23c9a84c' stroke-width='0.5' opacity='0.5'%3E%3Cpath d='M0 8 L0 0 L8 0'/%3E%3Cpath d='M92 0 L100 0 L100 8'/%3E%3Cpath d='M100 92 L100 100 L92 100'/%3E%3Cpath d='M8 100 L0 100 L0 92'/%3E%3C/g%3E%3C/svg%3E");background-size:100% 100%;}
.admin-login h2{font-family:'Fraunces',Georgia,serif;font-weight:600;font-variation-settings:'opsz' 96;font-size:1.75rem;color:#eef0fa;margin-bottom:1.5rem;letter-spacing:-0.015em;}

/* Codex header bar (top of admin) */
.admin-header{display:flex;align-items:flex-end;justify-content:space-between;gap:2rem;padding-bottom:1.5rem;margin-bottom:1.75rem;position:relative;flex-wrap:wrap;}
.admin-header::after{content:'';position:absolute;left:0;right:0;bottom:0;height:1px;background:linear-gradient(to right,var(--gold) 0,var(--gold) 56px,rgba(220,230,255,0.07) 56px,rgba(220,230,255,0.07) 100%);}
.admin-header-text{display:flex;flex-direction:column;gap:0.25rem;min-width:0;}
.admin-header-eyebrow{font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.62rem;font-weight:600;letter-spacing:0.32em;text-transform:uppercase;color:rgba(220,228,245,0.42);}
.admin-header-title{font-family:'Fraunces',Georgia,serif;font-weight:600;font-variation-settings:'opsz' 144;font-size:2rem;line-height:1;letter-spacing:-0.018em;color:#eef0fa;}
.admin-header-title em{font-style:italic;color:var(--gold);font-variation-settings:'opsz' 144;}
.admin-header-actions{display:flex;align-items:center;gap:0.75rem;}
.admin-logout{font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.66rem;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:rgba(220,228,245,0.55);text-decoration:none;padding:9px 18px;border:1px solid rgba(220,230,255,0.12);border-radius:3px;transition:all 0.2s ease;}
.admin-logout:hover{color:var(--gold2);border-color:var(--gold);background:rgba(201,168,76,0.06);}

/* Engraved tab strip — gold underline on active, no fill backgrounds */
.admin-tabs{display:flex;gap:0;margin-bottom:1.75rem;flex-wrap:wrap;padding:0;border-bottom:1px solid rgba(220,230,255,0.06);position:relative;}
.tab-btn{background:transparent;border:none;color:rgba(220,228,245,0.48);padding:0.85rem 1.15rem;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.7rem;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color 0.18s ease,border-color 0.18s ease;}
.tab-btn:hover{color:rgba(232,199,106,0.85);}
.tab-btn.active{color:var(--gold2);border-bottom-color:var(--gold);}

.admin-section{display:none;}
.admin-section.active{display:block;animation:admin-section-in 0.28s cubic-bezier(0.22,1,0.36,1);}
@keyframes admin-section-in{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);}}

/* Codex panel — the canonical container for any admin form / list block */
.admin-panel,.admin-form{position:relative;background:#14141e;border-radius:4px;padding:1.5rem;margin-bottom:1.25rem;isolation:isolate;box-shadow:0 1px 0 rgba(220,230,255,0.06) inset,0 0 0 1px rgba(220,230,255,0.04),0 8px 22px rgba(0,0,0,0.5),0 2px 4px rgba(0,0,0,0.55);}
.admin-panel::before,.admin-form::before{content:'';position:absolute;inset:0;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");mix-blend-mode:overlay;opacity:0.10;z-index:0;border-radius:4px;}
.admin-panel::after,.admin-form::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:2;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cg fill='none' stroke='%23c9a84c' stroke-width='0.4' opacity='0.42'%3E%3Cpath d='M0 6 L0 0 L6 0'/%3E%3Cpath d='M94 0 L100 0 L100 6'/%3E%3Cpath d='M100 94 L100 100 L94 100'/%3E%3Cpath d='M6 100 L0 100 L0 94'/%3E%3C/g%3E%3C/svg%3E");background-size:100% 100%;border-radius:4px;}
.admin-panel > *,.admin-form > *{position:relative;z-index:1;}
.admin-panel-title,.admin-form h3{font-family:'Fraunces',Georgia,serif;font-weight:500;font-variation-settings:'opsz' 48;font-size:1.2rem;color:#eef0fa;letter-spacing:-0.005em;margin-bottom:0.3rem;}
.admin-panel-sub{font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.66rem;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:rgba(220,228,245,0.4);margin-bottom:1.25rem;}

/* Sub-panel (nested block inside an .admin-panel) */
.admin-subpanel{position:relative;background:rgba(220,230,255,0.02);border-radius:3px;padding:1.1rem 1.2rem;margin-bottom:1rem;border-top:1px solid rgba(201,168,76,0.18);}
.admin-subpanel-title{font-family:'Fraunces',Georgia,serif;font-weight:500;font-variation-settings:'opsz' 36;font-size:0.95rem;color:var(--gold2);margin-bottom:0.85rem;letter-spacing:-0.002em;}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
@media(max-width:900px){.comp-edit-trio{grid-template-columns:1fr !important;}}
/* Uniform preview pane across all three columns of .comp-edit-trio. Each
   column reserves the same height regardless of whether content is loaded,
   so the panel doesn't look ragged when only the front board has an image
   uploaded. */
.comp-edit-trio .cet-preview{
  width:100%;min-height:140px;max-height:200px;overflow:auto;
  margin-top:0.5rem;border:1px dashed rgba(220,230,255,0.08);
  border-radius:4px;padding:0.4rem;box-sizing:border-box;
  display:flex;align-items:flex-start;flex-wrap:wrap;gap:0.4rem;
}
.comp-edit-trio .cet-preview:empty::before{
  content:'No image yet.';font-size:0.74rem;color:rgba(220,228,245,0.32);
  font-family:'IBM Plex Sans',system-ui,sans-serif;letter-spacing:0.02em;font-style:italic;
}
.comp-edit-trio .cet-preview img{max-width:100%;max-height:160px;display:block;border-radius:3px;}
@media(max-width:600px){.form-row{grid-template-columns:1fr;}}
.form-group select,.form-group textarea{width:100%;background:rgba(220,230,255,0.025);border:none;border-bottom:1px solid rgba(220,230,255,0.12);color:#eef0fa;padding:9px 12px;border-radius:3px 3px 0 0;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.92rem;outline:none;transition:border-color 0.18s ease,background 0.18s ease,box-shadow 0.18s ease;color-scheme:dark;}
.form-group select:focus,.form-group textarea:focus{border-bottom-color:var(--gold);background:rgba(220,230,255,0.045);box-shadow:0 1px 0 0 var(--gold);}
.form-group textarea{resize:vertical;min-height:90px;line-height:1.55;}
/* Native <option> elements don't inherit container CSS in Firefox/Safari and
   are partially-styleable in Chrome/Edge — the OS draws the open panel. The
   most reliable cross-browser cure is color-scheme:dark on the <select>
   (tells the engine to use its dark UI variant for the dropdown). The
   option-element rules layer on top for Chrome/Edge where they take. */
select,.form-group select{color-scheme:dark;}
.form-group select option,select option{background-color:#14141e;color:#eef0fa;font-family:'IBM Plex Sans',system-ui,sans-serif;}
.form-group select option:checked,.form-group select option:hover,select option:checked,select option:hover{background-color:#1f1d28;color:#eef0fa;}
select{background:rgba(220,230,255,0.025);color:#eef0fa;border:1px solid rgba(220,230,255,0.12);border-radius:3px;padding:8px 12px;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.9rem;outline:none;}
.admin-list{display:flex;flex-direction:column;gap:0.5rem;margin-top:1.5rem;}
/* Codex admin list rows — flush rows separated by hairlines instead of
   floating panels. Hover gives a faint gold wash. */
.admin-item{background:transparent;border:none;border-bottom:1px solid rgba(220,230,255,0.05);border-radius:0;padding:0.85rem 1rem;display:flex;align-items:center;justify-content:space-between;transition:background 0.15s ease;}
.admin-item:hover{background:rgba(201,168,76,0.04);}
.admin-item:last-child{border-bottom:none;}
.admin-item-info{font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.86rem;color:rgba(220,228,245,0.85);}
.admin-item-info strong{color:var(--gold2);font-weight:600;letter-spacing:0.01em;}
/* While a /comp/reorder request is in flight, dim the up/down arrows and
   block further clicks. Stops racing reorders from corrupting the list. */
.comp-list-busy [data-action="comp-move-up"],
.comp-list-busy [data-action="comp-move-down"]{opacity:0.35;pointer-events:none;cursor:wait;}
.comp-list-busy{cursor:wait;}
/* Crimson companion to the gilded .btn — same stamped-metal look, in the
   2nd-accent crimson. Used for destructive actions. */
.btn-danger{position:relative;display:inline-block;background:linear-gradient(180deg,#b1543c 0%,#8e3a2d 45%,#5c1f1f 100%);color:#f5dba0;border:1px solid #4a1818;padding:7px 16px;border-radius:3px;font-family:'IBM Plex Sans',system-ui,sans-serif;font-weight:600;font-size:0.74rem;letter-spacing:0.14em;text-transform:uppercase;cursor:pointer;text-shadow:0 1px 0 rgba(0,0,0,0.55);box-shadow:inset 0 1px 0 rgba(255,160,140,0.32),inset 0 -1px 0 rgba(0,0,0,0.45),0 1px 2px rgba(0,0,0,0.55),0 4px 10px rgba(0,0,0,0.35);transition:filter 0.18s ease,box-shadow 0.18s ease,transform 0.12s ease;}
.btn-danger:hover{filter:brightness(1.1);box-shadow:inset 0 1px 0 rgba(255,160,140,0.45),inset 0 -1px 0 rgba(0,0,0,0.45),0 1px 2px rgba(0,0,0,0.6),0 6px 16px rgba(0,0,0,0.4),0 0 18px rgba(177,84,60,0.4);}
.btn-danger:active{transform:translateY(1px);box-shadow:inset 0 2px 4px rgba(0,0,0,0.45),inset 0 -1px 0 rgba(255,160,140,0.18),0 1px 0 rgba(0,0,0,0.4);}
/* Ghost / secondary action button — flat, gold-edged, for inline actions
   (e.g. Move up, secondary toolbar). */
.btn-ghost{background:transparent;border:1px solid rgba(201,168,76,0.28);color:var(--gold2);padding:5px 12px;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.7rem;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;border-radius:3px;cursor:pointer;transition:all 0.18s ease;}
.btn-ghost:hover{border-color:var(--gold);background:rgba(201,168,76,0.08);color:var(--gold2);transform:translateY(-1px);}
/* Codex alerts — left-rule pill with crimson/green accent. Matches the
   public-side .codex-tag-warn / -pos pattern so success/error reads the
   same across the site. */
.alert{padding:9px 14px 9px 16px;border-radius:2px;font-size:0.82rem;margin-bottom:1rem;font-family:'IBM Plex Sans',system-ui,sans-serif;letter-spacing:0.01em;background:rgba(220,230,255,0.04);color:rgba(220,228,245,0.78);border-left:3px solid rgba(220,228,245,0.18);}
.alert-success{background:rgba(39,174,96,0.08);border-left-color:#27ae60;color:#7cd9a1;}
.alert-error{background:var(--crimson-tint);border-left-color:var(--crimson);color:#e0907a;}
/* IMAGE GRID */
/* Admin image grid — gold-bracketed tiles with mono key labels */
.img-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:0.85rem;margin-top:1rem;}
.img-slot{position:relative;background:#14141e;border-radius:3px;padding:0.45rem 0.45rem 0.55rem;text-align:center;font-size:0.7rem;color:rgba(220,228,245,0.55);transition:transform 0.18s ease;}
.img-slot::after{content:'';position:absolute;inset:0;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cg fill='none' stroke='%23c9a84c' stroke-width='0.7' opacity='0.45'%3E%3Cpath d='M0 8 L0 0 L8 0'/%3E%3Cpath d='M92 0 L100 0 L100 8'/%3E%3Cpath d='M100 92 L100 100 L92 100'/%3E%3Cpath d='M8 100 L0 100 L0 92'/%3E%3C/g%3E%3C/svg%3E");background-size:100% 100%;border-radius:3px;}
.img-slot:hover{transform:translateY(-2px);}
.img-slot img{width:100%;aspect-ratio:1/1;object-fit:contain;background:#0e0c14;border-radius:2px;margin-bottom:0.4rem;cursor:pointer;}
.img-slot-key{font-family:'JetBrains Mono','Consolas',monospace;font-size:0.6rem;letter-spacing:0.02em;color:var(--gold);word-break:break-all;line-height:1.35;}
/* HOME COMP CARDS */
.comp-card:hover{border-color:var(--comp-card-hover-color,var(--gold)) !important;}
/* EASTER EGG */
@keyframes egg-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
.egg-shake{animation:egg-shake 0.35s ease;}
/* FOOTER */
/* Codex footer — gradient hairline + small brass rhombus before the
   disclaimer block. Type weights match the rest of the eyebrow / body
   pairing across the site. */
footer{position:relative;padding:3.5rem 1.5rem 2.5rem;text-align:center;margin-top:5rem;}
footer::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:min(560px,80%);height:1px;background:linear-gradient(to right,transparent,rgba(201,168,76,0.4) 50%,transparent);}
footer::after{content:'';position:absolute;top:-4px;left:50%;transform:translateX(-50%) rotate(45deg);width:8px;height:8px;background:linear-gradient(135deg,#e8c76a,#a07830);box-shadow:0 0 8px rgba(201,168,76,0.4);}
footer span{color:var(--gold);}
.footer-brand{color:var(--gold2);font-family:'Fraunces',Georgia,serif;font-variation-settings:'opsz' 48;font-size:1rem;letter-spacing:-0.005em;margin-bottom:0.85rem;}
.footer-disclaimer{max-width:680px;margin:0 auto 0.85rem;color:rgba(220,228,245,0.45);font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.72rem;line-height:1.7;}
.footer-copyright{color:rgba(220,228,245,0.35);font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.62rem;font-weight:500;letter-spacing:0.24em;text-transform:uppercase;}
/* IMAGE ERROR HIDE */
.img-err-hide.errored{display:none;}
.img-err-dim.errored{opacity:0.2;}
/* Codex scrollbar — thin gradient brass thumb on a faint warm-cool track */
::-webkit-scrollbar{width:9px;height:9px;}
::-webkit-scrollbar-track{background:rgba(10,10,15,0.6);border-left:1px solid rgba(220,230,255,0.04);}
::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#a07830 0%,#7a5a24 60%,#5c4520 100%);border-radius:2px;border:2px solid rgba(10,10,15,0.6);}
::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#c9a84c 0%,#a07830 60%,#7a5a24 100%);}
::-webkit-scrollbar-corner{background:transparent;}
*{scrollbar-width:thin;scrollbar-color:#7a5a24 rgba(10,10,15,0.6);}
.nf-path{font-family:'JetBrains Mono','Courier New',monospace;font-size:0.85em;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.18);padding:1px 7px;border-radius:3px;color:var(--gold);}
.nf-card{max-width:780px;margin:1rem auto 4rem;padding:2rem 2rem 2.25rem;}
.nf-lead{font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.66rem;font-weight:600;color:rgba(220,228,245,0.5);letter-spacing:0.24em;text-transform:uppercase;margin:0 0 1.25rem;display:inline-flex;align-items:center;gap:0.7rem;}
.nf-lead::before{content:'';width:22px;height:1px;background:var(--gold);flex-shrink:0;}
.nf-links{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0.75rem;}
.nf-link{display:flex;flex-direction:column;gap:0.25rem;padding:0.95rem 1.1rem;background:rgba(220,230,255,0.025);border:1px solid rgba(220,230,255,0.06);border-left:3px solid rgba(201,168,76,0.45);border-radius:3px;text-decoration:none;transition:transform 0.18s cubic-bezier(0.22,1,0.36,1),border-color 0.2s ease,background 0.2s ease;}
.nf-link:hover{transform:translateX(2px);background:rgba(220,230,255,0.05);border-left-color:var(--gold);}
.nf-link-label{font-family:'Fraunces',Georgia,serif;font-weight:600;font-variation-settings:'opsz' 36;font-size:1.05rem;color:#f0e6d2;letter-spacing:-0.01em;}
.nf-link-sub{font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:0.78rem;color:rgba(220,228,245,0.55);}
`;
  return _cssBody;
}
