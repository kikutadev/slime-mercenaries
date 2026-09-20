from __future__ import annotations

from dataclasses import dataclass
import math

import bpy

from ..common.materials import make_face_material, make_material
from ..common.primitives import create_ellipsoid, create_empty


@dataclass(frozen=True)
class EmberDefinition:
    slug: str
    profile: str
    body_color: tuple[float, float, float, float]
    accent_color: tuple[float, float, float, float]
    ember_color: tuple[float, float, float, float]


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


def _glow_material(name: str, color: tuple[float, float, float, float], strength: float = 1.0):
    material = make_material(name, color, roughness=0.34, coat_weight=0.06)
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf is not None:
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = color
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = strength
    return material


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
            (0.024 * eye_scale, 0.010, 0.029 * eye_scale),
            face_material,
            face,
            segments=14,
            rings=10,
        )
    create_ellipsoid(
        "Mouth",
        (0.0, front_y - 0.006, eye_z - 0.066),
        (0.017, 0.008, 0.009),
        mouth_material,
        face,
        segments=12,
        rings=8,
    )
    if cheeks:
        for name, x in (("Cheek_L", -eye_gap * 1.55), ("Cheek_R", eye_gap * 1.55)):
            create_ellipsoid(
                name,
                (x, front_y - 0.002, eye_z - 0.038),
                (0.022, 0.007, 0.011),
                cheek_material,
                face,
                segments=12,
                rings=8,
            )


def _flame_tip(parent, material):
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.075, radius2=0.026, depth=0.12)
    flame = bpy.context.active_object
    assert flame is not None
    flame.name = "FlameTip"
    flame.parent = parent
    flame.location = (0.0, 0.0, 0.0)
    flame.scale = (1.0, 0.86, 1.0)
    flame.rotation_euler = (0.0, 0.20, -0.20)
    flame.data.materials.append(material)
    bevel = flame.modifiers.new("FlameSoftBevel", "BEVEL")
    bevel.width = 0.025
    bevel.segments = 3
    for polygon in flame.data.polygons:
        polygon.use_smooth = True
    return flame


def build_enemy(d: EmberDefinition):
    root, body, face = _roots()

    body_mat = make_material("EmberBody", d.body_color, roughness=0.90, coat_weight=0.01)
    dark = tuple(max(0.0, c * 0.72) for c in d.body_color[:3]) + (1.0,)
    dark_mat = make_material("EmberDark", dark, roughness=0.96, coat_weight=0.005)
    accent_mat = make_material("EmberAccent", d.accent_color, roughness=0.78, coat_weight=0.02)
    ember_mat = _glow_material("EmberGlow", d.ember_color, strength=1.15)
    hot_mat = _glow_material("EmberHot", (1.0, 0.58, 0.12, 1.0), strength=1.65)
    face_mat = make_face_material("EmberFace", (0.055, 0.045, 0.050, 1.0))
    mouth_mat = make_face_material("EmberMouth", (0.17, 0.09, 0.08, 1.0))
    cheek_mat = make_face_material("EmberCheek", (0.82, 0.28, 0.18, 1.0))

    attack_origin = (0.0, -0.42, 0.28)
    effect_origin = (0.0, -0.40, 0.35)

    if d.profile == "gecko":
        create_ellipsoid("Body", (0.0, 0.020, 0.245), (0.380, 0.300, 0.255), body_mat, body, segments=28, rings=18)
        create_ellipsoid("Belly", (0.0, -0.250, 0.205), (0.300, 0.060, 0.145), accent_mat, body, segments=20, rings=12)
        for name, x, y in (
            ("Foot_FL", -0.290, -0.125),
            ("Foot_FR", 0.290, -0.125),
            ("Foot_BL", -0.285, 0.135),
            ("Foot_BR", 0.285, 0.135),
        ):
            create_ellipsoid(name, (x, y, 0.070), (0.110, 0.100, 0.055), dark_mat, body, segments=16, rings=9)

        tail = create_empty("TailRoot", body, (0.290, 0.080, 0.285))
        create_ellipsoid("TailBase", (0.070, 0.015, -0.005), (0.145, 0.090, 0.080), body_mat, tail, segments=20, rings=12)
        flame_root = create_empty("GlowRoot", tail, (0.205, 0.015, 0.025))
        _flame_tip(flame_root, ember_mat)

        _face(
            face,
            front_y=-0.298,
            eye_z=0.285,
            eye_gap=0.078,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
            eye_scale=0.90,
        )
        effect_origin = (0.46, -0.18, 0.30)

    elif d.profile == "charcoal":
        create_ellipsoid("CharcoalBody", (0.0, 0.010, 0.310), (0.350, 0.335, 0.315), body_mat, body, segments=28, rings=18)
        create_ellipsoid("CharcoalBase", (0.0, 0.035, 0.095), (0.270, 0.255, 0.085), dark_mat, body, segments=20, rings=10)
        create_ellipsoid("CharcoalChip", (0.260, 0.055, 0.405), (0.085, 0.100, 0.075), dark_mat, body, segments=14, rings=8)

        glow = create_empty("GlowRoot", body, (0.0, -0.310, 0.330))
        crack1 = create_ellipsoid("GlowCrack_1", (-0.080, 0.0, 0.050), (0.036, 0.018, 0.140), ember_mat, glow, segments=12, rings=8)
        crack1.rotation_euler.z = -0.28
        crack2 = create_ellipsoid("GlowCrack_2", (0.045, -0.005, -0.010), (0.034, 0.018, 0.125), ember_mat, glow, segments=12, rings=8)
        crack2.rotation_euler.z = 0.35
        crack3 = create_ellipsoid("GlowCrack_3", (0.118, -0.010, 0.020), (0.028, 0.017, 0.090), ember_mat, glow, segments=12, rings=8)
        crack3.rotation_euler.z = -0.48

        _face(
            face,
            front_y=-0.333,
            eye_z=0.355,
            eye_gap=0.074,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
            cheeks=False,
            eye_scale=0.90,
        )

    elif d.profile == "bug":
        create_ellipsoid("Body", (0.0, 0.010, 0.160), (0.460, 0.300, 0.125), dark_mat, body, segments=28, rings=18)
        create_ellipsoid("Underbody", (0.0, 0.025, 0.060), (0.360, 0.235, 0.052), body_mat, body, segments=20, rings=10)

        create_ellipsoid("ShellMount", (0.0, 0.115, 0.327), (0.125, 0.115, 0.052), body_mat, body, segments=16, rings=9)
        shell = create_empty("ShellRoot", body, (0.0, 0.205, 0.565))
        create_ellipsoid("ChargeShell", (0.0, 0.0, 0.0), (0.340, 0.285, 0.150), accent_mat, shell, segments=26, rings=16)
        create_ellipsoid("ShellRim", (0.0, -0.245, -0.010), (0.190, 0.045, 0.078), body_mat, shell, segments=18, rings=10)
        glow = create_empty("GlowRoot", shell, (0.0, -0.220, 0.015))
        create_ellipsoid("ShellGlow", (0.0, 0.0, -0.010), (0.105, 0.045, 0.070), ember_mat, glow, segments=16, rings=10)

        for name, x, y in (
            ("Foot_FL", -0.370, -0.105),
            ("Foot_FR", 0.370, -0.105),
            ("Foot_BL", -0.370, 0.115),
            ("Foot_BR", 0.370, 0.115),
        ):
            create_ellipsoid(name, (x, y, 0.045), (0.090, 0.095, 0.043), body_mat, body, segments=14, rings=8)

        antenna_l = create_ellipsoid("Antenna_L", (-0.205, -0.255, 0.615), (0.050, 0.060, 0.100), body_mat, body, segments=14, rings=8)
        antenna_l.rotation_euler.x = -0.28
        antenna_l.rotation_euler.z = -0.22
        antenna_r = create_ellipsoid("Antenna_R", (0.205, -0.255, 0.615), (0.050, 0.060, 0.100), body_mat, body, segments=14, rings=8)
        antenna_r.rotation_euler.x = -0.28
        antenna_r.rotation_euler.z = 0.22
        _face(
            face,
            front_y=-0.292,
            eye_z=0.180,
            eye_gap=0.072,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
            cheeks=False,
            eye_scale=0.84,
        )
        effect_origin = (0.0, -0.42, 0.33)

    elif d.profile == "crab":
        create_ellipsoid("Body", (0.0, 0.010, 0.235), (0.480, 0.300, 0.300), body_mat, body, segments=30, rings=18)
        create_ellipsoid("Underbody", (0.0, 0.030, 0.085), (0.360, 0.235, 0.095), dark_mat, body, segments=20, rings=10)

        left = create_empty("PrimaryRoot", body, (-0.455, -0.010, 0.295))
        right = create_empty("SecondaryRoot", body, (0.455, -0.010, 0.295))
        create_ellipsoid("Claw_L", (-0.110, 0.0, 0.0), (0.200, 0.215, 0.240), accent_mat, left, segments=22, rings=14)
        create_ellipsoid("Claw_R", (0.110, 0.0, 0.0), (0.200, 0.215, 0.240), accent_mat, right, segments=22, rings=14)
        create_ellipsoid("Shoulder_L", (-0.310, 0.015, 0.235), (0.145, 0.165, 0.165), dark_mat, body, segments=18, rings=10)
        create_ellipsoid("Shoulder_R", (0.310, 0.015, 0.235), (0.145, 0.165, 0.165), dark_mat, body, segments=18, rings=10)
        create_ellipsoid("Pad_L", (-0.245, 0.055, 0.070), (0.145, 0.165, 0.075), dark_mat, body, segments=16, rings=9)
        create_ellipsoid("Pad_R", (0.245, 0.055, 0.070), (0.145, 0.165, 0.075), dark_mat, body, segments=16, rings=9)

        glow = create_empty("GlowRoot", body, (0.0, -0.295, 0.255))
        create_ellipsoid("MagmaCore", (0.0, 0.0, 0.0), (0.095, 0.030, 0.050), ember_mat, glow, segments=14, rings=8)

        _face(
            face,
            front_y=-0.292,
            eye_z=0.275,
            eye_gap=0.090,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
            cheeks=False,
            eye_scale=0.86,
        )
        attack_origin = (0.0, -0.48, 0.25)

    elif d.profile == "turtle":
        create_ellipsoid("LowerBody", (0.0, 0.050, 0.430), (0.480, 0.405, 0.400), body_mat, body, segments=32, rings=20)
        create_ellipsoid("LowerBase", (0.0, 0.080, 0.145), (0.370, 0.320, 0.125), dark_mat, body, segments=24, rings=14)

        for name, x in (("Foot_L", -0.402), ("Foot_R", 0.402)):
            create_ellipsoid(name, (x, -0.020, 0.075), (0.155, 0.165, 0.075), dark_mat, body, segments=18, rings=10)

        shell = create_empty("ShellRoot", body, (0.0, 0.100, 0.445))
        create_ellipsoid("FurnaceShell", (0.0, 0.0, 0.0), (0.415, 0.330, 0.385), accent_mat, shell, segments=30, rings=18)
        create_ellipsoid("FurnaceRim", (0.0, -0.315, 0.0), (0.250, 0.060, 0.235), dark_mat, shell, segments=22, rings=14)
        create_ellipsoid("ShellBand_L", (-0.250, -0.275, 0.0), (0.060, 0.055, 0.190), dark_mat, shell, segments=14, rings=9)
        create_ellipsoid("ShellBand_R", (0.250, -0.275, 0.0), (0.060, 0.055, 0.190), dark_mat, shell, segments=14, rings=9)

        glow = create_empty("GlowRoot", shell, (0.0, -0.360, 0.0))
        create_ellipsoid("Core", (0.0, 0.0, 0.0), (0.135, 0.050, 0.160), hot_mat, glow, segments=18, rings=12)

        create_ellipsoid("NeckCore", (0.0, -0.005, 0.900), (0.160, 0.205, 0.105), dark_mat, body, segments=18, rings=10)
        head = create_empty("HeadRoot", body, (0.0, -0.060, 1.235))
        create_ellipsoid("Head", (0.0, 0.0, 0.0), (0.205, 0.235, 0.200), body_mat, head, segments=24, rings=14)
        face.parent = head
        face.location = (0.0, 0.0, 0.0)
        _face(
            face,
            front_y=-0.242,
            eye_z=0.028,
            eye_gap=0.058,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
            cheeks=False,
            eye_scale=0.92,
        )

        create_ellipsoid("Vent_L", (-0.390, 0.060, 0.665), (0.095, 0.105, 0.140), dark_mat, body, segments=16, rings=10)
        create_ellipsoid("Vent_R", (0.390, 0.060, 0.665), (0.095, 0.105, 0.140), dark_mat, body, segments=16, rings=10)

        attack_origin = (0.0, -0.62, 0.50)
        effect_origin = (0.0, -0.58, 0.55)

    else:
        raise ValueError(f"Unknown ember enemy profile: {d.profile}")

    create_empty("AttackOrigin", root, attack_origin)
    create_empty("EffectOrigin", root, effect_origin)
    create_empty("GroundOrigin", root, (0.0, 0.0, 0.0))
    return root


DEFINITION_TYPE = EmberDefinition