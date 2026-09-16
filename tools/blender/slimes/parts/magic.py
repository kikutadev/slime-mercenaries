from __future__ import annotations

import math

import bpy
from mathutils import Vector

from ..base.context import BuildContext
from ..base.primitives import create_cylinder_between, create_ellipsoid


# The visible outer tip of the Tier-1 wand in WandAnchor-local coordinates.
# SpellOrigin is derived from this exact point so VFX cannot drift away from the model.
WAND_VISUAL_TIP_LOCAL = Vector((0.085, 0.0, 1.145))


def _create_tapered_segment(
    name: str,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    radius_start: float,
    radius_end: float,
    material: bpy.types.Material,
    parent: bpy.types.Object,
    *,
    vertices: int = 20,
) -> bpy.types.Object:
    """Create one tapered local-space segment between two points."""
    start_v = Vector(start)
    end_v = Vector(end)
    direction = end_v - start_v
    midpoint = (start_v + end_v) * 0.5

    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius_start,
        radius2=radius_end,
        depth=direction.length,
    )
    obj = bpy.context.active_object
    assert obj is not None
    obj.name = name
    obj.parent = parent
    obj.location = midpoint
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def _create_crystal(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material: bpy.types.Material,
    parent: bpy.types.Object,
) -> bpy.types.Object:
    """Create a faceted gem that stays readable at mobile character scale."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1.0)
    crystal = bpy.context.active_object
    assert crystal is not None
    crystal.name = name
    crystal.parent = parent
    crystal.location = location
    crystal.scale = scale
    crystal.rotation_euler = (math.radians(4.0), math.radians(-9.0), math.radians(22.0))
    crystal.data.materials.append(material)
    return crystal


def _set_spell_origin_from_wand_tip(ctx: BuildContext, wand: bpy.types.Object) -> None:
    """Place the shared SpellOrigin at the authored visible tip of the assembled wand."""
    bpy.context.view_layer.update()
    tip_world = wand.matrix_world @ WAND_VISUAL_TIP_LOCAL
    root_local_tip = ctx.root.matrix_world.inverted() @ tip_world

    spell_origin = ctx.socket("SpellOrigin")
    spell_origin.location = root_local_tip


def create_wand_and_cap(ctx: BuildContext) -> tuple[bpy.types.Object, bpy.types.Object]:
    """Create the Tier-1 magic kit without changing the canonical slime body."""
    wood = ctx.material("WandWood", (0.18, 0.070, 0.050, 1.0), roughness=0.78)
    wood_knot = ctx.material("WandWoodKnot", (0.095, 0.028, 0.050, 1.0), roughness=0.82)
    violet = ctx.material("MageViolet", (0.16, 0.065, 0.48, 1.0), roughness=0.48)
    violet_light = ctx.material("MageVioletLight", (0.43, 0.20, 0.86, 1.0), roughness=0.36)
    crystal = ctx.material("WandCrystal", (0.12, 0.34, 0.98, 1.0), roughness=0.12, metallic=0.08)

    # Keep the wand floating beside the slime rather than inventing an arm/hand.
    # The deliberate multi-kink shaft reads as a crafted magic wand instead of a straight pole.
    wand = bpy.data.objects.new("WandAnchor", None)
    bpy.context.scene.collection.objects.link(wand)
    wand.parent = ctx.socket("WeaponSocket")
    wand.location = (-0.92, -0.57, 0.43)
    wand.rotation_euler = (
        math.radians(-8.0),
        math.radians(-10.0),
        math.radians(10.0),
    )

    shaft_points = (
        (0.000, 0.000, -0.34),
        (0.018, 0.000, 0.13),
        (-0.075, 0.000, 0.48),
        (0.075, 0.000, 0.76),
    )
    shaft_radii = (0.053, 0.050, 0.047)
    for index, (start, end, radius) in enumerate(zip(shaft_points[:-1], shaft_points[1:], shaft_radii, strict=True), start=1):
        create_cylinder_between(
            f"Wand_Shaft_{index}",
            start,
            end,
            radius,
            wood,
            wand,
            vertices=10,
        )

    # Rounded knots make the crook feel intentionally wooden instead of accidentally segmented.
    create_ellipsoid("Wand_KnotLower", shaft_points[1], (0.068, 0.060, 0.068), wood_knot, wand, segments=14, rings=8)
    create_ellipsoid("Wand_KnotUpper", shaft_points[2], (0.064, 0.057, 0.064), wood_knot, wand, segments=14, rings=8)

    # A small fork cradles the gem and turns the top silhouette into an unmistakable magic focus.
    create_cylinder_between("Wand_Prong_L", shaft_points[-1], (0.000, -0.015, 0.965), 0.028, violet, wand, vertices=9)
    create_cylinder_between("Wand_Prong_R", shaft_points[-1], (0.165, 0.015, 0.965), 0.028, violet, wand, vertices=9)
    _create_crystal("Wand_Crystal", (0.085, 0.0, 1.015), (0.130, 0.105, 0.145), crystal, wand)

    # A small collar visually separates the floating equipment from the jelly body at gameplay scale.
    create_ellipsoid("Wand_GripGem", (0.006, 0.0, -0.18), (0.071, 0.058, 0.050), violet_light, wand, segments=14, rings=8)

    # The hat uses a flattened brim and two connected tapered sections. This avoids the old
    # 'cone + detached torus' silhouette that could read as a horn or circular ornament.
    cap = bpy.data.objects.new("HeadAccessoryAnchor", None)
    bpy.context.scene.collection.objects.link(cap)
    cap.parent = ctx.socket("HeadSocket")
    cap.location = (0.10, 0.065, 0.018)
    cap.rotation_euler[2] = math.radians(-8.0)

    create_ellipsoid("MageCap_Brim", (0.0, 0.0, 0.082), (0.385, 0.300, 0.055), violet, cap, segments=24, rings=10)
    _create_tapered_segment(
        "MageCap_Lower",
        (0.0, 0.0, 0.105),
        (-0.040, 0.016, 0.375),
        0.245,
        0.135,
        violet,
        cap,
        vertices=24,
    )
    _create_tapered_segment(
        "MageCap_Upper",
        (-0.040, 0.016, 0.355),
        (-0.165, 0.030, 0.590),
        0.142,
        0.045,
        violet_light,
        cap,
        vertices=22,
    )
    create_ellipsoid("MageCap_Tip", (-0.174, 0.032, 0.605), (0.060, 0.054, 0.065), violet_light, cap, segments=14, rings=8)
    create_ellipsoid("MageCap_Band", (0.0, -0.010, 0.128), (0.252, 0.205, 0.041), violet_light, cap, segments=22, rings=10)
    create_ellipsoid("MageCap_Focus", (0.018, -0.218, 0.145), (0.052, 0.033, 0.052), crystal, cap, segments=12, rings=7)

    _set_spell_origin_from_wand_tip(ctx, wand)
    return wand, cap
