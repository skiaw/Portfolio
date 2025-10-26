(function initSmoothScroll() {
  const collapseEl = document.getElementById('menu');
  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    link.addEventListener('click', (event) => {
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (collapseEl && collapseEl.classList.contains('show')) {
        const C = window.bootstrap && window.bootstrap.Collapse;
        let i = C && typeof C.getInstance === 'function' ? C.getInstance(collapseEl) : null;
        if (!i && C) i = new C(collapseEl, { toggle: false });
        if (i && typeof i.hide === 'function') i.hide(); else collapseEl.classList.remove('show');
      }
    });
  });
})();
(function initDuoCarousel() {
  const root = document.querySelector('.duo-carousel');
  if (!root) return;
  const track = root.querySelector('.carousel-track');
  if (!track) return;
  const cards = Array.from(track.querySelectorAll('.pair-card'));
  if (!cards.length) return;
  const leftArrow = root.querySelector('.nav-arrow.left');
  const rightArrow = root.querySelector('.nav-arrow.right');
  const dotsContainer = root.parentElement && root.parentElement.querySelector('.dots');
  const total = cards.length;
  let currentIndex = 0;
  let isAnimating = false;
  let dotsButtons = [];
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    dotsButtons = cards.map((card, index) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'dot';
      const title = card.querySelector('.pair-block.text-block h3');
      const label = title ? 'Afficher ' + (title.textContent || '').trim() : 'Afficher l\'expérience ' + (index + 1);
      b.setAttribute('aria-label', label);
      b.addEventListener('click', () => update(index));
      dotsContainer.appendChild(b); return b;
    });
  }
  function applyState() {
    cards.forEach((card, index) => {
      const offset = (index - currentIndex + total) % total;
      card.classList.remove('center','left-1','left-2','right-1','right-2','hidden');
      if (offset === 0) card.classList.add('center');
      else if (offset === 1) card.classList.add('right-1');
      else if (offset === 2) card.classList.add('right-2');
      else if (offset === total - 1) card.classList.add('left-1');
      else if (offset === total - 2) card.classList.add('left-2');
      else card.classList.add('hidden');
    });
    if (dotsButtons.length) dotsButtons.forEach((b, i) => { const a = i === currentIndex; b.classList.toggle('active', a); b.setAttribute('aria-current', a ? 'true' : 'false'); });
  }
  function update(newIndex) {
    if (isAnimating) return;
    isAnimating = true; currentIndex = (newIndex + total) % total; applyState();
    window.setTimeout(() => { isAnimating = false; }, 800);
  }
  if (leftArrow) leftArrow.addEventListener('click', () => update(currentIndex - 1));
  if (rightArrow) rightArrow.addEventListener('click', () => update(currentIndex + 1));
  cards.forEach((card, index) => { card.addEventListener('click', () => update(index)); });
  document.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') update(currentIndex - 1); else if (e.key === 'ArrowRight') update(currentIndex + 1); });
  let sx = 0; root.addEventListener('touchstart', (e) => { sx = e.changedTouches[0].clientX; }, { passive: true });
  root.addEventListener('touchend', (e) => { const dx = sx - e.changedTouches[0].clientX; if (Math.abs(dx) > 50) update(currentIndex + (dx > 0 ? 1 : -1)); }, { passive: true });
  update(0);
})();
const yearTarget = document.getElementById('y'); if (yearTarget) { yearTarget.textContent = new Date().getFullYear(); }
(function initProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  const backend = window.PROJECTS_API_URL && String(window.PROJECTS_API_URL).trim();
  if (backend) {
    const base = backend.replace(/\/$/, '');
    const url = base + '/projects';
    fetch(url).then((r) => r.json()).then((items) => renderProjects(items)).catch(() => {});
    return;
  }

  const owner = (window.GH_OWNER || 'skiaw').trim();
  const repo = (window.GH_REPO || 'Projects').trim();
  const path = (window.GH_PATH || '').replace(/^\/+|\/+$/g, '');

  fetch(`https://api.github.com/repos/${owner}/${repo}`)
    .then((r) => r.json())
    .then((meta) => meta && (meta.default_branch || 'main'))
    .then((ref) => {
      const suffix = path ? `/contents/${encodeURIComponent(path)}` : '/contents';
      const url = `https://api.github.com/repos/${owner}/${repo}${suffix}?ref=${encodeURIComponent(ref)}`;
      return fetch(url).then((r) => r.json()).then((items) => ({ items, ref }));
    })
    .then(({ items, ref }) => {
      const dirs = Array.isArray(items) ? items.filter((it) => it && it.type === 'dir') : [];
      const mapped = dirs.map((d) => {
        const name = d.name;
        const p = d.path;
        const html_url = `https://github.com/${owner}/${repo}/tree/${ref}/${p}`;
        const image_url = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${p}/portfolio_public/project.png`;
        return { name, path: p, html_url, image_url };
      });
      renderProjects(mapped);
    })
    .catch(() => {});

  function renderProjects(items) {
    grid.innerHTML = '';
    items.forEach((it) => {
      const col = document.createElement('div');
      col.className = 'col-md-6 col-lg-4';
      const card = document.createElement('div');
      card.className = 'h-100 p-4 info-card project-card';
      if (it.image_url) {
        const img = document.createElement('img');
        img.src = it.image_url;
        img.alt = it.name || 'project';
        img.className = 'project-image w-100';
        img.onerror = () => { if (img && img.parentNode) img.parentNode.removeChild(img); };
        card.appendChild(img);
      }
      const title = document.createElement('h3');
      title.className = 'fs-5 fw-semibold mb-2';
      title.textContent = it.name || 'Projet';
      card.appendChild(title);
      if (it.html_url) {
        const a = document.createElement('a');
        a.href = it.html_url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.className = 'stretched-link';
        card.appendChild(a);
      }
      col.appendChild(card);
      grid.appendChild(col);
    });
  }
})();
