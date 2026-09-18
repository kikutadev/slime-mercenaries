from __future__ import annotations

import argparse
import sys
from pathlib import Path

import bpy


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the Slime Mercenaries battlefield reward chest.")
    parser.add_argument("--output", required=True)
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(argv)


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def material(name: str, color: tuple[float, float, float, float], roughness: float, metallic: float = 0.0) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = color
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf is not None:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
    return mat


def cube(name: str, loc: tuple[float, float, float], scale: tuple[float, float, float], mat: bpy.types.Material, bevel_width: float = 0.04) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel_width > 0:
        mod = obj.modifiers.new(name="SoftEdges", type="BEVEL")
        mod.width = bevel_width
        mod.segments = 3
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.data.materials.append(mat)
    return obj


def build() -> None:
    wood = material("ChestWood", (0.48, 0.24, 0.10, 1.0), 0.78)
    wood_light = material("ChestWoodLight", (0.72, 0.42, 0.16, 1.0), 0.72)
    gold = material("ChestGold", (0.94, 0.66, 0.16, 1.0), 0.40, 0.18)
    dark = material("ChestDark", (0.16, 0.12, 0.09, 1.0), 0.80)

    root = bpy.data.objects.new("RewardChest", None)
    bpy.context.collection.objects.link(root)

    base = cube("ChestBase", (0.0, 0.0, 0.30), (0.48, 0.34, 0.28), wood)
    base.parent = root

    for x in (-0.39, 0.39):
        band = cube(f"ChestBand_{x:+.2f}", (x, -0.005, 0.31), (0.055, 0.355, 0.30), gold, 0.025)
        band.parent = root

    bottom_band = cube("ChestBottomBand", (0.0, -0.005, 0.09), (0.50, 0.355, 0.055), gold, 0.025)
    bottom_band.parent = root

    lock_plate = cube("ChestLockPlate", (0.0, -0.355, 0.34), (0.12, 0.035, 0.15), gold, 0.025)
    lock_plate.parent = root
    lock = cube("ChestLock", (0.0, -0.395, 0.31), (0.055, 0.02, 0.065), dark, 0.018)
    lock.parent = root

    # Hinge pivot lives at the rear edge so runtime can rotate the complete lid naturally.
    pivot = bpy.data.objects.new("ChestLidPivot", None)
    bpy.context.collection.objects.link(pivot)
    pivot.location = (0.0, 0.32, 0.58)
    pivot.parent = root

    lid = cube("ChestLid", (0.0, 0.0, 0.18), (0.49, 0.34, 0.17), wood_light)
    lid.parent = pivot

    top_band = cube("ChestTopBand", (0.0, -0.005, 0.18), (0.50, 0.355, 0.055), gold, 0.025)
    top_band.parent = pivot

    for x in (-0.39, 0.39):
        band = cube(f"ChestLidBand_{x:+.2f}", (x, -0.005, 0.18), (0.055, 0.355, 0.18), gold, 0.025)
        band.parent = pivot

    # Soft gem gives the chest a recognizable reward focal point at small mobile scale.
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.085, location=(0.0, -0.405, 0.49))
    gem = bpy.context.active_object
    gem.name = "ChestGem"
    gem.scale = (1.0, 0.55, 1.15)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    gem.data.materials.append(material("ChestGemMat", (0.32, 0.82, 0.84, 1.0), 0.22, 0.08))
    gem.parent = root


def export(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
    )


def main() -> None:
    args = parse_args()
    clear_scene()
    build()
    export(Path(args.output).resolve())
    print(f"Exported reward chest -> {args.output}")


if __name__ == "__main__":
    main()
