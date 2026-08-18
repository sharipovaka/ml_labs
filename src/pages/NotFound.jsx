/** Страница 404 для неизвестных маршрутов. */

import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container py-5 text-center">
      <p className="display-1 fw-bold ml-gradient-text mb-2">404</p>
      <h1 className="h4 mb-3">Такой страницы нет</h1>
      <p className="text-body-secondary mb-4">
        Возможно, материал переименовали или ссылка устарела.
      </p>
      <Link to="/" className="btn btn-primary">
        <i className="fa-solid fa-house me-2" aria-hidden="true" />
        На главную
      </Link>
    </div>
  );
}
