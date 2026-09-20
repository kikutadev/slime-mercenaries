from __future__ import annotations

import math

from common import cube, cylinder, empty, ico, material, sphere, torus


AREA_ID = "sunken-marsh"
REQUIRED_ROOTS = (
    "Prop_LilyPad",
    "Prop_Reeds",
    "Prop_BubbleVent",
    "Prop_SunkenColumn",
    "Prop_BridgeChunk",
    "Prop_MossRock",
    "Prop_DeadTree",
    "Landmark_SunkenGate",
)


def build() -> None:
    kit = empty("EnvironmentKitRoot")
    moss = material("MarshMoss", (0.28, 0.49, 0.31, 1.0), 0.94)
    moss_light = material("MarshMossLight", (0.40, 0.59, 0.35, 1.0), 0.92)
    stone = material("MarshStone", (0.45, 0.49, 0.47, 1.0), 0.98)
    stone_dark = material("MarshStoneDark", (0.31, 0.36, 0.36, 1.0), 0.98)
    reed = material("MarshReed", (0.31, 0.49, 0.25, 1.0), 0.94)
    reed_tip = material("MarshReedTip", (0.38, 0.27, 0.18, 1.0), 0.96)
    wood = material("MarshWood", (0.30, 0.24, 0.20, 1.0), 0.98)
    water_glow = material(
        "MarshBubble",
        (0.35, 0.69, 0.68, 1.0),
        0.38,
        emissive=(0.19, 0.52, 0.52, 1.0),
        emissive_strength=0.18,
    )

    lily = empty("Prop_LilyPad", kit)
    pad = sphere("LilyPad", lily, (0.0, 0.035, 0.0), (0.47, 0.035, 0.40), moss_light, segments=16, rings=8)
    pad.rotation_euler[1] = -0.18
    sphere("LilyBud", lily, (0.22, 0.12, -0.05), (0.09, 0.08, 0.09), water_glow, segments=10, rings=7)

    reeds = empty("Prop_Reeds", kit)
    for index, (x, z, h) in enumerate(((-0.22, 0.03, 0.72), (-0.06, -0.05, 0.92), (0.12, 0.02, 0.78), (0.27, -0.06, 0.62))):
        cylinder(f"Reed_{index}", reeds, (x, h * 0.5, z), 0.025, h, reed, vertices=7, rotation_z=0.05 * (index - 1.5))
        cylinder(f"ReedTip_{index}", reeds, (x + 0.01, h + 0.06, z), 0.045, 0.14, reed_tip, vertices=8)

    vent = empty("Prop_BubbleVent", kit)
    torus("VentRing", vent, (0.0, 0.05, 0.0), 0.28, 0.05, stone_dark, rotation_x=math.pi / 2)
    for index, (x, y, z, s) in enumerate(((-0.12, 0.24, 0.02, 0.10), (0.08, 0.40, -0.04, 0.075), (0.17, 0.58, 0.04, 0.055))):
        sphere(f"Bubble_{index}", vent, (x, y, z), (s, s, s), water_glow, segments=10, rings=7)

    column = empty("Prop_SunkenColumn", kit)
    cylinder("ColumnBase", column, (0.0, 0.12, 0.0), 0.34, 0.24, stone_dark, vertices=10)
    cylinder("ColumnShaft", column, (0.0, 0.72, 0.0), 0.22, 1.15, stone, vertices=10, rotation_z=0.08)
    cube("ColumnCap", column, (0.03, 1.29, 0.0), (0.32, 0.10, 0.30), stone, rotation_z=0.08, bevel_width=0.05)
    sphere("ColumnMoss", column, (-0.13, 0.65, -0.20), (0.24, 0.10, 0.14), moss, segments=11, rings=7)

    bridge = empty("Prop_BridgeChunk", kit)
    for index, x in enumerate((-0.45, -0.15, 0.17, 0.48)):
        cube(
            f"BridgeSlab_{index}",
            bridge,
            (x, 0.09 + (index % 2) * 0.025, 0.0),
            (0.17, 0.09, 0.55),
            stone if index != 2 else stone_dark,
            rotation_z=(index - 1.5) * 0.035,
            bevel_width=0.045,
        )

    rock = empty("Prop_MossRock", kit)
    ico("MossRockBody", rock, (0.0, 0.22, 0.0), (0.50, 0.28, 0.40), stone_dark)
    sphere("MossRockTop", rock, (-0.06, 0.43, -0.03), (0.38, 0.10, 0.29), moss, segments=11, rings=7)

    dead = empty("Prop_DeadTree", kit)
    cylinder("DeadTreeTrunk", dead, (0.0, 0.90, 0.0), 0.19, 1.80, wood, vertices=8, rotation_z=-0.06)
    cube("DeadBranchL", dead, (-0.27, 1.42, 0.0), (0.32, 0.07, 0.09), wood, rotation_z=-0.50, bevel_width=0.035)
    cube("DeadBranchR", dead, (0.30, 1.16, 0.02), (0.36, 0.07, 0.09), wood, rotation_z=0.42, bevel_width=0.035)
    sphere("DeadTreeMoss", dead, (0.06, 0.46, -0.16), (0.28, 0.09, 0.16), moss, segments=11, rings=7)

    landmark = empty("Landmark_SunkenGate", kit)
    for x in (-0.88, 0.88):
        cylinder(f"GateColumn_{x}", landmark, (x, 1.35, 0.0), 0.28, 2.70, stone_dark, vertices=10, rotation_z=0.04 * (-1 if x < 0 else 1))
        cube(f"GateCap_{x}", landmark, (x, 2.66, 0.0), (0.38, 0.12, 0.34), stone, bevel_width=0.05)
        sphere(f"GateMoss_{x}", landmark, (x + 0.04, 2.10, -0.23), (0.30, 0.12, 0.16), moss, segments=11, rings=7)
    cube("GateLintel", landmark, (0.0, 2.48, 0.0), (1.14, 0.18, 0.30), stone, rotation_z=-0.05, bevel_width=0.06)
    torus("GateWaterSeal", landmark, (0.0, 1.54, -0.26), 0.48, 0.045, water_glow, rotation_x=math.pi / 2)
