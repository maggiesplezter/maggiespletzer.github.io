# Maggie Spletzer — photographer // engineer

Personal site for photography and software. Built with [Jekyll](https://jekyllrb.com/),
deployed to GitHub Pages by GitHub Actions, served through Cloudflare.

Originally adapted from
[ryanspletzer/ryanspletzer.github.io](https://github.com/ryanspletzer/ryanspletzer.github.io)
(CC BY 4.0) — Jekyll setup and deploy workflow.

Design: crème background, cyanotype Prussian-blue accents, fixed left sidebar
(mark, name, social icons) with the page scrolling on the right; compact top bar
with a menu on phones.

Bundled assets: Cormorant Garamond and Work Sans fonts (SIL Open Font License,
see `assets/fonts/`); GitHub, Instagram and LinkedIn icons from Font Awesome Free
(CC BY 4.0, https://fontawesome.com).

## What's where

| You want to…                         | Edit                                             |
| ------------------------------------ | ------------------------------------------------ |
| Change name, tagline, social links   | `_config.yml`                                    |
| Change the mark (sidebar icon)       | replace `assets/images/mark.jpg` (any square image; or set `mark` in `_config.yml`) |
| Change where the GitHub menu links   | `github_user` in `_config.yml`                   |
| Add / rename / reorder galleries     | `_data/galleries.yml` (+ a page in `gallery/`)   |
| Add photos                           | `assets/photos/<gallery>/` + `_data/photos.yml`  |
| Pick the link-preview photo          | `featured: true` in `_data/photos.yml` (first one wins) |
| Write the About blurb / portrait     | `about.md`, `assets/photos/about/self-portrait.jpg` |
| Colors and fonts                     | `_sass/variables.scss`                           |

Pages: `index.html` (home: every photo, types mixed), `gallery/` (one page per
gallery), `about.md`. The **github** menu item links straight to your GitHub profile.

## Adding photos

Photos live in this repo, resized for the web. Keep your full-resolution
originals in your own photo library or backup; the repo only holds web copies.

1. Export photos from your editor as JPEG (or PNG/TIFF/WebP), any size.
2. Drop them into `_photos-inbox/<gallery>/`, e.g. `_photos-inbox/cyanotypes/`
   (gallery ids are in `_data/galleries.yml`). This folder is never committed.
3. Run:

   ```sh
   python3 scripts/add_photos.py
   ```

   For each photo it makes a 2400 px web copy and an 800 px thumbnail in
   `assets/photos/<gallery>/`, strips camera metadata (including GPS location),
   reads the date it was taken, adds an entry to `_data/photos.yml`, and moves
   the original to `_photos-inbox/_imported/`.
4. In `_data/photos.yml`, give each new photo a `title` and `alt` text.
5. Check it with `bash scripts/serve.sh`, then commit and push.

Photos are shown in a masonry grid, each keeping its own shape. The **home
page** mixes the types in a fixed order — the newest of each type in turn
(Digital, Caffenol, Polaroid Lifts, Cyanotypes), then the next newest,
and so on. The **gallery** menu drops down to one page per type, newest first.
Change a photo's `date` to move it in either order.
To remove a photo, delete its entry in `_data/photos.yml` and its two files
(`assets/photos/<gallery>/<file>` and `.../thumbs/<file>`).

At ~400 KB per photo plus thumbnail, the repo can hold a couple of thousand
photos before nearing GitHub Pages' 1 GB limit.

To add a gallery type, add an entry to `_data/galleries.yml` and copy any file
in `gallery/` to `gallery/<id>.md`, changing `title`, `gallery` and `permalink`.

## Run it locally

On a Mac, run this once (it installs Ruby and the gems, builds, checks links,
then serves the site):

```sh
bash scripts/setup-mac.sh
```

After that, `bash scripts/serve.sh` serves it at http://localhost:4000 and
reloads the page whenever you save a file. Ctrl+C stops it.

## One-time setup

### 1. Create the org and repo

1. On GitHub: your avatar → **Your organizations** → **New organization** → Free.
   Pick the org name (e.g. `maggiespletzer`).
2. In the org, create a **public** repo named exactly `<org>.github.io`
   (e.g. `maggiespletzer.github.io`). That name makes it the org's root site.
3. Push this folder:

   ```sh
   git init -b main
   git add .
   git commit -m "Initial site"
   git remote add origin https://github.com/<org>/<org>.github.io.git
   git push -u origin main
   ```

### 2. Turn on GitHub Pages

1. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. The **Deploy Jekyll site to Pages** workflow runs on every push to `main`
   (check the **Actions** tab). When it's green the site is live at
   `https://<org>.github.io`.
3. Fill in `_config.yml`: the Instagram and LinkedIn `links`, and `url`.

### 3. Custom domain through Cloudflare

Assumes the domain is already added to Cloudflare (Cloudflare is its DNS).

1. **Verify the domain for the org** (stops anyone else's Pages site claiming it):
   Org → **Settings → Pages → Add a domain**, enter `yourdomain.com`. GitHub shows
   a TXT record; add it in Cloudflare → **DNS → Records**, then click **Verify**.
2. **Add DNS records in Cloudflare**, with Proxy status set to **DNS only**
   (grey cloud) for now:

   | Type  | Name  | Content                |
   | ----- | ----- | ---------------------- |
   | A     | `@`   | `185.199.108.153`      |
   | A     | `@`   | `185.199.109.153`      |
   | A     | `@`   | `185.199.110.153`      |
   | A     | `@`   | `185.199.111.153`      |
   | AAAA  | `@`   | `2606:50c0:8000::153`  |
   | AAAA  | `@`   | `2606:50c0:8001::153`  |
   | AAAA  | `@`   | `2606:50c0:8002::153`  |
   | AAAA  | `@`   | `2606:50c0:8003::153`  |
   | CNAME | `www` | `<org>.github.io`      |

3. Repo → **Settings → Pages → Custom domain**: enter `www.yourdomain.com`
   (or the bare domain if you prefer), **Save**, wait for the DNS check to pass,
   then tick **Enforce HTTPS** once it becomes available (can take up to ~1 hour
   while GitHub issues the certificate). GitHub redirects the other form
   (bare ↔ www) automatically.
4. Set `url: https://www.yourdomain.com` in `_config.yml` and push.
5. **Optional — Cloudflare proxy/CDN:** after HTTPS works, you can switch the
   records to **Proxied** (orange cloud). If you do, set Cloudflare
   **SSL/TLS → Overview** to **Full (strict)**; the "Flexible" mode causes a
   redirect loop with Enforce HTTPS. If GitHub later reports certificate
   problems, flip the records back to DNS only until it renews.

No `CNAME` file is needed: with the GitHub Actions deploy, the custom domain is
stored in the repo's Pages settings.
