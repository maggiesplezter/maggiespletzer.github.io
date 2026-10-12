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
| Swap in your own mark (sidebar icon) | replace `assets/images/mark.svg` (or set `mark` in `_config.yml`) |
| Change which GitHub repos are listed | `github_user` in `_config.yml`                   |
| Add / rename / reorder galleries     | `_data/galleries.yml` (+ a page in `gallery/`)   |
| Add photos                           | `assets/photos/<gallery>/` + `_data/photos.yml`  |
| Pick photos for the home page feed   | `featured: true` in `_data/photos.yml`           |
| Write the About blurb / portrait     | `about.md`, `assets/photos/about/self-portrait.jpg` |
| Colors and fonts                     | `_sass/variables.scss`                           |

Pages: `index.html` (home feed of featured photos), `gallery/` (one page per
gallery), `about.md`, `github.html` (lists your public repos live from GitHub).

## Adding photos

1. Export each photo at about 2000–2500 px on the long edge, JPEG quality ~80
   (keeps pages fast and the repo small — GitHub Pages sites cap at 1 GB).
2. Drop the files into the matching folder, e.g. `assets/photos/cyanotypes/`.
3. Run `python3 scripts/add_photos.py` — it appends any new files to
   `_data/photos.yml`.
4. In `_data/photos.yml`, give each one a `title`, an `alt` description, and
   `featured: true` if it should appear in the home page feed.
5. Delete the `placeholder-*.jpg` files and their entries once you have real ones.

To add a gallery, add an entry to `_data/galleries.yml`, create the folder
`assets/photos/<id>/`, and copy any file in `gallery/` to `gallery/<id>.md`,
changing `title`, `gallery` and `permalink`.

## Run it locally

Needs Ruby 3.4 (see `.ruby-version`).

```sh
bundle install
bundle exec jekyll serve
# open http://localhost:4000
```

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
3. Fill in `_config.yml`: `github_user`, the three `links`, and `url`.

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
