from __future__ import annotations

import math

import bpy

from ..base.context import BuildContext
from ..base.primitives import create_box, create_ellipsoid


def _create_dagger_blade(
    *,
    parent: bpy.types.Object,
    material: bpy.types.Material,
) -> bpy.types.Object:
    """Create a broad, tapered double-edged blade that survives mobile-scale rendering."""
    half_width_base = 0.145
    half_width_mid = 0.118
    half_thickness = 0.036
    base_z = 0.055
    mid_z = 0.43
    tip_z = 0.72

    vertices = [
        (-half_width_base, -half_thickness, base_z),
        (half_width_base, -half_thickness, base_z),
        (half_width_base, half_thickness, base_z),
        (-half_width_base, half_thickness, base_z),
        (-half_width_mid, -half_thickness, mid_z),
        (half_width_mid, -half_thickness, mid_z),
        (half_width_mid, half_thickness, mid_z),
        (-half_width_mid, half_thickness, mid_z),
        (0.0, -half_thickness * 0.60, tip_z),
        (0.0, half_thickness * 0.60, tip_z),
    ]
    faces = [
        (0, 1, 2, 3),
        (0, 4, 5, 1),
        (3, 2, 6, 7),
        (0, 3, 7, 4),
        (1, 5, 6, 2),
        (4, 7, 9, 8),
        (4, 8, 5),
        (5, 8, 9, 6),
        (6, 9, 7),
    ]

    mesh = bpy.data.meshes.new("Dagger_BladeMesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()

    blade = bpy.data.objects.new("Dagger_Blade", mesh)
    bpy.context.scene.collection.objects.link(blade)
    blade.parent = parent
    blade.data.materials.append(material)

    bevel = blade.modifiers.new(name="BladeEdgeSoftening", type="BEVEL")
    bevel.width = 0.012
    bevel.segments = 2
    return blade


def create_rogue_dagger(ctx: BuildContext) -> bpy.types.Object:
    """Create one short, high-contrast dagger mounted visibly outside the slime body."""
    blade_material = ctx.material(
        "DaggerSteel",
        (0.72, 0.80, 0.90, 1.0),
        roughness=0.20,
        metallic=0.78,
    )
    edge_material = ctx.material(
        "DaggerEdge",
        (0.92, 0.96, 1.0, 1.0),
        roughness=0.16,
        metallic=0.62,
    )
    guard_material = ctx.material(
        "DaggerGuard",
        (0.18, 0.12, 0.36, 1.0),
        roughness=0.40,
        metallic=0.34,
    )
    grip_material = ctx.material(
        "DaggerGrip",
        (0.045, 0.030, 0.09, 1.0),
        roughness=0.82,
    )

    anchor = bpy.data.objects.new("WeaponAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("WeaponSocket")
    # Front is local -Y. Keep the dagger clearly outside the body on screen-left,
    # angled away from the face and forward enough to avoid disappearing into the jelly.
    anchor.location = (-1.00, -0.67, 0.34)
    anchor.rotation_euler = (
        math.radians(-8.0),
        math.radians(-34.0),
        math.radians(38.0),
    )

    _create_dagger_blade(parent=anchor, material=blade_material)
    # A slim bright center ridge improves the blade read at 40–72 CSS px without
    # turning the weapon into a long sword.
    create_box(
        "Dagger_CenterRidge",
        (0.028, 0.043, 0.27),
        (0.0, -0.004, 0.31),
        edge_material,
        anchor,
        bevel=0.010,
    )
    create_box(
        "Dagger_Guard",
        (0.30, 0.085, 0.055),
        (0.0, 0.0, 0.015),
        guard_material,
        anchor,
        bevel=0.018,
    )
    create_box(
        "Dagger_Grip",
        (0.082, 0.072, 0.23),
        (0.0, 0.0, -0.135),
        grip_material,
        anchor,
        bevel=0.014,
    )

    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=1.0)
    pommel = bpy.context.active_object
    assert pommel is not None
    pommel.name = "Dagger_Pommel"
    pommel.parent = anchor
    pommel.location = (0.0, 0.0, -0.285)
    pommel.scale = (0.073, 0.073, 0.073)
    pommel.data.materials.append(guard_material)

    weapon_tip = bpy.data.objects.new("WeaponTip", None)
    bpy.context.scene.collection.objects.link(weapon_tip)
    weapon_tip.parent = anchor
    weapon_tip.location = (0.0, 0.0, 0.72)
    return anchor


def _create_hood_opening_rim(
    *,
    parent: bpy.types.Object,
    material: bpy.types.Material,
) -> bpy.types.Object:
    """Create one continuous open-face hood rim instead of disconnected ear-like flaps."""
    curve_data = bpy.data.curves.new(name="Hood_RimCurve", type="CURVE")
    curve_data.dimensions = "3D"
    curve_data.bevel_depth = 0.036
    curve_data.bevel_resolution = 3
    curve_data.resolution_u = 3

    spline = curve_data.splines.new(type="BEZIER")
    points = [
        (-0.57, -0.59, -0.19),
        (-0.52, -0.54, -0.03),
        (-0.38, -0.47, 0.10),
        (-0.20, -0.43, 0.16),
        (0.00, -0.41, 0.18),
        (0.20, -0.43, 0.16),
        (0.38, -0.47, 0.10),
        (0.52, -0.54, -0.03),
        (0.57, -0.59, -0.19),
    ]
    spline.bezier_points.add(len(points) - 1)
    for point, coordinate in zip(spline.bezier_points, points, strict=True):
        point.co = coordinate
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"

    rim = bpy.data.objects.new("Hood_Rim", curve_data)
    bpy.context.scene.collection.objects.link(rim)
    rim.parent = parent
    rim.data.materials.append(material)
    return rim


def create_small_hood(ctx: BuildContext) -> bpy.types.Object:
    """Create a tiny rear-biased cowl with an open rim that never covers the large face."""
    cloth = ctx.material("RogueHood", (0.030, 0.018, 0.105, 1.0), roughness=0.88)
    anchor = bpy.data.objects.new("HeadAccessoryAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("HeadSocket")
    anchor.location = (0.0, 0.02, -0.035)

    # The crown is shifted rearward so its lower half sinks into the shared jelly body.
    # Only a small cowl remains visible above the head rather than a helmet-sized cap.
    crown = create_ellipsoid(
        "Hood_Cowl",
        (0.0, 0.10, -0.005),
        (0.59, 0.43, 0.24),
        cloth,
        anchor,
        segments=28,
        rings=14,
    )
    crown.rotation_euler[0] = math.radians(-5.0)

    _create_hood_opening_rim(parent=anchor, material=cloth)

    # A compact trailing cloth point gives the static silhouette a forward-leaning,
    # skirmisher feel while staying entirely behind the face and away from humanoid anatomy.
    tail = create_ellipsoid(
        "Hood_Tail",
        (0.38, 0.30, 0.055),
        (0.085, 0.19, 0.075),
        cloth,
        anchor,
        segments=14,
        rings=8,
    )
    tail.rotation_euler = (
        math.radians(18.0),
        math.radians(-18.0),
        math.radians(-34.0),
    )
    return anchor


def _create_offhand_dagger_blade(
    *,
    parent: bpy.types.Object,
    material: bpy.types.Material,
) -> bpy.types.Object:
    """Create the Rogue Tier-2 secondary blade with a deliberately shorter silhouette."""
    half_width_base = 0.132
    half_width_mid = 0.108
    half_thickness = 0.032
    base_z = 0.050
    mid_z = 0.385
    tip_z = 0.655

    vertices = [
        (-half_width_base, -half_thickness, base_z),
        (half_width_base, -half_thickness, base_z),
        (half_width_base, half_thickness, base_z),
        (-half_width_base, half_thickness, base_z),
        (-half_width_mid, -half_thickness, mid_z),
        (half_width_mid, -half_thickness, mid_z),
        (half_width_mid, half_thickness, mid_z),
        (-half_width_mid, half_thickness, mid_z),
        (0.0, -half_thickness * 0.60, tip_z),
        (0.0, half_thickness * 0.60, tip_z),
    ]
    faces = [
        (0, 1, 2, 3),
        (0, 4, 5, 1),
        (3, 2, 6, 7),
        (0, 3, 7, 4),
        (1, 5, 6, 2),
        (4, 7, 9, 8),
        (4, 8, 5),
        (5, 8, 9, 6),
        (6, 9, 7),
    ]

    mesh = bpy.data.meshes.new("Rogue_Offhand_BladeMesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()

    blade = bpy.data.objects.new("Rogue_Offhand_Blade", mesh)
    bpy.context.scene.collection.objects.link(blade)
    blade.parent = parent
    blade.data.materials.append(material)

    bevel = blade.modifiers.new(name="BladeEdgeSoftening", type="BEVEL")
    bevel.width = 0.011
    bevel.segments = 2
    return blade


def create_rogue_offhand_dagger(ctx: BuildContext) -> bpy.types.Object:
    """Add Rogue Tier-2's shorter secondary dagger without changing the Tier-1 weapon."""
    blade_material = ctx.material(
        "DaggerSteel",
        (0.72, 0.80, 0.90, 1.0),
        roughness=0.20,
        metallic=0.78,
    )
    edge_material = ctx.material(
        "DaggerEdge",
        (0.92, 0.96, 1.0, 1.0),
        roughness=0.16,
        metallic=0.62,
    )
    guard_material = ctx.material(
        "DaggerGuard",
        (0.18, 0.12, 0.36, 1.0),
        roughness=0.40,
        metallic=0.34,
    )
    grip_material = ctx.material(
        "DaggerGrip",
        (0.045, 0.030, 0.09, 1.0),
        roughness=0.82,
    )

    anchor = bpy.data.objects.new("OffhandAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("OffhandSocket")
    # Mirror the branch vocabulary onto the physical front-right, but keep it
    # shorter/lower than the primary blade so the Tier-2 silhouette stays compact
    # and intentionally asymmetric instead of becoming a rigid X of identical swords.
    anchor.location = (0.89, -0.71, 0.265)
    anchor.rotation_euler = (
        math.radians(-10.0),
        math.radians(29.0),
        math.radians(-32.0),
    )

    _create_offhand_dagger_blade(parent=anchor, material=blade_material)
    create_box(
        "Rogue_Offhand_CenterRidge",
        (0.025, 0.039, 0.245),
        (0.0, -0.004, 0.286),
        edge_material,
        anchor,
        bevel=0.009,
    )
    create_box(
        "Rogue_Offhand_Guard",
        (0.265, 0.080, 0.052),
        (0.0, 0.0, 0.014),
        guard_material,
        anchor,
        bevel=0.017,
    )
    create_box(
        "Rogue_Offhand_Grip",
        (0.076, 0.068, 0.205),
        (0.0, 0.0, -0.122),
        grip_material,
        anchor,
        bevel=0.013,
    )

    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=1.0)
    pommel = bpy.context.active_object
    assert pommel is not None
    pommel.name = "Rogue_Offhand_Pommel"
    pommel.parent = anchor
    pommel.location = (0.0, 0.0, -0.258)
    pommel.scale = (0.066, 0.066, 0.066)
    pommel.data.materials.append(guard_material)

    weapon_tip = bpy.data.objects.new("OffhandWeaponTip", None)
    bpy.context.scene.collection.objects.link(weapon_tip)
    weapon_tip.parent = anchor
    weapon_tip.location = (0.0, 0.0, 0.655)
    return anchor


def create_rogue_tier2_hood_accents(ctx: BuildContext) -> bpy.types.Object:
    """Strengthen the dark hood read with compact rear folds that never cover the face."""
    shadow = ctx.material(
        "RogueHoodShadow",
        (0.014, 0.008, 0.052, 1.0),
        roughness=0.92,
    )
    anchor = bpy.data.objects.new("RogueTier2HoodAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("HeadSocket")
    anchor.location = (0.0, 0.025, -0.040)

    # A low rear fold makes the hood read as layered cloth rather than a helmet.
    back_fold = create_ellipsoid(
        "Rogue_Hood_BackFold",
        (-0.035, 0.285, -0.145),
        (0.47, 0.19, 0.105),
        shadow,
        anchor,
        segments=22,
        rings=12,
    )
    back_fold.rotation_euler[0] = math.radians(-7.0)

    # One longer rear-right fold preserves the branch's compact asymmetry and
    # visually balances the shorter offhand dagger without creating a scarf.
    side_fold = create_ellipsoid(
        "Rogue_Hood_SideFold",
        (0.43, 0.285, -0.020),
        (0.070, 0.205, 0.058),
        shadow,
        anchor,
        segments=14,
        rings=8,
    )
    side_fold.rotation_euler = (
        math.radians(18.0),
        math.radians(-12.0),
        math.radians(-40.0),
    )
    return anchor
