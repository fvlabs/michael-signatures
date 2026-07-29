const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const team = JSON.parse(fs.readFileSync(path.join(ROOT, 'team.json'), 'utf8'));
const liveTpl = fs.readFileSync(path.join(ROOT, 'templates/live.html'), 'utf8');
const staticTpl = fs.readFileSync(path.join(ROOT, 'templates/static.html'), 'utf8');
const DIST = path.join(ROOT, 'dist');
const C = team.company;
const base = C.baseUrl.replace(/\/?$/, '/');

const PHONE_SVG = '<svg viewBox="0 0 24 24" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';

const fill = (tpl, map) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in map ? map[k] : ''));

// reset dist, copy assets
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });
for (const f of fs.readdirSync(path.join(ROOT, 'assets'))) {
  fs.copyFileSync(path.join(ROOT, 'assets', f), path.join(DIST, 'assets', f));
}

const cards = [];
for (const m of team.members) {
  const liveUrl = base + m.slug + '/';
  const photoUrl = base + 'assets/' + m.photo;
  const awardsUrl = base + 'assets/' + C.awards;

  // ---- live page ----
  const liveRows = m.phones.map((p, i) =>
    `<div class="row" style="animation-delay:${(0.9 + i * 0.1).toFixed(2)}s"><span class="ic">${PHONE_SVG}</span>` +
    `<a href="tel:${p.tel}">${p.display}</a> <span style="color:#5d6680;font-size:12px">· ${p.label}</span></div>`
  ).join('\n          ');

  const liveHtml = fill(liveTpl, {
    NAME: m.name, TITLE: m.title, PHOTO: m.photo, EMAIL: m.email,
    CITIES: m.cities.join(' · '), DOMAIN: C.domain, ACCENT: C.accent,
    LOGO_WHITE: C.logoWhite, PHONE_ROWS: liveRows,
  });
  fs.mkdirSync(path.join(DIST, m.slug), { recursive: true });
  fs.writeFileSync(path.join(DIST, m.slug, 'index.html'), liveHtml);

  // ---- static Gmail snippet ----
  const staticPhones = m.phones.map(p =>
    `<div style="font-size:14px;font-family:Montserrat,Arial,sans-serif;color:#000">${p.display}</div>`
  ).join('\n');
  const staticCities = m.cities.map(c =>
    `<div style="font-size:14px;font-family:Montserrat,Arial,sans-serif;color:#000">${c}</div>`
  ).join('\n');

  const snippet = fill(staticTpl, {
    NAME: m.name, TITLE: m.title, ACCENT: C.accent, EMAIL: m.email,
    PHOTO_URL: photoUrl, AWARDS_URL: awardsUrl, LIVE_URL: liveUrl,
    PHONE_ROWS: staticPhones, CITY_ROWS: staticCities,
  });
  fs.writeFileSync(path.join(DIST, m.slug, 'signature.html'), snippet);

  // ---- copy/paste preview wrapper ----
  const preview = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${m.name} — paste into Gmail</title>
<style>body{background:#fff;margin:24px;font-family:Arial,sans-serif}.note{max-width:760px;margin:0 auto 16px;color:#555;font-size:13px;line-height:1.6}.box{max-width:760px;margin:0 auto;border:1px dashed #ccc;padding:18px;border-radius:8px}code{background:#f3f3f3;padding:1px 5px;border-radius:4px}</style></head>
<body><div class="note"><b>${m.name}</b> — selecione tudo dentro da caixa pontilhada e cole em Gmail &rarr; Configura&ccedil;&otilde;es &rarr; Assinatura. Botão aponta para <code>${liveUrl}</code></div>
<div class="box">${snippet}</div></body></html>`;
  fs.writeFileSync(path.join(DIST, m.slug, 'paste.html'), preview);

  cards.push(`<a class="card" href="${m.slug}/"><img src="assets/${m.photo}"><div><b>${m.name}</b><span>${m.title}</span><em>${m.slug}/ · paste.html</em></div></a>`);
}

// ---- directory index ----
const index = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>slashdev — team signatures</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Space Grotesk',sans-serif;background:#0b0d14;color:#e8ecf5;min-height:100vh;padding:56px 24px}
h1{text-align:center;font-size:26px;margin-bottom:6px}p.sub{text-align:center;color:#8b93a7;margin-bottom:40px}
.grid{max-width:720px;margin:0 auto;display:grid;gap:14px}
.card{display:flex;gap:16px;align-items:center;background:#0f1320;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:14px 18px;text-decoration:none;color:inherit;transition:.2s}
.card:hover{border-color:${C.accent};transform:translateX(4px)}
.card img{width:56px;height:56px;border-radius:50%;object-fit:cover}
.card b{display:block;font-size:16px}.card span{display:block;color:#8b93a7;font-size:13px}.card em{display:block;color:#4b5468;font-size:11px;font-style:normal;margin-top:3px}</style></head>
<body><h1>slashdev — team signatures</h1><p class="sub">${team.members.length} members · click to preview the live card</p>
<div class="grid">${cards.join('\n')}</div></body></html>`;
fs.writeFileSync(path.join(DIST, 'index.html'), index);

// ---- GIF preview page (survives rebuilds) ----
const gifCards = team.members.map(m =>
  `<div class="card"><div class="lbl">${m.name}</div><img src="${m.slug}/card.gif" alt="${m.name}"></div>`
).join('\n');
const gifPreview = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>GIF preview</title>
<style>body{background:#e9eef3;font-family:Arial,sans-serif;margin:0;padding:40px}
h2{max-width:680px;margin:0 auto 8px;color:#333}.sub{max-width:680px;margin:0 auto 28px;color:#777;font-size:13px}
.card{max-width:680px;margin:0 auto 40px;background:#fff;border-radius:10px;padding:18px;box-shadow:0 2px 14px rgba(0,0,0,.08)}
.card img{width:100%;max-width:600px;display:block;border-radius:8px}.lbl{font-size:12px;color:#999;margin-bottom:8px;text-transform:uppercase;letter-spacing:.1em}</style></head>
<body><h2>GIFs animados — como aparecem no e-mail</h2>
<div class="sub">1&ordm; frame = card completo (fallback do Outlook). Loop: anel + feixe de luz.</div>
${gifCards}</body></html>`;
fs.writeFileSync(path.join(DIST, 'gif-preview.html'), gifPreview);

console.log(`built ${team.members.length} members -> dist/`);
team.members.forEach(m => console.log(`  ${m.slug}: dist/${m.slug}/index.html  +  dist/${m.slug}/paste.html`));
