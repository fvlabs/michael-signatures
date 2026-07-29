/* Builds the concept signature pages (c01–c12) and regenerates index.html.
   Each concept carries its own baked animation (see src/concepts/ + bake-concepts.js).
   Run: node src/build-concepts.js */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..');
const FONT = `'Helvetica Neue',Helvetica,Arial,sans-serif`;
const BG = '#070a14';

const M = {
  name: 'Michael Ballard',
  role: 'FOUNDER &amp; CEO',
  phoneUS: { href: 'tel:+19292779018', label: '+1 (929) 277-9018' },
  phoneBR: { href: 'tel:+46703688988', label: '+46 70 368 8988' },
  email: { href: 'mailto:michael@slashdev.io', label: 'michael@slashdev.io' },
  location: 'Seattle, WA &middot; Stockholm, SE',
  site: { href: 'https://slashdev.io', label: 'slashdev.io' },
};

const tbl = (inner, extra = '') => `<table cellpadding="0" cellspacing="0" border="0" ${extra} style="margin:0.1px;border-collapse:collapse"><tbody>${inner}</tbody></table>`;
const spacer = (w) => `<td width="${w}" style="margin:0.1px">&nbsp;</td>`;
const link = (o, color = '#c3cbdc', extra = '') =>
  `<a href="${o.href}" style="text-decoration:none;color:${color};font-size:14px;font-family:${FONT};${extra}">${o.label}</a>`;
const span = (text, color = '#c3cbdc') => `<span style="color:${color};font-size:14px;font-family:${FONT}">${text}</span>`;

function iconRow(src, inner, pad = '0 0 9px 0') {
  return `<tr><td style="margin:0.1px;padding:${pad}">${tbl(`<tr>
    <td width="28" valign="middle" style="margin:0.1px"><img alt="" src="${src}" width="28" height="28" style="display:block;border:0"></td>
    ${spacer(11)}
    <td valign="middle" style="margin:0.1px">${inner}</td>
  </tr>`)}</td></tr>`;
}

function contacts(iconSet = 'line') {
  const ic = (n) => `assets/ic-${iconSet}-${n}.gif`;
  return [
    iconRow(ic('phone'), link(M.phoneUS)),
    iconRow(ic('phone'), link(M.phoneBR)),
    iconRow(ic('mail'), link(M.email, '#ffffff', 'font-weight:bold;')),
    iconRow(ic('pin'), span(M.location), '0 0 16px 0'),
  ].join('\n');
}

const logoRow = `<tr><td style="margin:0.1px">${tbl(`<tr>
  <td valign="middle" style="margin:0.1px"><img alt="slashdev" src="assets/logo-white.png" width="64" style="display:block;border:0"></td>
  ${spacer(10)}
  <td valign="middle" style="margin:0.1px">${link(M.site, '#727b91', 'font-size:13px;')}</td>
</tr>`)}</td></tr>`;

const nameText = (soft) => `<tr><td style="margin:0.1px;font-family:${FONT};font-size:24px;font-weight:bold;color:#ffffff;line-height:1.1">${M.name}</td></tr>
<tr><td style="margin:0.1px;padding:6px 0 0 0;font-family:${FONT};font-size:11px;font-weight:bold;letter-spacing:3px;color:${soft}">${M.role}</td></tr>`;

const roleOnly = (soft) => `<tr><td style="margin:0.1px;padding:6px 0 0 0;font-family:${FONT};font-size:11px;font-weight:bold;letter-spacing:3px;color:${soft}">${M.role}</td></tr>`;

const rule = (accent, w = 220) => `<tr><td style="margin:0.1px;padding:16px 0 14px 0">${tbl(`<tr><td width="${w}" height="1" bgcolor="${accent}" style="background-color:${accent};font-size:1px;line-height:1px">&nbsp;</td></tr>`)}</td></tr>`;

function card(inner, pad = '30px 34px') {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:0.1px;border-collapse:collapse;font-family:${FONT}"><tbody><tr>
<td align="left" valign="top" bgcolor="${BG}" style="margin:0.1px;background-color:${BG};padding:${pad};border-radius:16px">
${inner}
</td>
</tr></tbody></table>`;
}

/* two-column card: avatar | info rows */
function twoCol(avatarSrc, infoRows, { avatarW = 120, avatarH = 120 } = {}) {
  return tbl(`<tr>
    <td align="left" valign="top" style="margin:0.1px"><img alt="${M.name}" src="${avatarSrc}" width="${avatarW}" height="${avatarH}" style="display:block;border:0"></td>
    ${spacer(28)}
    <td align="left" valign="middle" style="margin:0.1px">${tbl(infoRows)}</td>
  </tr>`);
}

const STATIC_AVATAR = 'assets/avatar-michael.png';

/* ---------- concepts ---------- */
const concepts = [
  { file: 'c01-orbit', title: 'Orbit', anim: 'A comet with a fading trail orbits the portrait on a thin track.',
    body: () => card(twoCol('assets/avatar-orbit.gif', [nameText('#67e8f9'), rule('#215ff6'), contacts(), logoRow].join(''))) },

  { file: 'c02-radar', title: 'Radar Pulse', anim: 'Sonar rings ripple outward from the portrait and dissolve.',
    body: () => card(twoCol('assets/avatar-radar.gif', [nameText('#5b8bff'), rule('#215ff6'), contacts(), logoRow].join(''))) },

  { file: 'c03-ring-spin', title: 'Ring Spin', anim: 'The aurora conic-gradient ring rotates continuously around a steady portrait.',
    body: () => card(twoCol('assets/avatar-spin.gif', [nameText('#5b8bff'), rule('#215ff6'), contacts(), logoRow].join(''))) },

  { file: 'c04-typewriter', title: 'Typewriter', anim: 'The name types itself out with a blinking caret, then resets.',
    body: () => card(twoCol(STATIC_AVATAR, [
      `<tr><td style="margin:0.1px"><img alt="${M.name}" src="assets/name-type.gif" width="250" height="34" style="display:block;border:0"></td></tr>`,
      roleOnly('#5b8bff'), rule('#215ff6'), contacts(), logoRow].join(''))) },

  { file: 'c05-comet-rule', title: 'Comet Rule', anim: 'The divider is a live gradient stream — blue, violet and cyan flowing left to right.',
    body: () => card(twoCol(STATIC_AVATAR, [nameText('#5b8bff'),
      `<tr><td style="margin:0.1px;padding:16px 0 14px 0"><img alt="" src="assets/flow-rule.gif" width="220" height="10" style="display:block;border:0"></td></tr>`,
      contacts(), logoRow].join(''))) },

  { file: 'c06-signature-draw', title: 'Signature Draw', anim: 'A hand-drawn underline sketches itself beneath the name, holds, and fades.',
    body: () => card(twoCol(STATIC_AVATAR, [nameText('#5b8bff'),
      `<tr><td style="margin:0.1px;padding:12px 0 12px 0"><img alt="" src="assets/draw-rule.gif" width="220" height="14" style="display:block;border:0"></td></tr>`,
      contacts(), logoRow].join(''))) },

  { file: 'c07-neon-icons', title: 'Neon Icons', anim: 'The contact icons breathe neon — glowing up to bright cyan and settling back.',
    body: () => card(twoCol(STATIC_AVATAR, [nameText('#67e8f9'), rule('#06b6d4'), contacts('neon'), logoRow].join(''))) },

  { file: 'c08-wave', title: 'Hello Wave', anim: 'A hand waves hello next to the name every couple of seconds.',
    body: () => card(twoCol(STATIC_AVATAR, [
      `<tr><td style="margin:0.1px">${tbl(`<tr>
        <td valign="middle" style="margin:0.1px;font-family:${FONT};font-size:24px;font-weight:bold;color:#ffffff;line-height:1.1">${M.name}</td>
        ${spacer(10)}
        <td valign="middle" style="margin:0.1px"><img alt="" src="assets/wave.gif" width="36" height="36" style="display:block;border:0"></td>
      </tr>`)}</td></tr>`,
      roleOnly('#5b8bff'), rule('#215ff6'), contacts(), logoRow].join(''))) },
];

/* ---------- previous layout/accent set (kept, listed second in the gallery) ---------- */
const layoutSet = [
  ['01-classic-blue', 'Classic Blue'], ['02-gradient-rule', 'Gradient Rule'], ['03-avatar-right', 'Avatar Right'],
  ['04-stacked-center', 'Stacked Center'], ['05-split-rule', 'Split Rule'], ['06-framed', 'Framed'],
  ['07-violet', 'Violet Aurora'], ['08-cyan', 'Cyan Aurora'], ['09-amber', 'Amber Aurora'],
  ['10-compact', 'Compact'], ['11-wide-banner', 'Wide Banner'], ['12-role-badge', 'Role Badge'],
];

/* ---------- page shells ---------- */
/* absolute asset URLs inside signature markup so copied blocks work in email clients */
const ASSET_BASE = 'https://fvlabs.github.io/michael-signatures/michael-variations/';
const absolutize = (html) => html.replace(/src="assets\//g, `src="${ASSET_BASE}assets/`);

function page(v) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Michael Ballard &mdash; ${v.title} signature</title>
<style>body{background:#fff;margin:24px;font-family:Arial,sans-serif}.note{max-width:760px;margin:0 auto 18px;color:#555;font-size:13px;line-height:1.6}.box{max-width:760px;margin:0 auto;border:1px dashed #ccc;padding:22px;border-radius:8px}code{background:#f3f3f3;padding:1px 5px;border-radius:4px}</style></head>
<body>
<div class="note"><b>Aurora concept &mdash; ${v.title} (email-safe).</b> ${v.anim} The animation is baked into a looping GIF; markup is table-based with real clickable text and public image URLs &mdash; copy the block below straight into your email client.</div>
<div class="box">

<!-- ===== SIGNATURE — COPY FROM HERE ===== -->
${absolutize(v.body())}
<!-- ===== END ===== -->

</div>
</body></html>
`;
}

function indexPage(prefix = '', extraSection = '') {
  const cardHtml = (file, title, desc, tall) => `
    <div class="card">
      <div class="card-head"><span class="num">${file.replace(/-(.*)/, '')}</span><h2>${title}</h2>
        <a class="open" href="${prefix}${file}.html" target="_blank">open&nbsp;&#8599;</a></div>
      ${desc ? `<p>${desc}</p>` : ''}
      <div class="frame"><iframe src="${prefix}${file}.html" loading="lazy" title="${title}" style="height:${tall}px"></iframe></div>
    </div>`;
  const conceptCards = concepts.map(v => cardHtml(v.file, v.title, v.anim, 460)).join('\n');
  const layoutCards = layoutSet.map(([f, t]) => cardHtml(f, t, '', 440)).join('\n');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Michael Ballard &mdash; aurora signature lab</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#0b0d14;color:#e8ecf5;padding:48px 20px 96px;
  background-image:radial-gradient(900px 500px at 12% -8%,rgba(33,95,246,.18),transparent 60%),radial-gradient(800px 600px at 100% 10%,rgba(91,139,255,.10),transparent 55%)}
.head{max-width:900px;margin:0 auto 16px}
.head h1{font-size:26px;letter-spacing:-.01em}
.head p{color:#8b93a7;margin-top:10px;font-size:14px;line-height:1.6;max-width:760px}
.head code{background:rgba(255,255,255,.08);padding:1px 6px;border-radius:4px;font-size:13px}
h2.sect{max-width:900px;margin:56px auto 6px;font-size:20px}
p.sect-sub{max-width:900px;margin:0 auto;color:#8b93a7;font-size:13px;line-height:1.5}
.grid{max-width:900px;margin:24px auto 0;display:grid;gap:28px}
.card{border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:20px 22px;background:rgba(255,255,255,.02)}
.card-head{display:flex;align-items:baseline;gap:12px;margin-bottom:6px}
.num{color:#5b8bff;font-weight:700;font-size:13px;text-transform:uppercase}
.card h2{font-size:17px}
.open{margin-left:auto;color:#8b93a7;font-size:12px;text-decoration:none;border:1px solid rgba(255,255,255,.14);padding:4px 10px;border-radius:999px}
.open:hover{color:#fff;border-color:#215ff6;background:#215ff6}
.card p{color:#8b93a7;font-size:13px;line-height:1.5;margin-bottom:14px}
.frame{border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.06);background:#fff}
iframe{display:block;width:100%;border:0}
</style></head>
<body>
<div class="head">
  <h1>Michael Ballard &mdash; aurora signature lab</h1>
  <p>Email-safe signatures with animation baked into looping GIFs (email clients can't run CSS animation, but they all play GIFs). Markup is table-based with inline styles and real clickable text. Every card keeps the <code>#070a14</code> background the GIFs were rendered against.</p>
  <p style="margin-top:8px">To use one in email: open it and copy the block between the <code>SIGNATURE</code> comments &mdash; image srcs already point to the public GitHub Pages URLs, so it works as-is in Gmail, Apple Mail, etc.</p>
</div>

<h2 class="sect">Animation concepts</h2>
<p class="sect-sub">${concepts.length} different animation ideas &mdash; each one is a distinct baked GIF: orbiting comet, radar pulse, spinning ring, typewriter, flowing rule, self-drawing underline, neon icons, waving hand.</p>
<div class="grid">
${conceptCards}
</div>

<h2 class="sect">Layout &amp; accent variations</h2>
<p class="sect-sub">The earlier set &mdash; same flip/pulse animations as the original, varying layout, accent color, framing and density.</p>
<div class="grid">
${layoutCards}
</div>
${extraSection}
</body></html>
`;
}

/* ---------- write ---------- */
for (const v of concepts) {
  fs.writeFileSync(path.join(OUT, `${v.file}.html`), page(v));
  console.log('wrote', v.file + '.html');
}
fs.writeFileSync(path.join(OUT, 'index.html'), indexPage());
console.log('wrote index.html');

/* repo-root index for GitHub Pages: same gallery, paths prefixed, plus links to older experiments */
const legacy = `
<h2 class="sect">Other experiments</h2>
<p class="sect-sub">Earlier explorations kept for reference &mdash; these use live CSS animation (browser preview only, not email-safe).</p>
<div class="grid">
  <div class="card"><div class="card-head"><h2>Live CSS demos</h2><a class="open" href="live-demos.html" target="_blank">open&nbsp;&#8599;</a></div>
    <p>The original in-browser signature variations (aurora/glass and others).</p></div>
  <div class="card"><div class="card-head"><h2>Aurora bold animations</h2><a class="open" href="aurora-variations.html" target="_blank">open&nbsp;&#8599;</a></div>
    <p>Three bold live-animation takes on the aurora card.</p></div>
  <div class="card"><div class="card-head"><h2>Michael Ballard signatures</h2><a class="open" href="Michael-Ballard-signatures.html" target="_blank">open&nbsp;&#8599;</a></div>
    <p>Earlier signature drafts.</p></div>
</div>`;
fs.writeFileSync(path.join(OUT, '..', 'index.html'), indexPage('michael-variations/', legacy));
console.log('wrote ../index.html (repo root)');
