#!/usr/bin/env python3
"""Turn a source photo into the circular portrait the signature uses.

Output is a static PNG rather than a GIF on purpose: PNG alpha is 8-bit, so the
circle edge is properly antialiased, and one file then works on any background —
white card, dark card, or whatever a mail client's dark mode paints. (The earlier
rotating-ring GIF needed a separate bake per background and its 1-bit alpha
chopped the ring into an arc.)

Crops are per-person because the source photos are framed differently; the aim is
to match head-and-shoulders framing across the team.

Run: python3 src/round-avatar.py [name ...]      (default: everyone)
"""
import os
import sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets')
TILES = os.path.join(HERE, 'tiles')
SIZE = 264            # 2x the 132px display size
SS = 4                # mask supersampling

# name -> (source file, crop box or None for centre-square)
PEOPLE = {
    'michael': (os.path.join(TILES, 'michael.png'), None),
    'kevin': (os.path.join(TILES, 'kevin.png'), None),
}


def build(name):
    src, box = PEOPLE[name]
    im = Image.open(src).convert('RGB')
    if box:
        im = im.crop(box)
    s = min(im.size)
    im = im.crop(((im.size[0] - s) // 2, (im.size[1] - s) // 2,
                  (im.size[0] + s) // 2, (im.size[1] + s) // 2))
    big = im.resize((SIZE * SS, SIZE * SS), Image.LANCZOS)
    mask = Image.new('L', (SIZE * SS, SIZE * SS), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, SIZE * SS - 1, SIZE * SS - 1), fill=255)
    out_im = big.resize((SIZE, SIZE), Image.LANCZOS)
    out_im.putalpha(mask.resize((SIZE, SIZE), Image.LANCZOS))
    out = os.path.join(ASSETS, f'avatar-{name}-round.png')
    out_im.save(out, optimize=True)
    print(f'avatar-{name}-round.png: {SIZE}x{SIZE}  {os.path.getsize(out) // 1024} KB')


if __name__ == '__main__':
    for n in (sys.argv[1:] or PEOPLE):
        build(n)
