/**
 * Подготовка HTML, сгенерированного pandoc, к показу внутри <iframe srcdoc>.
 *
 * Что здесь происходит:
 *  1. Если pandoc отдал фрагмент (без -s), оборачиваем его в полноценный документ.
 *  2. Добавляем <base target="_blank"> — ссылки из ноутбука открываются в новой
 *     вкладке, а не «внутри» iframe.
 *  3. Подмешиваем стили просмотрщика: типографика под сайт, адаптивные таблицы
 *     и картинки, поддержка тёмной темы.
 *  4. Вставляем маленький скрипт, который сообщает родительской странице свою
 *     высоту через postMessage — так iframe растёт под содержимое и внутри
 *     не появляется вторая полоса прокрутки.
 *
 * ВАЖНО про экранирование: атрибут srcdoc задаётся из React как обычная строка
 * (<iframe srcDoc={html} />), поэтому React сам экранирует кавычки и угловые
 * скобки. Ручное экранирование не требуется — и именно поэтому HTML
 * импортируется из внешнего файла как строка, а не вставляется в JSX руками.
 */

/** Метка сообщений от iframe — чтобы не реагировать на чужие postMessage. */
export const FRAME_MESSAGE_SOURCE = 'ml-seminars-frame';

/** Скрипт-«измеритель» высоты документа внутри iframe. */
function heightReporterScript(frameId) {
  return `
<script>
(function () {
  var FRAME_ID = ${JSON.stringify(frameId)};
  var last = 0;

  function report() {
    var doc = document.documentElement;
    var body = document.body;
    var height = Math.max(
      doc ? doc.scrollHeight : 0,
      doc ? doc.offsetHeight : 0,
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0
    );
    if (Math.abs(height - last) < 8) return;
    last = height;
    parent.postMessage(
      { source: ${JSON.stringify(FRAME_MESSAGE_SOURCE)}, frameId: FRAME_ID, height: height },
      '*'
    );
  }

  document.addEventListener('DOMContentLoaded', report);
  window.addEventListener('load', report);
  window.addEventListener('resize', report);

  // Пересчитываем при догрузке картинок / раскрытии деталей
  if (window.ResizeObserver) {
    new ResizeObserver(report).observe(document.documentElement);
  }
  [200, 800, 2000].forEach(function (delay) { setTimeout(report, delay); });
})();
<\/script>`;
}

/** Стили просмотрщика для обычных ноутбуков. */
function notebookStyles(theme) {
  const dark = theme === 'dark';
  return `
<style>
  :root { color-scheme: ${dark ? 'dark' : 'light'}; }

  html, body { margin: 0; padding: 0; }

  body {
    /* Pandoc задаёт узкую колонку (36em) — для кода и таблиц этого мало */
    max-width: 62rem !important;
    margin: 0 auto !important;
    padding: 1.5rem 1.75rem 3rem !important;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    hyphens: none;
    background: ${dark ? '#0f172a' : '#ffffff'};
    color: ${dark ? '#e2e8f0' : '#1e293b'};
  }

  h1, h2, h3, h4 { line-height: 1.25; letter-spacing: -0.01em; }
  h1 { font-size: 1.9rem; margin-top: 0; }
  h2 { font-size: 1.45rem; margin-top: 2.2rem; }
  h3 { font-size: 1.2rem; margin-top: 1.6rem; }

  h1, h2 {
    padding-bottom: 0.35rem;
    border-bottom: 1px solid ${dark ? 'rgba(148,163,184,.25)' : 'rgba(15,23,42,.12)'};
  }

  a { color: ${dark ? '#7dd3fc' : '#6d28d9'}; }

  /* Картинки (графики matplotlib) и таблицы не должны ломать вёрстку */
  img, svg, video { max-width: 100%; height: auto; }

  img {
    background: #fff;
    border-radius: 10px;
    padding: ${dark ? '6px' : '0'};
  }

  /* Код */
  pre, code, kbd, samp {
    font-family: 'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace;
    font-size: 0.87em;
  }

  pre {
    overflow-x: auto;
    padding: 0.9rem 1rem;
    border-radius: 12px;
    background: ${dark ? '#111827' : '#f8fafc'};
    border: 1px solid ${dark ? 'rgba(148,163,184,.18)' : 'rgba(15,23,42,.08)'};
  }

  code:not(pre code) {
    padding: 0.12em 0.38em;
    border-radius: 6px;
    background: ${dark ? 'rgba(148,163,184,.18)' : 'rgba(124,58,237,.09)'};
    color: ${dark ? '#e9d5ff' : '#6d28d9'};
  }

  /* --- Структура ячеек, которую генерирует pandoc из .ipynb --- */

  /* Ячейка с кодом: тонкая акцентная линия слева */
  .cell.code {
    position: relative;
    padding-left: 0.9rem;
    margin-block: 1.1rem;
    border-left: 3px solid ${dark ? 'rgba(139,92,246,.5)' : 'rgba(124,58,237,.35)'};
  }

  /* Текстовый вывод (print, repr) */
  .output.stream pre,
  .output.execute_result pre {
    background: ${dark ? 'rgba(148,163,184,.08)' : 'rgba(15,23,42,.035)'};
    border-style: dashed;
    font-size: 0.83em;
  }

  .output.stream.stderr pre {
    background: ${dark ? 'rgba(239,68,68,.12)' : 'rgba(239,68,68,.07)'};
    border-color: rgba(239, 68, 68, 0.35);
  }

  /* Графики matplotlib — по центру */
  .output.display_data {
    margin-block: 1rem;
    text-align: center;
  }

  /* Таблицы (pandas .to_html и markdown-таблицы) */
  table {
    display: block;
    max-width: 100%;
    overflow-x: auto;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  th, td {
    padding: 0.4rem 0.7rem;
    border: 1px solid ${dark ? 'rgba(148,163,184,.22)' : 'rgba(15,23,42,.12)'};
  }

  thead th { background: ${dark ? 'rgba(148,163,184,.12)' : 'rgba(15,23,42,.04)'}; }

  blockquote {
    margin-inline: 0;
    padding: 0.4rem 1rem;
    border-left: 4px solid ${dark ? '#8b5cf6' : '#7c3aed'};
    background: ${dark ? 'rgba(139,92,246,.12)' : 'rgba(124,58,237,.06)'};
    border-radius: 0 10px 10px 0;
  }

  /* Подсветка синтаксиса pandoc в тёмной теме */
  ${dark ? 'pre code span { filter: brightness(1.35) saturate(1.1); }' : ''}
</style>`;
}

/**
 * Вставить строку перед закрывающим тегом.
 *
 * Внимание: в самодостаточном HTML строки «</head>» и «</body>» встречаются
 * ещё и внутри минифицированного JavaScript. Поэтому берём не любое вхождение,
 * а нужное по позиции:
 *   • настоящий </head> — САМЫЙ ПЕРВЫЙ (голова документа идёт до скриптов);
 *   • настоящий </body> — САМЫЙ ПОСЛЕДНИЙ (после всех скриптов).
 */
function insertBefore(html, tagPattern, injection, position = 'first') {
  const matches = [...html.matchAll(tagPattern)];
  if (matches.length === 0) return html + injection;

  const { index } = position === 'last' ? matches[matches.length - 1] : matches[0];
  return html.slice(0, index) + injection + html.slice(index);
}

/**
 * @param {string} rawHtml   HTML от pandoc
 * @param {object} options
 * @param {string} options.frameId   идентификатор iframe (для postMessage)
 * @param {string} options.theme     'light' | 'dark'
 * @returns {string} HTML, готовый к подстановке в srcdoc
 */
export function prepareHtml(rawHtml, { frameId, theme = 'light' }) {
  let html = String(rawHtml || '');

  // Фрагмент без <html> оборачиваем в документ
  if (!/<html[\s>]/i.test(html)) {
    html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"></head><body>${html}</body></html>`;
  }

  const head = [
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<base target="_blank">',
    notebookStyles(theme),
  ].join('\n');

  html = insertBefore(html, /<\/head\s*>/gi, head, 'first');

  html = insertBefore(html, /<\/body\s*>/gi, heightReporterScript(frameId), 'last');

  return html;
}
