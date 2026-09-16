from __future__ import annotations

from pathlib import Path

import bpy

from .materials import disable_eye_specular
from .primitives import create_ellipsoid


SOCKET_NAMES = (
    "HeadSocket",
    "FrontLeftSocket",
    "FrontRightSocket",
    "BackSocket",
    "WeaponSocket",
    "OffhandSocket",
    "ProjectileOrigin",
    "SpellOrigin",
)


def clear_scene() -> None:
    """Remove startup objects from the temporary generation scene."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def create_root() -> bpy.types.Object:
    """Create the stable root shared by every exported slime."""
    root = bpy.data.objects.new("SlimeRoot", None)
    bpy.context.scene.collection.objects.link(root)
    return root


def create_sockets(root: bpy.types.Object) -> dict[str, bpy.types.Object]:
    """Create stable attachment points without baking job identity into the body."""
    sockets: dict[str, bpy.types.Object] = {}
    transforms = {
        "HeadSocket": ((0.0, -0.02, 1.06), (0.0, 0.0, 0.0)),
        "FrontLeftSocket": ((-0.72, -0.52, 0.50), (0.0, 0.0, 0.0)),
        "FrontRightSocket": ((0.72, -0.52, 0.50), (0.0, 0.0, 0.0)),
        "BackSocket": ((0.0, 0.54, 0.55), (0.0, 0.0, 0.0)),
        "WeaponSocket": ((0.0, 0.0, 0.0), (0.0, 0.0, 0.0)),
        "OffhandSocket": ((0.0, 0.0, 0.0), (0.0, 0.0, 0.0)),
        "ProjectileOrigin": ((0.0, -0.92, 0.60), (0.0, 0.0, 0.0)),
        "SpellOrigin": ((0.0, -0.92, 0.70), (0.0, 0.0, 0.0)),
    }
    for name in SOCKET_NAMES:
        obj = bpy.data.objects.new(name, None)
        bpy.context.scene.collection.objects.link(obj)
        obj.parent = root
        location, rotation = transforms[name]
        obj.location = location
        obj.rotation_euler = rotation
        sockets[name] = obj
    return sockets


def create_face(
    root: bpy.types.Object,
    eye_material: bpy.types.Material,
    *,
    eye_spacing: float = 0.225,
    eye_scale: float = 1.0,
    eye_height: float = 0.68,
    face_offset_y: float = -0.24,
) -> bpy.types.Object:
    """Create the reusable matte face. The face points toward local -Y."""
    disable_eye_specular(eye_material)
    face_root = bpy.data.objects.new("FaceRoot", None)
    bpy.context.scene.collection.objects.link(face_root)
    face_root.parent = root
    face_root.location = (0.0, face_offset_y, 0.0)

    for name, x in (("Eye_L", -eye_spacing), ("Eye_R", eye_spacing)):
        create_ellipsoid(
            name,
            (x, -0.765, eye_height),
            (0.092 * eye_scale, 0.046 * eye_scale, 0.116 * eye_scale),
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


def export_glb(output_path: Path) -> None:
    """Export one assembled slime as a compact standalone GLB."""
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
