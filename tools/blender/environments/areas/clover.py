from __future__ import annotations

import math

import bpy

from common import cube, cylinder, empty, ico, material, sphere


AREA_ID = "clover-road"
REQUIRED_ROOTS = (
    "Prop_CloverPatch",
    "Prop_FlowerCluster",
    "Prop_FenceSection",
    "Prop_RoadSign",
    "Prop_FallenLog",
    "Prop_RoundTree",
    "Prop_StonePatch",
    "Landmark_CloverGate",
)


def _flower(root: bpy.types.Object, prefix: str, x: float, z: float, stem, bloom) -> None:
    cylinder(f"{prefix}_Stem", root, (x, 0.11, z), 0.016, 0.22, stem, vertices=6)
    sphere(f"{prefix}_Bloom", root, (x, 0.24, z), (0.075, 0.045, 0.075), bloom, segments=10, rings=7)


def build() -> None:
    kit = empty("EnvironmentKitRoot")
    grass = material("CloverLeaf", (0.24, 0.62, 0.28, 1.0), 0.90)
    grass_light = material("CloverLeafLight", (0.38, 0.72, 0.34, 1.0), 0.88)
    stem = material("CloverStem", (0.27, 0.56, 0.29, 1.0), 0.94)
    flower_white = material("FlowerWhite", (0.95, 0.92, 0.78, 1.0), 0.84)
    flower_pink = material("FlowerPink", (0.90, 0.47, 0.58, 1.0), 0.84)
    wood = material("CloverWood", (0.39, 0.25, 0.15, 1.0), 0.96)
    wood_light = material("CloverWoodLight", (0.61, 0.42, 0.24, 1.0), 0.92)
    stone = material("RoadStone", (0.50, 0.56, 0.47, 1.0), 0.96)
    cream = material("SignCream", (0.84, 0.70, 0.44, 1.0), 0.94)

    patch = empty("Prop_CloverPatch", kit)
    for i, (cx, cz, size) in enumerate(((-0.18, 0.0, 1.0), (0.10, 0.05, 0.78), (0.28, -0.08, 0.60))):
        for lobe in range(3):
            angle = lobe * math.tau / 3
            sphere(
                f"Clover_{i}_{lobe}",
                patch,
                (cx + math.cos(angle) * 0.085 * size, 0.035, cz + math.sin(angle) * 0.085 * size),
                (0.115 * size, 0.032, 0.090 * size),
                grass_light if i % 2 else grass,
                segments=10,
                rings=7,
            )

    flowers = empty("Prop_FlowerCluster", kit)
    _flower(flowers, "FlowerA", -0.16, 0.02, stem, flower_white)
    _flower(flowers, "FlowerB", 0.05, -0.04, stem, flower_pink)
    _flower(flowers, "FlowerC", 0.22, 0.07, stem, flower_white)

    fence = empty("Prop_FenceSection", kit)
    for x in (-0.48, 0.48):
        cylinder(f"FencePost_{x}", fence, (x, 0.36, 0.0), 0.075, 0.72, wood, vertices=8)
    for y in (0.27, 0.48):
        cube(f"FenceRail_{y}", fence, (0.0, y, 0.0), (0.52, 0.055, 0.055), wood_light, bevel_width=0.025)

    sign = empty("Prop_RoadSign", kit)
    cylinder("SignPost", sign, (0.0, 0.60, 0.0), 0.065, 1.20, wood, vertices=8)
    cube("SignBoard", sign, (0.12, 1.08, 0.0), (0.46, 0.22, 0.07), cream, rotation_z=-0.08, bevel_width=0.07)
    sphere("SignCloverMark", sign, (0.02, 1.08, -0.08), (0.10, 0.05, 0.10), grass, segments=10, rings=7)

    log = empty("Prop_FallenLog", kit)
    body = cylinder("FallenLogBody", log, (0.0, 0.18, 0.0), 0.18, 1.15, wood, vertices=9, rotation_x=math.pi / 2)
    body.rotation_euler[2] = 0.10
    sphere("LogMoss", log, (-0.12, 0.34, -0.03), (0.34, 0.08, 0.18), grass, segments=11, rings=7)

    tree = empty("Prop_RoundTree", kit)
    cylinder("TreeTrunk", tree, (0.0, 0.74, 0.0), 0.17, 1.48, wood, vertices=8)
    ico("TreeCrownA", tree, (-0.18, 1.70, 0.0), (0.72, 0.58, 0.68), grass, subdivisions=2)
    ico("TreeCrownB", tree, (0.38, 1.58, 0.02), (0.56, 0.46, 0.53), grass_light, subdivisions=2)

    stones = empty("Prop_StonePatch", kit)
    ico("StoneA", stones, (-0.22, 0.10, 0.02), (0.25, 0.12, 0.19), stone)
    ico("StoneB", stones, (0.12, 0.08, -0.06), (0.19, 0.09, 0.15), stone)
    ico("StoneC", stones, (0.30, 0.06, 0.10), (0.13, 0.07, 0.11), stone)

    landmark = empty("Landmark_CloverGate", kit)
    for x in (-0.78, 0.78):
        cylinder(f"GatePost_{x}", landmark, (x, 1.12, 0.0), 0.22, 2.24, wood, vertices=10)
        ico(f"GateCrown_{x}", landmark, (x, 2.40, 0.0), (0.76, 0.55, 0.70), grass, subdivisions=2)
    cube("GateBeam", landmark, (0.0, 2.08, 0.0), (1.04, 0.16, 0.20), wood_light, bevel_width=0.09)
    for lobe in range(3):
        angle = lobe * math.tau / 3
        sphere(
            f"GateClover_{lobe}",
            landmark,
            (math.cos(angle) * 0.22, 2.42 + math.sin(angle) * 0.18, -0.08),
            (0.25, 0.08, 0.20),
            grass_light,
            segments=12,
            rings=8,
        )
