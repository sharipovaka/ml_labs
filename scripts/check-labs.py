# -*- coding: utf-8 -*-
"""Что изменилось в исходниках практикума и что из этого не выложено на сайт.

Два конвейера (см. лабы/CLAUDE.md в родительском проекте):

    занятие 1 (без личных вариантов):
        лабы/lab01/tools/labNN.py  --сборка-->  лабы/lab01/lab01/*.ipynb  --выкладка-->  сайт

    занятия 2-9 (личные варианты, ноутбуки ведутся руками):
        лабы/labNN/лабаNN_студентам.ipynb + дзNN_заготовка.ipynb  --копия-->
        лабы/labNN/для_сайта/notebooks/...  --выкладка-->  сайт

Скрипт проверяет оба перехода и ничего не меняет: он только читает и печатает,
что нужно сделать. Запуск::

    python3 scripts/check-labs.py            # проверить все девять занятий
    python3 scripts/check-labs.py 1 2        # только занятия 1 и 2

Код возврата 0 -- всё синхронно, 1 -- есть расхождения (или занятие ещё не готово).

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
         4: "04-linear-classification", 5: "05-trees-forest", 6: "06-trees-ensembles",
         7: "07-metric-bayes", 8: "08-clustering-em", 9: "09-pca-svd-mds"}

# Вспомогательные модули, которые лежат на сайте рядом с ноутбуками.
SUPPORT = ("labdata.py", "variants.py", "requirements.txt")

# Материалы вне занятий: собираются своей спецификацией в один файл.
STANDALONE = {"checklist/checklist-numpy-pandas.ipynb": "reference/checklist-numpy-pandas.ipynb"}


def sources(path: pathlib.Path) -> list[str]:
    """Тексты ячеек. Сравниваем именно их: id и метаданные меняются при каждой сборке."""
    return ["".join(c["source"]) for c in json.loads(path.read_text(encoding="utf-8"))["cells"]]


def rebuild_into(number: int, root: pathlib.Path) -> None:
    """Собрать занятие 1 во временную папку -- настоящие ноутбуки не трогаем.

    Это важно: обычная сборка перезаписывает файлы решений и стирает из них
    выводы, а они нужны преподавателю. Применимо только к lab01 (старый
    конвейер без личных вариантов); занятия 2-9 ведутся руками.
    """
    module = importlib.import_module(f"lab{number:02d}")
    module.build(module.CELLS, module.NUMBER, module.TITLE, kind="seminar", root=root)
    module.build(module.HW_CELLS, module.NUMBER, module.TITLE, kind="homework", root=root)


def check_lab01(tmp: pathlib.Path) -> list[str]:
    """Старый конвейер: лабы/lab01/tools/lab01.py -> лабы/lab01/lab01/*.ipynb -> сайт."""
    todo = []
    slug = SLUGS[1]
    built = LABS / "lab01" / "lab01"

    # 1. Спецификация новее собранных ноутбуков?
    rebuild_into(1, tmp)
    for kind in ("seminar", "homework"):
        for version in ("", "_solution"):
            name = f"lab01_{kind}{version}.ipynb"
            here, fresh = built / name, tmp / "lab01" / name
            if not here.exists():
                todo.append(f"{name}: не собран")
            elif sources(here) != sources(fresh):
                todo.append(f"{name}: спецификация новее — нужна пересборка "
                            f"(python tools/build_all.py 1 --run)")

    # 2. Решения исполнены и без ошибок?
    for kind in ("seminar", "homework"):
        path = built / f"lab01_{kind}_solution.ipynb"
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
        here = built / f"lab01_{kind}.ipynb"
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


def check_lab_manual(number: int) -> list[str]:
    """Занятия 2-9: ручной конвейер, источник -- лабы/labNN/для_сайта/notebooks/."""
    todo = []
    slug = SLUGS[number]
    for_site = LABS / f"lab{number:02d}" / "для_сайта" / "notebooks"
    if not for_site.exists():
        return [f"занятие {number}: ещё не готово (нет лабы/lab{number:02d}/для_сайта/)"]

    for sub, prefix in (("labs", "lab"), ("homework", "hw")):
        matches = sorted((for_site / sub).glob("*.ipynb")) if (for_site / sub).exists() else []
        if not matches:
            todo.append(f"для_сайта/notebooks/{sub}/: нет ноутбука")
            continue
        here = matches[0]
        there = SITE / "notebooks" / sub / f"{prefix}-{slug}.ipynb"
        if not there.exists():
            todo.append(f"{there.name}: нет на сайте")
        elif sources(here) != sources(there):
            todo.append(f"{there.name}: на сайте старая версия — нужна выкладка "
                        f"(скопировать из лабы/lab{number:02d}/для_сайта/)")
        else:
            html = SITE / "src" / "content" / sub / f"{prefix}-{slug}.html"
            if not html.exists() or html.stat().st_mtime < there.stat().st_mtime:
                todo.append(f"{html.name}: HTML старее ноутбука — нужна конвертация")

    data_dir = for_site / "data"
    if data_dir.exists():
        for here in sorted(data_dir.glob("*")):
            there = SITE / "notebooks" / "data" / here.name
            if not there.exists() or here.read_bytes() != there.read_bytes():
                todo.append(f"notebooks/data/{here.name}: отличается от лабы/lab{number:02d}/для_сайта/data/")

    return todo


def check_lab(number: int, tmp: pathlib.Path) -> list[str]:
    if number == 1:
        return check_lab01(tmp)
    return check_lab_manual(number)


def check_standalone() -> list[str]:
    """Справочные материалы: сверяем только «исходник -> сайт»."""
    todo = []
    for src, dst in STANDALONE.items():
        here, there = LABS / "lab01" / src, SITE / "notebooks" / dst
        if not here.exists():
            todo.append(f"lab01/{src}: нет исходника")
        elif not there.exists():
            todo.append(f"notebooks/{dst}: нет на сайте")
        elif sources(here) != sources(there):
            todo.append(f"notebooks/{dst}: на сайте старая версия — нужна выкладка")
    return todo


def check_support() -> list[str]:
    todo = []
    for name in SUPPORT:
        here, there = LABS / "lab01" / name, SITE / "notebooks" / name
        if not here.exists():
            continue
        if not there.exists() or here.read_bytes() != there.read_bytes():
            todo.append(f"notebooks/{name}: отличается от lab01/{name}")
    return todo


def main(argv: list[str]) -> int:
    numbers = [int(a) for a in argv if a.isdigit()] or sorted(SLUGS)
    sys.path.insert(0, str(LABS / "lab01" / "tools"))

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
