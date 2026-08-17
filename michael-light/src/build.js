#!/usr/bin/env node
/* Slashdev email signatures — bordered-panel card (animated social column,
   verified name, circular portrait) plus the awards/reviews strip.

   Animation is baked into looping GIFs (src/bake.js); email clients can't run
   CSS but they all play GIFs. Markup is table-based with inline styles and real
   clickable text, so it survives Gmail / Outlook / Apple Mail.

   Run: node src/build.js            (add --local to also write preview/)

   Writes:
     index.html, L1-two-panel.html, kevin.html   the name gate (the two legacy
                                                  filenames stay so old links land
                                                  on the gate instead of a 404)
     p/<hash>.html                                one signature page per person,
                                                  named by a hash of their name
     dark-mode-test.html                          light vs transparent vs dark vs
                                                  theme-agnostic, for pasting into
                                                  Gmail to see what its mobile dark
                                                  mode does to each

   Privacy: nobody's contact card is listed publicly. index.html asks for a
   name, hashes it in the browser (SHA-256) and looks the hash up in a shipped
   hash->page map, so the deployed HTML carries no readable roster and the
   per-person URLs cannot be enumerated by browsing. This is privacy from
   casual browsing and scraping, not cryptography — the source repo still
   holds the data in this file.

   History: earlier revisions carried three other layouts and four icon sets.
   Kevin picked this one (two-panel + the reference icon files at 24px), so the
   alternatives are gone — see git log if one is ever needed again. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUT = path.join(__dirname, '..');
const FONT = `Inter,'Helvetica Neue',Helvetica,Arial,sans-serif`;

/* absolute URLs so a copied block renders inside an email client */
const ASSET_BASE = 'https://fvlabs.github.io/michael-signatures/michael-light/';
const absolutize = (html) => html.replace(/src="assets\//g, `src="${ASSET_BASE}assets/`);

/* ---------- themes ----------
   Each theme picks its own baked asset set, because a GIF carries its background
   in its pixels — there is no way to restyle one after the fact.

   light        assets baked on white. #fffffe rather than #ffffff was an attempt
                to dodge Gmail's dark-mode inverter; it does not work (Gmail uses
                a luminance threshold, not an exact match), kept because it costs
                nothing and helps in some other clients.
   transparent  our assets baked with no background (-t). Gmail's proxy preserves
                alpha (verified against a proxied URL), so this fixes the portrait
                and badge. It cannot fix two things: the black wordmark vanishes on
                dark, and the reference icon files carry their own white plate —
                77% opaque white per frame, corners aside. GIF alpha is also 1-bit,
                so edges harden and the portrait goes 162 KB -> 1.2 MB because alpha
                defeats frame-delta compression. Same for the awards strip: 47% of
                that artwork is opaque white (the Clutch widget's own card).
   dark         assets baked on #070a14 (-d), light text. Nothing for Gmail to
                invert, so it renders the same in both modes — but the vendor
                icons are black-on-transparent and vanish on dark, so this theme
                has to use our own glyph set (ic-dark-*), and the awards strip
                stays a white card because its artwork is black-on-white. */
const THEMES = {
  light: {
    label: 'Current — light card',
    /* bg null: declare no background at all. A #fffffe plate got inverted by Gmail
       to ~#333 — lighter than its own #131315 page — so the signature sat on a
       visible rectangle whose edge read as a second, spurious border just outside
       the panel hairlines. With no background the panels are hairlines on whatever
       surface the client paints, and light mode is unchanged (it was white on
       white anyway). */
    bg: null, ink: '#09090b', body: '#3f3f46', muted: '#71717a', border: '#e4e4e7',
    /* transparent assets, so nothing carries a white plate into a darkened card.
       The wordmark is -ko: black ink with a hairline light edge on the d/e/v only,
       leaving the slash clean. Requested by Michael, who did not want the pure-blue
       mark (-a) — it is not a brand style slashdev has used. The edge is 0.37px
       outside each letter (stroke-width 6, baked at 3x so the hairline survives
       the 1-bit alpha threshold), invisible against white, and it stops the
       letters disappearing on a dark card where plain black measures 1.24:1
       against Gmail's ~#202124. -k (plain black) and -a (blue) stay baked.
       Animation is the slash sliding in along its own slant and docking into the
       word (Kevin's idea), then the blue sweep crossing the letters.
       Edge grey: Kevin tested the eight-step ladder on his phone and picked 8
       (#4b5563, the darkest) — so the edge is essentially invisible in both modes
       and the letters sit as a silhouette on dark. His call, made after seeing the
       trade. logo-grey-8.gif is the ladder bake, already live. */
    suffix: '-t', logo: 'assets/logo-grey-8.gif', awards: 'assets/awards-2026-t.png',
    note: 'What is live today. Gmail mobile dark mode inverts the card to dark but cannot touch the images, so the logo, badge and awards strip stay light and read as white boxes. The social icons no longer do — they are blue on transparency now.',
  },
  transparent: {
    label: 'Transparent images',
    bg: '#fffffe', ink: '#09090b', body: '#3f3f46', muted: '#71717a', border: '#e4e4e7',
    suffix: '-t', awards: 'assets/awards-2026-t.png',
    note: 'Every GIF of ours re-baked with no background, and Gmail&rsquo;s proxy does preserve the alpha &mdash; so the portrait and badge come out right. Two things still break: the black <code>dev</code> wordmark disappears against dark, &mdash; the icons are fixed for good now, recoloured to blue on transparency after we found the white plate was <b>inside those files</b> (77% opaque white per frame, corners aside). Cost: the portrait goes from 162 KB to 1.2 MB, because alpha defeats GIF frame-delta compression.',
  },
  dark: {
    label: 'Dark card',
    bg: '#070a14', ink: '#ffffff', body: '#c3cbdc', muted: '#727b91', border: '#1e2637',
    suffix: '-d', awards: 'assets/awards-2026.png',
    note: 'Card and assets both baked dark. Gmail has nothing to invert, so this is the one that renders identically in light and dark mode. One consequence: the awards strip is third-party black-on-white artwork, so it stays a white card.',
  },
  agnostic: {
    label: 'Theme-agnostic',
    /* bg null = emit no background at all, so whatever surface the client paints
       shows through. Text stays dark and lets Gmail invert it, which is the one
       thing its dark mode does cleanly. Every image colour is chosen to hold up
       on white and on dark: brand blue glyph mass with white knockouts, blue
       wordmark, and the portrait's gradient ring as the outer edge. */
    bg: null, ink: '#09090b', body: '#3f3f46', muted: '#71717a', border: '#a1a1aa',
    suffix: '-t', awards: 'assets/awards-2026-t.png',
    logo: 'assets/logo-shine-a.gif',
    note: 'The combination that actually survives. No background is declared, so the client&rsquo;s own surface shows through and there is nothing for the inverter to fight. Text is dark and lets Gmail flip it. Images are transparent with colours that read either way &mdash; brand-blue glyphs and wordmark. Two honest limits: the awards strip still carries the Clutch widget&rsquo;s own white card (47% of that artwork is opaque white), and the shine on the mark had to become a colour shimmer, because a white streak over transparency smears onto whatever is behind it.',
  },
};
let T = THEMES.light;   // set per render

const SITE = 'https://slashdev.io';
const INSTAGRAM = 'https://www.instagram.com/slashdevhq';
const PHONE_US = { href: 'tel:+19292779018', label: '+1 (929) 277-9018' };

/* Instagram is the company account; the ?igsh= share tracker from the app link is
   stripped — it identifies whoever copied the link. Nobody has a Facebook account
   to point at.

   ic-blue-* are the reference glyphs recoloured to slashdev blue on transparency
   (src/recolor-icons.py). The originals had a white plate baked into the pixels —
   ~77% opaque white per frame — which is why they showed as white boxes wherever
   the client darkened the card. Blue on transparency reads on white and on dark,
   so every theme now shares one icon set. Dimensions follow the source artwork:
   133x128 for web, 140x128 for the rest, shown at width 24 as the original did.

   x and youtube have no reference artwork; they are drawn and baked to match
   (src/tiles/social-pop.html via src/bake.js), continuing the cascade as
   slots 4 and 5. */
function iconAsset(key) {
  const [w, h] = key === 'web' ? [24, 23] : [24, 22];
  const alt = { web: 'slashdev.io', linkedin: 'LinkedIn', instagram: 'Instagram', x: 'X', youtube: 'YouTube' }[key];
  return { src: `assets/ic-blue-${key}.gif`, w, h, alt };
}

const PEOPLE = [
  {
    name: 'Michael Ballard',
    role: 'Founder &amp; CEO',
    company: 'Slashdev',
    slug: 'michael',
    phones: [PHONE_US, { href: 'tel:+46703688988', label: '+46 70 368 8988' }],
    email: { href: 'mailto:michael@slashdev.io', label: 'michael@slashdev.io' },
    location: 'Seattle, WA &middot; Stockholm, SE',
    socials: [
      { key: 'web', href: SITE },
      { key: 'linkedin', href: 'https://www.linkedin.com/in/mballard23/' },
      { key: 'instagram', href: INSTAGRAM },
      { key: 'x', href: 'https://x.com/slashdevhq' },
      { key: 'youtube', href: 'https://www.youtube.com/@slashdevhq' },
    ],
  },
  {
    /* Kevin's details come from his previous signature (kevin-signature-gmail.html).
       Two things still need his confirmation: the US number is the same one Michael
       lists, and the location line says Seattle/Stockholm while his mobile is +55. */
    name: 'Kevin Farias',
    role: 'Tech Lead',
    company: 'Slashdev',
    slug: 'kevin',
    phones: [PHONE_US, { href: 'tel:+5554999368153', label: '+55 54 99936-8153' }],
    email: { href: 'mailto:kevin@slashdev.io', label: 'kevin@slashdev.io' },
    location: 'Seattle, WA &middot; Stockholm, SE',
    socials: [
      { key: 'web', href: SITE },
      { key: 'linkedin', href: 'https://www.linkedin.com/in/kevin-de-farias/' },
      { key: 'instagram', href: INSTAGRAM },
    ],
  },
  /* Everyone below came in as a photo in assets/avatars/<Role>/<Full Name>.ext
     and nothing else. Emails are INFERRED from the michael@/kevin@ pattern —
     not confirmed — and with no mobile or LinkedIn supplied they list the
     office number and the two company icons, same as Ermal has shipped with. */
  member('Patrich Soderstrom', 'CTO', 'patrich'),
  member('Ermal Rexhmati', 'Tech Lead', 'ermal'),
  member('Andre Bernardi', 'Member of Technical Staff', 'andre'),
  member('Armand Rexhmati', 'Member of Technical Staff', 'armand'),
  member('Bruno Bordignon', 'Member of Technical Staff', 'bruno'),
  member('Elti Shaba', 'Member of Technical Staff', 'elti'),
  member('Henrique Bovareto', 'Member of Technical Staff', 'henrique'),
  member('Matheus Mello', 'Member of Technical Staff', 'matheus'),
  member('Tiago Seben', 'Member of Technical Staff', 'tiago'),
];

function member(name, role, slug) {
  return {
    name, role, company: 'Slashdev', slug,
    phones: [PHONE_US],
    email: { href: `mailto:${slug}@slashdev.io`, label: `${slug}@slashdev.io` },
    location: 'Seattle, WA &middot; Stockholm, SE',
    socials: [
      { key: 'web', href: SITE },
      { key: 'instagram', href: INSTAGRAM },
    ],
  };
}

/* Awards strip: 1200x491 asset shown at 600x246 — deliberately wider than the
   ~373px card. 600 is where the Clutch sub-scores become readable (~10px), and
   only 11% of the source image is gap, so there is nothing to win back by
   re-spacing the three blocks. The Business of Apps year was updated 2025 -> 2026. */
const AWARDS_W = 600, AWARDS_H = 246;
const AWARDS_ALT = 'Top App Development Company 2026 (Business of Apps) — Clutch 5.0 — Google Reviews 5.0';

/* ---------- primitives ---------- */
const tbl = (inner, extra = '') =>
  `<table cellpadding="0" cellspacing="0" border="0" ${extra} style="margin:0.1px;border-collapse:collapse"><tbody>${inner}</tbody></table>`;
const spacer = (w) => `<td width="${w}" style="margin:0.1px;line-height:1px;font-size:1px">&nbsp;</td>`;
const img = (src, w, h, alt = '', extra = '') =>
  `<img alt="${alt}" src="${src}" width="${w}" height="${h}" style="margin:0.1px;padding:0;border:0;display:block;max-width:100%;${extra}">`;

const text = (t, { size = 12, color = null, weight = 'normal' } = {}) =>
  `<span style="margin:0;padding:0;border:0;font-family:${FONT};font-size:${size}px;font-weight:${weight};color:${color || T.body}">${t}</span>`;
const link = (o, { size = 12, color = null, weight = 'normal' } = {}) =>
  `<a href="${o.href}" target="_blank" style="margin:0;padding:0;border:0;text-decoration:none;font-family:${FONT};font-size:${size}px;font-weight:${weight};color:${color || T.body}">${o.label}</a>`;
const imgLink = (o, extra = '') =>
  `<a href="${o.href}" target="_blank" style="margin:0;padding:0;border:0;text-decoration:none">${img(o.src, o.w, o.h, o.alt, extra)}</a>`;

const row = (inner, pad = '0') => `<tr><td style="margin:0.1px;padding:${pad};line-height:17px">${inner}</td></tr>`;

const bgAttr = () => (T.bg ? ` bgcolor="${T.bg}"` : '');
const bgCss = () => (T.bg ? `background-color:${T.bg};` : '');

const panel = (inner, pad = '15px', valign = 'top') =>
  `<td${bgAttr()} valign="${valign}" align="left" style="margin:0.1px;padding:${pad};${bgCss()}border:1px solid ${T.border};border-collapse:separate;border-radius:6px">${inner}</td>`;

const logo = () => img(T.logo || `assets/logo-shine${T.suffix}.gif`, 96, 62, 'slashdev');
/* Plain circular portrait, one file for every theme. PNG alpha is 8-bit so the
   edge is properly antialiased — unlike the 1-bit GIF alpha that chopped the old
   rotating ring into an arc. The ring is gone: it was carried over from the
   aurora concepts, never asked for, and read as unprofessional. border-radius
   stays as a belt-and-braces measure for clients that ignore alpha. */
const avatar = (p) => img(`assets/avatar-${p.slug}-round.png`, 132, 132, p.name, 'border-radius:200px');
const badge = () => img(`assets/badge-verified${T.suffix}.gif`, 16, 16, 'verified');

/* name + animated verified tick */
const nameRow = (p) => tbl(`<tr>
  <td align="left" valign="middle" style="margin:0.1px">${text(p.name, { size: 16, color: T.ink, weight: 'bold' })}</td>
  ${spacer(6)}
  <td align="left" valign="middle" style="margin:0.1px">${badge()}</td>
</tr>`);

/* social icons stacked in a column */
const socialColumn = (p) => tbl(p.socials.map((s, i) =>
  `<tr><td style="margin:0.1px;padding:${i ? '7px' : '0'} 0 0 0">${imgLink({ ...iconAsset(s.key), href: s.href })}</td></tr>`).join(''));

/* identity + contact stack */
const details = (p) => tbl([
  row(logo(), '0 0 12px 0'),
  row(nameRow(p)),
  row(text(p.role), '3px 0 0 0'),
  row(text(p.company, { weight: 'bold', color: T.ink }), '1px 0 0 0'),
  ...p.phones.map((ph, i) => row(link(ph), i ? '1px 0 0 0' : '8px 0 0 0')),
  row(link(p.email, { weight: 'bold', color: T.ink })),
  row(text(p.location, { size: 11, color: T.muted }), '4px 0 0 0'),
].join(''));

/* outer wrapper — resets Gmail's inherited styles, and carries one continuous
   plate so no page colour shows through the gap between card and strip */
const wrap = (inner) => `<table cellpadding="0" cellspacing="0" border="0"${bgAttr()} style="margin:0.1px;padding:0;border:0;text-indent:0;border-collapse:collapse;${bgCss()}color:${T.body};font-size:10px;font-family:${FONT}"><tbody><tr><td${bgAttr()} style="margin:0.1px;padding:6px;border:0;line-height:16px;${bgCss()}">${inner}</td></tr></tbody></table>`;

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

function signature(p, theme = THEMES.light) {
  T = theme;
  const html = wrap(tbl([
    row(card(p)),
    row(imgLink({ src: T.awards, w: AWARDS_W, h: AWARDS_H, alt: AWARDS_ALT, href: SITE }), '14px 0 0 0'),
  ].join('')));
  T = THEMES.light;
  return html;
}

/* ---------- pages ---------- */
const plainName = (p) => p.name.replace(/&amp;/g, '&');
const SHELL = (title, head, body) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>${title}</title>
<meta name="robots" content="noindex,nofollow">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{background:#fff;margin:0;padding:40px 24px 90px;font-family:${FONT};color:#18181b}
.gate{max-width:860px;margin:22px auto 0;display:flex;gap:10px;flex-wrap:wrap}
.gate input{flex:1;min-width:220px;font:inherit;font-size:15px;padding:11px 14px;border:1px solid #d4d4d8;border-radius:8px;outline-color:#215ff6}
.gate button{font:inherit;font-size:15px;font-weight:600;padding:11px 20px;border:0;border-radius:8px;background:#215ff6;color:#fff;cursor:pointer}
.gate button:hover{background:#1a4fd0}
#msg{color:#b91c1c;min-height:20px;margin-top:12px}
h1{font-size:24px;max-width:860px;margin:0 auto 10px}
h2{font-size:19px;max-width:860px;margin:52px auto 0;display:flex;align-items:baseline;gap:10px}
.role{font-size:13px;font-weight:400;color:#71717a}
p{max-width:860px;margin:0 auto 12px;color:#52525b;font-size:13px;line-height:1.6}
.box{max-width:860px;margin:14px auto 0;border:1px dashed #d4d4d8;padding:26px;border-radius:10px}
.dark{background:#0b0d14}
code{background:#f4f4f5;padding:1px 5px;border-radius:4px}
a{color:#215ff6}</style></head>
<body>
<h1>${head}</h1>
${body}
</body></html>
`;

function block(label, slug, inner, dark = false) {
  return `<div class="box${dark ? ' dark' : ''}">

<!-- ===== SIGNATURE (${slug}) — COPY FROM HERE ===== -->
${inner}
<!-- ===== END (${slug}) ===== -->

</div>`;
}

/* ---------- gated shipping pages ----------
   One page per person under p/, named by the first 16 hex chars of
   sha256(normalised full name). The gate accepts a first name or a full name
   (both normalised the same way: lowercase, accents stripped, whitespace
   collapsed) and maps sha256(input) -> page through DIR, which ships only
   hashes. First names are all unique across the roster; the build throws if
   that ever stops being true. */
const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/\s+/g, ' ').trim();
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const personFile = (p) => `p/${sha256(norm(plainName(p))).slice(0, 16)}.html`;

const DIR = {};
for (const p of PEOPLE) {
  for (const key of [norm(plainName(p)), norm(plainName(p)).split(' ')[0]]) {
    const h = sha256(key);
    if (DIR[h] && DIR[h] !== personFile(p)) throw new Error(`name collision on "${key}"`);
    DIR[h] = personFile(p);
  }
}

/* legacy filenames kept so links that circulated before the gate still work */
const FILES = ['index.html', 'L1-two-panel.html', 'kevin.html'];
const gatePage = () => SHELL('Slashdev email signatures', 'Slashdev email signatures', `
<p>Every team member has their own signature page. Type your name (first name is enough) and it opens &mdash; nothing here lists anyone else&rsquo;s card.</p>
<form class="gate" id="f">
  <input id="q" type="text" placeholder="Your name" autocomplete="name" autofocus>
  <button type="submit">Open my signature</button>
</form>
<p id="msg"></p>
<script>
const DIR = ${JSON.stringify(DIR)};
const norm = (s) => s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().replace(/\\s+/g, ' ').trim();
async function sha256(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');
}
document.getElementById('f').addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = norm(document.getElementById('q').value);
  if (!q) return;
  const hit = DIR[await sha256(q)];
  if (hit) { location.href = hit; return; }
  document.getElementById('msg').textContent = 'No signature found for that name — check the spelling (first or full name), or ask Kevin to add you.';
});
</script>`);

/* one person's page: their block plus the install instructions.
   Asset URLs are absolute, so living under p/ changes nothing there; only the
   dark-mode-test link is relative and needs the ../ hop. */
const personPage = (p) => SHELL(`Slashdev email signature`,
  `${plainName(p)} <span class="role">${p.role.replace(/&amp;/g, '&')}</span>`, `
<p>Email-safe: table markup with inline styles, real clickable <code>tel:</code> / <code>mailto:</code> / profile links, and every animation baked into a looping GIF (email clients can&rsquo;t run CSS, but they all play GIFs).</p>
<p>To install: copy everything between the <code>SIGNATURE</code> comments below into Gmail &rarr; Settings &rarr; Signature. Image URLs are already public, so it works as-is. Anything wrong on the card (number, e-mail, links) &mdash; tell Kevin.</p>
<p><b>Gmail mobile dark mode inverts this card</b> and leaves the images light. See <a href="../dark-mode-test.html">the dark-mode test page</a> for what each possible fix actually does.</p>
${block(p.name, plainName(p).split(' ')[0].toUpperCase(), absolutize(signature(p)))}`);

/* everyone on one page — never shipped, --local review only */
const allPage = () => SHELL('Slashdev email signatures — all (local review)',
  'Slashdev email signatures &mdash; all (local review)', `
<p>Every signature on one page for review. This file only exists in the gitignored preview/ folder &mdash; the shipped site is the name gate plus one hash-named page per person.</p>
${PEOPLE.map(p => `<h2>${plainName(p)} <span class="role">${p.role.replace(/&amp;/g, '&')}</span></h2>
${block(p.name, plainName(p).split(' ')[0].toUpperCase(), absolutize(signature(p)))}`).join('\n')}`);

/* wordmark readability test: Kevin's signature with each candidate wordmark.
   All share the slash-in entrance + blue sweep; they differ in letter ink/edge. */
const WORDMARKS = [
  { key: 'A', logo: 'assets/logo-slash-in.gif', label: 'Black + white hairline',
    note: 'Correct on white. On dark the letters are a faint silhouette lifted by the white hairline.' },
  { key: 'B', logo: 'assets/logo-slash-in-g.gif', label: 'Black + grey hairline',
    note: 'Same as A but the edge is #9aa3b2 — softer, reads less like a drawn outline on dark, slightly less separation.' },
  { key: 'C', logo: 'assets/logo-slash-in-w.gif', label: 'White + grey hairline',
    note: 'Michael&rsquo;s suggestion, edge darkened to #4b5563 after Kevin asked. Perfect on dark; on white the letters read as outlined shapes &mdash; visible now, but never solid. It is variant A inverted: whichever ink you pick, the opposite mode pays.' },
  { key: 'D', logo: 'assets/logo-slash-in-n.gif', label: 'Navy ink, no edge',
    note: 'No outline at all. #1e2a4a reads as near-black next to body text on white, and lifts to ~1.8:1 on Gmail dark instead of black&rsquo;s 1.24:1 — a dim but discernible silhouette.' },
];
/* the grey ladder: eight hairline greys in ONE copy block, so a single paste puts
   the whole ladder into one email and both modes can be compared side by side */
const GREYS = [['1','#c7cdd6'],['2','#adb4c0'],['3','#9aa3b2'],['4','#8a919c'],
               ['5','#7a828e'],['6','#6b7280'],['7','#5b6472'],['8','#4b5563']];
const greyLadder = () => wrap(tbl(GREYS.map(([n, hex]) => `<tr>
  <td style="margin:0.1px;padding:6px 0">${img(`assets/logo-grey-${n}.gif`, 96, 62, `slashdev, edge ${hex}`)}</td>
  ${spacer(14)}
  <td valign="middle" style="margin:0.1px">${text(`${n} &nbsp;&middot;&nbsp; edge ${hex}`, { size: 12 })}</td>
</tr>`).join('')));

const wordmarkPage = () => SHELL('Wordmark readability test', 'Wordmark readability test', `
<h2>Grey ladder &mdash; all eight in one block <span class="role">shipping: 8, #4b5563</span></h2>
<p>Black letters, hairline edge in eight greys, light to dark (3 is the original B, 8 the darkest from the earlier ladder). Copy this single block and paste it once &mdash; every step lands in the same email, so flipping the phone between modes compares them all at once. The labels are real text, so they invert with the client.</p>
${block('Grey ladder', 'GREY-LADDER', absolutize(greyLadder()))}

<p style="margin-top:40px">&mdash;</p>
<p>Kevin&rsquo;s signature four times; only the wordmark differs. All carry the slash-in entrance and the blue sweep. Paste each into Gmail and check both modes &mdash; the trade is one-directional: ink that is right for light mode fades on dark, and vice versa; the hairline is the compromise dial.</p>
${WORDMARKS.map(w => `<h2>${w.key} &mdash; ${w.label}</h2>
<p>${w.note}</p>
${block(w.label, 'WM-' + w.key, absolutize(signature(PEOPLE[1], { ...THEMES.light, logo: w.logo })))}`).join('\n')}`);

/* the test page: one person, all three themes */
const TEST_PERSON = PEOPLE[1];   // Kevin — he's the one pasting into Gmail
const testPage = () => SHELL('Dark-mode test — three variants',
  'Dark-mode test &mdash; three variants', `
<p>Same signature (${plainName(TEST_PERSON)}) built three ways. Paste each into Gmail, send it to yourself, and look at the result with the phone in dark mode. The point of the exercise is that a signature is one block of HTML &mdash; the recipient&rsquo;s client decides how to paint it, and Gmail strips the <code>&lt;style&gt;</code> block every CSS dark-mode technique depends on.</p>
<p>Each variant below is previewed on the background it was designed for, so the dark one sits on a dark plate here. That is <i>not</i> what Gmail does &mdash; it decides for itself.</p>
<p>Side by side, with Gmail&rsquo;s inverter approximated in a browser (backgrounds and text repainted, images left alone, which is what it actually does):</p>
<p style="max-width:1000px"><img src="assets/dark-mode-proof.png" alt="Four variants, as designed versus with Gmail dark mode simulated" style="width:100%;border:1px solid #e4e4e7;border-radius:8px"></p>
<p><b>Caveat on the dark row:</b> the simulation repaints <i>every</i> background, including the dark card&rsquo;s own. Gmail would leave a dark background alone, so that row&rsquo;s right-hand side overstates the damage. The real risk there is subtler &mdash; Gmail&rsquo;s dark surface is around <code>#202124</code> and these assets are baked on <code>#070a14</code>, so the images sit as slightly-too-dark rectangles.</p>
${Object.entries(THEMES).map(([key, theme]) => `<h2>${theme.label} <span class="role">${key}</span></h2>
<p>${theme.note}</p>
${block(theme.label, key.toUpperCase(), absolutize(signature(TEST_PERSON, theme)), key === 'dark')}`).join('\n')}`);

/* ---------- write ---------- */
const pages = [
  ...FILES.map(f => [f, gatePage()]),
  ...PEOPLE.map(p => [personFile(p), personPage(p)]),
  ['dark-mode-test.html', testPage()],
  ['wordmark-test.html', wordmarkPage()],
];
fs.mkdirSync(path.join(OUT, 'p'), { recursive: true });
for (const [f, html] of pages) {
  fs.writeFileSync(path.join(OUT, f), html);
  console.log('wrote', f);
}

/* preview/ carries relative asset paths so everything can be reviewed on disk
   before the GIFs are live on Pages. preview/ is gitignored. The gate's name
   lookup needs http(s) for crypto.subtle in some browsers — serve preview/
   with `python3 -m http.server` if the redirect is what you are checking. */
if (process.argv.includes('--local')) {
  const P = path.join(OUT, 'preview');
  fs.mkdirSync(path.join(P, 'p'), { recursive: true });
  for (const [f, html] of [...pages, ['all.html', allPage()]]) {
    const up = f.includes('/') ? '../../assets/' : '../assets/';
    fs.writeFileSync(path.join(P, f), html.split(ASSET_BASE + 'assets/').join(up));
  }
  console.log('wrote preview/ (relative asset paths, plus all.html review page)');
}
