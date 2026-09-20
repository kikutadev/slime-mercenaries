from __future__ import annotations

from hashlib import sha256
import json
from pathlib import Path
from PIL import Image

IDS = (
    "tiny-mushroom","plump-mushroom","spore-mushroom","great-mushroom",
    "leafling","whirl-leaf","bud-bloom","puff-flower","round-hedgehog","acorn-squirrel",
    "crystal-beetle","drill-nose-mole","crystal-bat","pebble-golem","amber-turtle",
    "puff-frog","marsh-sprout","bubble-snail","skimming-lily","great-marsh-frog",
    "snow-roller","ice-bug","scarf-snowman","icicle-lantern","snow-statue-guardian",
)
MOTIONS = ("idle","attack","defeat")
BACKGROUND = (239,245,232)
GROUND = (216,232,205)


def main() -> None:
    root = Path(".tmp/enemy-character-contracts")
    metrics = json.loads((root / "metrics.json").read_text())
    expected = {f"{enemy}-{motion}.png" for enemy in IDS for motion in MOTIONS}
    actual = {path.name for path in root.glob("*.png")}
    missing = expected - actual
    if missing:
        raise AssertionError(f"missing QA frames: {sorted(missing)}")

    hashes: dict[str,str] = {}
    for name in sorted(expected):
        digest = sha256((root / name).read_bytes()).hexdigest()
        if digest in hashes:
            raise AssertionError(f"duplicate QA frame: {name} == {hashes[digest]}")
        hashes[digest] = name

    for enemy in IDS:
        state_hashes = {
            sha256((root / f"{enemy}-{motion}.png").read_bytes()).hexdigest()
            for motion in MOTIONS
        }
        if len(state_hashes) != 3:
            raise AssertionError(f"{enemy}: idle/attack/defeat did not produce distinct frames")

        idle = root / f"{enemy}-idle.png"
        image = Image.open(idle)
        width, height = image.size
        idle_metrics = metrics.get(enemy, {}).get("idle", {})
        width_ratio = float(idle_metrics.get("width", 0))
        height_ratio = float(idle_metrics.get("height", 0))
        projected_area = width_ratio * height_ratio
        major_axis = max(width_ratio, height_ratio)
        if projected_area < 0.030:
            raise AssertionError(
                f"{enemy}: too small at 1x; projected area={projected_area:.3f} "
                f"occupancy={width_ratio:.3f}x{height_ratio:.3f}"
            )
        if major_axis < 0.19:
            raise AssertionError(
                f"{enemy}: dominant silhouette axis too small at 1x; "
                f"occupancy={width_ratio:.3f}x{height_ratio:.3f}"
            )
        if width_ratio > 0.78 or height_ratio > 0.78:
            raise AssertionError(
                f"{enemy}: inspection framing clips/readability risk; occupancy={width_ratio:.3f}x{height_ratio:.3f}"
            )
        print(
            f"OK {enemy}: frame={width}x{height} "
            f"occupancy={width_ratio:.2f}x{height_ratio:.2f} area={projected_area:.3f}"
        )

    print(f"OK: {len(IDS)} characters / {len(expected)} unique timed Gallery frames")


if __name__ == "__main__":
    main()