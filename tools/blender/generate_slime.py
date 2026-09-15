"""Generate the canonical Plain Slime GLB for Slime Mercenaries.

The body is the only deforming mesh. Face parts stay rigid and are adjusted at
runtime by the viewer/game according to the same deformation signal.
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
) -> bpy.types.Material:
    """Create a glTF-friendly Principled material with restrained toy gloss."""
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    assert bsdf is not None
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = 0.0
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.18
    if "Coat Roughness" in bsdf.inputs:
        bsdf.inputs["Coat Roughness"].default_value = 0.12
    return material


def create_root() -> bpy.types.Object:
    """Create the stable root used by every generated slime type."""
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


def create_body(
    root: bpy.types.Object,
    material: bpy.types.Material,
) -> bpy.types.Object:
    """Create the body mesh and all reusable morph targets."""
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
        """Create one shape key by transforming immutable Basis coordinates."""
        key = body.shape_key_add(name=name)
        for dst, src in zip(key.data, basis.data, strict=True):
            dst.co = transform(src.co.copy())

    add_shape(
        "Squash",
        lambda point: Vector(
            (
                point.x * (1.16 - 0.02 * min(1.0, point.z / BODY_HEIGHT)),
                point.y * 1.11,
                BODY_BASE_Z + max(0.0, point.z - BODY_BASE_Z) * 0.82,
            )
        ),
    )
    add_shape(
        "Stretch",
        lambda point: Vector(
            (
                point.x * 0.92,
                point.y * 0.95,
                BODY_BASE_Z + max(0.0, point.z - BODY_BASE_Z) * 1.15,
            )
        ),
    )

    def lean(point: Vector, direction: float) -> Vector:
        """Bend the upper jelly while keeping the contact pad stable."""
        t = max(0.0, min(1.0, point.z / BODY_HEIGHT))
        point.x += direction * 0.17 * (t**1.55)
        point.z -= 0.025 * (t**1.2)
        return point

    add_shape("LeanLeft", lambda point: lean(point, -1.0))
    add_shape("LeanRight", lambda point: lean(point, 1.0))

    def hit(point: Vector, direction: float) -> Vector:
        """Produce a soft lateral impact deformation for hit reactions."""
        t = max(0.0, min(1.0, point.z / BODY_HEIGHT))
        point.x += direction * 0.25 * math.sin(t * math.pi * 0.72) * t
        point.y *= 1.0 + 0.035 * t
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
    """Create a small rigid ellipsoid for face/highlight components."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments,
        ring_count=rings,
        radius=1.0,
        location=location,
    )
    obj = bpy.context.active_object
    assert obj is not None
    obj.name = name
    obj.scale = scale
    obj.parent = parent
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
        eye = create_ellipsoid(
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
    """Build the canonical Plain Slime and write it as a game-ready GLB."""
    args = parse_args()
    clear_scene()

    root = create_root()
    body_material = make_material(
        "SlimeBlue",
        (0.045, 0.48, 0.96, 1.0),
        roughness=0.24,
    )
    eye_material = make_material(
        "SlimeNavy",
        (0.015, 0.045, 0.13, 1.0),
        roughness=0.34,
    )
    highlight_material = make_material(
        "SlimeHighlight",
        (0.76, 0.95, 1.0, 1.0),
        roughness=0.14,
    )

    create_body(root, body_material)
    create_face(root, eye_material, highlight_material)

    root.rotation_euler[2] = math.radians(-8.0)
    export_glb(Path(args.output).expanduser().resolve())


if __name__ == "__main__":
    main()
