# -*- coding: utf-8 -*-
"""Что изменилось в исходниках практикума и что из этого не выложено на сайт.

Цепочка материала такая:

    лабы/tools/labNN.py  --сборка-->  лабы/labNN/*.ipynb  --выкладка-->  сайт

Скрипт проверяет оба перехода и ничего не меняет: он только читает и печатает,
что нужно сделать. Запуск::

    python3 scripts/check-labs.py            # проверить все девять занятий
    python3 scripts/check-labs.py 1 2        # только занятия 1 и 2

Код возврата 0 -- всё синхронно, 1 -- есть расхождения.

Папка практикума берётся из переменной окружения ``LABS_ROOT``; по умолчанию --
``../лабы`` рядом с репозиторием сайта.
"""

from __future__ import annotations

import importlib
import json
import os
import pathlib
import sys
import tempfile

SITE = pathlib.Path(__file__).resolve().parent.parent
LABS = pathlib.Path(os.environ.get("LABS_ROOT", SITE.parent / "лабы")).resolve()

# Как называются те же материалы на сайте.
SLUGS = {1: "01-tools-data", 2: "02-erm-least-squares", 3: "03-gradient-regularization",
         4: "04-linear-classification", 5: "05-overfitting-cv", 6: "06-trees-ensembles",
         7: "07-metric-bayes", 8: "08-clustering-em", 9: "09-pca-svd-mds"}

# Вспомогательные модули, которые лежат на сайте рядом с ноутбуками.
SUPPORT = ("labdata.py", "variants.py", "requirements.txt")

# Материалы вне занятий: собираются своей спецификацией в один файл.
STANDALONE = {"checklist/checklist-numpy-pandas.ipynb": "reference/checklist-numpy-pandas.ipynb"}


def sources(path: pathlib.Path) -> list[str]:
    """Тексты ячеек. Сравниваем именно их: id и метаданные меняются при каждой сборке."""
    return ["".join(c["source"]) for c in json.loads(path.read_text(encoding="utf-8"))["cells"]]


def rebuild_into(number: int, root: pathlib.Path) -> None:
    """Собрать занятие во временную папку -- настоящие ноутбуки не трогаем.

    Это важно: обычная сборка перезаписывает файлы решений и стирает из них
    выводы, а они нужны преподавателю.
    """
    module = importlib.import_module(f"lab{number:02d}")
    module.build(module.CELLS, module.NUMBER, module.TITLE, kind="seminar", root=root)
    module.build(module.HW_CELLS, module.NUMBER, module.TITLE, kind="homework", root=root)


def check_lab(number: int, tmp: pathlib.Path) -> list[str]:
    todo = []
    slug = SLUGS[number]
    built = LABS / f"lab{number:02d}"

    # 1. Спецификация новее собранных ноутбуков?
    rebuild_into(number, tmp)
    for kind in ("seminar", "homework"):
        for version in ("", "_solution"):
            name = f"lab{number:02d}_{kind}{version}.ipynb"
            here, fresh = built / name, tmp / f"lab{number:02d}" / name
            if not here.exists():
                todo.append(f"{name}: не собран")
            elif sources(here) != sources(fresh):
                todo.append(f"{name}: спецификация новее — нужна пересборка "
                            f"(python tools/build_all.py {number} --run)")

    # 2. Решения исполнены и без ошибок?
    for kind in ("seminar", "homework"):
        path = built / f"lab{number:02d}_{kind}_solution.ipynb"
        if not path.exists():
            continue
        cells = json.loads(path.read_text(encoding="utf-8"))["cells"]
        code = [c for c in cells if c["cell_type"] == "code"]
        if any(o.get("output_type") == "error" for c in code for o in c.get("outputs", [])):
            todo.append(f"{path.name}: в выводах есть ошибка исполнения")
        elif code and all(c.get("execution_count") is None for c in code):
            todo.append(f"{path.name}: не исполнен (нет выводов)")

    # 3. Студенческие версии совпадают с выложенными?
    for kind, sub, prefix in (("seminar", "labs", "lab"), ("homework", "homework", "hw")):
        here = built / f"lab{number:02d}_{kind}.ipynb"
        there = SITE / "notebooks" / sub / f"{prefix}-{slug}.ipynb"
        if not here.exists():
            continue
        if not there.exists():
            todo.append(f"{there.name}: нет на сайте")
        elif sources(here) != sources(there):
            todo.append(f"{there.name}: на сайте старая версия — нужна выкладка")
        else:
            html = SITE / "src" / "content" / sub / f"{prefix}-{slug}.html"
            if not html.exists() or html.stat().st_mtime < there.stat().st_mtime:
                todo.append(f"{html.name}: HTML старее ноутбука — нужна конвертация")

    return todo


def check_standalone() -> list[str]:
    """Справочные материалы: сверяем только «исходник -> сайт»."""
    todo = []
    for src, dst in STANDALONE.items():
        here, there = LABS / src, SITE / "notebooks" / dst
        if not here.exists():
            todo.append(f"{src}: нет исходника")
        elif not there.exists():
            todo.append(f"notebooks/{dst}: нет на сайте")
        elif sources(here) != sources(there):
            todo.append(f"notebooks/{dst}: на сайте старая версия — нужна выкладка")
    return todo


def check_support() -> list[str]:
    todo = []
    for name in SUPPORT:
        here, there = LABS / name, SITE / "notebooks" / name
        if not here.exists():
            continue
        if not there.exists() or here.read_bytes() != there.read_bytes():
            todo.append(f"notebooks/{name}: отличается от исходника")
    return todo


def main(argv: list[str]) -> int:
    numbers = [int(a) for a in argv if a.isdigit()] or sorted(SLUGS)
    sys.path.insert(0, str(LABS / "tools"))

    print(f"исходники: {LABS}")
    print(f"сайт:      {SITE}\n")

    total = []
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = pathlib.Path(tmpdir)
        for n in numbers:
            todo = check_lab(n, tmp)
            total += todo
            mark = "✓" if not todo else "•"
            print(f"{mark} занятие {n}" + ("" if not todo else ""))
            for line in todo:
                print(f"    {line}")

    extra = check_standalone() + check_support()
    total += extra
    for line in extra:
        print(f"    {line}")

    print()
    if total:
        print(f"расхождений: {len(total)}")
        return 1
    print("всё синхронно: ноутбуки собраны из спецификаций, сайт совпадает с ними")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
