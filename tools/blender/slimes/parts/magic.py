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


# Tier-2 Mage keeps the accepted Tier-1 wand geometry and evolves its presentation
# with a larger pointed hat and one independently animatable floating rune.
MAGE_RUNE_ANCHOR_LOCAL = Vector((0.82, -0.43, 1.02))


def _enable_soft_emission(material: bpy.types.Material, strength: float = 1.6) -> None:
    """Give a glTF-friendly Principled material a restrained magical self-glow."""
    if not material.use_nodes or material.node_tree is None:
        return
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        return
    if "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = tuple(bsdf.inputs["Base Color"].default_value)
    if "Emission Strength" in bsdf.inputs:
        bsdf.inputs["Emission Strength"].default_value = strength


def _create_mage_rune(ctx: BuildContext) -> bpy.types.Object:
    """Create one root-level rune glyph so runtime can orbit it independently of the hat."""
    rune_material = ctx.material("MageRuneBlue", (0.18, 0.48, 1.0, 1.0), roughness=0.22, metallic=0.05)
    rune_accent = ctx.material("MageRuneViolet", (0.52, 0.18, 0.96, 1.0), roughness=0.24, metallic=0.03)
    _enable_soft_emission(rune_material, 1.8)
    _enable_soft_emission(rune_accent, 1.45)

    rune = bpy.data.objects.new("MageRuneAnchor", None)
    bpy.context.scene.collection.objects.link(rune)
    rune.parent = ctx.root
    rune.location = MAGE_RUNE_ANCHOR_LOCAL
    # Torus is authored in local XY; rotate its normal toward the physical front (-Y).
    rune.rotation_euler = (math.radians(90.0), math.radians(0.0), math.radians(-11.0))

    bpy.ops.mesh.primitive_torus_add(
        major_segments=28,
        minor_segments=8,
        location=(0.0, 0.0, 0.0),
        major_radius=0.205,
        minor_radius=0.024,
    )
    ring = bpy.context.active_object
    assert ring is not None
    ring.name = "MageRune_Ring"
    ring.parent = rune
    ring.location = (0.0, 0.0, 0.0)
    ring.data.materials.append(rune_material)
    for polygon in ring.data.polygons:
        polygon.use_smooth = True

    # A simple angular sigil reads as a rune at small gameplay size without visual noise.
    create_cylinder_between(
        "MageRune_Stroke_L",
        (-0.115, -0.085, 0.0),
        (0.0, 0.120, 0.0),
        0.022,
        rune_accent,
        rune,
        vertices=8,
    )
    create_cylinder_between(
        "MageRune_Stroke_R",
        (0.0, 0.120, 0.0),
        (0.115, -0.085, 0.0),
        0.022,
        rune_accent,
        rune,
        vertices=8,
    )
    create_cylinder_between(
        "MageRune_Stroke_Base",
        (-0.080, -0.020, 0.0),
        (0.080, -0.020, 0.0),
        0.018,
        rune_material,
        rune,
        vertices=8,
    )
    _create_crystal("MageRune_Core", (0.0, -0.055, 0.0), (0.042, 0.042, 0.030), rune_accent, rune)
    return rune


def create_mage_kit(ctx: BuildContext) -> tuple[bpy.types.Object, bpy.types.Object, bpy.types.Object]:
    """Evolve the accepted Wand Slime kit into the Tier-2 Mage silhouette."""
    # Reuse the exact Tier-1 kit first. Any Mage-only changes below affect only this build scene,
    # so regenerating Wand Slime continues to produce the accepted Tier-1 geometry/transforms.
    wand, cap = create_wand_and_cap(ctx)

    # Promotion strengthens silhouette rather than body size: a broader/taller pointed hat,
    # a subtly more imposing wand, and one independent rune on the opposite side.
    cap.scale = (1.42, 1.34, 1.46)
    cap.location = (0.08, 0.060, 0.028)
    cap.rotation_euler[2] = math.radians(-10.0)

    wand.scale = (1.075, 1.075, 1.075)
    wand.location = (-0.94, -0.575, 0.44)
    _set_spell_origin_from_wand_tip(ctx, wand)

    rune = _create_mage_rune(ctx)
    return wand, cap, rune

# Tier-3 magic forms keep the canonical slime body unchanged. Their stronger
# silhouettes come from socketed headgear, staffs, and independently animatable
# effect anchors that the runtime coordinator may animate later.
ARCHMAGE_MOTE_POSITIONS = (
    (-0.98, -0.12, 1.10),
    (0.96, -0.28, 0.92),
    (0.34, 0.34, 1.48),
)
FROST_STAFF_VISUAL_TIP_LOCAL = Vector((0.0, 0.0, 1.30))


def _set_spell_origin_from_anchor_tip(
    ctx: BuildContext,
    anchor: bpy.types.Object,
    tip_local: Vector,
) -> None:
    """Align SpellOrigin with an authored visible casting point on any magic anchor."""
    bpy.context.view_layer.update()
    tip_world = anchor.matrix_world @ tip_local
    root_local_tip = ctx.root.matrix_world.inverted() @ tip_world
    ctx.socket("SpellOrigin").location = root_local_tip


def _create_star_badge(
    name: str,
    location: tuple[float, float, float],
    radius_outer: float,
    radius_inner: float,
    material: bpy.types.Material,
    parent: bpy.types.Object,
) -> bpy.types.Object:
    """Create a lightweight five-point star in the local XZ plane."""
    vertices: list[tuple[float, float, float]] = []
    for index in range(10):
        angle = math.radians(90.0 + index * 36.0)
        radius = radius_outer if index % 2 == 0 else radius_inner
        vertices.append((math.cos(angle) * radius, 0.0, math.sin(angle) * radius))

    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], [list(range(10))])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    obj.data.materials.append(material)
    return obj


def _create_archmage_motes(ctx: BuildContext) -> list[bpy.types.Object]:
    """Create three root-level mote anchors so runtime can orbit them independently."""
    mote_material = ctx.material("ArchmageMoteGold", (1.0, 0.60, 0.12, 1.0), roughness=0.20, metallic=0.08)
    mote_core = ctx.material("ArchmageMoteCore", (0.36, 0.58, 1.0, 1.0), roughness=0.16, metallic=0.04)
    _enable_soft_emission(mote_material, 1.65)
    _enable_soft_emission(mote_core, 1.45)

    anchors: list[bpy.types.Object] = []
    for index, position in enumerate(ARCHMAGE_MOTE_POSITIONS, start=1):
        anchor = bpy.data.objects.new(f"ArchmageMoteAnchor_{index}", None)
        bpy.context.scene.collection.objects.link(anchor)
        anchor.parent = ctx.root
        anchor.location = position

        create_ellipsoid(
            f"ArchmageMote_{index}",
            (0.0, 0.0, 0.0),
            (0.070, 0.060, 0.070),
            mote_material,
            anchor,
            segments=14,
            rings=8,
        )
        _create_star_badge(
            f"ArchmageMoteStar_{index}",
            (0.0, -0.066, 0.0),
            0.070,
            0.031,
            mote_core,
            anchor,
        )
        anchors.append(anchor)
    return anchors


def create_archmage_kit(
    ctx: BuildContext,
) -> tuple[bpy.types.Object, bpy.types.Object, bpy.types.Object, list[bpy.types.Object]]:
    """Promote Mage into Tier-3 Archmage without changing the shared body scale."""
    wand, cap, rune = create_mage_kit(ctx)

    deep_violet = ctx.material("ArchmageDeepViolet", (0.10, 0.025, 0.34, 1.0), roughness=0.42)
    star_gold = ctx.material("ArchmageStarGold", (1.0, 0.52, 0.08, 1.0), roughness=0.24, metallic=0.10)
    star_blue = ctx.material("ArchmageStarBlue", (0.18, 0.44, 1.0, 1.0), roughness=0.18, metallic=0.05)
    _enable_soft_emission(star_gold, 1.45)
    _enable_soft_emission(star_blue, 1.25)

    # The Tier-3 hat is intentionally much taller than Mage's, while the jelly body
    # remains untouched. Lifting the seat reduces clipping during the current shared
    # Stretch morph, whose HeadSocket is still static.
    cap.scale = (1.58, 1.47, 1.92)
    cap.location = (0.06, 0.055, 0.07)
    cap.rotation_euler[2] = math.radians(-12.0)

    # A dark lower mantle plus large front star makes the silhouette read as
    # 'star wizard' even at small gameplay scale rather than merely 'bigger Mage'.
    create_ellipsoid(
        "ArchmageHat_Mantle",
        (0.025, -0.010, 0.155),
        (0.315, 0.250, 0.060),
        deep_violet,
        cap,
        segments=24,
        rings=10,
    )
    _create_star_badge(
        "ArchmageHat_Star",
        (0.015, -0.270, 0.335),
        0.145,
        0.064,
        star_gold,
        cap,
    )
    _create_star_badge(
        "ArchmageHat_StarSmall",
        (-0.155, -0.245, 0.495),
        0.070,
        0.031,
        star_blue,
        cap,
    )

    # Strengthen the casting focus without replacing the accepted Mage wand vocabulary.
    wand.scale = (1.12, 1.12, 1.16)
    wand.location = (-0.98, -0.59, 0.45)
    _set_spell_origin_from_wand_tip(ctx, wand)

    motes = _create_archmage_motes(ctx)
    return wand, cap, rune, motes


def _create_frost_crown(ctx: BuildContext) -> bpy.types.Object:
    """Create a pale crystal crown that keeps the face and low slime silhouette open."""
    ice = ctx.material("FrostCrownIce", (0.68, 0.91, 1.0, 1.0), roughness=0.16, metallic=0.04)
    ice_bright = ctx.material("FrostCrownBright", (0.88, 0.98, 1.0, 1.0), roughness=0.10, metallic=0.02)
    navy = ctx.material("FrostCrownNavy", (0.035, 0.10, 0.28, 1.0), roughness=0.42)
    _enable_soft_emission(ice_bright, 1.20)

    crown = bpy.data.objects.new("FrostCrownAnchor", None)
    bpy.context.scene.collection.objects.link(crown)
    crown.parent = ctx.socket("HeadSocket")
    crown.location = (0.02, 0.055, 0.12)

    create_ellipsoid(
        "FrostCrown_Band",
        (0.0, 0.0, 0.060),
        (0.360, 0.270, 0.055),
        navy,
        crown,
        segments=24,
        rings=10,
    )

    spike_specs = (
        (-0.255, 0.120, 0.310, 0.105, 0.080),
        (-0.130, 0.150, 0.450, 0.120, 0.090),
        (0.000, 0.170, 0.565, 0.135, 0.100),
        (0.135, 0.150, 0.440, 0.120, 0.090),
        (0.260, 0.115, 0.300, 0.100, 0.078),
    )
    for index, (x, y, height, base_radius, tip_radius) in enumerate(spike_specs, start=1):
        _create_tapered_segment(
            f"FrostCrown_Spike_{index}",
            (x, y, 0.095),
            (x * 1.08, y - 0.010, height),
            base_radius,
            tip_radius * 0.16,
            ice_bright if index == 3 else ice,
            crown,
            vertices=8,
        )
    _create_crystal("FrostCrown_Core", (0.0, -0.245, 0.115), (0.085, 0.050, 0.095), ice_bright, crown)
    return crown


def _create_frost_staff(ctx: BuildContext) -> bpy.types.Object:
    """Create a dedicated ice staff with an unambiguous visible SpellOrigin."""
    navy = ctx.material("FrostStaffNavy", (0.025, 0.075, 0.22, 1.0), roughness=0.48)
    ice = ctx.material("FrostStaffIce", (0.50, 0.84, 1.0, 1.0), roughness=0.14, metallic=0.05)
    ice_bright = ctx.material("FrostStaffBright", (0.84, 0.98, 1.0, 1.0), roughness=0.09, metallic=0.03)
    _enable_soft_emission(ice_bright, 1.28)

    staff = bpy.data.objects.new("FrostStaffAnchor", None)
    bpy.context.scene.collection.objects.link(staff)
    staff.parent = ctx.socket("WeaponSocket")
    staff.location = (-0.96, -0.58, 0.40)
    staff.rotation_euler = (
        math.radians(-6.0),
        math.radians(-8.0),
        math.radians(7.0),
    )

    create_cylinder_between(
        "FrostStaff_ShaftLower",
        (0.0, 0.0, -0.34),
        (-0.015, 0.0, 0.42),
        0.050,
        navy,
        staff,
        vertices=10,
    )
    create_cylinder_between(
        "FrostStaff_ShaftUpper",
        (-0.015, 0.0, 0.42),
        (0.0, 0.0, 0.88),
        0.046,
        ice,
        staff,
        vertices=10,
    )
    create_ellipsoid("FrostStaff_Collar", (-0.010, 0.0, 0.44), (0.075, 0.060, 0.065), ice_bright, staff, segments=14, rings=8)

    # Three prongs frame the large crystal and keep the casting axis physically clear.
    create_cylinder_between("FrostStaff_Prong_L", (0.0, 0.0, 0.86), (-0.125, 0.0, 1.10), 0.025, ice, staff, vertices=8)
    create_cylinder_between("FrostStaff_Prong_R", (0.0, 0.0, 0.86), (0.125, 0.0, 1.10), 0.025, ice, staff, vertices=8)
    create_cylinder_between("FrostStaff_Prong_Back", (0.0, 0.0, 0.88), (0.0, 0.085, 1.08), 0.021, ice, staff, vertices=8)
    _create_crystal("FrostStaff_Crystal", (0.0, 0.0, 1.145), (0.145, 0.115, 0.165), ice_bright, staff)

    _set_spell_origin_from_anchor_tip(ctx, staff, FROST_STAFF_VISUAL_TIP_LOCAL)
    return staff


def _create_frost_side_crystals(ctx: BuildContext) -> list[bpy.types.Object]:
    """Add restrained ground-level ice accents; mist remains runtime VFX responsibility."""
    ice = ctx.material("FrostSideIce", (0.62, 0.90, 1.0, 1.0), roughness=0.18, metallic=0.02)
    accents: list[bpy.types.Object] = []
    for index, (x, y, z, scale, tilt) in enumerate(
        (
            (-0.63, 0.12, 0.16, (0.060, 0.050, 0.145), -16.0),
            (0.70, 0.08, 0.14, (0.052, 0.045, 0.120), 14.0),
        ),
        start=1,
    ):
        anchor = bpy.data.objects.new(f"FrostSideCrystalAnchor_{index}", None)
        bpy.context.scene.collection.objects.link(anchor)
        anchor.parent = ctx.root
        anchor.location = (x, y, z)
        crystal = _create_crystal(f"FrostSideCrystal_{index}", (0.0, 0.0, 0.0), scale, ice, anchor)
        crystal.rotation_euler[1] = math.radians(tilt)
        accents.append(anchor)
    return accents


def create_frost_mage_kit(
    ctx: BuildContext,
) -> tuple[bpy.types.Object, bpy.types.Object, list[bpy.types.Object]]:
    """Create Frost Mage's crown/staff identity on the canonical shared slime body."""
    crown = _create_frost_crown(ctx)
    staff = _create_frost_staff(ctx)
    accents = _create_frost_side_crystals(ctx)
    return staff, crown, accents
