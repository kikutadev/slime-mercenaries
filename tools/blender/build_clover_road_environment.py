from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the Clover Road battle environment GLB.")
    parser.add_argument("--output", required=True)
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(argv)


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
        # Materials are rebuilt below; purge orphaned geometry from the empty file.
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def material(name: str, color: tuple[float, float, float, float], roughness: float = 0.82) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf is not None:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = 0.0
    return mat


def blender_location(location: tuple[float, float, float]) -> tuple[float, float, float]:
    """Map runtime Three.js coordinates (X right, Y up, Z depth) to Blender Z-up."""
    x, y, z = location
    return (x, -z, y)


def blender_scale(scale: tuple[float, float, float]) -> tuple[float, float, float]:
    """Map runtime axis lengths to Blender axis lengths before glTF Y-up export."""
    x, y, z = scale
    return (x, z, y)


def apply_material(obj: bpy.types.Object, mat: bpy.types.Material) -> None:
    if obj.data is not None and hasattr(obj.data, "materials"):
        obj.data.materials.append(mat)


def bevel(obj: bpy.types.Object, width: float, segments: int = 3) -> None:
    modifier = obj.modifiers.new(name="SoftEdges", type="BEVEL")
    modifier.width = width
    modifier.segments = segments
    modifier.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def cube(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    mat: bpy.types.Material,
    *,
    rotation_z: float = 0.0,
    bevel_width: float = 0.0,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=blender_location(location), rotation=(0.0, 0.0, rotation_z))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = blender_scale(scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel_width > 0:
        bevel(obj, bevel_width)
    apply_material(obj, mat)
    return obj


def cylinder(
    name: str,
    location: tuple[float, float, float],
    radius: float,
    depth: float,
    mat: bpy.types.Material,
    *,
    vertices: int = 10,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=blender_location(location))
    obj = bpy.context.active_object
    obj.name = name
    apply_material(obj, mat)
    return obj


def ico(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    mat: bpy.types.Material,
    *,
    subdivisions: int = 2,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=1.0, location=blender_location(location))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = blender_scale(scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    apply_material(obj, mat)
    return obj


def sphere(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    mat: bpy.types.Material,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=1.0, location=blender_location(location))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = blender_scale(scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    apply_material(obj, mat)
    return obj


def build_tree(
    index: int,
    x: float,
    z: float,
    size: float,
    trunk_mat: bpy.types.Material,
    leaf_mats: tuple[bpy.types.Material, bpy.types.Material],
) -> None:
    cylinder(f"Tree_{index}_Trunk", (x, 0.62 * size, z), 0.15 * size, 1.25 * size, trunk_mat, vertices=8)
    ico(f"Tree_{index}_CrownA", (x, 1.48 * size, z), (0.72 * size, 0.62 * size, 0.72 * size), leaf_mats[index % 2])
    ico(
        f"Tree_{index}_CrownB",
        (x + 0.30 * size, 1.35 * size, z - 0.06 * size),
        (0.52 * size, 0.45 * size, 0.52 * size),
        leaf_mats[(index + 1) % 2],
    )


def build_flower_cluster(
    index: int,
    x: float,
    z: float,
    stem_mat: bpy.types.Material,
    bloom_mats: tuple[bpy.types.Material, ...],
) -> None:
    offsets = ((0.0, 0.0), (0.12, 0.07), (-0.11, 0.05))
    for part, (ox, oz) in enumerate(offsets):
        cylinder(f"Flower_{index}_{part}_Stem", (x + ox, 0.08, z + oz), 0.014, 0.16, stem_mat, vertices=6)
        sphere(
            f"Flower_{index}_{part}_Bloom",
            (x + ox, 0.18, z + oz),
            (0.065, 0.038, 0.065),
            bloom_mats[(index + part) % len(bloom_mats)],
        )


def build_sign(
    x: float,
    z: float,
    wood_dark: bpy.types.Material,
    wood_light: bpy.types.Material,
    clover_mat: bpy.types.Material,
) -> None:
    cylinder("RoadSign_Post", (x, 0.62, z), 0.07, 1.24, wood_dark, vertices=8)
    sign = cube("RoadSign_Board", (x, 1.10, z), (0.50, 0.24, 0.07), wood_light, rotation_z=-0.08, bevel_width=0.07)
    sign.rotation_euler[1] = 0.08
    bpy.ops.mesh.primitive_circle_add(vertices=12, radius=0.10, fill_type="NGON", location=blender_location((x - 0.15, 1.10, z + 0.075)))
    icon = bpy.context.active_object
    icon.name = "RoadSign_CloverMark"
    icon.rotation_euler = (math.pi / 2, 0.0, -0.08)
    icon.scale = (1.0, 0.78, 1.0)
    apply_material(icon, clover_mat)


def build() -> None:
    grass = material("Grass", (0.37, 0.68, 0.29, 1.0), 0.96)
    grass_light = material("GrassLight", (0.49, 0.77, 0.36, 1.0), 0.94)
    road = material("RoadCream", (0.83, 0.71, 0.46, 1.0), 0.97)
    road_light = material("RoadLight", (0.94, 0.84, 0.62, 1.0), 0.98)
    road_edge = material("RoadEdge", (0.67, 0.56, 0.33, 1.0), 1.0)
    wood_dark = material("WoodDark", (0.37, 0.23, 0.14, 1.0), 0.94)
    wood_light = material("WoodLight", (0.59, 0.39, 0.23, 1.0), 0.92)
    leaf_a = material("LeafA", (0.23, 0.59, 0.25, 1.0), 0.90)
    leaf_b = material("LeafB", (0.34, 0.69, 0.31, 1.0), 0.88)
    stone = material("Stone", (0.52, 0.58, 0.48, 1.0), 0.96)
    clover = material("Clover", (0.24, 0.70, 0.30, 1.0), 0.86)
    white = material("FlowerWhite", (0.96, 0.95, 0.84, 1.0), 0.82)
    yellow = material("FlowerYellow", (0.96, 0.79, 0.30, 1.0), 0.82)
    pink = material("FlowerPink", (0.93, 0.49, 0.58, 1.0), 0.84)
    violet = material("FlowerViolet", (0.59, 0.49, 0.86, 1.0), 0.84)

    # Ground is intentionally broader than the mobile camera so no hard edge enters frame.
    cube("Ground", (0.0, -0.11, -3.2), (7.8, 0.10, 10.8), grass, bevel_width=0.10)

    # A gently bending cream road is made from overlapping rounded segments, giving the field
    # an authored diorama silhouette instead of a single flat plane.
    road_segments = (
        (0.12, 2.10, 0.02),
        (0.00, -0.20, -0.025),
        (-0.12, -2.50, -0.045),
        (-0.28, -4.80, -0.055),
        (-0.43, -7.10, -0.035),
    )
    for index, (x, z, rot) in enumerate(road_segments):
        cube(f"Road_{index}", (x, -0.005, z), (2.28, 0.045, 1.42), road if index % 2 else road_light, rotation_z=rot, bevel_width=0.26)

    # Pebble/soil bands soften the transition between road and grass.
    for side in (-1, 1):
        for index, z in enumerate((2.1, 0.2, -1.8, -3.8, -5.8, -7.8)):
            x = side * (2.30 + 0.10 * math.sin(index * 1.7))
            ico(f"RoadEdgeStone_{side}_{index}", (x, 0.04, z), (0.16, 0.07, 0.11), road_edge, subdivisions=1)

    # Split-rail fencing frames the fight but stays outside the combat cluster.
    for side in (-1, 1):
        x = side * 3.35
        for index, z in enumerate((2.4, 0.5, -1.4, -3.3, -5.2, -7.1)):
            cylinder(f"Fence_{side}_{index}_Post", (x, 0.34, z), 0.07, 0.68, wood_dark, vertices=8)
            if index < 5:
                for level in (0.25, 0.45):
                    rail = cube(
                        f"Fence_{side}_{index}_{level}_Rail",
                        (x, level, z - 0.94),
                        (0.045, 0.045, 0.96),
                        wood_light,
                        bevel_width=0.025,
                    )
                    rail.rotation_euler[1] = 0.0

    # Trees, bushes and rocks create depth layers around the playable corridor.
    tree_specs = (
        (-4.5, 1.2, 0.82),
        (4.7, 0.2, 0.95),
        (-4.8, -3.6, 1.08),
        (4.9, -5.2, 1.22),
        (-4.2, -7.6, 1.30),
        (4.2, -8.4, 1.12),
    )
    for index, (x, z, size) in enumerate(tree_specs):
        build_tree(index, x, z, size, wood_dark, (leaf_a, leaf_b))

    bush_specs = ((-3.9, 2.5), (3.8, 2.0), (-4.0, -0.7), (4.1, -2.3), (-3.8, -5.5), (3.9, -7.1))
    for index, (x, z) in enumerate(bush_specs):
        ico(f"Bush_{index}", (x, 0.31, z), (0.58, 0.32, 0.46), leaf_b if index % 2 else leaf_a)

    rock_specs = ((-2.9, 1.0, 0.28), (2.8, 0.3, 0.21), (-2.8, -2.9, 0.24), (2.9, -4.4, 0.31))
    for index, (x, z, size) in enumerate(rock_specs):
        ico(f"Rock_{index}", (x, size * 0.45, z), (size, size * 0.52, size * 0.72), stone, subdivisions=1)

    flower_specs = ((-2.8, 2.4), (2.7, 2.0), (-3.0, 0.1), (2.9, -1.1), (-2.9, -3.8), (3.0, -6.1), (-2.6, -7.6))
    for index, (x, z) in enumerate(flower_specs):
        build_flower_cluster(index, x, z, clover, (white, yellow, pink, violet))

    # Clover patches are simple flattened lobes; they help Area 1 read at gameplay scale.
    for index, (x, z) in enumerate(((-2.55, 1.7), (2.55, 1.1), (-2.7, -1.7), (2.6, -3.1))):
        for lobe in range(3):
            angle = lobe * math.tau / 3.0
            sphere(
                f"Clover_{index}_{lobe}",
                (x + math.cos(angle) * 0.085, 0.035, z + math.sin(angle) * 0.085),
                (0.105, 0.028, 0.085),
                clover,
            )

    build_sign(-3.15, 2.55, wood_dark, wood_light, clover)

    # Large soft hills sit beyond the fight and are visible through fog as a painted-diorama backdrop.
    hill_mat_a = material("HillA", (0.34, 0.61, 0.31, 1.0), 1.0)
    hill_mat_b = material("HillB", (0.42, 0.68, 0.36, 1.0), 1.0)
    for index, (x, z, sx, sy, sz) in enumerate(((-5.2, -10.5, 4.0, 1.5, 2.6), (0.0, -11.5, 5.4, 1.7, 3.0), (5.6, -10.2, 4.1, 1.4, 2.5))):
        sphere(f"Hill_{index}", (x, 0.55, z), (sx, sy, sz), hill_mat_a if index != 1 else hill_mat_b)

    for obj in bpy.context.scene.objects:
        if hasattr(obj, "visible_shadow"):
            obj.visible_shadow = True


def export_glb(path: Path) -> None:
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
    export_glb(Path(args.output).resolve())
    print(f"Exported Clover Road environment -> {args.output}")


if __name__ == "__main__":
    main()
