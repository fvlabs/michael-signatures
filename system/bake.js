const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const team = JSON.parse(fs.readFileSync(path.join(ROOT, 'team.json'), 'utf8'));
const A = path.join(ROOT, 'assets');

(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--force-color-profile=srgb'] });

  // shared icon chips (rendered on solid dark so corners match the card)
  const c0 = await b.newContext({ deviceScaleFactor: 3 });
  const p0 = await c0.newPage();
  await p0.goto('file://' + path.join(ROOT, 'dist', 'kevin', 'index.html') + '?gif=1', { waitUntil: 'networkidle' });
  await p0.waitForTimeout(900);
  await p0.evaluate(() => { document.body.style.background = '#070a14'; });
  const ics = p0.locator('.ic');
  await ics.nth(0).screenshot({ path: path.join(A, 'ic-phone.png') });
  await ics.nth(2).screenshot({ path: path.join(A, 'ic-mail.png') });
  await ics.nth(3).screenshot({ path: path.join(A, 'ic-pin.png') });
  await c0.close();

  // per-member avatar (ring + glow + photo) on solid dark
  for (const m of team.members) {
    const c = await b.newContext({ deviceScaleFactor: 3 });
    const p = await c.newPage();
    await p.goto('file://' + path.join(ROOT, 'dist', m.slug, 'index.html') + '?gif=1', { waitUntil: 'networkidle' });
    await p.waitForTimeout(900);
    await p.evaluate(() => {
      const bg = document.querySelector('.au-bg'); if (bg) bg.style.display = 'none';
      const g = document.querySelector('.au-grain'); if (g) g.style.display = 'none';
      document.querySelector('.au').style.background = '#070a14';
    });
    await p.locator('.photo').screenshot({ path: path.join(A, 'avatar-' + m.slug + '.png') });
    await c.close();
    console.log('avatar-' + m.slug + '.png');
  }
  await b.close();
  console.log('baked chips + avatars');
})();
