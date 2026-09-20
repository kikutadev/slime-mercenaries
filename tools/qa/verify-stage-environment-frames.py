from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path

from PIL import Image, ImageChops, ImageStat


AREAS = (
    "clover-road",
    "mushroom-forest",
    "amber-mine",
    "sunken-marsh",
    "frost-ruins",
    "ember-canyon",
    "moonlit-castle",
    "dragon-crater",
)


def rms_difference(left: Image.Image, right: Image.Image) -> float:
    diff = ImageChops.difference(left.convert("RGB"), right.convert("RGB"))
    stat = ImageStat.Stat(diff)
    squares = sum(value * value for value in stat.rms)
    return math.sqrt(squares / max(1, len(stat.rms)))


def main() -> None:
    root = Path(os.environ.get("ENVIRONMENT_QA_OUTPUT", ".tmp/stage-environment-frames"))
    metrics_path = root / "metrics.json"
    if not metrics_path.exists():
        raise SystemExit(f"Missing {metrics_path}")

    metrics = json.loads(metrics_path.read_text())
    if metrics.get("errors"):
        raise SystemExit("Browser errors: " + repr(metrics["errors"]))
    if metrics.get("frameCount") != 40:
        raise SystemExit(f"Expected 40 frames, got {metrics.get('frameCount')}")

    hashes: set[str] = set()
    for area in AREAS:
        images: list[Image.Image] = []
        for stage in range(1, 6):
            path = root / f"{area}-stage-{stage}.png"
            if not path.exists():
                raise SystemExit(f"Missing {path}")
            hashes.add(hashlib.sha256(path.read_bytes()).hexdigest())
            image = Image.open(path).convert("RGB")
            if image.size[0] < 500 or image.size[1] < 850:
                raise SystemExit(f"{path.name}: capture unexpectedly small: {image.size}")
            images.append(image)

        for stage in range(4):
            difference = rms_difference(images[stage], images[stage + 1])
            if difference < 5.0:
                raise SystemExit(
                    f"{area}: stage {stage + 1}->{stage + 2} visual delta too small ({difference:.2f})"
                )

    if len(hashes) != 40:
        raise SystemExit(f"Expected 40 unique frame hashes, got {len(hashes)}")

    print("OK: 8 areas / 40 unique stage-environment frames")


if __name__ == "__main__":
    main()
