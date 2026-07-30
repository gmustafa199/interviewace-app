"""
Generate all PWA + Android TWA icons from the existing logo.svg.

Icons produced (all required by Google Play + Chrome PWA):
  - icon-192.png         (Chrome PWA standard)
  - icon-512.png         (Chrome PWA standard)
  - icon-maskable-192.png (Android adaptive icon - with safe padding)
  - icon-maskable-512.png (Android adaptive icon - with safe padding)
  - icon-mono-512.png     (Android monochrome)
  - favicon-32.png
  - favicon-16.png
  - apple-touch-icon.png (180x180)

Uses cairosvg to render SVG -> PNG at various sizes.
For maskable icons, draws the logo centered on a brand-color background
with ~10% safe padding so Android's adaptive cropping doesn't clip.
"""

import os
import subprocess
from pathlib import Path

PUBLIC_DIR = Path("/home/z/my-project/public")
ICONS_DIR = PUBLIC_DIR / "icons"
SVG_PATH = PUBLIC_DIR / "logo.svg"

BRAND_BG = "#0F172A"   # slate-900 (matches app theme)
BRAND_FG = "#FFFFFF"

ICONS = [
    # (filename, size, maskable, background)
    ("icon-192.png",         192, False, None),
    ("icon-512.png",         512, False, None),
    ("icon-maskable-192.png", 192, True,  BRAND_BG),
    ("icon-maskable-512.png", 512, True,  BRAND_BG),
    ("icon-mono-512.png",    512, False, None),   # recolored white
    ("favicon-16.png",        16, False, None),
    ("favicon-32.png",        32, False, None),
    ("apple-touch-icon.png", 180, False, None),
]

def ensure_cairosvg():
    try:
        import cairosvg
        return True
    except ImportError:
        print("Installing cairosvg...")
        subprocess.run(["pip", "install", "--quiet", "cairosvg", "Pillow"],
                       check=True)
        return True

def make_icon(name: str, size: int, maskable: bool, bg_color):
    """Render SVG to PNG. For maskable, compose on colored background."""
    import cairosvg
    from PIL import Image

    out_path = ICONS_DIR / name
    ICONS_DIR.mkdir(parents=True, exist_ok=True)

    if maskable and bg_color:
        # For maskable: render logo at ~70% size, center on solid bg.
        # 10% safe-zone padding all around (Google's maskable spec).
        canvas = Image.new("RGBA", (size, size), bg_color)
        logo_size = int(size * 0.70)
        logo_png = cairosvg.svg2png(
            url=str(SVG_PATH),
            output_width=logo_size,
            output_height=logo_size,
        )
        import io
        logo_img = Image.open(io.BytesIO(logo_png)).convert("RGBA")
        offset = ((size - logo_size) // 2, (size - logo_size) // 2)
        canvas.paste(logo_img, offset, logo_img)
        canvas.save(out_path, "PNG")
    else:
        cairosvg.svg2png(
            url=str(SVG_PATH),
            write_to=str(out_path),
            output_width=size,
            output_height=size,
        )

    print(f"  ✓ {name} ({size}x{size}{' maskable' if maskable else ''})")

def main():
    print("Generating PWA + Android TWA icons...")
    ensure_cairosvg()
    for name, size, maskable, bg in ICONS:
        try:
            make_icon(name, size, maskable, bg)
        except Exception as e:
            print(f"  ✗ {name} failed: {e}")

    print(f"\nDone. Icons saved to {ICONS_DIR}")
    # List final output
    for f in sorted(ICONS_DIR.iterdir()):
        st = f.stat()
        print(f"  {f.name:30s}  {st.st_size:>7,} bytes")

if __name__ == "__main__":
    main()
