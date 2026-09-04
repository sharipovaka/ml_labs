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
 * Анонимная форма обратной связи (Яндекс или Google Формы).
 *
 * Пока адрес пустой, кнопка «Оставить отзыв» на страницах не показывается.
 * Чтобы включить: создайте форму с вопросом «material» и вставьте сюда её
 * адрес вместе с параметром предзаполнения, например
 *
 *   Яндекс Формы:  'https://forms.yandex.ru/u/XXXX/?material='
 *   Google Формы:  'https://docs.google.com/forms/d/e/XXXX/viewform?usp=pp_url&entry.123456='
 *
 * К адресу дописывается название материала, поэтому ответы сразу размечены по
 * занятиям и их не приходится сопоставлять вручную.
 */
export const feedbackFormUrl = '';

/** Ссылка на форму с уже подставленным названием материала. */
export function feedbackUrl(title) {
  return feedbackFormUrl ? `${feedbackFormUrl}${encodeURIComponent(title)}` : null;
}

/**
 * Сообщить об ошибке в материале: issue на GitHub с заполненным заголовком.
 *
 * Это канал не про впечатления, а про дефекты: опечатка, ячейка не
 * запускается, число в выводе не сходится с текстом.
 */
export function issueUrl(material) {
  const params = new URLSearchParams({
    title: `[${material.title}] `,
    labels: 'материалы',
    body: [
      `**Материал:** ${material.title}`,
      `**Файл:** \`${material.source}\``,
      '',
      '**В чём проблема** (что ожидали, что получилось):',
      '',
    ].join('\n'),
  });
  return `${repositoryUrl}/issues/new?${params}`;
}
