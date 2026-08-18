#!/usr/bin/env python3
"""Генерация растровых иконок (favicon.ico, logo192.png, logo512.png) из того же
дизайна, что и public/favicon.svg — граф нейросети на градиентной плашке.

Запуск:  python scripts/make-icons.py
Требуется: Pillow (pip install pillow)
"""

from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public"

# Координаты узлов в системе 64x64 (как в favicon.svg)
NODES = [(16, 32, 5), (32, 18, 4), (32, 32, 4), (32, 46, 4), (48, 25, 4.5), (48, 39, 4.5)]
EDGES = [(0, 1), (0, 2), (0, 3), (1, 4), (2, 4), (2, 5), (3, 5)]

C1 = (124, 58, 237)   # #7c3aed
C2 = (6, 182, 212)    # #06b6d4


def gradient(size: int) -> Image.Image:
    """Диагональный градиент C1 -> C2."""
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size - 2)
            px[x, y] = tuple(round(a + (b - a) * t) for a, b in zip(C1, C2))
    return img


def rounded_mask(size: int, radius_ratio: float = 14 / 64) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, size - 1, size - 1), radius=size * radius_ratio, fill=255
    )
    return mask


def render(size: int, rounded: bool = True) -> Image.Image:
    ss = 4  # суперсэмплинг для сглаживания
    big = size * ss
    k = big / 64  # масштаб из системы координат SVG

    img = gradient(big).convert("RGBA")
    draw = ImageDraw.Draw(img)

    # Рёбра графа
    for a, b in EDGES:
        x1, y1, _ = NODES[a]
        x2, y2, _ = NODES[b]
        draw.line((x1 * k, y1 * k, x2 * k, y2 * k), fill=(255, 255, 255, 190), width=round(2 * k))

    # Узлы
    for x, y, r in NODES:
        draw.ellipse(((x - r) * k, (y - r) * k, (x + r) * k, (y + r) * k), fill=(255, 255, 255, 255))

    if rounded:
        img.putalpha(rounded_mask(big))

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    render(192).save(OUT / "logo192.png")
    render(512).save(OUT / "logo512.png")

    # Многоразмерный .ico для вкладок и закладок
    render(64).save(
        OUT / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
    )

    print(f"Иконки записаны в {OUT}")


if __name__ == "__main__":
    main()
