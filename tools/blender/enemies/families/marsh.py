from __future__ import annotations

from dataclasses import dataclass
import math

import bpy

from ..common.materials import make_face_material, make_material
from ..common.primitives import create_ellipsoid, create_empty


@dataclass(frozen=True)
class MarshDefinition:
    slug: str
    profile: str
    body_color: tuple[float, float, float, float]
    accent_color: tuple[float, float, float, float]
    water_color: tuple[float, float, float, float]


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


def _soft_water_material(name: str, color: tuple[float, float, float, float]) -> bpy.types.Material:
    material = make_material(name, color, roughness=0.38, coat_weight=0.06)
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf is not None:
        if "Transmission Weight" in bsdf.inputs:
            bsdf.inputs["Transmission Weight"].default_value = 0.06
        if "IOR" in bsdf.inputs:
            bsdf.inputs["IOR"].default_value = 1.33
    return material



def _create_drop_body(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material: bpy.types.Material,
    parent: bpy.types.Object,
) -> bpy.types.Object:
    """One-piece soft droplet/seed mass; avoids the stacked-sphere seam."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=30, ring_count=20, radius=1.0)
    obj = bpy.context.active_object
    assert obj is not None
    obj.name = name
    obj.parent = parent
    obj.location = location
    # Shape in mesh space first: narrower crown, fuller lower body.
    for vertex in obj.data.vertices:
        z = max(-1.0, min(1.0, vertex.co.z))
        radial = 0.80 - 0.17 * z + 0.06 * (1.0 - z * z)
        vertex.co.x *= radial
        vertex.co.y *= radial
        # slightly blunt the bottom so it feels like a toy seed rather than a tear icon
        if z < -0.62:
            vertex.co.z = -0.62 + (z + 0.62) * 0.55
    obj.scale = scale
    obj.data.materials.append(material)
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
            (0.025 * eye_scale, 0.012, 0.031 * eye_scale),
            face_material,
            face,
            segments=14,
            rings=10,
        )
    if mouth:
        create_ellipsoid(
            "Mouth",
            (0.0, front_y - 0.008, eye_z - 0.073),
            (0.020, 0.009, 0.011),
            mouth_material,
            face,
            segments=12,
            rings=8,
        )
    if cheeks:
        for name, x in (("Cheek_L", -eye_gap * 1.62), ("Cheek_R", eye_gap * 1.62)):
            create_ellipsoid(
                name,
                (x, front_y - 0.003, eye_z - 0.040),
                (0.025, 0.008, 0.013),
                cheek_material,
                face,
                segments=12,
                rings=8,
            )


def _foot(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material: bpy.types.Material,
    parent: bpy.types.Object,
    yaw: float = 0.0,
):
    foot = create_ellipsoid(name, location, scale, material, parent, segments=18, rings=10)
    foot.rotation_euler.z = yaw
    return foot


def _leaf(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material: bpy.types.Material,
    parent: bpy.types.Object,
    rotation_z: float,
):
    leaf = create_ellipsoid(name, location, scale, material, parent, segments=22, rings=12)
    leaf.rotation_euler.z = rotation_z
    return leaf


def _create_lily_pad(
    name: str,
    parent: bpy.types.Object,
    material: bpy.types.Material,
    *,
    radius_x: float,
    radius_y: float,
    height: float,
) -> bpy.types.Object:
    """Create a beveled stylized lily pad with a real rear notch."""
    segments = 32
    top_z = height * 0.5
    bottom_z = -height * 0.5
    verts: list[tuple[float, float, float]] = []
    # Notch sits at +Y so the authored face on -Y remains clean.
    for z in (top_z, bottom_z):
        for i in range(segments):
            angle = (i / segments) * math.tau
            delta = abs(((angle - math.pi / 2 + math.pi) % math.tau) - math.pi)
            notch = delta < 0.22
            radius = 0.42 if notch else 1.0
            verts.append((math.cos(angle) * radius_x * radius, math.sin(angle) * radius_y * radius, z))

    faces = []
    # top/bottom fans use a center vertex each
    top_center = len(verts)
    verts.append((0.0, 0.0, top_z))
    bottom_center = len(verts)
    verts.append((0.0, 0.0, bottom_z))
    for i in range(segments):
        j = (i + 1) % segments
        faces.append((top_center, i, j))
        faces.append((bottom_center, segments + j, segments + i))
        faces.append((i, segments + i, segments + j, j))

    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.data.materials.append(material)

    bevel = obj.modifiers.new("SoftPadBevel", "BEVEL")
    bevel.width = min(radius_x, radius_y) * 0.055
    bevel.segments = 3
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def build_enemy(d: MarshDefinition):
    root, body, face = _roots()

    body_mat = make_material("MarshBody", d.body_color, roughness=0.76, coat_weight=0.035)
    body_dark = tuple(max(0.0, c * 0.78) for c in d.body_color[:3]) + (1.0,)
    underside_mat = make_material("MarshUnderside", body_dark, roughness=0.86, coat_weight=0.015)
    accent_mat = make_material("MarshAccent", d.accent_color, roughness=0.78, coat_weight=0.025)
    water_mat = _soft_water_material("MarshWater", d.water_color)
    face_mat = make_face_material("MarshFace", (0.065, 0.080, 0.070, 1.0))
    mouth_mat = make_face_material("MarshMouth", (0.15, 0.10, 0.12, 1.0))
    cheek_mat = make_face_material("MarshCheek", (0.78, 0.43, 0.38, 1.0))

    attack_origin = (0.0, -0.43, 0.28)
    effect_origin = (0.0, -0.34, 0.34)

    if d.profile == "frog":
        # Frog identity comes from body width + eye mounds + throat sac, not giant eyes.
        create_ellipsoid("Body", (0.0, 0.030, 0.245), (0.455, 0.325, 0.235), body_mat, body, segments=30, rings=20)
        create_ellipsoid("Belly", (0.0, -0.285, 0.205), (0.300, 0.080, 0.150), accent_mat, body, segments=22, rings=14)
        for name, x in (("EyeMound_L", -0.165), ("EyeMound_R", 0.165)):
            create_ellipsoid(name, (x, -0.145, 0.425), (0.115, 0.120, 0.105), body_mat, body, segments=18, rings=11)

        throat = create_empty("ThroatRoot", body, (0.0, -0.325, 0.185))
        create_ellipsoid("ThroatSac", (0.0, 0.0, 0.0), (0.245, 0.105, 0.145), accent_mat, throat, segments=22, rings=14)

        _foot("Foot_L", (-0.305, -0.025, 0.070), (0.155, 0.175, 0.070), body_mat, body, -0.12)
        _foot("Foot_R", (0.305, -0.025, 0.070), (0.155, 0.175, 0.070), body_mat, body, 0.12)
        _foot("Paw_L", (-0.285, -0.225, 0.120), (0.095, 0.095, 0.065), accent_mat, body, -0.20)
        _foot("Paw_R", (0.285, -0.225, 0.120), (0.095, 0.095, 0.065), accent_mat, body, 0.20)

        _face(
            face,
            front_y=-0.337,
            eye_z=0.360,
            eye_gap=0.165,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
            cheeks=True,
            eye_scale=0.92,
        )
        effect_origin = (0.0, -0.42, 0.20)

    elif d.profile == "sprout":
        # A water-drop creature assembled from two large soft masses, topped by exactly
        # two broad leaves. It should read as a living marsh seed, not a generic slime.
        _create_drop_body("DropBody", (0.0, 0.020, 0.335), (0.330, 0.275, 0.385), water_mat, body)
        create_ellipsoid("BellyCore", (0.0, -0.225, 0.285), (0.155, 0.045, 0.130), accent_mat, body, segments=18, rings=10)

        primary = create_empty("PrimaryRoot", body, (0.0, 0.030, 0.635))
        leaves = create_empty("LeafPairRoot", primary, (0.0, 0.0, 0.0))
        _leaf("Leaf_L", (-0.175, 0.0, 0.020), (0.235, 0.078, 0.115), accent_mat, leaves, 0.28)
        _leaf("Leaf_R", (0.175, 0.0, 0.020), (0.235, 0.078, 0.115), accent_mat, leaves, -0.28)

        secondary = create_empty("SecondaryRoot", body, (0.0, -0.015, 0.405))
        create_ellipsoid("WaterCore", (0.0, 0.0, 0.0), (0.105, 0.080, 0.110), water_mat, secondary, segments=16, rings=10)

        _foot("Foot_L", (-0.115, 0.015, 0.055), (0.085, 0.100, 0.050), accent_mat, body, -0.10)
        _foot("Foot_R", (0.115, 0.015, 0.055), (0.085, 0.100, 0.050), accent_mat, body, 0.10)

        _face(
            face,
            front_y=-0.222,
            eye_z=0.355,
            eye_gap=0.066,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
        )
        attack_origin = (0.0, -0.34, 0.34)
        effect_origin = (0.0, -0.30, 0.43)

    elif d.profile == "snail":
        # Long low foot + tiny head + two antenna nubs. One oversized bubble shell
        # dominates the silhouette, with a subtle inner ring for polish.
        create_ellipsoid("FootBody", (0.0, -0.020, 0.155), (0.365, 0.255, 0.135), body_mat, body, segments=28, rings=16)
        create_ellipsoid("Head", (0.0, -0.285, 0.245), (0.245, 0.175, 0.190), accent_mat, body, segments=24, rings=14)
        create_ellipsoid("Belly", (0.0, -0.350, 0.160), (0.170, 0.065, 0.095), body_mat, body, segments=18, rings=10)

        for name, x, tilt in (("Antenna_L", -0.095, -0.18), ("Antenna_R", 0.095, 0.18)):
            antenna = create_ellipsoid(name, (x, -0.305, 0.430), (0.045, 0.040, 0.115), body_mat, body, segments=14, rings=8)
            antenna.rotation_euler.y = tilt
            create_ellipsoid(
                f"{name}_Tip",
                (x + (-0.018 if x < 0 else 0.018), -0.305, 0.520),
                (0.042, 0.038, 0.042),
                accent_mat,
                body,
                segments=12,
                rings=8,
            )

        secondary = create_empty("SecondaryRoot", body, (0.0, 0.115, 0.350))
        shell = create_empty("BubbleShellRoot", secondary, (0.0, 0.0, 0.0))
        create_ellipsoid("ShellSeat", (0.0, 0.0, -0.060), (0.300, 0.235, 0.205), underside_mat, shell, segments=22, rings=14)
        create_ellipsoid("BubbleShell", (0.0, 0.0, 0.025), (0.385, 0.300, 0.355), water_mat, shell, segments=30, rings=20)
        create_ellipsoid("BubbleCore", (0.0, 0.020, 0.015), (0.205, 0.160, 0.190), accent_mat, shell, segments=20, rings=12)
        bpy.ops.mesh.primitive_torus_add(major_radius=0.135, minor_radius=0.018, major_segments=24, minor_segments=8)
        ring = bpy.context.active_object
        assert ring is not None
        ring.name = "BubbleInnerRing"
        ring.parent = shell
        ring.location = (0.0, -0.270, 0.020)
        ring.rotation_euler.x = math.pi / 2
        ring.data.materials.append(water_mat)

        _face(
            face,
            front_y=-0.445,
            eye_z=0.295,
            eye_gap=0.070,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
        )
        attack_origin = (0.0, -0.48, 0.22)
        effect_origin = (0.0, 0.03, 0.40)

    elif d.profile == "lily":
        # Real pad silhouette with a notch, plus a tiny central bud/dewdrop. The face is
        # bead-scale and sits on the front lip; this must never become a floating green disk with giant eyes.
        primary = create_empty("PrimaryRoot", body, (0.0, 0.0, 0.145))
        pad = create_empty("PadRoot", primary, (0.0, 0.0, 0.0))
        lily = _create_lily_pad("LilyPad", pad, body_mat, radius_x=0.54, radius_y=0.37, height=0.095)
        lily.rotation_euler.z = -0.04

        create_ellipsoid("PadFrontLip", (0.0, -0.335, 0.015), (0.265, 0.055, 0.045), accent_mat, pad, segments=18, rings=10)
        secondary = create_empty("SecondaryRoot", body, (0.0, 0.040, 0.235))
        create_ellipsoid("DewDrop", (0.0, 0.0, 0.0), (0.078, 0.062, 0.090), water_mat, secondary, segments=18, rings=11)
        _leaf("TinyLeaf", (0.090, 0.020, -0.010), (0.125, 0.045, 0.060), accent_mat, secondary, -0.30)

        # Face follows the tilting/skimming pad rather than floating in world space.
        face.parent = primary
        face.location = (0.0, 0.0, -0.145)
        _face(
            face,
            front_y=-0.390,
            eye_z=0.175,
            eye_gap=0.072,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
            cheeks=False,
            mouth=False,
            eye_scale=0.42,
        )
        attack_origin = (0.0, -0.50, 0.15)
        effect_origin = (0.0, -0.22, 0.115)

    elif d.profile == "boss-frog":
        # Boss is wider, lower and more layered than the normal frog. Giant throat
        # sac, double eye mounds, water-backed shoulder mass and chunky feet create
        # a separate silhouette rather than a scaled copy.
        # Distinct boss silhouette: the normal frog is a flat wide dumpling; this boss
        # stacks a tall rear body over a hanging throat mass so the outline changes even
        # in monochrome at 128px.
        create_ellipsoid("Body", (0.0, 0.060, 0.390), (0.600, 0.405, 0.365), body_mat, body, segments=34, rings=22)
        create_ellipsoid("BackMass", (0.0, 0.265, 0.500), (0.455, 0.245, 0.250), underside_mat, body, segments=28, rings=16)
        create_ellipsoid("Belly", (0.0, -0.345, 0.335), (0.390, 0.090, 0.230), accent_mat, body, segments=24, rings=14)

        for name, x in (("EyeMound_L", -0.225), ("EyeMound_R", 0.225)):
            create_ellipsoid(name, (x, -0.145, 0.705), (0.150, 0.145, 0.145), body_mat, body, segments=20, rings=12)

        throat = create_empty("ThroatRoot", body, (0.0, -0.405, 0.205))
        create_ellipsoid("GiantThroatSac", (0.0, 0.0, 0.0), (0.400, 0.155, 0.315), accent_mat, throat, segments=28, rings=18)
        create_ellipsoid("ThroatLowerLobe", (0.0, -0.005, -0.150), (0.270, 0.120, 0.185), accent_mat, throat, segments=22, rings=14)

        secondary = create_empty("SecondaryRoot", body, (0.0, 0.235, 0.585))
        create_ellipsoid("BackRipple", (0.0, 0.0, 0.0), (0.345, 0.120, 0.135), water_mat, secondary, segments=22, rings=12)

        _foot("Foot_L", (-0.415, -0.005, 0.085), (0.210, 0.225, 0.090), body_mat, body, -0.14)
        _foot("Foot_R", (0.415, -0.005, 0.085), (0.210, 0.225, 0.090), body_mat, body, 0.14)
        _foot("Paw_L", (-0.370, -0.285, 0.175), (0.130, 0.125, 0.078), accent_mat, body, -0.22)
        _foot("Paw_R", (0.370, -0.285, 0.175), (0.130, 0.125, 0.078), accent_mat, body, 0.22)

        _face(
            face,
            front_y=-0.435,
            eye_z=0.610,
            eye_gap=0.225,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
            eye_scale=0.95,
        )
        attack_origin = (0.0, -0.61, 0.34)
        effect_origin = (0.0, -0.53, 0.22)

    else:
        raise ValueError(f"Unknown marsh enemy profile: {d.profile}")

    create_empty("AttackOrigin", root, attack_origin)
    create_empty("EffectOrigin", root, effect_origin)
    create_empty("GroundOrigin", root, (0.0, 0.0, 0.0))
    return root


DEFINITION_TYPE = MarshDefinition