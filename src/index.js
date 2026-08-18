/**
 * Точка входа приложения.
 * Порядок импортов важен: сначала Bootstrap, затем Font Awesome,
 * затем собственные глобальные стили (чтобы наши правила перекрывали Bootstrap).
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Bootstrap 5: стили + JS-бандл (нужен для Navbar collapse и Dropdown)
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Font Awesome 6 (иконки в навигации и карточках)
import '@fortawesome/fontawesome-free/css/all.min.css';

// Глобальные (немодульные) стили проекта
import './styles/global.css';

import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
