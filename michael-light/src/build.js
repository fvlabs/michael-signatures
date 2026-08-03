#!/usr/bin/env node
/* Light-theme "panel card" signatures — the customesignature.com layout idea
   (bordered rounded panels, animated social column, verified name, circular
   portrait) rebuilt on the slashdev brand.

   All motion is baked into looping GIFs rendered on #ffffff (see src/bake.js),
   so every card here MUST stay on a white background or the GIF rectangles
   show as boxes. Markup is table-based with inline styles and real clickable
   text, so it survives Gmail / Outlook / Apple Mail.

   Run: node src/build.js */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..');
const FONT = `Inter,'Helvetica Neue',Helvetica,Arial,sans-serif`;

/* absolute URLs so a copied block renders inside an email client */
const ASSET_BASE = 'https://fvlabs.github.io/michael-signatures/michael-light/';
const absolutize = (html) => html.replace(/src="assets\//g, `src="${ASSET_BASE}assets/`);

const C = {
  border: '#e4e4e7',   // panel hairline
  ink: '#09090b',      // name / strong text
  body: '#3f3f46',     // regular text
  muted: '#71717a',    // secondary text
  accent: '#215ff6',   // slashdev blue
  rule: '#ececef',     // inner divider
};

const M = {
  name: 'Michael Ballard',
  role: 'Founder &amp; CEO',
  company: 'Slashdev',
  phoneUS: { href: 'tel:+19292779018', label: '+1 (929) 277-9018' },
  phoneSE: { href: 'tel:+46703688988', label: '+46 70 368 8988' },
  email: { href: 'mailto:michael@slashdev.io', label: 'michael@slashdev.io' },
  location: 'Seattle, WA &middot; Stockholm, SE',
  site: { href: 'https://slashdev.io', label: 'slashdev.io' },
};

/* TODO: swap in Michael's real profile URLs — these all point at slashdev.io
   for now so nothing in a shipped signature is a dead link. */
const SOCIALS = [
  { key: 'web', alt: 'slashdev.io', href: 'https://slashdev.io' },
  { key: 'linkedin', alt: 'LinkedIn', href: 'https://slashdev.io' },
  { key: 'x', alt: 'X', href: 'https://slashdev.io' },
  { key: 'github', alt: 'GitHub', href: 'https://slashdev.io' },
];

/* ---------- primitives ---------- */
const tbl = (inner, extra = '') =>
  `<table cellpadding="0" cellspacing="0" border="0" ${extra} style="margin:0.1px;border-collapse:collapse"><tbody>${inner}</tbody></table>`;
const spacer = (w) => `<td width="${w}" style="margin:0.1px;line-height:1px;font-size:1px">&nbsp;</td>`;
const img = (src, w, h, alt = '', extra = '') =>
  `<img alt="${alt}" src="${src}" width="${w}" height="${h}" style="margin:0.1px;padding:0;border:0;display:block;max-width:100%;${extra}">`;

const text = (t, { size = 12, color = C.body, weight = 'normal', extra = '' } = {}) =>
  `<span style="margin:0;padding:0;border:0;font-family:${FONT};font-size:${size}px;font-weight:${weight};color:${color};${extra}">${t}</span>`;
const link = (o, { size = 12, color = C.body, weight = 'normal', extra = '' } = {}) =>
  `<a href="${o.href}" target="_blank" style="margin:0;padding:0;border:0;text-decoration:none;font-family:${FONT};font-size:${size}px;font-weight:${weight};color:${color};${extra}">${o.label}</a>`;

const row = (inner, pad = '0') => `<tr><td style="margin:0.1px;padding:${pad};line-height:17px">${inner}</td></tr>`;

const panel = (inner, pad = '15px', valign = 'top') =>
  `<td valign="${valign}" align="left" bgcolor="#ffffff" style="margin:0.1px;padding:${pad};background-color:#ffffff;border:1px solid ${C.border};border-collapse:separate;border-radius:6px">${inner}</td>`;

const logo = (w = 96) => img('assets/logo-shine.gif', w, Math.round(w * 62 / 96), 'slashdev');
const avatar = (w = 132) => img('assets/avatar-ring.gif', w, w, M.name, 'border-radius:200px');

/* name + animated verified tick */
const nameRow = (size = 16) => tbl(`<tr>
  <td align="left" valign="middle" style="margin:0.1px">${text(M.name, { size, color: C.ink, weight: 'bold' })}</td>
  ${spacer(6)}
  <td align="left" valign="middle" style="margin:0.1px">${img('assets/badge-verified.gif', 16, 16, 'verified')}</td>
</tr>`);

/* social icons stacked in a column (reference layout) */
const socialColumn = () => tbl(SOCIALS.map((s, i) => `<tr><td style="margin:0.1px;padding:${i ? '7px' : '0'} 0 0 0">
  <a href="${s.href}" target="_blank" style="margin:0;padding:0;border:0;text-decoration:none">${img(`assets/ic-${s.key}.gif`, 24, 24, s.alt)}</a>
</td></tr>`).join(''));

/* social icons in a horizontal strip */
const socialRow = (gap = 10) => tbl(`<tr>${SOCIALS.map((s, i) => `
  ${i ? spacer(gap) : ''}
  <td valign="middle" style="margin:0.1px"><a href="${s.href}" target="_blank" style="margin:0;padding:0;border:0;text-decoration:none">${img(`assets/ic-${s.key}.gif`, 24, 24, s.alt)}</a></td>`).join('')}</tr>`);

const hairline = (w = 300, pad = '12px 0 12px 0') =>
  `<tr><td style="margin:0.1px;padding:${pad}">${tbl(`<tr><td width="${w}" height="1" bgcolor="${C.rule}" style="background-color:${C.rule};font-size:1px;line-height:1px">&nbsp;</td></tr>`)}</td></tr>`;

/* the identity + contact stack used inside every layout */
function details({ withLogo = true, nameSize = 16, showLocation = true } = {}) {
  return [
    withLogo ? row(logo(), '0 0 12px 0') : '',
    row(nameRow(nameSize)),
    row(text(M.role, { color: C.body }), '3px 0 0 0'),
    row(text(M.company, { weight: 'bold', color: C.ink }), '1px 0 0 0'),
    row(link(M.phoneUS), '8px 0 0 0'),
    row(link(M.phoneSE), '1px 0 0 0'),
    row(link(M.email, { weight: 'bold', color: C.ink })),
    showLocation ? row(text(M.location, { size: 11, color: C.muted }), '4px 0 0 0') : '',
  ].join('');
}

/* outer wrapper — resets Gmail's inherited styles the way the reference does */
const wrap = (inner) => `<table cellpadding="0" cellspacing="0" border="0" style="margin:0.1px;padding:0;border:0;text-indent:0;border-collapse:collapse;color:${C.body};font-size:10px;font-family:${FONT}"><tbody><tr><td style="margin:0.1px;padding:0;border:0;line-height:16px">${inner}</td></tr></tbody></table>`;

/* ---------- layouts ---------- */
const variants = [
  {
    file: 'L1-two-panel',
    title: 'Two Panel',
    desc: 'Closest to the reference: a slim bordered panel holding the animated social column, a gap, then the main panel with the shining logo, verified name, contacts and the ring portrait.',
    body: () => wrap(tbl(`<tr>
      ${panel(socialColumn(), '10px 8px')}
      ${spacer(8)}
      ${panel(tbl(`<tr>
        <td align="left" valign="top" style="margin:0.1px">${tbl(details())}</td>
        <td align="left" valign="middle" style="margin:0.1px;padding:0 0 0 18px">${avatar(132)}</td>
      </tr>`), '15px')}
    </tr>`)),
  },
  {
    file: 'L2-single-card',
    title: 'Single Card',
    desc: 'One bordered card. Portrait on the left, details on the right, and the social icons on a horizontal strip below a hairline.',
    body: () => wrap(tbl(`<tr>${panel(tbl(`<tr>
      <td align="left" valign="middle" style="margin:0.1px">${avatar(120)}</td>
      ${spacer(20)}
      <td align="left" valign="middle" style="margin:0.1px">${tbl([
        details({ withLogo: false, nameSize: 18 }),
        hairline(260, '12px 0 11px 0'),
        `<tr><td style="margin:0.1px">${tbl(`<tr>
          <td valign="middle" style="margin:0.1px">${socialRow(9)}</td>
          ${spacer(14)}
          <td valign="middle" style="margin:0.1px">${logo(72)}</td>
        </tr>`)}</td></tr>`,
      ].join(''))}</td>
    </tr>`), '18px 20px')}</tr>`)),
  },
  {
    file: 'L3-borderless',
    title: 'Borderless',
    desc: 'Same content with the frames removed — a single blue accent rule instead of panels. Lighter in a long thread, and the least likely to clash with a quoted reply.',
    body: () => wrap(tbl(`<tr>
      <td width="3" bgcolor="${C.accent}" style="margin:0.1px;background-color:${C.accent};font-size:1px;line-height:1px;border-radius:2px">&nbsp;</td>
      ${spacer(16)}
      <td align="left" valign="middle" style="margin:0.1px">${tbl([
        details({ withLogo: false, nameSize: 18 }),
        row(socialRow(9), '12px 0 0 0'),
      ].join(''))}</td>
      <td align="left" valign="middle" style="margin:0.1px;padding:0 0 0 22px">${avatar(120)}</td>
    </tr>`)),
  },
  {
    file: 'L4-compact',
    title: 'Compact',
    desc: 'A one-panel strip for replies: small portrait, name, role and email only, with the social icons on the right edge.',
    body: () => wrap(tbl(`<tr>${panel(tbl(`<tr>
      <td align="left" valign="middle" style="margin:0.1px">${avatar(64)}</td>
      ${spacer(14)}
      <td align="left" valign="middle" style="margin:0.1px">${tbl([
        row(nameRow(15)),
        row(`${text(M.role, { size: 11, color: C.muted })} ${text('&middot;', { size: 11, color: C.muted })} ${text(M.company, { size: 11, color: C.muted, weight: 'bold' })}`, '2px 0 0 0'),
        row(link(M.email, { size: 11, weight: 'bold', color: C.ink }), '3px 0 0 0'),
      ].join(''))}</td>
      ${spacer(22)}
      <td align="right" valign="middle" style="margin:0.1px">${socialRow(8)}</td>
    </tr>`), '12px 14px', 'middle')}</tr>`)),
  },
];

/* ---------- pages ---------- */
function page(v) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Michael Ballard &mdash; ${v.title} signature</title>
<style>body{background:#fff;margin:24px;font-family:${FONT}}.note{max-width:820px;margin:0 auto 18px;color:#52525b;font-size:13px;line-height:1.6}.box{max-width:820px;margin:0 auto;border:1px dashed #d4d4d8;padding:26px;border-radius:10px}code{background:#f4f4f5;padding:1px 5px;border-radius:4px}</style></head>
<body>
<div class="note"><b>Light panel signature &mdash; ${v.title} (email-safe).</b> ${v.desc} Animation is baked into looping GIFs rendered on white; the phone, email and social links are real clickable links. Copy the block between the comments straight into Gmail.</div>
<div class="box">

<!-- ===== SIGNATURE — COPY FROM HERE ===== -->
${absolutize(v.body())}
<!-- ===== END ===== -->

</div>
</body></html>
`;
}

function indexPage(prefix = '') {
  const cards = variants.map(v => `
    <div class="card">
      <div class="card-head"><span class="num">${v.file.split('-')[0]}</span><h2>${v.title}</h2>
        <a class="open" href="${prefix}${v.file}.html" target="_blank">open&nbsp;&#8599;</a></div>
      <p>${v.desc}</p>
      <div class="frame"><iframe src="${prefix}${v.file}.html" loading="lazy" title="${v.title}" style="height:340px"></iframe></div>
    </div>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Michael Ballard &mdash; light panel signatures</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:${FONT};background:#fafafa;color:#18181b;padding:48px 20px 96px}
.head{max-width:900px;margin:0 auto 8px}
.head h1{font-size:26px;letter-spacing:-.01em}
.head p{color:#52525b;margin-top:10px;font-size:14px;line-height:1.6;max-width:760px}
.head code{background:#f0f0f2;padding:1px 6px;border-radius:4px;font-size:13px}
.grid{max-width:900px;margin:28px auto 0;display:grid;gap:24px}
.card{border:1px solid #e4e4e7;border-radius:14px;padding:20px 22px;background:#fff}
.card-head{display:flex;align-items:baseline;gap:12px;margin-bottom:6px}
.num{color:${C.accent};font-weight:700;font-size:13px;text-transform:uppercase}
.card h2{font-size:17px}
.open{margin-left:auto;color:#71717a;font-size:12px;text-decoration:none;border:1px solid #e4e4e7;padding:4px 10px;border-radius:999px}
.open:hover{color:#fff;border-color:${C.accent};background:${C.accent}}
.card p{color:#52525b;font-size:13px;line-height:1.55;margin-bottom:14px}
.frame{border-radius:10px;overflow:hidden;border:1px solid #f0f0f2;background:#fff}
iframe{display:block;width:100%;border:0}
</style></head>
<body>
<div class="head">
  <h1>Michael Ballard &mdash; light panel signatures</h1>
  <p>The bordered-panel signature idea (animated social column, verified name, circular portrait) rebuilt on the slashdev brand: white card, <code>#215ff6</code> accent, shining <code>/dev</code> mark, rotating portrait ring, and a social column that ripples top-to-bottom.</p>
  <p style="margin-top:8px">Every animation is a baked GIF rendered on white &mdash; email clients can't run CSS, but they all play GIFs. Keep the card background white or the GIF edges show. Open a card and copy the block between the <code>SIGNATURE</code> comments; image URLs are already public.</p>
</div>
<div class="grid">
${cards}
</div>
</body></html>
`;
}

for (const v of variants) {
  fs.writeFileSync(path.join(OUT, `${v.file}.html`), page(v));
  console.log('wrote', v.file + '.html');
}
fs.writeFileSync(path.join(OUT, 'index.html'), indexPage());
console.log('wrote index.html');

/* `node src/build.js --local` also writes preview/ with relative asset paths,
   so the set can be reviewed on disk before the GIFs are live on Pages.
   preview/ is gitignored — the committed pages always carry public URLs. */
if (process.argv.includes('--local')) {
  const P = path.join(OUT, 'preview');
  fs.mkdirSync(P, { recursive: true });
  const localize = (html) => html.split(ASSET_BASE + 'assets/').join('../assets/');
  for (const v of variants) fs.writeFileSync(path.join(P, `${v.file}.html`), localize(page(v)));
  fs.writeFileSync(path.join(P, 'index.html'), indexPage());
  console.log('wrote preview/ (relative asset paths)');
}
