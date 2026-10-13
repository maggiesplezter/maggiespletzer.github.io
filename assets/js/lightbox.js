// Lightbox for any link with .photo-link inside a [data-lightbox-group].
// Shows the photo full size with no caption. No dependencies.
// Desktop: arrow buttons / arrow keys. Phones & tablets: swipe left/right to
// move between photos, swipe down to close (the arrow buttons are hidden).
(() => {
  const links = [...document.querySelectorAll('[data-lightbox-group] .photo-link')];

  if (!links.length) return;

  const dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.setAttribute('aria-label', 'Photo viewer');
  dlg.innerHTML = `
    <figure>
      <img alt="" draggable="false">
    </figure>
    <button type="button" class="lb-btn lb-prev" aria-label="Previous photo">&larr;</button>
    <button type="button" class="lb-btn lb-next" aria-label="Next photo">&rarr;</button>
    <button type="button" class="lb-btn lb-close" aria-label="Close">&times;</button>`;
  document.body.appendChild(dlg);

  const img = dlg.querySelector('img');
  let group = [];
  let i = 0;

  const show = n => {
    i = (n + group.length) % group.length;
    const a = group[i];
    img.src = a.href;
    img.alt = a.querySelector('img')?.alt ?? '';
    dlg.classList.toggle('single', group.length < 2);
    // warm the cache for the neighbours so swiping feels instant
    [i - 1, i + 1].forEach(k => { new Image().src = group[(k + group.length) % group.length].href; });
  };

  links.forEach(a => a.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return; // let new-tab clicks through
    e.preventDefault();
    group = [...a.closest('[data-lightbox-group]').querySelectorAll('.photo-link')];
    show(group.indexOf(a));
    dlg.showModal();
  }));

  dlg.querySelector('.lb-prev').addEventListener('click', () => show(i - 1));
  dlg.querySelector('.lb-next').addEventListener('click', () => show(i + 1));
  dlg.querySelector('.lb-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
  dlg.addEventListener('close', () => { img.removeAttribute('src'); img.style.transform = ''; });

  // ---- Swipe -------------------------------------------------------------
  // The photo follows the finger; release past a threshold to change photo
  // (horizontal) or close (downward). Otherwise it springs back.
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let start = null;   // {x, y}
  let axis = null;    // 'x' | 'y' once the gesture direction is clear
  let dx = 0, dy = 0;

  const setPos = (x, y, animate) => {
    img.style.transition = animate && !reduceMotion ? 'transform 0.22s ease, opacity 0.22s ease' : 'none';
    img.style.transform = `translate(${x}px, ${y}px)`;
    img.style.opacity = axis === 'y' ? String(Math.max(0.3, 1 - y / 400)) : '1';
  };

  dlg.addEventListener('touchstart', e => {
    if (e.touches.length !== 1 || e.target.closest('.lb-btn')) return;
    start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    axis = null; dx = dy = 0;
  }, { passive: true });

  dlg.addEventListener('touchmove', e => {
    if (!start || e.touches.length !== 1) return;
    dx = e.touches[0].clientX - start.x;
    dy = e.touches[0].clientY - start.y;
    if (!axis && Math.hypot(dx, dy) > 8) axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (axis === 'x' && group.length > 1) setPos(dx, 0, false);
    if (axis === 'y' && dy > 0) setPos(0, dy, false);
    if (axis) e.preventDefault();   // stop the page behind from scrolling
  }, { passive: false });

  const endSwipe = () => {
    if (!start) return;
    const w = innerWidth;
    if (axis === 'x' && group.length > 1 && Math.abs(dx) > Math.min(80, w * 0.2)) {
      const dir = dx < 0 ? 1 : -1;            // swipe left → next photo
      setPos(-dir * w, 0, true);               // slide current photo off-screen
      setTimeout(() => {
        show(i + dir);
        setPos(dir * w * 0.35, 0, false);      // new photo enters from the other side
        requestAnimationFrame(() => setPos(0, 0, true));
      }, reduceMotion ? 0 : 160);
    } else if (axis === 'y' && dy > 100) {
      dlg.close();
    } else {
      setPos(0, 0, true);                      // not far enough: spring back
    }
    start = null;
  };
  dlg.addEventListener('touchend', endSwipe);
  dlg.addEventListener('touchcancel', endSwipe);
})();
