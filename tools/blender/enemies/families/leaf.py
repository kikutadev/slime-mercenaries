from __future__ import annotations

from dataclasses import dataclass

import bpy

from ..common.materials import make_face_material, make_material
from ..common.primitives import create_ellipsoid, create_empty


@dataclass(frozen=True)
class LeafDefinition:
    """Authoring data for one soft toy-like leaf enemy."""

    slug: str
    profile: str
    body_color: tuple[float, float, float, float]
    leaf_color: tuple[float, float, float, float]
    accent_color: tuple[float, float, float, float]


def _roots() -> tuple[bpy.types.Object, bpy.types.Object, bpy.types.Object]:
    root = bpy.data.objects.new("EnemyRoot", None)
    bpy.context.scene.collection.objects.link(root)

    body = bpy.data.objects.new("BodyRoot", None)
    bpy.context.scene.collection.objects.link(body)
    body.parent = root

    face = bpy.data.objects.new("FaceRoot", None)
    bpy.context.scene.collection.objects.link(face)
    face.parent = root
    return root, body, face


def _create_soft_leaf(
    name: str,
    parent: bpy.types.Object,
    material: bpy.types.Material,
    *,
    width: float,
    height: float,
    thickness: float,
    location: tuple[float, float, float] = (0.0, 0.0, 0.0),
) -> bpy.types.Object:
    """Create a broad, beveled teardrop leaf in the authored X/Z plane.

    The old implementation used a flattened UV sphere. At gameplay scale that read as
    a mushroom cap or rigid blade. This mesh keeps one low-frequency outline with a
    pointed botanical tip and a visibly plush edge.
    """

    # Clockwise when viewed from authored local -Y (the character front).
    outline = (
        (0.00, 0.00),
        (-0.30, 0.08),
        (-0.47, 0.24),
        (-0.52, 0.48),
        (-0.42, 0.72),
        (-0.22, 0.94),
        (0.00, 1.10),
        (0.22, 0.94),
        (0.42, 0.72),
        (0.52, 0.48),
        (0.47, 0.24),
        (0.30, 0.08),
    )
    half_depth = thickness * 0.5
    front = [(x * width, -half_depth, z * height) for x, z in outline]
    back = [(x * width, half_depth, z * height) for x, z in outline]
    vertices = front + back
    count = len(outline)

    faces: list[tuple[int, ...]] = [
        tuple(range(count)),
        tuple(range(count * 2 - 1, count - 1, -1)),
    ]
    for index in range(count):
        nxt = (index + 1) % count
        faces.append((index, nxt, count + nxt, count + index))

    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()

    leaf = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(leaf)
    leaf.parent = parent
    leaf.location = location
    leaf.data.materials.append(material)

    bevel = leaf.modifiers.new("SoftLeafEdge", "BEVEL")
    bevel.width = min(width, height) * 0.055
    bevel.segments = 3
    bevel.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = leaf
    leaf.select_set(True)
    bpy.ops.object.shade_smooth()
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    leaf.select_set(False)
    return leaf


def _create_leaf_vein(
    name: str,
    parent: bpy.types.Object,
    material: bpy.types.Material,
    *,
    height: float,
    depth: float,
) -> None:
    # One broad midrib is enough at mobile scale; detailed vein networks become noise.
    create_ellipsoid(
        name,
        (0.0, -depth * 0.62, height * 0.43),
        (0.018, 0.010, height * 0.36),
        material,
        parent,
        segments=14,
        rings=8,
    )


def _create_core(
    body: bpy.types.Object,
    face: bpy.types.Object,
    body_mat: bpy.types.Material,
    face_mat: bpy.types.Material,
    cheek_mat: bpy.types.Material,
    *,
    profile: str,
) -> None:
    if profile == "single":
        core_scale = (0.255, 0.225, 0.245)
        core_z = 0.245
        eye_spacing = 0.074
    else:
        core_scale = (0.235, 0.210, 0.225)
        core_z = 0.225
        eye_spacing = 0.070

    create_ellipsoid("Core", (0.0, 0.0, core_z), core_scale, body_mat, body, segments=26, rings=18)

    # Tiny root nubs ground the enemy without creating a walking/leg silhouette.
    for name, x in (("Foot_L", -0.105), ("Foot_R", 0.105)):
        create_ellipsoid(
            name,
            (x, -0.005, 0.055),
            (0.075, 0.105, 0.047),
            body_mat,
            body,
            segments=14,
            rings=9,
        )

    front_y = -core_scale[1] * 0.965
    eye_z = core_z + 0.025
    for name, x in (("Eye_L", -eye_spacing), ("Eye_R", eye_spacing)):
        create_ellipsoid(
            name,
            (x, front_y, eye_z),
            (0.029, 0.014, 0.036),
            face_mat,
            face,
            segments=12,
            rings=8,
        )

    create_ellipsoid(
        "Mouth",
        (0.0, front_y - 0.006, eye_z - 0.070),
        (0.018, 0.008, 0.010),
        face_mat,
        face,
        segments=10,
        rings=6,
    )
    for name, x in (("Cheek_L", -0.125), ("Cheek_R", 0.125)):
        create_ellipsoid(
            name,
            (x, front_y - 0.002, eye_z - 0.030),
            (0.022, 0.007, 0.012),
            cheek_mat,
            face,
            segments=10,
            rings=6,
        )


def _build_leafling(
    body: bpy.types.Object,
    leaf_mat: bpy.types.Material,
    accent_mat: bpy.types.Material,
) -> None:
    # One broad upright leaf, deliberately not a horizontal cap.
    leaf_root = create_empty("LeafRoot", body, (0.0, 0.020, 0.425))
    leaf_root.rotation_euler.x = 0.055
    leaf_root.rotation_euler.z = -0.105

    width = 0.82
    height = 0.465
    depth = 0.075
    _create_soft_leaf("Leaf", leaf_root, leaf_mat, width=width, height=height, thickness=depth)
    _create_leaf_vein("LeafVein", leaf_root, accent_mat, height=height, depth=depth)

    # A small terminal lobe gives the shared secondary channel something physical to
    # lag behind the broad leaf without introducing a segmented or blade-like body.
    secondary = create_empty("LeafSecondary", leaf_root, (0.0, -0.002, height * 0.88))
    _create_soft_leaf(
        "LeafTipLobe",
        secondary,
        leaf_mat,
        width=0.21,
        height=0.14,
        thickness=0.060,
        location=(0.0, 0.0, -0.020),
    )
    create_empty("LeafTip", secondary, (0.0, 0.0, 0.145))


def _build_whirl_leaf(
    body: bpy.types.Object,
    leaf_mat: bpy.types.Material,
    accent_mat: bpy.types.Material,
) -> None:
    # Two broad teardrop leaves meet at one soft center. Their V/pinwheel silhouette
    # is intentionally much wider than Leafling before color is considered.
    leaf_root = create_empty("LeafRoot", body, (0.0, 0.015, 0.405))
    leaf_root.rotation_euler.y = -1.02
    leaf_root.rotation_euler.z = -0.08

    blade_width = 0.46
    blade_height = 0.34
    blade_depth = 0.070
    _create_soft_leaf("Leaf", leaf_root, leaf_mat, width=blade_width, height=blade_height, thickness=blade_depth)
    _create_leaf_vein("LeafVein", leaf_root, accent_mat, height=blade_height, depth=blade_depth)

    secondary = create_empty("LeafSecondary", leaf_root, (0.0, 0.0, 0.0))
    secondary.rotation_euler.y = 2.04
    _create_soft_leaf(
        "Leaf_Secondary",
        secondary,
        accent_mat,
        width=blade_width * 0.96,
        height=blade_height * 0.96,
        thickness=blade_depth,
    )
    _create_leaf_vein("LeafVein_Secondary", secondary, leaf_mat, height=blade_height * 0.96, depth=blade_depth)

    # A plush center reads as a plant joint rather than a mechanical propeller hub.
    create_ellipsoid(
        "LeafHub",
        (0.0, -0.005, 0.0),
        (0.115, 0.090, 0.105),
        accent_mat,
        leaf_root,
        segments=18,
        rings=12,
    )
    create_empty("LeafTip", leaf_root, (0.0, 0.0, blade_height * 1.10))


def build_enemy(definition: LeafDefinition):
    root, body, face = _roots()
    body_mat = make_material("LeafBody", definition.body_color, roughness=0.78, coat_weight=0.035)
    leaf_mat = make_material("LeafTop", definition.leaf_color, roughness=0.84, coat_weight=0.018)
    accent_mat = make_material("LeafAccent", definition.accent_color, roughness=0.86, coat_weight=0.010)
    face_mat = make_face_material("LeafFace", (0.10, 0.09, 0.10, 1))
    cheek_mat = make_face_material("LeafCheek", (0.95, 0.52, 0.55, 1))

    _create_core(body, face, body_mat, face_mat, cheek_mat, profile=definition.profile)
    if definition.profile == "single":
        _build_leafling(body, leaf_mat, accent_mat)
    else:
        _build_whirl_leaf(body, leaf_mat, accent_mat)

    create_empty("AttackOrigin", root, (0.0, -0.34, 0.33))
    create_empty("EffectOrigin", root, (0.0, -0.27, 0.54 if definition.profile == "single" else 0.48))
    create_empty("GroundOrigin", root, (0.0, 0.0, 0.0))
    return root


DEFINITION_TYPE = LeafDefinition
