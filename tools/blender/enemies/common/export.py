from __future__ import annotations

from pathlib import Path

import bpy


def clear_scene() -> None:
    """Remove Blender startup objects before deterministic generation."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def export_glb(output_path: Path) -> None:
    """Export the assembled enemy as a standalone glTF binary."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(output_path),
        export_format="GLB",
        export_yup=True,
        export_apply=False,
        export_cameras=False,
        export_lights=False,
    )
