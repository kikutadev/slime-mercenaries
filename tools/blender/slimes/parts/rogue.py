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


# ---------------------------------------------------------------------------
# Tier 3 — Ninja / Assassin
# ---------------------------------------------------------------------------


def _create_shuriken_mesh(
    *,
    name: str,
    parent: bpy.types.Object,
    material: bpy.types.Material,
    outer_radius: float = 0.28,
    inner_radius: float = 0.105,
    thickness: float = 0.035,
) -> bpy.types.Object:
    """Create a chunky four-point throwing star readable at mobile gameplay size."""
    profile: list[tuple[float, float]] = []
    for index in range(8):
        angle = math.radians(90.0 - index * 45.0)
        radius = outer_radius if index % 2 == 0 else inner_radius
        profile.append((math.cos(angle) * radius, math.sin(angle) * radius))

    half_depth = thickness * 0.5
    vertices = [(x, -half_depth, z) for x, z in profile]
    vertices.extend((x, half_depth, z) for x, z in profile)
    front = tuple(range(8))
    back = tuple(range(15, 7, -1))
    faces: list[tuple[int, ...]] = [front, back]
    for index in range(8):
        nxt = (index + 1) % 8
        faces.append((index, nxt, 8 + nxt, 8 + index))

    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.data.materials.append(material)

    bevel = obj.modifiers.new(name="ShurikenEdgeSoftening", type="BEVEL")
    bevel.width = 0.010
    bevel.segments = 2
    return obj


def create_ninja_shuriken(ctx: BuildContext) -> bpy.types.Object:
    """Create Ninja's single readable throwing star on the physical front-left."""
    steel = ctx.material(
        "NinjaShurikenSteel",
        (0.35, 0.43, 0.55, 1.0),
        roughness=0.26,
        metallic=0.74,
    )
    hub_material = ctx.material(
        "NinjaShurikenHub",
        (0.09, 0.07, 0.17, 1.0),
        roughness=0.52,
        metallic=0.24,
    )

    anchor = bpy.data.objects.new("WeaponAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("WeaponSocket")
    # Front is local -Y. The star floats just outside the body, as if the jelly is
    # pinching it directly, so no humanoid hand/arm vocabulary is introduced.
    anchor.location = (-0.93, -0.73, 0.50)
    anchor.rotation_euler = (
        math.radians(-8.0),
        math.radians(-20.0),
        math.radians(12.0),
    )

    _create_shuriken_mesh(
        name="Ninja_Shuriken",
        parent=anchor,
        material=steel,
        outer_radius=0.29,
        inner_radius=0.108,
        thickness=0.042,
    )
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=1.0)
    hub = bpy.context.active_object
    assert hub is not None
    hub.name = "Ninja_ShurikenHub"
    hub.parent = anchor
    hub.scale = (0.058, 0.050, 0.058)
    hub.data.materials.append(hub_material)

    tip = bpy.data.objects.new("WeaponTip", None)
    bpy.context.scene.collection.objects.link(tip)
    tip.parent = anchor
    tip.location = (0.0, 0.0, 0.29)
    return anchor


def _create_scarf_tail(
    *,
    name: str,
    parent: bpy.types.Object,
    material: bpy.types.Material,
    length: float,
    width: float,
    bend: float,
) -> bpy.types.Object:
    """Create a tapered ribbon tail in the XZ plane with minimal thickness."""
    half_width = width * 0.5
    # The tail grows toward +X and bends slightly in Z. Its root stays compact at
    # the rear socket, while the free end becomes the readable silhouette cue.
    points = [
        (0.0, -half_width),
        (0.0, half_width),
        (length * 0.52, half_width * 0.88 + bend * 0.42),
        (length, half_width * 0.50 + bend),
        (length * 0.94, -half_width * 0.50 + bend - width * 0.22),
        (length * 0.50, -half_width * 0.88 + bend * 0.36),
    ]
    # Author in X/Z and extrude along Y, which is depth in the Blender source scene.
    depth = 0.035
    vertices = [(x, -depth, z) for x, z in points]
    vertices.extend((x, depth, z) for x, z in points)
    front = tuple(range(6))
    back = tuple(range(11, 5, -1))
    faces: list[tuple[int, ...]] = [front, back]
    for index in range(6):
        nxt = (index + 1) % 6
        faces.append((index, nxt, 6 + nxt, 6 + index))

    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.data.materials.append(material)
    bevel = obj.modifiers.new(name="ClothEdgeSoftening", type="BEVEL")
    bevel.width = 0.018
    bevel.segments = 2
    return obj


def create_ninja_scarf_and_plate(ctx: BuildContext) -> tuple[bpy.types.Object, bpy.types.Object]:
    """Add two visible scarf tails plus a compact forehead plate without hiding the face."""
    scarf = ctx.material("NinjaScarf", (0.18, 0.035, 0.11, 1.0), roughness=0.88)
    scarf_shadow = ctx.material("NinjaScarfShadow", (0.12, 0.018, 0.070, 1.0), roughness=0.92)
    plate = ctx.material(
        "NinjaForeheadPlate",
        (0.46, 0.53, 0.62, 1.0),
        roughness=0.31,
        metallic=0.62,
    )
    plate_mark = ctx.material("NinjaPlateMark", (0.10, 0.08, 0.16, 1.0), roughness=0.66)

    scarf_anchor = bpy.data.objects.new("NinjaScarfAnchor", None)
    bpy.context.scene.collection.objects.link(scarf_anchor)
    scarf_anchor.parent = ctx.socket("BackSocket")
    scarf_anchor.location = (0.18, 0.06, 0.02)
    scarf_anchor.rotation_euler = (
        math.radians(7.0),
        math.radians(-9.0),
        math.radians(-11.0),
    )

    knot = create_ellipsoid(
        "Ninja_ScarfKnot",
        (0.18, 0.0, 0.08),
        (0.13, 0.075, 0.11),
        scarf_shadow,
        scarf_anchor,
        segments=16,
        rings=10,
    )
    knot.rotation_euler[1] = math.radians(-12.0)

    upper = _create_scarf_tail(
        name="Ninja_ScarfTail_Upper",
        parent=scarf_anchor,
        material=scarf,
        length=0.74,
        width=0.18,
        bend=0.10,
    )
    upper.location = (0.18, -0.035, 0.18)
    upper.rotation_euler[0] = math.radians(5.0)
    upper.rotation_euler[2] = math.radians(18.0)

    lower = _create_scarf_tail(
        name="Ninja_ScarfTail_Lower",
        parent=scarf_anchor,
        material=scarf_shadow,
        length=0.66,
        width=0.15,
        bend=-0.16,
    )
    lower.location = (0.24, 0.035, 0.24)
    lower.rotation_euler[0] = math.radians(-5.0)
    lower.rotation_euler[2] = math.radians(-14.0)

    head_anchor = bpy.data.objects.new("NinjaHeadAnchor", None)
    bpy.context.scene.collection.objects.link(head_anchor)
    head_anchor.parent = ctx.socket("HeadSocket")
    head_anchor.location = (0.0, 0.0, -0.035)

    # A narrow plate sits above the eye line. The large eye area remains completely open.
    create_box(
        "Ninja_ForeheadPlate",
        (0.40, 0.050, 0.105),
        (0.0, -0.825, -0.235),
        plate,
        head_anchor,
        bevel=0.030,
    )
    create_box(
        "Ninja_PlateMark",
        (0.105, 0.056, 0.026),
        (0.0, -0.833, -0.234),
        plate_mark,
        head_anchor,
        bevel=0.010,
    )
    return scarf_anchor, head_anchor


def _create_curved_blade_mesh(
    *,
    name: str,
    parent: bpy.types.Object,
    material: bpy.types.Material,
    mirrored: bool,
) -> tuple[bpy.types.Object, tuple[float, float, float]]:
    """Create a visibly hooked short blade with an explicit physical tip coordinate."""
    sign = -1.0 if mirrored else 1.0
    # Outer edge swells away from the handle and then hooks back inward at the tip.
    # The inner edge is strongly concave so the silhouette still reads as curved at 96 px.
    profile = [
        (-0.120 * sign, 0.050),
        (0.020 * sign, 0.075),
        (0.170 * sign, 0.220),
        (0.260 * sign, 0.400),
        (0.285 * sign, 0.565),
        (0.235 * sign, 0.700),
        (0.105 * sign, 0.790),
        (-0.020 * sign, 0.825),  # physical hooked tip
        (0.045 * sign, 0.660),
        (0.095 * sign, 0.500),
        (0.055 * sign, 0.335),
        (-0.055 * sign, 0.170),
    ]
    thickness = 0.042
    vertices = [(x, -thickness, z) for x, z in profile]
    vertices.extend((x, thickness, z) for x, z in profile)
    count = len(profile)
    front = tuple(range(count))
    back = tuple(range(count * 2 - 1, count - 1, -1))
    faces: list[tuple[int, ...]] = [front, back]
    for index in range(count):
        nxt = (index + 1) % count
        faces.append((index, nxt, count + nxt, count + index))

    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    blade = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(blade)
    blade.parent = parent
    blade.data.materials.append(material)
    bevel = blade.modifiers.new(name="CurvedBladeEdgeSoftening", type="BEVEL")
    bevel.width = 0.012
    bevel.segments = 2
    return blade, (-0.020 * sign, 0.0, 0.825)


def _create_assassin_blade(
    ctx: BuildContext,
    *,
    offhand: bool,
) -> bpy.types.Object:
    """Create one compact curved execution blade and place its tip socket on the actual mesh tip."""
    steel = ctx.material(
        "AssassinBladeSteel",
        (0.52, 0.60, 0.70, 1.0),
        roughness=0.22,
        metallic=0.80,
    )
    grip = ctx.material("AssassinBladeGrip", (0.035, 0.022, 0.060, 1.0), roughness=0.86)
    guard = ctx.material(
        "AssassinBladeGuard",
        (0.14, 0.10, 0.24, 1.0),
        roughness=0.44,
        metallic=0.30,
    )

    anchor_name = "OffhandAnchor" if offhand else "WeaponAnchor"
    socket_name = "OffhandSocket" if offhand else "WeaponSocket"
    tip_name = "OffhandWeaponTip" if offhand else "WeaponTip"
    anchor = bpy.data.objects.new(anchor_name, None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket(socket_name)

    if offhand:
        anchor.location = (0.94, -0.70, 0.29)
        anchor.rotation_euler = (
            math.radians(-9.0),
            math.radians(27.0),
            math.radians(-37.0),
        )
    else:
        anchor.location = (-0.98, -0.70, 0.31)
        anchor.rotation_euler = (
            math.radians(-9.0),
            math.radians(-29.0),
            math.radians(39.0),
        )

    _, tip_coordinate = _create_curved_blade_mesh(
        name="Assassin_OffhandBlade" if offhand else "Assassin_PrimaryBlade",
        parent=anchor,
        material=steel,
        mirrored=offhand,
    )
    create_box(
        "Assassin_OffhandGuard" if offhand else "Assassin_PrimaryGuard",
        (0.255, 0.083, 0.052),
        (0.0, 0.0, 0.020),
        guard,
        anchor,
        bevel=0.016,
    )
    create_box(
        "Assassin_OffhandGrip" if offhand else "Assassin_PrimaryGrip",
        (0.076, 0.070, 0.205),
        (0.0, 0.0, -0.120),
        grip,
        anchor,
        bevel=0.013,
    )
    tip = bpy.data.objects.new(tip_name, None)
    bpy.context.scene.collection.objects.link(tip)
    tip.parent = anchor
    tip.location = tip_coordinate
    return anchor


def create_assassin_blades(ctx: BuildContext) -> tuple[bpy.types.Object, bpy.types.Object]:
    """Create the restrained pair of curved blades that define Assassin's execution silhouette."""
    return (
        _create_assassin_blade(ctx, offhand=False),
        _create_assassin_blade(ctx, offhand=True),
    )


def create_assassin_mask(ctx: BuildContext) -> bpy.types.Object:
    """Create a narrow lower-face cloth band while leaving both eyes fully visible."""
    cloth = ctx.material("AssassinMask", (0.020, 0.012, 0.050, 1.0), roughness=0.94)
    trim = ctx.material("AssassinMaskTrim", (0.12, 0.065, 0.18, 1.0), roughness=0.78)
    anchor = bpy.data.objects.new("AssassinMaskAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("HeadSocket")
    anchor.location = (0.0, 0.0, -0.035)

    # Flat, shallow cloth strip rather than a face-sized ellipsoid. The slight downward
    # center follows the jelly face and reads as a restrained mask at gameplay scale.
    outline = [
        (-0.39, -0.490),
        (-0.20, -0.512),
        (0.00, -0.522),
        (0.20, -0.512),
        (0.39, -0.490),
        (0.35, -0.595),
        (0.18, -0.612),
        (0.00, -0.620),
        (-0.18, -0.612),
        (-0.35, -0.595),
    ]
    depth = 0.030
    y = -1.035
    vertices = [(x, y - depth, z) for x, z in outline]
    vertices.extend((x, y + depth, z) for x, z in outline)
    count = len(outline)
    front = tuple(range(count))
    back = tuple(range(count * 2 - 1, count - 1, -1))
    faces: list[tuple[int, ...]] = [front, back]
    for index in range(count):
        nxt = (index + 1) % count
        faces.append((index, nxt, count + nxt, count + index))

    mesh = bpy.data.meshes.new("Assassin_NarrowMaskMesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    mask = bpy.data.objects.new("Assassin_NarrowMask", mesh)
    bpy.context.scene.collection.objects.link(mask)
    mask.parent = anchor
    mask.data.materials.append(cloth)
    bevel = mask.modifiers.new(name="MaskEdgeSoftening", type="BEVEL")
    bevel.width = 0.018
    bevel.segments = 2

    create_box(
        "Assassin_MaskTrim",
        (0.22, 0.036, 0.014),
        (0.0, y - 0.034, -0.500),
        trim,
        anchor,
        bevel=0.007,
    )
    return anchor
