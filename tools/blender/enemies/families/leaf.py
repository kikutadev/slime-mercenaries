from __future__ import annotations
from dataclasses import dataclass
import bpy
from ..common.materials import make_face_material, make_material
from ..common.primitives import create_ellipsoid, create_empty

@dataclass(frozen=True)
class LeafDefinition:
    slug: str
    profile: str
    body_color: tuple[float,float,float,float]
    leaf_color: tuple[float,float,float,float]
    accent_color: tuple[float,float,float,float]


def _roots():
    root=bpy.data.objects.new('EnemyRoot',None); bpy.context.scene.collection.objects.link(root)
    body=bpy.data.objects.new('BodyRoot',None); bpy.context.scene.collection.objects.link(body); body.parent=root
    face=bpy.data.objects.new('FaceRoot',None); bpy.context.scene.collection.objects.link(face); face.parent=root
    return root,body,face


def build_enemy(d: LeafDefinition):
    root,body,face=_roots()
    body_mat=make_material('LeafBody',d.body_color,roughness=.72,coat_weight=.08)
    leaf_mat=make_material('LeafTop',d.leaf_color,roughness=.78,coat_weight=.05)
    accent=make_material('LeafAccent',d.accent_color,roughness=.8,coat_weight=.02)
    face_mat=make_face_material('LeafFace',(0.10,0.09,0.10,1))
    cheek=make_face_material('LeafCheek',(0.95,0.52,0.55,1))
    create_ellipsoid('Core',(0,0,.27),(.28,.23,.25),body_mat,body,segments=24,rings=16)
    for n,x in [('Foot_L',-.13),('Foot_R',.13)]: create_ellipsoid(n,(x,-.01,.07),(.11,.15,.07),body_mat,body,segments=16,rings=10)
    leaf_root=create_empty('LeafRoot',body,(0,0,.45))
    if d.profile=='single':
        leaf=create_ellipsoid('Leaf',(0,.015,.13),(.43,.16,.22),leaf_mat,leaf_root,segments=28,rings=16); leaf.rotation_euler.y=-.18
        create_ellipsoid('LeafVein',(0,-.145,.13),(.27,.015,.018),accent,leaf_root,segments=14,rings=8)
        tip=create_empty('LeafTip',leaf_root,(.39,0,.15))
    else:
        a=create_ellipsoid('Leaf',(0,.015,.10),(.40,.14,.17),leaf_mat,leaf_root,segments=26,rings=14); a.rotation_euler.y=-.20; a.rotation_euler.z=.42
        sec=create_empty('LeafSecondary',leaf_root,(0,0,.04))
        b=create_ellipsoid('Leaf_Secondary',(0,.018,.09),(.38,.14,.16),accent,sec,segments=26,rings=14); b.rotation_euler.y=.18; b.rotation_euler.z=-.58
        tip=create_empty('LeafTip',leaf_root,(.34,0,.16))
    front=-.225
    for n,x in [('Eye_L',-.075),('Eye_R',.075)]: create_ellipsoid(n,(x,front,.30),(.030,.015,.038),face_mat,face,segments=12,rings=8)
    create_ellipsoid('Mouth',(0,front-.006,.235),(.020,.009,.010),face_mat,face,segments=10,rings=6)
    for n,x in [('Cheek_L',-.13),('Cheek_R',.13)]: create_ellipsoid(n,(x,front-.002,.265),(.025,.008,.014),cheek,face,segments=10,rings=6)
    create_empty('AttackOrigin',root,(0,-.34,.34)); create_empty('EffectOrigin',root,(0,-.25,.58)); create_empty('GroundOrigin',root,(0,0,0))
    return root

DEFINITION_TYPE=LeafDefinition
