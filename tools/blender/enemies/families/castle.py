from __future__ import annotations

from dataclasses import dataclass
import math

import bpy

from ..common.materials import make_face_material, make_material
from ..common.primitives import create_ellipsoid, create_empty


@dataclass(frozen=True)
class CastleDefinition:
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
        for name, x in (("Cheek_L", -eye_gap * 1.58), ("Cheek_R", eye_gap * 1.58)):
            create_ellipsoid(
                name,
                (x, front_y - 0.003, eye_z - 0.034),
                (0.021, 0.007, 0.010),
                cheek_material,
                face,
                segments=12,
                rings=8,
            )


def _cylinder(
    name: str,
    location: tuple[float, float, float],
    radius: float,
    depth: float,
    material: bpy.types.Material,
    parent: bpy.types.Object,
    *,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
    vertices: int = 12,
    bevel: float = 0.018,
):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth)
    obj = bpy.context.active_object
    assert obj is not None
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    obj.data.materials.append(material)
    if bevel > 0:
        modifier = obj.modifiers.new(f"{name}SoftBevel", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


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
    bevel: float = 0.020,
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
        modifier = obj.modifiers.new(f"{name}SoftBevel", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
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
    rotation: tuple[float, float, float] = (math.pi / 2, 0.0, 0.0),
):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=24,
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


def _crescent(name: str, parent: bpy.types.Object, material: bpy.types.Material, location=(0.0, 0.0, 0.0)):
    curve = bpy.data.curves.new(f"{name}Curve", "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = 0.025
    curve.bevel_resolution = 3
    spline = curve.splines.new("POLY")
    points = 14
    spline.points.add(points - 1)
    for index in range(points):
        angle = math.radians(45 + index * (270 / (points - 1)))
        x = math.cos(angle) * 0.115
        z = math.sin(angle) * 0.145
        spline.points[index].co = (x, 0.0, z, 1.0)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    obj.data.materials.append(material)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj.select_set(False)
    return obj


def build_enemy(d: CastleDefinition):
    root, body, face = _roots()

    body_mat = make_material("CastleBody", d.body_color, roughness=0.86, metallic=0.02, coat_weight=0.02)
    accent_mat = make_material("CastleAccent", d.accent_color, roughness=0.74, metallic=0.08, coat_weight=0.03)
    trim_mat = make_material("CastleTrim", d.trim_color, roughness=0.62, metallic=0.14, coat_weight=0.05)
    dark = tuple(max(0.0, c * 0.54) for c in d.body_color[:3]) + (1.0,)
    dark_mat = make_material("CastleDark", dark, roughness=0.94, metallic=0.01, coat_weight=0.0)
    face_mat = make_face_material("CastleFace", (0.045, 0.048, 0.065, 1.0))
    mouth_mat = make_face_material("CastleMouth", (0.13, 0.10, 0.13, 1.0))
    cheek_mat = make_face_material("CastleCheek", (0.68, 0.38, 0.46, 1.0))

    attack_origin = (0.0, -0.44, 0.36)
    effect_origin = (0.0, -0.42, 0.42)

    if d.profile == "round-sentry":
        create_ellipsoid("Body", (0.0, 0.035, 0.205), (0.190, 0.195, 0.150), body_mat, body, segments=22, rings=14)
        create_ellipsoid("BodyBase", (0.0, 0.055, 0.085), (0.155, 0.165, 0.070), dark_mat, body, segments=18, rings=10)
        for name, x in (("ToyFoot_L", -0.135), ("ToyFoot_R", 0.135)):
            create_ellipsoid(name, (x, -0.030, 0.048), (0.090, 0.105, 0.045), dark_mat, body, segments=14, rings=8)

        head = create_empty("HeadRoot", body, (0.0, 0.005, 0.555))
        create_ellipsoid("Helmet", (0.0, 0.0, 0.0), (0.285, 0.295, 0.300), accent_mat, head, segments=28, rings=18)
        create_ellipsoid("HelmetRim", (0.0, -0.275, -0.120), (0.270, 0.050, 0.066), trim_mat, head, segments=20, rings=10)
        create_ellipsoid("HelmetBadge", (0.0, -0.298, 0.125), (0.055, 0.018, 0.065), trim_mat, head, segments=14, rings=8)
        face.parent = head
        _face(
            face,
            front_y=-0.302,
            eye_z=-0.015,
            eye_gap=0.076,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
            eye_scale=0.92,
        )

        spear = create_empty("PrimaryRoot", body, (0.430, -0.015, 0.325))
        spear.rotation_euler.y = -0.33
        _cylinder("SpearShaft", (0.0, 0.0, 0.120), 0.030, 0.570, dark_mat, spear, rotation=(0.0, 0.0, -0.08), bevel=0.010)
        _cone("SpearTip", (0.0, 0.0, 0.438), 0.065, 0.0, 0.135, trim_mat, spear, rotation=(0.0, 0.0, -0.08), vertices=8, bevel=0.012)
        attack_origin = (0.48, -0.40, 0.50)

    elif d.profile == "shield-sentry":
        create_ellipsoid("Body", (0.0, 0.070, 0.260), (0.235, 0.190, 0.210), body_mat, body, segments=22, rings=14)
        create_ellipsoid("BodyBase", (0.0, 0.085, 0.080), (0.195, 0.165, 0.070), dark_mat, body, segments=18, rings=10)
        for name, x in (("ToyFoot_L", -0.130), ("ToyFoot_R", 0.130)):
            create_ellipsoid(name, (x, 0.020, 0.045), (0.085, 0.095, 0.043), dark_mat, body, segments=14, rings=8)

        head = create_empty("HeadRoot", body, (0.0, 0.020, 0.675))
        create_ellipsoid("Helmet", (0.0, 0.0, 0.0), (0.260, 0.245, 0.225), accent_mat, head, segments=24, rings=14)
        create_ellipsoid("HelmetRim", (0.0, -0.220, -0.075), (0.245, 0.042, 0.055), trim_mat, head, segments=18, rings=9)
        create_ellipsoid("HelmetBadge", (0.0, -0.242, 0.090), (0.045, 0.015, 0.052), trim_mat, head, segments=12, rings=8)
        face.parent = head
        _face(
            face,
            front_y=-0.246,
            eye_z=-0.005,
            eye_gap=0.060,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
            eye_scale=0.86,
            cheeks=False,
        )

        shield = create_empty("ShellRoot", body, (0.0, -0.285, 0.350))
        create_ellipsoid("RoundShield", (0.0, 0.0, 0.0), (0.620, 0.060, 0.335), accent_mat, shield, segments=28, rings=18)
        shield_rim = _torus("ShieldRim", (0.0, -0.030, 0.0), 0.515, 0.040, trim_mat, shield)
        shield_rim.scale.y = 0.58
        create_ellipsoid("ShieldBoss", (0.0, -0.070, 0.0), (0.105, 0.055, 0.105), trim_mat, shield, segments=16, rings=10)
        attack_origin = (0.0, -0.66, 0.37)

    elif d.profile == "bell-mage":
        bell = create_empty("PrimaryRoot", body, (0.0, 0.010, 0.440))
        _cone("BellBody", (0.0, 0.0, -0.010), 0.350, 0.135, 0.640, accent_mat, bell, vertices=16, scale_y=0.88, bevel=0.030)
        create_ellipsoid("BellCrown", (0.0, 0.010, 0.285), (0.150, 0.145, 0.100), body_mat, bell, segments=20, rings=12)
        _torus("BellRim", (0.0, -0.010, -0.325), 0.300, 0.030, trim_mat, bell)
        create_ellipsoid("BellCollar", (0.0, -0.210, 0.180), (0.120, 0.035, 0.050), trim_mat, bell, segments=16, rings=9)

        clapper = create_empty("SecondaryRoot", bell, (0.0, -0.010, -0.385))
        _cylinder("ClapperStem", (0.0, 0.0, -0.055), 0.022, 0.120, dark_mat, clapper, bevel=0.008)
        create_ellipsoid("Clapper", (0.0, 0.0, -0.140), (0.070, 0.062, 0.070), trim_mat, clapper, segments=14, rings=8)
        face.parent = bell
        _face(
            face,
            front_y=-0.285,
            eye_z=0.045,
            eye_gap=0.072,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
            eye_scale=0.86,
        )
        attack_origin = (0.0, -0.48, 0.44)

    elif d.profile == "windup-bat":
        create_ellipsoid("Body", (0.0, 0.010, 0.310), (0.235, 0.190, 0.205), body_mat, body, segments=22, rings=14)
        create_ellipsoid("Belly", (0.0, -0.175, 0.285), (0.150, 0.045, 0.115), accent_mat, body, segments=18, rings=10)
        for name, x in (("Ear_L", -0.120), ("Ear_R", 0.120)):
            ear = _cone(name, (x, -0.005, 0.535), 0.070, 0.015, 0.160, accent_mat, body, vertices=8, bevel=0.012)
            ear.rotation_euler.y = (-0.18 if x < 0 else 0.18)

        wing_pair = create_empty("WingPairRoot", body, (0.0, 0.050, 0.330))
        create_ellipsoid("Wing_L", (-0.420, 0.0, 0.005), (0.340, 0.095, 0.235), accent_mat, wing_pair, segments=20, rings=12)
        create_ellipsoid("Wing_R", (0.420, 0.0, 0.005), (0.340, 0.095, 0.235), accent_mat, wing_pair, segments=20, rings=12)
        create_ellipsoid("WingTip_L", (-0.680, 0.010, -0.115), (0.150, 0.080, 0.120), body_mat, wing_pair, segments=16, rings=9)
        create_ellipsoid("WingTip_R", (0.680, 0.010, -0.115), (0.150, 0.080, 0.120), body_mat, wing_pair, segments=16, rings=9)

        key = create_empty("TailRoot", body, (0.285, 0.095, 0.410))
        _cylinder("KeyStem", (0.0, 0.0, 0.120), 0.025, 0.260, trim_mat, key, bevel=0.008)
        _cylinder("KeyBar", (0.0, 0.0, 0.260), 0.030, 0.310, trim_mat, key, rotation=(0.0, math.pi / 2, 0.0), bevel=0.010)
        create_ellipsoid("KeyKnob_L", (-0.170, 0.0, 0.260), (0.065, 0.050, 0.060), trim_mat, key, segments=14, rings=8)
        create_ellipsoid("KeyKnob_R", (0.170, 0.0, 0.260), (0.065, 0.050, 0.060), trim_mat, key, segments=14, rings=8)

        _face(
            face,
            front_y=-0.195,
            eye_z=0.330,
            eye_gap=0.062,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
            eye_scale=0.82,
            cheeks=False,
        )
        attack_origin = (0.0, -0.42, 0.31)

    elif d.profile == "moon-knight":
        cape = create_empty("TailRoot", body, (0.0, 0.145, 0.325))
        _cone("Cape", (0.0, 0.0, -0.010), 0.750, 0.210, 0.500, accent_mat, cape, vertices=18, scale_y=0.42, bevel=0.035)
        create_ellipsoid("CapeClasp_L", (-0.220, -0.135, 0.255), (0.075, 0.045, 0.075), trim_mat, cape, segments=14, rings=8)
        create_ellipsoid("CapeClasp_R", (0.220, -0.135, 0.255), (0.075, 0.045, 0.075), trim_mat, cape, segments=14, rings=8)

        create_ellipsoid("Body", (0.0, 0.020, 0.355), (0.300, 0.250, 0.260), body_mat, body, segments=24, rings=15)
        create_ellipsoid("BodyBase", (0.0, 0.055, 0.125), (0.270, 0.220, 0.095), dark_mat, body, segments=20, rings=11)
        create_ellipsoid("Mantle_L", (-0.290, 0.040, 0.485), (0.130, 0.155, 0.120), trim_mat, body, segments=16, rings=9)
        create_ellipsoid("Mantle_R", (0.290, 0.040, 0.485), (0.130, 0.155, 0.120), trim_mat, body, segments=16, rings=9)

        head = create_empty("HeadRoot", body, (0.0, 0.000, 0.960))
        create_ellipsoid("Helmet", (0.0, 0.0, 0.0), (0.465, 0.350, 0.365), accent_mat, head, segments=30, rings=18)
        create_ellipsoid("HelmetRim", (0.0, -0.325, -0.125), (0.440, 0.055, 0.080), trim_mat, head, segments=22, rings=12)
        create_ellipsoid("HelmetLug_L", (-0.390, 0.010, 0.020), (0.095, 0.110, 0.120), dark_mat, head, segments=16, rings=9)
        create_ellipsoid("HelmetLug_R", (0.390, 0.010, 0.020), (0.095, 0.110, 0.120), dark_mat, head, segments=16, rings=9)
        _crescent("CrownCrescent", head, trim_mat, location=(0.0, -0.015, 0.430))
        face.parent = head
        _face(
            face,
            front_y=-0.350,
            eye_z=-0.020,
            eye_gap=0.092,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
            eye_scale=0.95,
        )

        weapon = create_empty("PrimaryRoot", body, (0.920, -0.030, 0.420))
        _cylinder("BladeGrip", (0.0, 0.0, 0.000), 0.035, 0.230, dark_mat, weapon, bevel=0.010)
        blade = create_ellipsoid("MoonBlade", (0.0, 0.0, 0.265), (0.095, 0.050, 0.300), trim_mat, weapon, segments=18, rings=10)
        blade.rotation_euler.z = -0.10

        attack_origin = (0.92, -0.50, 0.58)
        effect_origin = (0.0, -0.58, 0.52)

    else:
        raise ValueError(f"Unknown castle enemy profile: {d.profile}")

    create_empty("AttackOrigin", root, attack_origin)
    create_empty("EffectOrigin", root, effect_origin)
    create_empty("GroundOrigin", root, (0.0, 0.0, 0.0))
    return root


DEFINITION_TYPE = CastleDefinition
