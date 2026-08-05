/* Bakes the light-theme tiles into seamless-loop GIFs (white background).
   Same technique as michael-variations/src/bake-concepts.js: pause every CSS
   animation and step currentTime frame-by-frame so the loop closes exactly.
   Run: NODE_PATH=$HOME/.local/lib/node_modules node src/bake.js */
const { chromium } = require('playwright-core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const T = path.join(__dirname, 'tiles');
const OUT = path.join(ROOT, 'assets');
const TMP = '/tmp/light-frames';

/* scale = deviceScaleFactor: the GIF is baked at scale× and displayed at 1×,
   so the glyphs stay crisp on high-DPI mail clients. */
/* No avatar jobs: the portrait is a static circular PNG generated straight from
   the source photo (see the round_avatar step in git history), because the
   rotating ring is gone. avatar.html and the baked ring GIFs are kept — the GIFs
   because signatures already pasted into Gmail still reference them. */
const jobs = [
  /* slot = position in the cascade. Both icon sets share web (1) and linkedin (2);
     x/github and instagram/facebook are the interchangeable 3rd and 4th. */
  { file: 'social.html', out: 'ic-web.gif',       fps: 12, scale: 3, query: '?icon=web&slot=1' },
  { file: 'social.html', out: 'ic-linkedin.gif',  fps: 12, scale: 3, query: '?icon=linkedin&slot=2' },
  { file: 'social.html', out: 'ic-x.gif',         fps: 12, scale: 3, query: '?icon=x&slot=3' },
  { file: 'social.html', out: 'ic-github.gif',    fps: 12, scale: 3, query: '?icon=github&slot=4' },
  { file: 'social.html', out: 'ic-instagram.gif', fps: 12, scale: 3, query: '?icon=instagram&slot=3' },
  { file: 'social.html', out: 'ic-facebook.gif',  fps: 12, scale: 3, query: '?icon=facebook&slot=4' },
  { file: 'badge.html',  out: 'badge-verified.gif', fps: 12, scale: 3 },
  { file: 'logo.html',   out: 'logo-shine.gif',  fps: 12 },

  /* ---- dark-mode test variants (see src/build.js THEMES) ----
     -d = baked on #070a14, -t = baked on transparency. */
  { file: 'social.html', out: 'ic-dark-web.gif',       fps: 12, scale: 3, query: '?icon=web&slot=1&theme=dark' },
  { file: 'social.html', out: 'ic-dark-linkedin.gif',  fps: 12, scale: 3, query: '?icon=linkedin&slot=2&theme=dark' },
  { file: 'social.html', out: 'ic-dark-instagram.gif', fps: 12, scale: 3, query: '?icon=instagram&slot=3&theme=dark' },
  { file: 'badge.html',  out: 'badge-verified-d.gif',  fps: 12, scale: 3, query: '?theme=dark' },
  { file: 'logo.html',   out: 'logo-shine-d.gif',      fps: 12, query: '?theme=dark' },

  { file: 'badge.html',  out: 'badge-verified-t.gif',  fps: 12, scale: 3, query: '?theme=none', alpha: true },
  { file: 'logo.html',   out: 'logo-shine-t.gif',      fps: 12, query: '?theme=none', alpha: true },

  /* theme-agnostic (-a): transparent, and every colour chosen to read on white
     and on dark. This is the combination that survives Gmail's inverter. */
  { file: 'social.html', out: 'ic-agn-web.gif',       fps: 12, scale: 3, query: '?icon=web&slot=1&theme=agnostic', alpha: true },
  { file: 'social.html', out: 'ic-agn-linkedin.gif',  fps: 12, scale: 3, query: '?icon=linkedin&slot=2&theme=agnostic', alpha: true },
  { file: 'social.html', out: 'ic-agn-instagram.gif', fps: 12, scale: 3, query: '?icon=instagram&slot=3&theme=agnostic', alpha: true },
  { file: 'logo.html',   out: 'logo-shine-a.gif',     fps: 12, query: '?theme=agnostic', alpha: true },
  { file: 'logo.html',   out: 'logo-shine-k.gif',     fps: 12, query: '?theme=black', alpha: true },
  { file: 'logo.html',   out: 'logo-shine-ko.gif',    fps: 12, scale: 3, query: '?theme=blackout', alpha: true },
  { file: 'logo.html',   out: 'logo-slash-in.gif',    fps: 16, scale: 3, query: '?theme=slidein', alpha: true },
];

/* optional filter: `node src/bake.js -t` bakes only jobs whose output matches */
const only = process.argv.slice(2).filter(a => !a.startsWith('--'));
const selected = only.length ? jobs.filter(j => only.some(o => j.out.includes(o))) : jobs;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  if (only.length) console.log(`baking ${selected.length}/${jobs.length} jobs matching ${only.join(', ')}`);
  const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--force-color-profile=srgb', '--hide-scrollbars'] });
  for (const j of selected) {
    const url = 'file://' + path.join(T, j.file) + (j.query || '');
    const probe = await b.newPage();
    await probe.goto(url);
    const meta = await probe.evaluate(() => ({
      w: +document.body.dataset.w, h: +document.body.dataset.h, period: +document.body.dataset.period,
    }));
    await probe.close();

    const dsf = j.scale || 2;
    const ctx = await b.newContext({ viewport: { width: meta.w, height: meta.h }, deviceScaleFactor: dsf });
    const pg = await ctx.newPage();
    await pg.goto(url, { waitUntil: 'networkidle' });
    // the photo can be swapped in by script, so wait for real decode, not just idle
    await pg.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0));
    await pg.waitForTimeout(400); // fonts settle

    const frames = Math.round(meta.period / 1000 * j.fps);
    const dir = path.join(TMP, j.out.replace(/\.gif$/, ''));
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });

    for (let i = 0; i < frames; i++) {
      const t = i * meta.period / frames;
      await pg.evaluate((t) => {
        document.getAnimations({ subtree: true }).forEach(a => { a.pause(); a.currentTime = t; });
      }, t);
      await pg.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.png`), omitBackground: !!j.alpha });
    }
    await ctx.close();

    // keep the retina frames: emit at 2x and display at 1x in the signature
    const out = path.join(OUT, j.out);
    /* GIF alpha is 1-bit, so transparent bakes reserve a palette slot and skip
       dithering — dithering an alpha edge produces speckle. */
    const filter = j.alpha
      ? 'split[s0][s1];[s0]palettegen=max_colors=200:stats_mode=full:reserve_transparent=1[p];[s1][p]paletteuse=dither=none:alpha_threshold=128'
      : 'split[s0][s1];[s0]palettegen=max_colors=200:stats_mode=full[p];[s1][p]paletteuse=dither=sierra2_4a';
    execSync(`ffmpeg -hide_banner -loglevel error -y -framerate ${j.fps} -i ${dir}/f%04d.png ` +
      `-vf "${filter}" -loop 0 "${out}"`);
    console.log(`${j.out}: ${frames} frames, ${meta.w * dsf}x${meta.h * dsf} -> ${Math.round(fs.statSync(out).size / 1024)} KB`);
  }
  await b.close();
})();
