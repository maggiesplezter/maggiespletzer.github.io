// Lightbox for any link with .photo-link inside a [data-lightbox-group].
// Shows the photo full size with no caption. No dependencies.
(() => {
  const links = [...document.querySelectorAll('[data-lightbox-group] .photo-link')];

  if (!links.length) return;

  const dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.setAttribute('aria-label', 'Photo viewer');
  dlg.innerHTML = `
    <figure>
      <img alt="">
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
  dlg.addEventListener('close', () => { img.removeAttribute('src'); });
})();
