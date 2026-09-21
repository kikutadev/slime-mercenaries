from __future__ import annotations

import bpy

from slimes.base.context import BuildContext
from slimes.base.primitives import create_box, create_ellipsoid

from .types import SlimeDefinition

DEFINITION = SlimeDefinition(
    slug="mimic",
    display_name="Mimic Slime",
    body_color=(0.42, 0.15, 0.46, 1.0),
    body_material_name="SlimeMimicJelly",
    body_roughness=0.18,
    body_scale=(0.72, 0.62, 0.62),
    eye_spacing=0.20,
    eye_scale=0.82,
    eye_height=0.60,
    face_offset_y=-0.08,
    motion_profile="mimic",
)


def _empty(name: str, parent: bpy.types.Object, location: tuple[float, float, float]) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    return obj


def build_parts(ctx: BuildContext) -> None:
    """Treasure-chest shell around visible jelly; lid stays independently animatable."""
    wood = ctx.material("MimicWood", (0.42, 0.18, 0.065, 1.0), roughness=0.46)
    wood_light = ctx.material("MimicWoodLight", (0.68, 0.31, 0.09, 1.0), roughness=0.38)
    brass = ctx.material("MimicBrass", (0.95, 0.68, 0.20, 1.0), roughness=0.22, metallic=0.62)
    tongue = ctx.material("MimicTongue", (0.96, 0.30, 0.48, 1.0), roughness=0.28)

    # The closed silhouette must read as a chest before the player notices the jelly.
    # The shell therefore sits in front of the smaller canonical body instead of being buried inside it.
    create_box("ChestBase", (1.92, 1.58, 0.72), (0.0, -0.04, 0.37), wood, ctx.root, bevel=0.11)
    create_box("ChestFront", (1.84, 0.18, 0.64), (0.0, -0.91, 0.40), wood_light, ctx.root, bevel=0.075)
    create_box("ChestBand_L", (0.16, 0.20, 0.72), (-0.62, -1.01, 0.40), brass, ctx.root, bevel=0.035)
    create_box("ChestBand_R", (0.16, 0.20, 0.72), (0.62, -1.01, 0.40), brass, ctx.root, bevel=0.035)
    create_box("ChestLock", (0.40, 0.17, 0.34), (0.0, -1.05, 0.46), brass, ctx.root, bevel=0.050)
    create_box("ChestCorner_L", (0.13, 0.21, 0.68), (-0.84, -1.00, 0.40), brass, ctx.root, bevel=0.030)
    create_box("ChestCorner_R", (0.13, 0.21, 0.68), (0.84, -1.00, 0.40), brass, ctx.root, bevel=0.030)

    # PrimaryRoot is both the ally attack anchor and the enemy semantic primary channel.
    # Its pivot is the rear hinge, so the entire lid swings as one unmistakable chest motion.
    lid_root = _empty("PrimaryRoot", ctx.root, (0.0, 0.70, 0.77))
    create_box("ChestLid", (1.96, 1.64, 0.32), (0.0, -0.82, 0.16), wood_light, lid_root, bevel=0.11)
    create_box("ChestLidBand_L", (0.16, 1.66, 0.36), (-0.62, -0.82, 0.18), brass, lid_root, bevel=0.035)
    create_box("ChestLidBand_R", (0.16, 1.66, 0.36), (0.62, -0.82, 0.18), brass, lid_root, bevel=0.035)
    create_box("ChestLidFrontTrim", (1.88, 0.18, 0.16), (0.0, -1.62, 0.16), brass, lid_root, bevel=0.035)

    # The tongue is tucked under the front edge while closed and swings into view with the snap.
    tongue_obj = create_ellipsoid(
        "Tongue",
        (0.0, -1.64, -0.02),
        (0.34, 0.18, 0.080),
        tongue,
        lid_root,
        segments=18,
        rings=10,
    )
    tongue_obj.rotation_euler.x = 0.15

    # Enemy runtime can use these origins when the same authored body appears as hostile.
    _empty("AttackOrigin", ctx.root, (0.0, -0.90, 0.58))
    _empty("EffectOrigin", ctx.root, (0.0, -0.72, 0.72))
    _empty("GroundOrigin", ctx.root, (0.0, 0.0, 0.0))
