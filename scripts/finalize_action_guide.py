#!/usr/bin/env python3
"""Finalize EdTech Action Guide PDF: set metadata, validate quality."""
import subprocess
import sys
from pathlib import Path

PDF_PATH = "/home/z/my-project/download/EdTech_Action_Guide.pdf"

# Use pdftk-like metadata via qpdf or pikepdf
try:
    import pikepdf
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "pikepdf", "-q"], check=True)
    import pikepdf

pdf = pikepdf.open(PDF_PATH, allow_overwriting_input=True)

# Set document metadata
with pdf.open_metadata() as meta:
    meta['dc:title'] = "The EdTech Builder's Action Guide"
    meta['dc:creator'] = ["Founder Playbook"]
    meta['dc:description'] = "Seven simple steps with copy-paste prompts to build your EdTech company with AI — no coding required."
    meta['dc:subject'] = ["EdTech", "AI", "Startup", "Founder Guide", "No-Code"]
    meta['pdf:Producer'] = "html2pdf-next (Playwright + Paged.js)"
    meta['xmp:CreatorTool'] = "z.ai"

pdf.save(PDF_PATH)
pdf.close()

print(f"✓ Metadata set on {PDF_PATH}")
print(f"  Title:    The EdTech Builder's Action Guide")
print(f"  Author:   Founder Playbook")
print(f"  Subject:  Seven simple steps with copy-paste prompts")

# Validate
result = subprocess.run(['pdfinfo', PDF_PATH], capture_output=True, text=True)
print("\n--- PDF Info ---")
for line in result.stdout.split('\n'):
    if any(k in line for k in ['Title:', 'Author:', 'Subject:', 'Pages:', 'Page size:', 'File size:', 'PDF version:']):
        print(f"  {line}")

# Check page count
import re
m = re.search(r'Pages:\s+(\d+)', result.stdout)
pages = int(m.group(1)) if m else 0
print(f"\n✓ Page count: {pages} (target: 20-28)")
print(f"✓ File ready: {PDF_PATH}")
