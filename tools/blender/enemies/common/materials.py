from __future__ import annotations

import bpy


def make_material(
    name: str,
    color: tuple[float, float, float, float],
    *,
    roughness: float = 0.58,
    metallic: float = 0.0,
    coat_weight: float = 0.18,
) -> bpy.types.Material:
    """Create a soft toy-like Principled material that exports cleanly to glTF."""
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    assert bsdf is not None
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat_weight
    if "Coat Roughness" in bsdf.inputs:
        bsdf.inputs["Coat Roughness"].default_value = 0.12
    return material


def make_face_material(name: str, color: tuple[float, float, float, float]) -> bpy.types.Material:
    """Keep face graphics matte enough to read on a small portrait battlefield."""
    material = make_material(name, color, roughness=0.82, coat_weight=0.0)
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf is not None and "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.08
    return material
