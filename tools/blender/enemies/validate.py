from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

SCRIPT_DIR = Path(__file__).resolve().parent
PACKAGE_PARENT = SCRIPT_DIR.parent
if str(PACKAGE_PARENT) not in sys.path:
    sys.path.insert(0, str(PACKAGE_PARENT))

from enemies.validation_profiles import validation_profile_for_slug  # noqa: E402


def object_world_size(obj: bpy.types.Object) -> Vector:
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    minimum = Vector((min(p.x for p in corners), min(p.y for p in corners), min(p.z for p in corners)))
    maximum = Vector((max(p.x for p in corners), max(p.y for p in corners), max(p.z for p in corners)))
    return maximum - minimum



def axis_value(size: Vector, axis: str) -> float:
    if axis == "x":
        return size.x
    if axis == "y":
        return size.y
    if axis == "z":
        return size.z
    if axis == "max":
        return max(size.x, size.y, size.z)
    raise AssertionError(f"Unknown validation axis: {axis}")


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
    slug = path.stem
    profile = validation_profile_for_slug(slug)

    missing = [name for name in profile.required_nodes if bpy.data.objects.get(name) is None]
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
    if profile.silhouette_rule is not None and not profile.silhouette_rule(size):
        raise AssertionError(
            f"{path.name}: silhouette regression ({profile.description}); "
            f"bounds={tuple(round(v, 3) for v in size)}"
        )

    eye_l = bpy.data.objects["Eye_L"]
    eye_r = bpy.data.objects["Eye_R"]
    if abs(eye_l.location.x + eye_r.location.x) > 0.10:
        raise AssertionError(f"{path.name}: eye pair is not approximately symmetric")
    if eye_l.location.y >= 0 or eye_r.location.y >= 0:
        raise AssertionError(f"{path.name}: eyes are not on authored local -Y front")

    for eye in (eye_l, eye_r):
        eye_size = object_world_size(eye)
        if max(eye_size.x, eye_size.z) / size.z > 0.12:
            raise AssertionError(
                f"{path.name}: eye-size regression; {eye.name}={tuple(round(v, 3) for v in eye_size)} "
                f"character_height={size.z:.3f}"
            )

    for socket in ("AttackOrigin", "EffectOrigin", "GroundOrigin"):
        obj = bpy.data.objects[socket]
        location = obj.matrix_world.translation
        if any(not math.isfinite(value) for value in location):
            raise AssertionError(f"{path.name}: {socket} has non-finite transform")

    meshes = [obj for obj in root.children_recursive if obj.type == "MESH"]
    if len(meshes) < profile.min_meshes:
        raise AssertionError(
            f"{path.name}: insufficient authored geometry; meshes={len(meshes)} "
            f"required>={profile.min_meshes} ({profile.description})"
        )
    if profile.max_meshes is not None and len(meshes) > profile.max_meshes:
        raise AssertionError(
            f"{path.name}: excessive geometry clutter; meshes={len(meshes)} "
            f"required<={profile.max_meshes} ({profile.description})"
        )

    all_objects = {obj.name: obj for obj in (root, *root.children_recursive)}
    forbidden = [name for name in profile.forbidden_nodes if name in all_objects]
    forbidden += [
        name
        for name in all_objects
        if any(name.startswith(prefix) for prefix in profile.forbidden_prefixes)
    ]
    if forbidden:
        raise AssertionError(f"{path.name}: forbidden character structure present: {sorted(set(forbidden))}")

    for rule in profile.parent_rules:
        child = all_objects.get(rule.child)
        if child is None:
            raise AssertionError(f"{path.name}: parent rule child missing: {rule.child}")
        actual_parent = child.parent.name if child.parent is not None else None
        if actual_parent != rule.parent:
            raise AssertionError(
                f"{path.name}: {rule.child} must follow {rule.parent}, got {actual_parent}"
            )

    for rule in profile.relative_size_rules:
        node = all_objects.get(rule.node)
        if node is None:
            raise AssertionError(f"{path.name}: relative-size node missing: {rule.node}")
        node_size = object_world_size(node)
        node_value = axis_value(node_size, rule.node_axis)
        character_axis = rule.character_axis or rule.node_axis
        character_value = axis_value(size, character_axis)
        ratio = node_value / character_value
        if ratio < rule.min_ratio or (rule.max_ratio is not None and ratio > rule.max_ratio):
            upper = "∞" if rule.max_ratio is None else f"{rule.max_ratio:.3f}"
            raise AssertionError(
                f"{path.name}: {rule.node}.{rule.node_axis} ratio={ratio:.3f} "
                f"outside [{rule.min_ratio:.3f}, {upper}] vs character.{character_axis}"
            )

    missing_materials = [obj.name for obj in meshes if len(obj.data.materials) == 0]
    if missing_materials:
        raise AssertionError(f"{path.name}: meshes without materials: {missing_materials}")

    print(
        f"OK {path.name}: profile={profile.description} nodes={len(root.children_recursive)} "
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