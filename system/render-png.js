const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const team = JSON.parse(fs.readFileSync(path.join(ROOT, 'team.json'), 'utf8'));

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--hide-scrollbars', '--force-color-profile=srgb'] });
  for (const m of team.members) {
    const url = 'file://' + path.join(ROOT, 'dist', m.slug, 'index.html') + '?gif=1'; // composed, static state
    const ctx = await browser.newContext({ viewport: { width: 700, height: 320 }, deviceScaleFactor: 3 });
    const pg = await ctx.newPage();
    await pg.goto(url, { waitUntil: 'networkidle' });
    await pg.waitForTimeout(1200);
    const card = pg.locator('.au');
    const out = path.join(ROOT, 'dist', m.slug, 'card.png');
    await card.screenshot({ path: out });
    await ctx.close();
    console.log(`${m.slug}: card.png (${Math.round(fs.statSync(out).size / 1024)} KB, @3x)`);
  }
  await browser.close();
})();
