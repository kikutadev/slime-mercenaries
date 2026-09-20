from __future__ import annotations

from dataclasses import dataclass
import math

import bpy

from ..common.materials import make_face_material, make_material
from ..common.primitives import create_ellipsoid, create_empty


@dataclass(frozen=True)
class FrostDefinition:
    slug: str
    profile: str
    snow_color: tuple[float, float, float, float]
    accent_color: tuple[float, float, float, float]
    ice_color: tuple[float, float, float, float]


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


def _ice_material(name: str, color: tuple[float, float, float, float]) -> bpy.types.Material:
    material = make_material(name, color, roughness=0.34, coat_weight=0.12)
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf is not None:
        if "Transmission Weight" in bsdf.inputs:
            bsdf.inputs["Transmission Weight"].default_value = 0.10
        if "IOR" in bsdf.inputs:
            bsdf.inputs["IOR"].default_value = 1.31
    return material


def _glow_material(name: str, color: tuple[float, float, float, float]) -> bpy.types.Material:
    material = make_material(name, color, roughness=0.28, coat_weight=0.08)
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf is not None:
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = color
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = 0.9
    return material


def _crystal(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material: bpy.types.Material,
    parent: bpy.types.Object,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
):
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.68, radius2=0.16, depth=1.30)
    obj = bpy.context.active_object
    assert obj is not None
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.scale = scale
    obj.rotation_euler = rotation
    obj.data.materials.append(material)
    bevel = obj.modifiers.new("IceSoftBevel", "BEVEL")
    bevel.width = 0.035
    bevel.segments = 2
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def _scarf_tail(
    name: str,
    parent: bpy.types.Object,
    material: bpy.types.Material,
) -> bpy.types.Object:
    # One broad, short cloth mass. It must read as scarf from silhouette, not as a thin ribbon.
    verts = [
        (-0.02, -0.03, 0.08), (0.36, -0.02, 0.13), (0.58, 0.00, 0.05), (0.40, 0.01, -0.07),
        (-0.02, 0.03, 0.02), (0.36, 0.04, 0.07), (0.58, 0.06, -0.01), (0.40, 0.07, -0.13),
    ]
    faces = [
        (0,1,2,3), (4,7,6,5),
        (0,4,5,1), (1,5,6,2), (2,6,7,3), (3,7,4,0),
    ]
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.data.materials.append(material)
    bevel = obj.modifiers.new("ScarfSoftBevel", "BEVEL")
    bevel.width = 0.045
    bevel.segments = 3
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def _face(
    face: bpy.types.Object,
    *,
    front_y: float,
    eye_z: float,
    eye_gap: float,
    face_material: bpy.types.Material,
    mouth_material: bpy.types.Material,
    cheek_material: bpy.types.Material,
    cheeks: bool = True,
    mouth: bool = True,
    eye_scale: float = 1.0,
):
    for name, x in (("Eye_L", -eye_gap), ("Eye_R", eye_gap)):
        create_ellipsoid(
            name,
            (x, front_y, eye_z),
            (0.025 * eye_scale, 0.011, 0.031 * eye_scale),
            face_material,
            face,
            segments=14,
            rings=10,
        )
    if mouth:
        create_ellipsoid(
            "Mouth",
            (0.0, front_y - 0.006, eye_z - 0.072),
            (0.019, 0.008, 0.010),
            mouth_material,
            face,
            segments=12,
            rings=8,
        )
    if cheeks:
        for name, x in (("Cheek_L", -eye_gap * 1.62), ("Cheek_R", eye_gap * 1.62)):
            create_ellipsoid(
                name,
                (x, front_y - 0.002, eye_z - 0.040),
                (0.024, 0.007, 0.012),
                cheek_material,
                face,
                segments=12,
                rings=8,
            )


def build_enemy(d: FrostDefinition):
    root, body, face = _roots()

    snow_mat = make_material("FrostSnow", d.snow_color, roughness=0.91, coat_weight=0.012)
    snow_shadow = tuple(max(0.0, c * 0.88) for c in d.snow_color[:3]) + (1.0,)
    snow_shadow_mat = make_material("FrostSnowShadow", snow_shadow, roughness=0.94, coat_weight=0.008)
    accent_mat = make_material("FrostAccent", d.accent_color, roughness=0.76, coat_weight=0.025)
    ice_mat = _ice_material("FrostIce", d.ice_color)
    glow_color = (
        min(1.0, d.ice_color[0] * 1.12),
        min(1.0, d.ice_color[1] * 1.12),
        min(1.0, d.ice_color[2] * 1.12),
        1.0,
    )
    glow_mat = _glow_material("FrostGlow", glow_color)
    face_mat = make_face_material("FrostFace", (0.060, 0.090, 0.120, 1.0))
    mouth_mat = make_face_material("FrostMouth", (0.18, 0.18, 0.24, 1.0))
    cheek_mat = make_face_material("FrostCheek", (0.85, 0.58, 0.64, 1.0))

    attack_origin = (0.0, -0.44, 0.28)
    effect_origin = (0.0, -0.34, 0.38)

    if d.profile == "roller":
        create_ellipsoid("SnowBody", (0.0, 0.020, 0.305), (0.375, 0.335, 0.300), snow_mat, body, segments=30, rings=20)
        create_ellipsoid("SnowUnderside", (0.0, 0.030, 0.105), (0.290, 0.260, 0.100), snow_shadow_mat, body, segments=22, rings=12)
        create_ellipsoid("FacePatch", (0.0, -0.300, 0.315), (0.245, 0.050, 0.170), snow_mat, body, segments=20, rings=12)

        primary = create_empty("PrimaryRoot", body, (0.215, 0.080, 0.515))
        nub = create_empty("IceNubRoot", primary, (0.0, 0.0, 0.0))
        _crystal("IceNub", (0.0, 0.0, 0.0), (0.095, 0.085, 0.115), ice_mat, nub, rotation=(0.10, -0.18, -0.34))

        _face(
            face,
            front_y=-0.326,
            eye_z=0.350,
            eye_gap=0.072,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
        )
        effect_origin = (0.0, -0.36, 0.42)

    elif d.profile == "bug":
        create_ellipsoid("Body", (0.0, 0.020, 0.235), (0.518, 0.315, 0.215), accent_mat, body, segments=30, rings=18)
        create_ellipsoid("Underbody", (0.0, 0.025, 0.095), (0.408, 0.245, 0.090), snow_shadow_mat, body, segments=22, rings=12)

        primary = create_empty("PrimaryRoot", body, (0.0, -0.020, 0.450))
        spikes = create_empty("SpikeRoot", primary, (0.0, 0.0, 0.0))
        _crystal("IceSpike_1", (-0.300, 0.0, -0.020), (0.130, 0.095, 0.195), ice_mat, spikes, rotation=(0.06, 0.0, -0.38))
        _crystal("IceSpike_2", (0.0, 0.0, 0.010), (0.145, 0.110, 0.210), ice_mat, spikes)
        _crystal("IceSpike_3", (0.300, 0.0, -0.020), (0.130, 0.095, 0.195), ice_mat, spikes, rotation=(0.06, 0.0, 0.38))

        for name, x, y in (
            ("Foot_FL", -0.395, -0.135),
            ("Foot_FR", 0.395, -0.135),
            ("Foot_BL", -0.395, 0.140),
            ("Foot_BR", 0.395, 0.140),
        ):
            create_ellipsoid(name, (x, y, 0.045), (0.112, 0.112, 0.064), snow_shadow_mat, body, segments=16, rings=9)

        _face(
            face,
            front_y=-0.308,
            eye_z=0.275,
            eye_gap=0.078,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
            cheeks=False,
            eye_scale=0.86,
        )
        effect_origin = (0.0, -0.39, 0.33)

    elif d.profile == "scarf":
        create_ellipsoid("SnowBody", (0.0, 0.020, 0.350), (0.350, 0.305, 0.355), snow_mat, body, segments=30, rings=20)
        create_ellipsoid("BellyPatch", (0.0, -0.285, 0.300), (0.235, 0.050, 0.195), snow_shadow_mat, body, segments=20, rings=12)

        create_ellipsoid("ScarfCollar", (0.0, -0.005, 0.485), (0.365, 0.300, 0.090), accent_mat, body, segments=26, rings=14)
        tail = create_empty("TailRoot", body, (0.255, 0.000, 0.455))
        _scarf_tail("ScarfTail", tail, accent_mat)

        create_ellipsoid("SnowPad_L", (-0.190, 0.005, 0.070), (0.115, 0.120, 0.060), snow_shadow_mat, body, segments=16, rings=9)
        create_ellipsoid("SnowPad_R", (0.190, 0.005, 0.070), (0.115, 0.120, 0.060), snow_shadow_mat, body, segments=16, rings=9)

        _face(
            face,
            front_y=-0.310,
            eye_z=0.385,
            eye_gap=0.074,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
        )
        effect_origin = (0.0, -0.36, 0.40)

    elif d.profile == "lantern":
        create_ellipsoid("LanternBody", (0.0, 0.010, 0.390), (0.250, 0.225, 0.390), snow_shadow_mat, body, segments=26, rings=18)
        create_ellipsoid("FrostRim", (0.0, -0.010, 0.565), (0.272, 0.238, 0.115), ice_mat, body, segments=22, rings=12)
        create_ellipsoid("LanternBand", (0.0, -0.005, 0.320), (0.260, 0.232, 0.055), accent_mat, body, segments=20, rings=10)
        create_ellipsoid("TopCap", (0.0, 0.020, 0.735), (0.135, 0.120, 0.090), accent_mat, body, segments=18, rings=10)
        _crystal("BottomIcicle", (0.0, 0.010, 0.055), (0.110, 0.095, 0.180), ice_mat, body, rotation=(math.pi, 0.0, 0.0))

        glow = create_empty("GlowRoot", body, (0.0, -0.105, 0.410))
        create_ellipsoid("LightCore", (0.0, 0.0, 0.0), (0.105, 0.060, 0.115), glow_mat, glow, segments=18, rings=10)

        _face(
            face,
            front_y=-0.236,
            eye_z=0.430,
            eye_gap=0.060,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
            cheeks=False,
            eye_scale=0.90,
        )
        attack_origin = (0.0, -0.37, 0.38)
        effect_origin = (0.0, -0.36, 0.43)

    elif d.profile == "guardian":
        create_ellipsoid("LowerMass", (0.0, 0.030, 0.280), (0.590, 0.430, 0.260), snow_mat, body, segments=32, rings=20)
        create_ellipsoid("LowerShadow", (0.0, 0.040, 0.105), (0.450, 0.335, 0.090), snow_shadow_mat, body, segments=24, rings=14)
        create_ellipsoid("LowerLobe_L", (-0.405, 0.055, 0.235), (0.205, 0.235, 0.170), snow_shadow_mat, body, segments=20, rings=12)
        create_ellipsoid("LowerLobe_R", (0.405, 0.055, 0.235), (0.205, 0.235, 0.170), snow_shadow_mat, body, segments=20, rings=12)

        create_ellipsoid("NeckCore", (0.0, 0.010, 0.640), (0.155, 0.205, 0.150), snow_shadow_mat, body, segments=18, rings=10)
        primary = create_empty("PrimaryRoot", body, (0.0, -0.010, 1.000))
        create_ellipsoid("UpperMass", (0.0, 0.0, 0.0), (0.325, 0.300, 0.335), snow_mat, primary, segments=30, rings=18)
        create_ellipsoid("UpperFacePatch", (0.0, -0.286, -0.010), (0.215, 0.040, 0.165), snow_shadow_mat, primary, segments=20, rings=12)

        secondary = create_empty("SecondaryRoot", primary, (0.0, 0.020, 0.285))
        crest = create_empty("CrestRoot", secondary, (0.0, 0.0, 0.0))
        _crystal("IceCrest", (0.0, 0.0, 0.020), (0.110, 0.100, 0.780), ice_mat, crest, rotation=(0.04, math.pi / 2, 0.0))
        _crystal("CrestTip_L", (-0.365, 0.010, -0.030), (0.115, 0.075, 0.115), ice_mat, crest, rotation=(0.10, 0.0, 1.00))
        _crystal("CrestTip_R", (0.365, 0.010, -0.030), (0.115, 0.075, 0.115), ice_mat, crest, rotation=(0.10, 0.0, -1.00))

        glow = create_empty("GlowRoot", primary, (0.0, -0.145, 0.030))
        create_ellipsoid("CrestGlow", (0.0, 0.0, 0.0), (0.120, 0.060, 0.090), glow_mat, glow, segments=16, rings=9)

        face.parent = primary
        face.location = (0.0, 0.0, 0.0)
        _face(
            face,
            front_y=-0.335,
            eye_z=0.045,
            eye_gap=0.086,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
            cheeks=False,
        )
        attack_origin = (0.0, -0.60, 0.42)
        effect_origin = (0.0, -0.50, 0.77)

    else:
        raise ValueError(f"Unknown frost enemy profile: {d.profile}")

    create_empty("AttackOrigin", root, attack_origin)
    create_empty("EffectOrigin", root, effect_origin)
    create_empty("GroundOrigin", root, (0.0, 0.0, 0.0))
    return root


DEFINITION_TYPE = FrostDefinition