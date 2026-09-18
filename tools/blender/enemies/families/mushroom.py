from __future__ import annotations

from dataclasses import dataclass

import bpy

from ..common.materials import make_face_material, make_material
from ..common.primitives import create_ellipsoid, create_empty


@dataclass(frozen=True)
class MushroomDefinition:
    """Authoring data for one mushroom enemy.

    V2 deliberately separates *silhouette* from palette. Every species chooses a
    body and cap profile so the four enemies remain distinguishable in grayscale
    and at the portrait battle camera.
    """

    slug: str
    cap_color: tuple[float, float, float, float]
    underside_color: tuple[float, float, float, float]
    stem_color: tuple[float, float, float, float]
    spot_color: tuple[float, float, float, float]
    accent_color: tuple[float, float, float, float]
    cap_scale: tuple[float, float, float]
    stem_scale: tuple[float, float, float]
    cap_height: float
    cap_profile: str = "button"
    body_profile: str = "bean"
    eye_style: str = "bead"
    eye_spacing: float = 0.10
    eye_height: float = 0.34
    eye_scale: float = 1.0
    mouth_height: float | None = None
    spot_layout: tuple[tuple[float, float, float], ...] = ()
    spore_pouches: bool = False
    boss_sprouts: bool = False
    cap_back_offset: float = 0.03
    arm_nubs: bool = True
    cheeks: bool = True


def _create_root() -> tuple[bpy.types.Object, bpy.types.Object, bpy.types.Object]:
    root = bpy.data.objects.new("EnemyRoot", None)
    bpy.context.scene.collection.objects.link(root)

    body_root = bpy.data.objects.new("BodyRoot", None)
    bpy.context.scene.collection.objects.link(body_root)
    body_root.parent = root

    face_root = bpy.data.objects.new("FaceRoot", None)
    bpy.context.scene.collection.objects.link(face_root)
    face_root.parent = root
    return root, body_root, face_root


def _eye_dimensions(style: str, scale: float) -> tuple[float, float, float]:
    """Return intentionally small facial geometry.

    V1 used ~0.10 x 0.14 eyes, which dominated the whole stem. V2 keeps eyes at
    bead / embroidery scale so the soft body and cap carry the character design.
    """
    if style == "sleepy":
        return (0.050 * scale, 0.014, 0.020 * scale)
    if style == "round":
        return (0.040 * scale, 0.017, 0.040 * scale)
    return (0.034 * scale, 0.016, 0.042 * scale)


def _create_face(
    definition: MushroomDefinition,
    face_root: bpy.types.Object,
    eye_material: bpy.types.Material,
    mouth_material: bpy.types.Material,
    cheek_material: bpy.types.Material,
) -> None:
    """Create a quiet bead-scale face pointing toward authored local -Y."""
    stem_x, stem_y, _ = definition.stem_scale
    front_y = -stem_y * 0.94
    eye_scale = _eye_dimensions(definition.eye_style, definition.eye_scale)

    for name, x in (("Eye_L", -definition.eye_spacing), ("Eye_R", definition.eye_spacing)):
        eye = create_ellipsoid(
            name,
            (x, front_y, definition.eye_height),
            eye_scale,
            eye_material,
            face_root,
            segments=14,
            rings=10,
        )
        if definition.eye_style == "sleepy":
            eye.rotation_euler.y = 0.03 if x < 0 else -0.03
            eye.rotation_euler.x = 0.05

    mouth_height = definition.mouth_height if definition.mouth_height is not None else definition.eye_height - 0.105
    mouth = create_ellipsoid(
        "Mouth",
        (0.0, front_y - 0.010, mouth_height),
        (0.026, 0.010, 0.013),
        mouth_material,
        face_root,
        segments=12,
        rings=8,
    )
    mouth.rotation_euler.x = 0.04

    if definition.cheeks:
        cheek_y = front_y - 0.003
        cheek_z = definition.eye_height - 0.045
        cheek_x = min(stem_x * 0.62, definition.eye_spacing + 0.095)
        for name, x in (("Cheek_L", -cheek_x), ("Cheek_R", cheek_x)):
            create_ellipsoid(
                name,
                (x, cheek_y, cheek_z),
                (0.030, 0.009, 0.016),
                cheek_material,
                face_root,
                segments=12,
                rings=8,
            )


def _create_feet(
    definition: MushroomDefinition,
    body_root: bpy.types.Object,
    stem_material: bpy.types.Material,
) -> None:
    stem_x, stem_y, _ = definition.stem_scale
    if definition.body_profile == "lantern":
        foot_x = stem_x * 0.46
        foot_scale = (stem_x * 0.36, stem_y * 0.70, 0.070)
    elif definition.body_profile == "dumpling":
        foot_x = stem_x * 0.52
        foot_scale = (stem_x * 0.34, stem_y * 0.64, 0.085)
    elif definition.body_profile == "boss":
        foot_x = stem_x * 0.48
        foot_scale = (stem_x * 0.34, stem_y * 0.62, 0.105)
    else:
        foot_x = stem_x * 0.44
        foot_scale = (stem_x * 0.32, stem_y * 0.62, 0.075)

    # Keep one stable `Foot` node for QA and add the second toe as an extra node.
    create_ellipsoid("Foot", (-foot_x, -0.015, 0.075), foot_scale, stem_material, body_root, segments=18, rings=10)
    create_ellipsoid("Foot_R", (foot_x, -0.015, 0.075), foot_scale, stem_material, body_root, segments=18, rings=10)


def _create_body(
    definition: MushroomDefinition,
    body_root: bpy.types.Object,
    stem_material: bpy.types.Material,
    accent_material: bpy.types.Material,
) -> None:
    stem_x, stem_y, stem_z = definition.stem_scale

    if definition.body_profile == "dumpling":
        center_z = stem_z * 0.84
        create_ellipsoid("Stem", (0.0, 0.0, center_z), definition.stem_scale, stem_material, body_root, segments=28, rings=18)
        # Side lobes make the heavy unit unmistakably wide without scaling a normal mushroom.
        for name, side in (("BodyLobe_L", -1), ("BodyLobe_R", 1)):
            create_ellipsoid(
                name,
                (side * stem_x * 0.62, 0.018, center_z - 0.02),
                (stem_x * 0.48, stem_y * 0.82, stem_z * 0.72),
                stem_material,
                body_root,
                segments=22,
                rings=14,
            )
    elif definition.body_profile == "lantern":
        center_z = stem_z * 0.98
        create_ellipsoid("Stem", (0.0, 0.0, center_z), definition.stem_scale, stem_material, body_root, segments=26, rings=18)
        create_ellipsoid(
            "LanternBase",
            (0.0, 0.012, 0.17),
            (stem_x * 0.86, stem_y * 0.88, 0.15),
            stem_material,
            body_root,
            segments=22,
            rings=14,
        )
    elif definition.body_profile == "boss":
        center_z = stem_z * 0.88
        create_ellipsoid("Stem", (0.0, 0.0, center_z), definition.stem_scale, stem_material, body_root, segments=30, rings=20)
        create_ellipsoid(
            "Belly",
            (0.0, 0.035, center_z - stem_z * 0.28),
            (stem_x * 0.94, stem_y * 0.92, stem_z * 0.64),
            stem_material,
            body_root,
            segments=26,
            rings=18,
        )
    else:
        center_z = stem_z * 0.90
        create_ellipsoid("Stem", (0.0, 0.0, center_z), definition.stem_scale, stem_material, body_root, segments=26, rings=18)

    _create_feet(definition, body_root, stem_material)

    if definition.arm_nubs:
        arm_z = center_z + stem_z * (0.02 if definition.body_profile == "dumpling" else 0.03)
        arm_x = stem_x * (1.03 if definition.body_profile != "boss" else 0.98)
        for name, side in (("Arm_L", -1), ("Arm_R", 1)):
            arm = create_ellipsoid(
                name,
                (side * arm_x, 0.015, arm_z),
                (stem_x * 0.24, stem_y * 0.44, stem_z * 0.22),
                accent_material if definition.body_profile == "lantern" else stem_material,
                body_root,
                segments=16,
                rings=10,
            )
            arm.rotation_euler.y = side * -0.18


def _create_standard_spots(
    definition: MushroomDefinition,
    body_root: bpy.types.Object,
    spot_material: bpy.types.Material,
    cap_center_y: float,
    cap_center_z: float,
) -> None:
    cap_x, cap_y, cap_z = definition.cap_scale
    for index, (x, y, size) in enumerate(definition.spot_layout, start=1):
        radial = min(0.72, (abs(x) / max(0.001, cap_x) + abs(y) / max(0.001, cap_y)) * 0.28)
        spot_z = cap_center_z + cap_z * (0.72 - radial)
        create_ellipsoid(
            f"CapSpot_{index:02d}",
            (x, y + cap_center_y, spot_z),
            (size, size * 0.74, max(0.018, size * 0.16)),
            spot_material,
            body_root,
            segments=16,
            rings=9,
        )


def _create_cap(
    definition: MushroomDefinition,
    body_root: bpy.types.Object,
    cap_material: bpy.types.Material,
    underside_material: bpy.types.Material,
    spot_material: bpy.types.Material,
    accent_material: bpy.types.Material,
) -> None:
    cap_x, cap_y, cap_z = definition.cap_scale
    cap_center_z = definition.cap_height
    cap_center_y = definition.cap_back_offset

    if definition.cap_profile == "bell":
        # A tall lantern silhouette: narrow dome plus a clean horizontal rim.
        create_ellipsoid(
            "CapUnderside",
            (0.0, cap_center_y + 0.010, cap_center_z - cap_z * 0.47),
            (cap_x * 0.96, cap_y * 0.96, cap_z * 0.16),
            underside_material,
            body_root,
            segments=24,
            rings=14,
        )
        create_ellipsoid(
            "Cap",
            (0.0, cap_center_y, cap_center_z + cap_z * 0.06),
            (cap_x * 0.72, cap_y * 0.74, cap_z),
            cap_material,
            body_root,
            segments=28,
            rings=18,
        )
        create_ellipsoid(
            "CapRim",
            (0.0, cap_center_y - 0.005, cap_center_z - cap_z * 0.38),
            (cap_x, cap_y, cap_z * 0.20),
            cap_material,
            body_root,
            segments=28,
            rings=16,
        )
    elif definition.cap_profile == "puff":
        # Heavy enemy: a low cloud-like cap made of three soft overlapping masses.
        create_ellipsoid(
            "CapUnderside",
            (0.0, cap_center_y + 0.018, cap_center_z - cap_z * 0.20),
            (cap_x * 0.92, cap_y * 0.92, cap_z * 0.32),
            underside_material,
            body_root,
            segments=26,
            rings=16,
        )
        create_ellipsoid("Cap", (0.0, cap_center_y, cap_center_z), (cap_x * 0.80, cap_y, cap_z), cap_material, body_root, segments=28, rings=18)
        for name, side in (("CapPuff_L", -1), ("CapPuff_R", 1)):
            create_ellipsoid(
                name,
                (side * cap_x * 0.43, cap_center_y + 0.01, cap_center_z - cap_z * 0.03),
                (cap_x * 0.48, cap_y * 0.86, cap_z * 0.88),
                cap_material,
                body_root,
                segments=24,
                rings=16,
            )
    elif definition.cap_profile == "reishi":
        # Boss is a layered shelf fungus, not a scaled-up Tiny mushroom.
        create_ellipsoid(
            "CapUnderside",
            (0.0, cap_center_y - 0.02, cap_center_z - cap_z * 0.28),
            (cap_x * 0.98, cap_y * 0.92, cap_z * 0.22),
            underside_material,
            body_root,
            segments=30,
            rings=16,
        )
        create_ellipsoid(
            "Cap",
            (0.0, cap_center_y, cap_center_z),
            (cap_x, cap_y, cap_z * 0.60),
            cap_material,
            body_root,
            segments=32,
            rings=18,
        )
        create_ellipsoid(
            "CapLayer_Back",
            (0.0, cap_center_y + cap_y * 0.24, cap_center_z + cap_z * 0.22),
            (cap_x * 0.82, cap_y * 0.74, cap_z * 0.52),
            accent_material,
            body_root,
            segments=30,
            rings=18,
        )
        create_ellipsoid(
            "CapLayer_Top",
            (-cap_x * 0.08, cap_center_y + cap_y * 0.31, cap_center_z + cap_z * 0.40),
            (cap_x * 0.62, cap_y * 0.56, cap_z * 0.42),
            cap_material,
            body_root,
            segments=28,
            rings=16,
        )
        # Cream lip is readable from the battle camera and reinforces the layered shelf silhouette.
        create_ellipsoid(
            "CapLip",
            (0.0, cap_center_y - cap_y * 0.34, cap_center_z - cap_z * 0.15),
            (cap_x * 0.88, cap_y * 0.28, cap_z * 0.12),
            underside_material,
            body_root,
            segments=26,
            rings=14,
        )
    else:
        create_ellipsoid(
            "CapUnderside",
            (0.0, cap_center_y + 0.015, cap_center_z - cap_z * 0.22),
            (cap_x * 0.93, cap_y * 0.93, cap_z * 0.30),
            underside_material,
            body_root,
            segments=24,
            rings=14,
        )
        create_ellipsoid("Cap", (0.0, cap_center_y, cap_center_z), definition.cap_scale, cap_material, body_root, segments=30, rings=18)

    _create_standard_spots(definition, body_root, spot_material, cap_center_y, cap_center_z)

    if definition.spore_pouches:
        # Paired bulbs make the ranged enemy recognizable before its purple palette is visible.
        # Runtime scales only this semantic root during the charge/release, so the whole
        # mushroom does not have to inflate like a balloon.
        spore_root = create_empty("SporePouchRoot", body_root, (0.0, 0.0, 0.0))
        for index, side in enumerate((-1, 1), start=1):
            pouch = create_ellipsoid(
                f"SporePouch_{index:02d}",
                (side * cap_x * 0.78, cap_center_y - cap_y * 0.02, cap_center_z - cap_z * 0.47),
                (0.115, 0.10, 0.15),
                accent_material,
                spore_root,
                segments=18,
                rings=12,
            )
            pouch.rotation_euler.y = side * 0.18
            create_ellipsoid(
                f"SporeBud_{index:02d}",
                (side * cap_x * 0.88, cap_center_y - cap_y * 0.04, cap_center_z - cap_z * 0.28),
                (0.045, 0.038, 0.052),
                spot_material,
                spore_root,
                segments=12,
                rings=8,
            )

    if definition.boss_sprouts:
        # Two baby mushrooms make the boss charming and instantly unique without armor/crown clichés.
        sprout_specs = ((-0.38, 0.18, 0.72), (0.34, 0.28, 0.58))
        for index, (nx, ny, scale) in enumerate(sprout_specs, start=1):
            x = nx * cap_x
            y = cap_center_y + ny * cap_y
            base_z = cap_center_z + cap_z * (0.64 + index * 0.07)
            create_ellipsoid(
                f"BossSproutStem_{index:02d}",
                (x, y, base_z),
                (0.060 * scale, 0.054 * scale, 0.17 * scale),
                underside_material,
                body_root,
                segments=14,
                rings=9,
            )
            create_ellipsoid(
                f"BossSproutCap_{index:02d}",
                (x, y, base_z + 0.16 * scale),
                (0.19 * scale, 0.16 * scale, 0.085 * scale),
                accent_material,
                body_root,
                segments=18,
                rings=10,
            )


def build_mushroom(definition: MushroomDefinition) -> bpy.types.Object:
    """Build one V2 mushroom-family enemy from shared shape grammar and per-form data."""
    root, body_root, face_root = _create_root()

    # V2 is deliberately softer/more matte than the rejected glossy V1 family.
    cap_material = make_material("CapMaterial", definition.cap_color, roughness=0.58, coat_weight=0.10)
    underside_material = make_material("CapUndersideMaterial", definition.underside_color, roughness=0.72, coat_weight=0.03)
    stem_material = make_material("StemMaterial", definition.stem_color, roughness=0.72, coat_weight=0.06)
    spot_material = make_material("SpotMaterial", definition.spot_color, roughness=0.64, coat_weight=0.04)
    accent_material = make_material("AccentMaterial", definition.accent_color, roughness=0.62, coat_weight=0.06)
    eye_material = make_face_material("EyeMaterial", (0.075, 0.068, 0.075, 1.0))
    mouth_material = make_face_material("MouthMaterial", (0.18, 0.10, 0.12, 1.0))
    cheek_material = make_face_material("CheekMaterial", (0.92, 0.48, 0.52, 1.0))

    _create_body(definition, body_root, stem_material, accent_material)
    _create_cap(definition, body_root, cap_material, underside_material, spot_material, accent_material)
    _create_face(definition, face_root, eye_material, mouth_material, cheek_material)

    cap_x, cap_y, cap_z = definition.cap_scale
    create_empty("AttackOrigin", root, (0.0, -cap_y * 0.88, definition.eye_height))
    create_empty("EffectOrigin", root, (0.0, -cap_y * 0.62, definition.cap_height + cap_z * 0.04))
    create_empty("GroundOrigin", root, (0.0, 0.0, 0.0))
    return root

# Generic enemy builder contract consumed by `enemies.registry`.
DEFINITION_TYPE = MushroomDefinition
build_enemy = build_mushroom
