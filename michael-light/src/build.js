#!/usr/bin/env node
/* Michael Ballard's email signature — the bordered-panel layout (animated social
   column, verified name, circular portrait) on the slashdev brand, with the
   awards/reviews strip underneath.

   All motion is baked into looping GIFs rendered on #ffffff (see src/bake.js),
   so the card MUST stay on a white background or the GIF rectangles show as
   boxes. Markup is table-based with inline styles and real clickable text, so
   it survives Gmail / Outlook / Apple Mail.

   Run: node src/build.js            (add --local to also write preview/)

   History: earlier revisions carried three other layouts and four icon sets.
   Kevin picked this one (two-panel + the reference icon files at 24px), so the
   alternatives are gone — see git log if one is ever needed again. The unused
   glyph GIFs stay in assets/ and src/tiles/social.html can rebake them. */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..');
const FONT = `Inter,'Helvetica Neue',Helvetica,Arial,sans-serif`;

/* absolute URLs so a copied block renders inside an email client */
const ASSET_BASE = 'https://fvlabs.github.io/michael-signatures/michael-light/';
const absolutize = (html) => html.replace(/src="assets\//g, `src="${ASSET_BASE}assets/`);

/* #fffffe, not #ffffff: Gmail's mobile dark mode inverts backgrounds it reads as
   pure white, which is what broke dark mode — the card went dark while the GIFs
   (opaque, baked on white) stayed light. One value off pure white is invisible to
   the eye but keeps Gmail's inverter from claiming the element. */
const WHITE = '#fffffe';

const C = {
  border: '#e4e4e7',   // panel hairline
  ink: '#09090b',      // name / strong text
  body: '#3f3f46',     // regular text
  muted: '#71717a',    // secondary text
  accent: '#215ff6',   // slashdev blue
};

/* Social icons are the reference GIFs: 140x128 (web 133x128), shown at width 24
   exactly as the original markup did. Instagram is the company account; the
   ?igsh= share tracker from the app link is stripped — it identifies whoever
   copied the link. Nobody has a Facebook account to point at. */
const ICON = {
  web: (href) => ({ src: 'assets/ic-vendor-web.gif', w: 24, h: 23, alt: 'slashdev.io', href }),
  linkedin: (href) => ({ src: 'assets/ic-vendor-linkedin.gif', w: 24, h: 22, alt: 'LinkedIn', href }),
  instagram: (href) => ({ src: 'assets/ic-vendor-instagram.gif', w: 24, h: 22, alt: 'Instagram', href }),
};

const SITE = 'https://slashdev.io';
const INSTAGRAM = 'https://www.instagram.com/slashdevhq';
const PHONE_US = { href: 'tel:+19292779018', label: '+1 (929) 277-9018' };

const PEOPLE = [
  {
    /* index.html is Michael's — that URL is already out with him, keep it. */
    files: ['index.html', 'L1-two-panel.html'],
    name: 'Michael Ballard',
    role: 'Founder &amp; CEO',
    company: 'Slashdev',
    avatar: 'assets/avatar-ring.gif',
    phones: [PHONE_US, { href: 'tel:+46703688988', label: '+46 70 368 8988' }],
    email: { href: 'mailto:michael@slashdev.io', label: 'michael@slashdev.io' },
    location: 'Seattle, WA &middot; Stockholm, SE',
    socials: [ICON.web(SITE), ICON.linkedin('https://www.linkedin.com/in/mballard23/'), ICON.instagram(INSTAGRAM)],
  },
  {
    /* Kevin's details come from his previous signature (kevin-signature-gmail.html):
       Tech Lead, both numbers, the same office line. Two open questions flagged to
       him: the US number is the same one Michael lists, and the location line says
       Seattle/Stockholm while his mobile is +55. No LinkedIn URL yet, so his icon
       column is web + Instagram until he sends one. */
    files: ['kevin.html'],
    name: 'Kevin Farias',
    role: 'Tech Lead',
    company: 'Slashdev',
    avatar: 'assets/avatar-ring-kevin.gif',
    phones: [PHONE_US, { href: 'tel:+5554999368153', label: '+55 54 99936-8153' }],
    email: { href: 'mailto:kevin@slashdev.io', label: 'kevin@slashdev.io' },
    location: 'Seattle, WA &middot; Stockholm, SE',
    socials: [ICON.web(SITE), ICON.instagram(INSTAGRAM)],
  },
];

/* Awards strip: 1200x491 asset shown at 600x246 — deliberately wider than the
   ~373px card. 600 is where the Clutch sub-scores become comfortably readable
   (~10px), and only 11% of the source image is gap, so there is nothing to win
   back by re-spacing the three blocks. Left-aligned with the card but not the
   same width, which reads fine as a footer banner.
   The Business of Apps badge year was updated 2025 -> 2026. */
const AWARDS = {
  src: 'assets/awards-2026.png', w: 600, h: 246,
  alt: 'Top App Development Company 2026 (Business of Apps) — Clutch 5.0 — Google Reviews 5.0',
  href: 'https://slashdev.io',
};

/* ---------- primitives ---------- */
const tbl = (inner, extra = '') =>
  `<table cellpadding="0" cellspacing="0" border="0" ${extra} style="margin:0.1px;border-collapse:collapse"><tbody>${inner}</tbody></table>`;
const spacer = (w) => `<td width="${w}" style="margin:0.1px;line-height:1px;font-size:1px">&nbsp;</td>`;
const img = (src, w, h, alt = '', extra = '') =>
  `<img alt="${alt}" src="${src}" width="${w}" height="${h}" style="margin:0.1px;padding:0;border:0;display:block;max-width:100%;${extra}">`;

const text = (t, { size = 12, color = C.body, weight = 'normal' } = {}) =>
  `<span style="margin:0;padding:0;border:0;font-family:${FONT};font-size:${size}px;font-weight:${weight};color:${color}">${t}</span>`;
const link = (o, { size = 12, color = C.body, weight = 'normal' } = {}) =>
  `<a href="${o.href}" target="_blank" style="margin:0;padding:0;border:0;text-decoration:none;font-family:${FONT};font-size:${size}px;font-weight:${weight};color:${color}">${o.label}</a>`;
const imgLink = (o, extra = '') =>
  `<a href="${o.href}" target="_blank" style="margin:0;padding:0;border:0;text-decoration:none">${img(o.src, o.w, o.h, o.alt, extra)}</a>`;

const row = (inner, pad = '0') => `<tr><td style="margin:0.1px;padding:${pad};line-height:17px">${inner}</td></tr>`;

const panel = (inner, pad = '15px', valign = 'top') =>
  `<td valign="${valign}" align="left" bgcolor="${WHITE}" style="margin:0.1px;padding:${pad};background-color:${WHITE};border:1px solid ${C.border};border-collapse:separate;border-radius:6px">${inner}</td>`;

const logo = () => img('assets/logo-shine.gif', 96, 62, 'slashdev');
const avatar = (p) => img(p.avatar, 132, 132, p.name, 'border-radius:200px');

/* name + animated verified tick */
const nameRow = (p) => tbl(`<tr>
  <td align="left" valign="middle" style="margin:0.1px">${text(p.name, { size: 16, color: C.ink, weight: 'bold' })}</td>
  ${spacer(6)}
  <td align="left" valign="middle" style="margin:0.1px">${img('assets/badge-verified.gif', 16, 16, 'verified')}</td>
</tr>`);

/* social icons stacked in a column */
const socialColumn = (p) => tbl(p.socials.map((s, i) =>
  `<tr><td style="margin:0.1px;padding:${i ? '7px' : '0'} 0 0 0">${imgLink(s)}</td></tr>`).join(''));

/* identity + contact stack */
const details = (p) => tbl([
  row(logo(), '0 0 12px 0'),
  row(nameRow(p)),
  row(text(p.role), '3px 0 0 0'),
  row(text(p.company, { weight: 'bold', color: C.ink }), '1px 0 0 0'),
  ...p.phones.map((ph, i) => row(link(ph), i ? '1px 0 0 0' : '8px 0 0 0')),
  row(link(p.email, { weight: 'bold', color: C.ink })),
  row(text(p.location, { size: 11, color: C.muted }), '4px 0 0 0'),
].join(''));

/* outer wrapper — resets Gmail's inherited styles the way the reference does */
/* One continuous off-white plate behind card + strip, padded so no page colour
   shows through the gap between them. */
const wrap = (inner) => `<table cellpadding="0" cellspacing="0" border="0" bgcolor="${WHITE}" style="margin:0.1px;padding:0;border:0;text-indent:0;border-collapse:collapse;background-color:${WHITE};color:${C.body};font-size:10px;font-family:${FONT}"><tbody><tr><td bgcolor="${WHITE}" style="margin:0.1px;padding:6px;border:0;line-height:16px;background-color:${WHITE}">${inner}</td></tr></tbody></table>`;

/* The card sizes itself to its content (~373px). No explicit widths: with a width
   on only one panel the browser over-allocates it and starves the other, which
   collapses the icon column to nothing. */
const card = (p) => tbl(`<tr>
  ${/* centered so the column sits balanced in the panel whatever its length */ ''}
  ${panel(socialColumn(p), '10px 8px', 'middle')}
  ${spacer(8)}
  ${panel(tbl(`<tr>
    <td align="left" valign="top" style="margin:0.1px">${details(p)}</td>
    <td align="left" valign="middle" style="margin:0.1px;padding:0 0 0 18px">${avatar(p)}</td>
  </tr>`), '15px')}
</tr>`);

const signature = (p) => wrap(tbl([
  row(card(p)),
  row(imgLink(AWARDS), '14px 0 0 0'),
].join('')));

/* ---------- page ---------- */
function page(p) {
  const plain = p.name.replace(/&amp;/g, '&');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>${plain} &mdash; email signature</title>
<style>body{background:#fff;margin:0;padding:40px 24px 80px;font-family:${FONT};color:#18181b}
h1{font-size:24px;max-width:860px;margin:0 auto 10px}
p{max-width:860px;margin:0 auto 12px;color:#52525b;font-size:13px;line-height:1.6}
.box{max-width:860px;margin:18px auto 0;border:1px dashed #d4d4d8;padding:26px;border-radius:10px}
.who{max-width:860px;margin:0 auto 12px;font-size:13px}
.who a{color:${C.accent}}
code{background:#f4f4f5;padding:1px 5px;border-radius:4px}</style></head>
<body>
<h1>${plain} &mdash; email signature</h1>
<p class="who">${PEOPLE.map(o => o === p ? `<b>${o.name.replace(/&amp;/g, '&')}</b>`
    : `<a href="${o.files[0]}">${o.name.replace(/&amp;/g, '&')}</a>`).join(' &nbsp;&middot;&nbsp; ')}</p>
<p>Email-safe: table markup with inline styles, real clickable <code>tel:</code> / <code>mailto:</code> / profile links, and every animation baked into a looping GIF (email clients can&rsquo;t run CSS, but they all play GIFs). Backgrounds are <code>#fffffe</code> rather than pure white so Gmail&rsquo;s mobile dark mode doesn&rsquo;t invert the card and leave the images mismatched.</p>
<p>To install: copy everything between the <code>SIGNATURE</code> comments below and paste it into Gmail &rarr; Settings &rarr; Signature. Image URLs are already public, so it works as-is.</p>
<div class="box">

<!-- ===== SIGNATURE — COPY FROM HERE ===== -->
${absolutize(signature(p))}
<!-- ===== END ===== -->

</div>
</body></html>
`;
}

const LOCAL = process.argv.includes('--local');
const P = path.join(OUT, 'preview');
if (LOCAL) fs.mkdirSync(P, { recursive: true });

for (const person of PEOPLE) {
  const html = page(person);
  for (const f of person.files) {
    fs.writeFileSync(path.join(OUT, f), html);
    console.log('wrote', f, `(${person.name})`);
  }
  /* preview/ carries relative asset paths so the signature can be reviewed on
     disk before the GIFs are live on Pages. preview/ is gitignored. */
  if (LOCAL) {
    const local = html.split(ASSET_BASE + 'assets/').join('../assets/');
    for (const f of person.files) fs.writeFileSync(path.join(P, f), local);
  }
}
if (LOCAL) console.log('wrote preview/ (relative asset paths)');
