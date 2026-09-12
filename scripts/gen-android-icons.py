#!/usr/bin/env python3
"""Generate InterviewAce Android launcher icons + splash screens from public/icons/icon-512.png"""
from PIL import Image, ImageDraw, ImageOps
import os

SRC = '/home/z/my-project/public/icons/icon-512.png'
RES = '/home/z/my-project/android/app/src/main/res'
DARK = (15, 23, 42, 255)  # #0F172A

src = Image.open(SRC).convert('RGBA')
DENSITIES = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}


def rounded(im: Image.Image, radius_ratio: float = 0.18) -> Image.Image:
    """Apply rounded-corner mask (transparent outside)."""
    size = im.size[0]
    mask = Image.new('L', (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * radius_ratio), fill=255)
    out = im.copy()
    out.putalpha(mask)
    return out


def circular(im: Image.Image) -> Image.Image:
    size = im.size[0]
    mask = Image.new('L', (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([0, 0, size - 1, size - 1], fill=255)
    out = im.copy()
    out.putalpha(mask)
    return out


# 1. Legacy launcher icons (square rounded + round)
for dens, px in DENSITIES.items():
    folder = os.path.join(RES, f'mipmap-{dens}')
    base = src.resize((px, px), Image.LANCZOS)
    rounded(base).save(os.path.join(folder, 'ic_launcher.png'))
    circular(base).save(os.path.join(folder, 'ic_launcher_round.png'))

# 2. Adaptive foreground — icon at ~58% of canvas (safe zone = 66%)
for dens, px in DENSITIES.items():
    canvas_px = px * 2  # foreground canvases are 108dp vs 48dp launcher → bigger
    canvas = Image.new('RGBA', (canvas_px, canvas_px), (0, 0, 0, 0))
    inner = int(canvas_px * 0.58)
    icon = src.resize((inner, inner), Image.LANCZOS)
    off = (canvas_px - inner) // 2
    canvas.paste(icon, (off, off), icon)
    canvas.save(os.path.join(RES, f'mipmap-{dens}', 'ic_launcher_foreground.png'))

# 3. Adaptive background color → dark navy
with open(os.path.join(RES, 'values', 'ic_launcher_background.xml'), 'w') as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0F172A</color>\n</resources>\n')

# 4. Splash screens — dark bg + centered logo (25% of min dimension)
SPLASH_DIRS = {
    'drawable': (768, 1280),
    'drawable-port-mdpi': (480, 800), 'drawable-port-hdpi': (800, 1280),
    'drawable-port-xhdpi': (960, 1600), 'drawable-port-xxhdpi': (1440, 2560),
    'drawable-port-xxxhdpi': (1920, 3200),
    'drawable-land-mdpi': (800, 480), 'drawable-land-hdpi': (1280, 800),
    'drawable-land-xhdpi': (1600, 960), 'drawable-land-xxhdpi': (2560, 1440),
    'drawable-land-xxxhdpi': (3200, 1920),
}
for folder, (w, h) in SPLASH_DIRS.items():
    path = os.path.join(RES, folder, 'splash.png')
    if not os.path.exists(path):
        continue
    bg = Image.new('RGBA', (w, h), DARK)
    side = min(w, h)
    icon_px = int(side * 0.22)
    icon = src.resize((icon_px, icon_px), Image.LANCZOS)
    # rounded corners for the splash logo too
    icon = rounded(icon, 0.22)
    bg.paste(icon, ((w - icon_px) // 2, (h - icon_px) // 2), icon)
    bg.convert('RGB').save(path, 'PNG')

print('ICONS_AND_SPLASH_GENERATED')
