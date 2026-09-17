from __future__ import annotations
from dataclasses import dataclass
import math
import bpy
from ..common.materials import make_face_material, make_material
from ..common.primitives import create_ellipsoid, create_empty

@dataclass(frozen=True)
class FlowerDefinition:
    slug: str
    profile: str
    body_color: tuple[float,float,float,float]
    petal_color: tuple[float,float,float,float]
    center_color: tuple[float,float,float,float]
    leaf_color: tuple[float,float,float,float]


def _roots():
    root=bpy.data.objects.new('EnemyRoot',None); bpy.context.scene.collection.objects.link(root)
    body=bpy.data.objects.new('BodyRoot',None); bpy.context.scene.collection.objects.link(body); body.parent=root
    face=bpy.data.objects.new('FaceRoot',None); bpy.context.scene.collection.objects.link(face); face.parent=root
    return root,body,face


def build_enemy(d: FlowerDefinition):
    root,body,face=_roots()
    body_mat=make_material('FlowerBody',d.body_color,roughness=.76,coat_weight=.05)
    petal_mat=make_material('FlowerPetal',d.petal_color,roughness=.72,coat_weight=.07)
    center_mat=make_material('FlowerCenter',d.center_color,roughness=.74,coat_weight=.05)
    leaf_mat=make_material('FlowerLeaf',d.leaf_color,roughness=.80,coat_weight=.02)
    face_mat=make_face_material('FlowerFace',(0.11,0.09,0.11,1)); cheek=make_face_material('FlowerCheek',(0.96,0.55,0.62,1))
    stem_root=create_empty('StemRoot',body,(0,0,0))
    create_ellipsoid('Stem',(0,0,.25),(.22,.19,.25),body_mat,stem_root,segments=22,rings=14)
    for n,x in [('Foot_L',-.12),('Foot_R',.12)]: create_ellipsoid(n,(x,0,.06),(.10,.13,.06),body_mat,body,segments=14,rings=8)
    for n,x,rot in [('Leaf_L',-.24,-.35),('Leaf_R',.24,.35)]:
        leaf=create_ellipsoid(n,(x,.01,.22),(.16,.07,.08),leaf_mat,body,segments=18,rings=10); leaf.rotation_euler.y=rot
    head=create_empty('HeadRoot',body,(0,0,.52)); petal_root=create_empty('PetalRoot',head,(0,0,0))
    if d.profile=='bud':
        create_ellipsoid('BudCore',(0,0,.12),(.24,.18,.30),center_mat,head,segments=24,rings=16)
        for i in range(4):
            angle=(i/4)*math.pi*2
            pet=create_ellipsoid(f'Petal_{i+1}',(math.cos(angle)*.13,-.02+math.sin(angle)*.035,.13),(.13,.08,.24),petal_mat,petal_root,segments=20,rings=12)
            pet.rotation_euler.y=math.cos(angle)*.28; pet.rotation_euler.x=math.sin(angle)*.18
    else:
        puff=create_empty('PuffRoot',head,(0,0,.12))
        for i,(x,z,s) in enumerate([(-.22,.04,.22),(0,.12,.22),(.22,.04,.22),(-.12,.22,.18),(.12,.22,.18),(0,-.02,.20)]):
            create_ellipsoid(f'Puff_{i+1}',(x,0,z),(s,.14,s),petal_mat,puff,segments=20,rings=12)
        create_ellipsoid('PuffCenter',(0,-.10,.12),(.12,.06,.12),center_mat,puff,segments=18,rings=10)
    front=-.19
    for n,x in [('Eye_L',-.066),('Eye_R',.066)]: create_ellipsoid(n,(x,front,.29),(.028,.014,.036),face_mat,face,segments=12,rings=8)
    create_ellipsoid('Mouth',(0,front-.006,.225),(.019,.008,.010),face_mat,face,segments=10,rings=6)
    for n,x in [('Cheek_L',-.115),('Cheek_R',.115)]: create_ellipsoid(n,(x,front-.002,.26),(.024,.008,.013),cheek,face,segments=10,rings=6)
    create_empty('AttackOrigin',root,(0,-.30,.34)); create_empty('EffectOrigin',root,(0,-.22,.72)); create_empty('GroundOrigin',root,(0,0,0))
    return root
DEFINITION_TYPE=FlowerDefinition
