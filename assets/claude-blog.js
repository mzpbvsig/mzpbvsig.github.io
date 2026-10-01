(() => {
  try {
  const dataNode = document.getElementById('claude-blog-data');
  if (!dataNode) return;
  const data = JSON.parse(dataNode.textContent || '{}');
  const posts = Array.isArray(data.posts) ? data.posts : [];
  const videos = Array.isArray(data.videos) ? data.videos : [];
  const postRoot = document.querySelector('[data-claude-posts]');
  const loadButton = document.querySelector('[data-claude-load]');
  const videoRoot = document.querySelector('[data-claude-videos]');
  const playerTitle = document.querySelector('[data-claude-player-title]');
  const playerMeta = document.querySelector('[data-claude-player-meta]');
  const playerLink = document.querySelector('[data-claude-player-link]');
  const searchLayer = document.querySelector('[data-claude-search-layer]');
  const searchInput = document.querySelector('#claude-search-input');
  const searchResults = document.querySelector('[data-claude-results]');
  let filter = 'all';
  let visibleCount = 6;
  const sourceUrl = (post) => `https://claude.dev/blog/${post.slug}/`;
  const localOrSource = (post) => post.local_url || sourceUrl(post);
  const dateLabel = (date) => new Intl.DateTimeFormat('zh-CN', {year:'numeric', month:'short', day:'2-digit'}).format(new Date(`${date}T00:00:00`));
  const filtered = () => posts.filter((post) => filter === 'all' || post.section === filter);
  const renderPosts = () => {
    const visible = filtered().slice(0, visibleCount);
    postRoot.innerHTML = visible.map((post, index) => `<article class="claude-post${index === 0 && filter === 'all' ? ' is-featured' : ''}"><time class="claude-post-date" datetime="${post.date}">${dateLabel(post.date)}</time><div class="claude-post-main"><div class="claude-post-meta">${index === 0 && filter === 'all' ? '<span class="claude-featured-chip">精选</span>' : ''}<span>${post.section_label}</span><span>${post.minutes} 分钟</span><span>${post.author}</span></div><h3><a href="${localOrSource(post)}"${post.local_url ? '' : ' target="_blank" rel="noreferrer"'}>${post.title}</a></h3><p class="claude-post-summary">${post.summary}</p></div><a class="claude-post-arrow" href="${localOrSource(post)}"${post.local_url ? '' : ' target="_blank" rel="noreferrer"'} aria-label="阅读：${post.title}">↗</a></article>`).join('');
    loadButton.hidden = visible.length >= filtered().length;
  };
  document.querySelectorAll('[data-claude-filter]').forEach((button) => button.addEventListener('click', () => { filter = button.dataset.claudeFilter; visibleCount = 6; document.querySelectorAll('[data-claude-filter]').forEach((item) => { const active = item === button; item.classList.toggle('is-active', active); item.setAttribute('aria-selected', String(active)); }); renderPosts(); }));
  loadButton.addEventListener('click', () => { visibleCount += 6; renderPosts(); });
  const renderVideos = (activeIndex = 0) => { videoRoot.innerHTML = videos.map((video, index) => `<button class="claude-video-item${index === activeIndex ? ' is-active' : ''}" type="button" data-video-index="${index}"><div><span class="claude-video-marker"></span><span class="claude-video-title">${video.title}</span><span class="claude-video-meta">${video.date} · ${video.duration}</span></div></button>`).join(''); videoRoot.querySelectorAll('[data-video-index]').forEach((item) => item.addEventListener('click', () => renderVideos(Number(item.dataset.videoIndex)))); const active = videos[activeIndex]; if (active) { playerTitle.textContent = active.title; playerMeta.textContent = `${active.date} · ${active.duration} · ${active.source_title}`; playerLink.href = active.url; } };
  const renderSearch = (query = '') => { const normalized = query.trim().toLowerCase(); const matches = posts.filter((post) => `${post.title} ${post.summary} ${post.section_label}`.toLowerCase().includes(normalized)).slice(0, 8); searchResults.innerHTML = normalized ? matches.map((post) => `<a href="${localOrSource(post)}"${post.local_url ? '' : ' target="_blank" rel="noreferrer"'}>${post.title}<small>${post.section_label} · ${post.minutes} 分钟</small></a>`).join('') : '<p class="claude-blog-kicker">输入标题、栏目或关键词</p>'; };
  const openSearch = () => { searchLayer.hidden = false; renderSearch(); searchInput.focus(); };
  document.querySelector('[data-claude-search]').addEventListener('click', openSearch);
  document.querySelector('[data-claude-search-close]').addEventListener('click', () => { searchLayer.hidden = true; });
  searchInput.addEventListener('input', () => renderSearch(searchInput.value));
  searchLayer.addEventListener('click', (event) => { if (event.target === searchLayer) searchLayer.hidden = true; });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') searchLayer.hidden = true; if (event.key.toLowerCase() === 'r' && !event.metaKey && !event.ctrlKey && document.activeElement !== searchInput) { visibleCount += 6; renderPosts(); } });
  renderPosts();
  renderVideos();
  } catch (error) { console.error(error); }
})();
