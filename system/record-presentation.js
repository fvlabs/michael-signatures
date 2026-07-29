const { chromium } = require('playwright-core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SEG = 5.6; // seconds per card (entrance + settle hold)
const W = 920, H = 540;
const members = ['kevin', 'michael'];

async function recordCard(browser, slug) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const pg = await ctx.newPage();
  const frames = path.join('/tmp', 'pres-' + slug);
  fs.rmSync(frames, { recursive: true, force: true });
  fs.mkdirSync(frames, { recursive: true });
  const client = await ctx.newCDPSession(pg);
  const buf = [];
  client.on('Page.screencastFrame', async (f) => { buf.push({ d: f.data, t: f.metadata.timestamp }); try { await client.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {} });
  // start capturing, THEN navigate, so we catch the entrance animation from frame 0
  await client.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 });
  await pg.goto('file://' + path.join(ROOT, 'dist', slug, 'index.html'), { waitUntil: 'load' });
  await pg.waitForTimeout(SEG * 1000);
  await client.send('Page.stopScreencast');
  await ctx.close();

  let list = '';
  buf.forEach((f, i) => {
    const name = `f${String(i).padStart(5, '0')}.jpg`;
    fs.writeFileSync(path.join(frames, name), Buffer.from(f.d, 'base64'));
    const next = buf[i + 1] ? buf[i + 1].t : f.t + 0.05;
    list += `file '${name}'\nduration ${Math.max(0.016, next - f.t).toFixed(4)}\n`;
  });
  list += `file 'f${String(buf.length - 1).padStart(5, '0')}.jpg'\n`;
  fs.writeFileSync(path.join(frames, 'list.txt'), list);
  const seg = path.join('/tmp', 'seg-' + slug + '.mp4');
  execSync(`ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i ${frames}/list.txt -vf "fps=30,scale=${W}:${H},format=yuv420p" -c:v libx264 -preset medium -crf 20 ${seg}`);
  console.log(`${slug}: ${buf.length} frames -> ${seg}`);
  return seg;
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--hide-scrollbars', '--force-color-profile=srgb'] });
  const segs = [];
  for (const m of members) segs.push(await recordCard(browser, m));
  await browser.close();
  // concat segments
  const cat = '/tmp/pres-concat.txt';
  fs.writeFileSync(cat, segs.map(s => `file '${s}'`).join('\n') + '\n');
  const out = path.join(ROOT, 'dist', 'presentation.mp4');
  execSync(`ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i ${cat} -c:v libx264 -preset medium -crf 20 -movflags +faststart ${out}`);
  console.log('presentation.mp4 ->', Math.round(fs.statSync(out).size / 1024), 'KB');
})();
