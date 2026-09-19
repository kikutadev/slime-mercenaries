from __future__ import annotations

from hashlib import sha256
from pathlib import Path
from PIL import Image

IDS = (
    "tiny-mushroom","plump-mushroom","spore-mushroom","great-mushroom",
    "leafling","whirl-leaf","bud-bloom","puff-flower","round-hedgehog","acorn-squirrel",
    "crystal-beetle","drill-nose-mole","crystal-bat","pebble-golem","amber-turtle",
    "puff-frog","marsh-sprout","bubble-snail","skimming-lily","great-marsh-frog",
)
MOTIONS = ("idle","attack","defeat")
BACKGROUND = (239,245,232)
GROUND = (216,232,205)


def model_bbox(path: Path) -> tuple[int,int,int,int]:
    image = Image.open(path).convert("RGB")
    width, height = image.size
    points: list[tuple[int,int]] = []
    # Exclude the production badge band at the bottom.
    for y in range(0, max(0, height - 34), 2):
        for x in range(0, width, 2):
            pixel = image.getpixel((x,y))
            bg_distance = sum((pixel[i] - BACKGROUND[i]) ** 2 for i in range(3)) ** 0.5
            ground_distance = sum((pixel[i] - GROUND[i]) ** 2 for i in range(3)) ** 0.5
            saturation = max(pixel) - min(pixel)
            if min(bg_distance, ground_distance) > 38 and (saturation > 18 or sum(pixel) < 500):
                points.append((x,y))
    if not points:
        raise AssertionError(f"{path.name}: no foreground model pixels found")
    xs = [point[0] for point in points]
    ys = [point[1] for point in points]
    return min(xs), min(ys), max(xs), max(ys)


def main() -> None:
    root = Path(".tmp/enemy-character-contracts")
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
        x0,y0,x1,y1 = model_bbox(idle)
        bbox_w = x1 - x0 + 1
        bbox_h = y1 - y0 + 1
        width_ratio = bbox_w / width
        height_ratio = bbox_h / height
        if width_ratio < 0.48:
            raise AssertionError(f"{enemy}: too small at 1x; width occupancy={width_ratio:.3f}")
        if height_ratio < 0.30:
            raise AssertionError(f"{enemy}: too short/small at 1x; height occupancy={height_ratio:.3f}")
        if width_ratio > 0.82 or height_ratio > 0.82:
            raise AssertionError(
                f"{enemy}: inspection framing clips/readability risk; occupancy={width_ratio:.3f}x{height_ratio:.3f}"
            )
        print(
            f"OK {enemy}: frame={width}x{height} "
            f"occupancy={width_ratio:.2f}x{height_ratio:.2f}"
        )

    print(f"OK: {len(IDS)} characters / {len(expected)} unique timed Gallery frames")


if __name__ == "__main__":
    main()
