from __future__ import annotations

from dataclasses import dataclass
import math

import bpy

from ..common.materials import make_face_material, make_material
from ..common.primitives import create_ellipsoid, create_empty


@dataclass(frozen=True)
class DragonDefinition:
    slug: str
    profile: str
    body_color: tuple[float, float, float, float]
    accent_color: tuple[float, float, float, float]
    trim_color: tuple[float, float, float, float]


def _roots():
    root = bpy.data.objects.new("EnemyRoot", None)
    bpy.context.scene.collection.objects.link(root)
    body = bpy.data.objects.new("BodyRoot", None)
    bpy.context.scene.collection.objects.link(body)
    body.parent = root
    face = bpy.data.objects.new("FaceRoot", None)
    bpy.context.scene.collection.objects.link(face)
    face.parent = root
    return root, body, face


def _face(
    face: bpy.types.Object,
    *,
    front_y: float,
    eye_z: float,
    eye_gap: float,
    face_material: bpy.types.Material,
    mouth_material: bpy.types.Material,
    cheek_material: bpy.types.Material,
    eye_scale: float = 1.0,
    cheeks: bool = True,
):
    for name, x in (("Eye_L", -eye_gap), ("Eye_R", eye_gap)):
        create_ellipsoid(
            name,
            (x, front_y, eye_z),
            (0.024 * eye_scale, 0.010, 0.028 * eye_scale),
            face_material,
            face,
            segments=14,
            rings=10,
        )
    create_ellipsoid(
        "Mouth",
        (0.0, front_y - 0.005, eye_z - 0.060),
        (0.016, 0.008, 0.009),
        mouth_material,
        face,
        segments=12,
        rings=8,
    )
    if cheeks:
        for name, x in (("Cheek_L", -eye_gap * 1.55), ("Cheek_R", eye_gap * 1.55)):
            create_ellipsoid(
                name,
                (x, front_y - 0.003, eye_z - 0.032),
                (0.020, 0.007, 0.010),
                cheek_material,
                face,
                segments=12,
                rings=8,
            )


def _cone(
    name: str,
    location: tuple[float, float, float],
    radius1: float,
    radius2: float,
    depth: float,
    material: bpy.types.Material,
    parent: bpy.types.Object,
    *,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
    vertices: int = 12,
    scale_y: float = 1.0,
    bevel: float = 0.018,
):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius1, radius2=radius2, depth=depth)
    obj = bpy.context.active_object
    assert obj is not None
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    obj.scale.y = scale_y
    obj.data.materials.append(material)
    if bevel > 0:
        mod = obj.modifiers.new(f"{name}SoftBevel", "BEVEL")
        mod.width = bevel
        mod.segments = 3
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def _torus(
    name: str,
    location: tuple[float, float, float],
    major_radius: float,
    minor_radius: float,
    material: bpy.types.Material,
    parent: bpy.types.Object,
    *,
    rotation=(0.0, 0.0, 0.0),
):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=28,
        minor_segments=8,
    )
    obj = bpy.context.active_object
    assert obj is not None
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def _star_prism(
    name: str,
    location: tuple[float, float, float],
    radius_outer: float,
    radius_inner: float,
    depth_y: float,
    material: bpy.types.Material,
    parent: bpy.types.Object,
    *,
    points: int = 5,
    rotation_z: float = 0.0,
):
    verts = []
    faces = []
    for y in (-depth_y / 2, depth_y / 2):
        for i in range(points * 2):
            angle = rotation_z + math.pi / 2 + i * math.pi / points
            radius = radius_outer if i % 2 == 0 else radius_inner
            verts.append((math.cos(angle) * radius, y, math.sin(angle) * radius))
    count = points * 2
    faces.append(tuple(range(count)))
    faces.append(tuple(range(count, count * 2)))
    for i in range(count):
        j = (i + 1) % count
        faces.append((i, j, count + j, count + i))

    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    obj.data.materials.append(material)
    bevel = obj.modifiers.new(f"{name}SoftBevel", "BEVEL")
    bevel.width = min(0.018, radius_outer * 0.10)
    bevel.segments = 3
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    return obj


def _wing_plate(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material: bpy.types.Material,
    parent: bpy.types.Object,
    *,
    angle_z: float,
):
    wing = create_ellipsoid(name, location, scale, material, parent, segments=20, rings=12)
    wing.rotation_euler.z = angle_z
    return wing


def build_enemy(d: DragonDefinition):
    root, body, face = _roots()

    body_mat = make_material("DragonBody", d.body_color, roughness=0.86, metallic=0.01, coat_weight=0.02)
    accent_mat = make_material("DragonAccent", d.accent_color, roughness=0.78, metallic=0.02, coat_weight=0.03)
    trim_mat = make_material("DragonTrim", d.trim_color, roughness=0.62, metallic=0.05, coat_weight=0.04)
    dark = tuple(max(0.0, c * 0.50) for c in d.body_color[:3]) + (1.0,)
    dark_mat = make_material("DragonDark", dark, roughness=0.95, metallic=0.0, coat_weight=0.0)
    shell_mat = make_material("EggShell", (0.72, 0.70, 0.64, 1.0), roughness=0.96, metallic=0.0, coat_weight=0.0)
    glow_mat = make_material("StarGlow", (0.50, 0.40, 0.78, 1.0), roughness=0.42, metallic=0.02, coat_weight=0.02)
    glow_mat.use_nodes = True
    bsdf = glow_mat.node_tree.nodes.get("Principled BSDF") if glow_mat.node_tree else None
    if bsdf:
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (0.34, 0.22, 0.74, 1.0)
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = 1.1

    face_mat = make_face_material("DragonFace", (0.045, 0.045, 0.060, 1.0))
    mouth_mat = make_face_material("DragonMouth", (0.15, 0.09, 0.11, 1.0))
    cheek_mat = make_face_material("DragonCheek", (0.68, 0.34, 0.42, 1.0))

    attack_origin = (0.0, -0.46, 0.48)
    effect_origin = (0.0, -0.42, 0.40)

    if d.profile == "egg-dragon":
        create_ellipsoid("Body", (0.0, 0.035, 0.265), (0.255, 0.215, 0.215), body_mat, body, segments=22, rings=14)
        create_ellipsoid("Belly", (0.0, -0.175, 0.240), (0.150, 0.045, 0.125), accent_mat, body, segments=18, rings=10)
        for name, x in (("FootPad_L", -0.135), ("FootPad_R", 0.135)):
            create_ellipsoid(name, (x, -0.015, 0.070), (0.085, 0.100, 0.050), dark_mat, body, segments=14, rings=8)

        head = create_empty("HeadRoot", body, (0.0, 0.000, 0.650))
        create_ellipsoid("Head", (0.0, 0.0, 0.0), (0.310, 0.290, 0.300), body_mat, head, segments=28, rings=18)
        _cone("Horn_L", (-0.155, 0.040, 0.265), 0.045, 0.010, 0.105, trim_mat, head, rotation=(0.0, -0.12, 0.18), vertices=8, bevel=0.010)
        _cone("Horn_R", (0.155, 0.040, 0.265), 0.045, 0.010, 0.105, trim_mat, head, rotation=(0.0, 0.12, -0.18), vertices=8, bevel=0.010)
        face.parent = head
        _face(face, front_y=-0.302, eye_z=0.010, eye_gap=0.067, face_material=face_mat, mouth_material=mouth_mat, cheek_material=cheek_mat, eye_scale=0.90)

        throat = create_empty("ThroatRoot", head, (0.0, -0.245, -0.110))
        create_ellipsoid("ThroatPuff", (0.0, 0.0, 0.0), (0.115, 0.050, 0.080), accent_mat, throat, segments=16, rings=10)

        shell = create_empty("ShellRoot", body, (0.0, 0.035, 0.215))
        ring = _torus("EggShellRing", (0.0, 0.0, 0.0), 0.650, 0.050, shell_mat, shell)
        ring.scale.y = 0.72
        for index, angle in enumerate((-0.82, 0.0, 0.82), start=1):
            x = math.sin(angle) * 0.255
            z = 0.070 + math.cos(angle) * 0.035
            shard = _cone(f"ShellCrown_{index}", (x, -0.020, z), 0.070, 0.030, 0.115, shell_mat, shell, vertices=6, bevel=0.010)
            shard.rotation_euler.y = -angle * 0.20
        attack_origin = (0.0, -0.54, 0.58)

    elif d.profile == "tiny-wing-dragon":
        create_ellipsoid("Body", (0.0, 0.030, 0.250), (0.215, 0.200, 0.205), body_mat, body, segments=22, rings=14)
        create_ellipsoid("Belly", (0.0, -0.175, 0.235), (0.145, 0.045, 0.120), accent_mat, body, segments=18, rings=10)
        for name, x in (("FootPad_L", -0.130), ("FootPad_R", 0.130)):
            create_ellipsoid(name, (x, -0.015, 0.060), (0.080, 0.095, 0.048), dark_mat, body, segments=14, rings=8)

        head = create_empty("HeadRoot", body, (0.0, 0.000, 0.690))
        create_ellipsoid("Head", (0.0, 0.0, 0.0), (0.310, 0.295, 0.360), body_mat, head, segments=28, rings=18)
        _cone("Horn_L", (-0.165, 0.050, 0.300), 0.040, 0.010, 0.095, trim_mat, head, rotation=(0.0, -0.10, 0.16), vertices=8, bevel=0.010)
        _cone("Horn_R", (0.165, 0.050, 0.300), 0.040, 0.010, 0.095, trim_mat, head, rotation=(0.0, 0.10, -0.16), vertices=8, bevel=0.010)
        face.parent = head
        _face(face, front_y=-0.317, eye_z=0.000, eye_gap=0.073, face_material=face_mat, mouth_material=mouth_mat, cheek_material=cheek_mat, eye_scale=0.90)

        wings = create_empty("WingPairRoot", body, (0.0, 0.135, 0.355))
        _wing_plate("Wing_L", (-0.285, 0.0, 0.0), (0.065, 0.048, 0.110), accent_mat, wings, angle_z=0.45)
        _wing_plate("Wing_R", (0.285, 0.0, 0.0), (0.065, 0.048, 0.110), accent_mat, wings, angle_z=-0.45)

        tail = create_empty("TailRoot", body, (0.180, 0.105, 0.230))
        tail_obj = create_ellipsoid("Tail", (0.130, 0.0, -0.020), (0.145, 0.075, 0.065), accent_mat, tail, segments=18, rings=10)
        tail_obj.rotation_euler.z = -0.18
        attack_origin = (0.0, -0.48, 0.54)

    elif d.profile == "star-eater-lizard":
        create_ellipsoid("Body", (0.0, 0.035, 0.220), (0.455, 0.240, 0.180), body_mat, body, segments=26, rings=15)
        create_ellipsoid("Belly", (0.0, -0.205, 0.205), (0.265, 0.045, 0.100), accent_mat, body, segments=20, rings=11)
        for name, x, y in (
            ("FootPad_FL", -0.250, -0.060),
            ("FootPad_FR", 0.250, -0.060),
            ("FootPad_BL", -0.235, 0.125),
            ("FootPad_BR", 0.235, 0.125),
        ):
            create_ellipsoid(name, (x, y, 0.060), (0.095, 0.085, 0.045), dark_mat, body, segments=14, rings=8)

        head = create_empty("HeadRoot", body, (-0.390, -0.015, 0.310))
        create_ellipsoid("Head", (0.0, 0.0, 0.0), (0.235, 0.225, 0.195), body_mat, head, segments=22, rings=13)
        face.parent = head
        _face(face, front_y=-0.228, eye_z=0.030, eye_gap=0.055, face_material=face_mat, mouth_material=mouth_mat, cheek_material=cheek_mat, eye_scale=0.78, cheeks=False)

        star_root = create_empty("PrimaryRoot", body, (0.080, 0.080, 0.480))
        glow_root = create_empty("GlowRoot", star_root, (0.0, 0.0, 0.0))
        _star_prism("BackStar", (0.0, 0.0, 0.0), 0.190, 0.090, 0.090, glow_mat, glow_root, rotation_z=math.radians(8))

        tail = create_empty("TailRoot", body, (0.350, 0.080, 0.220))
        tail_obj = create_ellipsoid("Tail", (0.150, 0.0, -0.020), (0.220, 0.090, 0.065), accent_mat, tail, segments=20, rings=11)
        tail_obj.rotation_euler.z = -0.16
        attack_origin = (-0.34, -0.48, 0.34)

    elif d.profile == "meteor-hatchling":
        create_ellipsoid("Body", (0.0, 0.030, 0.255), (0.235, 0.210, 0.245), body_mat, body, segments=22, rings=14)
        create_ellipsoid("Belly", (0.0, -0.190, 0.235), (0.155, 0.045, 0.125), accent_mat, body, segments=18, rings=10)
        for name, x in (("FootPad_L", -0.135), ("FootPad_R", 0.135)):
            create_ellipsoid(name, (x, -0.015, 0.060), (0.082, 0.095, 0.048), dark_mat, body, segments=14, rings=8)

        head = create_empty("HeadRoot", body, (0.0, 0.000, 0.610))
        create_ellipsoid("Head", (0.0, 0.0, 0.0), (0.300, 0.285, 0.340), body_mat, head, segments=26, rings=16)
        _cone("Horn_L", (-0.145, 0.050, 0.300), 0.035, 0.008, 0.085, trim_mat, head, rotation=(0.0, -0.10, 0.14), vertices=8, bevel=0.009)
        _cone("Horn_R", (0.145, 0.050, 0.300), 0.035, 0.008, 0.085, trim_mat, head, rotation=(0.0, 0.10, -0.14), vertices=8, bevel=0.009)
        face.parent = head
        _face(face, front_y=-0.302, eye_z=0.000, eye_gap=0.064, face_material=face_mat, mouth_material=mouth_mat, cheek_material=cheek_mat, eye_scale=0.88)

        glow_root = create_empty("GlowRoot", body, (0.0, 0.050, 0.500))
        primary = create_empty("PrimaryRoot", glow_root, (0.0, 0.0, 0.0))
        secondary = create_empty("SecondaryRoot", glow_root, (0.0, 0.0, 0.0))
        _star_prism("StarMote_L", (-0.580, 0.0, 0.340), 0.090, 0.043, 0.045, glow_mat, primary, rotation_z=0.0)
        _star_prism("StarMote_R", (0.580, 0.0, 0.050), 0.090, 0.043, 0.045, glow_mat, secondary, rotation_z=math.radians(18))
        attack_origin = (0.0, -0.50, 0.62)

    elif d.profile == "star-eater-dragon":
        wings = create_empty("WingPairRoot", body, (0.0, 0.135, 0.520))
        _wing_plate("Wing_L", (-0.555, 0.0, 0.000), (0.455, 0.090, 0.310), accent_mat, wings, angle_z=0.28)
        _wing_plate("Wing_R", (0.555, 0.0, 0.000), (0.455, 0.090, 0.310), accent_mat, wings, angle_z=-0.28)
        _wing_plate("WingTip_L", (-0.840, 0.0, -0.150), (0.220, 0.075, 0.170), body_mat, wings, angle_z=0.55)
        _wing_plate("WingTip_R", (0.840, 0.0, -0.150), (0.220, 0.075, 0.170), body_mat, wings, angle_z=-0.55)

        create_ellipsoid("Body", (0.0, 0.025, 0.360), (0.390, 0.300, 0.300), body_mat, body, segments=26, rings=16)
        create_ellipsoid("Belly", (0.0, -0.265, 0.330), (0.220, 0.050, 0.170), accent_mat, body, segments=20, rings=11)
        for name, x in (("FootPad_L", -0.190), ("FootPad_R", 0.190)):
            create_ellipsoid(name, (x, -0.030, 0.085), (0.125, 0.125, 0.065), dark_mat, body, segments=16, rings=9)

        head = create_empty("HeadRoot", body, (0.0, -0.010, 1.045))
        create_ellipsoid("Head", (0.0, 0.0, 0.0), (0.545, 0.405, 0.410), body_mat, head, segments=30, rings=18)
        _cone("Horn_L", (-0.280, 0.065, 0.350), 0.070, 0.014, 0.180, trim_mat, head, rotation=(0.0, -0.12, 0.18), vertices=8, bevel=0.014)
        _cone("Horn_R", (0.280, 0.065, 0.350), 0.070, 0.014, 0.180, trim_mat, head, rotation=(0.0, 0.12, -0.18), vertices=8, bevel=0.014)
        face.parent = head
        _face(face, front_y=-0.410, eye_z=0.010, eye_gap=0.110, face_material=face_mat, mouth_material=mouth_mat, cheek_material=cheek_mat, eye_scale=1.00)

        glow_root = create_empty("GlowRoot", body, (0.0, -0.285, 0.510))
        _star_prism("ChestStar", (0.0, 0.0, 0.0), 0.135, 0.062, 0.045, glow_mat, glow_root, rotation_z=math.radians(18))

        tail = create_empty("TailRoot", body, (0.360, 0.145, 0.310))
        tail_obj = create_ellipsoid("Tail", (0.260, 0.0, -0.050), (0.355, 0.105, 0.090), accent_mat, tail, segments=22, rings=12)
        tail_obj.rotation_euler.z = -0.18
        attack_origin = (0.0, -0.68, 0.72)
        effect_origin = (0.0, -0.70, 0.30)

    else:
        raise ValueError(f"Unknown dragon enemy profile: {d.profile}")

    create_empty("AttackOrigin", root, attack_origin)
    create_empty("EffectOrigin", root, effect_origin)
    create_empty("GroundOrigin", root, (0.0, 0.0, 0.0))
    return root


DEFINITION_TYPE = DragonDefinition
