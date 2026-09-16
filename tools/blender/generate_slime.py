"""Generate compact combat-slime GLBs for Slime Mercenaries.

The generated body owns soft morph targets. Face and equipment remain rigid and
are driven by the runtime so the same jelly motion can be reused across jobs.
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector

BODY_HEIGHT = 1.18
BODY_BASE_Z = 0.035


def parse_args() -> argparse.Namespace:
    """Read arguments passed after Blender's `--` separator."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, help="Destination .glb path")
    parser.add_argument("--variant", choices=("sword", "greatsword", "archer"), default="sword")
    argv: list[str] = []
    if "--" in sys.argv:
        argv = sys.argv[sys.argv.index("--") + 1 :]
    return parser.parse_args(argv)


def clear_scene() -> None:
    """Remove startup objects from the temporary generation scene."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def make_material(
    name: str,
    color: tuple[float, float, float, float],
    *,
    roughness: float,
    metallic: float = 0.0,
) -> bpy.types.Material:
    """Create a compact glTF-friendly Principled material."""
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    assert bsdf is not None
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.30 if metallic < 0.2 else 0.06
    if "Coat Roughness" in bsdf.inputs:
        bsdf.inputs["Coat Roughness"].default_value = 0.10
    return material


def create_root() -> bpy.types.Object:
    """Create the stable root shared by every slime variant."""
    root = bpy.data.objects.new("SlimeRoot", None)
    bpy.context.scene.collection.objects.link(root)
    return root


def deform_base_vertex(co: Vector) -> Vector:
    """Map the sphere onto a squat pudding-like jelly profile.

    The radius is driven by height rather than inheriting the sphere profile.
    This deliberately creates a broad skirt, a soft shoulder and a low rounded
    crown so the unit reads as jelly instead of a scaled ball.
    """
    t = max(0.0, min(1.0, (co.z + 1.0) * 0.5))
    theta = math.atan2(co.y, co.x)

    # A low exponent keeps the middle broad. The lower-body bias creates the
    # weighty jelly skirt while the tiny harmonic breaks perfect rotational
    # symmetry without making the production silhouette noisy.
    dome = max(0.0, math.sin(math.pi * t)) ** 0.42
    skirt = 1.0 + 0.20 * (1.0 - t) + 0.08 * math.sin(math.pi * t)
    asymmetry = 1.0 + 0.022 * math.sin(theta * 3.0 + 0.65) * (math.sin(math.pi * t) ** 2)
    radius = dome * skirt * asymmetry

    x = math.cos(theta) * radius
    y = math.sin(theta) * radius * 0.82 * (1.0 + 0.014 * math.cos(theta * 2.0 - 0.3))

    # Pin the first rings close to the floor, then let the crown rise. This
    # removes the egg-like lower curve and makes contact with the ground broad.
    if t < 0.16:
        z = BODY_BASE_Z + 0.050 * ((t / 0.16) ** 2)
    else:
        p = (t - 0.16) / 0.84
        z = BODY_BASE_Z + 0.050 + (BODY_HEIGHT - 0.050) * (p ** 1.06)

    return Vector((x, y, z))


def create_body(root: bpy.types.Object, material: bpy.types.Material) -> bpy.types.Object:
    """Create the jelly mesh and reusable squash/stretch targets."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=24, radius=1.0)
    body = bpy.context.active_object
    assert body is not None
    body.name = "Body"
    body.parent = root

    for vertex in body.data.vertices:
        vertex.co = deform_base_vertex(vertex.co)
    for polygon in body.data.polygons:
        polygon.use_smooth = True
    body.data.materials.append(material)

    basis = body.shape_key_add(name="Basis")

    def add_shape(name: str, transform) -> None:
        """Create one shape key from immutable Basis coordinates."""
        key = body.shape_key_add(name=name)
        for dst, src in zip(key.data, basis.data, strict=True):
            dst.co = transform(src.co.copy())

    add_shape(
        "Squash",
        lambda point: Vector(
            (
                point.x * (1.24 - 0.04 * min(1.0, point.z / BODY_HEIGHT)),
                point.y * 1.18,
                BODY_BASE_Z + max(0.0, point.z - BODY_BASE_Z) * 0.70,
            )
        ),
    )
    add_shape(
        "Stretch",
        lambda point: Vector(
            (
                point.x * 0.86,
                point.y * 0.91,
                BODY_BASE_Z + max(0.0, point.z - BODY_BASE_Z) * 1.24,
            )
        ),
    )

    def lean(point: Vector, direction: float) -> Vector:
        """Bend the upper jelly while keeping its contact pad planted."""
        t = max(0.0, min(1.0, point.z / BODY_HEIGHT))
        point.x += direction * 0.22 * (t**1.45)
        point.z -= 0.040 * (t**1.15)
        return point

    add_shape("LeanLeft", lambda point: lean(point, -1.0))
    add_shape("LeanRight", lambda point: lean(point, 1.0))

    def wobble(point: Vector, direction: float) -> Vector:
        """Shear the soft middle with opposite crown/skirt lag."""
        t = max(0.0, min(1.0, (point.z - BODY_BASE_Z) / BODY_HEIGHT))
        soft = math.sin(math.pi * t)
        point.x += direction * 0.12 * soft * (0.30 + 0.70 * t)
        point.y *= 1.0 + direction * 0.035 * soft
        point.z += direction * 0.025 * math.sin(math.pi * t * 2.0)
        return point

    add_shape("WobbleLeft", lambda point: wobble(point, -1.0))
    add_shape("WobbleRight", lambda point: wobble(point, 1.0))

    def hit(point: Vector, direction: float) -> Vector:
        """Compress the jelly laterally for impact and recoil."""
        t = max(0.0, min(1.0, point.z / BODY_HEIGHT))
        point.x += direction * 0.28 * math.sin(t * math.pi * 0.72) * t
        point.y *= 1.0 + 0.05 * t
        return point

    add_shape("HitLeft", lambda point: hit(point, -1.0))
    add_shape("HitRight", lambda point: hit(point, 1.0))
    return body


def create_ellipsoid(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material: bpy.types.Material,
    parent: bpy.types.Object,
    *,
    segments: int = 20,
    rings: int = 12,
) -> bpy.types.Object:
    """Create a rigid ellipsoid for simple face details."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=1.0)
    obj = bpy.context.active_object
    assert obj is not None
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.scale = scale
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def create_face(root: bpy.types.Object, eye_material: bpy.types.Material) -> bpy.types.Object:
    """Create two small matte-black eyes and a tiny mouth, with no highlights."""
    face_root = bpy.data.objects.new("FaceRoot", None)
    bpy.context.scene.collection.objects.link(face_root)
    face_root.parent = root
    # The thicker jelly silhouette extends farther forward than the original
    # sphere-derived body. Push the whole rigid face onto the visible surface
    # so eyes/mouth never become buried inside the body.
    face_root.location = (0.0, -0.24, 0.0)

    for name, x in (("Eye_L", -0.225), ("Eye_R", 0.225)):
        create_ellipsoid(
            name,
            (x, -0.765, 0.68),
            (0.092, 0.046, 0.116),
            eye_material,
            face_root,
        )

    create_ellipsoid(
        "Mouth",
        (0.0, -0.805, 0.47),
        (0.050, 0.018, 0.023),
        eye_material,
        face_root,
        segments=16,
        rings=10,
    )
    return face_root


def create_box(
    name: str,
    size: tuple[float, float, float],
    location: tuple[float, float, float],
    material: bpy.types.Material,
    parent: bpy.types.Object,
    *,
    bevel: float = 0.0,
) -> bpy.types.Object:
    """Create a small rigid equipment part."""
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    obj = bpy.context.active_object
    assert obj is not None
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.scale = size
    obj.data.materials.append(material)
    if bevel > 0:
        modifier = obj.modifiers.new(name="SoftEdges", type="BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    return obj


def create_cylinder_between(
    name: str,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    radius: float,
    material: bpy.types.Material,
    parent: bpy.types.Object,
    *,
    vertices: int = 10,
) -> bpy.types.Object:
    """Create a cylinder aligned between two local points."""
    start_v = Vector(start)
    end_v = Vector(end)
    direction = end_v - start_v
    midpoint = (start_v + end_v) * 0.5
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=direction.length)
    obj = bpy.context.active_object
    assert obj is not None
    obj.name = name
    obj.parent = parent
    obj.location = midpoint
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
    obj.data.materials.append(material)
    return obj


def create_sword(
    root: bpy.types.Object,
    blade_material: bpy.types.Material,
    guard_material: bpy.types.Material,
    grip_material: bpy.types.Material,
) -> bpy.types.Object:
    """Create an oversized, mobile-readable sword on the slime's front-right flank."""
    anchor = bpy.data.objects.new("WeaponAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = root
    # Face points toward -Y in Blender. Put the blade on the right-front flank so
    # it is visible while the slime faces an enemy up-field.
    anchor.location = (-1.08, -0.50, 0.43)
    anchor.rotation_euler[0] = math.radians(-12.0)
    anchor.rotation_euler[1] = math.radians(-22.0)
    anchor.rotation_euler[2] = math.radians(18.0)

    # Deliberately oversized for small-screen combat readability. The weapon is
    # part of the class silhouette, so it should remain legible even when 20–30
    # units eventually share the battlefield.
    create_box("Sword_Blade", (0.15, 0.072, 1.16), (0.0, 0.0, 0.79), blade_material, anchor, bevel=0.024)
    create_box("Sword_Guard", (0.52, 0.105, 0.095), (0.0, 0.0, 0.105), guard_material, anchor, bevel=0.024)
    create_box("Sword_Grip", (0.115, 0.095, 0.33), (0.0, 0.0, -0.105), grip_material, anchor, bevel=0.018)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=1.0)
    pommel = bpy.context.active_object
    assert pommel is not None
    pommel.name = "Sword_Pommel"
    pommel.parent = anchor
    pommel.location = (0.0, 0.0, -0.335)
    pommel.scale = (0.082, 0.082, 0.082)
    pommel.data.materials.append(guard_material)

    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.11, radius2=0.0, depth=0.20)
    tip = bpy.context.active_object
    assert tip is not None
    tip.name = "Sword_Tip"
    tip.parent = anchor
    tip.location = (0.0, 0.0, 1.47)
    tip.rotation_euler[2] = math.radians(45.0)
    tip.data.materials.append(blade_material)
    return anchor


def create_greatsword(
    root: bpy.types.Object,
    blade_material: bpy.types.Material,
    guard_material: bpy.types.Material,
    grip_material: bpy.types.Material,
    accent_material: bpy.types.Material,
) -> bpy.types.Object:
    """Create the upgraded sword-class silhouette without changing slime body size."""
    anchor = bpy.data.objects.new("WeaponAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = root
    anchor.location = (-1.12, -0.50, 0.42)
    anchor.rotation_euler[0] = math.radians(-10.0)
    anchor.rotation_euler[1] = math.radians(-24.0)
    anchor.rotation_euler[2] = math.radians(18.0)

    # Keep the jelly body identical to Sword Slime. The promotion is carried by
    # the weapon silhouette: much broader blade, longer grip and a bright fuller.
    create_box("Sword_Blade", (0.40, 0.13, 1.52), (0.0, 0.0, 0.97), blade_material, anchor, bevel=0.034)
    create_box("Greatsword_Fuller", (0.085, 0.142, 1.34), (0.0, -0.004, 0.99), accent_material, anchor, bevel=0.015)
    create_box("Sword_Guard", (0.82, 0.15, 0.14), (0.0, 0.0, 0.12), guard_material, anchor, bevel=0.030)
    create_box("Sword_Grip", (0.155, 0.125, 0.48), (0.0, 0.0, -0.18), grip_material, anchor, bevel=0.022)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=1.0)
    pommel = bpy.context.active_object
    assert pommel is not None
    pommel.name = "Sword_Pommel"
    pommel.parent = anchor
    pommel.location = (0.0, 0.0, -0.48)
    pommel.scale = (0.12, 0.12, 0.12)
    pommel.data.materials.append(guard_material)

    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.24, radius2=0.0, depth=0.34)
    tip = bpy.context.active_object
    assert tip is not None
    tip.name = "Sword_Tip"
    tip.parent = anchor
    tip.location = (0.0, 0.0, 1.90)
    tip.rotation_euler[2] = math.radians(45.0)
    tip.data.materials.append(blade_material)
    return anchor


def create_bow(
    root: bpy.types.Object,
    wood_material: bpy.types.Material,
    string_material: bpy.types.Material,
) -> bpy.types.Object:
    """Create a readable low-detail bow and string on a single BowAnchor."""
    anchor = bpy.data.objects.new("BowAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = root
    anchor.location = (1.04, -0.50, 0.45)
    anchor.rotation_euler[0] = math.radians(4.0)
    anchor.rotation_euler[1] = math.radians(-12.0)
    anchor.rotation_euler[2] = math.radians(-10.0)

    # Keep the bow intentionally large and strongly curved so the ranged class
    # remains readable at gameplay scale. The string is slightly thicker than a
    # physically accurate one because silhouette readability matters more here.
    create_cylinder_between("Bow_Upper", (0.0, 0.0, 0.0), (0.29, 0.0, 0.60), 0.050, wood_material, anchor)
    create_cylinder_between("Bow_Lower", (0.0, 0.0, 0.0), (0.29, 0.0, -0.60), 0.050, wood_material, anchor)
    create_cylinder_between("Bow_UpperTip", (0.29, 0.0, 0.60), (0.13, 0.0, 0.83), 0.040, wood_material, anchor)
    create_cylinder_between("Bow_LowerTip", (0.29, 0.0, -0.60), (0.13, 0.0, -0.83), 0.040, wood_material, anchor)
    create_cylinder_between("Bow_StringUpper", (0.13, 0.0, 0.83), (-0.10, 0.0, 0.0), 0.010, string_material, anchor, vertices=6)
    create_cylinder_between("Bow_StringLower", (-0.10, 0.0, 0.0), (0.13, 0.0, -0.83), 0.010, string_material, anchor, vertices=6)
    return anchor


def export_glb(output_path: Path) -> None:
    """Export a compact GLB with morph targets and glTF-safe materials."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(output_path),
        export_format="GLB",
        export_yup=True,
        export_apply=False,
        export_morph=True,
        export_morph_normal=False,
        export_morph_tangent=False,
        export_cameras=False,
        export_lights=False,
    )


def main() -> None:
    """Build one slime job variant and export it."""
    args = parse_args()
    clear_scene()

    root = create_root()
    body_color = (0.045, 0.48, 0.96, 1.0) if args.variant in ("sword", "greatsword") else (0.06, 0.55, 0.88, 1.0)
    body_material = make_material("SlimeBlue", body_color, roughness=0.16)
    eye_material = make_material("SlimeEyeBlack", (0.003, 0.005, 0.008, 1.0), roughness=1.0)
    eye_bsdf = eye_material.node_tree.nodes.get("Principled BSDF")
    if eye_bsdf is not None:
        if "Coat Weight" in eye_bsdf.inputs:
            eye_bsdf.inputs["Coat Weight"].default_value = 0.0
        if "Specular IOR Level" in eye_bsdf.inputs:
            eye_bsdf.inputs["Specular IOR Level"].default_value = 0.0

    create_body(root, body_material)
    create_face(root, eye_material)

    if args.variant == "sword":
        blade_material = make_material("SwordSteel", (0.66, 0.78, 0.88, 1.0), roughness=0.24, metallic=0.72)
        guard_material = make_material("SwordGold", (0.92, 0.55, 0.12, 1.0), roughness=0.32, metallic=0.28)
        grip_material = make_material("SwordGrip", (0.24, 0.10, 0.08, 1.0), roughness=0.72)
        create_sword(root, blade_material, guard_material, grip_material)
    elif args.variant == "greatsword":
        blade_material = make_material("GreatswordSteel", (0.48, 0.62, 0.76, 1.0), roughness=0.20, metallic=0.82)
        guard_material = make_material("GreatswordGold", (0.98, 0.66, 0.16, 1.0), roughness=0.26, metallic=0.42)
        grip_material = make_material("GreatswordGrip", (0.19, 0.07, 0.06, 1.0), roughness=0.76)
        accent_material = make_material("GreatswordFuller", (0.88, 0.96, 1.0, 1.0), roughness=0.16, metallic=0.66)
        create_greatsword(root, blade_material, guard_material, grip_material, accent_material)
    else:
        wood_material = make_material("BowWood", (0.37, 0.18, 0.07, 1.0), roughness=0.78)
        string_material = make_material("BowString", (0.08, 0.08, 0.08, 1.0), roughness=0.95)
        create_bow(root, wood_material, string_material)

    export_glb(Path(args.output).expanduser().resolve())


if __name__ == "__main__":
    main()
