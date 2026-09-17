from __future__ import annotations

from dataclasses import dataclass
import math

import bpy

from ..common.materials import make_face_material, make_material
from ..common.primitives import create_ellipsoid, create_empty


@dataclass(frozen=True)
class CritterDefinition:
    slug: str
    profile: str
    body_color: tuple[float, float, float, float]
    accent_color: tuple[float, float, float, float]
    belly_color: tuple[float, float, float, float]


def _roots() -> tuple[bpy.types.Object, bpy.types.Object, bpy.types.Object]:
    root = bpy.data.objects.new('EnemyRoot', None)
    bpy.context.scene.collection.objects.link(root)
    body = bpy.data.objects.new('BodyRoot', None)
    bpy.context.scene.collection.objects.link(body)
    body.parent = root
    face = bpy.data.objects.new('FaceRoot', None)
    bpy.context.scene.collection.objects.link(face)
    face.parent = root
    return root, body, face


def _soft_lobe(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    rotation_y: float,
    material: bpy.types.Material,
    parent: bpy.types.Object,
) -> bpy.types.Object:
    """Create one rounded silhouette lobe; never use pointed realistic quills/fur."""
    lobe = create_ellipsoid(name, location, scale, material, parent, segments=18, rings=12)
    lobe.rotation_euler.y = rotation_y
    return lobe


def _build_hedgehog(
    body: bpy.types.Object,
    face: bpy.types.Object,
    body_mat: bpy.types.Material,
    accent: bpy.types.Material,
    belly: bpy.types.Material,
    face_mat: bpy.types.Material,
) -> None:
    # Low bean body with one continuous plush shell. The small rim lobes only break up the
    # outline enough to read as soft quills; the shell must never become a pile of spikes.
    create_ellipsoid('Body', (0, .015, .235), (.41, .29, .215), body_mat, body, segments=28, rings=18)
    # Keep the shell low and wrapped around the back. The broad mass carries the
    # silhouette; five shallow rim lobes suggest plush quills without becoming a crown.
    shell = create_empty('ShellRoot', body, (0, .105, .205))
    create_ellipsoid('ShellMass', (0, .035, .045), (.395, .235, .205), accent, shell, segments=28, rings=18)
    for index, (x, y, z, sx, sy, sz, rotation_y) in enumerate([
        (-.315, .025, .010, .115, .145, .105, -.42),
        (-.235, .035, .115, .130, .150, .115, -.25),
        (0.000, .045, .155, .155, .155, .120,  .00),
        (.235,  .035, .115, .130, .150, .115,  .25),
        (.315,  .025, .010, .115, .145, .105,  .42),
    ]):
        _soft_lobe(f'QuillLobe_{index + 1}', (x, y, z), (sx, sy, sz), rotation_y, accent, shell)

    head = create_empty('HeadRoot', body, (0, -.170, .245))
    create_ellipsoid('Head', (0, -.015, .020), (.285, .195, .180), body_mat, head, segments=24, rings=16)
    create_ellipsoid('Muzzle', (0, -.175, -.025), (.105, .070, .070), belly, head, segments=16, rings=10)
    create_ellipsoid('Nose', (0, -.242, -.018), (.040, .026, .032), face_mat, head, segments=12, rings=8)

    ear_l = create_ellipsoid('Ear_L', (-.145, -.020, .125), (.060, .045, .073), accent, head, segments=14, rings=8)
    ear_r = create_ellipsoid('Ear_R', (.145, -.020, .125), (.060, .045, .073), accent, head, segments=14, rings=8)
    ear_l.rotation_euler.y = -.18
    ear_r.rotation_euler.y = .18

    for name, x in [('Foot_L', -.145), ('Foot_R', .145)]:
        create_ellipsoid(name, (x, -.030, .055), (.105, .125, .058), body_mat, body, segments=14, rings=8)

    eye_front = -.365
    eye_z = .300
    for name, x in [('Eye_L', -.073), ('Eye_R', .073)]:
        create_ellipsoid(name, (x, eye_front, eye_z), (.023, .011, .027), face_mat, face, segments=12, rings=8)
    create_ellipsoid('Mouth', (0, eye_front - .004, eye_z - .064), (.014, .007, .009), face_mat, face, segments=10, rings=6)


def _build_squirrel(
    body: bpy.types.Object,
    face: bpy.types.Object,
    body_mat: bpy.types.Material,
    accent: bpy.types.Material,
    belly: bpy.types.Material,
    face_mat: bpy.types.Material,
) -> None:
    # Compact pear body. The tail is deliberately one overlapping cloud/crescent mass rather
    # than separate balls, so it remains the dominant silhouette even in grayscale.
    create_ellipsoid('Body', (0, .015, .285), (.295, .240, .350), body_mat, body, segments=28, rings=18)
    create_ellipsoid('Belly', (0, -.205, .260), (.180, .066, .220), belly, body, segments=20, rings=12)

    head = create_empty('HeadRoot', body, (0, -.105, .485))
    create_ellipsoid('Head', (0, -.025, .015), (.235, .190, .195), body_mat, head, segments=24, rings=16)
    create_ellipsoid('Muzzle', (0, -.165, -.030), (.092, .062, .060), belly, head, segments=16, rings=10)
    create_ellipsoid('Nose', (0, -.222, -.026), (.031, .022, .027), face_mat, head, segments=12, rings=8)

    ear_l = create_ellipsoid('Ear_L', (-.125, -.010, .145), (.062, .048, .090), accent, head, segments=14, rings=8)
    ear_r = create_ellipsoid('Ear_R', (.125, -.010, .145), (.062, .048, .090), accent, head, segments=14, rings=8)
    ear_l.rotation_euler.y = -.25
    ear_r.rotation_euler.y = .25

    # Oversized but rear-biased crescent tail. Keeping it behind the head prevents
    # the front view from turning into three unrelated circles while preserving a
    # dominant squirrel silhouette at grayscale thumbnail size.
    tail = create_empty('TailRoot', body, (.220, .185, .175))
    _soft_lobe('TailMass', (.115, .060, .180), (.235, .165, .300), .26, accent, tail)
    _soft_lobe('TailCrown', (.235, .075, .385), (.205, .165, .245), -.28, accent, tail)
    _soft_lobe('TailTip', (.120, .070, .565), (.145, .135, .165), -.58, accent, tail)

    for name, x in [('Foot_L', -.135), ('Foot_R', .135)]:
        create_ellipsoid(name, (x, -.025, .055), (.095, .115, .058), body_mat, body, segments=14, rings=8)
    for name, x in [('Paw_L', -.150), ('Paw_R', .150)]:
        create_ellipsoid(name, (x, -.220, .300), (.064, .050, .060), body_mat, body, segments=14, rings=8)

    eye_front = -.325
    eye_z = .515
    for name, x in [('Eye_L', -.068), ('Eye_R', .068)]:
        create_ellipsoid(name, (x, eye_front, eye_z), (.026, .013, .034), face_mat, face, segments=12, rings=8)
    create_ellipsoid('Mouth', (0, eye_front - .004, eye_z - .061), (.013, .007, .009), face_mat, face, segments=10, rings=6)


def build_enemy(definition: CritterDefinition) -> bpy.types.Object:
    root, body, face = _roots()
    body_mat = make_material('CritterBody', definition.body_color, roughness=.82, coat_weight=.025)
    accent = make_material('CritterAccent', definition.accent_color, roughness=.87, coat_weight=.015)
    belly = make_material('CritterBelly', definition.belly_color, roughness=.84, coat_weight=.015)
    face_mat = make_face_material('CritterFace', (0.10, 0.08, 0.09, 1))

    if definition.profile == 'hedgehog':
        _build_hedgehog(body, face, body_mat, accent, belly, face_mat)
        create_empty('AttackOrigin', root, (0, -.405, .260))
        create_empty('EffectOrigin', root, (0, -.310, .350))
    else:
        _build_squirrel(body, face, body_mat, accent, belly, face_mat)
        create_empty('AttackOrigin', root, (0, -.365, .300))
        create_empty('EffectOrigin', root, (-.105, -.300, .360))

    create_empty('GroundOrigin', root, (0, 0, 0))
    return root


DEFINITION_TYPE = CritterDefinition
