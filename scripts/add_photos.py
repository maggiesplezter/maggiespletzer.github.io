#!/usr/bin/env python3
"""Import photos into the site.

1. Export your photos (JPEG, PNG, TIFF or WebP) at any size.
2. Drop them into _photos-inbox/<gallery>/, e.g. _photos-inbox/cyanotypes/.
   Gallery ids are listed in _data/galleries.yml.
3. Run:  python3 scripts/add_photos.py

For each photo this:
  - rotates it upright and strips camera metadata (including GPS location),
    keeping the color profile;
  - saves a web-sized copy (2400 px long edge) to assets/photos/<gallery>/
    and a thumbnail (800 px) to assets/photos/<gallery>/thumbs/;
  - adds an entry to _data/photos.yml with the date the photo was taken
    (from the camera, or the file's date if there isn't one);
  - moves the original to _photos-inbox/_imported/<gallery>/.

Then edit _data/photos.yml to give each photo a title and alt text.

It also creates any missing thumbnails for photos already on the site.
Needs Pillow:  python3 -m pip install --user Pillow
"""
import datetime as dt
import pathlib
import re
import shutil
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is needed. Install it with:\n  python3 -m pip install --user Pillow")

ROOT = pathlib.Path(__file__).resolve().parent.parent
INBOX = ROOT / "_photos-inbox"
PHOTOS = ROOT / "assets" / "photos"
DATA = ROOT / "_data" / "photos.yml"
GALLERIES = ROOT / "_data" / "galleries.yml"

FULL_EDGE = 2400   # long edge of the full-size copy shown in the lightbox
THUMB_EDGE = 800   # long edge of grid thumbnails
QUALITY = 82
EXTS = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp"}


def slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s or "photo"


def taken_date(img: Image.Image, src: pathlib.Path) -> dt.date:
    try:
        exif = img.getexif()
        raw = exif.get_ifd(0x8769).get(0x9003) or exif.get(0x0132)  # DateTimeOriginal / DateTime
        if raw:
            return dt.datetime.strptime(str(raw)[:19], "%Y:%m:%d %H:%M:%S").date()
    except Exception:
        pass
    return dt.date.fromtimestamp(src.stat().st_mtime)


def save_resized(img: Image.Image, edge: int, dest: pathlib.Path, icc) -> None:
    out = img.copy()
    out.thumbnail((edge, edge), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    kwargs = {"quality": QUALITY, "optimize": True, "progressive": True}
    if icc:
        kwargs["icc_profile"] = icc
    out.save(dest, "JPEG", **kwargs)  # no exif passed → metadata stripped


def to_rgb(img: Image.Image) -> Image.Image:
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        bg = Image.new("RGB", img.size, (245, 239, 227))  # crème
        bg.paste(img, mask=img.split()[-1])
        return bg
    return img.convert("RGB")


def main() -> None:
    gallery_ids = re.findall(r"^- id:\s*(\S+)", GALLERIES.read_text(), re.M)
    text = DATA.read_text()
    known = {(g, f.strip()) for g, f in re.findall(r"gallery:\s*(\S+)\s*\n\s*file:\s*(.+)", text)}
    entries = []

    for gid in gallery_ids:
        folder = INBOX / gid
        folder.mkdir(parents=True, exist_ok=True)
        for src in sorted(folder.iterdir()):
            if not src.is_file() or src.suffix.lower() not in EXTS:
                continue
            with Image.open(src) as im:
                date = taken_date(im, src)
                icc = im.info.get("icc_profile")
                img = to_rgb(ImageOps.exif_transpose(im))

            base = slugify(src.stem)
            name, n = f"{base}.jpg", 2
            while (PHOTOS / gid / name).exists() or (gid, name) in known:
                name, n = f"{base}-{n}.jpg", n + 1

            save_resized(img, FULL_EDGE, PHOTOS / gid / name, icc)
            save_resized(img, THUMB_EDGE, PHOTOS / gid / "thumbs" / name, icc)
            known.add((gid, name))
            entries.append(
                f"- gallery: {gid}\n  file: {name}\n  title: Untitled\n  alt: \n  date: {date.isoformat()}\n"
            )

            done = INBOX / "_imported" / gid
            done.mkdir(parents=True, exist_ok=True)
            shutil.move(str(src), done / src.name)
            print(f"  + {gid}/{name}  ({date})")

    # Thumbnails for photos added by hand
    made = 0
    for gid in gallery_ids:
        for f in sorted((PHOTOS / gid).glob("*")):
            thumb = PHOTOS / gid / "thumbs" / f.name
            if f.is_file() and f.suffix.lower() in EXTS and not thumb.exists():
                with Image.open(f) as im:
                    icc = im.info.get("icc_profile")
                    save_resized(to_rgb(ImageOps.exif_transpose(im)), THUMB_EDGE, thumb, icc)
                made += 1

    if entries:
        with DATA.open("a") as fh:
            if not text.endswith("\n"):
                fh.write("\n")
            fh.write("".join(entries))
    print(f"Imported {len(entries)} photo(s); made {made} missing thumbnail(s).")
    if entries:
        print("Now give them titles and alt text in _data/photos.yml.")


if __name__ == "__main__":
    main()
