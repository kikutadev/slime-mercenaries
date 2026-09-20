from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

DEFAULT_SLUGS = (
    "snow-roller",
    "ice-bug",
    "scarf-snowman",
    "icicle-lantern",
    "snow-statue-guardian",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=".tmp/enemy-silhouettes")
    parser.add_argument("--slugs", nargs="*", default=DEFAULT_SLUGS)
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(argv)


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        # Orphans are harmless, but clearing makes repeated background runs deterministic.
        pass


def bounds(root: bpy.types.Object) -> tuple[Vector, Vector]:
    points: list[Vector] = []
    for obj in root.children_recursive:
        if obj.type != "MESH":
            continue
        points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    minimum = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    maximum = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return minimum, maximum


def look_at(camera: bpy.types.Object, target: Vector) -> None:
    direction = target - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def render_slug(root_dir: Path, slug: str, output_dir: Path) -> None:
    clear_scene()
    bpy.ops.import_scene.gltf(filepath=str((root_dir / "public/assets/enemies" / f"{slug}.glb").resolve()))
    root = bpy.data.objects["EnemyRoot"]
    minimum, maximum = bounds(root)
    center = (minimum + maximum) * 0.5
    size = maximum - minimum

    silhouette = bpy.data.materials.new("QA_Silhouette")
    silhouette.diffuse_color = (0.02, 0.02, 0.02, 1.0)
    silhouette.use_nodes = True
    bsdf = silhouette.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.02, 0.02, 0.02, 1.0)
        bsdf.inputs["Roughness"].default_value = 1.0

    for obj in root.children_recursive:
        if obj.type == "MESH":
            obj.data.materials.clear()
            obj.data.materials.append(silhouette)

    camera_data = bpy.data.cameras.new("SilhouetteCamera")
    camera = bpy.data.objects.new("SilhouetteCamera", camera_data)
    bpy.context.scene.collection.objects.link(camera)
    direction = Vector((2.6, -5.0, 2.6)).normalized()
    camera.location = center + direction * 6.0
    look_at(camera, center)
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = max(size.x, size.z) * 1.35
    bpy.context.scene.camera = camera

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 128
    scene.render.resolution_y = 128
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = True
    scene.render.filepath = str((output_dir / f"{slug}.png").resolve())
    scene.world.color = (1.0, 1.0, 1.0)
    scene.render.image_settings.color_depth = "8"

    bpy.ops.render.render(write_still=True)
    print(f"rendered {slug} -> {scene.render.filepath}")


def main() -> None:
    args = parse_args()
    root_dir = Path(__file__).resolve().parents[2]
    output_dir = (root_dir / args.output).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    for slug in args.slugs:
        render_slug(root_dir, slug, output_dir)


if __name__ == "__main__":
    main()
