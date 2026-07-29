#!/usr/bin/env node
/* Generates email-safe variations of the Michael aurora signature.
   All animation lives in baked GIFs (flip-michael.gif, ic-*.gif) — every
   variation keeps those assets and the #070a14 card bg they were baked on. */
const fs = require('fs');
const path = require('path');

const OUT = '/home/kevin-farias/michael-signatures/michael-variations';
const FONT = `'Helvetica Neue',Helvetica,Arial,sans-serif`;
const BG = '#070a14';

const M = {
  name: 'Michael Ballard',
  role: 'FOUNDER & CEO'.replace('&', '&amp;'),
  phoneUS: { href: 'tel:+19292779018', label: '+1 (929) 277-9018' },
  phoneBR: { href: 'tel:+46703688988', label: '+46 70 368 8988' },
  email: { href: 'mailto:michael@slashdev.io', label: 'michael@slashdev.io' },
  location: 'Seattle, WA &middot; Stockholm, SE',
  site: { href: 'https://slashdev.io', label: 'slashdev.io' },
};

const td = (style, inner, attrs = '') => `<td ${attrs} style="margin:0.1px;${style}">${inner}</td>`;
const tbl = (inner, style = '') => `<table cellpadding="0" cellspacing="0" border="0" style="margin:0.1px;border-collapse:collapse;${style}"><tbody>${inner}</tbody></table>`;
const spacer = (w) => `<td width="${w}" style="margin:0.1px">&nbsp;</td>`;

function avatar(size = 120) {
  return `<img alt="${M.name}" src="assets/flip-michael.gif" width="${size}" height="${size}" style="display:block;border:0">`;
}

function iconRow(icon, inner, { pad = '0 0 9px 0', iconSize = 28, gap = 11 } = {}) {
  return `<tr><td style="margin:0.1px;padding:${pad}">${tbl(`<tr>
    <td width="${iconSize}" valign="middle" style="margin:0.1px"><img alt="" src="assets/ic-line-${icon}.gif" width="${iconSize}" height="${iconSize}" style="display:block;border:0"></td>
    ${spacer(gap)}
    <td valign="middle" style="margin:0.1px">${inner}</td>
  </tr>`)}</td></tr>`;
}

const link = (o, color = '#c3cbdc', extra = '') =>
  `<a href="${o.href}" style="text-decoration:none;color:${color};font-size:14px;font-family:${FONT};${extra}">${o.label}</a>`;
const span = (text, color = '#c3cbdc') =>
  `<span style="color:${color};font-size:14px;font-family:${FONT}">${text}</span>`;

function nameBlock(c, { nameSize = 24, align = 'left' } = {}) {
  return `<tr><td align="${align}" style="margin:0.1px;font-family:${FONT};font-size:${nameSize}px;font-weight:bold;color:#ffffff;line-height:1.1">${M.name}</td></tr>
<tr><td align="${align}" style="margin:0.1px;padding:6px 0 0 0;font-family:${FONT};font-size:11px;font-weight:bold;letter-spacing:3px;color:${c.soft}">${M.role}</td></tr>`;
}

function divider(c, { width = 220, pad = '16px 0 14px 0', segments = null, align = 'left' } = {}) {
  const cells = segments
    ? segments.map(([w, col]) => `<td width="${w}" height="2" bgcolor="${col}" style="background-color:${col};font-size:1px;line-height:1px">&nbsp;</td>`).join('')
    : `<td width="${width}" height="1" bgcolor="${c.accent}" style="background-color:${c.accent};font-size:1px;line-height:1px">&nbsp;</td>`;
  return `<tr><td align="${align}" style="margin:0.1px;padding:${pad}">${tbl(`<tr>${cells}</tr>`)}</td></tr>`;
}

function contactRows(c, opts = {}) {
  return [
    iconRow('phone', link(M.phoneUS), opts),
    iconRow('phone', link(M.phoneBR), opts),
    iconRow('mail', link(M.email, '#ffffff', 'font-weight:bold;'), opts),
    iconRow('pin', span(M.location), { ...opts, pad: opts.lastPad || '0 0 16px 0' }),
  ].join('\n');
}

function logoRow(c, { align = 'left', pad = '0' } = {}) {
  return `<tr><td align="${align}" style="margin:0.1px;padding:${pad}">${tbl(`<tr>
    <td valign="middle" style="margin:0.1px"><img alt="slashdev" src="assets/logo-white.png" width="64" style="display:block;border:0"></td>
    ${spacer(10)}
    <td valign="middle" style="margin:0.1px">${link(M.site, '#727b91', 'font-size:13px;')}</td>
  </tr>`)}</td></tr>`;
}

/* Card wrapper: dark rounded td; optional 1px accent frame */
function card(inner, { pad = '30px 34px', frame = null, radius = 16 } = {}) {
  const core = `<table cellpadding="0" cellspacing="0" border="0" style="margin:0.1px;border-collapse:collapse;font-family:${FONT}"><tbody><tr>
<td align="left" valign="top" bgcolor="${BG}" style="margin:0.1px;background-color:${BG};padding:${pad};border-radius:${radius}px">
${inner}
</td>
</tr></tbody></table>`;
  if (!frame) return core;
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:0.1px;border-collapse:collapse"><tbody><tr>
<td bgcolor="${frame}" style="margin:0.1px;background-color:${frame};padding:1px;border-radius:${radius + 1}px">
${core}
</td>
</tr></tbody></table>`;
}

/* ---------- layouts ---------- */

function layoutClassic(c, o = {}) {
  const infoRows = [
    nameBlock(c),
    o.divider !== false ? divider(c, o.dividerOpts || {}) : `<tr><td height="16" style="margin:0.1px;font-size:1px;line-height:1px">&nbsp;</td></tr>`,
    contactRows(c, o.contactOpts || {}),
    logoRow(c),
  ].join('\n');
  const avatarTd = td('', avatar(o.avatarSize || 120), 'align="left" valign="top"');
  const infoTd = td('', tbl(infoRows), 'align="left" valign="middle"');
  const gap = spacer(o.gap || 28);
  const middle = o.rule
    ? `${spacer(24)}<td width="2" bgcolor="${c.accent}" style="margin:0.1px;background-color:${c.accent};font-size:1px;line-height:1px">&nbsp;</td>${spacer(24)}`
    : gap;
  const cells = o.avatarRight ? `${infoTd}${middle}${avatarTd}` : `${avatarTd}${middle}${infoTd}`;
  return card(tbl(`<tr>${cells}</tr>`), o.card || {});
}

function layoutStacked(c, o = {}) {
  const rows = [
    `<tr><td align="center" style="margin:0.1px;padding:0 0 16px 0">${avatar(o.avatarSize || 120)}</td></tr>`,
    nameBlock(c, { align: 'center' }),
    divider(c, { width: 180, align: 'center', ...(o.dividerOpts || {}) }),
    `<tr><td align="center" style="margin:0.1px">${tbl(contactRows(c, o.contactOpts || {}))}</td></tr>`,
    logoRow(c, { align: 'center', pad: '4px 0 0 0' }),
  ].join('\n');
  return card(`<table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0.1px;border-collapse:collapse"><tbody>${rows}</tbody></table>`, { pad: '30px 44px', ...(o.card || {}) });
}

function layoutWide(c, o = {}) {
  const colLeft = tbl([iconRow('phone', link(M.phoneUS)), iconRow('phone', link(M.phoneBR), { pad: '0' })].join(''));
  const colRight = tbl([iconRow('mail', link(M.email, '#ffffff', 'font-weight:bold;')), iconRow('pin', span(M.location), { pad: '0' })].join(''));
  const infoRows = [
    nameBlock(c),
    divider(c, { width: 300, ...(o.dividerOpts || {}) }),
    `<tr><td style="margin:0.1px;padding:0 0 16px 0">${tbl(`<tr>${td('', colLeft, 'valign="top"')}${spacer(30)}${td('', colRight, 'valign="top"')}</tr>`)}</td></tr>`,
    logoRow(c),
  ].join('\n');
  return card(tbl(`<tr>${td('', avatar(120), 'align="left" valign="middle"')}${spacer(30)}${td('', tbl(infoRows), 'align="left" valign="middle"')}</tr>`), o.card || {});
}

function layoutBadge(c, o = {}) {
  const badge = `<tr><td style="margin:0.1px;padding:8px 0 0 0">${tbl(`<tr><td bgcolor="${c.accent}" style="margin:0.1px;background-color:${c.accent};padding:4px 12px;border-radius:999px;font-family:${FONT};font-size:10px;font-weight:bold;letter-spacing:3px;color:#ffffff">${M.role}</td></tr>`)}</td></tr>`;
  const infoRows = [
    `<tr><td style="margin:0.1px;font-family:${FONT};font-size:24px;font-weight:bold;color:#ffffff;line-height:1.1">${M.name}</td></tr>`,
    badge,
    `<tr><td style="margin:0.1px;padding:16px 0 0 0"></td></tr>`,
    contactRows(c),
    logoRow(c),
  ].join('\n');
  return card(tbl(`<tr>${td('', avatar(120), 'align="left" valign="top"')}${spacer(28)}${td('', tbl(infoRows), 'align="left" valign="middle"')}</tr>`), o.card || {});
}

/* ---------- palettes ---------- */
const BLUE = { accent: '#215ff6', soft: '#5b8bff' };
const CYAN = { accent: '#06b6d4', soft: '#67e8f9' };
const VIOLET = { accent: '#7c3aed', soft: '#b79cff' };
const AMBER = { accent: '#f59e0b', soft: '#fbbf24' };
const EMERALD = { accent: '#10b981', soft: '#5eead4' };
const ROSE = { accent: '#f43f5e', soft: '#fda4af' };

/* ---------- variations ---------- */
const variations = [
  { file: '01-classic-blue', title: 'Classic Blue', desc: 'The original aurora layout — avatar left, electric-blue rule, stacked contacts.',
    html: c => layoutClassic(c), c: BLUE },
  { file: '02-gradient-rule', title: 'Gradient Rule', desc: 'Classic layout with a blue&rarr;cyan segmented gradient divider, 2px.',
    html: c => layoutClassic(c, { dividerOpts: { segments: [[70, '#215ff6'], [60, '#3b82f6'], [50, '#22d3ee'], [40, '#67e8f9']] } }), c: BLUE },
  { file: '03-avatar-right', title: 'Avatar Right', desc: 'Mirrored composition — identity and contacts first, flipping portrait on the right.',
    html: c => layoutClassic(c, { avatarRight: true }), c: BLUE },
  { file: '04-stacked-center', title: 'Stacked Center', desc: 'Vertical business-card format — everything centered under the portrait.',
    html: c => layoutStacked(c), c: BLUE },
  { file: '05-split-rule', title: 'Split Rule', desc: 'A vertical 2px accent bar separates the portrait from the info column.',
    html: c => layoutClassic(c, { rule: true, divider: false, contactOpts: {} }), c: BLUE },
  { file: '06-framed', title: 'Framed', desc: 'The whole card wrapped in a 1px electric-blue frame.',
    html: c => layoutClassic(c, { card: { frame: '#215ff6' } }), c: BLUE },
  { file: '07-violet', title: 'Violet Aurora', desc: 'Violet accent take — purple rule and role tag.',
    html: c => layoutClassic(c), c: VIOLET },
  { file: '08-cyan', title: 'Cyan Aurora', desc: 'Cyan/teal accent — matches the cool side of the avatar ring.',
    html: c => layoutClassic(c), c: CYAN },
  { file: '09-amber', title: 'Amber Aurora', desc: 'Warm amber accent for contrast against the deep navy card.',
    html: c => layoutClassic(c), c: AMBER },
  { file: '10-compact', title: 'Compact', desc: 'Denser variant — 96px portrait, 30px icons, tighter paddings. Good for reply chains.',
    html: c => layoutClassic(c, { avatarSize: 96, gap: 22, card: { pad: '22px 26px' },
      dividerOpts: { width: 190, pad: '12px 0 10px 0' },
      contactOpts: { iconSize: 24, gap: 9, pad: '0 0 7px 0', lastPad: '0 0 12px 0' } }), c: BLUE },
  { file: '11-wide-banner', title: 'Wide Banner', desc: 'Landscape banner — contacts split into two columns beside the portrait.',
    html: c => layoutWide(c), c: BLUE },
  { file: '12-role-badge', title: 'Role Badge', desc: 'FOUNDER &amp; CEO set in a solid accent pill instead of colored text.',
    html: c => layoutBadge(c), c: BLUE },
];

/* ---------- page shells ---------- */
const ASSET_BASE = 'https://kevinfarias.github.io/michael-signatures/michael-variations/';
const absolutize = (html) => html.replace(/src="assets\//g, `src="${ASSET_BASE}assets/`);

function page(v, sig) {
  sig = absolutize(sig);
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Michael Ballard &mdash; aurora signature &mdash; ${v.title}</title>
<style>body{background:#fff;margin:24px;font-family:Arial,sans-serif}.note{max-width:760px;margin:0 auto 18px;color:#555;font-size:13px;line-height:1.6}.box{max-width:760px;margin:0 auto;border:1px dashed #ccc;padding:22px;border-radius:8px}code{background:#f3f3f3;padding:1px 5px;border-radius:4px}</style></head>
<body>
<div class="note"><b>Aurora &mdash; ${v.title} (email-safe).</b> ${v.desc} All animation is baked into the GIFs (flipping portrait, animated icons); markup is table-based with real clickable text and public image URLs &mdash; copy the block below straight into your email client.</div>
<div class="box">

<!-- ===== SIGNATURE — COPY FROM HERE ===== -->
${sig}
<!-- ===== END ===== -->

</div>
</body></html>
`;
}

function indexPage(vars) {
  const cards = vars.map(v => `
    <div class="card">
      <div class="card-head"><span class="num">${v.file.slice(0, 2)}</span><h2>${v.title}</h2>
        <a class="open" href="${v.file}.html" target="_blank">open&nbsp;&#8599;</a></div>
      <p>${v.desc}</p>
      <div class="frame"><iframe src="${v.file}.html" loading="lazy" title="${v.title}"></iframe></div>
    </div>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Michael Ballard &mdash; aurora signature variations</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#0b0d14;color:#e8ecf5;padding:48px 20px 96px;
  background-image:radial-gradient(900px 500px at 12% -8%,rgba(33,95,246,.18),transparent 60%),radial-gradient(800px 600px at 100% 10%,rgba(91,139,255,.10),transparent 55%)}
.head{max-width:900px;margin:0 auto 16px}
.head h1{font-size:26px;letter-spacing:-.01em}
.head p{color:#8b93a7;margin-top:10px;font-size:14px;line-height:1.6;max-width:760px}
.head code{background:rgba(255,255,255,.08);padding:1px 6px;border-radius:4px;font-size:13px}
.grid{max-width:900px;margin:36px auto 0;display:grid;gap:28px}
.card{border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:20px 22px;background:rgba(255,255,255,.02)}
.card-head{display:flex;align-items:baseline;gap:12px;margin-bottom:6px}
.num{color:#5b8bff;font-weight:700;font-size:13px}
.card h2{font-size:17px}
.open{margin-left:auto;color:#8b93a7;font-size:12px;text-decoration:none;border:1px solid rgba(255,255,255,.14);padding:4px 10px;border-radius:999px}
.open:hover{color:#fff;border-color:#215ff6;background:#215ff6}
.card p{color:#8b93a7;font-size:13px;line-height:1.5;margin-bottom:14px}
.frame{border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.06);background:#fff}
iframe{display:block;width:100%;height:420px;border:0}
</style></head>
<body>
<div class="head">
  <h1>Michael Ballard &mdash; aurora signature variations</h1>
  <p>${vars.length} email-safe variations of the aurora signature. Every one keeps the baked-GIF animations (flipping portrait with glowing ring, pulsing contact icons) on the same <code>#070a14</code> card the GIFs were rendered against &mdash; only layout, accents, dividers and density change. Markup is table-based with inline styles and real clickable text, so it can be pasted straight into an email client.</p>
  <p style="margin-top:8px">To use one in email: open it, copy the block between the <code>SIGNATURE</code> comments, and replace each <code>assets/&hellip;</code> src with the absolute GitHub Pages URL (e.g. <code>https://&lt;user&gt;.github.io/&lt;repo&gt;/michael-variations/assets/flip-michael.gif</code>) &mdash; email clients need public image URLs.</p>
  <p style="margin-top:8px;color:#6b7387">Note: the portrait ring animation is baked blue/cyan; on the violet / amber / emerald / rose accent variants a re-baked ring in the matching hue would complete the look.</p>
</div>
<div class="grid">
${cards}
</div>
</body></html>
`;
}

/* ---------- write ---------- */
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
for (const a of ['flip-michael.gif', 'ic-phone.gif', 'ic-mail.gif', 'ic-pin.gif', 'logo-white.png']) {
  fs.copyFileSync(`/home/kevin-farias/michael-signatures/system/assets/${a}`, path.join(OUT, 'assets', a));
}
for (const v of variations) {
  fs.writeFileSync(path.join(OUT, `${v.file}.html`), page(v, v.html(v.c)));
  console.log('wrote', v.file + '.html');
}
// index.html is owned by build-concepts.js (combined gallery) — run that after this script.
console.log(variations.length, 'layout variations written');
