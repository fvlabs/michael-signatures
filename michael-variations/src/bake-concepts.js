/* Bakes the concept animation templates into seamless-loop GIFs.
   Unlike the screencast approach in system/render-gif.js, this pauses every
   CSS animation and steps currentTime frame-by-frame, so the loop is exact.
   Run: NODE_PATH=$HOME/.local/lib/node_modules node src/bake-concepts.js */
const { chromium } = require('playwright-core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const C = path.join(__dirname, 'concepts');
const OUT = path.join(ROOT, 'assets');
const TMP = '/tmp/concept-frames';

const jobs = [
  { file: 'orbit.html',    out: 'avatar-orbit.gif',  fps: 16 },
  { file: 'radar.html',    out: 'avatar-radar.gif',  fps: 16 },
  { file: 'spin.html',     out: 'avatar-spin.gif',   fps: 16 },
  { file: 'typename.html', out: 'name-type.gif',     fps: 14 },
  { file: 'flowrule.html', out: 'flow-rule.gif',     fps: 16 },
  { file: 'drawrule.html', out: 'draw-rule.gif',     fps: 16 },
  { file: 'lineicons.html', out: 'ic-line-phone.gif', fps: 16, query: '?icon=phone' },
  { file: 'lineicons.html', out: 'ic-line-mail.gif',  fps: 16, query: '?icon=mail' },
  { file: 'lineicons.html', out: 'ic-line-pin.gif',   fps: 16, query: '?icon=pin' },
  { file: 'neon.html',     out: 'ic-neon-phone.gif', fps: 16, query: '?icon=phone' },
  { file: 'neon.html',     out: 'ic-neon-mail.gif',  fps: 16, query: '?icon=mail' },
  { file: 'neon.html',     out: 'ic-neon-pin.gif',   fps: 16, query: '?icon=pin' },
  { file: 'wave.html',     out: 'wave.gif',          fps: 16 },
  { file: 'sweepname.html', out: 'name-sweep.gif',   fps: 16 },
  { file: 'sweepcard.html', out: 'card-sweep.gif',   fps: 12 },
];

(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--force-color-profile=srgb', '--hide-scrollbars'] });
  for (const j of jobs) {
    const url = 'file://' + path.join(C, j.file) + (j.query || '');
    // read viewport + period from the template's data attributes
    const probe = await b.newPage();
    await probe.goto(url);
    const meta = await probe.evaluate(() => ({
      w: +document.body.dataset.w, h: +document.body.dataset.h, period: +document.body.dataset.period,
    }));
    await probe.close();

    const ctx = await b.newContext({ viewport: { width: meta.w, height: meta.h }, deviceScaleFactor: 2 });
    const pg = await ctx.newPage();
    await pg.goto(url, { waitUntil: 'networkidle' });
    await pg.waitForTimeout(500); // fonts/images settle

    const frames = Math.round(meta.period / 1000 * j.fps);
    const dir = path.join(TMP, j.out.replace(/\.gif$/, ''));
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });

    for (let i = 0; i < frames; i++) {
      const t = i * meta.period / frames;
      await pg.evaluate((t) => {
        document.getAnimations({ subtree: true }).forEach(a => { a.pause(); a.currentTime = t; });
      }, t);
      await pg.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.png`) });
    }
    await ctx.close();

    const out = path.join(OUT, j.out);
    execSync(`ffmpeg -hide_banner -loglevel error -y -framerate ${j.fps} -i ${dir}/f%04d.png ` +
      `-vf "scale=${meta.w}:${meta.h}:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=full[p];[s1][p]paletteuse=dither=sierra2_4a" ` +
      `-loop 0 "${out}"`);
    console.log(`${j.out}: ${frames} frames, ${meta.w}x${meta.h} -> ${Math.round(fs.statSync(out).size / 1024)} KB`);
  }
  await b.close();
})();
