/**
 * Тема оформления (светлая / тёмная).
 *
 * Bootstrap 5.3 переключается атрибутом data-bs-theme на <html>.
 * Тема также передаётся внутрь <iframe> с ноутбуком, чтобы содержимое
 * не «слепило» белым фоном в тёмном интерфейсе.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'ml-seminars:theme';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

/** Тема из localStorage, иначе — системная настройка пользователя. */
function getInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* localStorage может быть недоступен (приватный режим) — игнорируем */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* не критично */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
