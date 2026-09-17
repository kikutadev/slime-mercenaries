from __future__ import annotations

import bpy


def create_ellipsoid(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material: bpy.types.Material,
    parent: bpy.types.Object,
    *,
    segments: int = 28,
    rings: int = 18,
) -> bpy.types.Object:
    """Create a smooth low-cost ellipsoid suited to soft toy-like enemy forms."""
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


def create_empty(name: str, parent: bpy.types.Object, location: tuple[float, float, float]) -> bpy.types.Object:
    """Create a stable semantic runtime node/socket."""
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    return obj
