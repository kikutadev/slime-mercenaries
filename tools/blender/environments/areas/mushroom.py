from __future__ import annotations

import math

import bpy

from common import cube, cylinder, empty, ico, material, sphere


AREA_ID = "mushroom-forest"
REQUIRED_ROOTS = (
    "Prop_MushroomCluster",
    "Prop_BroadCap",
    "Prop_Fern",
    "Prop_RootArch",
    "Prop_Stump",
    "Prop_FallenLog",
    "Prop_GlowMushroom",
    "Prop_DeepTree",
    "Landmark_HollowTree",
)


def _mushroom(root: bpy.types.Object, prefix: str, x: float, z: float, size: float, stem_mat, cap_mat) -> None:
    cylinder(f"{prefix}_Stem", root, (x, 0.22 * size, z), 0.085 * size, 0.44 * size, stem_mat, vertices=9)
    cap = sphere(
        f"{prefix}_Cap",
        root,
        (x, 0.49 * size, z),
        (0.31 * size, 0.15 * size, 0.29 * size),
        cap_mat,
        segments=16,
        rings=9,
    )
    cap.rotation_euler[1] = 0.08 * (1 if x >= 0 else -1)


def build() -> None:
    root = empty("EnvironmentKitRoot")

    bark = material("Bark", (0.25, 0.20, 0.23, 1.0), 0.95)
    bark_light = material("BarkLight", (0.34, 0.27, 0.29, 1.0), 0.93)
    stem = material("MushroomStem", (0.72, 0.68, 0.58, 1.0), 0.92)
    cap_coral = material("CapCoral", (0.74, 0.34, 0.28, 1.0), 0.82)
    cap_orange = material("CapOrange", (0.80, 0.48, 0.25, 1.0), 0.84)
    cap_violet = material("CapViolet", (0.49, 0.37, 0.58, 1.0), 0.86)
    fern_mat = material("Fern", (0.25, 0.49, 0.38, 1.0), 0.92)
    deep_leaf = material("DeepLeaf", (0.18, 0.37, 0.34, 1.0), 0.94)
    glow_cap = material(
        "GlowCap",
        (0.47, 0.58, 0.69, 1.0),
        0.66,
        emissive=(0.31, 0.43, 0.62, 1.0),
        emissive_strength=0.45,
    )
    hollow = material("Hollow", (0.055, 0.050, 0.070, 1.0), 1.0)

    cluster = empty("Prop_MushroomCluster", root)
    _mushroom(cluster, "ClusterA", -0.19, 0.02, 0.78, stem, cap_coral)
    _mushroom(cluster, "ClusterB", 0.08, -0.02, 0.60, stem, cap_orange)
    _mushroom(cluster, "ClusterC", 0.27, 0.08, 0.48, stem, cap_violet)

    broad = empty("Prop_BroadCap", root)
    cylinder("BroadCap_Stem", broad, (0.0, 0.37, 0.0), 0.13, 0.74, stem, vertices=10)
    sphere("BroadCap_Cap", broad, (0.0, 0.78, 0.0), (0.63, 0.22, 0.56), cap_coral, segments=18, rings=10)
    sphere("BroadCap_Underside", broad, (0.0, 0.68, 0.0), (0.48, 0.07, 0.43), stem, segments=16, rings=8)

    fern = empty("Prop_Fern", root)
    for index, (angle, length) in enumerate(((-0.78, 0.48), (-0.40, 0.58), (0.0, 0.62), (0.40, 0.58), (0.78, 0.48))):
        leaf = sphere(
            f"Fern_Leaf_{index}",
            fern,
            (math.sin(angle) * 0.18, 0.22 + math.cos(angle) * 0.05, math.cos(angle) * 0.04),
            (0.085, length, 0.055),
            fern_mat,
            segments=10,
            rings=7,
        )
        leaf.rotation_euler[1] = angle * 0.85

    root_arch = empty("Prop_RootArch", root)
    cube("RootArch_Left", root_arch, (-0.38, 0.38, 0.0), (0.15, 0.38, 0.18), bark, rotation_z=-0.18, bevel_width=0.08)
    cube("RootArch_Right", root_arch, (0.38, 0.38, 0.0), (0.15, 0.38, 0.18), bark, rotation_z=0.18, bevel_width=0.08)
    cube("RootArch_Top", root_arch, (0.0, 0.72, 0.0), (0.44, 0.13, 0.18), bark_light, bevel_width=0.10)

    stump = empty("Prop_Stump", root)
    cylinder("Stump_Trunk", stump, (0.0, 0.30, 0.0), 0.34, 0.60, bark, vertices=11)
    cylinder("Stump_Top", stump, (0.0, 0.605, 0.0), 0.30, 0.035, bark_light, vertices=11)
    for index, angle in enumerate((0.2, 2.35, 4.45)):
        cube(
            f"Stump_Root_{index}",
            stump,
            (math.cos(angle) * 0.31, 0.08, math.sin(angle) * 0.31),
            (0.20, 0.08, 0.10),
            bark,
            rotation_y=-angle,
            bevel_width=0.05,
        )

    fallen = empty("Prop_FallenLog", root)
    log = cylinder("FallenLog_Body", fallen, (0.0, 0.18, 0.0), 0.20, 1.15, bark, vertices=10, rotation_x=math.pi / 2)
    log.rotation_euler[2] = 0.12
    sphere("FallenLog_Moss", fallen, (-0.12, 0.37, -0.04), (0.34, 0.09, 0.18), deep_leaf, segments=11, rings=7)

    glow = empty("Prop_GlowMushroom", root)
    _mushroom(glow, "GlowA", -0.12, 0.02, 0.70, stem, glow_cap)
    _mushroom(glow, "GlowB", 0.18, -0.06, 0.48, stem, glow_cap)

    tree = empty("Prop_DeepTree", root)
    cylinder("DeepTree_Trunk", tree, (0.0, 0.95, 0.0), 0.26, 1.90, bark, vertices=10)
    ico("DeepTree_CrownA", tree, (-0.18, 2.05, 0.0), (0.80, 0.60, 0.72), deep_leaf)
    ico("DeepTree_CrownB", tree, (0.42, 1.93, 0.04), (0.68, 0.50, 0.62), deep_leaf)

    landmark = empty("Landmark_HollowTree", root)
    cylinder("Landmark_Trunk", landmark, (0.0, 1.50, 0.0), 0.72, 3.00, bark, vertices=12)
    sphere("Landmark_Hollow", landmark, (0.0, 1.14, -0.69), (0.28, 0.50, 0.07), hollow, segments=15, rings=9)
    cube("Landmark_Branch_L", landmark, (-0.62, 2.36, 0.0), (0.54, 0.15, 0.20), bark_light, rotation_z=-0.30, bevel_width=0.10)
    cube("Landmark_Branch_R", landmark, (0.64, 2.48, 0.02), (0.58, 0.15, 0.20), bark_light, rotation_z=0.28, bevel_width=0.10)
    ico("Landmark_Crown_L", landmark, (-0.70, 2.92, 0.02), (0.95, 0.55, 0.80), deep_leaf)
    ico("Landmark_Crown_R", landmark, (0.70, 2.90, 0.02), (0.90, 0.52, 0.78), deep_leaf)
    cylinder("Landmark_ShelfStem", landmark, (0.66, 1.70, -0.08), 0.11, 0.34, stem, vertices=9)
    shelf = sphere("Landmark_ShelfCap", landmark, (0.77, 1.88, -0.08), (0.78, 0.18, 0.54), cap_coral, segments=18, rings=9)
    shelf.rotation_euler[1] = -0.12
