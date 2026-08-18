/**
 * Каркас страницы: навигация сверху, содержимое раздела в <Outlet />, подвал снизу.
 * Смена раздела не перезагружает страницу — меняется только содержимое <main>.
 */

import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import Navigation from './Navigation';
import Footer from './Footer';
import styles from './Layout.module.css';

export default function Layout() {
  const { pathname } = useLocation();

  // При переходе в другой раздел возвращаем прокрутку наверх
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className={styles.shell}>
      {/* Доступность: быстрый переход к содержимому с клавиатуры */}
      <a className="ml-skip-link" href="#main-content">
        Перейти к содержимому
      </a>

      <Navigation />

      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
