from __future__ import annotations

import math

from common import cube, cylinder, empty, ico, material, sphere, torus


AREA_ID = "ember-canyon"
REQUIRED_ROOTS = (
    "Prop_BasaltColumn",
    "Prop_LavaCrack",
    "Prop_CharcoalRock",
    "Prop_SteamVent",
    "Prop_BurntStake",
    "Prop_CraterStone",
    "Prop_EmberShrub",
    "Landmark_LavaFall",
)


def build() -> None:
    kit = empty("EnvironmentKitRoot")
    basalt = material("Basalt", (0.23, 0.20, 0.22, 1.0), 0.98)
    basalt_light = material("BasaltLight", (0.34, 0.28, 0.28, 1.0), 0.96)
    charcoal = material("Charcoal", (0.16, 0.14, 0.15, 1.0), 0.99)
    wood = material("BurntWood", (0.20, 0.14, 0.12, 1.0), 0.99)
    ember = material(
        "EmberGlow",
        (0.91, 0.35, 0.08, 1.0),
        0.46,
        emissive=(1.0, 0.18, 0.02, 1.0),
        emissive_strength=0.55,
    )
    ember_yellow = material(
        "EmberYellow",
        (0.95, 0.63, 0.12, 1.0),
        0.40,
        emissive=(1.0, 0.34, 0.02, 1.0),
        emissive_strength=0.68,
    )
    smoke = material("SmokeStone", (0.31, 0.25, 0.31, 1.0), 0.92)

    columns = empty("Prop_BasaltColumn", kit)
    for index, (x, h, r) in enumerate(((-0.28, 0.88, 0.18), (-0.02, 1.18, 0.21), (0.28, 0.76, 0.17))):
        cylinder(f"Basalt_{index}", columns, (x, h * 0.5, 0.02 * index), r, h, basalt if index != 1 else basalt_light, vertices=6)

    crack = empty("Prop_LavaCrack", kit)
    for index, (x, z, sx, rz) in enumerate(((-0.26, 0.04, 0.27, -0.35), (0.0, 0.0, 0.32, 0.18), (0.29, -0.07, 0.25, -0.18))):
        cube(f"LavaCrack_{index}", crack, (x, 0.025, z), (sx, 0.018, 0.045), ember, rotation_y=rz, bevel_width=0.018)
    sphere("CrackCore", crack, (0.02, 0.038, 0.0), (0.18, 0.025, 0.10), ember_yellow, segments=10, rings=6)

    coal = empty("Prop_CharcoalRock", kit)
    ico("CharcoalBody", coal, (0.0, 0.26, 0.0), (0.52, 0.32, 0.42), charcoal)
    cube("CharcoalCrackA", coal, (-0.11, 0.38, -0.37), (0.16, 0.028, 0.025), ember, rotation_z=-0.40, bevel_width=0.015)
    cube("CharcoalCrackB", coal, (0.13, 0.31, -0.38), (0.13, 0.026, 0.024), ember, rotation_z=0.34, bevel_width=0.015)

    vent = empty("Prop_SteamVent", kit)
    torus("VentStone", vent, (0.0, 0.08, 0.0), 0.28, 0.08, basalt_light, rotation_x=math.pi / 2)
    sphere("SteamPuffA", vent, (-0.08, 0.35, 0.02), (0.13, 0.16, 0.12), smoke, segments=10, rings=7)
    sphere("SteamPuffB", vent, (0.08, 0.53, -0.02), (0.10, 0.13, 0.09), smoke, segments=10, rings=7)
    sphere("SteamPuffC", vent, (-0.01, 0.68, 0.02), (0.075, 0.10, 0.07), smoke, segments=9, rings=6)

    stake = empty("Prop_BurntStake", kit)
    for index, (x, h, rot) in enumerate(((-0.22, 0.88, -0.12), (0.02, 1.14, 0.06), (0.27, 0.73, 0.14))):
        cube(f"BurntStake_{index}", stake, (x, h * 0.5, 0.0), (0.08, h * 0.5, 0.09), wood, rotation_z=rot, bevel_width=0.025)
        sphere(f"StakeEmber_{index}", stake, (x, h * 0.35, -0.10), (0.055, 0.09, 0.03), ember, segments=9, rings=6)

    crater = empty("Prop_CraterStone", kit)
    for index, angle in enumerate((0.0, 1.15, 2.3, 3.4, 4.5, 5.5)):
        x = math.cos(angle) * 0.34
        z = math.sin(angle) * 0.26
        ico(f"CraterStone_{index}", crater, (x, 0.13, z), (0.22, 0.15, 0.18), basalt_light)
    sphere("CraterGlow", crater, (0.0, 0.03, 0.0), (0.27, 0.025, 0.20), ember, segments=11, rings=6)

    shrub = empty("Prop_EmberShrub", kit)
    for index, (x, z, s) in enumerate(((-0.18, 0.0, 1.0), (0.06, -0.04, 0.82), (0.24, 0.06, 0.62))):
        cone = cylinder(f"ShrubBranch_{index}", shrub, (x, 0.25 * s, z), 0.035 * s, 0.50 * s, wood, vertices=7, rotation_z=(index - 1) * 0.28)
        sphere(f"ShrubEmber_{index}", shrub, (x + (index - 1) * 0.06, 0.48 * s, z), (0.08 * s, 0.10 * s, 0.07 * s), ember, segments=9, rings=6)

    landmark = empty("Landmark_LavaFall", kit)
    for x in (-0.88, 0.88):
        cylinder(f"LavaWall_{x}", landmark, (x, 1.42, 0.0), 0.36, 2.84, basalt, vertices=7)
        ico(f"LavaWallTop_{x}", landmark, (x, 2.85, 0.02), (0.54, 0.34, 0.44), basalt_light)
    cube("LavaFallSheet", landmark, (0.0, 1.44, -0.12), (0.55, 1.38, 0.045), ember, bevel_width=0.06)
    cube("LavaFallCore", landmark, (0.0, 1.42, -0.18), (0.25, 1.30, 0.028), ember_yellow, bevel_width=0.04)
    torus("LavaPoolRing", landmark, (0.0, 0.08, -0.12), 0.68, 0.10, ember, rotation_x=math.pi / 2)
