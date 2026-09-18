from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


WEAPONS = (
    ("weapon.sword.bronze-saber", "sword", "common"),
    ("weapon.sword.clover-blade", "sword", "rare"),
    ("weapon.sword.starcleaver", "sword", "mythic"),
    ("weapon.bow.hunter-bow", "bow", "common"),
    ("weapon.bow.windstring", "bow", "rare"),
    ("weapon.bow.comet-string", "bow", "mythic"),
    ("weapon.shield.iron-bulwark", "shield", "common"),
    ("weapon.shield.clover-aegis", "shield", "rare"),
    ("weapon.shield.aegis-of-dawn", "shield", "mythic"),
    ("weapon.wand.oak-wand", "wand", "common"),
    ("weapon.wand.mooncap-wand", "wand", "rare"),
    ("weapon.wand.sunseed-staff", "wand", "mythic"),
    ("weapon.dagger.scout-knives", "dagger", "common"),
    ("weapon.dagger.shade-twins", "dagger", "rare"),
    ("weapon.dagger.nightglass-twins", "dagger", "mythic"),
    ("weapon.gun.brass-pistol", "gun", "common"),
    ("weapon.gun.spark-carbine", "gun", "rare"),
    ("weapon.gun.jellynova", "gun", "mythic"),
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build Forge room and all weapon reveal assets.")
    parser.add_argument("--environment-output", required=True)
    parser.add_argument("--weapon-output-dir", required=True)
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(argv)


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
        for block in list(collection):
            if block.users == 0:
                collection.remove(block)


def material(
    name: str,
    color: tuple[float, float, float, float],
    roughness: float = 0.78,
    metallic: float = 0.0,
    emission: tuple[float, float, float, float] | None = None,
    emission_strength: float = 0.0,
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = color
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf is not None:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
        if emission is not None:
            bsdf.inputs["Emission Color"].default_value = emission
            bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


def finish(obj: bpy.types.Object, mat: bpy.types.Material, bevel: float = 0.0) -> bpy.types.Object:
    if obj.data is not None and hasattr(obj.data, "materials"):
        obj.data.materials.append(mat)
    if bevel > 0 and obj.type == "MESH":
        modifier = obj.modifiers.new(name="SoftEdges", type="BEVEL")
        modifier.width = bevel
        modifier.segments = 3
        modifier.limit_method = "ANGLE"
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj


def cube(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    mat: bpy.types.Material,
    *,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
    bevel: float = 0.04,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, mat, bevel)


def cylinder(
    name: str,
    location: tuple[float, float, float],
    radius: float,
    depth: float,
    mat: bpy.types.Material,
    *,
    vertices: int = 12,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    return finish(obj, mat)


def sphere(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    mat: bpy.types.Material,
    *,
    ico: bool = False,
) -> bpy.types.Object:
    if ico:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0, location=location)
    else:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=1.0, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, mat)


def torus(
    name: str,
    location: tuple[float, float, float],
    major_radius: float,
    minor_radius: float,
    mat: bpy.types.Material,
    *,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=28,
        minor_segments=8,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    return finish(obj, mat)


def beam(name: str, start: Vector, end: Vector, radius: float, mat: bpy.types.Material) -> bpy.types.Object:
    midpoint = (start + end) * 0.5
    direction = end - start
    length = direction.length
    obj = cylinder(name, tuple(midpoint), radius, length, mat, vertices=10)
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
    return obj


def build_forge_environment() -> None:
    wall = material("ForgeWall", (0.10, 0.19, 0.21, 1.0), 0.95)
    wall_alt = material("ForgeWallAlt", (0.15, 0.28, 0.29, 1.0), 0.92)
    floor = material("ForgeFloor", (0.11, 0.16, 0.16, 1.0), 0.96)
    steel = material("ForgeSteel", (0.35, 0.43, 0.42, 1.0), 0.48, 0.22)
    steel_dark = material("ForgeSteelDark", (0.14, 0.21, 0.21, 1.0), 0.58, 0.18)
    brass = material("ForgeBrass", (0.62, 0.39, 0.15, 1.0), 0.48, 0.28)
    wood = material("ForgeWood", (0.37, 0.23, 0.14, 1.0), 0.84)
    glow = material(
        "ForgeGlow",
        (0.96, 0.55, 0.10, 1.0),
        0.30,
        0.05,
        emission=(1.0, 0.34, 0.04, 1.0),
        emission_strength=3.0,
    )
    cyan = material(
        "ForgeRune",
        (0.27, 0.74, 0.74, 1.0),
        0.30,
        0.08,
        emission=(0.05, 0.62, 0.66, 1.0),
        emission_strength=1.8,
    )
    window_glow = material(
        "WindowGlow",
        (0.70, 0.88, 0.88, 1.0),
        0.45,
        emission=(0.38, 0.75, 0.84, 1.0),
        emission_strength=0.75,
    )

    cube("ForgeBackWall", (0.0, 1.95, -2.35), (4.6, 2.1, 0.18), wall, bevel=0.08)
    cube("ForgeFloor", (0.0, -0.16, 0.0), (4.6, 0.16, 3.4), floor, bevel=0.10)

    # Arched-window impression using lit panels inside thick frames.
    for side in (-1, 1):
        x = side * 3.1
        cube(f"Window_{side}_Glow", (x, 2.15, -2.12), (0.72, 1.15, 0.06), window_glow, bevel=0.26)
        cube(f"Window_{side}_FrameL", (x - 0.77, 2.15, -2.03), (0.10, 1.22, 0.10), steel_dark, bevel=0.05)
        cube(f"Window_{side}_FrameR", (x + 0.77, 2.15, -2.03), (0.10, 1.22, 0.10), steel_dark, bevel=0.05)
        cube(f"Window_{side}_FrameB", (x, 1.02, -2.03), (0.86, 0.10, 0.10), steel_dark, bevel=0.05)

    # Pipework keeps the room mechanical without dominating the machine.
    for side in (-1, 1):
        x = side * 2.15
        cylinder(f"Pipe_{side}", (x, 1.65, -1.95), 0.12, 2.85, steel_dark, vertices=12)
        torus(f"PipeRing_{side}_A", (x, 0.75, -1.95), 0.16, 0.045, brass)
        torus(f"PipeRing_{side}_B", (x, 2.45, -1.95), 0.16, 0.045, brass)

    # Main machine plinth and anvil.
    cylinder("ForgeMachineBase", (0.0, 0.12, -0.35), 1.55, 0.24, steel_dark, vertices=24)
    cylinder("ForgeMachineDeck", (0.0, 0.28, -0.35), 1.28, 0.12, steel, vertices=24)
    anvil = cube("ForgeAnvil", (0.0, 0.72, -0.35), (0.82, 0.30, 0.52), steel, bevel=0.16)
    cube("ForgeAnvilTop", (0.0, 1.02, -0.35), (1.06, 0.13, 0.45), steel, bevel=0.11)
    cube("ForgeAnvilFoot", (0.0, 0.40, -0.35), (0.58, 0.14, 0.44), steel_dark, bevel=0.10)

    # Core and rune rings under the working surface.
    sphere("ForgeCore", (0.0, 0.52, 0.28), (0.28, 0.28, 0.28), glow, ico=True)
    torus("ForgeRuneOuter", (0.0, 0.55, 0.28), 0.54, 0.035, cyan, rotation=(math.pi / 2, 0, 0))
    torus("ForgeRuneInner", (0.0, 0.55, 0.28), 0.38, 0.025, brass, rotation=(math.pi / 2, 0, 0))

    # Key slot directly in front of the machine.
    cube("ForgeKeySlot", (0.0, 0.34, 1.15), (0.36, 0.15, 0.18), steel_dark, bevel=0.10)
    sphere("ForgeKeySocket", (0.0, 0.48, 1.02), (0.11, 0.16, 0.07), cyan, ico=True)

    # Hammer uses an empty pivot for authored strike motion in runtime.
    pivot = bpy.data.objects.new("ForgeHammerPivot", None)
    bpy.context.collection.objects.link(pivot)
    pivot.location = (0.0, 2.95, -0.35)
    handle = cube("ForgeHammerHandle", (0.0, -0.86, 0.0), (0.10, 0.86, 0.10), wood, bevel=0.05)
    head = cube("ForgeHammerHead", (0.0, -1.68, 0.0), (0.62, 0.30, 0.36), steel, bevel=0.12)
    cap_left = cube("ForgeHammerCapL", (-0.64, -1.68, 0.0), (0.10, 0.24, 0.31), brass, bevel=0.05)
    cap_right = cube("ForgeHammerCapR", (0.64, -1.68, 0.0), (0.10, 0.24, 0.31), brass, bevel=0.05)
    for obj in (handle, head, cap_left, cap_right):
        obj.parent = pivot

    # Shelves with ingots add working-room context.
    for side in (-1, 1):
        x = side * 3.35
        cube(f"ForgeShelf_{side}", (x, 0.72, -1.35), (0.82, 0.07, 0.42), wood, bevel=0.05)
        for index in range(3):
            cube(
                f"ForgeIngot_{side}_{index}",
                (x - 0.38 + index * 0.38, 0.88, -1.35),
                (0.16, 0.08, 0.24),
                brass if index == 2 else steel,
                bevel=0.05,
            )


def rarity_palette(rarity: str) -> tuple[tuple[float, float, float, float], tuple[float, float, float, float]]:
    if rarity == "mythic":
        return (0.92, 0.76, 0.28, 1.0), (0.54, 0.32, 0.82, 1.0)
    if rarity == "rare":
        return (0.32, 0.68, 0.82, 1.0), (0.24, 0.58, 0.37, 1.0)
    return (0.56, 0.61, 0.60, 1.0), (0.42, 0.29, 0.18, 1.0)


def weapon_materials(rarity: str) -> tuple[bpy.types.Material, bpy.types.Material, bpy.types.Material]:
    primary_color, accent_color = rarity_palette(rarity)
    primary = material(f"WeaponPrimary_{rarity}", primary_color, 0.36 if rarity == "mythic" else 0.52, 0.28)
    accent = material(
        f"WeaponAccent_{rarity}",
        accent_color,
        0.28,
        0.18,
        emission=accent_color if rarity != "common" else None,
        emission_strength=1.15 if rarity == "mythic" else 0.35 if rarity == "rare" else 0.0,
    )
    grip = material(f"WeaponGrip_{rarity}", (0.20, 0.14, 0.12, 1.0), 0.88)
    return primary, accent, grip


def build_sword(rarity: str) -> None:
    primary, accent, grip = weapon_materials(rarity)
    mythic = rarity == "mythic"
    rare = rarity == "rare"
    blade_width = 0.20 if not mythic else 0.34
    blade_length = 1.45 if not mythic else 1.65
    cube("WeaponBlade", (0.0, 0.0, 0.85), (blade_width, 0.08, blade_length * 0.5), primary, bevel=0.06)
    if mythic:
        cube("WeaponBladeSpine", (0.0, -0.10, 0.98), (0.08, 0.05, 0.62), accent, bevel=0.04)
    cube("WeaponGuard", (0.0, 0.0, 0.05), (0.58 if mythic else 0.42, 0.10, 0.10), accent, bevel=0.07)
    cube("WeaponGrip", (0.0, 0.0, -0.36), (0.10, 0.09, 0.34), grip, bevel=0.05)
    sphere("WeaponPommel", (0.0, 0.0, -0.72), (0.15, 0.10, 0.15), accent, ico=True)
    if rare or mythic:
        sphere("WeaponGem", (0.0, -0.12, 0.10), (0.10, 0.06, 0.10), accent, ico=True)


def build_bow(rarity: str) -> None:
    primary, accent, grip = weapon_materials(rarity)
    mythic = rarity == "mythic"
    radius = 1.18 if mythic else 1.02
    points = [
        Vector((0.0, 0.0, -1.25)),
        Vector((-0.38, 0.0, -0.72)),
        Vector((-0.48 if mythic else -0.42, 0.0, 0.0)),
        Vector((-0.38, 0.0, 0.72)),
        Vector((0.0, 0.0, 1.25)),
    ]
    for index in range(len(points) - 1):
        beam(f"BowLimb_{index}", points[index], points[index + 1], 0.075 if mythic else 0.06, primary)
    beam("BowString", points[0] + Vector((0.0, 0.045, 0.0)), points[-1] + Vector((0.0, 0.045, 0.0)), 0.016, accent)
    cube("BowGrip", (-0.44, 0.0, 0.0), (0.10, 0.10, 0.30), grip, bevel=0.06)
    if rarity != "common":
        sphere("BowGem", (-0.50, -0.05, 0.0), (0.11, 0.07, 0.11), accent, ico=True)
    if mythic:
        sphere("BowCometTop", (-0.04, 0.0, 1.25), (0.14, 0.08, 0.14), accent, ico=True)
        sphere("BowCometBottom", (-0.04, 0.0, -1.25), (0.14, 0.08, 0.14), accent, ico=True)


def build_shield(rarity: str) -> None:
    primary, accent, grip = weapon_materials(rarity)
    mythic = rarity == "mythic"
    bpy.ops.mesh.primitive_cylinder_add(vertices=10 if mythic else 8, radius=1.0, depth=0.20, location=(0.0, 0.0, 0.25), rotation=(math.pi / 2, 0.0, 0.0))
    body = bpy.context.active_object
    body.name = "ShieldBody"
    body.scale = (0.86 if mythic else 0.75, 1.0, 1.05 if mythic else 0.90)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish(body, primary)
    torus("ShieldRim", (0.0, -0.12, 0.25), 0.72 if mythic else 0.64, 0.07, accent, rotation=(math.pi / 2, 0, 0))
    sphere("ShieldBoss", (0.0, -0.18, 0.25), (0.24, 0.10, 0.24), accent, ico=True)
    if mythic:
        for angle in (0, math.pi / 2, math.pi, math.pi * 1.5):
            x = math.cos(angle) * 0.52
            z = 0.25 + math.sin(angle) * 0.52
            sphere(f"ShieldRay_{angle}", (x, -0.17, z), (0.10, 0.05, 0.10), accent, ico=True)


def build_wand(rarity: str) -> None:
    primary, accent, grip = weapon_materials(rarity)
    mythic = rarity == "mythic"
    cylinder("WandShaft", (0.0, 0.0, 0.15), 0.08 if mythic else 0.065, 1.75 if mythic else 1.55, grip, vertices=10)
    top_z = 1.20 if mythic else 1.02
    sphere("WandCore", (0.0, 0.0, top_z), (0.30 if mythic else 0.23, 0.22, 0.30 if mythic else 0.23), accent, ico=True)
    if rarity == "rare":
        sphere("WandMoonCap", (0.0, 0.0, top_z + 0.25), (0.34, 0.16, 0.16), primary)
    elif mythic:
        torus("WandSunRing", (0.0, 0.0, top_z), 0.42, 0.045, primary, rotation=(math.pi / 2, 0, 0))
        for i in range(6):
            angle = math.tau * i / 6
            sphere(
                f"WandSunRay_{i}",
                (math.cos(angle) * 0.47, 0.0, top_z + math.sin(angle) * 0.47),
                (0.08, 0.06, 0.08),
                accent,
                ico=True,
            )
    else:
        sphere("WandWoodKnob", (0.0, 0.0, top_z + 0.18), (0.14, 0.12, 0.14), primary, ico=True)


def build_dagger(rarity: str) -> None:
    primary, accent, grip = weapon_materials(rarity)
    mythic = rarity == "mythic"
    for side in (-1, 1):
        x = side * 0.32
        rot = side * 0.13
        cube(f"DaggerBlade_{side}", (x, 0.0, 0.50), (0.12 if not mythic else 0.16, 0.06, 0.56 if not mythic else 0.66), primary, rotation=(0.0, rot, 0.0), bevel=0.05)
        cube(f"DaggerGuard_{side}", (x, 0.0, -0.08), (0.25, 0.08, 0.07), accent, rotation=(0.0, rot, 0.0), bevel=0.05)
        cube(f"DaggerGrip_{side}", (x, 0.0, -0.34), (0.08, 0.07, 0.24), grip, rotation=(0.0, rot, 0.0), bevel=0.04)
    if rarity != "common":
        sphere("DaggerCenterGem", (0.0, -0.06, 0.0), (0.11, 0.06, 0.11), accent, ico=True)


def build_gun(rarity: str) -> None:
    primary, accent, grip = weapon_materials(rarity)
    mythic = rarity == "mythic"
    cube("GunBody", (0.0, 0.0, 0.25), (0.58 if mythic else 0.50, 0.18, 0.24), primary, bevel=0.10)
    cube("GunBarrel", (0.66 if mythic else 0.58, 0.0, 0.30), (0.36 if mythic else 0.28, 0.11, 0.11), accent, bevel=0.06)
    grip_obj = cube("GunGrip", (-0.20, 0.0, -0.18), (0.16, 0.14, 0.35), grip, rotation=(0.0, -0.28, 0.0), bevel=0.06)
    cube("GunStock", (-0.65 if mythic else -0.53, 0.0, 0.25), (0.24, 0.14, 0.18), grip, bevel=0.08)
    if rarity != "common":
        cube("GunSight", (0.02, 0.0, 0.56), (0.22, 0.10, 0.08), accent, bevel=0.05)
    if mythic:
        torus("GunNovaRing", (0.72, 0.0, 0.30), 0.24, 0.045, accent, rotation=(0.0, math.pi / 2, 0.0))
        sphere("GunNovaCore", (0.15, -0.20, 0.27), (0.13, 0.08, 0.13), accent, ico=True)


def build_weapon(family: str, rarity: str) -> None:
    builders = {
        "sword": build_sword,
        "bow": build_bow,
        "shield": build_shield,
        "wand": build_wand,
        "dagger": build_dagger,
        "gun": build_gun,
    }
    builders[family](rarity)


def export_glb(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
    )


def slug_for(definition_id: str) -> str:
    return definition_id.rsplit(".", 1)[-1]


def main() -> None:
    options = parse_args()
    clear_scene()
    build_forge_environment()
    export_glb(Path(options.environment_output).resolve())
    print(f"Exported Forge environment -> {options.environment_output}")

    output_dir = Path(options.weapon_output_dir).resolve()
    for definition_id, family, rarity in WEAPONS:
        clear_scene()
        build_weapon(family, rarity)
        output = output_dir / f"{slug_for(definition_id)}.glb"
        export_glb(output)
        print(f"Exported {definition_id} -> {output}")


if __name__ == "__main__":
    main()
