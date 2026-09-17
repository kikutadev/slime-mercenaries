from __future__ import annotations

import math

import bpy

from ..base.context import BuildContext
from ..base.primitives import create_box


def _new_anchor(ctx: BuildContext, name: str, location: tuple[float, float, float]) -> bpy.types.Object:
    anchor = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("WeaponSocket")
    anchor.location = location
    return anchor


def create_basic_sword(ctx: BuildContext) -> bpy.types.Object:
    """Accepted Sword Slime blade, preserved as a reusable part."""
    blade = ctx.material("SwordSteel", (0.66, 0.78, 0.88, 1.0), roughness=0.24, metallic=0.72)
    guard = ctx.material("SwordGold", (0.92, 0.55, 0.12, 1.0), roughness=0.32, metallic=0.28)
    grip = ctx.material("SwordGrip", (0.24, 0.10, 0.08, 1.0), roughness=0.72)

    anchor = _new_anchor(ctx, "WeaponAnchor", (-1.08, -0.50, 0.43))
    anchor.rotation_euler[0] = math.radians(-12.0)
    anchor.rotation_euler[1] = math.radians(-22.0)
    anchor.rotation_euler[2] = math.radians(18.0)

    create_box("Sword_Blade", (0.15, 0.072, 1.16), (0.0, 0.0, 0.79), blade, anchor, bevel=0.024)
    create_box("Sword_Guard", (0.52, 0.105, 0.095), (0.0, 0.0, 0.105), guard, anchor, bevel=0.024)
    create_box("Sword_Grip", (0.115, 0.095, 0.33), (0.0, 0.0, -0.105), grip, anchor, bevel=0.018)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=1.0)
    pommel = bpy.context.active_object
    assert pommel is not None
    pommel.name = "Sword_Pommel"
    pommel.parent = anchor
    pommel.location = (0.0, 0.0, -0.335)
    pommel.scale = (0.082, 0.082, 0.082)
    pommel.data.materials.append(guard)

    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.11, radius2=0.0, depth=0.20)
    tip = bpy.context.active_object
    assert tip is not None
    tip.name = "Sword_Tip"
    tip.parent = anchor
    tip.location = (0.0, 0.0, 1.47)
    tip.rotation_euler[2] = math.radians(45.0)
    tip.data.materials.append(blade)
    return anchor


def create_greatsword(ctx: BuildContext) -> bpy.types.Object:
    """Accepted Greatsword fusion silhouette, sharing the ordinary Base Slime."""
    blade = ctx.material("GreatswordSteel", (0.48, 0.62, 0.76, 1.0), roughness=0.20, metallic=0.82)
    guard = ctx.material("GreatswordGold", (0.98, 0.66, 0.16, 1.0), roughness=0.26, metallic=0.42)
    grip = ctx.material("GreatswordGrip", (0.19, 0.07, 0.06, 1.0), roughness=0.76)
    accent = ctx.material("GreatswordFuller", (0.88, 0.96, 1.0, 1.0), roughness=0.16, metallic=0.66)

    anchor = _new_anchor(ctx, "WeaponAnchor", (-1.12, -0.50, 0.42))
    anchor.rotation_euler[0] = math.radians(-10.0)
    anchor.rotation_euler[1] = math.radians(-24.0)
    anchor.rotation_euler[2] = math.radians(18.0)

    create_box("Sword_Blade", (0.40, 0.13, 1.52), (0.0, 0.0, 0.97), blade, anchor, bevel=0.034)
    create_box("Greatsword_Fuller", (0.085, 0.142, 1.34), (0.0, -0.004, 0.99), accent, anchor, bevel=0.015)
    create_box("Sword_Guard", (0.82, 0.15, 0.14), (0.0, 0.0, 0.12), guard, anchor, bevel=0.030)
    create_box("Sword_Grip", (0.155, 0.125, 0.48), (0.0, 0.0, -0.18), grip, anchor, bevel=0.022)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=1.0)
    pommel = bpy.context.active_object
    assert pommel is not None
    pommel.name = "Sword_Pommel"
    pommel.parent = anchor
    pommel.location = (0.0, 0.0, -0.48)
    pommel.scale = (0.12, 0.12, 0.12)
    pommel.data.materials.append(guard)

    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.24, radius2=0.0, depth=0.34)
    tip = bpy.context.active_object
    assert tip is not None
    tip.name = "Sword_Tip"
    tip.parent = anchor
    tip.location = (0.0, 0.0, 1.90)
    tip.rotation_euler[2] = math.radians(45.0)
    tip.data.materials.append(blade)
    return anchor


def create_dagger(ctx: BuildContext) -> bpy.types.Object:
    """Small but mobile-readable single dagger for the Tier-1 skirmisher."""
    blade = ctx.material("DaggerSteel", (0.56, 0.68, 0.82, 1.0), roughness=0.22, metallic=0.76)
    guard = ctx.material("DaggerGuard", (0.24, 0.20, 0.42, 1.0), roughness=0.42, metallic=0.34)
    grip = ctx.material("DaggerGrip", (0.09, 0.06, 0.16, 1.0), roughness=0.78)

    anchor = _new_anchor(ctx, "WeaponAnchor", (-0.92, -0.57, 0.38))
    anchor.rotation_euler[0] = math.radians(-18.0)
    anchor.rotation_euler[1] = math.radians(-30.0)
    anchor.rotation_euler[2] = math.radians(30.0)
    create_box("Dagger_Blade", (0.10, 0.052, 0.58), (0.0, 0.0, 0.42), blade, anchor, bevel=0.018)
    create_box("Dagger_Guard", (0.30, 0.075, 0.065), (0.0, 0.0, 0.02), guard, anchor, bevel=0.018)
    create_box("Dagger_Grip", (0.085, 0.070, 0.25), (0.0, 0.0, -0.15), grip, anchor, bevel=0.014)
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.075, radius2=0.0, depth=0.16)
    tip = bpy.context.active_object
    assert tip is not None
    tip.name = "Dagger_Tip"
    tip.parent = anchor
    tip.location = (0.0, 0.0, 0.79)
    tip.rotation_euler[2] = math.radians(45.0)
    tip.data.materials.append(blade)
    return anchor


def _create_headband_ribbon(
    name: str,
    parent: bpy.types.Object,
    material: bpy.types.Material,
    *,
    radius_x: float = 0.88,
    radius_y: float = 0.76,
    center_z: float = -0.20,
    height: float = 0.095,
) -> bpy.types.Object:
    """Create a soft front/side headband arc that keeps the slime face readable."""
    segment_count = 18
    half_arc = math.radians(58.0)
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, int, int, int]] = []

    for index in range(segment_count + 1):
        u = index / segment_count
        phi = -half_arc + (2.0 * half_arc * u)
        x = radius_x * math.sin(phi)
        y = -0.30 - radius_y * math.cos(phi)
        # A tiny crown lift prevents the band from reading as a rigid flat hoop.
        z = center_z + 0.020 * math.cos(phi)
        vertices.append((x, y, z - height * 0.5))
        vertices.append((x, y, z + height * 0.5))
        if index > 0:
            base = (index - 1) * 2
            faces.append((base, base + 2, base + 3, base + 1))

    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    ribbon = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(ribbon)
    ribbon.parent = parent
    ribbon.data.materials.append(material)

    solidify = ribbon.modifiers.new(name="ClothThickness", type="SOLIDIFY")
    solidify.thickness = 0.030
    solidify.offset = 0.0
    bevel = ribbon.modifiers.new(name="SoftClothEdges", type="BEVEL")
    bevel.width = 0.012
    bevel.segments = 2
    return ribbon


def _create_tapered_headband_tail(
    name: str,
    parent: bpy.types.Object,
    material: bpy.types.Material,
    *,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    start_width: float,
    end_width: float,
) -> bpy.types.Object:
    """Create one lightweight cloth tail as a tapered ribbon in the XZ plane."""
    dx = end[0] - start[0]
    dz = end[2] - start[2]
    length = math.hypot(dx, dz)
    if length <= 1e-6:
        raise ValueError("headband tail requires distinct start/end points")

    # Perpendicular within the XZ plane; the ribbon faces the gameplay/front camera.
    px = -dz / length
    pz = dx / length
    sw = start_width * 0.5
    ew = end_width * 0.5
    vertices = [
        (start[0] + px * sw, start[1], start[2] + pz * sw),
        (start[0] - px * sw, start[1], start[2] - pz * sw),
        (end[0] - px * ew, end[1], end[2] - pz * ew),
        (end[0] + px * ew, end[1], end[2] + pz * ew),
    ]
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], [(0, 1, 2, 3)])
    mesh.update()
    tail = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(tail)
    tail.parent = parent
    tail.data.materials.append(material)

    solidify = tail.modifiers.new(name="ClothThickness", type="SOLIDIFY")
    solidify.thickness = 0.028
    solidify.offset = 0.0
    bevel = tail.modifiers.new(name="SoftClothEdges", type="BEVEL")
    bevel.width = 0.010
    bevel.segments = 2
    return tail


def create_fighter_headband(ctx: BuildContext) -> bpy.types.Object:
    """Tier-2 Sword-branch headband with a readable knot and two delayed-motion tails."""
    cloth = ctx.material("FighterHeadbandRed", (0.78, 0.075, 0.045, 1.0), roughness=0.58)
    knot_mat = ctx.material("FighterHeadbandKnot", (0.92, 0.12, 0.055, 1.0), roughness=0.52)

    anchor = bpy.data.objects.new("HeadbandAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("HeadSocket")

    _create_headband_ribbon("Headband_Band", anchor, cloth)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=1.0)
    knot = bpy.context.active_object
    assert knot is not None
    knot.name = "Headband_Knot"
    knot.parent = anchor
    knot.location = (0.77, -0.70, -0.19)
    knot.scale = (0.105, 0.075, 0.090)
    knot.data.materials.append(knot_mat)
    for polygon in knot.data.polygons:
        polygon.use_smooth = True

    _create_tapered_headband_tail(
        "Headband_Tail_A",
        anchor,
        cloth,
        start=(0.79, -0.69, -0.22),
        end=(1.14, -0.52, -0.55),
        start_width=0.115,
        end_width=0.052,
    )
    _create_tapered_headband_tail(
        "Headband_Tail_B",
        anchor,
        cloth,
        start=(0.78, -0.68, -0.23),
        end=(1.02, -0.68, -0.69),
        start_width=0.105,
        end_width=0.045,
    )
    return anchor


def create_fighter_sword(ctx: BuildContext) -> bpy.types.Object:
    """Broader Tier-2 sword: stronger than Sword, clearly lighter than Greatsword."""
    blade = ctx.material("FighterSteel", (0.57, 0.70, 0.82, 1.0), roughness=0.22, metallic=0.78)
    fuller = ctx.material("FighterFuller", (0.82, 0.90, 0.96, 1.0), roughness=0.18, metallic=0.64)
    guard = ctx.material("FighterGold", (0.94, 0.50, 0.10, 1.0), roughness=0.31, metallic=0.34)
    grip = ctx.material("FighterGrip", (0.22, 0.065, 0.045, 1.0), roughness=0.76)

    anchor = _new_anchor(ctx, "WeaponAnchor", (-1.10, -0.51, 0.42))
    anchor.rotation_euler[0] = math.radians(-11.0)
    anchor.rotation_euler[1] = math.radians(-24.0)
    anchor.rotation_euler[2] = math.radians(19.0)

    create_box("Fighter_Blade", (0.24, 0.086, 1.25), (0.0, 0.0, 0.84), blade, anchor, bevel=0.030)
    create_box("Fighter_Fuller", (0.052, 0.093, 1.08), (0.0, -0.002, 0.85), fuller, anchor, bevel=0.012)
    create_box("Fighter_Guard", (0.62, 0.12, 0.11), (0.0, 0.0, 0.105), guard, anchor, bevel=0.028)
    create_box("Fighter_Grip", (0.13, 0.102, 0.36), (0.0, 0.0, -0.13), grip, anchor, bevel=0.020)

    for side, x in (("L", -0.33), ("R", 0.33)):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=1.0)
        cap = bpy.context.active_object
        assert cap is not None
        cap.name = f"Fighter_GuardCap_{side}"
        cap.parent = anchor
        cap.location = (x, 0.0, 0.105)
        cap.scale = (0.072, 0.072, 0.072)
        cap.data.materials.append(guard)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=1.0)
    pommel = bpy.context.active_object
    assert pommel is not None
    pommel.name = "Fighter_Pommel"
    pommel.parent = anchor
    pommel.location = (0.0, 0.0, -0.37)
    pommel.scale = (0.095, 0.095, 0.095)
    pommel.data.materials.append(guard)

    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.15, radius2=0.0, depth=0.24)
    tip = bpy.context.active_object
    assert tip is not None
    tip.name = "Fighter_BladeTip"
    tip.parent = anchor
    tip.location = (0.0, 0.0, 1.585)
    tip.rotation_euler[2] = math.radians(45.0)
    tip.data.materials.append(blade)

    weapon_tip = bpy.data.objects.new("WeaponTip", None)
    bpy.context.scene.collection.objects.link(weapon_tip)
    weapon_tip.parent = anchor
    weapon_tip.location = (0.0, 0.0, 1.705)
    return anchor



def _create_profile_prism(
    name: str,
    profile: list[tuple[float, float]],
    thickness: float,
    material: bpy.types.Material,
    parent: bpy.types.Object,
) -> bpy.types.Object:
    """Extrude a 2D X/Z profile along Y for readable custom blade silhouettes."""
    if len(profile) < 3:
        raise ValueError("profile prism requires at least three profile points")
    half_y = thickness * 0.5
    vertices = [(x, -half_y, z) for x, z in profile] + [(x, half_y, z) for x, z in profile]
    count = len(profile)
    faces: list[tuple[int, ...]] = []
    # Front faces local -Y, matching the slime's physical front side.
    faces.append(tuple(range(count - 1, -1, -1)))
    faces.append(tuple(range(count, count * 2)))
    for index in range(count):
        nxt = (index + 1) % count
        faces.append((index, nxt, count + nxt, count + index))

    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.data.materials.append(material)

    bevel = obj.modifiers.new(name="BladeEdgeSoftening", type="BEVEL")
    bevel.width = min(0.022, thickness * 0.20)
    bevel.segments = 2
    return obj


def create_blademaster_scarf(ctx: BuildContext) -> bpy.types.Object:
    """Tier-3 light scarf/head ribbon with one long readable trailing tail."""
    cloth = ctx.material("BlademasterScarf", (0.055, 0.20, 0.34, 1.0), roughness=0.52)
    accent = ctx.material("BlademasterScarfAccent", (0.20, 0.72, 0.92, 1.0), roughness=0.44)

    anchor = bpy.data.objects.new("BlademasterScarfAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("HeadSocket")

    _create_headband_ribbon(
        "Blademaster_ScarfBand",
        anchor,
        cloth,
        radius_x=0.90,
        radius_y=0.77,
        center_z=-0.22,
        height=0.082,
    )

    bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=8, radius=1.0)
    knot = bpy.context.active_object
    assert knot is not None
    knot.name = "Blademaster_ScarfKnot"
    knot.parent = anchor
    knot.location = (0.78, -0.69, -0.23)
    knot.scale = (0.090, 0.062, 0.076)
    knot.data.materials.append(accent)

    _create_tapered_headband_tail(
        "Blademaster_ScarfTail_Long",
        anchor,
        cloth,
        start=(0.79, -0.68, -0.25),
        end=(1.34, -0.48, -0.68),
        start_width=0.115,
        end_width=0.040,
    )
    _create_tapered_headband_tail(
        "Blademaster_ScarfTail_Short",
        anchor,
        accent,
        start=(0.78, -0.69, -0.24),
        end=(1.08, -0.66, -0.49),
        start_width=0.090,
        end_width=0.038,
    )
    return anchor


def create_blademaster_sword(ctx: BuildContext) -> bpy.types.Object:
    """Long, narrow Tier-3 blade emphasizing speed over mass."""
    steel = ctx.material("BlademasterSteel", (0.64, 0.78, 0.90, 1.0), roughness=0.18, metallic=0.86)
    edge = ctx.material("BlademasterEdge", (0.90, 0.97, 1.0, 1.0), roughness=0.12, metallic=0.72)
    guard = ctx.material("BlademasterGuard", (0.16, 0.30, 0.42, 1.0), roughness=0.28, metallic=0.62)
    grip = ctx.material("BlademasterGrip", (0.055, 0.075, 0.10, 1.0), roughness=0.72)

    anchor = _new_anchor(ctx, "WeaponAnchor", (-1.08, -0.53, 0.40))
    anchor.rotation_euler[0] = math.radians(-13.0)
    anchor.rotation_euler[1] = math.radians(-20.0)
    anchor.rotation_euler[2] = math.radians(20.0)

    profile = [
        (-0.105, 0.18),
        (0.095, 0.18),
        (0.115, 1.52),
        (0.070, 1.78),
        (-0.010, 1.98),
        (-0.095, 1.60),
    ]
    _create_profile_prism("Blademaster_Blade", profile, 0.072, steel, anchor)
    create_box("Blademaster_EdgeAccent", (0.030, 0.078, 1.42), (0.075, -0.002, 0.98), edge, anchor, bevel=0.010)
    create_box("Blademaster_Guard", (0.54, 0.100, 0.080), (0.0, 0.0, 0.10), guard, anchor, bevel=0.022)
    create_box("Blademaster_Grip", (0.105, 0.088, 0.39), (0.0, 0.0, -0.15), grip, anchor, bevel=0.016)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=1.0)
    pommel = bpy.context.active_object
    assert pommel is not None
    pommel.name = "Blademaster_Pommel"
    pommel.parent = anchor
    pommel.location = (0.0, 0.0, -0.405)
    pommel.scale = (0.080, 0.080, 0.080)
    pommel.data.materials.append(guard)

    weapon_tip = bpy.data.objects.new("WeaponTip", None)
    bpy.context.scene.collection.objects.link(weapon_tip)
    weapon_tip.parent = anchor
    weapon_tip.location = (-0.010, 0.0, 1.99)
    return anchor


def create_berserker_head_accents(ctx: BuildContext) -> bpy.types.Object:
    """Wild brow and torn cloth accents that keep the round face readable."""
    cloth = ctx.material("BerserkerCloth", (0.36, 0.035, 0.030, 1.0), roughness=0.66)
    brow_mat = ctx.material("BerserkerBrow", (0.12, 0.025, 0.018, 1.0), roughness=0.82)

    anchor = bpy.data.objects.new("BerserkerHeadAccentAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = ctx.socket("HeadSocket")

    _create_headband_ribbon(
        "Berserker_ClothBand",
        anchor,
        cloth,
        radius_x=0.91,
        radius_y=0.78,
        center_z=-0.12,
        height=0.105,
    )
    _create_tapered_headband_tail(
        "Berserker_TornTail_A",
        anchor,
        cloth,
        start=(0.78, -0.69, -0.15),
        end=(1.24, -0.54, -0.66),
        start_width=0.145,
        end_width=0.052,
    )
    _create_tapered_headband_tail(
        "Berserker_TornTail_B",
        anchor,
        cloth,
        start=(0.76, -0.70, -0.17),
        end=(0.98, -0.73, -0.72),
        start_width=0.115,
        end_width=0.040,
    )

    for side, x, angle in (("L", -0.225, -15.0), ("R", 0.225, 15.0)):
        brow = create_box(
            f"Berserker_Brow_{side}",
            (0.25, 0.040, 0.040),
            (x, -1.000, -0.230),
            brow_mat,
            anchor,
            bevel=0.016,
        )
        brow.rotation_euler[1] = math.radians(angle)
    return anchor


def create_berserker_greatsword(ctx: BuildContext) -> bpy.types.Object:
    """Chipped, broad Tier-3 greatsword with a deliberately rough asymmetric profile."""
    steel = ctx.material("BerserkerSteel", (0.34, 0.39, 0.43, 1.0), roughness=0.34, metallic=0.74)
    edge = ctx.material("BerserkerEdge", (0.68, 0.72, 0.72, 1.0), roughness=0.24, metallic=0.62)
    guard = ctx.material("BerserkerGuard", (0.24, 0.11, 0.065, 1.0), roughness=0.54, metallic=0.34)
    grip = ctx.material("BerserkerGrip", (0.10, 0.040, 0.028, 1.0), roughness=0.84)

    anchor = _new_anchor(ctx, "WeaponAnchor", (-1.14, -0.50, 0.40))
    anchor.rotation_euler[0] = math.radians(-8.0)
    anchor.rotation_euler[1] = math.radians(-27.0)
    anchor.rotation_euler[2] = math.radians(17.0)

    # The right edge contains two visible chips; the silhouette stays broad at mobile scale.
    profile = [
        (-0.30, 0.20),
        (0.29, 0.20),
        (0.30, 0.78),
        (0.22, 0.88),
        (0.31, 1.00),
        (0.30, 1.35),
        (0.19, 1.45),
        (0.29, 1.58),
        (0.17, 1.78),
        (0.00, 1.94),
        (-0.25, 1.69),
    ]
    _create_profile_prism("Berserker_Blade", profile, 0.145, steel, anchor)
    create_box("Berserker_EdgeAccent", (0.055, 0.152, 1.18), (-0.215, -0.002, 1.00), edge, anchor, bevel=0.014)
    create_box("Berserker_Guard", (0.84, 0.155, 0.145), (0.0, 0.0, 0.11), guard, anchor, bevel=0.032)
    create_box("Berserker_Grip", (0.16, 0.128, 0.50), (0.0, 0.0, -0.21), grip, anchor, bevel=0.022)

    for side, x in (("L", -0.43), ("R", 0.43)):
        bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.10, radius2=0.025, depth=0.25)
        spike = bpy.context.active_object
        assert spike is not None
        spike.name = f"Berserker_GuardSpike_{side}"
        spike.parent = anchor
        spike.location = (x, 0.0, 0.11)
        spike.rotation_euler[1] = math.radians(90.0 if side == "R" else -90.0)
        spike.data.materials.append(guard)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=1.0)
    pommel = bpy.context.active_object
    assert pommel is not None
    pommel.name = "Berserker_Pommel"
    pommel.parent = anchor
    pommel.location = (0.0, 0.0, -0.53)
    pommel.scale = (0.13, 0.13, 0.13)
    pommel.data.materials.append(guard)

    weapon_tip = bpy.data.objects.new("WeaponTip", None)
    bpy.context.scene.collection.objects.link(weapon_tip)
    weapon_tip.parent = anchor
    weapon_tip.location = (0.0, 0.0, 1.95)
    return anchor
