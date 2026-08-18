/**
 * Корневой компонент: маршрутизация без перезагрузки страницы.
 *
 * Используется HashRouter — самый надёжный вариант для GitHub Pages:
 * статический хостинг не умеет отдавать index.html на произвольный путь,
 * а адреса вида /ml-seminars/#/notebooks работают всегда и без 404.html.
 *
 * Альтернатива — BrowserRouter (красивые URL без «#»):
 *
 *   import { BrowserRouter } from 'react-router-dom';
 *   // __webpack_public_path__ подставляется Webpack'ом ('/ml-seminars/')
 *   const basename = new URL(__webpack_public_path__, window.location.origin).pathname;
 *   <BrowserRouter basename={basename}> ... </BrowserRouter>
 *
 * В этом случае нужно после сборки скопировать dist/index.html в dist/404.html,
 * иначе прямой переход по ссылке даст 404 (см. README).
 */

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import { ThemeProvider } from './context/ThemeContext';
import Home from './pages/Home';
import Notebooks from './pages/Notebooks';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          {/* Общий каркас: навигация + подвал, содержимое подставляется в <Outlet /> */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />

            {/* Раздел «Notebooks»: без slug открывается первый материал */}
            <Route path="notebooks" element={<Notebooks />} />
            <Route path="notebooks/:slug" element={<Notebooks />} />

            {/* Старые адреса на русском — на всякий случай */}
            <Route path="ноутбуки" element={<Navigate to="/notebooks" replace />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
