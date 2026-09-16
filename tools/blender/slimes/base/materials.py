from __future__ import annotations

import bpy


def make_material(
    name: str,
    color: tuple[float, float, float, float],
    *,
    roughness: float,
    metallic: float = 0.0,
    coat_weight: float | None = None,
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
        bsdf.inputs["Coat Weight"].default_value = (
            coat_weight if coat_weight is not None else (0.30 if metallic < 0.2 else 0.06)
        )
    if "Coat Roughness" in bsdf.inputs:
        bsdf.inputs["Coat Roughness"].default_value = 0.10
    return material


def disable_eye_specular(material: bpy.types.Material) -> None:
    """Keep the face graphic matte and readable at mobile gameplay scale."""
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        return
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.0
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.0
