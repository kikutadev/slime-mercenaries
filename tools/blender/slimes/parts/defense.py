from __future__ import annotations

import math

import bpy

from ..base.context import BuildContext
from ..base.primitives import create_box, create_disc, create_ellipsoid


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


def create_guardian_helm(ctx: BuildContext) -> bpy.types.Object:
    """Create a compact Tier-2 helm that strengthens the silhouette without hiding the face."""
    steel = ctx.material("GuardianSteel", (0.34, 0.48, 0.60, 1.0), roughness=0.30, metallic=0.62)
    edge = ctx.material("GuardianGold", (0.88, 0.55, 0.14, 1.0), roughness=0.29, metallic=0.40)
    cloth = ctx.material("GuardianPlume", (0.68, 0.08, 0.055, 1.0), roughness=0.60)

    anchor = bpy.data.objects.new("GuardianHelmAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("HeadSocket")

    # The dome sits on the crown and stays above the eye line. A front brow strip
    # gives a helmet read at gameplay scale without turning the slime humanoid.
    create_ellipsoid(
        "Guardian_HelmDome",
        (0.0, 0.03, 0.10),
        (0.56, 0.48, 0.28),
        steel,
        anchor,
        segments=28,
        rings=14,
    )
    create_box(
        "Guardian_HelmBrow",
        (0.76, 0.12, 0.11),
        (0.0, -0.43, -0.03),
        edge,
        anchor,
        bevel=0.035,
    )
    create_ellipsoid(
        "Guardian_HelmRivet_L",
        (-0.31, -0.49, -0.03),
        (0.055, 0.032, 0.055),
        edge,
        anchor,
        segments=14,
        rings=8,
    )
    create_ellipsoid(
        "Guardian_HelmRivet_R",
        (0.31, -0.49, -0.03),
        (0.055, 0.032, 0.055),
        edge,
        anchor,
        segments=14,
        rings=8,
    )

    # A restrained crest differentiates Guardian from Tier-1 Shield while
    # keeping the body and face as the dominant character language.
    create_box(
        "Guardian_HelmCrest",
        (0.12, 0.34, 0.31),
        (0.0, 0.03, 0.36),
        cloth,
        anchor,
        bevel=0.045,
    )
    return anchor


def create_guardian_tower_shield(ctx: BuildContext) -> bpy.types.Object:
    """Create Guardian's tall planted shield as a new builder, preserving Tier-1 Shield exactly."""
    steel = ctx.material("GuardianShieldSteel", (0.30, 0.43, 0.54, 1.0), roughness=0.31, metallic=0.58)
    face = ctx.material("GuardianShieldFace", (0.78, 0.71, 0.53, 1.0), roughness=0.44, metallic=0.08)
    gold = ctx.material("GuardianShieldGold", (0.90, 0.56, 0.14, 1.0), roughness=0.28, metallic=0.43)

    anchor = bpy.data.objects.new("GuardianShieldAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("OffhandSocket")

    # Physical front is local -Y. The shield is placed on screen-right, close
    # enough to read as planted protection but clear of both eyes and mouth.
    anchor.location = (0.93, -0.96, 0.72)
    anchor.rotation_euler[0] = math.radians(2.0)
    anchor.rotation_euler[2] = math.radians(-6.0)

    # Tall rounded plate: a beveled core supplies the vertical silhouette; the
    # top/bottom caps soften the toy-like form and prevent a prototype box read.
    create_box(
        "GuardianShield_Core",
        (0.70, 0.105, 1.06),
        (0.0, 0.0, 0.0),
        steel,
        anchor,
        bevel=0.085,
    )
    create_ellipsoid(
        "GuardianShield_UpperCap",
        (0.0, 0.0, 0.49),
        (0.35, 0.105, 0.24),
        steel,
        anchor,
        segments=24,
        rings=12,
    )
    create_ellipsoid(
        "GuardianShield_LowerCap",
        (0.0, 0.0, -0.49),
        (0.35, 0.105, 0.24),
        steel,
        anchor,
        segments=24,
        rings=12,
    )

    # Raised face panel and border accents remain shallow so the silhouette is
    # strong without wasting depth or increasing clipping risk during squash.
    create_box(
        "GuardianShield_FacePanel",
        (0.56, 0.055, 0.90),
        (0.0, -0.080, 0.0),
        face,
        anchor,
        bevel=0.065,
    )
    create_box(
        "GuardianShield_Spine",
        (0.10, 0.040, 0.88),
        (0.0, -0.122, 0.0),
        gold,
        anchor,
        bevel=0.025,
    )
    create_box(
        "GuardianShield_Crossbar",
        (0.50, 0.040, 0.10),
        (0.0, -0.123, 0.10),
        gold,
        anchor,
        bevel=0.025,
    )
    create_ellipsoid(
        "GuardianShield_Boss",
        (0.0, -0.165, 0.10),
        (0.135, 0.055, 0.135),
        gold,
        anchor,
        segments=20,
        rings=10,
    )
    return anchor
