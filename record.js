const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const DIR = '/home/kevin-farias/michael-signatures';
const FRAMES = '/tmp/sig-frames';
const PAGE = 'file://' + DIR + '/aurora-variations.html';

(async () => {
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.mkdirSync(FRAMES, { recursive: true });

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--hide-scrollbars', '--force-color-profile=srgb'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 880, height: 470 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(PAGE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200); // let webfonts settle

  const client = await ctx.newCDPSession(page);
  const frames = [];
  client.on('Page.screencastFrame', async (f) => {
    frames.push({ data: f.data, t: f.metadata.timestamp });
    try { await client.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {}
  });

  await client.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 });

  const takes = ['stageA', 'stageB', 'stageC'];
  for (const id of takes) {
    await page.evaluate((sid) => {
      document.getElementById(sid).scrollIntoView({ block: 'center' });
    }, id);
    await page.waitForTimeout(350);
    await page.click(`button[data-target="${id}"]`); // replay the entrance
    if (id === 'stageC') {
      // wiggle for the parallax tilt
      const box = await page.locator('#stageC').boundingBox();
      for (let i = 0; i < 6; i++) {
        await page.mouse.move(box.x + box.width * (0.3 + 0.4 * Math.sin(i)), box.y + box.height * (0.4 + 0.2 * i / 6));
        await page.waitForTimeout(180);
      }
    }
    await page.waitForTimeout(4200);
  }

  await client.send('Page.stopScreencast');
  await page.waitForTimeout(150);
  await browser.close();

  // write frames + a concat list using real timestamps for smooth pacing
  let list = '';
  const t0 = frames[0].t;
  frames.forEach((f, i) => {
    const name = `f${String(i).padStart(5, '0')}.jpg`;
    fs.writeFileSync(path.join(FRAMES, name), Buffer.from(f.data, 'base64'));
    const next = frames[i + 1] ? frames[i + 1].t : f.t + 0.05;
    const dur = Math.max(0.016, next - f.t);
    list += `file '${name}'\nduration ${dur.toFixed(4)}\n`;
  });
  list += `file 'f${String(frames.length - 1).padStart(5, '0')}.jpg'\n`;
  fs.writeFileSync(path.join(FRAMES, 'list.txt'), list);
  console.log('frames:', frames.length, 'span(s):', (frames[frames.length - 1].t - t0).toFixed(1));
})();
