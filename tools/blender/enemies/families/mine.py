from __future__ import annotations

from dataclasses import dataclass
import math

import bpy

from ..common.materials import make_face_material, make_material
from ..common.primitives import create_ellipsoid, create_empty


@dataclass(frozen=True)
class MineDefinition:
    slug: str
    profile: str
    body_color: tuple[float, float, float, float]
    accent_color: tuple[float, float, float, float]
    crystal_color: tuple[float, float, float, float]


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


def _crystal(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material: bpy.types.Material,
    parent: bpy.types.Object,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
):
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.72, radius2=0.22, depth=1.35)
    obj = bpy.context.active_object
    assert obj is not None
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.scale = scale
    obj.rotation_euler = rotation
    obj.data.materials.append(material)
    return obj


def _rock(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material: bpy.types.Material,
    parent: bpy.types.Object,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0)
    obj = bpy.context.active_object
    assert obj is not None
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.scale = scale
    obj.rotation_euler = rotation
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj



def _bat_wing(
    name: str,
    side: int,
    material: bpy.types.Material,
    parent: bpy.types.Object,
):
    """Build one chunky scalloped toy-bat wing as a single beveled silhouette mesh."""
    sx = float(side)
    contour = [
        (0.00, 0.02),
        (0.18, 0.14),
        (0.38, 0.17),
        (0.52, 0.08),
        (0.47, -0.03),
        (0.36, -0.01),
        (0.30, -0.13),
        (0.20, -0.07),
        (0.13, -0.17),
        (0.06, -0.07),
    ]
    half_depth = 0.034
    verts: list[tuple[float, float, float]] = []
    for y in (-half_depth, half_depth):
        for x, z in contour:
            verts.append((sx * x, y, z))
    count = len(contour)
    faces: list[tuple[int, ...]] = []
    # Front/back polygon; winding differs for mirrored wing.
    front = tuple(range(count))
    back = tuple(range(count, count * 2))
    faces.append(front if side > 0 else tuple(reversed(front)))
    faces.append(tuple(reversed(back)) if side > 0 else back)
    for i in range(count):
        j = (i + 1) % count
        faces.append((i, j, count + j, count + i))

    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = (sx * 0.19, 0.0, 0.0)
    obj.data.materials.append(material)
    bevel = obj.modifiers.new("WingSoftBevel", "BEVEL")
    bevel.width = 0.035
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
    eye_scale: float = 1.0,
):
    for name, x in (("Eye_L", -eye_gap), ("Eye_R", eye_gap)):
        create_ellipsoid(
            name,
            (x, front_y, eye_z),
            (0.026 * eye_scale, 0.012, 0.032 * eye_scale),
            face_material,
            face,
            segments=14,
            rings=10,
        )
    mouth = create_ellipsoid(
        "Mouth",
        (0.0, front_y - 0.008, eye_z - 0.075),
        (0.021, 0.009, 0.011),
        mouth_material,
        face,
        segments=12,
        rings=8,
    )
    mouth.rotation_euler.x = 0.04
    if cheeks:
        for name, x in (("Cheek_L", -eye_gap * 1.62), ("Cheek_R", eye_gap * 1.62)):
            create_ellipsoid(
                name,
                (x, front_y - 0.003, eye_z - 0.040),
                (0.026, 0.008, 0.013),
                cheek_material,
                face,
                segments=12,
                rings=8,
            )


def _foot(
    name: str,
    x: float,
    y: float,
    z: float,
    scale: tuple[float, float, float],
    material: bpy.types.Material,
    body: bpy.types.Object,
    yaw: float = 0.0,
):
    foot = create_ellipsoid(name, (x, y, z), scale, material, body, segments=18, rings=10)
    foot.rotation_euler.z = yaw
    return foot


def build_enemy(d: MineDefinition):
    root, body, face = _roots()

    body_mat = make_material("MineBody", d.body_color, roughness=0.80, coat_weight=0.025)
    body_dark = tuple(max(0.0, c * 0.80) for c in d.body_color[:3]) + (1.0,)
    underside_mat = make_material("MineUnderside", body_dark, roughness=0.88, coat_weight=0.01)
    accent_mat = make_material("MineAccent", d.accent_color, roughness=0.72, coat_weight=0.035)
    crystal_mat = make_material("MineCrystal", d.crystal_color, roughness=0.27, coat_weight=0.20)
    face_mat = make_face_material("MineFace", (0.075, 0.065, 0.075, 1.0))
    mouth_mat = make_face_material("MineMouth", (0.20, 0.10, 0.10, 1.0))
    cheek_mat = make_face_material("MineCheek", (0.82, 0.40, 0.30, 1.0))

    attack_origin = (0.0, -0.44, 0.28)
    effect_origin = (0.0, -0.32, 0.44)

    if d.profile == "beetle":
        # Low toy beetle: large soft body, a distinct front head lobe, tiny leg nubs,
        # and one dominant back crystal rather than many decorative shards.
        create_ellipsoid("Body", (0.0, 0.035, 0.245), (0.42, 0.33, 0.235), body_mat, body, segments=30, rings=20)
        create_ellipsoid("Underbody", (0.0, 0.015, 0.125), (0.34, 0.27, 0.105), underside_mat, body, segments=24, rings=14)
        create_ellipsoid("HeadLobe", (0.0, -0.285, 0.255), (0.29, 0.205, 0.185), accent_mat, body, segments=26, rings=16)

        for name, x, y, yaw in (
            ("Foot_FL", -0.30, -0.135, -0.22),
            ("Foot_FR", 0.30, -0.135, 0.22),
            ("Foot_BL", -0.30, 0.145, 0.18),
            ("Foot_BR", 0.30, 0.145, -0.18),
        ):
            _foot(name, x, y, 0.070, (0.115, 0.110, 0.060), body_mat, body, yaw)

        primary = create_empty("PrimaryRoot", body, (0.0, 0.105, 0.415))
        crystal = create_empty("CrystalRoot", primary, (0.0, 0.0, 0.0))
        create_ellipsoid("CrystalBase", (0.0, 0.0, -0.035), (0.22, 0.18, 0.085), underside_mat, crystal, segments=18, rings=10)
        _crystal("BackCrystal", (0.0, 0.0, 0.105), (0.31, 0.26, 0.35), crystal_mat, crystal, rotation=(0.10, 0.0, 0.0))

        _face(
            face,
            front_y=-0.474,
            eye_z=0.292,
            eye_gap=0.073,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
        )
        effect_origin = (0.0, -0.31, 0.53)

    elif d.profile == "mole":
        # Pear/dumpling body with a soft muzzle and mitten paws. The ore nose is short
        # and chunky; it reads as the one silhouette hook, never as a weapon held in hand.
        create_ellipsoid("Body", (0.0, 0.045, 0.285), (0.37, 0.30, 0.285), body_mat, body, segments=30, rings=20)
        create_ellipsoid("Belly", (0.0, -0.235, 0.245), (0.255, 0.070, 0.175), accent_mat, body, segments=22, rings=14)
        create_ellipsoid("Muzzle", (0.0, -0.300, 0.300), (0.205, 0.125, 0.125), accent_mat, body, segments=22, rings=14)
        for name, x, yaw in (("Paw_L", -0.245, -0.26), ("Paw_R", 0.245, 0.26)):
            paw = create_ellipsoid(name, (x, -0.190, 0.150), (0.135, 0.115, 0.090), accent_mat, body, segments=18, rings=11)
            paw.rotation_euler.z = yaw
        _foot("Foot_L", -0.185, 0.025, 0.065, (0.130, 0.135, 0.070), body_mat, body, -0.10)
        _foot("Foot_R", 0.185, 0.025, 0.065, (0.130, 0.135, 0.070), body_mat, body, 0.10)

        primary = create_empty("PrimaryRoot", body, (0.0, -0.315, 0.300))
        nose = create_empty("NoseRoot", primary, (0.0, 0.0, 0.0))
        create_ellipsoid("NoseCollar", (0.0, -0.040, 0.0), (0.095, 0.060, 0.075), underside_mat, nose, segments=16, rings=10)
        _crystal("DrillNose", (0.0, -0.145, 0.0), (0.090, 0.090, 0.150), crystal_mat, nose, rotation=(math.pi / 2, 0.0, 0.0))

        _face(
            face,
            front_y=-0.355,
            eye_z=0.355,
            eye_gap=0.082,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
        )
        attack_origin = (0.0, -0.50, 0.26)
        effect_origin = (0.0, -0.36, 0.12)

    elif d.profile == "bat":
        # Plush bat rather than a sphere with two bars: body/head mass, belly patch,
        # two-part rounded wings and small ear/foot nubs.
        create_ellipsoid("Body", (0.0, 0.0, 0.385), (0.28, 0.225, 0.305), body_mat, body, segments=28, rings=18)
        create_ellipsoid("Belly", (0.0, -0.215, 0.365), (0.190, 0.060, 0.205), accent_mat, body, segments=20, rings=12)

        for name, x, yaw in (("Ear_L", -0.115, -0.16), ("Ear_R", 0.115, 0.16)):
            ear = create_ellipsoid(name, (x, -0.005, 0.665), (0.075, 0.060, 0.115), body_mat, body, segments=16, rings=10)
            ear.rotation_euler.y = yaw

        primary = create_empty("PrimaryRoot", body, (0.0, 0.015, 0.430))
        wings = create_empty("WingPairRoot", primary, (0.0, 0.0, 0.0))
        _bat_wing("Wing_L_Upper", -1, accent_mat, wings)
        _bat_wing("Wing_R_Upper", 1, accent_mat, wings)

        secondary = create_empty("SecondaryRoot", body, (0.0, 0.080, 0.660))
        crystal = create_empty("CrystalRoot", secondary, (0.0, 0.0, 0.0))
        _crystal("BatCrystal", (0.0, 0.0, 0.0), (0.080, 0.072, 0.120), crystal_mat, crystal)

        _foot("Foot_L", -0.090, -0.010, 0.095, (0.060, 0.070, 0.040), accent_mat, body, -0.12)
        _foot("Foot_R", 0.090, -0.010, 0.095, (0.060, 0.070, 0.040), accent_mat, body, 0.12)

        _face(
            face,
            front_y=-0.230,
            eye_z=0.445,
            eye_gap=0.066,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
            eye_scale=0.92,
        )
        attack_origin = (0.0, -0.32, 0.40)
        effect_origin = (0.0, -0.29, 0.45)

    elif d.profile == "golem":
        # Three faceted rounded stones, deliberately non-humanoid.
        primary = create_empty("PrimaryRoot", body, (0.0, 0.015, 0.285))
        cluster = create_empty("RockClusterRoot", primary, (0.0, 0.0, 0.0))
        _rock("RockCenter", (0.0, -0.035, 0.020), (0.315, 0.255, 0.280), body_mat, cluster, rotation=(0.05, 0.03, 0.02))
        _rock("RockLeft", (-0.265, 0.045, -0.045), (0.205, 0.185, 0.205), accent_mat, cluster, rotation=(-0.08, 0.10, -0.14))
        _rock("RockRight", (0.265, 0.055, 0.000), (0.215, 0.190, 0.215), accent_mat, cluster, rotation=(0.06, -0.08, 0.12))
        create_ellipsoid("FacePatch", (0.0, -0.260, 0.020), (0.205, 0.040, 0.135), underside_mat, cluster, segments=18, rings=10)

        # The face belongs to the moving rock cluster. Compensate the PrimaryRoot
        # world offset so authored face coordinates stay identical at rest.
        face.parent = cluster
        face.location = (0.0, -0.015, -0.285)

        secondary = create_empty("SecondaryRoot", body, (0.0, 0.080, 0.535))
        create_ellipsoid("CrystalSocket", (0.0, 0.0, -0.025), (0.105, 0.080, 0.060), underside_mat, secondary, segments=14, rings=8)
        _crystal("GolemCrystal", (0.0, 0.0, 0.065), (0.095, 0.085, 0.145), crystal_mat, secondary)

        _face(
            face,
            front_y=-0.290,
            eye_z=0.325,
            eye_gap=0.070,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
            cheeks=False,
            eye_scale=0.90,
        )
        attack_origin = (0.0, -0.42, 0.28)
        effect_origin = (0.0, -0.30, 0.38)

    elif d.profile == "turtle":
        # Boss: amber shell is the first read. A dark shell rim keeps the amber mass
        # from looking like a transparent sphere pasted onto a normal turtle.
        create_ellipsoid("Body", (0.0, 0.020, 0.265), (0.43, 0.31, 0.225), body_mat, body, segments=30, rings=18)
        shell = create_empty("ShellRoot", body, (0.0, 0.105, 0.405))
        create_ellipsoid("ShellRim", (0.0, 0.0, -0.040), (0.535, 0.385, 0.290), underside_mat, shell, segments=30, rings=18)
        create_ellipsoid("AmberShell", (0.0, -0.005, 0.020), (0.485, 0.345, 0.305), crystal_mat, shell, segments=28, rings=18)
        for name, x, z, rot in (
            ("ShellFacet_L", -0.185, 0.100, -0.22),
            ("ShellFacet_R", 0.185, 0.100, 0.22),
            ("ShellFacet_Top", 0.0, 0.180, 0.0),
        ):
            _crystal(name, (x, 0.010, z), (0.080, 0.065, 0.105), accent_mat, shell, rotation=(0.12, 0.0, rot))

        primary = create_empty("PrimaryRoot", body, (0.0, -0.265, 0.285))
        head = create_empty("HeadRoot", primary, (0.0, 0.0, 0.0))
        create_ellipsoid("Head", (0.0, -0.105, 0.0), (0.275, 0.205, 0.205), body_mat, head, segments=26, rings=16)
        create_ellipsoid("Muzzle", (0.0, -0.260, -0.010), (0.175, 0.070, 0.105), accent_mat, head, segments=18, rings=10)

        for name, x, y, yaw in (
            ("Foot_FL", -0.335, -0.115, -0.12),
            ("Foot_FR", 0.335, -0.115, 0.12),
            ("Foot_BL", -0.315, 0.165, 0.10),
            ("Foot_BR", 0.315, 0.165, -0.10),
        ):
            _foot(name, x, y, 0.085, (0.155, 0.175, 0.085), body_mat, body, yaw)
        create_ellipsoid("TailNub", (0.0, 0.325, 0.180), (0.090, 0.105, 0.070), body_mat, body, segments=14, rings=8)

        # Keep the face attached to the retracting head.
        face.parent = head
        face.location = (0.0, 0.0, 0.0)
        _face(
            face,
            front_y=-0.315,
            eye_z=0.035,
            eye_gap=0.076,
            face_material=face_mat,
            mouth_material=mouth_mat,
            cheek_material=cheek_mat,
        )
        attack_origin = (0.0, -0.56, 0.27)
        effect_origin = (0.0, -0.34, 0.50)

    else:
        raise ValueError(f"Unknown mine enemy profile: {d.profile}")

    create_empty("AttackOrigin", root, attack_origin)
    create_empty("EffectOrigin", root, effect_origin)
    create_empty("GroundOrigin", root, (0.0, 0.0, 0.0))
    return root


DEFINITION_TYPE = MineDefinition