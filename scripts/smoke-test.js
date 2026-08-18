/**
 * Дымовой тест сайта без браузера.
 *
 *   npm test
 *
 * Зачем. Webpack проверяет только синтаксис: файл, в котором функция
 * вызывается, но нигде не определена, соберётся без единой ошибки, а упадёт
 * уже в браузере — белым экраном. Такое легко получить при правке модулей.
 * Этот тест транспилирует исходники через @babel/core, рендерит страницы
 * в строку (react-dom/server) и вызывает чистые функции — все ReferenceError
 * всплывают сразу.
 *
 * Тест намеренно не требует ничего сверх devDependencies проекта: ни jest,
 * ни jsdom, ни headless-браузера. Он не заменяет проверку глазами
 * (вёрстку и поведение iframe так не проверить), но ловит падения при рендере.
 */

const path = require('path');
const fs = require('fs');
const Module = require('module');
const babel = require('@babel/core');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

// --- заглушки для не-JS импортов ------------------------------------------
// CSS-модули отдают имя класса по его же ключу: styles.foo === 'foo'.
for (const ext of ['.css', '.svg', '.png', '.ico']) {
  Module._extensions[ext] = (module) => {
    module.exports = new Proxy({}, { get: (_target, key) => String(key) });
  };
}
// HTML материалов подменяем минимальным документом: содержимое не проверяем,
// важно лишь, что модуль загружается и обрабатывается без ошибок.
Module._extensions['.html'] = (module) => {
  module.exports = '<!doctype html><html><head></head><body><p>тест</p></body></html>';
};

// --- транспиляция JSX на лету ---------------------------------------------
const compileJs = Module._extensions['.js'];
function transform(module, filename) {
  if (!filename.startsWith(SRC)) return compileJs(module, filename);
  const { code } = babel.transformFileSync(filename, {
    cwd: ROOT,
    babelrc: false,
    configFile: false,
    presets: [
      [require.resolve('@babel/preset-env'), { targets: { node: 'current' } }],
      [require.resolve('@babel/preset-react'), { runtime: 'automatic' }],
    ],
  });
  return module._compile(code, filename);
}
Module._extensions['.js'] = transform;
Module._extensions['.jsx'] = transform;

// --- собственно проверки ---------------------------------------------------
const React = require('react');
const { renderToString } = require('react-dom/server');
const { MemoryRouter, Routes, Route } = require('react-router-dom');

// react-router на сервере предупреждает про useLayoutEffect в каждом <Link>;
// к тому, что мы проверяем, это отношения не имеет — глушим, чтобы вывод читался.
const consoleError = console.error;
console.error = (...args) =>
  String(args[0]).includes('useLayoutEffect') ? undefined : consoleError(...args);

let failed = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  ✗ ${name}\n      ${error.constructor.name}: ${error.message}`);
  }
}

const content = require(path.join(SRC, 'content/index.js'));
const { prepareHtml } = require(path.join(SRC, 'utils/notebookHtml.js'));

console.log('Реестр материалов');

check('девять семинаров и девять домашних работ', () => {
  if (content.seminars.length !== 9) throw new Error(`семинаров ${content.seminars.length}`);
  if (content.homework.length !== 9) throw new Error(`домашних ${content.homework.length}`);
  if (content.labs.length !== 18) throw new Error(`всего ${content.labs.length}`);
});

check('у каждого материала заполнены обязательные поля', () => {
  const required = [
    'slug', 'title', 'description', 'date', 'tags', 'icon', 'group', 'source', 'load',
  ];
  content.labs.forEach((lab) => {
    required.forEach((field) => {
      if (lab[field] === undefined) throw new Error(`${lab.slug}: нет поля ${field}`);
    });
  });
});

check('slug уникальны и совпадают с именами файлов', () => {
  const seen = new Set();
  content.labs.forEach((lab) => {
    if (seen.has(lab.slug)) throw new Error(`повтор slug: ${lab.slug}`);
    seen.add(lab.slug);
    const notebook = path.join(ROOT, lab.source);
    if (!fs.existsSync(notebook)) throw new Error(`нет файла ${lab.source}`);
    if (path.basename(lab.source, '.ipynb') !== lab.slug) {
      throw new Error(`${lab.slug}: имя файла не совпадает со slug`);
    }
    // семинары лежат в content/labs, домашние — в content/homework
    const dir = lab.source.includes('/homework/') ? 'homework' : 'labs';
    const html = path.join(SRC, 'content', dir, `${lab.slug}.html`);
    if (!fs.existsSync(html)) throw new Error(`нет HTML для ${lab.slug} (запустите npm run convert)`);
  });
});

check('материалы разбиваются ровно на две группы', () => {
  const groups = content.groupMaterials(content.labs);
  if (groups.length !== 2) throw new Error(`групп ${groups.length}`);
  if (groups[0].items.length !== 9 || groups[1].items.length !== 9) {
    throw new Error('группы разного размера');
  }
});

check('решения не попали в опубликованные материалы', () => {
  content.labs.forEach((lab) => {
    if (lab.source.includes('solution')) throw new Error(`${lab.slug}: решение в реестре`);
  });
  ['labs', 'homework'].forEach((dir) => {
    const full = path.join(ROOT, 'notebooks', dir);
    if (!fs.existsSync(full)) return;
    fs.readdirSync(full).forEach((name) => {
      if (name.includes('solution')) throw new Error(`решение в notebooks/${dir}: ${name}`);
    });
  });
});

check('findMaterial находит по slug и по умолчанию', () => {
  const { findMaterial, labs } = content;
  if (findMaterial(labs, labs[3].slug) !== labs[3]) throw new Error('поиск по slug');
  if (findMaterial(labs) !== labs[0]) throw new Error('без slug должен быть первый');
  if (findMaterial(labs, 'нет-такого') !== undefined) throw new Error('несуществующий slug');
});

console.log('\nПодготовка HTML для iframe');

check('prepareHtml вставляет стили и скрипт высоты', () => {
  const out = prepareHtml('<html><head></head><body>x</body></html>', {
    frameId: 'frame-1',
    theme: 'light',
  });
  if (!out.includes('<style>')) throw new Error('стили не вставлены');
  if (!out.includes('frame-1')) throw new Error('скрипт высоты не вставлен');
});

check('prepareHtml оборачивает фрагмент без <html>', () => {
  const out = prepareHtml('<p>фрагмент</p>', { frameId: 'frame-2', theme: 'dark' });
  if (!out.startsWith('<!doctype html>')) throw new Error('фрагмент не обёрнут в документ');
});

check('prepareHtml переживает пустой ввод', () => {
  prepareHtml('', { frameId: 'frame-3', theme: 'light' });
  prepareHtml(null, { frameId: 'frame-4', theme: 'light' });
});

console.log('\nРендер страниц');

const render = (element, route = '/') =>
  renderToString(React.createElement(MemoryRouter, { initialEntries: [route] }, element));

const pages = [
  ['Home', 'src/pages/Home.jsx', '/', 'Лабораторные работы'],
  ['Notebooks', 'src/pages/Notebooks.jsx', '/notebooks', 'Инструменты, данные'],
  ['NotFound', 'src/pages/NotFound.jsx', '/нет-такой-страницы', null],
  ['Navigation', 'src/components/Navigation.jsx', '/', null],
  ['Footer', 'src/components/Footer.jsx', '/', null],
];

pages.forEach(([name, file, route, expect]) => {
  check(`${name} рендерится без ошибок`, () => {
    const Component = require(path.join(ROOT, file)).default;
    const html = render(React.createElement(Component), route);
    if (expect && !html.includes(expect)) throw new Error(`в разметке нет «${expect}»`);
  });
});

// Отдельно проверяем открытие материала по :slug — именно этот путь падал
// белым экраном. Нужен настоящий <Routes>, иначе useParams пуст.
content.labs.forEach((lab) => {
  check(`${lab.slug} открывается по своему адресу`, () => {
    const Notebooks = require(path.join(ROOT, 'src/pages/Notebooks.jsx')).default;
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: [`/notebooks/${lab.slug}`] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: '/notebooks/:slug',
            element: React.createElement(Notebooks),
          }),
        ),
      ),
    );
    if (!html.includes(lab.title)) throw new Error('в разметке нет заголовка работы');
    if (!html.includes('Открыть в Colab')) throw new Error('нет кнопок действий');
    if (lab.coversLabel && !html.includes(lab.coversLabel.slice(0, 24))) {
      throw new Error('нет связи с лекцией');
    }
  });
});

console.log(failed ? `\nПровалено проверок: ${failed}` : '\nВсе проверки пройдены.');
process.exit(failed ? 1 : 0);
