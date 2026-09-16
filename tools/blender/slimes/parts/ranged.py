from __future__ import annotations

import math

import bpy

from ..base.context import BuildContext
from ..base.primitives import create_cylinder_between


def create_bow(ctx: BuildContext) -> bpy.types.Object:
    """Accepted Bow Slime equipment, preserved as a reusable ranged part."""
    wood = ctx.material("BowWood", (0.37, 0.18, 0.07, 1.0), roughness=0.78)
    string = ctx.material("BowString", (0.08, 0.08, 0.08, 1.0), roughness=0.95)

    anchor = bpy.data.objects.new("BowAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("WeaponSocket")
    anchor.location = (1.04, -0.50, 0.45)
    anchor.rotation_euler[0] = math.radians(4.0)
    anchor.rotation_euler[1] = math.radians(-12.0)
    anchor.rotation_euler[2] = math.radians(-10.0)

    create_cylinder_between("Bow_Upper", (0.0, 0.0, 0.0), (0.29, 0.0, 0.60), 0.050, wood, anchor)
    create_cylinder_between("Bow_Lower", (0.0, 0.0, 0.0), (0.29, 0.0, -0.60), 0.050, wood, anchor)
    create_cylinder_between("Bow_UpperTip", (0.29, 0.0, 0.60), (0.13, 0.0, 0.83), 0.040, wood, anchor)
    create_cylinder_between("Bow_LowerTip", (0.29, 0.0, -0.60), (0.13, 0.0, -0.83), 0.040, wood, anchor)
    create_cylinder_between("Bow_StringUpper", (0.13, 0.0, 0.83), (-0.10, 0.0, 0.0), 0.010, string, anchor, vertices=6)
    create_cylinder_between("Bow_StringLower", (-0.10, 0.0, 0.0), (0.13, 0.0, -0.83), 0.010, string, anchor, vertices=6)

    projectile = ctx.socket("ProjectileOrigin")
    projectile.location = (0.90, -0.64, 0.58)
    return anchor
