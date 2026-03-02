import { useState, useEffect, useRef, useCallback } from "react";

/* ══════════════════════════════════════════════════════════
   GOOGLE CLIENT ID — replace with your own from
   console.cloud.google.com → APIs & Services → Credentials
   ══════════════════════════════════════════════════════════ */
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

/* ── FONTS ── */
const GF = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=JetBrains+Mono:wght@300;400;500&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');`;

/* ── WORLD TIMEZONES ── */
const ZONES = [
  {city:"Baker Island",tz:"Etc/GMT+12",flag:"🏝️",region:"Pacific"},
  {city:"Pago Pago",tz:"Pacific/Pago_Pago",flag:"🇦🇸",region:"Pacific"},
  {city:"Honolulu",tz:"Pacific/Honolulu",flag:"🇺🇸",region:"Americas"},
  {city:"Anchorage",tz:"America/Anchorage",flag:"🇺🇸",region:"Americas"},
  {city:"Los Angeles",tz:"America/Los_Angeles",flag:"🇺🇸",region:"Americas"},
  {city:"Denver",tz:"America/Denver",flag:"🇺🇸",region:"Americas"},
  {city:"Mexico City",tz:"America/Mexico_City",flag:"🇲🇽",region:"Americas"},
  {city:"Chicago",tz:"America/Chicago",flag:"🇺🇸",region:"Americas"},
  {city:"New York",tz:"America/New_York",flag:"🇺🇸",region:"Americas"},
  {city:"Toronto",tz:"America/Toronto",flag:"🇨🇦",region:"Americas"},
  {city:"Caracas",tz:"America/Caracas",flag:"🇻🇪",region:"Americas"},
  {city:"Santiago",tz:"America/Santiago",flag:"🇨🇱",region:"Americas"},
  {city:"São Paulo",tz:"America/Sao_Paulo",flag:"🇧🇷",region:"Americas"},
  {city:"Buenos Aires",tz:"America/Argentina/Buenos_Aires",flag:"🇦🇷",region:"Americas"},
  {city:"Nuuk",tz:"America/Nuuk",flag:"🇬🇱",region:"Americas"},
  {city:"Azores",tz:"Atlantic/Azores",flag:"🇵🇹",region:"Atlantic"},
  {city:"London",tz:"Europe/London",flag:"🇬🇧",region:"Europe"},
  {city:"Lisbon",tz:"Europe/Lisbon",flag:"🇵🇹",region:"Europe"},
  {city:"Paris",tz:"Europe/Paris",flag:"🇫🇷",region:"Europe"},
  {city:"Berlin",tz:"Europe/Berlin",flag:"🇩🇪",region:"Europe"},
  {city:"Rome",tz:"Europe/Rome",flag:"🇮🇹",region:"Europe"},
  {city:"Cairo",tz:"Africa/Cairo",flag:"🇪🇬",region:"Africa"},
  {city:"Nairobi",tz:"Africa/Nairobi",flag:"🇰🇪",region:"Africa"},
  {city:"Moscow",tz:"Europe/Moscow",flag:"🇷🇺",region:"Europe"},
  {city:"Dubai",tz:"Asia/Dubai",flag:"🇦🇪",region:"Asia"},
  {city:"Karachi",tz:"Asia/Karachi",flag:"🇵🇰",region:"Asia"},
  {city:"Mumbai",tz:"Asia/Kolkata",flag:"🇮🇳",region:"Asia"},
  {city:"Dhaka",tz:"Asia/Dhaka",flag:"🇧🇩",region:"Asia"},
  {city:"Rangoon",tz:"Asia/Rangoon",flag:"🇲🇲",region:"Asia"},
  {city:"Bangkok",tz:"Asia/Bangkok",flag:"🇹🇭",region:"Asia"},
  {city:"Singapore",tz:"Asia/Singapore",flag:"🇸🇬",region:"Asia"},
  {city:"Hong Kong",tz:"Asia/Hong_Kong",flag:"🇭🇰",region:"Asia"},
  {city:"Beijing",tz:"Asia/Shanghai",flag:"🇨🇳",region:"Asia"},
  {city:"Tokyo",tz:"Asia/Tokyo",flag:"🇯🇵",region:"Asia"},
  {city:"Seoul",tz:"Asia/Seoul",flag:"🇰🇷",region:"Asia"},
  {city:"Sydney",tz:"Australia/Sydney",flag:"🇦🇺",region:"Pacific"},
  {city:"Noumea",tz:"Pacific/Noumea",flag:"🇳🇨",region:"Pacific"},
  {city:"Auckland",tz:"Pacific/Auckland",flag:"🇳🇿",region:"Pacific"},
  {city:"Fiji",tz:"Pacific/Fiji",flag:"🇫🇯",region:"Pacific"},
  {city:"Kiritimati",tz:"Pacific/Kiritimati",flag:"🇰🇮",region:"Pacific"},
];

const INVEST_CATS = [
  {id:"fd",label:"Fixed Deposit",icon:"🏦",color:"#1B4332"},
  {id:"rd",label:"Recurring Deposit",icon:"🔄",color:"#2D6A4F"},
  {id:"savings",label:"Savings Account",icon:"💳",color:"#40916C"},
  {id:"cash",label:"Cash in Hand",icon:"💵",color:"#52B788"},
  {id:"loan",label:"Loan Given",icon:"🤝",color:"#B87333"},
  {id:"gold",label:"Physical Gold",icon:"🪙",color:"#C9943A"},
  {id:"chit",label:"Chit Fund",icon:"📋",color:"#D4AF37"},
  {id:"bonds",label:"Bonds / PPF / NSC",icon:"📜",color:"#6B4226"},
  {id:"other",label:"Others",icon:"📦",color:"#7B6D8D"},
];

const CURRENCIES = ["INR ₹","USD $","EUR €","GBP £","AED د.إ","SGD S$","JPY ¥","AUD A$"];

/* ── HELPERS ── */
const fmt = (n, d=2) => {
  if (n === undefined || n === null || isNaN(n)) return "—";
  if (Math.abs(n) >= 1e7) return (n/1e7).toFixed(2) + " Cr";
  if (Math.abs(n) >= 1e5) return (n/1e5).toFixed(2) + " L";
  return n.toLocaleString("en-IN", {minimumFractionDigits:d, maximumFractionDigits:d});
};
const fmtCcy = (n, ccy="INR ₹") => {
  const sym = ccy.split(" ")[1] || ccy.split(" ")[0];
  return sym + fmt(n);
};
const daysBetween = (a, b) => Math.round((new Date(b)-new Date(a))/(1000*86400));
const maturityVal = (p, r, days) => p * Math.pow(1 + r/100/365, days);

/* ══════════════════════════════════════════════════════════
   CSS
   ══════════════════════════════════════════════════════════ */
const CSS = `
${GF}
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --cream:#F7F3EC;--cream2:#F0EBE1;--cream3:#E8E0D2;--cream4:#DDD3C0;
  --ink:#1A1612;--ink2:#2C2620;--ink3:#4A4035;--ink4:#7A6F62;--ink5:#A89E92;
  --forest:#1B4332;--forest2:#2D6A4F;--forest3:#40916C;--forest4:#D8F3DC;
  --copper:#B87333;--copper2:#C9943A;--copper3:#E8B86D;--copper4:#FDF3E0;
  --rule:rgba(26,22,18,.12);--rule2:rgba(26,22,18,.06);--rule3:rgba(26,22,18,.03);
  --shadow:rgba(26,22,18,.08);--shadow2:rgba(26,22,18,.16);
  --ff:'Crimson Pro',serif;--fd:'Cormorant Garamond',serif;--fm:'JetBrains Mono',monospace;
  --r:4px;
}
html,body{background:var(--cream);color:var(--ink);font-family:var(--ff);font-size:15px;min-height:100vh}
::selection{background:var(--copper3);color:var(--ink)}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:var(--cream2)}
::-webkit-scrollbar-thumb{background:var(--copper);border-radius:2px}

/* ── NOISE TEXTURE OVERLAY ── */
.app{min-height:100vh;position:relative}
.app::before{
  content:'';position:fixed;inset:0;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
  pointer-events:none;z-index:0;opacity:1;
}
.app>*{position:relative;z-index:1}

/* ══ LOGIN PAGE ══ */
.login-page{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;overflow:hidden}
.login-art{background:var(--forest);position:relative;display:flex;flex-direction:column;justify-content:flex-end;padding:56px 48px;overflow:hidden}
.login-art::before{
  content:'';position:absolute;inset:0;
  background:repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,.04) 60px),
             repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,.04) 60px);
}
.login-art::after{
  content:'';position:absolute;top:-120px;right:-120px;
  width:480px;height:480px;border-radius:50%;
  background:radial-gradient(circle,rgba(184,115,51,.35) 0%,transparent 70%);
}
.art-rule{width:48px;height:2px;background:var(--copper3);margin-bottom:20px}
.art-heading{font-family:var(--fd);font-size:52px;font-weight:300;color:#F7F3EC;line-height:1.1;letter-spacing:-1px;margin-bottom:12px}
.art-heading em{font-style:italic;color:var(--copper3)}
.art-sub{font-family:var(--ff);font-size:16px;color:rgba(247,243,236,.55);font-weight:300;line-height:1.6;max-width:320px;margin-bottom:40px}
.art-pillars{display:flex;flex-direction:column;gap:12px}
.art-pillar{display:flex;align-items:center;gap:12px;font-size:13px;color:rgba(247,243,236,.65);font-family:var(--fm)}
.art-pillar-dot{width:6px;height:6px;border-radius:50%;background:var(--copper3);flex-shrink:0}
.art-deco{position:absolute;top:48px;right:48px;opacity:.12}
.art-deco svg{fill:none;stroke:var(--cream);stroke-width:1}

.login-form-wrap{background:var(--cream);display:flex;align-items:center;justify-content:center;padding:40px}
.login-box{width:100%;max-width:380px}
.login-logo-row{display:flex;align-items:center;gap:10px;margin-bottom:36px}
.login-logo-mark{width:38px;height:38px;background:var(--forest);display:flex;align-items:center;justify-content:center}
.login-logo-mark svg{fill:var(--copper3)}
.login-logo-text{font-family:var(--fd);font-size:24px;font-weight:400;color:var(--ink);letter-spacing:.5px}
.login-logo-text span{font-style:italic;color:var(--forest)}
.login-heading{font-family:var(--fd);font-size:36px;font-weight:300;color:var(--ink);margin-bottom:6px;line-height:1.1}
.login-sub{font-size:14px;color:var(--ink4);margin-bottom:32px;font-weight:300}
.login-divider{display:flex;align-items:center;gap:12px;margin:24px 0}
.login-divider::before,.login-divider::after{content:'';flex:1;height:1px;background:var(--rule)}
.login-divider span{font-size:11px;letter-spacing:2px;color:var(--ink5);font-family:var(--fm);text-transform:uppercase}
.g-btn{
  width:100%;display:flex;align-items:center;justify-content:center;gap:12px;
  padding:13px 20px;border:1.5px solid var(--rule);background:white;
  cursor:pointer;font-family:var(--ff);font-size:15px;color:var(--ink2);
  transition:all .2s;letter-spacing:.2px;
}
.g-btn:hover{border-color:var(--copper);background:var(--copper4);box-shadow:0 2px 12px var(--shadow)}
.g-btn svg{flex-shrink:0}
.demo-btn{
  width:100%;padding:13px 20px;border:none;
  background:var(--forest);color:var(--cream);
  cursor:pointer;font-family:var(--ff);font-size:16px;
  letter-spacing:.3px;transition:all .2s;
}
.demo-btn:hover{background:var(--forest2);box-shadow:0 4px 16px rgba(27,67,50,.3)}
.login-note{font-size:12px;color:var(--ink5);text-align:center;margin-top:20px;line-height:1.7;font-weight:300}
.login-note a{color:var(--copper);text-decoration:none;border-bottom:1px solid var(--copper3)}
#g-signin-btn{width:100%}

/* ══ HEADER ══ */
.hdr{background:var(--forest);border-bottom:3px solid var(--copper);padding:0 28px;
  display:flex;align-items:center;justify-content:space-between;height:58px;
  position:sticky;top:0;z-index:100}
.hdr-brand{display:flex;align-items:center;gap:10px}
.hdr-mark{width:30px;height:30px;background:var(--copper);display:flex;align-items:center;justify-content:center}
.hdr-mark svg{fill:var(--forest)}
.hdr-title{font-family:var(--fd);font-size:20px;font-weight:400;color:var(--cream);letter-spacing:.5px}
.hdr-title em{font-style:italic;color:var(--copper3)}
.hdr-right{display:flex;align-items:center;gap:14px}
.hdr-user{display:flex;align-items:center;gap:8px;font-size:13px;color:rgba(247,243,236,.75);font-family:var(--fm)}
.hdr-avatar{width:28px;height:28px;border-radius:50%;background:var(--copper);display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:14px;color:var(--forest);font-weight:600;overflow:hidden}
.hdr-avatar img{width:100%;height:100%;object-fit:cover}
.hdr-btn{padding:6px 14px;background:none;border:1px solid rgba(247,243,236,.2);
  color:rgba(247,243,236,.7);font-family:var(--fm);font-size:10px;letter-spacing:2px;
  text-transform:uppercase;cursor:pointer;transition:all .2s}
.hdr-btn:hover{border-color:var(--copper3);color:var(--copper3)}

/* ══ NAV TABS ══ */
.tabs{background:var(--cream2);border-bottom:1px solid var(--rule);display:flex;padding:0 28px;overflow-x:auto}
.tab{padding:12px 18px;font-family:var(--ff);font-size:14px;letter-spacing:.3px;
  color:var(--ink4);background:none;border:none;border-bottom:2px solid transparent;
  cursor:pointer;transition:all .2s;white-space:nowrap}
.tab:hover{color:var(--ink2)}
.tab.on{color:var(--forest);border-bottom-color:var(--copper);font-weight:600}

/* ══ MAIN ══ */
.main{padding:28px;max-width:1300px;margin:0 auto}

/* ══ KPI BAND ══ */
.kpi-band{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-bottom:32px;
  border:1px solid var(--rule);background:white;box-shadow:0 1px 8px var(--shadow)}
.kpi-cell{padding:20px 24px;position:relative;border-right:1px solid var(--rule)}
.kpi-cell:last-child{border-right:none}
.kpi-cell::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--forest)}
.kpi-cell.copper::before{background:var(--copper)}
.kpi-cell.forest2::before{background:var(--forest2)}
.kpi-cell.copper2::before{background:var(--copper2)}
.kpi-label{font-family:var(--fm);font-size:9px;letter-spacing:2px;text-transform:uppercase;
  color:var(--ink5);margin-bottom:8px}
.kpi-value{font-family:var(--fd);font-size:30px;font-weight:300;color:var(--ink);line-height:1;margin-bottom:4px}
.kpi-sub{font-family:var(--fm);font-size:11px;color:var(--ink4)}
.kpi-sub.pos{color:var(--forest3)}.kpi-sub.neg{color:#C95454}

/* ══ SECTION ══ */
.section{background:white;border:1px solid var(--rule);margin-bottom:20px;box-shadow:0 1px 6px var(--shadow)}
.section-head{padding:16px 24px 14px;border-bottom:1px solid var(--rule);
  display:flex;align-items:center;justify-content:space-between;background:var(--cream3)}
.section-title{font-family:var(--fd);font-size:20px;font-weight:400;color:var(--ink);
  display:flex;align-items:center;gap:8px}
.section-title em{font-style:italic;color:var(--forest)}
.section-rule{width:1px;height:16px;background:var(--copper);margin:0 4px}

/* ══ LEDGER TABLE ══ */
.ledger{width:100%;border-collapse:collapse;font-family:var(--ff)}
.ledger thead tr{border-bottom:2px solid var(--ink4)}
.ledger th{
  font-family:var(--fm);font-size:9px;letter-spacing:2px;text-transform:uppercase;
  color:var(--ink4);padding:10px 16px;text-align:left;font-weight:400;
  background:var(--cream2);border-right:1px solid var(--rule2)
}
.ledger th:last-child{border-right:none}
.ledger th.right{text-align:right}
.ledger td{padding:12px 16px;border-bottom:1px solid var(--rule2);border-right:1px solid var(--rule3);font-size:14px;vertical-align:middle}
.ledger td:last-child{border-right:none}
.ledger tr:hover td{background:var(--cream3)}
.ledger tr:last-child td{border-bottom:none}
.ledger .right{text-align:right;font-family:var(--fm)}
.ledger .mono{font-family:var(--fm);font-size:13px}
.ledger .pos{color:var(--forest)}.ledger .neg{color:#C95454}
.cat-pill{display:inline-flex;align-items:center;gap:5px;padding:2px 10px;font-size:11px;
  border-radius:2px;font-family:var(--fm);letter-spacing:.5px;white-space:nowrap}
.row-actions{display:flex;gap:6px;justify-content:flex-end}
.act-btn{padding:4px 10px;font-family:var(--fm);font-size:9px;letter-spacing:1px;
  text-transform:uppercase;border:1px solid var(--rule);background:none;cursor:pointer;
  color:var(--ink4);transition:all .2s}
.act-btn:hover{border-color:var(--copper);color:var(--copper);background:var(--copper4)}
.act-btn.del:hover{border-color:#C95454;color:#C95454;background:#FEF2F2}

/* ══ ADD FORM ══ */
.form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;padding:20px 24px}
.form-full{grid-column:1/-1}
.fg label{font-family:var(--fm);font-size:9px;letter-spacing:2px;text-transform:uppercase;
  color:var(--ink4);display:block;margin-bottom:6px}
.fg input,.fg select,.fg textarea{
  width:100%;background:var(--cream);border:1px solid var(--rule);color:var(--ink);
  padding:9px 12px;font-family:var(--ff);font-size:14px;outline:none;
  transition:border-color .2s;border-radius:0;
}
.fg input:focus,.fg select:focus,.fg textarea:focus{border-color:var(--copper);background:white}
.fg select option{background:white}
.fg textarea{resize:vertical;min-height:60px}
.form-actions{display:flex;gap:10px;padding:0 24px 20px;flex-wrap:wrap}
.btn{padding:9px 22px;font-family:var(--fm);font-size:10px;letter-spacing:2px;
  text-transform:uppercase;cursor:pointer;border:none;transition:all .2s}
.btn-forest{background:var(--forest);color:var(--cream)}
.btn-forest:hover{background:var(--forest2);box-shadow:0 2px 10px rgba(27,67,50,.25)}
.btn-outline{background:none;border:1px solid var(--rule);color:var(--ink4)}
.btn-outline:hover{border-color:var(--copper);color:var(--copper)}
.btn-copper{background:var(--copper);color:white}
.btn-copper:hover{background:var(--copper2)}

/* ══ CAT SELECTOR ══ */
.cat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;padding:16px 24px}
.cat-tile{padding:14px;border:1.5px solid var(--rule);cursor:pointer;transition:all .2s;text-align:center}
.cat-tile:hover{border-color:var(--copper3);background:var(--copper4)}
.cat-tile.selected{border-color:var(--forest);background:var(--forest4)}
.cat-tile-icon{font-size:22px;margin-bottom:6px}
.cat-tile-label{font-family:var(--fm);font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--ink3)}

/* ══ WORLD CLOCK ══ */
.clock-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:0}
.clock-card{padding:14px 16px;border-right:1px solid var(--rule2);border-bottom:1px solid var(--rule2);transition:background .15s;cursor:default}
.clock-card:hover{background:var(--cream3)}
.clock-flag{font-size:18px;margin-bottom:4px}
.clock-city{font-family:var(--fd);font-size:16px;font-weight:400;color:var(--ink);margin-bottom:1px}
.clock-tz{font-family:var(--fm);font-size:9px;letter-spacing:1px;color:var(--ink5);margin-bottom:6px}
.clock-time{font-family:var(--fm);font-size:20px;font-weight:400;color:var(--forest);letter-spacing:.5px}
.clock-time.night{color:var(--ink3)}
.clock-date{font-family:var(--fm);font-size:10px;color:var(--ink5);margin-top:2px}
.clock-offset{font-family:var(--fm);font-size:9px;color:var(--copper);letter-spacing:.5px;margin-top:3px}
.region-head{background:var(--forest);color:var(--copper3);font-family:var(--fm);font-size:9px;
  letter-spacing:3px;text-transform:uppercase;padding:8px 16px;grid-column:1/-1}
.clock-filter{display:flex;gap:8px;flex-wrap:wrap;padding:12px 16px;border-bottom:1px solid var(--rule)}
.cf-btn{padding:4px 12px;font-family:var(--fm);font-size:9px;letter-spacing:2px;text-transform:uppercase;
  border:1px solid var(--rule);background:none;cursor:pointer;color:var(--ink4);transition:all .2s}
.cf-btn.on{background:var(--forest);border-color:var(--forest);color:var(--cream)}
.clock-search{flex:1;max-width:220px;background:var(--cream);border:1px solid var(--rule);
  color:var(--ink);padding:5px 10px;font-family:var(--fm);font-size:11px;outline:none}
.clock-search:focus{border-color:var(--copper)}
.my-time-card{padding:20px 24px;background:linear-gradient(135deg,var(--forest),var(--forest2));
  display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
.mt-label{font-family:var(--fm);font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(247,243,236,.6);margin-bottom:4px}
.mt-time{font-family:var(--fd);font-size:44px;font-weight:300;color:var(--cream);line-height:1;letter-spacing:-1px}
.mt-date{font-family:var(--ff);font-size:16px;color:rgba(247,243,236,.7);font-weight:300;margin-top:4px}
.mt-tz{font-family:var(--fm);font-size:11px;color:var(--copper3);letter-spacing:1px;margin-top:2px}

/* ══ SUMMARY BARS ══ */
.summary-bars{padding:16px 24px}
.sbar{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.sbar-label{font-family:var(--fm);font-size:10px;letter-spacing:1px;color:var(--ink4);min-width:140px;text-transform:uppercase}
.sbar-track{flex:1;height:6px;background:var(--cream3);border-radius:0;overflow:hidden}
.sbar-fill{height:100%;border-radius:0;transition:width 1s ease}
.sbar-val{font-family:var(--fm);font-size:11px;color:var(--ink3);min-width:80px;text-align:right}

/* ══ EMPTY STATE ══ */
.empty{padding:40px;text-align:center;color:var(--ink5)}
.empty-icon{font-size:32px;margin-bottom:10px;opacity:.5}
.empty-text{font-family:var(--fd);font-size:20px;font-weight:300;margin-bottom:4px;color:var(--ink3)}
.empty-sub{font-size:13px;font-weight:300}

/* ══ MODAL ══ */
.modal-bg{position:fixed;inset:0;background:rgba(26,22,18,.5);z-index:500;
  display:flex;align-items:center;justify-content:center;padding:20px;
  backdrop-filter:blur(3px)}
.modal{background:var(--cream);border:1px solid var(--rule);max-width:620px;width:100%;
  max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(26,22,18,.3)}
.modal-head{padding:18px 24px 16px;border-bottom:1px solid var(--rule);
  background:var(--forest);display:flex;align-items:center;justify-content:space-between}
.modal-title{font-family:var(--fd);font-size:22px;font-weight:300;color:var(--cream)}
.modal-close{background:none;border:none;font-size:20px;cursor:pointer;
  color:rgba(247,243,236,.6);transition:color .2s;padding:0 4px}
.modal-close:hover{color:var(--cream)}

/* ══ BADGE ══ */
.badge{display:inline-flex;align-items:center;padding:3px 8px;font-family:var(--fm);
  font-size:9px;letter-spacing:1px;text-transform:uppercase;font-weight:500}

/* ══ PROGRESS RING ══ */
@keyframes ring{from{stroke-dashoffset:283}to{}}
.ring circle.fill{animation:ring 1s ease-out forwards;stroke-linecap:round}

/* ══ RESPONSIVE ══ */
@media(max-width:900px){
  .login-page{grid-template-columns:1fr}
  .login-art{display:none}
  .kpi-band{grid-template-columns:repeat(2,1fr)}
  .kpi-cell{border-bottom:1px solid var(--rule)}
  .main{padding:16px}
  .clock-grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
}
@media(max-width:600px){
  .kpi-band{grid-template-columns:1fr}
  .kpi-cell{border-right:none}
  .tabs{padding:0 12px}
  .hdr{padding:0 14px}
}
`;

/* ── DEFAULT DATA ── */
const SAMPLE_DATA = [
  {id:1,cat:"fd",name:"SBI Fixed Deposit",bank:"State Bank of India",principal:500000,rate:7.1,startDate:"2024-01-15",maturityDate:"2025-01-15",notes:"",ccy:"INR ₹"},
  {id:2,cat:"savings",name:"HDFC Savings",bank:"HDFC Bank",principal:125000,rate:3.5,startDate:"2023-06-01",maturityDate:"",notes:"Emergency fund",ccy:"INR ₹"},
  {id:3,cat:"loan",name:"Loan to Ramesh",bank:"",principal:80000,rate:0,startDate:"2024-03-10",maturityDate:"2024-09-10",notes:"Cousin — house repair",ccy:"INR ₹"},
  {id:4,cat:"gold",name:"Gold Coins",bank:"",principal:45000,rate:0,startDate:"2023-12-01",maturityDate:"",notes:"4×10g coins — safe at home",ccy:"INR ₹"},
  {id:5,cat:"rd",name:"Post Office RD",bank:"India Post",principal:3000,rate:6.7,startDate:"2024-01-01",maturityDate:"2026-01-01",notes:"₹3000/month",ccy:"INR ₹"},
  {id:6,cat:"bonds",name:"PPF Account",bank:"SBI",principal:150000,rate:7.1,startDate:"2023-04-01",maturityDate:"2038-04-01",notes:"Annual deposit",ccy:"INR ₹"},
];

/* ══════════════════════════════════════════════════════════
   APP
   ══════════════════════════════════════════════════════════ */
export default function App() {
  const [user, setUser]           = useState(null);
  const [tab, setTab]             = useState("dashboard");
  const [investments, setInvestments] = useState(SAMPLE_DATA);
  const [showAdd, setShowAdd]     = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [selectedCat, setSelectedCat] = useState("fd");
  const [clockFilter, setClockFilter] = useState("All");
  const [clockSearch, setClockSearch] = useState("");
  const [clocks, setClocks]       = useState({});
  const [now, setNow]             = useState(new Date());
  const [ccy, setCcy]             = useState("INR ₹");
  const [newItem, setNewItem]     = useState({cat:"fd",name:"",bank:"",principal:"",rate:"",startDate:new Date().toISOString().slice(0,10),maturityDate:"",notes:""});
  const gsiRef = useRef(null);

  /* ── Clock ── */
  useEffect(() => {
    const t = setInterval(() => {
      const n = new Date();
      setNow(n);
      const c = {};
      ZONES.forEach(z => {
        try {
          const s = n.toLocaleString("en-GB", {timeZone:z.tz,hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});
          const d = n.toLocaleString("en-GB", {timeZone:z.tz,weekday:"short",day:"numeric",month:"short"});
          const utcOffset = n.toLocaleString("en",{timeZone:z.tz,timeZoneName:"short"}).split(" ").pop();
          const hh = parseInt(s.split(":")[0]);
          c[z.city] = {time:s, date:d, hour:hh, offset:utcOffset};
        } catch {}
      });
      setClocks(c);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Load GSI ── */
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com") {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp) => {
            // Decode JWT
            const payload = JSON.parse(atob(resp.credential.split(".")[1]));
            setUser({name:payload.name, email:payload.email, picture:payload.picture, demo:false});
          }
        });
        window.google.accounts.id.renderButton(
          document.getElementById("g-signin-btn"),
          {theme:"outline", size:"large", width:"340", text:"signin_with"}
        );
      }
    };
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, []);

  /* ── Storage ── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const r = await window.storage.get("ledger_investments");
        if (r && r.value) setInvestments(JSON.parse(r.value));
      } catch {}
    })();
  }, [user]);

  const save = useCallback(async (data) => {
    try { await window.storage.set("ledger_investments", JSON.stringify(data)); } catch {}
  }, []);

  /* ── Metrics ── */
  const totalInvested = investments.reduce((s,i) => s + (parseFloat(i.principal)||0), 0);
  const estimatedValue = investments.reduce((s,i) => {
    const p = parseFloat(i.principal)||0, r = parseFloat(i.rate)||0;
    if (!r || !i.maturityDate) return s + p;
    const days = daysBetween(i.startDate || new Date().toISOString().slice(0,10), i.maturityDate);
    return s + (days > 0 ? maturityVal(p, r, days) : p);
  }, 0);
  const totalGain = estimatedValue - totalInvested;
  const activeCount = investments.filter(i => !i.maturityDate || new Date(i.maturityDate) > new Date()).length;

  /* ── Cat breakdown ── */
  const catTotals = INVEST_CATS.map(c => ({
    ...c,
    total: investments.filter(i=>i.cat===c.id).reduce((s,i)=>s+(parseFloat(i.principal)||0),0)
  })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);

  /* ── Filtered clocks ── */
  const filteredZones = ZONES.filter(z => {
    const matchRegion = clockFilter==="All" || z.region===clockFilter;
    const matchSearch = !clockSearch || z.city.toLowerCase().includes(clockSearch.toLowerCase());
    return matchRegion && matchSearch;
  });
  const regions = ["All",...[...new Set(ZONES.map(z=>z.region))]];

  /* ── Add/Edit helpers ── */
  function openAdd(cat = "fd") {
    setSelectedCat(cat);
    setNewItem({cat,name:"",bank:"",principal:"",rate:"",startDate:new Date().toISOString().slice(0,10),maturityDate:"",notes:""});
    setEditItem(null);
    setShowAdd(true);
  }
  function openEdit(item) {
    setEditItem(item);
    setNewItem({...item});
    setSelectedCat(item.cat);
    setShowAdd(true);
  }
  function saveItem() {
    if (!newItem.name || !newItem.principal) return;
    const item = {...newItem, cat:selectedCat, principal:parseFloat(newItem.principal), rate:parseFloat(newItem.rate)||0, id:editItem?editItem.id:Date.now()};
    const updated = editItem
      ? investments.map(i => i.id===editItem.id ? item : i)
      : [...investments, item];
    setInvestments(updated);
    save(updated);
    setShowAdd(false);
    setEditItem(null);
  }
  function deleteItem(id) {
    const updated = investments.filter(i => i.id !== id);
    setInvestments(updated);
    save(updated);
  }

  /* ── My local time ── */
  const localTime = now.toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});
  const localDate = now.toLocaleDateString("en",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const localTZ   = Intl.DateTimeFormat().resolvedOptions().timeZone;

  /* ══════════════════════════════════
     LOGIN PAGE
     ══════════════════════════════════ */
  if (!user) return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="login-page">
          <div className="login-art">
            {/* Deco grid SVG */}
            <div className="art-deco">
              <svg width="220" height="220" viewBox="0 0 220 220">
                {[...Array(5)].map((_,i)=>(
                  <rect key={i} x={10+i*40} y={10+i*40} width={200-i*80} height={200-i*80} strokeWidth=".5"/>
                ))}
                <circle cx="110" cy="110" r="60" strokeWidth=".5"/>
                <circle cx="110" cy="110" r="30" strokeWidth=".5"/>
                <line x1="110" y1="10" x2="110" y2="210" strokeWidth=".5"/>
                <line x1="10" y1="110" x2="210" y2="110" strokeWidth=".5"/>
              </svg>
            </div>
            <div className="art-rule"/>
            <div className="art-heading">Your <em>Private</em><br/>Financial<br/>Ledger</div>
            <div className="art-sub">Track every rupee, every deposit, every loan — with the precision of a private banker.</div>
            <div className="art-pillars">
              {["Cash & Fixed Deposits","Loans Given & Received","Physical Gold & Bonds","World Clocks & Timezones"].map(p=>(
                <div key={p} className="art-pillar"><div className="art-pillar-dot"/>{p}</div>
              ))}
            </div>
          </div>
          <div className="login-form-wrap">
            <div className="login-box">
              <div className="login-logo-row">
                <div className="login-logo-mark">
                  <svg width="18" height="18" viewBox="0 0 18 18"><path d="M2 14V4h4v10H2zm6-10h4l2 3-2 3h-4l2-3-2-3z"/></svg>
                </div>
                <div className="login-logo-text">Private <span>Ledger</span></div>
              </div>
              <div className="login-heading">Welcome back</div>
              <div className="login-sub">Sign in to access your financial records</div>

              <div id="g-signin-btn"/>

              {GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com" && (
                <>
                  <div className="login-divider"><span>or continue as</span></div>
                  <button className="demo-btn" onClick={() => setUser({name:"Demo User",email:"demo@privatledger.app",picture:null,demo:true})}>
                    Enter Demo Mode
                  </button>
                </>
              )}

              <div className="login-note">
                To enable real Google Sign-In, replace <code style={{fontFamily:"var(--fm)",fontSize:11,background:"var(--cream2)",padding:"1px 5px"}}>GOOGLE_CLIENT_ID</code> at the top of the file<br/>with your own from <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer">Google Cloud Console</a>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  /* ══════════════════════════════════
     MAIN APP
     ══════════════════════════════════ */
  const catInfo = (id) => INVEST_CATS.find(c=>c.id===id) || INVEST_CATS[8];

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* HEADER */}
        <div className="hdr">
          <div className="hdr-brand">
            <div className="hdr-mark">
              <svg width="16" height="16" viewBox="0 0 18 18"><path d="M2 14V4h4v10H2zm6-10h4l2 3-2 3h-4l2-3-2-3z"/></svg>
            </div>
            <div className="hdr-title">Private <em>Ledger</em></div>
          </div>
          <div className="hdr-right">
            <div className="hdr-user">
              <div className="hdr-avatar">
                {user.picture
                  ? <img src={user.picture} alt={user.name}/>
                  : user.name.charAt(0).toUpperCase()}
              </div>
              <span>{user.name.split(" ")[0]}</span>
              {user.demo && <span style={{fontSize:9,letterSpacing:1,opacity:.6,textTransform:"uppercase",fontFamily:"var(--fm)"}}>demo</span>}
            </div>
            <select style={{background:"none",border:"1px solid rgba(247,243,236,.2)",color:"rgba(247,243,236,.8)",fontFamily:"var(--fm)",fontSize:11,padding:"4px 8px",outline:"none",cursor:"pointer"}}
              value={ccy} onChange={e=>setCcy(e.target.value)}>
              {CURRENCIES.map(c=><option key={c} style={{background:"var(--forest)"}}>{c}</option>)}
            </select>
            <button className="hdr-btn" onClick={()=>setUser(null)}>Sign Out</button>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs">
          {[["dashboard","📊 Overview"],["investments","📒 Investments"],["clocks","🌐 World Clock"],["analysis","📈 Analysis"]].map(([k,l])=>(
            <button key={k} className={`tab ${tab===k?"on":""}`} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>

        <div className="main">

          {/* ═══════ DASHBOARD ═══════ */}
          {tab==="dashboard" && (
            <>
              {/* KPI BAND */}
              <div className="kpi-band">
                <div className="kpi-cell">
                  <div className="kpi-label">Total Invested</div>
                  <div className="kpi-value">{fmtCcy(totalInvested, ccy)}</div>
                  <div className="kpi-sub">{investments.length} entries</div>
                </div>
                <div className="kpi-cell copper">
                  <div className="kpi-label">Estimated Value</div>
                  <div className="kpi-value">{fmtCcy(estimatedValue, ccy)}</div>
                  <div className="kpi-sub pos">at maturity</div>
                </div>
                <div className="kpi-cell forest2">
                  <div className="kpi-label">Total Gain</div>
                  <div className="kpi-value" style={{color:totalGain>=0?"var(--forest)":"#C95454"}}>{fmtCcy(totalGain, ccy)}</div>
                  <div className={`kpi-sub ${totalGain>=0?"pos":"neg"}`}>{totalInvested>0?((totalGain/totalInvested)*100).toFixed(2):"0.00"}% return</div>
                </div>
                <div className="kpi-cell copper2">
                  <div className="kpi-label">Active Holdings</div>
                  <div className="kpi-value">{activeCount}</div>
                  <div className="kpi-sub">{investments.length - activeCount} matured</div>
                </div>
              </div>

              {/* ALLOCATION BARS */}
              <div className="section" style={{marginBottom:20}}>
                <div className="section-head">
                  <div className="section-title">Allocation by <em>Category</em></div>
                </div>
                <div className="summary-bars">
                  {catTotals.map(c=>(
                    <div className="sbar" key={c.id}>
                      <div className="sbar-label">{c.icon} {c.label}</div>
                      <div className="sbar-track">
                        <div className="sbar-fill" style={{width:`${(c.total/totalInvested*100).toFixed(1)}%`,background:c.color}}/>
                      </div>
                      <div className="sbar-val">{fmtCcy(c.total,ccy)}</div>
                    </div>
                  ))}
                  {catTotals.length===0 && <div style={{color:"var(--ink5)",fontSize:13,padding:8}}>No investments yet.</div>}
                </div>
              </div>

              {/* RECENT */}
              <div className="section">
                <div className="section-head">
                  <div className="section-title">Recent <em>Entries</em></div>
                  <button className="btn btn-forest" onClick={()=>openAdd()}>+ Add Entry</button>
                </div>
                <table className="ledger">
                  <thead><tr>
                    <th>Name</th><th>Category</th><th className="right">Principal</th>
                    <th className="right">Rate %</th><th>Maturity</th><th></th>
                  </tr></thead>
                  <tbody>
                    {[...investments].reverse().slice(0,6).map(i=>{
                      const c = catInfo(i.cat);
                      const isActive = !i.maturityDate || new Date(i.maturityDate)>new Date();
                      return (
                        <tr key={i.id}>
                          <td><div style={{fontWeight:600,fontSize:14}}>{i.name}</div>
                            {i.bank&&<div style={{fontSize:11,color:"var(--ink5)",fontFamily:"var(--fm)"}}>{i.bank}</div>}</td>
                          <td><span className="cat-pill" style={{background:c.color+"18",color:c.color,border:`1px solid ${c.color}40`}}>{c.icon} {c.label}</span></td>
                          <td className="right mono">{fmtCcy(i.principal,i.ccy||ccy)}</td>
                          <td className="right mono">{i.rate||"—"}%</td>
                          <td><span className="badge" style={{background:isActive?"var(--forest4)":"var(--cream3)",color:isActive?"var(--forest)":"var(--ink4)",border:`1px solid ${isActive?"var(--forest3)":"var(--rule)"}`}}>
                            {i.maturityDate?(isActive?"Active":"Matured"):"Ongoing"}
                          </span></td>
                          <td><div className="row-actions">
                            <button className="act-btn" onClick={()=>openEdit(i)}>Edit</button>
                            <button className="act-btn del" onClick={()=>deleteItem(i.id)}>✕</button>
                          </div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {investments.length===0&&<div className="empty"><div className="empty-icon">📒</div><div className="empty-text">No entries yet</div><div className="empty-sub">Start tracking your cash investments above</div></div>}
              </div>
            </>
          )}

          {/* ═══════ INVESTMENTS ═══════ */}
          {tab==="investments" && (
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontFamily:"var(--fd)",fontSize:26,fontWeight:300,color:"var(--ink)"}}>All <em style={{fontStyle:"italic",color:"var(--forest)"}}>Investments</em></div>
                <button className="btn btn-forest" onClick={()=>openAdd()}>+ Add Investment</button>
              </div>

              {INVEST_CATS.map(cat=>{
                const items = investments.filter(i=>i.cat===cat.id);
                if (items.length===0) return null;
                const catTotal = items.reduce((s,i)=>s+(parseFloat(i.principal)||0),0);
                return (
                  <div className="section" key={cat.id} style={{marginBottom:16}}>
                    <div className="section-head">
                      <div className="section-title">
                        {cat.icon} {cat.label}
                        <div className="section-rule"/>
                        <span style={{fontFamily:"var(--fm)",fontSize:13,color:"var(--ink4)",fontStyle:"normal"}}>{items.length} entries</span>
                      </div>
                      <span style={{fontFamily:"var(--fm)",fontSize:13,color:"var(--forest)",fontWeight:500}}>{fmtCcy(catTotal,ccy)}</span>
                    </div>
                    <table className="ledger">
                      <thead><tr>
                        <th>Name / Bank</th>
                        <th className="right">Principal</th>
                        <th className="right">Rate %</th>
                        <th className="right">Est. Value</th>
                        <th>Start</th>
                        <th>Maturity</th>
                        <th>Status</th>
                        <th>Notes</th>
                        <th></th>
                      </tr></thead>
                      <tbody>
                        {items.map(i=>{
                          const p = parseFloat(i.principal)||0;
                          const r = parseFloat(i.rate)||0;
                          let estVal = p;
                          if (r && i.maturityDate) {
                            const days = daysBetween(i.startDate||new Date().toISOString().slice(0,10), i.maturityDate);
                            if (days>0) estVal = maturityVal(p,r,days);
                          }
                          const gain = estVal-p;
                          const isActive = !i.maturityDate || new Date(i.maturityDate)>new Date();
                          const daysLeft = i.maturityDate ? daysBetween(new Date().toISOString().slice(0,10),i.maturityDate) : null;
                          return (
                            <tr key={i.id}>
                              <td>
                                <div style={{fontWeight:600}}>{i.name}</div>
                                {i.bank&&<div style={{fontSize:11,color:"var(--ink5)",fontFamily:"var(--fm)"}}>{i.bank}</div>}
                              </td>
                              <td className="right mono">{fmtCcy(p,i.ccy||ccy)}</td>
                              <td className="right mono">{r?r+"%":"—"}</td>
                              <td className="right">
                                <div className="mono">{fmtCcy(estVal,i.ccy||ccy)}</div>
                                {gain>0&&<div style={{fontSize:10,color:"var(--forest)",fontFamily:"var(--fm)"}}>+{fmtCcy(gain,i.ccy||ccy)}</div>}
                              </td>
                              <td className="mono" style={{fontSize:12}}>{i.startDate||"—"}</td>
                              <td className="mono" style={{fontSize:12}}>{i.maturityDate||"Ongoing"}</td>
                              <td>
                                {daysLeft!==null&&isActive&&daysLeft<=30
                                  ? <span className="badge" style={{background:"#FEF9C3",color:"#92400E",border:"1px solid #FCD34D"}}>⚠ {daysLeft}d left</span>
                                  : <span className="badge" style={{background:isActive?"var(--forest4)":"var(--cream3)",color:isActive?"var(--forest)":"var(--ink4)",border:`1px solid ${isActive?"var(--forest3)":"var(--rule)"}`}}>
                                      {i.maturityDate?(isActive?"Active":"Matured"):"Ongoing"}
                                    </span>}
                              </td>
                              <td style={{fontSize:12,color:"var(--ink4)",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.notes||"—"}</td>
                              <td><div className="row-actions">
                                <button className="act-btn" onClick={()=>openEdit(i)}>Edit</button>
                                <button className="act-btn del" onClick={()=>deleteItem(i.id)}>✕</button>
                              </div></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
              {investments.length===0&&<div className="section"><div className="empty"><div className="empty-icon">📒</div><div className="empty-text">No investments yet</div><div className="empty-sub">Click "Add Investment" to begin tracking</div></div></div>}
            </>
          )}

          {/* ═══════ WORLD CLOCK ═══════ */}
          {tab==="clocks" && (
            <>
              {/* Hero time */}
              <div className="section" style={{marginBottom:16}}>
                <div className="my-time-card">
                  <div>
                    <div className="mt-label">Your Local Time</div>
                    <div className="mt-time">{localTime}</div>
                    <div className="mt-date">{localDate}</div>
                    <div className="mt-tz">{localTZ}</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,textAlign:"center"}}>
                    {["Dubai","London","New York"].map(city=>{
                      const c = clocks[city];
                      const z = ZONES.find(z=>z.city===city);
                      return (
                        <div key={city} style={{borderLeft:"1px solid rgba(247,243,236,.15)",paddingLeft:16}}>
                          <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"rgba(247,243,236,.5)",textTransform:"uppercase",marginBottom:4}}>{z?.flag} {city}</div>
                          <div style={{fontFamily:"var(--fd)",fontSize:22,color:"var(--cream)"}}>{c?.time||"--:--:--"}</div>
                          <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--copper3)",marginTop:2}}>{c?.offset}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="clock-filter">
                  {regions.map(r=>(
                    <button key={r} className={`cf-btn ${clockFilter===r?"on":""}`} onClick={()=>setClockFilter(r)}>{r}</button>
                  ))}
                  <input className="clock-search" placeholder="Search city…" value={clockSearch}
                    onChange={e=>setClockSearch(e.target.value)}/>
                </div>
                <div className="clock-grid">
                  {filteredZones.map(z=>{
                    const c = clocks[z.city];
                    const isNight = c && (c.hour < 6 || c.hour >= 22);
                    return (
                      <div key={z.city} className="clock-card">
                        <div className="clock-flag">{z.flag}</div>
                        <div className="clock-city">{z.city}</div>
                        <div className="clock-tz">{z.tz}</div>
                        <div className={`clock-time ${isNight?"night":""}`}>{c?.time||"--:--:--"}</div>
                        <div className="clock-date">{c?.date||""}</div>
                        <div className="clock-offset">{c?.offset||""}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ═══════ ANALYSIS ═══════ */}
          {tab==="analysis" && (
            <>
              <div style={{fontFamily:"var(--fd)",fontSize:26,fontWeight:300,marginBottom:20}}>Portfolio <em style={{fontStyle:"italic",color:"var(--forest)"}}>Analysis</em></div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                {/* Maturity timeline */}
                <div className="section">
                  <div className="section-head"><div className="section-title">Upcoming <em>Maturities</em></div></div>
                  <div style={{padding:"8px 0"}}>
                    {investments.filter(i=>i.maturityDate&&new Date(i.maturityDate)>new Date())
                      .sort((a,b)=>new Date(a.maturityDate)-new Date(b.maturityDate))
                      .slice(0,8)
                      .map(i=>{
                        const days = daysBetween(new Date().toISOString().slice(0,10),i.maturityDate);
                        const c = catInfo(i.cat);
                        const urgent = days<=30;
                        return (
                          <div key={i.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 20px",borderBottom:"1px solid var(--rule2)"}}>
                            <div style={{width:34,height:34,background:urgent?"#FEF9C3":c.color+"18",border:`1px solid ${urgent?"#FCD34D":c.color+"40"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{c.icon}</div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:14,fontWeight:600}}>{i.name}</div>
                              <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--ink5)"}}>{i.maturityDate}</div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontFamily:"var(--fm)",fontSize:12,color:urgent?"#92400E":"var(--ink3)"}}>{days}d</div>
                              <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--ink5)"}}>{fmtCcy(i.principal,ccy)}</div>
                            </div>
                          </div>
                        );
                      })}
                    {investments.filter(i=>i.maturityDate&&new Date(i.maturityDate)>new Date()).length===0&&
                      <div className="empty" style={{padding:24}}><div className="empty-text" style={{fontSize:16}}>No upcoming maturities</div></div>}
                  </div>
                </div>

                {/* Interest rates */}
                <div className="section">
                  <div className="section-head"><div className="section-title">Interest <em>Rates</em></div></div>
                  <table className="ledger">
                    <thead><tr><th>Instrument</th><th className="right">Principal</th><th className="right">Rate</th><th className="right">Est. Gain</th></tr></thead>
                    <tbody>
                      {investments.filter(i=>parseFloat(i.rate)>0).sort((a,b)=>parseFloat(b.rate)-parseFloat(a.rate)).map(i=>{
                        const p = parseFloat(i.principal)||0, r = parseFloat(i.rate)||0;
                        let est = p;
                        if (i.maturityDate) {
                          const d = daysBetween(i.startDate||new Date().toISOString().slice(0,10),i.maturityDate);
                          if (d>0) est = maturityVal(p,r,d);
                        }
                        return (
                          <tr key={i.id}>
                            <td style={{fontSize:13,fontWeight:600}}>{i.name}</td>
                            <td className="right mono">{fmtCcy(p,ccy)}</td>
                            <td className="right mono pos">{r}%</td>
                            <td className="right mono pos">+{fmtCcy(est-p,ccy)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {investments.filter(i=>parseFloat(i.rate)>0).length===0&&
                    <div className="empty" style={{padding:20}}><div className="empty-text" style={{fontSize:15}}>No interest-bearing entries</div></div>}
                </div>
              </div>

              {/* Loans outstanding */}
              <div className="section">
                <div className="section-head">
                  <div className="section-title">Loans <em>Outstanding</em></div>
                  <span style={{fontFamily:"var(--fm)",fontSize:13,color:"var(--copper)"}}>
                    {fmtCcy(investments.filter(i=>i.cat==="loan").reduce((s,i)=>s+(parseFloat(i.principal)||0),0),ccy)} total
                  </span>
                </div>
                <table className="ledger">
                  <thead><tr><th>Borrower</th><th className="right">Amount</th><th>Given On</th><th>Due By</th><th>Status</th><th>Notes</th></tr></thead>
                  <tbody>
                    {investments.filter(i=>i.cat==="loan").map(i=>{
                      const due = i.maturityDate ? new Date(i.maturityDate) : null;
                      const overdue = due && due < new Date();
                      return (
                        <tr key={i.id}>
                          <td style={{fontWeight:600}}>{i.name}</td>
                          <td className="right mono">{fmtCcy(i.principal,ccy)}</td>
                          <td className="mono" style={{fontSize:12}}>{i.startDate||"—"}</td>
                          <td className="mono" style={{fontSize:12,color:overdue?"#C95454":"var(--ink)"}}>{i.maturityDate||"—"}</td>
                          <td><span className="badge" style={{background:overdue?"#FEF2F2":"var(--copper4)",color:overdue?"#C95454":"var(--copper)",border:`1px solid ${overdue?"#FCA5A5":"var(--copper3)"}`}}>{overdue?"Overdue":"Pending"}</span></td>
                          <td style={{fontSize:12,color:"var(--ink4)"}}>{i.notes||"—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {investments.filter(i=>i.cat==="loan").length===0&&<div className="empty" style={{padding:24}}><div className="empty-text" style={{fontSize:16}}>No loans recorded</div></div>}
              </div>
            </>
          )}

        </div>{/* /main */}
      </div>

      {/* ══ ADD/EDIT MODAL ══ */}
      {showAdd && (
        <div className="modal-bg" onClick={e=>{if(e.target.classList.contains("modal-bg")){setShowAdd(false);setEditItem(null)}}}>
          <div className="modal">
            <div className="modal-head">
              <div className="modal-title">{editItem?"Edit Entry":"New Investment Entry"}</div>
              <button className="modal-close" onClick={()=>{setShowAdd(false);setEditItem(null)}}>✕</button>
            </div>

            {!editItem && (
              <>
                <div style={{padding:"14px 24px 0",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--ink5)",textTransform:"uppercase"}}>Select Category</div>
                <div className="cat-grid">
                  {INVEST_CATS.map(c=>(
                    <div key={c.id} className={`cat-tile ${selectedCat===c.id?"selected":""}`} onClick={()=>{setSelectedCat(c.id);setNewItem(p=>({...p,cat:c.id}))}}>
                      <div className="cat-tile-icon">{c.icon}</div>
                      <div className="cat-tile-label">{c.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{height:1,background:"var(--rule)",margin:"0 24px"}}/>
              </>
            )}

            <div className="form-grid">
              <div className="fg form-full">
                <label>Name / Description</label>
                <input placeholder={`e.g. ${selectedCat==="fd"?"SBI 1-Year FD":selectedCat==="loan"?"Loan to Suresh":selectedCat==="gold"?"Gold Coins 10g":"Enter a descriptive name"}`}
                  value={newItem.name} onChange={e=>setNewItem(p=>({...p,name:e.target.value}))}/>
              </div>
              {!["cash","gold","other"].includes(selectedCat)&&(
                <div className="fg">
                  <label>Bank / Institution</label>
                  <input placeholder="e.g. State Bank of India" value={newItem.bank} onChange={e=>setNewItem(p=>({...p,bank:e.target.value}))}/>
                </div>
              )}
              <div className="fg">
                <label>Amount / Principal</label>
                <input type="number" placeholder="500000" value={newItem.principal} onChange={e=>setNewItem(p=>({...p,principal:e.target.value}))}/>
              </div>
              {!["cash","loan","gold","chit","other"].includes(selectedCat)&&(
                <div className="fg">
                  <label>Interest Rate (% p.a.)</label>
                  <input type="number" step="0.01" placeholder="7.1" value={newItem.rate} onChange={e=>setNewItem(p=>({...p,rate:e.target.value}))}/>
                </div>
              )}
              <div className="fg">
                <label>Start Date</label>
                <input type="date" value={newItem.startDate} onChange={e=>setNewItem(p=>({...p,startDate:e.target.value}))}/>
              </div>
              {!["cash","savings","gold","other"].includes(selectedCat)&&(
                <div className="fg">
                  <label>Maturity / Due Date</label>
                  <input type="date" value={newItem.maturityDate} onChange={e=>setNewItem(p=>({...p,maturityDate:e.target.value}))}/>
                </div>
              )}
              <div className="fg">
                <label>Currency</label>
                <select value={newItem.ccy||ccy} onChange={e=>setNewItem(p=>({...p,ccy:e.target.value}))}>
                  {CURRENCIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="fg form-full">
                <label>Notes</label>
                <textarea placeholder="Any additional notes…" value={newItem.notes} onChange={e=>setNewItem(p=>({...p,notes:e.target.value}))}/>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-forest" onClick={saveItem}>{editItem?"Save Changes":"Add Entry"}</button>
              <button className="btn btn-outline" onClick={()=>{setShowAdd(false);setEditItem(null)}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
