/**
 * NotebookFrame — компонент, который показывает материал внутри <iframe srcdoc>.
 *
 * Почему именно srcdoc, а не src:
 *  • HTML лежит в бандле (импортируется как строка), отдельных запросов нет —
 *    значит, ничего не сломается из-за подпапки GitHub Pages;
 *  • sandbox изолирует стили и скрипты ноутбука от стилей сайта.
 *
 * Высота подстраивается автоматически: скрипт внутри iframe шлёт свою высоту
 * через postMessage (см. utils/notebookHtml.js).
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { useTheme } from '../context/ThemeContext';
import { FRAME_MESSAGE_SOURCE, prepareHtml } from '../utils/notebookHtml';
import styles from './NotebookFrame.module.css';

const MIN_HEIGHT = 480;
const MAX_HEIGHT = 40000;

export default function NotebookFrame({ material }) {
  const frameId = useId();
  const { theme } = useTheme();

  const containerRef = useRef(null);
  const [rawHtml, setRawHtml] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [height, setHeight] = useState(MIN_HEIGHT);
  const [isFullscreen, setFullscreen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  // --- Загрузка HTML-чанка по требованию ---
  useEffect(() => {
    let cancelled = false;

    setStatus('loading');
    setError(null);
    setHeight(MIN_HEIGHT);

    material
      .load()
      .then((module) => {
        if (cancelled) return;
        // asset/source отдаёт строку в default
        setRawHtml(module.default ?? module);
        setStatus('ready');
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(loadError);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [material, reloadToken]);

  // --- Подготовленный HTML для srcdoc (пересобирается при смене темы) ---
  const srcDoc = useMemo(() => {
    if (!rawHtml) return null;
    return prepareHtml(rawHtml, { frameId, theme });
  }, [rawHtml, frameId, theme]);

  // --- Приём высоты от содержимого iframe ---
  useEffect(() => {
    function handleMessage(event) {
      const data = event.data;
      if (!data || data.source !== FRAME_MESSAGE_SOURCE || data.frameId !== frameId) return;

      const next = Number(data.height);
      if (!Number.isFinite(next)) return;

      setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.ceil(next) + 16)));
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [frameId]);

  // --- Полноэкранный режим ---
  useEffect(() => {
    function onFullscreenChange() {
      setFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen?.();
    }
  }, []);

  // --- Открыть материал в отдельной вкладке (через blob: URL) ---
  const openInNewTab = useCallback(() => {
    if (!srcDoc) return;
    const url = URL.createObjectURL(new Blob([srcDoc], { type: 'text/html;charset=utf-8' }));
    window.open(url, '_blank', 'noopener');
    // Освобождаем память, когда вкладка точно успела загрузиться
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, [srcDoc]);

  return (
    <section className={styles.wrapper}>
      {/* --- Панель инструментов --- */}
      <header className={styles.toolbar}>
        <div className={styles.toolbarTitle}>
          <i
            className={`fa-solid fa-book-open ${styles.toolbarIcon}`}
            aria-hidden="true"
          />
          <span className="text-truncate">{material.title}</span>
        </div>

        <div className={styles.toolbarActions}>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setReloadToken((value) => value + 1)}
            title="Перезагрузить материал"
          >
            <i className="fa-solid fa-rotate-right" aria-hidden="true" />
            <span className="d-none d-md-inline ms-2">Обновить</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={openInNewTab}
            disabled={status !== 'ready'}
            title="Открыть в новой вкладке"
          >
            <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
            <span className="d-none d-md-inline ms-2">В новой вкладке</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Во весь экран'}
          >
            <i
              className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}
              aria-hidden="true"
            />
            <span className="d-none d-md-inline ms-2">
              {isFullscreen ? 'Свернуть' : 'Во весь экран'}
            </span>
          </button>
        </div>
      </header>

      {/* --- Область просмотра --- */}
      <div
        ref={containerRef}
        className={`${styles.viewport} ${isFullscreen ? styles.fullscreen : ''}`}
      >
        {status === 'loading' && (
          <div className={styles.placeholder}>
            <div className="spinner-border text-primary" role="status" aria-hidden="true" />
            <p className="mt-3 mb-0 text-body-secondary">Загружаем материал…</p>
          </div>
        )}

        {status === 'error' && (
          <div className={`${styles.placeholder} text-center`}>
            <i className="fa-solid fa-triangle-exclamation fa-2x text-warning" aria-hidden="true" />
            <p className="mt-3 mb-1 fw-semibold">Не удалось загрузить материал</p>
            <p className="mb-3 text-body-secondary small">
              {error?.message ||
                'Проверьте, что HTML сгенерирован командой npm run convert и лежит в src/content/.'}
            </p>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => setReloadToken((value) => value + 1)}
            >
              Попробовать снова
            </button>
          </div>
        )}

        {status === 'ready' && srcDoc && (
          <iframe
            key={`${material.slug}-${reloadToken}`}
            className={styles.frame}
            title={material.title}
            /* React сам экранирует содержимое атрибута — ручное экранирование не нужно */
            srcDoc={srcDoc}
            style={{ height: `${height}px` }}
            /* Скрипты нужны (MathJax), но без allow-same-origin:
               содержимое живёт в изолированном origin и не имеет доступа к сайту */
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads allow-forms"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    </section>
  );
}
