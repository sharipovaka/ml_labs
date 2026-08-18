/**
 * Общий каркас раздела с материалами.
 *
 * Слева — список материалов, справа — <iframe> с выбранным ноутбуком.
 *
 * Выбранный материал определяется параметром маршрута :slug; если его нет,
 * открывается первый материал раздела.
 */

import { Link, useParams } from 'react-router-dom';

import ColabIcon from './ColabIcon';
import NotebookFrame from './NotebookFrame';
import { findMaterial, formatDate, groupMaterials } from '../content';
import { colabUrl, githubFileUrl } from '../config';
import { publicUrl } from '../utils/publicUrl';
import styles from './MaterialSection.module.css';

/** Одна ссылка в списке материалов. */
function MaterialLink({ item, sectionPath, isActive }) {
  return (
    <Link
      to={`${sectionPath}/${item.slug}`}
      className={`${styles.listItem} ${isActive ? styles.listItemActive : ''}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className={styles.listIcon}>
        <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
      </span>
      <span className={styles.listBody}>
        <span className={styles.listTitle}>{item.title}</span>
        <span className={styles.listDate}>{formatDate(item.date)}</span>
      </span>
    </Link>
  );
}

export default function MaterialSection({ section }) {
  const { slug } = useParams();
  const material = findMaterial(section.items, slug);

  // Материал с таким slug не найден — показываем понятное сообщение
  if (!material) {
    return (
      <div className="container">
        <div className="alert alert-warning d-flex align-items-center gap-3" role="alert">
          <i className="fa-solid fa-circle-question fa-lg" aria-hidden="true" />
          <div>
            Материал «{slug}» не найден.{' '}
            <Link to={section.path} className="alert-link">
              Вернуться к списку раздела
            </Link>
            .
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = section.items.indexOf(material);
  const previous = section.items[currentIndex - 1];
  const next = section.items[currentIndex + 1];
  const groups = groupMaterials(section.items);

  return (
    <div className="container">
      {/* --- Заголовок раздела --- */}
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            <i className={`fa-solid ${section.icon} me-2`} aria-hidden="true" />
            {section.label}
          </p>
          <h1 className={styles.title}>{section.title}</h1>
          <p className={styles.subtitle}>{section.subtitle}</p>
        </div>

        <span className="badge rounded-pill text-bg-light align-self-start">
          материалов: {section.items.length}
        </span>
      </header>

      <div className="row g-4">
        {/* --- Список материалов, разбитый на группы --- */}
        <aside className="col-lg-4 col-xl-3">
          <nav className={styles.list} aria-label={`Материалы раздела ${section.label}`}>
            {groups.map((group) => (
              <div key={group.name ?? 'all'} className={styles.group}>
                {group.name && <p className={styles.groupTitle}>{group.name}</p>}
                {group.items.map((item) => (
                  <MaterialLink
                    key={item.slug}
                    item={item}
                    sectionPath={section.path}
                    isActive={item.slug === material.slug}
                  />
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* --- Просмотрщик --- */}
        <div className="col-lg-8 col-xl-9">
          <div className={styles.meta}>
            <p className="mb-2">{material.description}</p>

            {/* Связка практикума с лекциями: работа k+1 закрепляет лекцию k.
                Сами лекционные материалы на сайте не публикуются. */}
            {material.coversLabel && (
              <p className="mb-2 small text-body-secondary">
                <i className="fa-solid fa-link me-2" aria-hidden="true" />
                {material.coversLabel}
              </p>
            )}

            <div className={styles.metaRow}>
              <div className={styles.tags}>
                {material.tags.map((tag) => (
                  <span key={tag} className={`badge rounded-pill ${styles.tag}`}>
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Действия с исходным ноутбуком. */}
              {material.source && (
                <div className={styles.actions}>
                  <a
                    className={`btn btn-sm ${styles.colabButton}`}
                    href={colabUrl(material.source)}
                    target="_blank"
                    rel="noreferrer noopener"
                    title="Запустить ноутбук в Google Colab"
                  >
                    <ColabIcon className={styles.colabIcon} />
                    Открыть в Colab
                  </a>

                  <a
                    className="btn btn-sm btn-outline-secondary"
                    href={githubFileUrl(material.source)}
                    target="_blank"
                    rel="noreferrer noopener"
                    title="Посмотреть исходник на GitHub"
                  >
                    <i className="fa-brands fa-github me-2" aria-hidden="true" />
                    GitHub
                  </a>

                  <a
                    className="btn btn-sm btn-outline-primary"
                    href={publicUrl(material.source)}
                    download
                    title="Скачать файл ноутбука"
                  >
                    <i className="fa-solid fa-download me-2" aria-hidden="true" />
                    .ipynb
                  </a>
                </div>
              )}
            </div>
          </div>

          <NotebookFrame material={material} />

          {/* --- Переход к соседним материалам --- */}
          <nav className={styles.pager} aria-label="Навигация по материалам">
            {previous ? (
              <Link
                className="btn btn-outline-secondary btn-sm"
                to={`${section.path}/${previous.slug}`}
              >
                <i className="fa-solid fa-arrow-left me-2" aria-hidden="true" />
                <span className="text-truncate">{previous.title}</span>
              </Link>
            ) : (
              <span />
            )}

            {next && (
              <Link className="btn btn-outline-secondary btn-sm" to={`${section.path}/${next.slug}`}>
                <span className="text-truncate">{next.title}</span>
                <i className="fa-solid fa-arrow-right ms-2" aria-hidden="true" />
              </Link>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
