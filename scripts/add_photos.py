#!/usr/bin/env python3
"""Add any new photos under assets/photos/<gallery>/ to _data/photos.yml.

Usage (from the repo root):
    python3 scripts/add_photos.py

Existing entries are left alone; new files are appended with title "Untitled"
so you can edit the title/alt/featured fields afterwards. Galleries come from
_data/galleries.yml. Needs no packages beyond Python 3.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PHOTOS = ROOT / "assets" / "photos"
DATA = ROOT / "_data" / "photos.yml"
GALLERIES = ROOT / "_data" / "galleries.yml"
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}

gallery_ids = re.findall(r"^- id:\s*(\S+)", GALLERIES.read_text(), re.M)
text = DATA.read_text()
known = set(re.findall(r"gallery:\s*(\S+)\s*\n\s*file:\s*(.+)", text))
known = {(g, f.strip()) for g, f in known}

added = []
for gid in gallery_ids:
    folder = PHOTOS / gid
    if not folder.is_dir():
        continue
    for f in sorted(folder.iterdir()):
        if f.suffix.lower() in EXTS and (gid, f.name) not in known:
            added.append(f"- gallery: {gid}\n  file: {f.name}\n  title: Untitled\n  alt: \n")

if added:
    with DATA.open("a") as fh:
        if not text.endswith("\n"):
            fh.write("\n")
        fh.write("".join(added))
    print(f"Added {len(added)} photo(s) to {DATA.relative_to(ROOT)} — fill in their titles and alt text.")
else:
    print("No new photos found.")
