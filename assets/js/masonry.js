// Masonry that reads left to right.
//
// CSS columns (the no-JS fallback in pages.scss) fill the first column top to
// bottom before starting the second, so the grid reads downwards. This places
// each photo, in order, into whichever column is currently shortest, so the
// first photos run across the top row and the lightbox's next/previous order
// matches what you see. Heights come from each <img>'s width/height
// attributes, so nothing waits for images to load. The DOM order is untouched.
(() => {
  const grids = [...document.querySelectorAll('.photo-grid')];
  if (!grids.length) return;

  const narrow = matchMedia('(max-width: 30em)');

  const layout = ul => {
    const items = [...ul.children];
    if (!items.length) return;
    ul.classList.add('is-masonry');

    const gap = parseFloat(getComputedStyle(ul).columnGap) || 0;
    const pad = parseFloat(getComputedStyle(items[0]).paddingBlockEnd) || 0;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const W = ul.clientWidth;

    // Same rules as the CSS: up to 3 columns at least 14rem wide; 2 on phones.
    const n = narrow.matches ? 2
      : Math.max(1, Math.min(3, Math.floor((W + gap) / (14 * rem + gap))));
    const colW = (W - gap * (n - 1)) / n;
    const heights = new Array(n).fill(0);

    items.forEach(li => {
      const img = li.querySelector('img');
      const w = +img?.getAttribute('width'), h = +img?.getAttribute('height');
      const ratio = w && h ? h / w : 1;
      const c = heights.indexOf(Math.min(...heights));
      li.style.width = `${colW}px`;
      li.style.left = `${c * (colW + gap)}px`;
      li.style.top = `${heights[c]}px`;
      heights[c] += colW * ratio + pad;
    });
    ul.style.height = `${Math.max(...heights)}px`;
  };

  grids.forEach(ul => {
    layout(ul);
    let lastW = ul.clientWidth;
    new ResizeObserver(() => {
      if (ul.clientWidth !== lastW) { lastW = ul.clientWidth; layout(ul); }
    }).observe(ul);
  });
  narrow.addEventListener('change', () => grids.forEach(layout));
})();
