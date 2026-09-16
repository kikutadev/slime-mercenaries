from __future__ import annotations

import math

import bpy
from mathutils import Vector

BODY_HEIGHT = 1.18
BODY_BASE_Z = 0.035


def deform_base_vertex(co: Vector) -> Vector:
    """Map the sphere onto the canonical low, broad jelly silhouette."""
    t = max(0.0, min(1.0, (co.z + 1.0) * 0.5))
    theta = math.atan2(co.y, co.x)
    dome = max(0.0, math.sin(math.pi * t)) ** 0.42
    skirt = 1.0 + 0.20 * (1.0 - t) + 0.08 * math.sin(math.pi * t)
    asymmetry = 1.0 + 0.022 * math.sin(theta * 3.0 + 0.65) * (math.sin(math.pi * t) ** 2)
    radius = dome * skirt * asymmetry

    x = math.cos(theta) * radius
    y = math.sin(theta) * radius * 0.82 * (1.0 + 0.014 * math.cos(theta * 2.0 - 0.3))
    if t < 0.16:
        z = BODY_BASE_Z + 0.050 * ((t / 0.16) ** 2)
    else:
        p = (t - 0.16) / 0.84
        z = BODY_BASE_Z + 0.050 + (BODY_HEIGHT - 0.050) * (p ** 1.06)
    return Vector((x, y, z))


def create_body(
    root: bpy.types.Object,
    material: bpy.types.Material,
    *,
    scale: tuple[float, float, float] = (1.0, 1.0, 1.0),
) -> bpy.types.Object:
    """Create the one canonical ordinary-slime body and reusable morph targets."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=24, radius=1.0)
    body = bpy.context.active_object
    assert body is not None
    body.name = "Body"
    body.parent = root

    sx, sy, sz = scale
    for vertex in body.data.vertices:
        point = deform_base_vertex(vertex.co)
        vertex.co = Vector((point.x * sx, point.y * sy, BODY_BASE_Z + (point.z - BODY_BASE_Z) * sz))
    for polygon in body.data.polygons:
        polygon.use_smooth = True
    body.data.materials.append(material)

    basis = body.shape_key_add(name="Basis")

    def add_shape(name: str, transform) -> None:
        key = body.shape_key_add(name=name)
        for dst, src in zip(key.data, basis.data, strict=True):
            dst.co = transform(src.co.copy())

    add_shape(
        "Squash",
        lambda point: Vector((
            point.x * (1.24 - 0.04 * min(1.0, point.z / BODY_HEIGHT)),
            point.y * 1.18,
            BODY_BASE_Z + max(0.0, point.z - BODY_BASE_Z) * 0.70,
        )),
    )
    add_shape(
        "Stretch",
        lambda point: Vector((
            point.x * 0.86,
            point.y * 0.91,
            BODY_BASE_Z + max(0.0, point.z - BODY_BASE_Z) * 1.24,
        )),
    )

    def lean(point: Vector, direction: float) -> Vector:
        t = max(0.0, min(1.0, point.z / BODY_HEIGHT))
        point.x += direction * 0.22 * (t**1.45)
        point.z -= 0.040 * (t**1.15)
        return point

    add_shape("LeanLeft", lambda point: lean(point, -1.0))
    add_shape("LeanRight", lambda point: lean(point, 1.0))

    def wobble(point: Vector, direction: float) -> Vector:
        t = max(0.0, min(1.0, (point.z - BODY_BASE_Z) / BODY_HEIGHT))
        soft = math.sin(math.pi * t)
        point.x += direction * 0.12 * soft * (0.30 + 0.70 * t)
        point.y *= 1.0 + direction * 0.035 * soft
        point.z += direction * 0.025 * math.sin(math.pi * t * 2.0)
        return point

    add_shape("WobbleLeft", lambda point: wobble(point, -1.0))
    add_shape("WobbleRight", lambda point: wobble(point, 1.0))

    def hit(point: Vector, direction: float) -> Vector:
        t = max(0.0, min(1.0, point.z / BODY_HEIGHT))
        point.x += direction * 0.28 * math.sin(t * math.pi * 0.72) * t
        point.y *= 1.0 + 0.05 * t
        return point

    add_shape("HitLeft", lambda point: hit(point, -1.0))
    add_shape("HitRight", lambda point: hit(point, 1.0))
    return body
