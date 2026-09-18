from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the Dispatch route-map diorama.")
    parser.add_argument("--output", required=True)
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(argv)


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def blender_location(location: tuple[float, float, float]) -> tuple[float, float, float]:
    x, y, z = location
    return (x, -z, y)


def blender_scale(scale: tuple[float, float, float]) -> tuple[float, float, float]:
    x, y, z = scale
    return (x, z, y)


def material(name: str, color: tuple[float, float, float, float], roughness: float = 0.88, metallic: float = 0.0) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = color
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf is not None:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
    return mat


def finish(obj: bpy.types.Object, mat: bpy.types.Material, bevel: float = 0.0) -> bpy.types.Object:
    if obj.data is not None and hasattr(obj.data, "materials"):
        obj.data.materials.append(mat)
    if bevel > 0:
        mod = obj.modifiers.new(name="SoftEdges", type="BEVEL")
        mod.width = bevel
        mod.segments = 3
        mod.limit_method = "ANGLE"
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj


def cube(name: str, loc, scale, mat, *, rotation_y: float = 0.0, bevel: float = 0.05) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=blender_location(loc), rotation=(0.0, 0.0, rotation_y))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = blender_scale(scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, mat, bevel)


def cylinder(name: str, loc, radius: float, depth: float, mat, vertices: int = 12) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=blender_location(loc))
    obj = bpy.context.active_object
    obj.name = name
    return finish(obj, mat)


def sphere(name: str, loc, scale, mat, *, ico: bool = False) -> bpy.types.Object:
    if ico:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0, location=blender_location(loc))
    else:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=8, radius=1.0, location=blender_location(loc))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = blender_scale(scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, mat)


def tree(name: str, x: float, z: float, size: float, trunk, leaves) -> None:
    cylinder(f"{name}_Trunk", (x, 0.43 * size, z), 0.09 * size, 0.86 * size, trunk, 8)
    sphere(f"{name}_Crown", (x, 1.02 * size, z), (0.44 * size, 0.40 * size, 0.44 * size), leaves, ico=True)


def crystal(name: str, x: float, z: float, size: float, mat) -> None:
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.20 * size, radius2=0.05 * size, depth=0.72 * size, location=blender_location((x, 0.36 * size, z)))
    obj = bpy.context.active_object
    obj.name = name
    finish(obj, mat)


def road_segment(name: str, start: tuple[float, float], end: tuple[float, float], mat) -> None:
    sx, sz = start
    ex, ez = end
    dx = ex - sx
    dz = ez - sz
    length = math.sqrt(dx * dx + dz * dz)
    cx = (sx + ex) * 0.5
    cz = (sz + ez) * 0.5
    angle = math.atan2(dz, dx)
    # Runtime Y rotation maps to Blender Z rotation through glTF export.
    cube(name, (cx, 0.025, cz), (length * 0.5, 0.035, 0.17), mat, rotation_y=-angle, bevel=0.10)


def build() -> None:
    grass = material("MapGrass", (0.43, 0.69, 0.32, 1.0), 0.96)
    grass_light = material("MapGrassLight", (0.55, 0.78, 0.39, 1.0), 0.95)
    water = material("MapWater", (0.35, 0.70, 0.78, 1.0), 0.55)
    road = material("MapRoad", (0.83, 0.72, 0.47, 1.0), 0.97)
    wood = material("MapWood", (0.43, 0.28, 0.16, 1.0), 0.92)
    leaves = material("MapLeaves", (0.23, 0.55, 0.26, 1.0), 0.92)
    leaves_light = material("MapLeavesLight", (0.33, 0.66, 0.31, 1.0), 0.92)
    stone = material("MapStone", (0.48, 0.53, 0.47, 1.0), 0.98)
    crystal_mat = material("MapCrystal", (0.91, 0.59, 0.19, 1.0), 0.36, 0.08)
    tent = material("MapTent", (0.78, 0.34, 0.26, 1.0), 0.86)
    gold = material("MapGold", (0.94, 0.72, 0.22, 1.0), 0.55, 0.10)

    # Toy-map base.
    cylinder("MapBase", (0, -0.13, 0), 5.7, 0.26, stone, 48)
    base = bpy.context.active_object
    base.scale.y = 0.78
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cylinder("MapLand", (0, 0.02, 0), 5.38, 0.08, grass, 48)
    land = bpy.context.active_object
    land.scale.y = 0.75
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # River is a chain of broad rounded water tiles across the middle.
    for index, (x, z, angle) in enumerate(((-1.3,-3.4,0.45),(-0.7,-2.0,0.38),(-0.2,-0.6,0.28),(0.2,0.8,0.18),(0.6,2.3,0.12),(0.9,3.6,0.05))):
        cube(f"River_{index}", (x, 0.075, z), (0.62, 0.035, 1.18), water, rotation_y=angle, bevel=0.30)

    home = (0.0, 0.45)
    road_end = (-2.85, -1.45)
    forest_end = (2.75, -2.15)
    quarry_end = (2.35, 2.25)

    road_segment("RouteRoadEscort_A", home, (-1.35, -0.40), road)
    road_segment("RouteRoadEscort_B", (-1.35, -0.40), road_end, road)
    road_segment("RouteForest_A", home, (1.25, -0.70), road)
    road_segment("RouteForest_B", (1.25, -0.70), forest_end, road)
    road_segment("RouteQuarry_A", home, (1.15, 1.20), road)
    road_segment("RouteQuarry_B", (1.15, 1.20), quarry_end, road)

    # Home camp: a simple tent, flag and warm beacon.
    verts = [(-0.55,0,-0.38),(0.55,0,-0.38),(-0.55,0,0.38),(0.55,0,0.38),(0,0.78,-0.38),(0,0.78,0.38)]
    faces = [(0,1,4),(2,5,3),(0,2,3,1),(0,4,5,2),(1,3,5,4)]
    mesh = bpy.data.meshes.new("MapCampTentMesh")
    mesh.from_pydata([blender_location(v) for v in verts], [], faces)
    mesh.update()
    camp = bpy.data.objects.new("MapCampTent", mesh)
    bpy.context.collection.objects.link(camp)
    camp.location = blender_location((home[0], 0.09, home[1]))
    finish(camp, tent)
    cylinder("MapCampFlagPole", (0.58, 0.55, 0.45), 0.035, 1.10, wood, 8)
    sphere("MapCampBeacon", (0.0, 0.78, 0.45), (0.12,0.12,0.12), gold, ico=True)

    # Road escort destination: gate + cart-like cargo block.
    for side in (-1, 1):
        cylinder(f"RoadGatePost_{side}", (road_end[0] + side * 0.38, 0.52, road_end[1]), 0.055, 1.04, wood, 8)
    cube("RoadGateTop", (road_end[0], 0.95, road_end[1]), (0.48,0.055,0.055), wood, bevel=0.03)
    cube("RoadCargo", (road_end[0] - 0.1, 0.23, road_end[1] + 0.42), (0.34,0.22,0.28), tent, bevel=0.07)

    # Forest destination: dense three-tree silhouette.
    for index, (x, z, size) in enumerate(((2.55,-2.15,1.15),(2.95,-2.30,0.95),(2.78,-1.72,0.78))):
        tree(f"ForestTree_{index}", x, z, size, wood, leaves if index != 2 else leaves_light)

    # Quarry destination: rocks + amber crystals.
    for index, (x, z, size) in enumerate(((2.12,2.30,0.42),(2.58,2.14,0.34),(2.38,2.60,0.30))):
        sphere(f"QuarryRock_{index}", (x, 0.18, z), (size, size * 0.48, size * 0.75), stone, ico=True)
    for index, (x,z,size) in enumerate(((2.22,2.20,1.0),(2.55,2.34,0.72),(2.38,2.04,0.62))):
        crystal(f"QuarryCrystal_{index}", x, z, size, crystal_mat)

    # Peripheral landmarks make the route board feel like a world rather than a blank plate.
    for index, (x, z, size) in enumerate(((-4.2,-2.8,0.85),(-4.1,2.5,0.78),(4.25,-0.1,0.82),(3.8,3.1,0.65))):
        tree(f"EdgeTree_{index}", x, z, size, wood, leaves_light)
    for index, (x,z) in enumerate(((-3.6,1.4),(-2.3,3.0),(3.7,-3.0))):
        sphere(f"MapBush_{index}", (x,0.24,z), (0.44,0.24,0.36), grass_light, ico=True)


def export(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", export_apply=True, export_yup=True, export_materials="EXPORT")


def main() -> None:
    options = parse_args()
    clear_scene()
    build()
    export(Path(options.output).resolve())
    print(f"Exported Dispatch map -> {options.output}")


if __name__ == "__main__":
    main()
