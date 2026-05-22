// ===== article.js =====
// Standalone article page: reads slug from URL path, fetches and renders article.
// Bilingual fallback: if current language has no content, display the other language's content.

(function () {
  'use strict';

  // ── Read slug from pathname (e.g. /articles/gt-pro-launch.html → "gt-pro-launch") ─
  function getSlugFromPath() {
    const m = window.location.pathname.match(/\/articles\/([^/]+)\.html$/);
    return m ? m[1] : null;
  }

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
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
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

  // ── Render article ────────────────────────────────────────────────
  function renderArticle(article) {
    const lang     = window.currentLang || 'zh';
    const other    = lang === 'zh' ? 'en' : 'zh';
    const title    = getLang(article, 'title');
    const content  = getLang(article, 'content');
    // Determine format from whichever language provided the content
    const activeLang = (article[lang] && article[lang].content) ? lang : other;
    const format   = (article[activeLang] && article[activeLang].format) || 'markdown';
    const date     = formatDate(article.publishedAt);
    const t        = window.i18nTranslations && window.i18nTranslations[lang];
    const pubLabel  = (t && t['news.publishedAt'])  || 'Published';
    const backLabel = (t && t['news.backToList'])   || '← Back to News';
    const notFound  = (t && t['news.articleNotFound']) || '文章不存在或已下线。';

    // Update page title
    if (title) document.title = title + ' | GlobalTrade Co.';

    let renderedContent;
    if (format === 'html') {
      renderedContent = content;
    } else {
      if (typeof marked !== 'undefined') {
        renderedContent = marked.parse(content || '');
      } else {
        renderedContent = (content || '').split('\n\n')
          .map(p => `<p>${escHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
      }
    }

    const main = document.getElementById('articleMain');
    if (!main) return;
    main.innerHTML = `
      ${article.coverImage
        ? `<div class="article-cover-wrap"><img class="article-cover-img" src="${escHtml(article.coverImage)}" alt="${escHtml(title)}"></div>`
        : ''}
      <div class="article-detail-body">
        <a class="article-back-link" href="news.html">${escHtml(backLabel)}</a>
        ${date ? `<div class="article-detail-meta">${escHtml(pubLabel)} ${escHtml(date)}</div>` : ''}
        <h1 class="article-detail-title">${escHtml(title)}</h1>
        <div class="article-detail-content">${renderedContent}</div>
        <div class="article-back-footer">
          <a class="article-back-link" href="news.html">${escHtml(backLabel)}</a>
        </div>
      </div>`;
  }

  // ── Not found state ───────────────────────────────────────────────
  function showNotFound() {
    const main = document.getElementById('articleMain');
    if (!main) return;
    const lang = window.currentLang || 'zh';
    const t    = window.i18nTranslations && window.i18nTranslations[lang];
    const msg  = (t && t['news.articleNotFound']) || '文章不存在或已下线。';
    const back = (t && t['news.backToList'])      || '← 返回列表';
    main.innerHTML = `
      <div style="text-align:center;padding:100px 24px;color:#aaa">
        <div style="font-size:3rem;margin-bottom:20px">📰</div>
        <p style="font-size:1rem;margin-bottom:24px">${escHtml(msg)}</p>
        <a href="news.html" style="color:#c9a84c;font-weight:700;text-decoration:none">${escHtml(back)}</a>
      </div>`;
  }

  // ── Cached article for language-switch re-render ──────────────────
  let _article = null;

  // ── Fetch and render ──────────────────────────────────────────────
  function loadArticle() {
    const slug = getSlugFromPath();
    if (!slug) { showNotFound(); return; }

    fetch(`/api/articles/slug/${encodeURIComponent(slug)}`)
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); })
      .then(article => {
        _article = article;
        renderArticle(article);
      })
      .catch(showNotFound);
  }

  // ── Init ──────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', loadArticle);

  // Re-render on language switch without re-fetching
  document.addEventListener('langChanged', () => {
    if (_article) renderArticle(_article);
  });
})();
