/**
 * Главная страница: краткое описание курса, лабораторные работы и домашние задания.
 */

import { Link } from 'react-router-dom';

import { labSessions, homework, materials, formatDate } from '../content';
import { repositoryUrl } from '../config';
import styles from './Home.module.css';

/** Карточка материала для сетки «последнее». */
function MaterialCard({ item, to, badge }) {
  return (
    <div className="col-12 col-md-6 col-lg-4">
      <Link to={to} className={styles.card}>
        <span className={styles.cardIcon}>
          <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
        </span>

        <span className={styles.cardBadge}>{badge}</span>
        {item.draft && <span className={styles.cardDraft}>черновик</span>}

        <h3 className={styles.cardTitle}>{item.title}</h3>
        <p className={styles.cardText}>{item.description}</p>

        <span className={styles.cardFooter}>
          <span className="text-body-secondary small">
            <i className="fa-regular fa-calendar me-2" aria-hidden="true" />
            {formatDate(item.date)}
          </span>
          <span className={styles.cardLink}>
            Открыть
            <i className="fa-solid fa-arrow-right ms-2" aria-hidden="true" />
          </span>
        </span>
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <div className="container">
      {/* --- Первый экран --- */}
      <section className={styles.hero}>
        <p className={styles.eyebrow}>4 курс</p>

        <h1 className={styles.heroTitle}>
          Машинное <span className="ml-gradient-text">обучение</span>
        </h1>

        <p className={styles.heroText}>
          Практикум чередуется с лекциями и начинается лабораторной работой:
          каждое занятие закрепляет уже прочитанный материал. Занятие — это
          лабораторная в аудитории и домашняя работа, где методы пишутся с нуля.
          Ноутбуки конвертируются в HTML командой <code>pandoc</code> и
          открываются прямо на странице — ничего скачивать и запускать не нужно.
        </p>

        <div className={styles.heroActions}>
          <Link to="/notebooks" className="btn btn-primary btn-lg">
            <i className="fa-solid fa-flask me-2" aria-hidden="true" />
            Лабораторные работы
          </Link>
          <a
            className="btn btn-outline-primary btn-lg"
            href={repositoryUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            <i className="fa-brands fa-github me-2" aria-hidden="true" />
            Исходники на GitHub
          </a>
        </div>

        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>{labSessions.length}</dt>
            <dd>занятий практикума</dd>
          </div>
          <div className={styles.stat}>
            <dt>{materials.length}</dt>
            <dd>ноутбуков: лабораторные и домашние работы</dd>
          </div>
          <div className={styles.stat}>
            <dt>17</dt>
            <dd>занятий в семестре вместе с лекциями</dd>
          </div>
        </dl>
      </section>

      {/* --- Лабораторные работы --- */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <i className="fa-solid fa-flask me-2 text-primary" aria-hidden="true" />
            Лабораторные работы
          </h2>
          <Link to="/notebooks" className="btn btn-sm btn-outline-secondary">
            Все материалы
            <i className="fa-solid fa-arrow-right ms-2" aria-hidden="true" />
          </Link>
        </header>

        <div className="row g-3">
          {labSessions.slice(0, 3).map((item) => (
            <MaterialCard
              key={item.slug}
              item={item}
              to={`/notebooks/${item.slug}`}
              badge="Лабораторная"
            />
          ))}
        </div>
      </section>

      {/* --- Домашние задания --- */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <i className="fa-solid fa-house-laptop me-2 text-primary" aria-hidden="true" />
            Домашние задания
          </h2>
          <Link to="/notebooks" className="btn btn-sm btn-outline-secondary">
            Все материалы
            <i className="fa-solid fa-arrow-right ms-2" aria-hidden="true" />
          </Link>
        </header>

        <p className={styles.sectionText}>
          Домашняя работа выполняется на индивидуальной таблице: она порождается
          по вашему ФИО, и ни у кого в группе она не повторяется. Приёмы те же,
          что на занятии, — числа свои.
        </p>

        <div className="row g-3">
          {homework.slice(0, 3).map((item) => (
            <MaterialCard
              key={item.slug}
              item={item}
              to={`/notebooks/${item.slug}`}
              badge="Домашняя работа"
            />
          ))}
        </div>
      </section>

    </div>
  );
}
