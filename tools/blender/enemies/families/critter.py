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
    body_color: tuple[float,float,float,float]
    accent_color: tuple[float,float,float,float]
    belly_color: tuple[float,float,float,float]


def _roots():
    root=bpy.data.objects.new('EnemyRoot',None); bpy.context.scene.collection.objects.link(root)
    body=bpy.data.objects.new('BodyRoot',None); bpy.context.scene.collection.objects.link(body); body.parent=root
    face=bpy.data.objects.new('FaceRoot',None); bpy.context.scene.collection.objects.link(face); face.parent=root
    return root,body,face


def build_enemy(d: CritterDefinition):
    root,body,face=_roots()
    body_mat=make_material('CritterBody',d.body_color,roughness=.78,coat_weight=.04)
    accent=make_material('CritterAccent',d.accent_color,roughness=.82,coat_weight=.02)
    belly=make_material('CritterBelly',d.belly_color,roughness=.8,coat_weight=.02)
    face_mat=make_face_material('CritterFace',(0.10,0.08,0.09,1)); cheek=make_face_material('CritterCheek',(0.92,0.48,0.50,1))
    head=create_empty('HeadRoot',body,(0,-.03,.33))
    shell=None; tail=None
    if d.profile=='hedgehog':
        create_ellipsoid('Body',(0,.02,.27),(.42,.29,.24),body_mat,body,segments=26,rings=18)
        shell=create_empty('ShellRoot',body,(0,.08,.35))
        for i,(x,z,sx,sz) in enumerate([(-.27,.04,.22,.18),(0,.10,.29,.23),(.27,.04,.22,.18),(-.14,.22,.20,.16),(.14,.22,.20,.16)]):
            create_ellipsoid(f'QuillLobe_{i+1}',(x,.04,z),(sx,.18,sz),accent,shell,segments=18,rings=12)
        create_ellipsoid('Head',(0,-.17,.31),(.25,.18,.21),body_mat,head,segments=22,rings=14)
        create_ellipsoid('Snout',(0,-.33,.28),(.095,.08,.075),belly,head,segments=16,rings=10)
    else:
        create_ellipsoid('Body',(0,.02,.30),(.30,.25,.34),body_mat,body,segments=26,rings=18)
        create_ellipsoid('Belly',(0,-.21,.26),(.19,.07,.23),belly,body,segments=20,rings=12)
        create_ellipsoid('Head',(0,-.08,.49),(.25,.21,.23),body_mat,head,segments=22,rings=14)
        tail=create_empty('TailRoot',body,(.25,.14,.42))
        for i,(x,z,sx,sz,rot) in enumerate([(.14,.02,.22,.28,.38),(.27,.19,.25,.31,.62),(.20,.42,.20,.26,.88)]):
            t=create_ellipsoid(f'TailLobe_{i+1}',(x,.08,z),(sx,.16,sz),accent,tail,segments=22,rings=14); t.rotation_euler.y=rot
        create_ellipsoid('AcornCharm',(-.16,-.22,.36),(.065,.05,.08),accent,body,segments=14,rings=10)
    for n,x in [('Foot_L',-.15),('Foot_R',.15)]: create_ellipsoid(n,(x,-.04,.07),(.11,.14,.07),body_mat,body,segments=14,rings=8)
    earL=create_ellipsoid('Ear_L',(-.13,-.05,.18),(.07,.055,.10),accent,head,segments=14,rings=8); earL.rotation_euler.y=-.15
    earR=create_ellipsoid('Ear_R',(.13,-.05,.18),(.07,.055,.10),accent,head,segments=14,rings=8); earR.rotation_euler.y=.15
    front=-.24 if d.profile=='hedgehog' else -.20
    eyez=.36 if d.profile=='hedgehog' else .51
    for n,x in [('Eye_L',-.070),('Eye_R',.070)]: create_ellipsoid(n,(x,front,eyez),(.029,.014,.037),face_mat,face,segments=12,rings=8)
    create_ellipsoid('Mouth',(0,front-.006,eyez-.065),(.018,.008,.010),face_mat,face,segments=10,rings=6)
    for n,x in [('Cheek_L',-.12),('Cheek_R',.12)]: create_ellipsoid(n,(x,front-.001,eyez-.025),(.023,.008,.013),cheek,face,segments=10,rings=6)
    create_empty('AttackOrigin',root,(0,-.38,.32)); create_empty('EffectOrigin',root,(0,-.28,.45)); create_empty('GroundOrigin',root,(0,0,0))
    return root
DEFINITION_TYPE=CritterDefinition
