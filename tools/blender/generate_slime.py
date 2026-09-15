"""Generate the canonical combat slime GLB for Slime Mercenaries.

The body owns the soft deformation targets. Face and weapon stay rigid and are
moved by runtime secondary motion so the slime reads as soft while equipment
keeps a clean silhouette.
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector


BODY_HEIGHT = 1.42
BODY_BASE_Z = 0.035


def parse_args() -> argparse.Namespace:
    """Read arguments passed after Blender's `--` separator."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, help="Destination .glb path")
    argv: list[str] = []
    if "--" in sys.argv:
        argv = sys.argv[sys.argv.index("--") + 1 :]
    return parser.parse_args(argv)


def clear_scene() -> None:
    """Remove every object from the temporary generation scene."""
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
        bsdf.inputs["Coat Weight"].default_value = 0.18 if metallic < 0.2 else 0.08
    if "Coat Roughness" in bsdf.inputs:
        bsdf.inputs["Coat Roughness"].default_value = 0.12
    return material


def create_root() -> bpy.types.Object:
    """Create the stable root used by generated slime variants."""
    root = bpy.data.objects.new("SlimeRoot", None)
    bpy.context.scene.collection.objects.link(root)
    return root


def deform_base_vertex(co: Vector) -> Vector:
    """Turn a unit UV sphere into a low, bottom-heavy jelly silhouette."""
    normalized_z = max(0.0, min(1.0, (co.z + 1.0) * 0.5))
    lower_weight = 1.0 - normalized_z
    width = 1.08 + 0.22 * (lower_weight**1.35)
    depth = 0.82 + 0.12 * (lower_weight**1.25)

    z = ((co.z + 1.0) * 0.5) ** 0.94 * BODY_HEIGHT
    if z < 0.13:
        z = BODY_BASE_Z + (z / 0.13) ** 2 * 0.095

    return Vector((co.x * width, co.y * depth, z))


def create_body(root: bpy.types.Object, material: bpy.types.Material) -> bpy.types.Object:
    """Create the body mesh and reusable deformation targets."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=28, radius=1.0)
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
                point.x * (1.20 - 0.03 * min(1.0, point.z / BODY_HEIGHT)),
                point.y * 1.14,
                BODY_BASE_Z + max(0.0, point.z - BODY_BASE_Z) * 0.78,
            )
        ),
    )
    add_shape(
        "Stretch",
        lambda point: Vector(
            (
                point.x * 0.90,
                point.y * 0.94,
                BODY_BASE_Z + max(0.0, point.z - BODY_BASE_Z) * 1.18,
            )
        ),
    )

    def lean(point: Vector, direction: float) -> Vector:
        """Bend the upper jelly while keeping its contact pad planted."""
        t = max(0.0, min(1.0, point.z / BODY_HEIGHT))
        point.x += direction * 0.18 * (t**1.55)
        point.z -= 0.028 * (t**1.2)
        return point

    add_shape("LeanLeft", lambda point: lean(point, -1.0))
    add_shape("LeanRight", lambda point: lean(point, 1.0))

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
    segments: int = 24,
    rings: int = 16,
) -> bpy.types.Object:
    """Create a rigid ellipsoid for face components."""
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


def create_face(
    root: bpy.types.Object,
    eye_material: bpy.types.Material,
    highlight_material: bpy.types.Material,
) -> bpy.types.Object:
    """Create rigid face parts under a runtime-adjustable FaceRoot anchor."""
    face_root = bpy.data.objects.new("FaceRoot", None)
    bpy.context.scene.collection.objects.link(face_root)
    face_root.parent = root

    for name, x in (("Eye_L", -0.285), ("Eye_R", 0.285)):
        create_ellipsoid(
            name,
            (x, -0.792, 0.84),
            (0.155, 0.075, 0.205),
            eye_material,
            face_root,
        )
        create_ellipsoid(
            f"{name}_Highlight",
            (x - 0.045, -0.858, 0.91),
            (0.038, 0.018, 0.052),
            highlight_material,
            face_root,
            segments=16,
            rings=10,
        )

    create_ellipsoid(
        "Mouth",
        (0.0, -0.842, 0.57),
        (0.07, 0.025, 0.038),
        eye_material,
        face_root,
        segments=20,
        rings=12,
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
    """Create a simple rigid box as a modular equipment part."""
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    obj = bpy.context.active_object
    assert obj is not None
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.scale = (size[0], size[1], size[2])
    obj.data.materials.append(material)
    if bevel > 0:
        modifier = obj.modifiers.new(name="SoftEdges", type="BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    return obj


def create_weapon(
    root: bpy.types.Object,
    blade_material: bpy.types.Material,
    guard_material: bpy.types.Material,
    grip_material: bpy.types.Material,
) -> bpy.types.Object:
    """Create an oversized toy sword on a single runtime weapon anchor."""
    anchor = bpy.data.objects.new("WeaponAnchor", None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.parent = root
    anchor.location = (1.12, -0.58, 0.52)
    anchor.rotation_euler[1] = math.radians(-18.0)
    anchor.rotation_euler[2] = math.radians(-12.0)

    create_box(
        "Sword_Blade",
        (0.14, 0.07, 0.84),
        (0.0, 0.0, 0.56),
        blade_material,
        anchor,
        bevel=0.025,
    )
    create_box(
        "Sword_Guard",
        (0.48, 0.10, 0.09),
        (0.0, 0.0, 0.095),
        guard_material,
        anchor,
        bevel=0.025,
    )
    create_box(
        "Sword_Grip",
        (0.11, 0.10, 0.28),
        (0.0, 0.0, -0.09),
        grip_material,
        anchor,
        bevel=0.018,
    )

    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=1.0)
    pommel = bpy.context.active_object
    assert pommel is not None
    pommel.name = "Sword_Pommel"
    pommel.parent = anchor
    pommel.location = (0.0, 0.0, -0.30)
    pommel.scale = (0.09, 0.09, 0.09)
    pommel.data.materials.append(guard_material)

    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.11, radius2=0.0, depth=0.18)
    tip = bpy.context.active_object
    assert tip is not None
    tip.name = "Sword_Tip"
    tip.parent = anchor
    tip.location = (0.0, 0.0, 1.07)
    tip.rotation_euler[2] = math.radians(45.0)
    tip.data.materials.append(blade_material)
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
    """Build the combat slime and write it as a game-ready GLB."""
    args = parse_args()
    clear_scene()

    root = create_root()
    body_material = make_material("SlimeBlue", (0.045, 0.48, 0.96, 1.0), roughness=0.24)
    eye_material = make_material("SlimeNavy", (0.015, 0.045, 0.13, 1.0), roughness=0.34)
    highlight_material = make_material("SlimeHighlight", (0.76, 0.95, 1.0, 1.0), roughness=0.14)
    blade_material = make_material("SwordSteel", (0.66, 0.78, 0.88, 1.0), roughness=0.24, metallic=0.72)
    guard_material = make_material("SwordGold", (0.92, 0.55, 0.12, 1.0), roughness=0.32, metallic=0.28)
    grip_material = make_material("SwordGrip", (0.24, 0.10, 0.08, 1.0), roughness=0.72)

    create_body(root, body_material)
    create_face(root, eye_material, highlight_material)
    create_weapon(root, blade_material, guard_material, grip_material)

    root.rotation_euler[2] = math.radians(-8.0)
    export_glb(Path(args.output).expanduser().resolve())


if __name__ == "__main__":
    main()
