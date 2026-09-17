from __future__ import annotations

import math

import bpy
from mathutils import Vector

from ..base.context import BuildContext
from ..base.primitives import create_box, create_cylinder_between, create_ellipsoid


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


def _create_ranger_hood_rim(
    *,
    parent: bpy.types.Object,
    material: bpy.types.Material,
) -> bpy.types.Object:
    """Create a soft open hood edge that frames the face without covering it."""
    curve_data = bpy.data.curves.new(name="Ranger_HoodRimCurve", type="CURVE")
    curve_data.dimensions = "3D"
    curve_data.bevel_depth = 0.042
    curve_data.bevel_resolution = 3
    curve_data.resolution_u = 3

    spline = curve_data.splines.new(type="BEZIER")
    points = [
        (-0.60, -0.53, -0.18),
        (-0.53, -0.50, -0.01),
        (-0.39, -0.46, 0.13),
        (-0.20, -0.43, 0.21),
        (0.00, -0.42, 0.24),
        (0.20, -0.43, 0.21),
        (0.39, -0.46, 0.13),
        (0.53, -0.50, -0.01),
        (0.60, -0.53, -0.18),
    ]
    spline.bezier_points.add(len(points) - 1)
    for point, coordinate in zip(spline.bezier_points, points, strict=True):
        point.co = coordinate
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"

    rim = bpy.data.objects.new("Ranger_HoodRim", curve_data)
    bpy.context.scene.collection.objects.link(rim)
    rim.parent = parent
    rim.data.materials.append(material)
    return rim


def create_ranger_hood(ctx: BuildContext) -> bpy.types.Object:
    """Create Ranger's light leaf-green cowl while keeping the shared face fully readable."""
    cloth = ctx.material("RangerHoodGreen", (0.075, 0.30, 0.105, 1.0), roughness=0.88)
    trim = ctx.material("RangerHoodTrim", (0.34, 0.58, 0.16, 1.0), roughness=0.80)

    anchor = bpy.data.objects.new("RangerHoodAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("HeadSocket")
    anchor.location = (0.0, 0.035, -0.025)

    cowl = create_ellipsoid(
        "Ranger_HoodCowl",
        (0.0, 0.10, 0.00),
        (0.61, 0.43, 0.27),
        cloth,
        anchor,
        segments=28,
        rings=14,
    )
    cowl.rotation_euler[0] = math.radians(-5.0)
    _create_ranger_hood_rim(parent=anchor, material=trim)

    tail = create_ellipsoid(
        "Ranger_HoodTail",
        (-0.36, 0.30, 0.055),
        (0.095, 0.21, 0.080),
        cloth,
        anchor,
        segments=14,
        rings=8,
    )
    tail.rotation_euler = (
        math.radians(18.0),
        math.radians(16.0),
        math.radians(34.0),
    )
    return anchor


def _create_ranger_arrow(
    *,
    parent: bpy.types.Object,
    shaft_material: bpy.types.Material,
    head_material: bpy.types.Material,
    feather_material: bpy.types.Material,
) -> None:
    """Create one nocked arrow aligned with local -Y, the actual projectile direction."""
    create_cylinder_between(
        "Ranger_ArrowShaft",
        (0.0, 0.23, 0.0),
        (0.0, -0.84, 0.0),
        0.018,
        shaft_material,
        parent,
        vertices=8,
    )

    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.055, radius2=0.0, depth=0.13)
    arrowhead = bpy.context.active_object
    assert arrowhead is not None
    arrowhead.name = "Ranger_ArrowHead"
    arrowhead.parent = parent
    arrowhead.location = (0.0, -0.905, 0.0)
    arrowhead.rotation_euler[0] = math.radians(90.0)
    arrowhead.data.materials.append(head_material)

    for name, x_offset, z_offset in (
        ("Ranger_FletchingL", -0.045, 0.0),
        ("Ranger_FletchingR", 0.045, 0.0),
        ("Ranger_FletchingTop", 0.0, 0.045),
    ):
        create_box(
            name,
            (0.040 if x_offset else 0.075, 0.12, 0.075 if x_offset else 0.040),
            (x_offset, 0.155, z_offset),
            feather_material,
            parent,
            bevel=0.010,
        )


def create_ranger_recurve_bow(ctx: BuildContext) -> bpy.types.Object:
    """Create the Ranger Tier-2 recurved bow without changing the accepted Tier-1 bow."""
    wood = ctx.material("RangerBowWood", (0.30, 0.13, 0.045, 1.0), roughness=0.72)
    limb = ctx.material("RangerBowLimb", (0.48, 0.25, 0.075, 1.0), roughness=0.70)
    wrap = ctx.material("RangerBowWrap", (0.08, 0.24, 0.085, 1.0), roughness=0.90)
    string = ctx.material("RangerBowString", (0.055, 0.060, 0.050, 1.0), roughness=0.98)
    arrow_wood = ctx.material("RangerArrowWood", (0.64, 0.44, 0.19, 1.0), roughness=0.80)
    arrow_head = ctx.material("RangerArrowHead", (0.58, 0.66, 0.70, 1.0), roughness=0.28, metallic=0.62)
    feathers = ctx.material("RangerArrowFeather", (0.55, 0.74, 0.18, 1.0), roughness=0.86)

    anchor = bpy.data.objects.new("RangerBowAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("WeaponSocket")
    anchor.location = (1.00, -0.55, 0.48)
    anchor.rotation_euler = (
        math.radians(3.0),
        math.radians(-10.0),
        math.radians(-8.0),
    )

    # Segmented limbs make the recurved silhouette legible at 40-72 px while keeping
    # the weapon visibly related to the accepted Bow Slime rather than becoming a new rig.
    create_cylinder_between("RangerBow_UpperInner", (0.0, 0.0, 0.12), (0.24, 0.0, 0.49), 0.052, wood, anchor)
    create_cylinder_between("RangerBow_UpperOuter", (0.24, 0.0, 0.49), (0.34, 0.0, 0.72), 0.045, limb, anchor)
    create_cylinder_between("RangerBow_UpperRecurve", (0.34, 0.0, 0.72), (0.15, 0.015, 0.93), 0.038, limb, anchor)
    create_cylinder_between("RangerBow_LowerInner", (0.0, 0.0, -0.12), (0.24, 0.0, -0.49), 0.052, wood, anchor)
    create_cylinder_between("RangerBow_LowerOuter", (0.24, 0.0, -0.49), (0.34, 0.0, -0.72), 0.045, limb, anchor)
    create_cylinder_between("RangerBow_LowerRecurve", (0.34, 0.0, -0.72), (0.15, 0.015, -0.93), 0.038, limb, anchor)
    create_cylinder_between("RangerBow_Grip", (0.0, 0.0, -0.14), (0.0, 0.0, 0.14), 0.068, wrap, anchor, vertices=12)

    # The string's center is pulled rearward (+Y), so the arrow points physically
    # forward (-Y) through the bow rather than along its decorative silhouette.
    nock = (0.0, 0.23, 0.0)
    create_cylinder_between("RangerBow_StringUpper", (0.15, 0.015, 0.93), nock, 0.009, string, anchor, vertices=6)
    create_cylinder_between("RangerBow_StringLower", nock, (0.15, 0.015, -0.93), 0.009, string, anchor, vertices=6)
    _create_ranger_arrow(
        parent=anchor,
        shaft_material=arrow_wood,
        head_material=arrow_head,
        feather_material=feathers,
    )

    bpy.context.view_layer.update()
    arrow_tip_world = anchor.matrix_world @ Vector((0.0, -0.97, 0.0))
    projectile = ctx.socket("ProjectileOrigin")
    projectile.location = ctx.root.matrix_world.inverted() @ arrow_tip_world
    return anchor


def create_ranger_quiver(ctx: BuildContext) -> bpy.types.Object:
    """Create a compact rear quiver whose arrow tips remain readable in shallow 3/4 views."""
    leather = ctx.material("RangerQuiverLeather", (0.24, 0.095, 0.035, 1.0), roughness=0.84)
    rim_material = ctx.material("RangerQuiverRim", (0.42, 0.20, 0.055, 1.0), roughness=0.76)
    shaft_material = ctx.material("RangerQuiverArrowWood", (0.66, 0.44, 0.18, 1.0), roughness=0.82)
    feather_material = ctx.material("RangerQuiverFeather", (0.49, 0.70, 0.16, 1.0), roughness=0.88)

    anchor = bpy.data.objects.new("RangerQuiverAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("BackSocket")
    anchor.location = (-0.50, 0.00, 0.16)
    anchor.rotation_euler = (
        math.radians(-8.0),
        math.radians(-13.0),
        math.radians(18.0),
    )

    create_cylinder_between("Ranger_QuiverBody", (0.0, 0.0, -0.20), (0.0, 0.0, 0.48), 0.145, leather, anchor, vertices=14)
    create_cylinder_between("Ranger_QuiverRim", (-0.16, 0.0, 0.49), (0.16, 0.0, 0.49), 0.032, rim_material, anchor, vertices=10)

    for index, (x_offset, y_offset, height) in enumerate(
        ((-0.075, 0.015, 0.92), (0.0, -0.015, 0.98), (0.075, 0.010, 0.89)),
        start=1,
    ):
        create_cylinder_between(
            f"Ranger_QuiverArrow{index}",
            (x_offset, y_offset, 0.34),
            (x_offset, y_offset, height),
            0.015,
            shaft_material,
            anchor,
            vertices=8,
        )
        create_box(
            f"Ranger_QuiverFletching{index}",
            (0.075, 0.035, 0.095),
            (x_offset, y_offset, height - 0.015),
            feather_material,
            anchor,
            bevel=0.010,
        )
    return anchor


def _create_tier3_arrow(
    *,
    prefix: str,
    parent: bpy.types.Object,
    shaft_material: bpy.types.Material,
    head_material: bpy.types.Material,
    feather_material: bpy.types.Material,
    start_y: float,
    tip_y: float,
    electric_tip_material: bpy.types.Material | None = None,
) -> bpy.types.Object:
    """Create a nocked Tier-3 arrow along physical forward (-Y) and return its tip marker."""
    create_cylinder_between(
        f"{prefix}_ArrowShaft",
        (0.0, start_y, 0.0),
        (0.0, tip_y + 0.12, 0.0),
        0.018,
        shaft_material,
        parent,
        vertices=8,
    )
    bpy.ops.mesh.primitive_cone_add(vertices=10, radius1=0.060, radius2=0.0, depth=0.15)
    arrowhead = bpy.context.active_object
    assert arrowhead is not None
    arrowhead.name = f"{prefix}_ArrowHead"
    arrowhead.parent = parent
    arrowhead.location = (0.0, tip_y + 0.045, 0.0)
    arrowhead.rotation_euler[0] = math.radians(90.0)
    arrowhead.data.materials.append(head_material)

    for name, x_offset, z_offset in (
        (f"{prefix}_FletchingL", -0.045, 0.0),
        (f"{prefix}_FletchingR", 0.045, 0.0),
        (f"{prefix}_FletchingTop", 0.0, 0.045),
    ):
        create_box(
            name,
            (0.040 if x_offset else 0.075, 0.12, 0.075 if x_offset else 0.040),
            (x_offset, start_y - 0.075, z_offset),
            feather_material,
            parent,
            bevel=0.010,
        )

    if electric_tip_material is not None:
        create_ellipsoid(
            f"{prefix}_ArrowCharge",
            (0.0, tip_y + 0.015, 0.0),
            (0.055, 0.105, 0.055),
            electric_tip_material,
            parent,
            segments=16,
            rings=9,
        )

    marker = bpy.data.objects.new(f"{prefix}ArrowTip", None)
    bpy.context.scene.collection.objects.link(marker)
    marker.parent = parent
    marker.location = (0.0, tip_y - 0.030, 0.0)
    return marker


def create_sniper_longbow(ctx: BuildContext) -> bpy.types.Object:
    """Create a tall precision longbow whose silhouette clearly exceeds Ranger Tier 2."""
    dark_wood = ctx.material("SniperBowDarkWood", (0.16, 0.070, 0.025, 1.0), roughness=0.68)
    limb = ctx.material("SniperBowLimb", (0.30, 0.15, 0.050, 1.0), roughness=0.60)
    string = ctx.material("SniperBowString", (0.035, 0.040, 0.045, 1.0), roughness=0.95)
    steel = ctx.material("SniperSightSteel", (0.34, 0.42, 0.50, 1.0), roughness=0.24, metallic=0.70)
    brass = ctx.material("SniperSightBrass", (0.82, 0.55, 0.14, 1.0), roughness=0.28, metallic=0.50)
    arrow_wood = ctx.material("SniperArrowWood", (0.48, 0.28, 0.10, 1.0), roughness=0.72)
    arrow_head = ctx.material("SniperArrowHead", (0.78, 0.86, 0.91, 1.0), roughness=0.18, metallic=0.78)
    feather = ctx.material("SniperArrowFeather", (0.88, 0.82, 0.50, 1.0), roughness=0.80)

    anchor = bpy.data.objects.new("SniperBowAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("WeaponSocket")
    anchor.location = (1.04, -0.57, 0.50)
    anchor.rotation_euler = (
        math.radians(2.0),
        math.radians(-7.0),
        math.radians(-6.0),
    )

    # Four long tapered-looking segments produce an unmistakably taller weapon
    # while avoiding a humanoid arm rig or any body-scale change.
    create_cylinder_between("SniperBow_UpperInner", (0.0, 0.0, 0.10), (0.23, 0.0, 0.64), 0.055, dark_wood, anchor, vertices=14)
    create_cylinder_between("SniperBow_UpperOuter", (0.24, 0.0, 0.70), (0.18, 0.0, 1.24), 0.043, limb, anchor, vertices=14)
    create_cylinder_between("SniperBow_UpperTip", (0.18, 0.0, 1.24), (0.055, 0.020, 1.48), 0.032, limb, anchor, vertices=12)
    create_cylinder_between("SniperBow_LowerInner", (0.0, 0.0, -0.10), (0.23, 0.0, -0.64), 0.055, dark_wood, anchor, vertices=14)
    create_cylinder_between("SniperBow_LowerOuter", (0.24, 0.0, -0.70), (0.18, 0.0, -1.24), 0.043, limb, anchor, vertices=14)
    create_cylinder_between("SniperBow_LowerTip", (0.18, 0.0, -1.24), (0.055, 0.020, -1.48), 0.032, limb, anchor, vertices=12)
    create_cylinder_between("SniperBow_Grip", (0.0, 0.0, -0.16), (0.0, 0.0, 0.16), 0.074, dark_wood, anchor, vertices=12)

    nock = (0.0, 0.31, 0.0)
    create_cylinder_between("SniperBow_StringUpper", (0.055, 0.020, 1.48), nock, 0.008, string, anchor, vertices=6)
    create_cylinder_between("SniperBow_StringLower", nock, (0.055, 0.020, -1.48), 0.008, string, anchor, vertices=6)

    # Readable mechanical sight: a small ring plus two bars on the upper limb.
    sight = bpy.data.objects.new("SniperSightAnchor", None)
    bpy.context.scene.collection.objects.link(sight)
    sight.parent = anchor
    sight.location = (-0.16, -0.13, 0.53)
    sight.rotation_euler[0] = math.radians(90.0)
    bpy.ops.mesh.primitive_torus_add(major_segments=20, minor_segments=7, major_radius=0.135, minor_radius=0.018)
    ring = bpy.context.active_object
    assert ring is not None
    ring.name = "SniperSight_Ring"
    ring.parent = sight
    ring.location = (0.0, 0.0, 0.0)
    ring.data.materials.append(brass)
    create_box("SniperSight_Vertical", (0.018, 0.018, 0.16), (0.0, 0.0, 0.0), steel, sight, bevel=0.005)
    create_box("SniperSight_Horizontal", (0.16, 0.018, 0.018), (0.0, 0.0, 0.0), steel, sight, bevel=0.005)

    tip = _create_tier3_arrow(
        prefix="Sniper",
        parent=anchor,
        shaft_material=arrow_wood,
        head_material=arrow_head,
        feather_material=feather,
        start_y=0.31,
        tip_y=-1.30,
    )
    bpy.context.view_layer.update()
    projectile = ctx.socket("ProjectileOrigin")
    projectile.location = ctx.root.matrix_world.inverted() @ tip.matrix_world.translation
    return anchor


def create_sniper_quiver(ctx: BuildContext) -> bpy.types.Object:
    """Add a narrow precision quiver with long arrow tips visible behind the slime."""
    leather = ctx.material("SniperQuiverLeather", (0.14, 0.055, 0.025, 1.0), roughness=0.84)
    metal = ctx.material("SniperQuiverMetal", (0.46, 0.52, 0.56, 1.0), roughness=0.30, metallic=0.58)
    shaft = ctx.material("SniperQuiverArrowWood", (0.46, 0.26, 0.10, 1.0), roughness=0.78)
    feather = ctx.material("SniperQuiverFeather", (0.83, 0.75, 0.42, 1.0), roughness=0.84)

    anchor = bpy.data.objects.new("SniperQuiverAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("BackSocket")
    anchor.location = (-0.52, 0.01, 0.18)
    anchor.rotation_euler = (math.radians(-7.0), math.radians(-9.0), math.radians(14.0))
    create_cylinder_between("Sniper_QuiverBody", (0.0, 0.0, -0.28), (0.0, 0.0, 0.54), 0.125, leather, anchor, vertices=14)
    create_cylinder_between("Sniper_QuiverRim", (-0.15, 0.0, 0.55), (0.15, 0.0, 0.55), 0.028, metal, anchor, vertices=10)
    for index, x in enumerate((-0.065, 0.0, 0.065), start=1):
        create_cylinder_between(f"Sniper_QuiverArrow{index}", (x, 0.0, 0.40), (x, 0.0, 1.08 + index * 0.03), 0.014, shaft, anchor, vertices=8)
        create_box(f"Sniper_QuiverFletching{index}", (0.070, 0.034, 0.105), (x, 0.0, 1.05 + index * 0.03), feather, anchor, bevel=0.008)
    return anchor


def _enable_ranged_emission(material: bpy.types.Material, strength: float = 1.7) -> None:
    if not material.use_nodes or material.node_tree is None:
        return
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        return
    if "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = tuple(bsdf.inputs["Base Color"].default_value)
    if "Emission Strength" in bsdf.inputs:
        bsdf.inputs["Emission Strength"].default_value = strength


def create_storm_feather_crest(ctx: BuildContext) -> bpy.types.Object:
    """Create Storm Archer's asymmetric feather crest without obscuring the face."""
    dark = ctx.material("StormCrestDark", (0.05, 0.23, 0.16, 1.0), roughness=0.86)
    green = ctx.material("StormCrestGreen", (0.20, 0.62, 0.24, 1.0), roughness=0.78)
    cyan = ctx.material("StormCrestCyan", (0.10, 0.82, 0.94, 1.0), roughness=0.32)
    _enable_ranged_emission(cyan, 1.35)

    anchor = bpy.data.objects.new("StormCrestAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("HeadSocket")
    anchor.location = (-0.28, 0.02, 0.18)
    anchor.rotation_euler[2] = math.radians(-10.0)

    specs = (
        ("StormCrest_FeatherRear", (-0.18, 0.04, 0.24), (0.095, 0.045, 0.28), dark, -34.0),
        ("StormCrest_FeatherMid", (0.0, 0.02, 0.31), (0.105, 0.050, 0.34), green, -10.0),
        ("StormCrest_FeatherFront", (0.18, -0.02, 0.25), (0.090, 0.045, 0.27), cyan, 20.0),
    )
    for name, location, scale, material, tilt in specs:
        feather = create_ellipsoid(name, location, scale, material, anchor, segments=16, rings=9)
        feather.rotation_euler[1] = math.radians(tilt)
    return anchor


def create_storm_archer_bow(ctx: BuildContext) -> bpy.types.Object:
    """Create an energized recurved bow with luminous tips and an electric arrow."""
    wood = ctx.material("StormBowWood", (0.11, 0.30, 0.10, 1.0), roughness=0.70)
    limb = ctx.material("StormBowLimb", (0.26, 0.58, 0.16, 1.0), roughness=0.62)
    string = ctx.material("StormBowString", (0.045, 0.10, 0.08, 1.0), roughness=0.90)
    electric = ctx.material("StormElectricCyan", (0.06, 0.77, 0.97, 1.0), roughness=0.22)
    arrow_wood = ctx.material("StormArrowWood", (0.38, 0.30, 0.10, 1.0), roughness=0.74)
    arrow_head = ctx.material("StormArrowHead", (0.28, 0.88, 1.0, 1.0), roughness=0.18, metallic=0.18)
    feather = ctx.material("StormArrowFeather", (0.40, 0.85, 0.26, 1.0), roughness=0.74)
    _enable_ranged_emission(electric, 2.2)
    _enable_ranged_emission(arrow_head, 1.8)

    anchor = bpy.data.objects.new("StormBowAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("WeaponSocket")
    anchor.location = (1.00, -0.55, 0.48)
    anchor.rotation_euler = (math.radians(2.0), math.radians(-9.0), math.radians(-9.0))

    create_cylinder_between("StormBow_UpperInner", (0.0, 0.0, 0.11), (0.25, 0.0, 0.48), 0.052, wood, anchor, vertices=14)
    create_cylinder_between("StormBow_UpperOuter", (0.25, 0.0, 0.48), (0.34, 0.0, 0.72), 0.043, limb, anchor, vertices=14)
    create_cylinder_between("StormBow_UpperRecurve", (0.34, 0.0, 0.72), (0.12, 0.02, 0.96), 0.035, limb, anchor, vertices=12)
    create_cylinder_between("StormBow_LowerInner", (0.0, 0.0, -0.11), (0.25, 0.0, -0.48), 0.052, wood, anchor, vertices=14)
    create_cylinder_between("StormBow_LowerOuter", (0.25, 0.0, -0.48), (0.34, 0.0, -0.72), 0.043, limb, anchor, vertices=14)
    create_cylinder_between("StormBow_LowerRecurve", (0.34, 0.0, -0.72), (0.12, 0.02, -0.96), 0.035, limb, anchor, vertices=12)
    create_cylinder_between("StormBow_Grip", (0.0, 0.0, -0.14), (0.0, 0.0, 0.14), 0.067, wood, anchor, vertices=12)

    nock = (0.0, 0.26, 0.0)
    create_cylinder_between("StormBow_StringUpper", (0.12, 0.02, 0.96), nock, 0.008, string, anchor, vertices=6)
    create_cylinder_between("StormBow_StringLower", nock, (0.12, 0.02, -0.96), 0.008, string, anchor, vertices=6)

    # Crystal-like tip modules and narrow energized rails survive mobile scale without
    # reading as generic glowing spheres or a recolored Ranger bow.
    for label, z, rotation_x in (("Upper", 0.99, 0.0), ("Lower", -0.99, math.pi)):
        bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.075, radius2=0.018, depth=0.22)
        crystal = bpy.context.active_object
        assert crystal is not None
        crystal.name = f"StormBow_ElectricTip{label}"
        crystal.parent = anchor
        crystal.location = (0.12, 0.02, z)
        crystal.rotation_euler[0] = rotation_x
        crystal.data.materials.append(electric)
        spark_anchor = bpy.data.objects.new(f"StormTip{label}Anchor", None)
        bpy.context.scene.collection.objects.link(spark_anchor)
        spark_anchor.parent = anchor
        spark_anchor.location = (0.12, 0.02, z)
    create_cylinder_between("StormBow_ElectricRailUpper", (0.28, -0.018, 0.60), (0.13, -0.018, 0.91), 0.018, electric, anchor, vertices=8)
    create_cylinder_between("StormBow_ElectricRailLower", (0.28, -0.018, -0.60), (0.13, -0.018, -0.91), 0.018, electric, anchor, vertices=8)

    tip = _create_tier3_arrow(
        prefix="Storm",
        parent=anchor,
        shaft_material=arrow_wood,
        head_material=arrow_head,
        feather_material=feather,
        start_y=0.26,
        tip_y=-1.02,
        electric_tip_material=electric,
    )
    bpy.context.view_layer.update()
    projectile = ctx.socket("ProjectileOrigin")
    projectile.location = ctx.root.matrix_world.inverted() @ tip.matrix_world.translation
    return anchor
