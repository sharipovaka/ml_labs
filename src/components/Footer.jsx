/** Подвал сайта: контакты, ссылка на исходники и краткая справка о стеке. */

import { Link } from 'react-router-dom';

import { repositoryUrl } from '../config';
import styles from './Footer.module.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className="row g-4 align-items-start">
          <div className="col-md-5">
            <p className={styles.title}>ML Seminars</p>
            <p className={styles.text}>
              Материалы практикума по машинному обучению. Собрано из Jupyter-ноутбуков
              с помощью pandoc, React и Bootstrap 5.
            </p>
          </div>

          <div className="col-6 col-md-3">
            <p className={styles.heading}>Разделы</p>
            <ul className={styles.list}>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/notebooks">Notebooks</Link>
              </li>
            </ul>
          </div>

          <div className="col-6 col-md-4">
            <p className={styles.heading}>Исходники</p>
            <ul className={styles.list}>
              <li>
                <a href={repositoryUrl} target="_blank" rel="noreferrer noopener">
                  <i className="fa-brands fa-github me-2" aria-hidden="true" />
                  Репозиторий курса
                </a>
              </li>
              <li>
                <a
                  href="https://pandoc.org/MANUAL.html"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <i className="fa-solid fa-book-open me-2" aria-hidden="true" />
                  Документация pandoc
                </a>
              </li>
            </ul>
          </div>
        </div>

        <hr className={styles.divider} />

        <p className={styles.copyright}>
          © {year} K. A. Sharipova. Материалы распространяются по лицензии{' '}
          <a href={`${repositoryUrl}/blob/main/LICENSE`} target="_blank" rel="noreferrer noopener">
            MIT
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
