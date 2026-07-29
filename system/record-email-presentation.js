const { chromium } = require('playwright-core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SEG = 5.0;
const W = 760, H = 470;
const members = ['kevin', 'michael'];

async function rec(browser, slug) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const pg = await ctx.newPage();
  await pg.goto('file://' + path.join(ROOT, slug + '-aurora-email.html'), { waitUntil: 'networkidle' });
  // strip preview wrapper, present the signature centered on an email-like bg
  await pg.evaluate(() => {
    const n = document.querySelector('.note'); if (n) n.remove();
    const b = document.querySelector('.box'); if (b) { b.style.border = 'none'; b.style.maxWidth = 'none'; b.style.padding = '0'; }
    document.body.style.cssText = 'margin:0;min-height:100vh;background:#eef1f5;display:grid;place-items:center';
  });
  await pg.waitForTimeout(700);
  const frames = path.join('/tmp', 'em-' + slug);
  fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames, { recursive: true });
  const client = await ctx.newCDPSession(pg);
  const buf = [];
  client.on('Page.screencastFrame', async (f) => { buf.push({ d: f.data, t: f.metadata.timestamp }); try { await client.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {} });
  await client.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 });
  await pg.waitForTimeout(SEG * 1000);
  await client.send('Page.stopScreencast');
  await ctx.close();
  let list = '';
  buf.forEach((f, i) => {
    const nm = `f${String(i).padStart(5, '0')}.jpg`;
    fs.writeFileSync(path.join(frames, nm), Buffer.from(f.d, 'base64'));
    const next = buf[i + 1] ? buf[i + 1].t : f.t + 0.05;
    list += `file '${nm}'\nduration ${Math.max(0.016, next - f.t).toFixed(4)}\n`;
  });
  list += `file 'f${String(buf.length - 1).padStart(5, '0')}.jpg'\n`;
  fs.writeFileSync(path.join(frames, 'list.txt'), list);
  const seg = path.join('/tmp', 'emseg-' + slug + '.mp4');
  execSync(`ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i ${frames}/list.txt -vf "fps=30,scale=${W}:${H},format=yuv420p" -c:v libx264 -preset medium -crf 20 ${seg}`);
  console.log(`${slug}: ${buf.length} frames`);
  return seg;
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--hide-scrollbars', '--force-color-profile=srgb'] });
  const segs = [];
  for (const m of members) segs.push(await rec(browser, m));
  await browser.close();
  const cat = '/tmp/em-concat.txt';
  fs.writeFileSync(cat, segs.map(s => `file '${s}'`).join('\n') + '\n');
  const out = path.join(ROOT, 'dist', 'signature-presentation.mp4');
  execSync(`ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i ${cat} -c:v libx264 -preset medium -crf 20 -movflags +faststart ${out}`);
  console.log('signature-presentation.mp4 ->', Math.round(fs.statSync(out).size / 1024), 'KB');
})();
