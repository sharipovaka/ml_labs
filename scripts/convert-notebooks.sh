#!/usr/bin/env bash
#
# Сборка HTML-материалов сайта из исходников курса.
#
#   notebooks/labs/*.ipynb     -> src/content/labs/*.html       (семинары)
#   notebooks/homework/*.ipynb -> src/content/homework/*.html   (домашние работы)
#
# Лекционные материалы на сайте не публикуются.
#
# Запуск:  npm run convert     (или  bash scripts/convert-notebooks.sh)
#
# Базовая команда:
#     pandoc notebook.ipynb -t html -s -o notebook.html
#
# Дополнена флагами, без которых на статическом хостинге неудобно:
#     --embed-resources   графики вшиваются в HTML как data:URI, отдельных файлов нет —
#                         это именно то, что нужно для <iframe srcdoc>;
#     --mathml            формулы рендерит сам браузер, MathJax из CDN не нужен
#                         (иначе pandoc вшил бы ~1.3 МБ скрипта в каждый файл);
#     --highlight-style   подсветка синтаксиса кода.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LABS_SRC="notebooks/labs"
LABS_OUT="src/content/labs"
HW_SRC="notebooks/homework"
HW_OUT="src/content/homework"

if ! command -v pandoc >/dev/null 2>&1; then
  echo "Ошибка: pandoc не найден." >&2
  echo "  macOS:   brew install pandoc" >&2
  echo "  Ubuntu:  sudo apt install pandoc" >&2
  echo "  Windows: winget install --id JohnMacFarlane.Pandoc" >&2
  exit 1
fi

echo "pandoc: $(pandoc --version | head -1)"
mkdir -p "$LABS_OUT" "$HW_OUT"

converted=0

convert_dir() {
  local src="$1" out="$2" label="$3"
  for notebook in "$src"/*.ipynb; do
    [ -e "$notebook" ] || continue
    local name
    name="$(basename "$notebook" .ipynb)"
    echo "→ $label: $name"

    pandoc "$notebook" \
      --from ipynb \
      --to html5 \
      --standalone \
      --embed-resources \
      --mathml \
      --highlight-style=tango \
      --output "$out/$name.html"

    converted=$((converted + 1))
  done
}

convert_dir "$LABS_SRC" "$LABS_OUT" "семинар"
convert_dir "$HW_SRC" "$HW_OUT" "домашняя"

echo
echo "Готово: сконвертировано файлов — $converted"
echo "Результат:"
find "$LABS_OUT" "$HW_OUT" -name '*.html' 2>/dev/null \
  | sort | xargs -I{} ls -lh {} | awk '{printf "  %-8s %s\n", $5, $9}'
echo
echo "Новый материал не забудьте добавить в src/content/index.js"
