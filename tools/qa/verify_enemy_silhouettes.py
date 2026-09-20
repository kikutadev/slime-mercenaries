from __future__ import annotations

import argparse
from itertools import combinations
from pathlib import Path

import numpy as np
from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default=".tmp/enemy-silhouettes")
    parser.add_argument("--max-iou", type=float, default=0.62)
    parser.add_argument("slugs", nargs="*")
    return parser.parse_args()


def normalized_mask(path: Path) -> np.ndarray:
    image = Image.open(path).convert("RGBA")
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.where(alpha > 32)
    if len(xs) == 0:
        raise AssertionError(f"{path.name}: empty silhouette")
    crop = Image.fromarray(alpha[ys.min():ys.max()+1, xs.min():xs.max()+1])
    width, height = crop.size
    scale = min(112 / width, 112 / height)
    target = crop.resize((max(1, round(width * scale)), max(1, round(height * scale))), Image.Resampling.NEAREST)
    canvas = Image.new("L", (128, 128), 0)
    x = (128 - target.width) // 2
    y = 128 - 8 - target.height
    canvas.paste(target, (x, y))
    return np.asarray(canvas) > 32


def iou(a: np.ndarray, b: np.ndarray) -> float:
    intersection = np.logical_and(a, b).sum()
    union = np.logical_or(a, b).sum()
    return float(intersection / union) if union else 0.0


def main() -> None:
    args = parse_args()
    root = Path(args.input)
    slugs = args.slugs or sorted(path.stem for path in root.glob("*.png"))
    masks = {slug: normalized_mask(root / f"{slug}.png") for slug in slugs}
    worst = ("", "", 0.0)
    for left, right in combinations(slugs, 2):
        score = iou(masks[left], masks[right])
        print(f"{left:24} vs {right:24} IoU={score:.3f}")
        if score > worst[2]:
            worst = (left, right, score)
    if worst[2] > args.max_iou:
        raise AssertionError(
            f"silhouette collision: {worst[0]} vs {worst[1]} IoU={worst[2]:.3f} > {args.max_iou:.3f}"
        )
    print(f"OK max pairwise silhouette IoU={worst[2]:.3f}: {worst[0]} vs {worst[1]}")


if __name__ == "__main__":
    main()
