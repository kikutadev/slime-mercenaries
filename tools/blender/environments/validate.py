from __future__ import annotations

import argparse
import sys
from pathlib import Path

import bpy

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from areas import castle, clover, dragon, ember, frost, marsh, mine, mushroom


REQUIRED = {
    clover.AREA_ID: clover.REQUIRED_ROOTS,
    mushroom.AREA_ID: mushroom.REQUIRED_ROOTS,
    mine.AREA_ID: mine.REQUIRED_ROOTS,
    marsh.AREA_ID: marsh.REQUIRED_ROOTS,
    frost.AREA_ID: frost.REQUIRED_ROOTS,
    ember.AREA_ID: ember.REQUIRED_ROOTS,
    castle.AREA_ID: castle.REQUIRED_ROOTS,
    dragon.AREA_ID: dragon.REQUIRED_ROOTS,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate a reusable stage-environment kit.")
    parser.add_argument("--area", required=True, choices=tuple(REQUIRED))
    parser.add_argument("--asset", required=True)
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(argv)


def descendants(root: bpy.types.Object) -> list[bpy.types.Object]:
    result: list[bpy.types.Object] = []
    stack = list(root.children)
    while stack:
        current = stack.pop()
        result.append(current)
        stack.extend(current.children)
    return result


def main() -> None:
    args = parse_args()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=args.asset)

    kit = bpy.data.objects.get("EnvironmentKitRoot")
    if kit is None:
        raise AssertionError("Missing EnvironmentKitRoot")

    expected = REQUIRED[args.area]
    missing = [name for name in expected if bpy.data.objects.get(name) is None]
    if missing:
        raise AssertionError(f"Missing required environment nodes: {', '.join(missing)}")

    reusable = [child for child in kit.children if child.name.startswith(("Prop_", "Landmark_"))]
    if len(reusable) != len(expected):
        raise AssertionError(f"Expected {len(expected)} reusable roots, got {len(reusable)}")

    landmarks = [root for root in reusable if root.name.startswith("Landmark_")]
    if len(landmarks) != 1:
        raise AssertionError(f"Expected exactly one landmark root, got {len(landmarks)}")

    total_meshes = 0
    for root in reusable:
        meshes = [obj for obj in descendants(root) if obj.type == "MESH"]
        total_meshes += len(meshes)
        if not meshes:
            raise AssertionError(f"{root.name}: no mesh descendants")
        if root.location.length > 1e-4:
            raise AssertionError(f"{root.name}: reusable root origin must remain at kit origin")
        if root.name.startswith("Landmark_") and len(meshes) < 5:
            raise AssertionError(f"{root.name}: landmark silhouette is under-authored")

    if total_meshes < 24:
        raise AssertionError(f"{args.area}: kit mesh count is suspiciously low ({total_meshes})")
    if total_meshes > 90:
        raise AssertionError(f"{args.area}: kit mesh count exceeds mobile prop budget ({total_meshes})")

    print(f"OK {args.area}: reusable={len(reusable)} meshes={total_meshes} landmark={landmarks[0].name}")


if __name__ == "__main__":
    main()
