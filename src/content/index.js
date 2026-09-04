/**
 * Реестр материалов курса «Машинное обучение» (4 курс).
 *
 * Практикум чередуется с курсом лекций, причём курс начинается лабораторной:
 *
 *     Лаб 1 → Лек 1 → Лаб 2 → Лек 2 → … → Лек 8 → Лаб 9
 *
 * Отсюда сдвиг на шаг: занятие k+1 закрепляет лекцию k. Восемь лекций дают
 * девять занятий — одно вводное (до первой лекции) и по одному на каждую лекцию.
 * Поле `coversLabel` показывает, на какую лекцию опирается занятие.
 *
 * Каждое занятие — это два ноутбука:
 *
 *   notebooks/labs/lab-NN-*.ipynb     — лабораторная: рабочий код, который
 *                                       разбирается в аудитории за 2 часа,
 *                                       плюс 2–4 короткие ячейки «ЗАДАНИЕ
 *                                       НА СЕМИНАРЕ» для заполнения на паре;
 *   notebooks/homework/hw-NN-*.ipynb  — домашняя работа: 2–3 задачи с TODO,
 *                                       где методы пишутся с нуля и сверяются
 *                                       со scikit-learn.
 *
 * Данные разведены по границе «аудитория — дом»: семинар идёт на учебных
 * данных, одинаковых у всех (titanic, diabetes, wine, breast_cancer, синтетика
 * с известным распределением), домашняя — на индивидуальной таблице, которая
 * порождается по ФИО студента (variants.py). В аудитории это даёт
 * воспроизводимость, дома — несписываемость.
 *
 * Эталонные решения на сайте не публикуются. Лекционные материалы — тоже.
 *
 * HTML не импортируется статически: поле `load` — это динамический import(),
 * поэтому Webpack кладёт каждый материал в отдельный чанк и грузит его только
 * при открытии. Начальный бандл остаётся лёгким, хотя материалов почти два десятка.
 *
 * ▸ КАК ДОБАВИТЬ НОВЫЙ МАТЕРИАЛ
 *   1. Положить .ipynb в notebooks/labs/ (лабораторная) или notebooks/homework/.
 *   2. Выполнить `npm run convert` — pandoc создаст HTML в src/content/.
 *   3. Добавить сюда объект с тем же slug, что и имя файла.
 */

const LAB_GROUP = 'Лабораторные работы (в аудитории)';
const HOMEWORK_GROUP = 'Домашние работы';

/** Лабораторные работы: рабочий код занятия и задания для заполнения на паре. */
/**
 * Справочные материалы — не занятия: их не проходят на паре, к ним
 * обращаются. Идут в списке первыми, до занятия 1.
 */
const REFERENCE = [
  {
    slug: 'checklist-numpy-pandas',
    group: 'Перед началом',
    title: 'Чеклист. Что нужно знать про NumPy и pandas',
    description:
      'Закрытый список того, что нужно уметь к первому занятию: по девять пунктов на NumPy и pandas, собранных по коду самого занятия. Восемь задач на проверку себя с разбором ответов, раздел «чего знать не нужно» и ссылки на короткие официальные руководства.',
    date: '2026-09-03',
    tags: ['NumPy', 'pandas', 'подготовка'],
    icon: 'fa-list-check',
    coversLabel: 'Прочитать до занятия 1',
    source: 'notebooks/reference/checklist-numpy-pandas.ipynb',
    load: () => import(/* webpackChunkName: "ref-checklist" */ './reference/checklist-numpy-pandas.html'),
  },
];

const LAB_SESSIONS = [
  {
    slug: 'lab-01-tools-data',
    group: LAB_GROUP,
    title: 'Лабораторная 1. Инструменты, данные и первый ориентир',
    description:
      'Векторизация в NumPy вместо циклов. Разбор «Титаника»: словарь столбцов и describe, разведочный анализ на seaborn (гистограммы, countplot, ящик и скрипка, матрица диаграмм, тепловая карта), ложная связь порта с выживанием и пропуск как признак. Карта корреляций сама находит утечку (alive совпадает с ответом) и признаки-дубликаты; сколько стоит dropna(); типы признаков и кодирование; разбиение без утечек и константный ориентир.',
    date: '2026-09-03',
    tags: ['NumPy', 'pandas', 'seaborn', 'разведочный анализ', 'утечка данных'],
    icon: 'fa-magnifying-glass-chart',
    coversLabel: 'Идёт до лекции 1 — теория курса ещё не нужна',
    source: 'notebooks/labs/lab-01-tools-data.ipynb',
    load: () => import(/* webpackChunkName: "lab-01" */ './labs/lab-01-tools-data.html'),
  },
  {
    slug: 'lab-02-erm-least-squares',
    group: LAB_GROUP,
    title: 'Лабораторная 2. Эмпирический риск и метод наименьших квадратов',
    description:
      'Функция потерь задаёт, что мы восстанавливаем; численная проверка утверждения 1.14 и формул E Q = σ²(1−p/ℓ); собственный эталон курса — МНК на восьми кошках; полиномы и первое переобучение.',
    date: '2026-09-17',
    tags: ['ERM', 'МНК', 'функции потерь', 'переобучение'],
    icon: 'fa-square-root-variable',
    coversLabel: 'Закрепляет лекцию 1 — «Математическая постановка задачи обучения. Данные и модель»',
    source: 'notebooks/labs/lab-02-erm-least-squares.ipynb',
    load: () => import(/* webpackChunkName: "lab-02" */ './labs/lab-02-erm-least-squares.html'),
  },
  {
    slug: 'lab-03-gradient-regularization',
    group: LAB_GROUP,
    title: 'Лабораторная 3. Градиентный спуск, обусловленность и регуляризация',
    description:
      'Граница шага 1/λ_max оказывается точной; цена плохой обусловленности в числе итераций; мультиколлинеарность и бутстреп-облако оценок; что Ridge и LASSO делают с решением; когда регуляризация вообще нужна (p > ℓ).',
    date: '2026-10-01',
    tags: ['градиентный спуск', 'обусловленность', 'Ridge', 'LASSO'],
    icon: 'fa-chart-line',
    coversLabel: 'Закрепляет лекцию 2 — «Линейные модели: градиентный спуск и регуляризация»',
    source: 'notebooks/labs/lab-03-gradient-regularization.ipynb',
    load: () =>
      import(/* webpackChunkName: "lab-03" */ './labs/lab-03-gradient-regularization.html'),
  },
  {
    slug: 'lab-04-linear-classification',
    group: LAB_GROUP,
    title: 'Лабораторная 4. Линейная классификация: логистическая регрессия, метрики и SVM',
    description:
      'Три потери как функции отступа; разделимая выборка и уход весов в бесконечность; ловушка accuracy при дисбалансе и выбор порога; решение SVM зависит только от опорных векторов; проверка критерия Мерсера.',
    date: '2026-10-15',
    tags: ['классификация', 'ROC-AUC', 'SVM', 'ядра'],
    icon: 'fa-vector-square',
    coversLabel: 'Закрепляет лекцию 3 — «Линейная классификация: логистическая регрессия и SVM»',
    source: 'notebooks/labs/lab-04-linear-classification.ipynb',
    load: () =>
      import(/* webpackChunkName: "lab-04" */ './labs/lab-04-linear-classification.html'),
  },
  {
    slug: 'lab-05-overfitting-cv',
    group: LAB_GROUP,
    title: 'Лабораторная 5. Переобучение, смещение–разброс и скользящий контроль',
    description:
      'Кривые сложности и обучения; численная проверка разложения смещение–разброс с точностью до долей процента; сколько стоит утечка при валидации (AUC 0.96 там, где истина 0.5); выбор схемы контроля; честный протокол.',
    date: '2026-10-29',
    tags: ['bias-variance', 'кросс-валидация', 'утечка данных', 'протокол'],
    icon: 'fa-sliders',
    coversLabel: 'Закрепляет лекцию 4 — «Переобучение и обобщающая способность»',
    source: 'notebooks/labs/lab-05-overfitting-cv.ipynb',
    load: () => import(/* webpackChunkName: "lab-05" */ './labs/lab-05-overfitting-cv.html'),
  },
  {
    slug: 'lab-06-trees-ensembles',
    group: LAB_GROUP,
    title: 'Лабораторная 6. Решающие деревья и композиции алгоритмов',
    description:
      'Почему деревья не строят по доле ошибок; ступенчатая граница и стрижка по цене сложности; проверка формулы разброса усреднённого предсказания ρσ² + (1−ρ)σ²/B; лес против бустинга; встроенная важность признаков врёт.',
    date: '2026-11-12',
    tags: ['деревья', 'бэггинг', 'бустинг', 'важность признаков'],
    icon: 'fa-sitemap',
    coversLabel: 'Закрепляет лекцию 5 — «Решающие деревья и композиции алгоритмов»',
    source: 'notebooks/labs/lab-06-trees-ensembles.ipynb',
    load: () => import(/* webpackChunkName: "lab-06" */ './labs/lab-06-trees-ensembles.html'),
  },
  {
    slug: 'lab-07-metric-bayes',
    group: LAB_GROUP,
    title: 'Лабораторная 7. Метрические и байесовские методы классификации',
    description:
      'Метрический метод целиком зависит от расстояния: масштаб и проклятие размерности; выбор числа соседей как параметра сложности; сравнение с байесовским оптимумом, который здесь вычислим точно; цена наивного предположения.',
    date: '2026-11-26',
    tags: ['kNN', 'байесовский оптимум', 'наивный Байес', 'LDA/QDA'],
    icon: 'fa-diagram-project',
    coversLabel: 'Закрепляет лекцию 6 — «Метрические и байесовские методы классификации»',
    source: 'notebooks/labs/lab-07-metric-bayes.ipynb',
    load: () => import(/* webpackChunkName: "lab-07" */ './labs/lab-07-metric-bayes.html'),
  },
  {
    slug: 'lab-08-clustering-em',
    group: LAB_GROUP,
    title: 'Лабораторная 8. Кластеризация и EM-алгоритм',
    description:
      'K-средних и его функционал, k-means++ против случайной инициализации; структуры данных, которые метод в принципе не находит; EM для смеси гауссиан и монотонность правдоподобия; сколько кластеров; эффект цепочки.',
    date: '2026-12-10',
    tags: ['K-means', 'EM', 'GMM', 'иерархическая кластеризация'],
    icon: 'fa-circle-nodes',
    coversLabel: 'Закрепляет лекцию 7 — «Кластеризация и EM-алгоритм»',
    source: 'notebooks/labs/lab-08-clustering-em.ipynb',
    load: () => import(/* webpackChunkName: "lab-08" */ './labs/lab-08-clustering-em.html'),
  },
  {
    slug: 'lab-09-pca-svd-mds',
    group: LAB_GROUP,
    title: 'Лабораторная 9. Метод главных компонент, SVD и многомерное шкалирование',
    description:
      'Что ищет PCA и почему ответ зависит от единиц измерения; теорема Эккарта–Янга на сжатии изображений; PCA как предобработка против отбора признаков; карта городов по одним лишь расстояниям. Завершается сводной частью по всему курсу.',
    date: '2026-12-24',
    tags: ['PCA', 'SVD', 'MDS', 'сводное занятие'],
    icon: 'fa-compress',
    coversLabel: 'Закрепляет лекцию 8 — «Метод главных компонент и сингулярное разложение»',
    source: 'notebooks/labs/lab-09-pca-svd-mds.ipynb',
    load: () => import(/* webpackChunkName: "lab-09" */ './labs/lab-09-pca-svd-mds.html'),
  },
];

/** Домашние работы: здесь методы пишутся с нуля и сверяются со scikit-learn. */
const HOMEWORK = [
  {
    slug: 'hw-01-tools-data',
    group: HOMEWORK_GROUP,
    title: 'Домашняя 1. Своя таблица: утечка, пропуски и кодирование',
    description:
      'Первая встреча со своей таблицей: числовой столбец, записанный строкой, «грязные» категории, опечатки масштаба и признак-утечка id. Заполнение пропусков с учётом механизма — по квартилям драйвера против общей медианы, сравнение по критерию Колмогорова–Смирнова. Своя реализация One-Hot и разбор, зачем нужен drop=«first».',
    date: '2026-09-03',
    tags: ['пропуски', 'MAR', 'One-Hot', 'критерий КС'],
    icon: 'fa-house-laptop',
    coversLabel: 'К лабораторной 1',
    source: 'notebooks/homework/hw-01-tools-data.ipynb',
    load: () => import(/* webpackChunkName: "hw-01" */ './homework/hw-01-tools-data.html'),
  },
  {
    slug: 'hw-02-erm-least-squares',
    group: HOMEWORK_GROUP,
    title: 'Домашняя 2. Как на самом деле решают МНК',
    description:
      'Матричное дифференцирование с проверкой конечными разностями; пять способов решить МНК (обращение, solve, QR, lstsq, SVD вручную) и потеря точности на матрице Вандермонда; шум определяет функцию потерь — гаусс против Лапласа.',
    date: '2026-09-17',
    tags: ['МНК', 'QR', 'SVD', 'обусловленность'],
    icon: 'fa-house-laptop',
    coversLabel: 'К лабораторной 2',
    source: 'notebooks/homework/hw-02-erm-least-squares.ipynb',
    load: () => import(/* webpackChunkName: "hw-02" */ './homework/hw-02-erm-least-squares.html'),
  },
  {
    slug: 'hw-03-gradient-regularization',
    group: HOMEWORK_GROUP,
    title: 'Домашняя 3. Оптимизация и регуляризация изнутри',
    description:
      'Стохастический градиентный спуск и мини-пакеты, численная проверка условия Роббинса–Монро; LASSO покоординатным спуском через мягкий порог со сверкой со scikit-learn; регуляризация как априорное знание (проверка утверждения 2.11).',
    date: '2026-10-01',
    tags: ['SGD', 'LASSO', 'мягкий порог', 'MAP'],
    icon: 'fa-house-laptop',
    coversLabel: 'К лабораторной 3',
    source: 'notebooks/homework/hw-03-gradient-regularization.ipynb',
    load: () =>
      import(/* webpackChunkName: "hw-03" */ './homework/hw-03-gradient-regularization.html'),
  },
  {
    slug: 'hw-04-linear-classification',
    group: HOMEWORK_GROUP,
    title: 'Домашняя 4. Классификация изнутри',
    description:
      'Логистическая регрессия своими руками: градиент и гессиан с проверкой конечными разностями, градиентный спуск против метода Ньютона. ROC-кривая и AUC с проверкой вероятностной интерпретации. Двойственная задача SVM.',
    date: '2026-10-15',
    tags: ['логрегрессия', 'метод Ньютона', 'ROC', 'SVM'],
    icon: 'fa-house-laptop',
    coversLabel: 'К лабораторной 4',
    source: 'notebooks/homework/hw-04-linear-classification.ipynb',
    load: () =>
      import(/* webpackChunkName: "hw-04" */ './homework/hw-04-linear-classification.html'),
  },
  {
    slug: 'hw-05-overfitting-cv',
    group: HOMEWORK_GROUP,
    title: 'Домашняя 5. Скользящий контроль изнутри и VC-размерность',
    description:
      'Своя реализация q-кратного контроля и точное воспроизведение примера LOO из конспекта; вложенный контроль и парная разность оценок на чистом шуме; VC-размерность перебором всех разметок с проверкой разделимости через линейное программирование.',
    date: '2026-10-29',
    tags: ['LOO', 'вложенный контроль', 'VC-размерность', 'ЛП'],
    icon: 'fa-house-laptop',
    coversLabel: 'К лабораторной 5',
    source: 'notebooks/homework/hw-05-overfitting-cv.ipynb',
    load: () => import(/* webpackChunkName: "hw-05" */ './homework/hw-05-overfitting-cv.html'),
  },
  {
    slug: 'hw-06-trees-ensembles',
    group: HOMEWORK_GROUP,
    title: 'Домашняя 6. Дерево и AdaBoost своими руками',
    description:
      'Решающее дерево с нуля: рекурсивное построение, перебор порогов, ограничения; совпадение со scikit-learn по качеству и числу листьев. AdaBoost по теореме о весе слабого классификатора со сверкой α численной минимизацией.',
    date: '2026-11-12',
    tags: ['дерево с нуля', 'AdaBoost', 'критерии информативности'],
    icon: 'fa-house-laptop',
    coversLabel: 'К лабораторной 6',
    source: 'notebooks/homework/hw-06-trees-ensembles.ipynb',
    load: () => import(/* webpackChunkName: "hw-06" */ './homework/hw-06-trees-ensembles.html'),
  },
  {
    slug: 'hw-07-metric-bayes',
    group: HOMEWORK_GROUP,
    title: 'Домашняя 7. Обобщённый метрический классификатор и STOLP',
    description:
      'Пять методов — одна формула: kNN, взвешенный kNN, парзеновские окна фиксированной и переменной ширины, метод потенциальных функций как частные случаи весовой функции. Отступы и отбор эталонов алгоритмом STOLP.',
    date: '2026-11-26',
    tags: ['kNN', 'парзеновское окно', 'STOLP', 'отступ'],
    icon: 'fa-house-laptop',
    coversLabel: 'К лабораторной 7',
    source: 'notebooks/homework/hw-07-metric-bayes.ipynb',
    load: () => import(/* webpackChunkName: "hw-07" */ './homework/hw-07-metric-bayes.html'),
  },
  {
    slug: 'hw-08-clustering-em',
    group: HOMEWORK_GROUP,
    title: 'Домашняя 8. K-средних и EM своими руками',
    description:
      'Алгоритм Ллойда с инициализацией k-means++: монотонность функционала и совпадение разбиения со scikit-learn. EM для смеси гауссиан с вычислениями в логарифмах и численной проверкой монотонности правдоподобия.',
    date: '2026-12-10',
    tags: ['алгоритм Ллойда', 'k-means++', 'EM', 'GMM'],
    icon: 'fa-house-laptop',
    coversLabel: 'К лабораторной 8',
    source: 'notebooks/homework/hw-08-clustering-em.ipynb',
    load: () => import(/* webpackChunkName: "hw-08" */ './homework/hw-08-clustering-em.html'),
  },
  {
    slug: 'hw-09-pca-svd-mds',
    group: HOMEWORK_GROUP,
    title: 'Домашняя 9. PCA изнутри и выбор числа компонент',
    description:
      'PCA двумя способами — через собственные векторы ковариационной матрицы и через SVD — и эксперимент, показывающий, почему на практике всегда выбирают второй. МНК через псевдообратную: ответ на вопрос, оставшийся открытым в домашней 2. Сколько компонент нужно на самом деле: дисперсия против качества; отбеливание как предельный случай занятия 3.',
    date: '2026-12-24',
    tags: ['PCA', 'SVD', 'псевдообратная', 'отбеливание', 'выбор k'],
    icon: 'fa-house-laptop',
    coversLabel: 'К лабораторной 9',
    source: 'notebooks/homework/hw-09-pca-svd-mds.ipynb',
    load: () => import(/* webpackChunkName: "hw-09" */ './homework/hw-09-pca-svd-mds.html'),
  },
];

/**
 * Полный список материалов практикума: сначала девять семинаров, затем девять
 * домашних. Поле `group` разбивает их на две группы в боковом списке.
 */
/**
 * Общий список материалов — **парами по занятиям**: лабораторная и её домашняя
 * работа идут подряд и попадают в одну группу «Занятие N».
 *
 * Так список слева читается как программа курса, а домашняя всегда стоит рядом
 * со своим занятием. Раньше сначала шли все девять лабораторных, и открытая
 * домашняя оказывалась ниже видимой части списка — со стороны это выглядело
 * так, будто вместо домашней открылись лабораторные.
 *
 * Поле `kind` нужно просмотрщику, чтобы показать, что именно открыто.
 */
/**
 * Занятия, доведённые до финальной версии, — **только они попадают на сайт**.
 * Остальные лежат в репозитории (и в ноутбуке у них в первой ячейке стоит
 * пометка «черновик», её ставит сборка — см. READY_LABS в
 * лабы/tools/nbbuild.py), но нигде не показываются: незаконченный материал в
 * списке рядом с готовым только путает.
 *
 * Чтобы опубликовать занятие, достаточно добавить сюда его номер: описания,
 * даты и адреса файлов для всех девяти уже перечислены выше.
 */
const READY_SESSIONS = new Set([1]);

/** Номер занятия по позиции в списке: LAB_SESSIONS[0] — занятие 1. */
const isReady = (index) => READY_SESSIONS.has(index + 1);

/** Сколько занятий в программе практикума — независимо от того, что выложено. */
export const plannedSessions = LAB_SESSIONS.length;

export const labSessions = LAB_SESSIONS.filter((_, i) => isReady(i));
export const homework = HOMEWORK.filter((_, i) => isReady(i));

export const reference = REFERENCE;

export const materials = [
  ...REFERENCE.map((item) => ({ ...item, kind: 'reference' })),
  ...LAB_SESSIONS.flatMap((lab, i) => {
    if (!isReady(i)) return [];
    const group = `Занятие ${i + 1}`;
    return [
      { ...lab, group, kind: 'lab' },
      { ...HOMEWORK[i], group, kind: 'homework' },
    ];
  }),
];

/** Раздел «Notebooks» содержит только материалы практикума. */
export const notebooks = materials;

/** Метаданные разделов — используются в навигации и на главной. */
export const sections = {
  notebooks: {
    id: 'notebooks',
    path: '/notebooks',
    label: 'Notebooks',
    title: 'Лабораторный практикум',
    subtitle:
      'Практикум чередуется с лекциями: каждое занятие закрепляет уже прочитанный материал. Лабораторная разбирается в аудитории, домашняя работа делается дома. Выкладываются занятия по мере готовности — те, что здесь, актуальны. Всё открывается прямо на странице: устанавливать и запускать ничего не нужно.',
    icon: 'fa-flask',
    items: notebooks,
  },
};

/** Найти материал по slug; если slug не задан или не найден — вернуть первый. */
export function findMaterial(items, slug) {
  if (!slug) return items[0];
  return items.find((item) => item.slug === slug);
}

/**
 * Разбить список материалов на группы с сохранением порядка.
 * Материалы без поля `group` попадают в одну безымянную группу.
 */
export function groupMaterials(items) {
  const result = [];
  items.forEach((item) => {
    const name = item.group ?? null;
    const last = result[result.length - 1];
    if (last && last.name === name) {
      last.items.push(item);
    } else {
      result.push({ name, items: [item] });
    }
  });
  return result;
}

/** Дата в человекочитаемом виде: 2026-02-10 -> «10 февраля 2026». */
/**
 * Склонение существительного при числе: plural(2, ['ноутбук', 'ноутбука', 'ноутбуков']).
 * Материалы выкладываются по одному занятию, поэтому числа на главной меняются.
 */
export function plural(n, forms) {
  const mod100 = Math.abs(n) % 100;
  const mod10 = mod100 % 10;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

export function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
