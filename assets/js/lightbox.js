// Lightbox for any link with .photo-link inside a [data-lightbox-group].
// Shows the photo full size with no caption. No dependencies.
//
// The previous, current and next photos sit side by side on a track, so a
// swipe (or arrow press) slides the next photo in immediately. Each slot shows
// the grid thumbnail the browser already has, then swaps to the full-size file
// once it has downloaded and decoded.
//
// Desktop: arrow buttons / arrow keys. Touch: swipe left/right, swipe down to close.
(() => {
  const links = [...document.querySelectorAll('[data-lightbox-group] .photo-link')];
  if (!links.length) return;

  const dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.setAttribute('aria-label', 'Photo viewer');
  dlg.innerHTML = `
    <div class="lb-track">
      <div class="lb-slide"><img alt="" draggable="false"></div>
      <div class="lb-slide"><img alt="" draggable="false"></div>
      <div class="lb-slide"><img alt="" draggable="false"></div>
    </div>
    <button type="button" class="lb-btn lb-prev" aria-label="Previous photo">&larr;</button>
    <button type="button" class="lb-btn lb-next" aria-label="Next photo">&rarr;</button>
    <button type="button" class="lb-btn lb-close" aria-label="Close">&times;</button>`;
  document.body.appendChild(dlg);

  const track = dlg.querySelector('.lb-track');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SLIDE_MS = reduceMotion ? 0 : 280;
  let group = [];
  let i = 0;
  let busy = false;

  const wrap = k => (k % group.length + group.length) % group.length;
  const slides = () => [...track.children];            // [prev, current, next]

  // Put photo k into a slide: thumbnail first (already cached), then full size.
  const fill = (slide, k) => {
    const a = group[wrap(k)];
    const img = slide.querySelector('img');
    const thumb = a.querySelector('img');
    slide.dataset.k = String(wrap(k));
    img.alt = thumb?.alt ?? '';
    if (img.dataset.full === a.href) return;           // already showing this photo
    img.dataset.full = a.href;
    img.src = thumb?.currentSrc || thumb?.src || a.href;
    const full = new Image();
    full.src = a.href;
    (full.decode ? full.decode() : Promise.resolve()).catch(() => {}).then(() => {
      if (img.dataset.full === a.href) img.src = a.href;   // still the same photo?
    });
  };

  const setTrack = (px, y = 0, animate = false) => {
    track.style.transition = animate && !reduceMotion ? `transform ${SLIDE_MS}ms ease` : 'none';
    track.style.transform = `translate3d(calc(-100vw + ${px}px), ${y}px, 0)`;
  };

  const render = () => {
    const [p, c, n] = slides();
    fill(c, i);
    if (group.length > 1) { fill(p, i - 1); fill(n, i + 1); }
    dlg.classList.toggle('single', group.length < 2);
    setTrack(0);
  };

  // Slide to the neighbour (dir = +1 next, -1 previous), then recycle the slides
  // so the off-screen one becomes the new neighbour — no reloading, no blank frame.
  const go = dir => {
    if (busy || group.length < 2) return;
    busy = true;
    setTrack(-dir * innerWidth, 0, true);
    setTimeout(() => {
      i = wrap(i + dir);
      const s = slides();
      if (dir > 0) track.appendChild(s[0]); else track.prepend(s[2]);
      setTrack(0);
      const [p, , n] = slides();
      dir > 0 ? fill(n, i + 1) : fill(p, i - 1);
      busy = false;
    }, SLIDE_MS + 20);
  };

  links.forEach(a => a.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;   // let new-tab clicks through
    e.preventDefault();
    group = [...a.closest('[data-lightbox-group]').querySelectorAll('.photo-link')];
    i = group.indexOf(a);
    render();
    dlg.showModal();
  }));

  dlg.querySelector('.lb-prev').addEventListener('click', () => go(-1));
  dlg.querySelector('.lb-next').addEventListener('click', () => go(1));
  dlg.querySelector('.lb-close').addEventListener('click', () => dlg.close());
  // click on the empty area around the photo closes
  dlg.addEventListener('click', e => {
    if (e.target === dlg || e.target.classList.contains('lb-slide') || e.target === track) dlg.close();
  });
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });
  dlg.addEventListener('close', () => { track.style.opacity = ''; setTrack(0); });

  // ---- Swipe ---------------------------------------------------------------
  let start = null, axis = null, dx = 0, dy = 0;

  dlg.addEventListener('touchstart', e => {
    if (busy || e.touches.length !== 1 || e.target.closest('.lb-btn')) return;
    start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    axis = null; dx = dy = 0;
  }, { passive: true });

  dlg.addEventListener('touchmove', e => {
    if (!start || e.touches.length !== 1) return;
    dx = e.touches[0].clientX - start.x;
    dy = e.touches[0].clientY - start.y;
    if (!axis && Math.hypot(dx, dy) > 8) axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (axis === 'x' && group.length > 1) setTrack(dx);
    if (axis === 'y' && dy > 0) { setTrack(0, dy); track.style.opacity = String(Math.max(0.3, 1 - dy / 400)); }
    if (axis) e.preventDefault();                        // keep the page behind still
  }, { passive: false });

  const endSwipe = () => {
    if (!start) return;
    const swipedFar = Math.abs(dx) > Math.min(80, innerWidth * 0.2);
    if (axis === 'x' && group.length > 1 && swipedFar) {
      go(dx < 0 ? 1 : -1);                               // swipe left → next photo
    } else if (axis === 'y' && dy > 100) {
      dlg.close();
    } else {
      track.style.opacity = '';
      setTrack(0, 0, true);                              // not far enough: spring back
    }
    start = null;
  };
  dlg.addEventListener('touchend', endSwipe);
  dlg.addEventListener('touchcancel', endSwipe);
})();
