from __future__ import annotations

import math

import bpy

from ..base.context import BuildContext
from ..base.primitives import create_disc, create_ellipsoid


def _create_torus(
    name: str,
    *,
    major_radius: float,
    minor_radius: float,
    location: tuple[float, float, float],
    material: bpy.types.Material,
    parent: bpy.types.Object,
) -> bpy.types.Object:
    """Create a smooth toy-like ring used to give defensive parts a soft readable rim."""
    bpy.ops.mesh.primitive_torus_add(
        major_segments=32,
        minor_segments=10,
        major_radius=major_radius,
        minor_radius=minor_radius,
    )
    obj = bpy.context.active_object
    assert obj is not None
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def create_round_shield(ctx: BuildContext) -> bpy.types.Object:
    """Create the Tier-1 body-sized round shield without obscuring the shared face."""
    cream = ctx.material("ShieldCream", (0.84, 0.76, 0.56, 1.0), roughness=0.46, metallic=0.04)
    gold = ctx.material("ShieldGold", (0.92, 0.59, 0.16, 1.0), roughness=0.27, metallic=0.42)

    anchor = bpy.data.objects.new("ShieldAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("OffhandSocket")

    # Face is local -Y. Keep the shield in front-right, clear of the eye line,
    # ahead of the maximum shared Squash envelope, and above the ground plane.
    anchor.location = (0.92, -1.03, 0.66)
    anchor.rotation_euler[0] = math.radians(90.0)
    anchor.rotation_euler[2] = math.radians(-8.0)

    # A gold backing disc supplies real thickness and a broad silhouette border.
    # The slightly convex cream face and rounded torus rim remove the prototype's
    # flat stacked-disc look while staying readable at mobile gameplay size.
    backing = create_disc("Shield_Disc", 0.585, 0.105, gold, anchor, vertices=32)
    for polygon in backing.data.polygons:
        polygon.use_smooth = True

    create_ellipsoid(
        "Shield_Face",
        (0.0, 0.0, 0.085),
        (0.515, 0.515, 0.105),
        cream,
        anchor,
        segments=28,
        rings=16,
    )
    _create_torus(
        "Shield_Rim",
        major_radius=0.548,
        minor_radius=0.058,
        location=(0.0, 0.0, 0.105),
        material=gold,
        parent=anchor,
    )

    # The boss is deliberately smaller and flatter than the prototype so the
    # cream face remains the dominant readable area instead of looking like a plate.
    create_ellipsoid(
        "Shield_Boss",
        (0.0, 0.0, 0.205),
        (0.135, 0.135, 0.072),
        gold,
        anchor,
        segments=20,
        rings=12,
    )
    return anchor
