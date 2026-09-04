/**
 * Настройки репозитория курса.
 *
 * Отсюда строятся ссылки «Открыть в Colab» и «Открыть на GitHub».
 * Если репозиторий переименуют или переедет ветка — правится только этот файл.
 */

export const repository = {
  owner: 'sharipovaka',
  name: 'ml_labs',
  /** Ветка, в которой лежат исходные .ipynb */
  branch: 'main',
};

/** Главная страница репозитория. */
export const repositoryUrl = `https://github.com/${repository.owner}/${repository.name}`;

/** Убрать ведущий слэш, чтобы пути склеивались корректно. */
function normalize(path) {
  return String(path).replace(/^\//, '');
}

/**
 * Страница файла на GitHub.
 * GitHub умеет рендерить .ipynb прямо в вебе — ноутбук откроется читаемым.
 */
export function githubFileUrl(path) {
  return `${repositoryUrl}/blob/${repository.branch}/${normalize(path)}`;
}

/**
 * Открыть ноутбук в Google Colab.
 *
 * Colab понимает специальный адрес вида
 *   colab.research.google.com/github/<owner>/<repo>/blob/<branch>/<path>
 * и сам скачивает ноутбук из публичного репозитория — токены и авторизация
 * на стороне GitHub не нужны.
 */
export function colabUrl(path) {
  return `https://colab.research.google.com/github/${repository.owner}/${repository.name}/blob/${repository.branch}/${normalize(path)}`;
}

/**
 * Анонимная форма обратной связи (Google Формы).
 *
 * Адрес заканчивается на `entry.<id>=` — идентификатор вопроса «Выберите
 * задание, по которому оставляете отзыв». Название материала дописывается к
 * нему, поэтому ответы приходят уже размеченными.
 *
 * Пока адрес пустой, кнопка «Оставить отзыв» на страницах не показывается.
 */
export const feedbackFormUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLSeJkVdM0M5wJ9kUwq0L9yBtg7OP8xKxkALk1dq4FTu3nbKIvw/viewform'
  + '?usp=pp_url&entry.396654503=';

/**
 * Варианты выпадающего списка формы — ровно так, как они там записаны.
 *
 * Нужны, чтобы не подставлять значение, которого в форме нет: Google в этом
 * случае молча ничего не выбирает, и отзыв приходит без пометки о материале.
 * Если список в форме меняется, поправьте и здесь.
 */
export const feedbackFormOptions = [
  'Вцелом по курсу',
  'Чеклист',
  'Лабораторная работа 1', 'Лабораторная работа 2', 'Лабораторная работа 3',
  'Лабораторная работа 4', 'Лабораторная работа 5', 'Лабораторная работа 6',
  'Лабораторная работа 7', 'Лабораторная работа 8',
  'Домашнее задание 1', 'Домашнее задание 2', 'Домашнее задание 3',
  'Домашнее задание 4', 'Домашнее задание 5', 'Домашнее задание 6',
  'Домашнее задание 7', 'Домашнее задание 8',
];

/**
 * Название материала так, как оно записано в выпадающем списке формы.
 *
 * Совпадать нужно посимвольно: если значение не равно одному из вариантов,
 * Google молча ничего не выбирает. Поэтому длинные заголовки сайта
 * («Лабораторная 1. Инструменты, данные и первый ориентир») сводятся к
 * коротким вариантам формы («Лабораторная работа 1»).
 */
export function formOption(material) {
  const guess = material.kind === 'reference'
    ? 'Чеклист'
    : (() => {
      const number = (String(material.title).match(/\d+/) || [])[0];
      if (!number) return 'Вцелом по курсу';
      return material.kind === 'homework'
        ? `Домашнее задание ${number}`
        : `Лабораторная работа ${number}`;
    })();
  return feedbackFormOptions.includes(guess) ? guess : null;
}

/**
 * Ссылка на форму с уже выбранным материалом.
 *
 * Если подходящего варианта в форме нет, форма всё равно открывается — просто
 * без предзаполнения, и студент выбирает материал сам.
 */
export function feedbackUrl(material) {
  if (!feedbackFormUrl) return null;
  const option = formOption(material);
  return option ? `${feedbackFormUrl}${encodeURIComponent(option)}` : feedbackFormUrl;
}

/**
 * Форма «Нашёл ошибку» — канал не про впечатления, а про дефекты: опечатка,
 * ячейка не запускается, число в выводе не сходится с текстом.
 *
 * Если в форме появится вопрос «по какому материалу», допишите к адресу
 * `?usp=pp_url&entry.<id>=` — название подставится само. Пока адрес не
 * заканчивается на `=`, форма открывается как есть.
 */
export const errorFormUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLSc_M5rLnPjQPpE8LphB_vQCQ_r7kPeg_YveipTB_gGi80fQBQ/viewform';

/** Ссылка на форму ошибок, при возможности — с выбранным материалом. */
export function errorUrl(material) {
  if (!errorFormUrl) return null;
  if (!errorFormUrl.endsWith('=')) return errorFormUrl;
  return `${errorFormUrl}${encodeURIComponent(formOption(material) || material.title)}`;
}
