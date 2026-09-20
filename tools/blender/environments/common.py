from __future__ import annotations

import bpy


def material(
    name: str,
    color: tuple[float, float, float, float],
    roughness: float = 0.86,
    *,
    metallic: float = 0.0,
    emissive: tuple[float, float, float, float] | None = None,
    emissive_strength: float = 0.0,
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF") if mat.node_tree else None
    if bsdf is not None:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
        if emissive is not None and "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = emissive
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emissive_strength
    return mat


def runtime_to_blender(location: tuple[float, float, float]) -> tuple[float, float, float]:
    x, y, z = location
    return (x, -z, y)


def runtime_scale_to_blender(scale: tuple[float, float, float]) -> tuple[float, float, float]:
    x, y, z = scale
    return (x, z, y)


def empty(name: str, parent: bpy.types.Object | None = None) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    if parent is not None:
        obj.parent = parent
    return obj


def add_material(obj: bpy.types.Object, mat: bpy.types.Material) -> None:
    if obj.data is not None and hasattr(obj.data, "materials"):
        obj.data.materials.append(mat)


def bevel(obj: bpy.types.Object, width: float, segments: int = 3) -> None:
    modifier = obj.modifiers.new("SoftEdges", "BEVEL")
    modifier.width = width
    modifier.segments = segments
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def cube(
    name: str,
    parent: bpy.types.Object,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    mat: bpy.types.Material,
    *,
    rotation_y: float = 0.0,
    rotation_z: float = 0.0,
    bevel_width: float = 0.0,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=runtime_to_blender(location))
    obj = bpy.context.active_object
    assert obj is not None
    obj.name = name
    obj.parent = parent
    obj.scale = runtime_scale_to_blender(scale)
    obj.rotation_euler[2] = rotation_y
    obj.rotation_euler[1] = rotation_z
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel_width > 0:
        bevel(obj, bevel_width)
    add_material(obj, mat)
    return obj


def cylinder(
    name: str,
    parent: bpy.types.Object,
    location: tuple[float, float, float],
    radius: float,
    height: float,
    mat: bpy.types.Material,
    *,
    vertices: int = 10,
    rotation_x: float = 0.0,
    rotation_y: float = 0.0,
    rotation_z: float = 0.0,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=height,
        location=runtime_to_blender(location),
    )
    obj = bpy.context.active_object
    assert obj is not None
    obj.name = name
    obj.parent = parent
    obj.rotation_euler[0] = rotation_x
    obj.rotation_euler[2] = rotation_y
    obj.rotation_euler[1] = rotation_z
    add_material(obj, mat)
    return obj


def sphere(
    name: str,
    parent: bpy.types.Object,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    mat: bpy.types.Material,
    *,
    segments: int = 14,
    rings: int = 9,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments,
        ring_count=rings,
        radius=1.0,
        location=runtime_to_blender(location),
    )
    obj = bpy.context.active_object
    assert obj is not None
    obj.name = name
    obj.parent = parent
    obj.scale = runtime_scale_to_blender(scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    add_material(obj, mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def ico(
    name: str,
    parent: bpy.types.Object,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    mat: bpy.types.Material,
    *,
    subdivisions: int = 1,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=subdivisions,
        radius=1.0,
        location=runtime_to_blender(location),
    )
    obj = bpy.context.active_object
    assert obj is not None
    obj.name = name
    obj.parent = parent
    obj.scale = runtime_scale_to_blender(scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    add_material(obj, mat)
    return obj


def cone(
    name: str,
    parent: bpy.types.Object,
    location: tuple[float, float, float],
    radius1: float,
    radius2: float,
    height: float,
    mat: bpy.types.Material,
    *,
    vertices: int = 9,
    rotation_x: float = 0.0,
    rotation_y: float = 0.0,
    rotation_z: float = 0.0,
    bevel_width: float = 0.0,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius1,
        radius2=radius2,
        depth=height,
        location=runtime_to_blender(location),
    )
    obj = bpy.context.active_object
    assert obj is not None
    obj.name = name
    obj.parent = parent
    obj.rotation_euler[0] = rotation_x
    obj.rotation_euler[2] = rotation_y
    obj.rotation_euler[1] = rotation_z
    if bevel_width > 0:
        bevel(obj, bevel_width)
    add_material(obj, mat)
    return obj


def torus(
    name: str,
    parent: bpy.types.Object,
    location: tuple[float, float, float],
    major_radius: float,
    minor_radius: float,
    mat: bpy.types.Material,
    *,
    rotation_x: float = 0.0,
    rotation_y: float = 0.0,
    rotation_z: float = 0.0,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=24,
        minor_segments=8,
        location=runtime_to_blender(location),
    )
    obj = bpy.context.active_object
    assert obj is not None
    obj.name = name
    obj.parent = parent
    obj.rotation_euler[0] = rotation_x
    obj.rotation_euler[2] = rotation_y
    obj.rotation_euler[1] = rotation_z
    add_material(obj, mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def set_origin_zero(root: bpy.types.Object) -> None:
    root.location = (0.0, 0.0, 0.0)
