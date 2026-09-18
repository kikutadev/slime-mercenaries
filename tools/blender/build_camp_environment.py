from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy


def args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the production Camp environment.")
    parser.add_argument("--output", required=True)
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(argv)


def clear() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def mat(name: str, color: tuple[float, float, float, float], roughness: float = 0.85, metallic: float = 0.0) -> bpy.types.Material:
    value = bpy.data.materials.new(name)
    value.use_nodes = True
    value.diffuse_color = color
    bsdf = value.node_tree.nodes.get("Principled BSDF")
    if bsdf is not None:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
    return value


def blender_location(location: tuple[float, float, float]) -> tuple[float, float, float]:
    """Map runtime Three.js coordinates (X right, Y up, Z depth) to Blender Z-up."""
    x, y, z = location
    return (x, -z, y)


def blender_scale(scale: tuple[float, float, float]) -> tuple[float, float, float]:
    x, y, z = scale
    return (x, z, y)


def blender_vertex(vertex: tuple[float, float, float]) -> tuple[float, float, float]:
    return blender_location(vertex)


def finish(obj: bpy.types.Object, material: bpy.types.Material, bevel: float = 0.0) -> bpy.types.Object:
    if obj.data is not None and hasattr(obj.data, "materials"):
        obj.data.materials.append(material)
    if bevel > 0:
        modifier = obj.modifiers.new("SoftEdges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
        modifier.limit_method = "ANGLE"
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj


def cube(name: str, loc, scale, material, bevel: float = 0.05, rotation=(0.0, 0.0, 0.0)) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=blender_location(loc), rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = blender_scale(scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, material, bevel)


def cyl(name: str, loc, radius: float, depth: float, material, vertices: int = 12) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=blender_location(loc))
    obj = bpy.context.active_object
    obj.name = name
    return finish(obj, material)


def sphere(name: str, loc, scale, material, ico: bool = False) -> bpy.types.Object:
    if ico:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0, location=blender_location(loc))
    else:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=1.0, location=blender_location(loc))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = blender_scale(scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, material)


def triangular_tent(name: str, x: float, z: float, cloth, dark, pole) -> None:
    verts = [
        (-0.95, 0.0, -0.65), (0.95, 0.0, -0.65), (-0.95, 0.0, 0.65), (0.95, 0.0, 0.65),
        (0.0, 1.35, -0.65), (0.0, 1.35, 0.65),
    ]
    faces = [(0,1,4), (2,5,3), (0,2,3,1), (0,4,5,2), (1,3,5,4)]
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata([blender_vertex(vertex) for vertex in verts], [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = blender_location((x, 0.02, z))
    finish(obj, cloth)
    cube(f"{name}Door", (x, 0.43, z + 0.655), (0.26, 0.42, 0.025), dark, 0.06)
    cyl(f"{name}Pole", (x, 0.68, z + 0.69), 0.035, 1.36, pole, 8)


def training_dummy(x: float, z: float, wood, straw, target) -> None:
    cyl("TrainingDummyPost", (x, 0.63, z), 0.07, 1.26, wood, 10)
    cube("TrainingDummyFeet", (x, 0.06, z), (0.48, 0.07, 0.12), wood, 0.04)
    cyl("TrainingDummyBody", (x, 0.92, z), 0.39, 0.20, straw, 18)
    body = bpy.context.active_object
    body.rotation_euler[0] = math.pi / 2
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=False)
    cyl("TrainingDummyTarget", (x, 0.92, z - 0.115), 0.17, 0.035, target, 18)
    tgt = bpy.context.active_object
    tgt.rotation_euler[0] = math.pi / 2
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=False)
    cube("TrainingDummyArm", (x, 1.10, z), (0.62, 0.06, 0.06), wood, 0.04)


def fusion_altar(x: float, z: float, stone, accent, gold) -> None:
    cyl("FusionAltarBase", (x, 0.12, z), 0.72, 0.24, stone, 20)
    cyl("FusionAltarPedestal", (x, 0.31, z), 0.48, 0.28, stone, 20)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.41, minor_radius=0.055, major_segments=24, minor_segments=8, location=blender_location((x, 0.53, z)))
    ring = bpy.context.active_object
    ring.name = "FusionAltarRing"
    finish(ring, accent)
    for i in range(4):
        angle = math.tau * i / 4
        sphere(
            f"FusionCrystal_{i}",
            (x + math.cos(angle) * 0.46, 0.62, z + math.sin(angle) * 0.46),
            (0.09, 0.16, 0.09),
            gold,
            ico=True,
        )


def nursery_vat(x: float, z: float, stone, metal, gel) -> None:
    cyl("NurseryVatBase", (x, 0.15, z), 0.65, 0.30, stone, 20)
    cyl("NurseryVatBody", (x, 0.51, z), 0.52, 0.58, metal, 20)
    cyl("NurseryVatGel", (x, 0.82, z), 0.43, 0.10, gel, 20)
    sphere("NurserySlimeBubble", (x, 0.88, z), (0.28, 0.18, 0.28), gel)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.52, minor_radius=0.055, major_segments=24, minor_segments=8, location=blender_location((x, 0.82, z)))
    rim = bpy.context.active_object
    rim.name = "NurseryVatRim"
    finish(rim, stone)


def formation_flag(x: float, z: float, pole, fabric, gold) -> None:
    cyl("FormationFlagPole", (x, 0.87, z), 0.045, 1.74, pole, 10)
    cube("FormationFlagFoot", (x, 0.07, z), (0.32, 0.07, 0.22), pole, 0.05)
    verts = [(0,0,0), (0,0.72,0), (0.58,0.59,0), (0.47,0.27,0)]
    mesh = bpy.data.meshes.new("FormationFlagMesh")
    mesh.from_pydata([blender_vertex(vertex) for vertex in verts], [], [(0,1,2,3)])
    mesh.update()
    flag = bpy.data.objects.new("FormationFlag", mesh)
    bpy.context.collection.objects.link(flag)
    flag.location = blender_location((x + 0.04, 1.18, z))
    flag.rotation_euler[1] = -0.12
    finish(flag, fabric)
    sphere("FormationFlagFinial", (x, 1.77, z), (0.09,0.09,0.09), gold, ico=True)


def rack(x: float, z: float, wood, metal) -> None:
    for side in (-1, 1):
        cube(f"WeaponRackLeg_{side}", (x + side * 0.46, 0.50, z), (0.06, 0.50, 0.06), wood, 0.035)
    cube("WeaponRackBar", (x, 0.85, z), (0.55, 0.06, 0.06), wood, 0.035)
    for i, px in enumerate((x - 0.25, x, x + 0.25)):
        blade = cube(f"RackWeapon_{i}", (px, 0.66, z - 0.05), (0.035, 0.31, 0.025), metal, 0.02, rotation=(0.0, 0.0, (-0.18 + i * 0.18)))
        blade.rotation_euler[1] = 0.08


def tree(name: str, x: float, z: float, size: float, trunk, leaves) -> None:
    cyl(f"{name}Trunk", (x, 0.55 * size, z), 0.14 * size, 1.1 * size, trunk, 9)
    sphere(f"{name}Crown", (x, 1.35 * size, z), (0.72 * size, 0.58 * size, 0.72 * size), leaves, ico=True)


def build() -> None:
    grass = mat("CampGrass", (0.43, 0.72, 0.33, 1.0), 0.95)
    grass2 = mat("CampGrass2", (0.55, 0.79, 0.40, 1.0), 0.95)
    dirt = mat("CampDirt", (0.84, 0.74, 0.50, 1.0), 0.98)
    stone = mat("CampStone", (0.54, 0.60, 0.51, 1.0), 0.96)
    wood = mat("CampWood", (0.45, 0.29, 0.17, 1.0), 0.92)
    cloth = mat("TentCoral", (0.80, 0.36, 0.27, 1.0), 0.86)
    cloth_dark = mat("TentDark", (0.35, 0.22, 0.18, 1.0), 0.94)
    straw = mat("DummyStraw", (0.81, 0.65, 0.36, 1.0), 0.94)
    target = mat("DummyTarget", (0.78, 0.30, 0.24, 1.0), 0.86)
    fusion = mat("FusionMint", (0.34, 0.82, 0.65, 1.0), 0.45)
    gold = mat("CampGold", (0.94, 0.72, 0.24, 1.0), 0.52, 0.10)
    vat_metal = mat("VatMetal", (0.43, 0.58, 0.57, 1.0), 0.68, 0.08)
    gel = mat("NurseryGel", (0.28, 0.76, 0.86, 0.88), 0.28)
    flag = mat("FormationGreen", (0.22, 0.57, 0.30, 1.0), 0.82)
    metal = mat("RackMetal", (0.59, 0.68, 0.67, 1.0), 0.52, 0.12)
    leaves = mat("CampLeaves", (0.30, 0.63, 0.28, 1.0), 0.92)

    # Layered oval ground makes the base read like a toy diorama.
    cyl("CampGround", (0, -0.09, 0), 5.5, 0.18, grass, 48)
    ground = bpy.context.active_object
    ground.scale.y = 0.82
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cyl("CampClearing", (0, 0.015, 0.10), 2.15, 0.05, dirt, 48)
    clearing = bpy.context.active_object
    clearing.scale.y = 0.68
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    triangular_tent("CampTent", -3.15, -1.55, cloth, cloth_dark, wood)
    training_dummy(-2.65, -0.15, wood, straw, target)
    fusion_altar(2.55, -0.35, stone, fusion, gold)
    nursery_vat(-2.55, 1.55, stone, vat_metal, gel)
    formation_flag(2.65, 1.55, wood, flag, gold)
    rack(-3.55, 1.25, wood, metal)

    for i, (x, z, s) in enumerate(((-4.2,-2.8,0.9),(4.25,-2.5,1.0),(-4.35,2.8,0.95),(4.35,2.65,0.9))):
        tree(f"CampTree{i}", x, z, s, wood, leaves)

    # Small stones and bushes frame the central character without visual noise.
    for i, (x, z) in enumerate(((-1.5,-2.4),(1.7,-2.3),(-1.6,2.7),(1.4,2.9))):
        sphere(f"CampBush{i}", (x,0.28,z), (0.48,0.28,0.40), grass2, ico=True)
    for i, (x, z) in enumerate(((-2.0,0.8),(2.05,0.85),(-0.9,-2.0),(0.9,-2.1))):
        sphere(f"CampRock{i}", (x,0.10,z), (0.19,0.10,0.14), stone, ico=True)


def export(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", export_apply=True, export_yup=True, export_materials="EXPORT")


def main() -> None:
    options = args()
    clear()
    build()
    export(Path(options.output).resolve())
    print(f"Exported Camp environment -> {options.output}")


if __name__ == "__main__":
    main()
