const { chromium } = require('playwright-core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const team = JSON.parse(fs.readFileSync(path.join(ROOT, 'team.json'), 'utf8'));
const DUR = 4.0;
const FPS = 12;
const W = 600, H = 280; // GIF canvas

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--hide-scrollbars', '--force-color-profile=srgb'] });

  for (const m of team.members) {
    const page = 'file://' + path.join(ROOT, 'dist', m.slug, 'index.html') + '?gif=1';
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
    const pg = await ctx.newPage();
    await pg.goto(page, { waitUntil: 'networkidle' });
    await pg.waitForTimeout(1500); // fonts + let the loop reach a clean phase

    const frames = path.join('/tmp', 'gif-' + m.slug);
    fs.rmSync(frames, { recursive: true, force: true });
    fs.mkdirSync(frames, { recursive: true });

    const client = await ctx.newCDPSession(pg);
    const buf = [];
    client.on('Page.screencastFrame', async (f) => {
      buf.push(f.data);
      try { await client.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {}
    });
    await client.send('Page.startScreencast', { format: 'jpeg', quality: 95, everyNthFrame: 1 });
    await pg.waitForTimeout(DUR * 1000 + 400);
    await client.send('Page.stopScreencast');
    await ctx.close();

    buf.forEach((d, i) => fs.writeFileSync(path.join(frames, `f${String(i).padStart(4, '0')}.jpg`), Buffer.from(d, 'base64')));

    // assemble GIF: high-quality palette, scaled to W px
    const out = path.join(ROOT, 'dist', m.slug, 'card.gif');
    const ff = `ffmpeg -hide_banner -loglevel error -y -framerate ${Math.round(buf.length / DUR)} -i ${frames}/f%04d.jpg ` +
      `-vf "fps=${FPS},scale=${W}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=full[p];[s1][p]paletteuse=dither=sierra2_4a" ` +
      `-loop 0 "${out}"`;
    execSync(ff);
    const kb = Math.round(fs.statSync(out).size / 1024);
    console.log(`${m.slug}: ${buf.length} frames -> card.gif (${kb} KB)`);
  }
  await browser.close();
})();
