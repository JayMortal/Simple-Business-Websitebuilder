// ===== news.js =====
// Public news list page: fetches published articles, renders paginated cards.
// Clicking a card navigates to the article's dedicated page (/{slug}.html).

(function () {
  'use strict';

  const PAGE_SIZE = 6; // 3 per row × 2 rows
  let currentPage = 1;

  // ── Bilingual fallback ────────────────────────────────────────────
  function getLang(article, field) {
    const lang  = window.currentLang || 'zh';
    const other = lang === 'zh' ? 'en' : 'zh';
    return (article[lang]  && article[lang][field])  ||
           (article[other] && article[other][field]) || '';
  }

  // ── Date formatting ───────────────────────────────────────────────
  function formatDate(isoStr) {
    if (!isoStr) return '';
    const d    = new Date(isoStr);
    const lang = window.currentLang || 'zh';
    if (lang === 'zh') {
      return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
    }
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // ── HTML escape ───────────────────────────────────────────────────
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Render article card ───────────────────────────────────────────
  function renderCard(article) {
    const title    = getLang(article, 'title')   || (window.currentLang === 'zh' ? '（无标题）' : '(Untitled)');
    const summary  = getLang(article, 'summary') || '';
    const cover    = article.coverImage || '';
    const date     = formatDate(article.publishedAt);
    const t        = window.i18nTranslations && window.i18nTranslations[window.currentLang || 'zh'];
    const readMore = (t && t['news.readMore']) || 'Read More →';
    const slug     = article.slug || '';

    const card = document.createElement('article');
    card.className = 'news-card';
    card.innerHTML = `
      <div class="news-card-img-wrap">
        ${cover
          ? `<img class="news-card-img" src="${escHtml(cover)}" alt="${escHtml(title)}" loading="lazy" onerror="this.parentElement.classList.add('no-cover')">`
          : '<div class="news-card-placeholder"></div>'}
      </div>
      <div class="news-card-body">
        ${date ? `<div class="news-card-date">${escHtml(date)}</div>` : ''}
        <h3 class="news-card-title">${escHtml(title)}</h3>
        ${summary ? `<p class="news-card-summary">${escHtml(summary)}</p>` : ''}
        <span class="news-read-more">${escHtml(readMore)}</span>
      </div>`;

    if (slug) {
      card.addEventListener('click', () => { window.location.href = '/articles/' + slug + '.html'; });
    }
    return card;
  }

  // ── Render list ───────────────────────────────────────────────────
  function renderList(items) {
    const grid = document.getElementById('newsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    items.forEach(a => grid.appendChild(renderCard(a)));
  }

  // ── Pagination ────────────────────────────────────────────────────
  function renderPagination(total, page, limit) {
    const wrap = document.getElementById('newsPagination');
    if (!wrap) return;
    const totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'flex';
    wrap.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.className = 'news-page-btn' + (i === page ? ' active' : '');
      btn.textContent = i;
      btn.disabled = (i === page);
      btn.addEventListener('click', () => loadPage(i));
      wrap.appendChild(btn);
    }
  }

  // ── Load page ─────────────────────────────────────────────────────
  function loadPage(page) {
    currentPage = page;
    const loading = document.getElementById('newsLoading');
    const grid    = document.getElementById('newsGrid');
    const empty   = document.getElementById('newsEmpty');
    const pagin   = document.getElementById('newsPagination');
    if (loading) loading.style.display = 'flex';
    if (grid)    grid.style.display    = 'none';
    if (empty)   empty.style.display   = 'none';
    if (pagin)   pagin.style.display   = 'none';

    fetch(`/api/articles?page=${page}&limit=${PAGE_SIZE}`)
      .then(r => r.json())
      .then(data => {
        if (loading) loading.style.display = 'none';
        if (!data.items || data.items.length === 0) {
          if (empty) empty.style.display = 'block';
          return;
        }
        renderList(data.items);
        renderPagination(data.total, data.page, data.limit);
        if (grid) grid.style.display = 'grid';
      })
      .catch(() => {
        if (loading) loading.style.display = 'none';
        if (empty)   empty.style.display   = 'block';
      });
  }

  // ── Init ──────────────────────────────────────────────────────────
  // i18n.js fires 'langChanged' synchronously on DOMContentLoaded (before news.js's own
  // DOMContentLoaded listener runs), so we use a flag to load exactly once on startup.
  let _initialized = false;

  document.addEventListener('DOMContentLoaded', () => {
    if (!_initialized) { _initialized = true; loadPage(1); }
  });

  document.addEventListener('langChanged', () => {
    if (_initialized) {
      loadPage(currentPage); // real language switch — reload with new lang
    } else {
      _initialized = true;
      loadPage(1); // initial load triggered by i18n.js DOMContentLoaded
    }
  });
})();
