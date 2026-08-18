/**
 * Настройки репозитория курса.
 *
 * Отсюда строятся ссылки «Открыть в Colab» и «Открыть на GitHub».
 * Если репозиторий переименуют или переедет ветка — правится только этот файл.
 */

export const repository = {
  owner: 'sharipovaka',
  name: 'mltest1',
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
