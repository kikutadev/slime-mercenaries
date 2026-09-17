from __future__ import annotations

from dataclasses import dataclass
import math

import bpy

from ..common.materials import make_face_material, make_material
from ..common.primitives import create_ellipsoid, create_empty


@dataclass(frozen=True)
class FlowerDefinition:
    """Authoring data for the toy-like flower enemy family.

    The family deliberately keeps a short, thick lower body and lets the flower
    head carry the species silhouette.  Bud and puff forms must therefore remain
    distinguishable even when rendered in grayscale at battle-camera scale.
    """

    slug: str
    profile: str
    body_color: tuple[float, float, float, float]
    petal_color: tuple[float, float, float, float]
    center_color: tuple[float, float, float, float]
    leaf_color: tuple[float, float, float, float]


def _create_roots() -> tuple[bpy.types.Object, bpy.types.Object, bpy.types.Object]:
    root = bpy.data.objects.new("EnemyRoot", None)
    bpy.context.scene.collection.objects.link(root)

    body_root = bpy.data.objects.new("BodyRoot", None)
    bpy.context.scene.collection.objects.link(body_root)
    body_root.parent = root

    face_root = bpy.data.objects.new("FaceRoot", None)
    bpy.context.scene.collection.objects.link(face_root)
    face_root.parent = body_root
    return root, body_root, face_root


def _create_lower_body(
    definition: FlowerDefinition,
    body_root: bpy.types.Object,
    body_material: bpy.types.Material,
    leaf_material: bpy.types.Material,
) -> bpy.types.Object:
    """Create the compact plush body and the bending stem anchor.

    `StemRoot` starts inside the body rather than at the ground.  Runtime bending
    can therefore move the head without turning the flower into a thin botanical
    stem or opening a visible gap at the base.
    """

    is_puff = definition.profile == "puff"
    body_scale = (0.205, 0.182, 0.205) if is_puff else (0.218, 0.190, 0.218)
    create_ellipsoid(
        "BodyBean",
        (0.0, 0.0, 0.225),
        body_scale,
        body_material,
        body_root,
        segments=24,
        rings=16,
    )

    foot_x = 0.105 if is_puff else 0.112
    foot_scale = (0.092, 0.120, 0.055) if is_puff else (0.098, 0.126, 0.058)
    for name, x in (("Foot_L", -foot_x), ("Foot_R", foot_x)):
        create_ellipsoid(
            name,
            (x, -0.012, 0.058),
            foot_scale,
            body_material,
            body_root,
            segments=16,
            rings=9,
        )

    leaf_root = create_empty("LeafSecondary", body_root, (0.0, 0.0, 0.0))
    leaf_x = 0.205 if is_puff else 0.220
    leaf_scale = (0.130, 0.066, 0.078) if is_puff else (0.148, 0.070, 0.088)
    for name, side in (("Leaf_L", -1), ("Leaf_R", 1)):
        leaf = create_ellipsoid(
            name,
            (side * leaf_x, 0.010, 0.235),
            leaf_scale,
            leaf_material,
            leaf_root,
            segments=18,
            rings=10,
        )
        leaf.rotation_euler.y = side * -0.42
        leaf.rotation_euler.x = 0.06

    stem_root = create_empty("StemRoot", body_root, (0.0, 0.0, 0.305))
    create_ellipsoid(
        "Stem",
        (0.0, 0.012, 0.095),
        (0.105, 0.095, 0.155),
        body_material,
        stem_root,
        segments=20,
        rings=12,
    )
    return stem_root


def _create_bud_head(
    stem_root: bpy.types.Object,
    petal_material: bpy.types.Material,
) -> None:
    """Build one closed, vertically biased tulip-like bud.

    The inner mass and four overlapping lobes intentionally read as one closed
    plush bud.  No exposed yellow center is used here: the closed silhouette is
    the distinguishing feature, not flower-center color.
    """

    head_root = create_empty("HeadRoot", stem_root, (0.0, 0.0, 0.225))
    petal_root = create_empty("PetalRoot", head_root, (0.0, 0.0, 0.0))

    create_ellipsoid(
        "BudCore",
        (0.0, 0.010, 0.165),
        (0.155, 0.132, 0.278),
        petal_material,
        head_root,
        segments=26,
        rings=17,
    )
    create_ellipsoid(
        "BudBase",
        (0.0, 0.018, 0.020),
        (0.166, 0.132, 0.112),
        petal_material,
        petal_root,
        segments=20,
        rings=12,
    )

    # Four large overlapping lobes create a closed vertical pear/tulip contour.
    petal_specs = (
        ("Petal_Front", 0.0, -0.075, 0.150, 0.0, -0.08),
        ("Petal_Left", -0.086, 0.000, 0.145, 0.21, 0.02),
        ("Petal_Right", 0.086, 0.000, 0.145, -0.21, 0.02),
        ("Petal_Back", 0.0, 0.052, 0.158, 0.0, 0.15),
    )
    for name, x, y, z, rot_y, rot_x in petal_specs:
        petal = create_ellipsoid(
            name,
            (x, y, z),
            (0.116, 0.073, 0.265),
            petal_material,
            petal_root,
            segments=22,
            rings=14,
        )
        petal.rotation_euler.y = rot_y
        petal.rotation_euler.x = rot_x


def _create_puff_head(
    stem_root: bpy.types.Object,
    petal_material: bpy.types.Material,
    center_material: bpy.types.Material,
) -> None:
    """Build a broad, round pom-pom crown from a few large soft masses.

    `PuffRoot` is intentionally parented below `PetalRoot`, so the production
    `open` secondary-motion channel visibly inflates/deflates the actual crown.
    """

    head_root = create_empty("HeadRoot", stem_root, (0.0, 0.0, 0.215))
    petal_root = create_empty("PetalRoot", head_root, (0.0, 0.0, 0.0))
    puff_root = create_empty("PuffRoot", petal_root, (0.0, 0.0, 0.115))

    # A central fill mass prevents the crown from reading as a ring of balls.
    create_ellipsoid(
        "PuffCore",
        (0.0, 0.018, 0.012),
        (0.220, 0.125, 0.178),
        petal_material,
        puff_root,
        segments=24,
        rings=15,
    )

    ring_radius_x = 0.250
    ring_radius_z = 0.166
    for index in range(7):
        angle = math.pi / 2 + index * (math.pi * 2 / 7)
        x = math.cos(angle) * ring_radius_x
        z = math.sin(angle) * ring_radius_z
        vertical_bias = 0.010 if z > 0 else -0.004
        create_ellipsoid(
            f"Puff_{index + 1}",
            (x, -0.002, z),
            (0.180, 0.118, 0.150 + vertical_bias),
            petal_material,
            puff_root,
            segments=22,
            rings=14,
        )

    # The small center gives flower identity without becoming the dominant mass.
    create_ellipsoid(
        "PuffCenter",
        (0.0, -0.132, 0.000),
        (0.108, 0.050, 0.104),
        center_material,
        puff_root,
        segments=18,
        rings=11,
    )


def _create_face(
    definition: FlowerDefinition,
    face_root: bpy.types.Object,
    face_material: bpy.types.Material,
    cheek_material: bpy.types.Material,
) -> None:
    """Create a quiet bead-scale face on the lower plush body."""

    front_y = -0.176 if definition.profile == "puff" else -0.184
    eye_z = 0.270
    for name, x in (("Eye_L", -0.062), ("Eye_R", 0.062)):
        create_ellipsoid(
            name,
            (x, front_y, eye_z),
            (0.027, 0.013, 0.034),
            face_material,
            face_root,
            segments=12,
            rings=8,
        )

    create_ellipsoid(
        "Mouth",
        (0.0, front_y - 0.006, 0.214),
        (0.017, 0.007, 0.009),
        face_material,
        face_root,
        segments=10,
        rings=6,
    )
    for name, x in (("Cheek_L", -0.105), ("Cheek_R", 0.105)):
        create_ellipsoid(
            name,
            (x, front_y - 0.002, 0.245),
            (0.018, 0.007, 0.011),
            cheek_material,
            face_root,
            segments=10,
            rings=6,
        )


def build_enemy(definition: FlowerDefinition) -> bpy.types.Object:
    """Build one production flower enemy using a shared toy-like grammar."""

    root, body_root, face_root = _create_roots()

    body_material = make_material("FlowerBody", definition.body_color, roughness=0.80, coat_weight=0.03)
    petal_material = make_material("FlowerPetal", definition.petal_color, roughness=0.76, coat_weight=0.04)
    center_material = make_material("FlowerCenter", definition.center_color, roughness=0.78, coat_weight=0.03)
    leaf_material = make_material("FlowerLeaf", definition.leaf_color, roughness=0.84, coat_weight=0.01)
    face_material = make_face_material("FlowerFace", (0.11, 0.09, 0.11, 1.0))
    cheek_material = make_face_material("FlowerCheek", (0.96, 0.55, 0.62, 1.0))

    stem_root = _create_lower_body(definition, body_root, body_material, leaf_material)
    if definition.profile == "bud":
        _create_bud_head(stem_root, petal_material)
        attack_origin = (0.0, -0.285, 0.565)
        effect_origin = (0.0, -0.210, 0.720)
    else:
        _create_puff_head(stem_root, petal_material, center_material)
        attack_origin = (0.0, -0.270, 0.500)
        effect_origin = (0.0, -0.235, 0.670)

    _create_face(definition, face_root, face_material, cheek_material)
    create_empty("AttackOrigin", root, attack_origin)
    create_empty("EffectOrigin", root, effect_origin)
    create_empty("GroundOrigin", root, (0.0, 0.0, 0.0))
    return root


DEFINITION_TYPE = FlowerDefinition
