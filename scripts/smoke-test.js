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

/** Каталог материала внутри src/content -- берётся из пути к исходному ноутбуку. */
function contentDir(item) {
  const match = item.source.match(/notebooks\/([^/]+)\//);
  if (!match) throw new Error(`${item.slug}: непонятный source ${item.source}`);
  return match[1];
}

console.log('Реестр материалов');

check('публикуется столько занятий, сколько отмечено готовыми', () => {
  // На сайт попадают только занятия из READY_SESSIONS: незаконченный материал
  // рядом с готовым путает. Пара «лабораторная + домашняя» неразрывна,
  // плюс справочные материалы, которые к занятиям не привязаны.
  const n = content.labSessions.length;
  const expected = 2 * n + content.reference.length;
  if (n === 0) throw new Error('не опубликовано ни одного занятия');
  if (content.homework.length !== n) throw new Error(`домашних ${content.homework.length} при ${n} лабораторных`);
  if (content.materials.length !== expected) {
    throw new Error(`всего ${content.materials.length}, ожидалось ${expected}`);
  }
});

check('у каждого материала заполнены обязательные поля', () => {
  const required = [
    'slug', 'title', 'description', 'date', 'tags', 'icon', 'group', 'source', 'load',
  ];
  content.materials.forEach((lab) => {
    required.forEach((field) => {
      if (lab[field] === undefined) throw new Error(`${lab.slug}: нет поля ${field}`);
    });
  });
});

check('slug уникальны и совпадают с именами файлов', () => {
  const seen = new Set();
  content.materials.forEach((lab) => {
    if (seen.has(lab.slug)) throw new Error(`повтор slug: ${lab.slug}`);
    seen.add(lab.slug);
    const notebook = path.join(ROOT, lab.source);
    if (!fs.existsSync(notebook)) throw new Error(`нет файла ${lab.source}`);
    if (path.basename(lab.source, '.ipynb') !== lab.slug) {
      throw new Error(`${lab.slug}: имя файла не совпадает со slug`);
    }
    const html = path.join(SRC, 'content', contentDir(lab), `${lab.slug}.html`);
    if (!fs.existsSync(html)) throw new Error(`нет HTML для ${lab.slug} (запустите npm run convert)`);
  });
});

check('материалы сгруппированы парами по занятиям', () => {
  const groups = content.groupMaterials(content.materials);
  const sessions = groups.filter((g) => /^Занятие \d+$/.test(g.name));
  if (sessions.length !== content.labSessions.length) throw new Error(`групп занятий ${sessions.length}`);
  sessions.forEach((group) => {
    const kinds = group.items.map((item) => item.kind).join(',');
    if (kinds !== 'lab,homework') throw new Error(`${group.name}: ${kinds}`);
  });
  // Справочные материалы к занятию не привязаны и идут отдельной группой.
  if (content.reference.length) {
    const refGroup = groups.find((g) => g.items.every((item) => item.kind === 'reference'));
    if (!refGroup) throw new Error('справочные материалы не выделены в свою группу');
    if (groups[0] !== refGroup) throw new Error('справочная группа не первая');
  }
});

check('опубликованный HTML — настоящий ноутбук, а не заглушка', () => {
  // Файлы в src/content правились вручную и превращались в <h1>lab</h1>;
  // сайт при этом собирался, а страница открывалась пустой.
  content.materials.forEach((item) => {
    const html = fs.readFileSync(path.join(SRC, 'content', contentDir(item), `${item.slug}.html`), 'utf8');
    if (html.length < 10000) throw new Error(`${item.slug}.html: ${html.length} байт — похоже на заглушку`);
    // Отбрасываем «Лабораторная 1.» / «Чеклист:» и сверяем содержательную часть.
    // Пробелы схлопываем: pandoc переносит длинный заголовок по строкам.
    const flat = (t) => t.toLowerCase().replace(/\s+/g, ' ');
    const subject = flat(item.title.replace(/^[^.:]*[.:]\s*/, ''));
    if (!flat(html).includes(subject)) {
      throw new Error(`${item.slug}.html: нет названия «${subject}»`);
    }
  });
});

check('решения не попали в опубликованные материалы', () => {
  content.materials.forEach((lab) => {
    if (lab.source.includes('solution')) throw new Error(`${lab.slug}: решение в реестре`);
  });
  ['labs', 'homework', 'reference'].forEach((dir) => {
    const full = path.join(ROOT, 'notebooks', dir);
    if (!fs.existsSync(full)) return;
    fs.readdirSync(full).forEach((name) => {
      if (name.includes('solution')) throw new Error(`решение в notebooks/${dir}: ${name}`);
    });
  });
});

check('у домашних работ есть дедлайн накануне следующего занятия', () => {
  const homework = content.materials.filter((item) => item.kind === 'homework');
  homework.forEach((item) => {
    if (!item.deadline) throw new Error(`${item.slug}: нет дедлайна`);
    const days = (new Date(item.deadline) - new Date(item.date)) / 86400000;
    if (days !== 13) throw new Error(`${item.slug}: до дедлайна ${days} дней вместо 13`);
  });
  content.materials.filter((item) => item.kind !== 'homework').forEach((item) => {
    if (item.deadline) throw new Error(`${item.slug}: дедлайн у не-домашней работы`);
  });
});

check('у каждого материала есть вариант в форме обратной связи', () => {
  // Google подставляет значение в выпадающий список, только если оно точно
  // совпадает с вариантом; иначе отзыв приходит без пометки о материале.
  const { formOption } = require(path.join(SRC, 'config.js'));
  const missing = content.materials.filter((item) => !formOption(item)).map((item) => item.title);
  if (missing.length) throw new Error(`нет вариантов в форме: ${missing.join('; ')}`);
});

check('findMaterial находит по slug и по умолчанию', () => {
  const { findMaterial, materials: labs } = content;
  const last = labs[labs.length - 1];
  if (findMaterial(labs, last.slug) !== last) throw new Error('поиск по slug');
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
content.materials.forEach((lab) => {
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

    // Пометка черновика должна быть видна до самого материала -- и не должна
    // появляться у готовых занятий.
    const warned = html.includes('Черновик — не актуальная версия');
    if (lab.draft && !warned) throw new Error('черновик без предупреждения');
    if (!lab.draft && warned) throw new Error('готовый материал помечен черновиком');
    if (lab.coversLabel && !html.includes(lab.coversLabel.slice(0, 24))) {
      throw new Error('нет связи с лекцией');
    }
  });
});

console.log(failed ? `\nПровалено проверок: ${failed}` : '\nВсе проверки пройдены.');
process.exit(failed ? 1 : 0);
