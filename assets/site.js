(() => {
  'use strict';
  const dataNode = document.querySelector('#article-data');
  const articles = dataNode ? JSON.parse(dataNode.textContent) : [];
  const typeNames = { official: '官方逐字', practice: '实践补充', optional: '看场景可省' };
  const articleUrl = article => `/${article.date}/${article.slug}.html`;
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const header = document.querySelector('.site-nav');
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#main-navigation');
  function closeMenu(returnFocus = false) {
    header?.classList.remove('menu-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    if (menuButton) menuButton.textContent = '菜单';
    if (returnFocus) menuButton?.focus();
  }
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    header.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.textContent = open ? '关闭' : '菜单';
  });
  menu?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('click', event => { if (!header?.contains(event.target)) closeMenu(); });
  matchMedia('(min-width:761px)').addEventListener('change', () => closeMenu());
  const updateHeader = () => header?.classList.toggle('scrolled', scrollY > 28);
  addEventListener('scroll', updateHeader, {passive:true});
  updateHeader();

  const list = document.querySelector('#article-list');
  const count = document.querySelector('#article-count');
  const empty = document.querySelector('#empty-state');
  const filters = [...document.querySelectorAll('[data-filter]')];
  function filterArticles(category) {
    if (!list) return;
    let visible = 0;
    list.querySelectorAll('[data-category]').forEach(card => {
      card.hidden = category !== 'all' && card.dataset.category !== category;
      if (!card.hidden) visible++;
    });
    filters.forEach(button => {
      const selected = button.dataset.filter === category;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    if (count) count.textContent = `${visible} 篇研究`;
    if (empty) empty.hidden = visible !== 0;
  }
  filters.forEach(button => button.addEventListener('click', () => filterArticles(button.dataset.filter)));
  document.querySelectorAll('[data-topic]').forEach(link => link.addEventListener('click', () => filterArticles(link.dataset.topic)));

  const layer = document.querySelector('#search-layer');
  const input = document.querySelector('#search-input');
  const results = document.querySelector('#search-results');
  const status = document.querySelector('#search-status');
  let previousFocus;
  let previousOverflow;
  let backgroundNodes = [];
  function renderSearch() {
    if (!results || !input) return;
    const query = input.value.trim().toLocaleLowerCase('zh-CN');
    const matches = articles.filter(article => !query || `${article.title} ${article.label} ${article.description}`.toLocaleLowerCase('zh-CN').includes(query));
    const visible = query ? matches : matches.slice(0, 6);
    if (status) status.textContent = query ? `找到 ${matches.length} 篇文章` : '最近的 6 篇研究 · 输入关键词搜索全部文章';
    results.innerHTML = visible.map(article => `<a href="${articleUrl(article)}"><b>${escapeHtml(article.title)}</b><small>${escapeHtml(article.date)} · ${escapeHtml(article.label)} · ${typeNames[article.type]}</small></a>`).join('') || '<p class="search-empty">没有找到匹配的文章。试试“Agent”或“工作流”。</p>';
  }
  function openSearch() {
    if (!layer || !input || layer.classList.contains('open')) return;
    previousFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    closeMenu();
    layer.hidden = false;
    layer.classList.add('open');
    layer.setAttribute('aria-hidden', 'false');
    backgroundNodes = [...document.body.children].filter(node => node !== layer && !['SCRIPT','STYLE'].includes(node.tagName)).map(node => ({node, inert:node.inert}));
    backgroundNodes.forEach(({node}) => {node.inert = true;});
    document.body.style.overflow = 'hidden';
    renderSearch();
    input.focus();
  }
  function closeSearch() {
    if (!layer?.classList.contains('open')) return;
    layer.classList.remove('open');
    layer.setAttribute('aria-hidden', 'true');
    layer.hidden = true;
    backgroundNodes.forEach(({node, inert}) => {node.inert = inert;});
    document.body.style.overflow = previousOverflow;
    previousFocus?.focus();
  }
  document.querySelectorAll('[data-open-search]').forEach(button => button.addEventListener('click', openSearch));
  document.querySelectorAll('[data-close-search]').forEach(button => button.addEventListener('click', closeSearch));
  input?.addEventListener('input', renderSearch);
  layer?.addEventListener('click', event => {if (event.target === layer) closeSearch();});
  addEventListener('keydown', event => {
    if (event.key === 'Escape') {closeSearch(); closeMenu(menuButton?.getAttribute('aria-expanded') === 'true');}
    const editing = event.target.closest('input,textarea,select,[contenteditable="true"]');
    if (((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') || (event.key === '/' && !editing)) {event.preventDefault(); openSearch();}
    if (event.key === 'Tab' && layer?.classList.contains('open')) {
      const focusable = [...layer.querySelectorAll('a[href],button,input')];
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {event.preventDefault();last?.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first?.focus();}
    }
  });

  const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
  const heroArt = document.querySelector('.hero-art');
  const motionToggle = document.querySelector('[data-motion-toggle]');
  let motionPaused = false;
  let heroVisible = true;
  function updateMotion() {
    if (!heroArt || !motionToggle) return;
    motionToggle.hidden = reducedMotion.matches;
    motionToggle.textContent = motionPaused ? '播放动效' : '暂停动效';
    motionToggle.setAttribute('aria-pressed', String(motionPaused));
    heroArt.style.animationPlayState = motionPaused || !heroVisible || document.hidden || reducedMotion.matches ? 'paused' : 'running';
  }
  motionToggle?.addEventListener('click', () => { motionPaused = !motionPaused; updateMotion(); });
  document.addEventListener('visibilitychange', updateMotion);
  reducedMotion.addEventListener('change', updateMotion);
  updateMotion();
  if ('IntersectionObserver' in window) {
    if (heroArt) new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
      updateMotion();
    }).observe(document.querySelector('.research-hero'));
    const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {entry.target.classList.remove('reveal-pending'); reveals.unobserve(entry.target);}
    }), {threshold:.08});
    if (!reducedMotion.matches) document.querySelectorAll('.reveal').forEach(element => {element.classList.add('reveal-pending');reveals.observe(element);});
    reducedMotion.addEventListener('change', () => {if (reducedMotion.matches) {document.querySelectorAll('.reveal-pending').forEach(element => element.classList.remove('reveal-pending'));reveals.disconnect();}});
    const sections = [...document.querySelectorAll('.research-hero,.home-section')];
    const navLinks = [...document.querySelectorAll('#main-navigation a[href^="#"]')];
    const active = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id || 'top';
        navLinks.forEach(link => {if (link.hash === `#${id}`) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current');});
      });
    }, {rootMargin:'-15% 0px -65% 0px'});
    sections.forEach(section => active.observe(section));
  }
})();
