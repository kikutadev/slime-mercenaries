from __future__ import annotations

import math

import bpy
from mathutils import Vector

from ..base.context import BuildContext
from ..base.primitives import create_box, create_cylinder_between, create_ellipsoid

# Gun-local coordinates use -Y as the firing axis. Keeping one explicit axis makes
# the barrel, muzzle marker and ProjectileOrigin mechanically agree.
_MUZZLE_LOCAL = Vector((0.0, -1.64, 0.12))


def _create_empty(name: str, parent: bpy.types.Object, location: tuple[float, float, float]) -> bpy.types.Object:
    """Create a named QA/export marker without introducing job-specific body geometry."""
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    return obj


def _create_trigger_guard(
    parent: bpy.types.Object,
    brass: bpy.types.Material,
    trigger: bpy.types.Material,
) -> None:
    """Build a chunky U-shaped guard that survives portrait-size rendering."""
    create_cylinder_between(
        "Gun_TriggerGuardRear",
        (0.0, 0.08, -0.14),
        (0.0, 0.00, -0.29),
        0.024,
        brass,
        parent,
        vertices=8,
    )
    create_cylinder_between(
        "Gun_TriggerGuardBottom",
        (0.0, 0.00, -0.29),
        (0.0, -0.25, -0.27),
        0.024,
        brass,
        parent,
        vertices=8,
    )
    create_cylinder_between(
        "Gun_TriggerGuardFront",
        (0.0, -0.25, -0.27),
        (0.0, -0.29, -0.15),
        0.024,
        brass,
        parent,
        vertices=8,
    )
    create_cylinder_between(
        "Gun_Trigger",
        (0.0, -0.10, -0.13),
        (0.0, -0.14, -0.23),
        0.018,
        trigger,
        parent,
        vertices=8,
    )


def _create_lockwork(parent: bpy.types.Object, brass: bpy.types.Material, steel: bpy.types.Material) -> None:
    """Create exaggerated flintlock lockwork on the outward side of the weapon."""
    # Gun sits on the slime's left side, so -X is the outward/readable face.
    create_box("Gun_LockPlate", (0.075, 0.34, 0.19), (-0.155, -0.04, 0.08), brass, parent, bevel=0.025)
    create_ellipsoid(
        "Gun_Pan",
        (-0.205, -0.20, 0.19),
        (0.075, 0.090, 0.042),
        brass,
        parent,
        segments=14,
        rings=8,
    )

    cock = create_box("Gun_Cock", (0.065, 0.10, 0.24), (-0.205, 0.02, 0.27), steel, parent, bevel=0.016)
    cock.rotation_euler[0] = math.radians(-38.0)
    jaw = create_box("Gun_CockJaw", (0.095, 0.12, 0.060), (-0.205, -0.065, 0.37), steel, parent, bevel=0.016)
    jaw.rotation_euler[0] = math.radians(-28.0)

    frizzen = create_box("Gun_Frizzen", (0.060, 0.085, 0.21), (-0.205, -0.27, 0.27), steel, parent, bevel=0.016)
    frizzen.rotation_euler[0] = math.radians(12.0)


def create_flintlock(ctx: BuildContext) -> bpy.types.Object:
    """Create an oversized, portrait-readable flintlock aligned to the slime's forward axis."""
    steel = ctx.material("GunSteel", (0.25, 0.30, 0.38, 1.0), roughness=0.24, metallic=0.78)
    dark_steel = ctx.material("GunDarkSteel", (0.035, 0.045, 0.060, 1.0), roughness=0.30, metallic=0.62)
    wood = ctx.material("GunWood", (0.34, 0.13, 0.040, 1.0), roughness=0.70)
    brass = ctx.material("GunBrass", (0.86, 0.53, 0.12, 1.0), roughness=0.28, metallic=0.55)

    anchor = bpy.data.objects.new("GunAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("WeaponSocket")

    # The weapon lives outside the left eye/cheek silhouette. Local -Y points at
    # the enemy; a small outward yaw exposes the profile without turning the shot sideways.
    anchor.location = (-0.84, -0.56, 0.66)
    anchor.rotation_euler[0] = math.radians(-4.0)
    anchor.rotation_euler[2] = math.radians(-10.0)

    # Long steel barrel and thick muzzle ring: the large-scale read comes first.
    create_cylinder_between(
        "Gun_Barrel",
        (0.0, -0.18, 0.12),
        (0.0, -1.52, 0.12),
        0.078,
        steel,
        anchor,
        vertices=16,
    )
    create_cylinder_between(
        "Gun_BarrelBand",
        (0.0, -0.86, 0.12),
        (0.0, -0.98, 0.12),
        0.100,
        brass,
        anchor,
        vertices=16,
    )
    create_cylinder_between(
        "Gun_MuzzleRing",
        (0.0, -1.49, 0.12),
        (0.0, -1.62, 0.12),
        0.112,
        brass,
        anchor,
        vertices=16,
    )
    create_cylinder_between(
        "Gun_Bore",
        (0.0, -1.615, 0.12),
        tuple(_MUZZLE_LOCAL),
        0.064,
        dark_steel,
        anchor,
        vertices=16,
    )

    # The wooden forestock breaks the "metal rod" read and leads into a broad breech.
    create_box("Gun_Forestock", (0.23, 0.74, 0.16), (0.0, -0.55, 0.00), wood, anchor, bevel=0.045)
    create_box("Gun_Breech", (0.34, 0.42, 0.34), (0.0, -0.05, 0.02), wood, anchor, bevel=0.055)
    create_box("Gun_BreechBand", (0.38, 0.105, 0.30), (0.0, -0.24, 0.04), brass, anchor, bevel=0.030)

    # Large angled grip + pommel supply the unmistakable pistol silhouette.
    grip = create_box("Gun_Grip", (0.28, 0.28, 0.52), (0.0, 0.25, -0.27), wood, anchor, bevel=0.065)
    grip.rotation_euler[0] = math.radians(30.0)
    pommel = create_ellipsoid(
        "Gun_Pommel",
        (0.0, 0.39, -0.52),
        (0.18, 0.18, 0.15),
        brass,
        anchor,
        segments=16,
        rings=10,
    )
    pommel.rotation_euler[0] = math.radians(18.0)

    _create_lockwork(anchor, brass, dark_steel)
    _create_trigger_guard(anchor, brass, dark_steel)

    # A visible ramrod adds another period-firearm cue without enlarging the body.
    create_cylinder_between(
        "Gun_Ramrod",
        (0.0, -0.40, -0.12),
        (0.0, -1.43, -0.12),
        0.022,
        brass,
        anchor,
        vertices=8,
    )

    muzzle_marker = _create_empty("GunMuzzle", anchor, tuple(_MUZZLE_LOCAL))

    # ProjectileOrigin remains the shared runtime socket. Position and orientation
    # are derived from the actual muzzle so projectile spawn and barrel axis agree.
    bpy.context.view_layer.update()
    projectile = ctx.socket("ProjectileOrigin")
    projectile.location = projectile.parent.matrix_world.inverted() @ muzzle_marker.matrix_world.translation
    projectile.rotation_euler = anchor.rotation_euler.copy()

    return anchor


def create_gunner_kit(ctx: BuildContext) -> tuple[bpy.types.Object, bpy.types.Object]:
    """Tier-2 Gunner kit: compact repeating carbine plus readable protective goggles.

    The canonical Base Slime remains untouched. The carbine keeps local -Y as its
    firing axis and derives ProjectileOrigin from the authored muzzle marker.
    """
    steel = ctx.material("GunnerSteel", (0.20, 0.26, 0.34, 1.0), roughness=0.22, metallic=0.80)
    dark_steel = ctx.material("GunnerDarkSteel", (0.028, 0.036, 0.050, 1.0), roughness=0.30, metallic=0.62)
    wood = ctx.material("GunnerWood", (0.29, 0.11, 0.035, 1.0), roughness=0.66)
    brass = ctx.material("GunnerBrass", (0.83, 0.49, 0.11, 1.0), roughness=0.28, metallic=0.52)
    lens = ctx.material("GunnerLens", (0.20, 0.53, 0.66, 1.0), roughness=0.16, metallic=0.10, coat_weight=0.35)
    strap = ctx.material("GunnerStrap", (0.09, 0.07, 0.055, 1.0), roughness=0.86)

    anchor = bpy.data.objects.new("GunAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("WeaponSocket")
    anchor.location = (-0.80, -0.50, 0.64)
    anchor.rotation_euler[0] = math.radians(-3.0)
    anchor.rotation_euler[2] = math.radians(-8.0)

    # Compact carbine: shorter than a full rifle, but with a clear receiver and stock
    # so it no longer reads as the Tier-1 flintlock pistol.
    create_cylinder_between(
        "Gunner_Barrel",
        (0.0, -0.18, 0.13),
        (0.0, -1.36, 0.13),
        0.068,
        steel,
        anchor,
        vertices=16,
    )
    create_cylinder_between(
        "Gunner_MuzzleRing",
        (0.0, -1.34, 0.13),
        (0.0, -1.47, 0.13),
        0.092,
        brass,
        anchor,
        vertices=16,
    )
    create_cylinder_between(
        "Gunner_Bore",
        (0.0, -1.455, 0.13),
        (0.0, -1.495, 0.13),
        0.052,
        dark_steel,
        anchor,
        vertices=16,
    )
    create_box("Gunner_Forestock", (0.22, 0.68, 0.15), (0.0, -0.56, 0.015), wood, anchor, bevel=0.040)
    create_box("Gunner_Receiver", (0.34, 0.42, 0.31), (0.0, -0.04, 0.055), steel, anchor, bevel=0.045)
    create_box("Gunner_ReceiverPlate", (0.37, 0.18, 0.18), (-0.018, -0.17, 0.075), brass, anchor, bevel=0.024)
    create_box("Gunner_Magazine", (0.20, 0.16, 0.30), (0.0, 0.04, -0.24), dark_steel, anchor, bevel=0.030)

    # Rear stock provides the sustained-fire silhouette without humanoid arms.
    stock = create_box("Gunner_Stock", (0.30, 0.66, 0.27), (0.0, 0.44, -0.06), wood, anchor, bevel=0.060)
    stock.rotation_euler[0] = math.radians(-8.0)
    create_ellipsoid(
        "Gunner_ButtPad",
        (0.0, 0.78, -0.12),
        (0.20, 0.11, 0.19),
        dark_steel,
        anchor,
        segments=16,
        rings=10,
    )
    grip = create_box("Gunner_Grip", (0.20, 0.24, 0.38), (0.0, 0.16, -0.27), wood, anchor, bevel=0.045)
    grip.rotation_euler[0] = math.radians(18.0)

    # Chunky sight and cycling lever stay legible at mobile scale.
    create_box("Gunner_RearSight", (0.10, 0.10, 0.10), (0.0, 0.02, 0.28), brass, anchor, bevel=0.020)
    create_box("Gunner_FrontSight", (0.07, 0.07, 0.12), (0.0, -1.16, 0.25), brass, anchor, bevel=0.015)
    lever = create_box("Gunner_CyclingLever", (0.07, 0.34, 0.10), (-0.20, 0.05, -0.10), brass, anchor, bevel=0.022)
    lever.rotation_euler[0] = math.radians(20.0)

    muzzle = _create_empty("GunnerMuzzle", anchor, (0.0, -1.495, 0.13))
    bpy.context.view_layer.update()
    projectile = ctx.socket("ProjectileOrigin")
    projectile.location = projectile.parent.matrix_world.inverted() @ muzzle.matrix_world.translation
    projectile.rotation_euler = anchor.rotation_euler.copy()

    # Goggles are separate head equipment so production motion can give them a
    # restrained delayed wobble without touching the Body mesh.
    goggles = bpy.data.objects.new("GunnerGogglesAnchor", None)
    bpy.context.scene.collection.objects.link(goggles)
    goggles.parent = ctx.socket("HeadSocket")
    goggles.location = (0.0, -0.97, -0.29)

    for side, x in (("L", -0.21), ("R", 0.21)):
        create_ellipsoid(
            f"Gunner_GoggleFrame_{side}",
            (x, 0.0, 0.0),
            (0.17, 0.055, 0.135),
            brass,
            goggles,
            segments=18,
            rings=10,
        )
        create_ellipsoid(
            f"Gunner_GoggleLens_{side}",
            (x, -0.045, 0.0),
            (0.125, 0.030, 0.095),
            lens,
            goggles,
            segments=18,
            rings=10,
        )
    create_box("Gunner_GoggleBridge", (0.18, 0.045, 0.045), (0.0, -0.010, 0.0), brass, goggles, bevel=0.018)
    create_box("Gunner_GoggleStrap", (0.58, 0.035, 0.055), (0.0, 0.115, 0.0), strap, goggles, bevel=0.018)

    return anchor, goggles
