const { chromium } = require('playwright-core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const A = path.join(ROOT, 'assets');
const DUR = 2.2, FPS = 20;
const icons = ['phone', 'mail', 'pin'];

(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--force-color-profile=srgb'] });
  for (const ic of icons) {
    const ctx = await b.newContext({ viewport: { width: 36, height: 36 }, deviceScaleFactor: 4 });
    const pg = await ctx.newPage();
    await pg.goto('file://' + path.join(ROOT, 'templates', 'chips-anim.html') + '?icon=' + ic, { waitUntil: 'networkidle' });
    await pg.waitForTimeout(400);
    const frames = path.join('/tmp', 'chip-' + ic);
    fs.rmSync(frames, { recursive: true, force: true });
    fs.mkdirSync(frames, { recursive: true });
    const client = await ctx.newCDPSession(pg);
    const buf = [];
    client.on('Page.screencastFrame', async (f) => { buf.push(f.data); try { await client.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {} });
    await client.send('Page.startScreencast', { format: 'jpeg', quality: 100, everyNthFrame: 1 });
    await pg.waitForTimeout(DUR * 1000 + 250);
    await client.send('Page.stopScreencast');
    await ctx.close();
    buf.forEach((d, i) => fs.writeFileSync(path.join(frames, `f${String(i).padStart(4, '0')}.jpg`), Buffer.from(d, 'base64')));
    const out = path.join(A, 'ic-' + ic + '.gif');
    // flat colors -> few colors, no dither, crisp
    execSync(`ffmpeg -hide_banner -loglevel error -y -framerate ${Math.round(buf.length / DUR)} -i ${frames}/f%04d.jpg ` +
      `-vf "fps=${FPS},scale=72:72:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=64:stats_mode=full[p];[s1][p]paletteuse=dither=none" -loop 0 "${out}"`);
    console.log(`ic-${ic}.gif: ${buf.length} frames -> ${Math.round(fs.statSync(out).size / 1024)} KB`);
  }
  await b.close();
})();
