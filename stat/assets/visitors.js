(() => {
  const allowed = ['hikcc.top', 'mzpbvsig.github.io'];
  const status = document.querySelector('#visitor-status');
  if (!allowed.includes(location.hostname)) {
    if (status) status.textContent = '本地预览不计入访问量，上线后显示真实数据。';
    return;
  }
  const endpoint = 'https://hikcc.top/visitor-api/';
  let options = {method: 'GET', cache: 'no-store'};
  // Respect browser privacy preferences and avoid inventing visitors when storage is unavailable.
  if (navigator.doNotTrack !== '1' && !navigator.globalPrivacyControl) {
    try {
      let visitor = localStorage.getItem('hikcc-visitor-v1');
      if (!visitor || !/^[a-f0-9-]{36}$/.test(visitor)) {
        visitor = crypto.randomUUID();
        localStorage.setItem('hikcc-visitor-v1', visitor);
      }
      options = {...options, method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({visitor, event: crypto.randomUUID()})};
    } catch (_) { /* Read-only counts when persistence is blocked. */ }
  }
  fetch(endpoint, {...options, signal: AbortSignal.timeout(10000)})
    .then(r => { if (!r.ok) throw new Error('counter unavailable'); return r.json(); })
    .then(data => {
      for (const key of ['pv', 'uv', 'today_pv', 'today_uv']) {
        if (!Number.isSafeInteger(data[key]) || data[key] < 0) throw new Error('invalid counts');
        document.querySelectorAll(`[data-visitors="${key}"]`).forEach(el => { el.textContent = data[key].toLocaleString('zh-CN'); });
      }
      if (status) status.textContent = data.since ? `自 ${data.since} 起累计 · 北京时间 · 两个站点合计` : '计数服务已连接，等待首次访问。';
    })
    .catch(() => { if (status) status.textContent = '访问统计暂时不可用，请稍后重试。'; });
})();
