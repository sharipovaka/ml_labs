/**
 * Верхняя навигационная панель (Bootstrap Navbar).
 *
 * Особенности вёрстки:
 *  • логотип расположен СПРАВА на десктопе (order-lg-3) и слева на мобильных;
 *  • пункты меню — <NavLink> из React Router: переход без перезагрузки,
 *    активный раздел подсвечивается автоматически;
 *  • выпадающий список (Bootstrap Dropdown) даёт быстрый доступ к любому материалу;
 *  • состояние мобильного меню хранится в React-стейте, а не в data-api Bootstrap,
 *    чтобы не было двойного переключения класса .show.
 */

import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { groupMaterials, notebooks } from '../content';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo.svg';
import styles from './Navigation.module.css';

/** Пункт меню верхнего уровня. */
function NavItem({ to, icon, children, end = false }) {
  return (
    <li className="nav-item">
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          `nav-link ${styles.navLink} ${isActive ? `active ${styles.active}` : ''}`
        }
      >
        <i className={`fa-solid ${icon} ${styles.navIcon}`} aria-hidden="true" />
        {children}
      </NavLink>
    </li>
  );
}

export default function Navigation() {
  const [expanded, setExpanded] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  // Закрываем мобильное меню при любом переходе
  useEffect(() => {
    setExpanded(false);
  }, [location.pathname]);

  return (
    <nav className={`navbar navbar-expand-lg sticky-top ${styles.navbar}`}>
      <div className="container">
        {/* --- Логотип: справа на широких экранах --- */}
        <Link to="/" className={`navbar-brand order-0 order-lg-3 me-0 ${styles.brand}`}>
          <span className={styles.brandText}>
            ML<span className={styles.brandAccent}>Seminars</span>
          </span>
          <img src={logo} alt="Логотип курса" width="36" height="36" className={styles.logo} />
        </Link>

        {/* --- Кнопки: тема + бургер --- */}
        <div className="d-flex align-items-center gap-2 order-1 order-lg-2 ms-lg-auto">
          <button
            type="button"
            className={`btn btn-sm ${styles.themeButton}`}
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} aria-hidden="true" />
          </button>

          <button
            type="button"
            className={`navbar-toggler ${styles.toggler}`}
            onClick={() => setExpanded((value) => !value)}
            aria-controls="mainNavbar"
            aria-expanded={expanded}
            aria-label="Показать или скрыть меню"
          >
            <span className="navbar-toggler-icon" />
          </button>
        </div>

        {/* --- Ссылки на разделы --- */}
        <div
          id="mainNavbar"
          className={`collapse navbar-collapse order-2 order-lg-1 ${expanded ? 'show' : ''}`}
        >
          <ul className="navbar-nav align-items-lg-center gap-lg-1 py-2 py-lg-0">
            <NavItem to="/" icon="fa-house" end>
              Home
            </NavItem>
            <NavItem to="/notebooks" icon="fa-book">
              Notebooks
            </NavItem>

            {/* --- Выпадающий список всех материалов --- */}
            <li className="nav-item dropdown">
              <button
                type="button"
                className={`nav-link dropdown-toggle ${styles.navLink}`}
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className={`fa-solid fa-layer-group ${styles.navIcon}`} aria-hidden="true" />
                Материалы
              </button>

              <ul className={`dropdown-menu dropdown-menu-end ${styles.dropdown}`}>
                {/* Лабораторные работы практикума */}
                {groupMaterials(notebooks).map((group, index) => (
                  <li key={group.name ?? index}>
                    {index > 0 && <hr className="dropdown-divider" />}
                    <h6 className="dropdown-header">
                      <i className="fa-solid fa-book me-2" aria-hidden="true" />
                      {group.name ?? 'Ноутбуки'}
                    </h6>
                    <ul className={styles.dropdownGroup}>
                      {group.items.map((item) => (
                        <li key={item.slug}>
                          <Link className="dropdown-item" to={`/notebooks/${item.slug}`}>
                            {item.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}

              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
