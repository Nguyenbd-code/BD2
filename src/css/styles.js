export function getStyles() {
  return `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0a0a0f;--bg2:#0f0f18;--bg3:#13131e;--bg4:#1a1a28;
  --gold:#c9a84c;--gold2:#e8c76a;--gold3:#a07830;
  --text:#e8e3d8;--text2:#b0a898;--text3:#706860;
  --border:rgba(201,168,76,0.2);--border2:rgba(201,168,76,0.1);
  --red:#c0392b;--blue:#2980b9;--purple:#8e44ad;
  --green:#27ae60;--orange:#e67e22;
  --t1:#c0392b;--t2:#2980b9;--t3:#8e44ad;
  --t4:#27ae60;--t5:#e67e22;--t6:#c9a84c;
}
html{scroll-behavior:smooth}
body{
  font-family:'Nunito',sans-serif;
  background:var(--bg);color:var(--text);
  min-height:100vh;line-height:1.6;
}
h1,h2,h3,h4,.cinzel{font-family:'Cinzel',serif}
a{color:var(--gold);text-decoration:none}
a:hover{color:var(--gold2)}
img{max-width:100%;height:auto}

/* ── Nav ── */
.site-nav{
  display:flex;align-items:center;justify-content:space-between;
  padding:0.75rem 2rem;
  background:var(--bg2);
  border-bottom:1px solid var(--border);
  position:sticky;top:0;z-index:100;
}
.nav-brand{
  font-family:'Cinzel',serif;font-size:1.2rem;font-weight:700;
  color:var(--gold2);letter-spacing:0.05em;
}
.nav-links{display:flex;gap:1.5rem}
.nav-links a{color:var(--text2);font-size:0.9rem;font-weight:600;transition:color 0.2s}
.nav-links a:hover{color:var(--gold)}

/* ── Layout ── */
.container{max-width:1100px;margin:0 auto;padding:2rem 1.5rem}
.page-title{
  font-family:'Cinzel',serif;font-size:2rem;font-weight:700;
  color:var(--gold2);margin-bottom:0.5rem;
}
.page-subtitle{color:var(--text2);margin-bottom:2rem;font-size:0.95rem}

/* ── Cards ── */
.card{
  background:var(--bg2);
  border:1px solid var(--border);
  border-radius:8px;padding:1.5rem;
}
.card+.card{margin-top:1rem}

/* ── Tier Badges ── */
.tier-badge{
  display:inline-block;
  font-family:'Cinzel',serif;font-size:0.75rem;font-weight:700;
  padding:0.2rem 0.55rem;border-radius:4px;
  letter-spacing:0.05em;
}
.tier-badge.t1{background:var(--t1);color:#fff}
.tier-badge.t2{background:var(--t2);color:#fff}
.tier-badge.t3{background:var(--t3);color:#fff}
.tier-badge.t4{background:var(--t4);color:#fff}
.tier-badge.t5{background:var(--t5);color:#fff}
.tier-badge.t6{background:var(--t6);color:#1a1a10}

/* ── Tile Badges ── */
.tile-badge{
  display:inline-block;
  font-size:0.65rem;font-weight:700;font-family:'Cinzel',serif;
  padding:0.15rem 0.4rem;border-radius:3px;
  letter-spacing:0.04em;
}
.tile-badge.FRONT{background:var(--t1);color:#fff}
.tile-badge.SELF{background:var(--t6);color:#1a1a10}
.tile-badge.ALL{background:var(--t2);color:#fff}
.tile-badge.SKIP{background:var(--t4);color:#fff}

/* ── Counter / Beats Tags ── */
.counter-tag,.beats-tag{
  display:inline-block;font-size:0.72rem;font-weight:700;
  padding:0.15rem 0.5rem;border-radius:3px;margin:0.1rem;
}
.counter-tag{background:rgba(192,57,43,0.2);color:#e74c3c;border:1px solid rgba(192,57,43,0.4)}
.beats-tag{background:rgba(39,174,96,0.2);color:#2ecc71;border:1px solid rgba(39,174,96,0.4)}

/* ── Tooltips ── */
.tt-parent{position:relative;display:inline-block;overflow:visible}
.tt-popup{
  display:none;position:absolute;
  bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);
  background:var(--bg4);border:1px solid var(--border);
  border-radius:6px;padding:0.6rem 0.8rem;
  font-size:0.78rem;color:var(--text);
  white-space:nowrap;min-width:180px;max-width:280px;white-space:normal;
  z-index:200;box-shadow:0 4px 16px rgba(0,0,0,0.6);
  pointer-events:none;
}
.tt-parent:hover .tt-popup{display:block}

/* ── Home Page ── */
.tier-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(280px,1fr));
  gap:1rem;margin-bottom:2rem;
}
.tier-card{
  background:var(--bg2);border:1px solid var(--border);
  border-radius:8px;padding:1.25rem;
  display:flex;flex-direction:column;gap:0.5rem;
  transition:border-color 0.2s,transform 0.2s;
}
.tier-card:hover{border-color:var(--gold);transform:translateY(-2px)}
.tier-card-header{display:flex;align-items:center;gap:0.6rem}
.tier-card-name{font-family:'Cinzel',serif;font-size:1rem;font-weight:600;color:var(--text)}
.tier-card-type{font-size:0.75rem;color:var(--text3);font-weight:600;
  background:var(--bg4);padding:0.1rem 0.4rem;border-radius:3px}
.tier-card-counters{font-size:0.8rem;color:var(--text2)}
.tier-card-meta{display:flex;flex-wrap:wrap;gap:0.3rem;margin-top:0.25rem}

.strategy-section{margin-top:2rem}
.strategy-section h2{
  font-family:'Cinzel',serif;font-size:1.2rem;color:var(--gold);
  margin-bottom:1rem;padding-bottom:0.5rem;
  border-bottom:1px solid var(--border);
}
.strategy-grid{
  display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem;
}
.strategy-card{
  background:var(--bg2);border:1px solid var(--border2);
  border-radius:8px;padding:1.25rem;
}
.strategy-card h3{
  font-family:'Cinzel',serif;font-size:0.9rem;color:var(--gold2);margin-bottom:0.5rem;
}
.strategy-card p{font-size:0.85rem;color:var(--text2);line-height:1.7}

/* ── Guide Page ── */
.guide-layout{display:flex;gap:2rem;align-items:flex-start}
.guide-sidebar{
  width:200px;flex-shrink:0;
  position:sticky;top:72px;
  background:var(--bg2);border:1px solid var(--border);
  border-radius:8px;padding:1rem;
}
.guide-sidebar h3{
  font-family:'Cinzel',serif;font-size:0.75rem;
  color:var(--gold);text-transform:uppercase;letter-spacing:0.08em;
  margin-bottom:0.75rem;padding-bottom:0.4rem;
  border-bottom:1px solid var(--border2);
}
.guide-sidebar a{
  display:block;font-size:0.82rem;color:var(--text2);
  padding:0.3rem 0;border-radius:3px;
  transition:color 0.2s;
}
.guide-sidebar a:hover{color:var(--gold)}
.guide-content{flex:1;min-width:0}

/* ── T1 Character Strip ── */
.t1-chars{display:flex;flex-wrap:wrap;gap:0.75rem;margin-bottom:1.5rem}
.t1-char{
  background:var(--bg3);border:1px solid var(--border);
  border-radius:8px;padding:1rem;
  display:flex;flex-direction:column;gap:0.5rem;
  min-width:160px;flex:1;max-width:200px;
}
.t1-char-name{font-family:'Cinzel',serif;font-size:0.95rem;font-weight:700;color:var(--gold2)}
.t1-char-costume{font-size:0.78rem;color:var(--text2)}
.t1-char-stats{font-size:0.72rem;color:var(--text3);line-height:1.5}
.t1-char-img{
  width:100%;height:100px;object-fit:cover;
  border-radius:6px;background:var(--bg4);
}

/* ── Rotation Table ── */
.rotation-section{margin-top:1.5rem;overflow-x:auto}
.rotation-section h3{
  font-family:'Cinzel',serif;font-size:1rem;color:var(--gold);
  margin-bottom:0.75rem;
}
.rotation-table{
  width:100%;border-collapse:separate;border-spacing:0;
  font-size:0.82rem;
}
.rotation-table th{
  background:var(--bg4);color:var(--gold);
  font-family:'Cinzel',serif;font-size:0.72rem;letter-spacing:0.04em;
  padding:0.5rem 0.75rem;text-align:left;
  border-bottom:2px solid var(--border);white-space:nowrap;
}
.rotation-table td{
  padding:0.45rem 0.75rem;
  border-bottom:1px solid var(--border2);
  vertical-align:middle;
}
.rotation-table tr:last-child td{border-bottom:none}
.rotation-table tr:hover td{background:var(--bg3)}

.skill-cell{
  display:flex;align-items:center;gap:0.4rem;
  position:relative;overflow:visible;
}
.skill-abbr{
  font-weight:700;font-size:0.8rem;color:var(--text);
  white-space:nowrap;
}
.skill-sp{font-size:0.72rem;color:var(--text3)}
.skill-cd{font-size:0.72rem;color:var(--text3)}
.skill-icon-img{width:28px;height:28px;object-fit:cover;border-radius:4px;flex-shrink:0}

/* ── Composition Cards ── */
.comp-section{margin-top:2rem}
.comp-section h2{
  font-family:'Cinzel',serif;font-size:1.1rem;color:var(--gold);
  margin-bottom:1rem;padding-bottom:0.4rem;
  border-bottom:1px solid var(--border);
}
.comp-card{
  background:var(--bg2);border:1px solid var(--border);
  border-radius:8px;padding:1.25rem;margin-bottom:1rem;
}
.comp-card-header{
  display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;
  flex-wrap:wrap;
}
.comp-card-name{font-family:'Cinzel',serif;font-size:1.05rem;font-weight:700;color:var(--text)}
.comp-card-type{
  font-size:0.72rem;font-weight:700;color:var(--text3);
  background:var(--bg4);padding:0.15rem 0.5rem;border-radius:3px;
}
.comp-card-meta{display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.75rem}
.comp-chars{display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem}
.comp-char{
  background:var(--bg4);border:1px solid var(--border2);
  border-radius:6px;padding:0.4rem 0.7rem;
  font-size:0.8rem;
}
.comp-char-name{font-weight:700;color:var(--text)}
.comp-char-costume{color:var(--text3);font-size:0.72rem}

/* ── Notes List ── */
.notes-list{
  list-style:none;padding:0;margin:0;
  display:flex;flex-direction:column;gap:0.3rem;
}
.notes-list li{
  font-size:0.82rem;color:var(--text2);
  padding-left:1rem;position:relative;
}
.notes-list li::before{
  content:'›';position:absolute;left:0;color:var(--gold);font-weight:700;
}

/* ── T1 Warning Banner ── */
.warning-banner{
  background:rgba(192,57,43,0.15);
  border:1px solid rgba(192,57,43,0.4);
  border-radius:6px;padding:0.6rem 1rem;
  font-size:0.82rem;color:#e74c3c;font-weight:600;
  margin-bottom:1rem;
}

/* ── Coupons Page ── */
.coupon-form{display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:2rem}
.coupon-form input{
  flex:1;min-width:200px;
  background:var(--bg3);border:1px solid var(--border);
  color:var(--text);padding:0.6rem 1rem;border-radius:6px;
  font-family:'Nunito',sans-serif;font-size:0.9rem;
}
.coupon-form input:focus{outline:none;border-color:var(--gold)}
.btn{
  display:inline-flex;align-items:center;gap:0.4rem;
  padding:0.6rem 1.2rem;border-radius:6px;
  font-family:'Nunito',sans-serif;font-size:0.88rem;font-weight:700;
  border:none;cursor:pointer;transition:opacity 0.2s,transform 0.15s;
}
.btn:hover{opacity:0.85;transform:translateY(-1px)}
.btn:active{transform:translateY(0)}
.btn-primary{background:var(--gold);color:#1a1a10}
.btn-danger{background:var(--red);color:#fff}
.btn-sm{padding:0.35rem 0.8rem;font-size:0.78rem}
.btn-secondary{background:var(--bg4);color:var(--text);border:1px solid var(--border)}

.coupon-list{display:flex;flex-direction:column;gap:0.5rem}
.coupon-item{
  background:var(--bg3);border:1px solid var(--border2);
  border-radius:6px;padding:0.75rem 1rem;
  display:flex;align-items:center;justify-content:space-between;gap:1rem;
  flex-wrap:wrap;
}
.coupon-code{font-family:'Cinzel',serif;font-weight:700;color:var(--gold2)}
.coupon-rewards{font-size:0.82rem;color:var(--text2)}
.coupon-expiry{font-size:0.75rem;color:var(--text3)}
.redeem-result{
  margin-top:1rem;padding:0.75rem 1rem;
  border-radius:6px;font-size:0.85rem;
}
.redeem-result.success{background:rgba(39,174,96,0.15);border:1px solid rgba(39,174,96,0.4);color:#2ecc71}
.redeem-result.error{background:rgba(192,57,43,0.15);border:1px solid rgba(192,57,43,0.4);color:#e74c3c}

/* ── Emotes Page ── */
.emote-grid{
  display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;
}
.emote-card{
  background:var(--bg2);border:1px solid var(--border);
  border-radius:8px;padding:0.75rem;
  display:flex;flex-direction:column;align-items:center;gap:0.5rem;
  text-align:center;
}
.emote-card img{width:100%;aspect-ratio:1/1;object-fit:contain;border-radius:4px}
.emote-card-name{font-size:0.8rem;color:var(--text2)}
.emote-download{
  font-size:0.72rem;color:var(--gold);
  display:inline-flex;align-items:center;gap:0.25rem;
}

/* ── Admin Page ── */
.admin-layout{max-width:900px;margin:0 auto;padding:2rem 1.5rem}
.admin-title{
  font-family:'Cinzel',serif;font-size:1.5rem;font-weight:700;
  color:var(--gold2);margin-bottom:1.5rem;
}
.tab-bar{
  display:flex;flex-wrap:wrap;gap:0.4rem;
  border-bottom:1px solid var(--border);
  margin-bottom:1.5rem;padding-bottom:0;
}
.tab-btn{
  background:none;border:none;
  font-family:'Nunito',sans-serif;font-size:0.85rem;font-weight:700;
  color:var(--text3);padding:0.5rem 1rem;
  cursor:pointer;border-bottom:2px solid transparent;
  margin-bottom:-1px;transition:color 0.2s,border-color 0.2s;
}
.tab-btn:hover{color:var(--text2)}
.tab-btn.active{color:var(--gold);border-bottom-color:var(--gold)}
.tab-pane{display:none}
.tab-pane.active{display:block}

.admin-section{margin-bottom:2rem}
.admin-section h3{
  font-family:'Cinzel',serif;font-size:0.95rem;color:var(--gold);
  margin-bottom:0.75rem;padding-bottom:0.4rem;
  border-bottom:1px solid var(--border2);
}
.admin-form{
  display:flex;flex-wrap:wrap;gap:0.6rem;align-items:flex-end;
  margin-bottom:1rem;
}
.admin-form label{
  display:flex;flex-direction:column;gap:0.25rem;
  font-size:0.78rem;color:var(--text3);font-weight:600;
}
.admin-form input,.admin-form select,.admin-form textarea{
  background:var(--bg3);border:1px solid var(--border);
  color:var(--text);padding:0.5rem 0.75rem;
  border-radius:5px;font-family:'Nunito',sans-serif;font-size:0.85rem;
  min-width:150px;
}
.admin-form input:focus,.admin-form select:focus,.admin-form textarea:focus{
  outline:none;border-color:var(--gold);
}
.admin-form textarea{min-height:80px;resize:vertical}
.admin-list{display:flex;flex-direction:column;gap:0.4rem}
.admin-item{
  background:var(--bg3);border:1px solid var(--border2);
  border-radius:6px;padding:0.6rem 1rem;
  display:flex;align-items:center;justify-content:space-between;
  gap:1rem;flex-wrap:wrap;
}
.admin-item-info{flex:1;min-width:0}
.admin-item-label{font-weight:700;color:var(--text);font-size:0.85rem}
.admin-item-sub{font-size:0.75rem;color:var(--text3)}

.image-grid{
  display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:0.75rem;
  margin-top:0.75rem;
}
.image-slot{
  background:var(--bg4);border:1px solid var(--border2);
  border-radius:6px;padding:0.5rem;
  display:flex;flex-direction:column;align-items:center;gap:0.35rem;
  font-size:0.7rem;color:var(--text3);text-align:center;
}
.image-slot img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:4px}
.image-slot-key{font-family:'Cinzel',serif;font-size:0.65rem;color:var(--gold3)}
.image-slot-empty{
  width:100%;aspect-ratio:1/1;background:var(--bg3);
  border-radius:4px;display:flex;align-items:center;justify-content:center;
  color:var(--text3);font-size:0.7rem;
}

.login-page{
  max-width:360px;margin:4rem auto;
  padding:2rem;background:var(--bg2);
  border:1px solid var(--border);border-radius:10px;
  text-align:center;
}
.login-page h2{
  font-family:'Cinzel',serif;color:var(--gold2);margin-bottom:1.5rem;
}
.login-page input{
  width:100%;background:var(--bg3);border:1px solid var(--border);
  color:var(--text);padding:0.7rem 1rem;border-radius:6px;
  font-size:0.9rem;font-family:'Nunito',sans-serif;
  margin-bottom:1rem;
}
.login-page input:focus{outline:none;border-color:var(--gold)}
.login-page .btn{width:100%;justify-content:center}

/* ── Feedback / Status ── */
.status-msg{
  font-size:0.8rem;padding:0.4rem 0.7rem;border-radius:4px;
  display:inline-block;
}
.status-msg.ok{background:rgba(39,174,96,0.15);color:#2ecc71}
.status-msg.err{background:rgba(192,57,43,0.15);color:#e74c3c}

/* ── Section Divider ── */
.section-title{
  font-family:'Cinzel',serif;font-size:1.4rem;font-weight:700;
  color:var(--gold2);margin:2rem 0 1rem;
  display:flex;align-items:center;gap:0.75rem;
}
.section-title::after{
  content:'';flex:1;height:1px;background:var(--border);
}

/* ── Mobile ── */
@media(max-width:768px){
  .site-nav{padding:0.75rem 1rem}
  .nav-links{gap:1rem}
  .container{padding:1.5rem 1rem}
  .guide-layout{flex-direction:column}
  .guide-sidebar{width:100%;position:static}
  .t1-chars{flex-direction:column}
  .t1-char{max-width:100%}
  .rotation-section{overflow-x:auto}
  .rotation-table{font-size:0.75rem;min-width:560px}
  .tier-grid{grid-template-columns:1fr}
  .strategy-grid{grid-template-columns:1fr}
  .tab-bar{gap:0.25rem}
  .tab-btn{font-size:0.75rem;padding:0.4rem 0.7rem}
  .admin-form{flex-direction:column}
  .admin-form label{width:100%}
  .admin-form input,.admin-form select{min-width:0;width:100%}
}
@media(max-width:480px){
  .page-title{font-size:1.5rem}
  .nav-brand{font-size:1rem}
}
`;
}
