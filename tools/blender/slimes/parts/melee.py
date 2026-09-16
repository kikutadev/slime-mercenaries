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
