/**
 * Абсолютный URL статического файла с учётом подпапки GitHub Pages.
 *
 * __webpack_public_path__ — глобальная переменная Webpack; в продакшене она
 * равна значению output.publicPath (например, '/ml-seminars/'), в dev-режиме '/'.
 * Благодаря ей ссылки на .ipynb работают и локально, и на GitHub Pages.
 */
export function publicUrl(path = '') {
  /* eslint-disable-next-line camelcase, no-undef */
  const base = typeof __webpack_public_path__ === 'string' ? __webpack_public_path__ : '/';
  return `${base.replace(/\/?$/, '/')}${String(path).replace(/^\//, '')}`;
}
