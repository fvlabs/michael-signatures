#!/usr/bin/env python3
"""Recolour the reference social icons to slashdev blue on transparency.

The reference GIFs (assets/ic-vendor-*.gif) are black glyphs sitting on a white
plate that is baked into the pixels — every frame after the first is ~77% opaque
white, with only the outer corners transparent. That plate is why they render as
white boxes on any card the mail client has darkened, and it cannot be styled
away from the markup side.

This keeps their glyph shapes and their animation, and rewrites the pixels:
luminance becomes alpha (black -> opaque, white -> transparent) and every visible
pixel is painted #215ff6. Output goes to assets/ic-blue-*.gif.

GIF alpha is 1-bit, so the antialiased edge has to be thresholded; the source is
133-140px wide and displays at 24px, so the browser's downscale hides the step.

Run: python3 src/recolor-icons.py
"""
import os
import subprocess
import tempfile
from PIL import Image

BLUE = (0x21, 0x5F, 0xF6)
HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets')
ICONS = ['web', 'linkedin', 'instagram']
FPS = 1000 / 30          # source frames are 30ms each


def recolour(name):
    src = os.path.join(ASSETS, f'ic-vendor-{name}.gif')
    out = os.path.join(ASSETS, f'ic-blue-{name}.gif')
    im = Image.open(src)
    with tempfile.TemporaryDirectory() as tmp:
        for i in range(im.n_frames):
            im.seek(i)
            rgba = im.convert('RGBA')
            w, h = rgba.size
            px = rgba.load()
            flat = Image.new('RGBA', (w, h), (0, 0, 0, 0))
            fp = flat.load()
            for x in range(w):
                for y in range(h):
                    r, g, b, a = px[x, y]
                    if a < 8:
                        continue                      # already transparent
                    lum = (r * 299 + g * 587 + b * 114) // 1000
                    alpha = 255 - lum                 # ink -> opaque, plate -> clear
                    if alpha > 8:
                        fp[x, y] = (*BLUE, alpha)
            flat.save(os.path.join(tmp, f'f{i:04d}.png'))
        vf = ('split[s0][s1];[s0]palettegen=max_colors=64:stats_mode=full:'
              'reserve_transparent=1[p];[s1][p]paletteuse=dither=none:alpha_threshold=128')
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
                        '-framerate', f'{FPS:.4f}', '-i', os.path.join(tmp, 'f%04d.png'),
                        '-vf', vf, '-loop', '0', out], check=True)
    kb_in = os.path.getsize(src) // 1024
    kb_out = os.path.getsize(out) // 1024
    print(f'ic-blue-{name}.gif: {im.n_frames} frames, {kb_in} KB -> {kb_out} KB')


if __name__ == '__main__':
    for n in ICONS:
        recolour(n)
