from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

REQUIRED_NODES = (
    "EnemyRoot",
    "BodyRoot",
    "Stem",
    "Cap",
    "FaceRoot",
    "Eye_L",
    "Eye_R",
    "Mouth",
    "AttackOrigin",
    "EffectOrigin",
    "GroundOrigin",
)


SILHOUETTE_RULES = {
    "tiny-mushroom.glb": lambda size: 0.95 <= size.x / size.z <= 1.25,
    "plump-mushroom.glb": lambda size: size.x / size.z >= 1.18,
    "spore-mushroom.glb": lambda size: size.z / size.x >= 1.02,
    "great-mushroom.glb": lambda size: size.x / size.z >= 1.24 and size.x >= 1.8,
}


def object_world_size(obj: bpy.types.Object) -> Vector:
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    minimum = Vector((min(p.x for p in corners), min(p.y for p in corners), min(p.z for p in corners)))
    maximum = Vector((max(p.x for p in corners), max(p.y for p in corners), max(p.z for p in corners)))
    return maximum - minimum


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate generated Slime Mercenaries enemy GLBs.")
    parser.add_argument("paths", nargs="+", help="GLB files to validate")
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(argv)


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def world_bounds(root: bpy.types.Object) -> tuple[Vector, Vector]:
    corners: list[Vector] = []
    for obj in root.children_recursive:
        if obj.type != "MESH":
            continue
        corners.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    if not corners:
        raise AssertionError("EnemyRoot contains no mesh geometry")
    minimum = Vector((min(p.x for p in corners), min(p.y for p in corners), min(p.z for p in corners)))
    maximum = Vector((max(p.x for p in corners), max(p.y for p in corners), max(p.z for p in corners)))
    return minimum, maximum


def validate(path: Path) -> None:
    clear_scene()
    bpy.ops.import_scene.gltf(filepath=str(path))

    missing = [name for name in REQUIRED_NODES if bpy.data.objects.get(name) is None]
    if missing:
        raise AssertionError(f"{path.name}: missing required nodes: {', '.join(missing)}")

    root = bpy.data.objects["EnemyRoot"]
    minimum, maximum = world_bounds(root)
    size = maximum - minimum
    if any(not math.isfinite(component) for component in (*minimum, *maximum, *size)):
        raise AssertionError(f"{path.name}: non-finite bounds")
    if min(size) <= 0.05:
        raise AssertionError(f"{path.name}: degenerate bounds {tuple(round(v, 3) for v in size)}")
    if max(size) > 5.0:
        raise AssertionError(f"{path.name}: unexpectedly large source bounds {tuple(round(v, 3) for v in size)}")

    silhouette_rule = SILHOUETTE_RULES.get(path.name)
    if silhouette_rule is not None and not silhouette_rule(size):
        raise AssertionError(
            f"{path.name}: V2 silhouette regression; bounds={tuple(round(v, 3) for v in size)}"
        )

    eye_l = bpy.data.objects["Eye_L"]
    eye_r = bpy.data.objects["Eye_R"]
    if abs(eye_l.location.x + eye_r.location.x) > 0.08:
        raise AssertionError(f"{path.name}: eye pair is not approximately symmetric")
    if eye_l.location.y >= 0 or eye_r.location.y >= 0:
        raise AssertionError(f"{path.name}: eyes are not on authored local -Y front")

    # V1 failed because the eyes dominated the face. Keep each eye below 12% of
    # total character height in its largest visible axis.
    for eye in (eye_l, eye_r):
        eye_size = object_world_size(eye)
        if max(eye_size.x, eye_size.z) / size.z > 0.12:
            raise AssertionError(
                f"{path.name}: eye-size regression; {eye.name}={tuple(round(v, 3) for v in eye_size)} "
                f"character_height={size.z:.3f}"
            )

    meshes = [obj for obj in root.children_recursive if obj.type == "MESH"]
    if any(len(obj.data.materials) == 0 for obj in meshes):
        missing_materials = [obj.name for obj in meshes if len(obj.data.materials) == 0]
        raise AssertionError(f"{path.name}: meshes without materials: {missing_materials}")

    print(
        f"OK {path.name}: nodes={len(root.children_recursive)} "
        f"bounds=({size.x:.2f}, {size.y:.2f}, {size.z:.2f}) meshes={len(meshes)}"
    )


def main() -> None:
    args = parse_args()
    for raw_path in args.paths:
        path = Path(raw_path).resolve()
        if not path.is_file():
            raise FileNotFoundError(path)
        validate(path)


if __name__ == "__main__":
    main()
