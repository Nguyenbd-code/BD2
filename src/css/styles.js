export function getStyles() {
  return `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Nunito:wght@300;400;600;700&display=swap');
:root {
  --bg:#0a0a0f; --bg2:#0f0f18; --bg3:#13131e; --bg4:#1a1a28;
  --gold:#c9a84c; --gold2:#e8c76a; --gold3:#a07830;
  --text:#e8e3d8; --text2:#b0a898; --text3:#706860;
  --border:rgba(201,168,76,0.2); --border2:rgba(201,168,76,0.1);
}
*{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{background:var(--bg);color:var(--text);font-family:'Nunito',sans-serif;min-height:100vh;overflow-x:hidden;}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 20% 0%,rgba(201,168,76,0.04),transparent 60%),radial-gradient(ellipse at 80% 100%,rgba(139,0,0,0.06),transparent 60%);pointer-events:none;z-index:0;}
nav{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(10,10,15,0.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);height:74px;display:flex;align-items:center;padding:0 1.5rem;gap:0.85rem;}
.nav-logo{font-family:'Cinzel',serif;font-size:1.1rem;font-weight:700;color:var(--gold);letter-spacing:0.1em;text-decoration:none;white-space:nowrap;}
.nav-spacer{flex:1;}
.nav-admin{display:flex;align-items:center;gap:4px;}
.nav-admin>a{background:var(--gold3);color:var(--bg);padding:6px 14px;border-radius:4px;text-decoration:none;font-size:0.8rem;font-weight:700;letter-spacing:0.05em;}
.nav-toggle{display:inline-flex;background:transparent;border:1px solid var(--border);border-radius:5px;width:38px;height:34px;cursor:pointer;padding:0;flex-direction:column;align-items:center;justify-content:center;gap:4px;flex-shrink:0;}
.nav-toggle:hover{border-color:var(--gold);background:rgba(201,168,76,0.06);}
.nav-toggle span{display:block;width:18px;height:2px;background:var(--gold);border-radius:1px;transition:transform 0.2s,opacity 0.2s;}
.nav-toggle.open span:nth-child(1){transform:translateY(6px) rotate(45deg);}
.nav-toggle.open span:nth-child(2){opacity:0;}
.nav-toggle.open span:nth-child(3){transform:translateY(-6px) rotate(-45deg);}
.nav-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99;}
.nav-backdrop.open{display:block;}
.nav-side{position:fixed;top:74px;bottom:0;left:0;width:280px;max-width:85vw;background:rgba(10,10,15,0.98);border-right:1px solid var(--border);display:flex;flex-direction:column;align-items:stretch;padding:1rem 0;overflow-y:auto;z-index:110;transform:translateX(-100%);transition:transform 0.22s ease;}
.nav-side.open{transform:translateX(0);}
.nav-side>a{display:block;color:var(--text2);text-decoration:none;font-size:0.92rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;padding:0.85rem 1.5rem;border-left:3px solid transparent;transition:color 0.15s,background 0.15s,border-color 0.15s;white-space:nowrap;}
.nav-side>a:hover{color:var(--gold);background:rgba(201,168,76,0.06);}
.nav-side>a.nav-active{color:var(--gold);border-left-color:var(--gold);background:rgba(201,168,76,0.08);}
.nav-side-header{font-family:'Cinzel',serif;font-size:0.72rem;color:var(--gold);letter-spacing:0.12em;text-transform:uppercase;padding:0.4rem 1.5rem 0.85rem;border-bottom:1px solid var(--border2);margin-bottom:0.4rem;flex-shrink:0;}

/* Mamonir nav icon — the source image has transparent padding around the
   character, so we render the img larger than the wrap and clip the wrap
   with overflow:hidden. The visible character ends up nearly filling the
   navbar vertically. The bubble lives outside the clip so it can escape. */
.mam-wrap{position:relative;display:inline-block;width:64px;height:74px;cursor:pointer;margin-left:6px;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;vertical-align:middle;}
.mam-clip{position:absolute;inset:0;overflow:hidden;}
.mam-wrap img{height:160px;width:auto;display:block;position:absolute;bottom:-44px;left:50%;transform:translateX(-50%);image-rendering:auto;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.7));-webkit-user-drag:none;pointer-events:none;}
.mam-wrap img.mam-press{transform:translateX(-50%) scale(0.85);transition:transform 0.08s ease;}
.mam-bubble{position:absolute;top:calc(100% + 10px);left:50%;transform:translateX(-50%) translateY(-4px);background:#13131a;border:1px solid rgba(201,168,76,0.45);color:var(--gold2);font-family:'Cinzel',serif;font-size:0.78rem;letter-spacing:0.05em;padding:6px 12px;border-radius:8px;white-space:nowrap;opacity:0;pointer-events:none;box-shadow:0 6px 18px rgba(0,0,0,0.7);z-index:102;}
.mam-bubble::after{content:'';position:absolute;bottom:100%;left:50%;transform:translateX(-50%);border:5px solid transparent;border-bottom-color:rgba(201,168,76,0.45);}
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
.hero::after{content:'';position:absolute;bottom:0;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);}
.hero-tag{display:inline-block;background:rgba(201,168,76,0.1);border:1px solid var(--border);color:var(--gold);font-size:0.75rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;padding:6px 16px;border-radius:2px;margin-bottom:1.5rem;}
.hero h1{font-family:'Cinzel',serif;font-size:clamp(2rem,5vw,3.5rem);font-weight:700;line-height:1.1;margin-bottom:1rem;}
.hero h1 span{color:var(--gold);}
.hero p{color:var(--text2);font-size:1rem;max-width:600px;margin:0 auto 2rem;line-height:1.7;}
.hero-disclaimer{display:inline-block;background:rgba(192,57,43,0.1);border:1px solid rgba(192,57,43,0.3);color:#e74c3c;font-size:0.8rem;padding:8px 16px;border-radius:4px;}
.section{padding:4rem 2rem;max-width:1200px;margin:0 auto;}
.section-title{font-family:'Cinzel',serif;font-size:1.4rem;font-weight:600;color:var(--gold);margin-bottom:0.5rem;letter-spacing:0.05em;}
.section-sub{color:var(--text3);font-size:0.85rem;margin-bottom:2rem;}
.tier-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem;}
.tier-card{background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:1.25rem;cursor:pointer;transition:all 0.2s;text-decoration:none;display:block;}
.tier-card:hover{border-color:var(--gold);background:var(--bg4);transform:translateY(-2px);}
.tier-badge{display:inline-block;font-family:'Cinzel',serif;font-weight:700;font-size:0.9rem;padding:4px 12px;border-radius:3px;}
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
.guide-sidebar-title{font-family:'Cinzel',serif;font-size:0.7rem;font-weight:600;color:var(--gold3);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:0.6rem;padding-bottom:0.4rem;border-bottom:1px solid var(--border2);}
.sidebar-link{display:flex;align-items:center;gap:0.4rem;padding:0.3rem 0.5rem;border-radius:4px;text-decoration:none;transition:background 0.15s;margin-bottom:1px;}
.sidebar-link:hover{background:var(--bg4);}
.sidebar-link.active{background:rgba(201,168,76,0.1);}
.sidebar-badge{font-family:'Cinzel',serif;font-weight:700;font-size:0.65rem;padding:1px 5px;border-radius:2px;flex-shrink:0;}
.sidebar-name{font-size:0.72rem;color:var(--text2);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px;}
.guide-content{flex:1;min-width:0;}
@media(max-width:900px){.guide-sidebar{display:none;}}
.comp-section{padding:2rem 1.5rem;max-width:1200px;margin:0 auto;scroll-margin-top:80px;}
.comp-header{display:flex;align-items:center;gap:1rem;margin-bottom:2rem;padding-bottom:1rem;border-bottom:1px solid var(--border2);}
.comp-header h2{font-family:'Cinzel',serif;font-size:1.6rem;font-weight:700;}
.comp-meta{color:var(--text3);font-size:0.85rem;margin-top:0.25rem;}
.comp-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;align-items:start;}
@media(max-width:768px){.comp-grid{grid-template-columns:1fr;}}
.card{background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:1.5rem;}
.card-title{font-family:'Cinzel',serif;font-size:0.85rem;font-weight:600;color:var(--gold);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:1rem;padding-bottom:0.5rem;border-bottom:1px solid var(--border2);}
.char-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:0.6rem;}
.char-card-wrap{perspective:1000px;cursor:pointer;position:relative;}
.char-card-inner{position:relative;width:100%;height:220px;transform-style:preserve-3d;transition:transform 0.5s ease;}
.char-card-inner.flipped{transform:rotateY(180deg);}
.board-card-inner.flipped{transform:rotateY(180deg);}
.char-face{position:absolute;inset:0;backface-visibility:hidden;border-radius:8px;background:var(--bg4);border:1px solid var(--border2);overflow:hidden;}
.char-face-back{transform:rotateY(180deg);border:2px solid var(--gold);border-radius:8px;}
.char-card-wrap.flipped .card-zoom-overlay{display:block !important;}
.card-zoom{position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);border:none;color:var(--gold);font-size:0.72rem;cursor:pointer;padding:2px 5px;border-radius:3px;z-index:2;line-height:1;}
#guide-lightbox{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.87);z-index:9999;align-items:center;justify-content:center;cursor:zoom-out;}
#guide-lightbox.open{display:flex;}
#guide-lightbox img{max-width:90vw;max-height:90vh;object-fit:contain;border-radius:8px;}
.char-item{display:flex;align-items:center;gap:0.6rem;background:var(--bg4);border-radius:5px;padding:0.5rem 0.6rem;}
.char-portrait{width:42px;height:42px;border-radius:5px;background:var(--bg2);border:1px solid var(--border2);object-fit:cover;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:1rem;color:var(--gold);font-weight:700;}
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
.tt-popup{display:none;position:absolute;z-index:9999;bottom:calc(100% + 10px);left:50%;transform:translateX(-50%);background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:1rem;width:260px;box-shadow:0 8px 32px rgba(0,0,0,0.8);pointer-events:none;white-space:normal;}
.skill-wrap{position:relative;cursor:pointer;overflow:visible;}
.tt-name{font-family:'Cinzel',serif;font-size:0.85rem;font-weight:600;color:var(--gold);margin-bottom:0.5rem;}
.tt-stats{display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.5rem;}
.tt-stat{background:var(--bg3);border:1px solid var(--border2);padding:2px 8px;border-radius:3px;font-size:0.72rem;color:var(--text2);}
.tt-desc{font-size:0.78rem;color:var(--text2);line-height:1.5;}
.tt-tile-placeholder{margin-top:0.5rem;padding:6px;background:var(--bg3);border:1px dashed var(--border2);border-radius:4px;font-size:0.7rem;color:var(--text3);text-align:center;}
/* UNIT ORDER */
.order-list{display:flex;flex-direction:column;gap:0.4rem;}
.order-row{display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0.75rem;background:var(--bg4);border-radius:5px;}
.order-num{width:22px;height:22px;border-radius:50%;background:#c9a84c;color:#000;font-weight:700;font-size:0.75rem;display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;flex-shrink:0;}
.order-char{flex:1;font-weight:700;font-size:0.85rem;}
.order-stat{font-size:0.75rem;color:var(--gold);}
/* ROTATION */
.rot-table{display:flex;flex-direction:column;}
.rot-row{display:grid;grid-template-columns:70px 1fr;align-items:start;gap:0.4rem;padding:0.3rem 0;border-bottom:1px solid var(--border2);min-width:340px;}
.rot-row:last-child{border-bottom:none;}
.rot-char{font-weight:700;font-size:0.78rem;color:var(--text2);padding-top:0.25rem;text-align:center;}
.rot-skills{display:flex;flex-wrap:nowrap;gap:0.3rem;overflow:visible;}
.skill-icon-box{width:38px;flex-shrink:0;background:var(--bg4);border:1px solid var(--border2);border-radius:6px;padding:3px;cursor:pointer;transition:border-color 0.2s;text-align:center;}
.skill-icon-box:hover{border-color:var(--gold);}
.skill-num{font-size:0.55rem;color:var(--text3);margin-bottom:2px;}
.skill-abbr{font-family:'Cinzel',serif;font-size:0.72rem;font-weight:700;color:var(--text);margin-bottom:3px;}
.skill-tile-mini{display:inline-flex;align-items:center;justify-content:center;font-size:0.55rem;padding:1px 5px;border-radius:2px;height:auto;width:auto;}
/* T1 character strip */
.t1-char{background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:0.85rem;position:relative;cursor:default;transition:border-color 0.2s;}
.t1-char:hover{border-color:var(--border);}
.notes-list{list-style:none;display:flex;flex-direction:column;gap:0.35rem;margin:0;padding:0;}
.notes-list li{font-size:0.82rem;color:var(--text2);padding-left:1rem;position:relative;line-height:1.5;word-break:break-word;}
.notes-list li::before{content:'—';position:absolute;left:0;color:var(--gold3);}
.counter-tag{display:inline-block;background:rgba(192,57,43,0.15);border:1px solid rgba(192,57,43,0.3);color:#e74c3c;font-size:0.78rem;padding:3px 10px;border-radius:3px;margin:3px;}
.beats-tag{display:inline-block;background:rgba(39,174,96,0.15);border:1px solid rgba(39,174,96,0.3);color:#2ecc71;font-size:0.78rem;padding:3px 10px;border-radius:3px;margin:3px;}
/* COUPONS */
.coupon-form{background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:2rem;max-width:560px;margin:0 auto 3rem;}
.coupon-form h3{font-family:'Cinzel',serif;color:var(--gold);margin-bottom:1.5rem;}
.form-group{margin-bottom:1rem;}
.form-group label{display:block;font-size:0.82rem;font-weight:600;color:var(--text2);margin-bottom:0.4rem;letter-spacing:0.05em;text-transform:uppercase;}
.form-group input{width:100%;background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:10px 14px;border-radius:5px;font-family:'Nunito',sans-serif;font-size:0.9rem;outline:none;transition:border-color 0.2s;}
.form-group input:focus{border-color:var(--gold);}
.btn{background:var(--gold);color:var(--bg);border:none;padding:10px 24px;border-radius:5px;font-family:'Nunito',sans-serif;font-weight:700;font-size:0.9rem;cursor:pointer;transition:background 0.2s;width:100%;margin-top:0.5rem;}
.btn:hover{background:var(--gold2);}
.btn:disabled{opacity:0.5;cursor:not-allowed;}
.btn-outline{background:transparent;border:1px solid var(--gold);color:var(--gold);}
.redeem-results{margin-top:1.5rem;display:none;}
.redeem-results-title{font-family:'Cinzel',serif;font-size:0.9rem;color:var(--gold);margin-bottom:0.75rem;}
.result-row{display:flex;align-items:center;justify-content:space-between;padding:0.6rem 0.75rem;background:var(--bg4);border-radius:5px;margin-bottom:0.4rem;}
.result-code{font-family:'Cinzel',serif;font-size:0.85rem;color:var(--text);}
.result-badge{font-size:0.72rem;font-weight:700;padding:3px 10px;border-radius:3px;letter-spacing:0.05em;}
.rb-success{background:rgba(39,174,96,0.2);color:#2ecc71;border:1px solid rgba(39,174,96,0.4);}
.rb-used{background:rgba(52,152,219,0.2);color:#3498db;border:1px solid rgba(52,152,219,0.4);}
.rb-failed{background:rgba(192,57,43,0.2);color:#e74c3c;border:1px solid rgba(192,57,43,0.4);}
.rb-pending{background:rgba(201,168,76,0.1);color:var(--gold);border:1px solid var(--border);}
.code-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;max-width:1200px;margin:0 auto;padding:0 2rem 4rem;}
.code-card{background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:1.25rem;}
.code-value{font-family:'Cinzel',serif;font-size:1.1rem;color:var(--gold);font-weight:700;margin-bottom:0.5rem;display:flex;align-items:center;justify-content:space-between;}
.copy-btn{background:rgba(201,168,76,0.15);border:1px solid var(--border);color:var(--gold);padding:3px 10px;border-radius:3px;font-size:0.75rem;cursor:pointer;font-family:'Nunito',sans-serif;}
.code-rewards{font-size:0.83rem;color:var(--text2);margin-bottom:0.5rem;}
.code-expiry{font-size:0.75rem;color:var(--text3);}
/* EMOTES */
.emote-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;max-width:1200px;margin:0 auto;padding:0 2rem 4rem;}
.emote-card{background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:1rem;text-align:center;}
.emote-card img{width:100%;max-width:120px;height:120px;object-fit:contain;border-radius:4px;margin-bottom:0.75rem;}
.emote-name{font-size:0.83rem;font-weight:700;color:var(--text);margin-bottom:0.5rem;}
.emote-dl{display:inline-block;background:rgba(201,168,76,0.15);border:1px solid var(--border);color:var(--gold);padding:5px 14px;border-radius:3px;font-size:0.78rem;text-decoration:none;}
/* ADMIN */
.admin-wrap{max-width:900px;margin:0 auto;padding:2rem;}
.admin-login{max-width:400px;margin:6rem auto;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:2rem;}
.admin-login h2{font-family:'Cinzel',serif;color:var(--gold);margin-bottom:1.5rem;}
.admin-tabs{display:flex;gap:0.5rem;margin-bottom:2rem;flex-wrap:wrap;}
.tab-btn{background:var(--bg3);border:1px solid var(--border2);color:var(--text2);padding:8px 16px;border-radius:5px;font-family:'Nunito',sans-serif;font-size:0.83rem;font-weight:600;cursor:pointer;}
.tab-btn.active{background:rgba(201,168,76,0.15);border-color:var(--gold);color:var(--gold);}
.admin-section{display:none;}
.admin-section.active{display:block;}
.admin-form{background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:1.5rem;margin-bottom:1.5rem;}
.admin-form h3{font-family:'Cinzel',serif;color:var(--gold);margin-bottom:1.25rem;font-size:1rem;}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
@media(max-width:600px){.form-row{grid-template-columns:1fr;}}
.form-group select,.form-group textarea{width:100%;background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:10px 14px;border-radius:5px;font-family:'Nunito',sans-serif;font-size:0.9rem;outline:none;}
.form-group textarea{resize:vertical;min-height:80px;}
.admin-list{display:flex;flex-direction:column;gap:0.5rem;margin-top:1.5rem;}
.admin-item{background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:0.75rem 1rem;display:flex;align-items:center;justify-content:space-between;}
.admin-item-info{font-size:0.85rem;}
.admin-item-info strong{color:var(--gold);}
.btn-danger{background:rgba(192,57,43,0.2);border:1px solid rgba(192,57,43,0.4);color:#e74c3c;padding:5px 12px;border-radius:4px;font-size:0.78rem;cursor:pointer;font-family:'Nunito',sans-serif;}
.alert{padding:10px 14px;border-radius:5px;font-size:0.85rem;margin-bottom:1rem;}
.alert-success{background:rgba(39,174,96,0.15);border:1px solid rgba(39,174,96,0.3);color:#2ecc71;}
.alert-error{background:rgba(192,57,43,0.15);border:1px solid rgba(192,57,43,0.3);color:#e74c3c;}
/* IMAGE GRID */
.img-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:0.75rem;margin-top:1rem;}
.img-slot{background:var(--bg4);border:1px solid var(--border2);border-radius:6px;padding:0.5rem;text-align:center;font-size:0.7rem;color:var(--text3);}
.img-slot img{width:100%;aspect-ratio:1/1;object-fit:contain;background:var(--bg2);border-radius:4px;margin-bottom:0.25rem;cursor:pointer;}
.img-slot-key{font-family:'Cinzel',serif;font-size:0.62rem;color:var(--gold3);word-break:break-all;}
/* HOME COMP CARDS */
.comp-card:hover{border-color:var(--comp-card-hover-color,var(--gold)) !important;}
/* EASTER EGG */
@keyframes egg-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
.egg-shake{animation:egg-shake 0.35s ease;}
/* FOOTER */
footer{border-top:1px solid var(--border2);padding:2rem 1.5rem;text-align:center;color:var(--text3);font-size:0.78rem;margin-top:4rem;line-height:1.7;}
footer span{color:var(--gold);}
.footer-brand{color:var(--text2);font-family:'Cinzel',serif;letter-spacing:0.06em;font-size:0.82rem;margin-bottom:0.5rem;}
.footer-disclaimer{max-width:680px;margin:0 auto 0.6rem;color:var(--text3);font-size:0.74rem;line-height:1.65;}
.footer-copyright{color:var(--text3);font-size:0.74rem;letter-spacing:0.04em;}
/* IMAGE ERROR HIDE */
.img-err-hide.errored{display:none;}
.img-err-dim.errored{opacity:0.2;}
/* SCROLLBAR */
::-webkit-scrollbar{width:6px;height:6px;}
::-webkit-scrollbar-track{background:var(--bg);}
::-webkit-scrollbar-thumb{background:var(--gold3);border-radius:3px;}
`;
}
