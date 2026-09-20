from __future__ import annotations

import math

from common import cube, cylinder, empty, ico, material, sphere, torus


AREA_ID = "moonlit-castle"
REQUIRED_ROOTS = (
    "Prop_WallFragment",
    "Prop_MoonLamp",
    "Prop_Banner",
    "Prop_KnightStatue",
    "Prop_WindowArch",
    "Prop_GatePost",
    "Prop_CobblePile",
    "Landmark_MoonCrownGate",
)


def build() -> None:
    kit = empty("EnvironmentKitRoot")
    stone = material("CastleStone", (0.48, 0.52, 0.61, 1.0), 0.93)
    stone_dark = material("CastleStoneDark", (0.29, 0.32, 0.42, 1.0), 0.96)
    silver = material("CastleSilver", (0.62, 0.66, 0.74, 1.0), 0.65, metallic=0.16)
    metal = material("CastleMetal", (0.25, 0.27, 0.34, 1.0), 0.72, metallic=0.18)
    banner_mat = material("CastleBanner", (0.29, 0.25, 0.48, 1.0), 0.90)
    warm = material(
        "WindowGlow",
        (0.93, 0.67, 0.29, 1.0),
        0.42,
        emissive=(1.0, 0.46, 0.09, 1.0),
        emissive_strength=0.50,
    )
    moon = material(
        "MoonGlow",
        (0.72, 0.79, 0.95, 1.0),
        0.40,
        emissive=(0.42, 0.53, 0.92, 1.0),
        emissive_strength=0.42,
    )

    wall = empty("Prop_WallFragment", kit)
    for index, (x, y, sx, sy) in enumerate(((-0.42, 0.45, 0.33, 0.45), (0.0, 0.55, 0.33, 0.55), (0.42, 0.38, 0.33, 0.38))):
        cube(f"WallBlock_{index}", wall, (x, y, 0.0), (sx, sy, 0.24), stone if index != 1 else stone_dark, bevel_width=0.045)
    cube("WallCapL", wall, (-0.42, 0.93, 0.0), (0.16, 0.15, 0.25), stone_dark, bevel_width=0.035)
    cube("WallCapR", wall, (0.42, 0.78, 0.0), (0.16, 0.15, 0.25), stone_dark, bevel_width=0.035)

    lamp = empty("Prop_MoonLamp", kit)
    cylinder("MoonLampPost", lamp, (0.0, 0.78, 0.0), 0.055, 1.56, metal, vertices=8)
    torus("MoonLampCrescent", lamp, (0.0, 1.58, -0.08), 0.18, 0.045, moon, rotation_x=math.pi / 2)
    sphere("MoonLampCore", lamp, (0.09, 1.57, -0.11), (0.065, 0.10, 0.045), warm, segments=10, rings=7)

    banner = empty("Prop_Banner", kit)
    cylinder("BannerPole", banner, (0.0, 0.92, 0.0), 0.045, 1.84, silver, vertices=8)
    cube("BannerCloth", banner, (0.28, 1.42, 0.0), (0.29, 0.40, 0.025), banner_mat, rotation_z=-0.08, bevel_width=0.02)
    sphere("BannerMoon", banner, (0.27, 1.47, -0.035), (0.09, 0.09, 0.025), moon, segments=10, rings=7)

    statue = empty("Prop_KnightStatue", kit)
    cylinder("StatueBase", statue, (0.0, 0.12, 0.0), 0.36, 0.24, stone_dark, vertices=10)
    sphere("StatueBody", statue, (0.0, 0.70, 0.0), (0.31, 0.46, 0.28), stone, segments=14, rings=9)
    sphere("StatueHelmet", statue, (0.0, 1.22, -0.02), (0.44, 0.36, 0.38), stone_dark, segments=14, rings=9)
    cube("StatueShield", statue, (-0.36, 0.72, -0.18), (0.16, 0.35, 0.07), stone, bevel_width=0.08)

    window = empty("Prop_WindowArch", kit)
    cube("WindowWall", window, (0.0, 0.72, 0.0), (0.50, 0.72, 0.20), stone_dark, bevel_width=0.05)
    cube("WindowGlow", window, (0.0, 0.78, -0.22), (0.20, 0.35, 0.025), warm, bevel_width=0.10)
    torus("WindowArch", window, (0.0, 1.00, -0.25), 0.23, 0.055, stone, rotation_x=math.pi / 2)

    post = empty("Prop_GatePost", kit)
    cube("GatePostBody", post, (0.0, 0.92, 0.0), (0.27, 0.92, 0.27), stone_dark, bevel_width=0.05)
    cube("GatePostCap", post, (0.0, 1.88, 0.0), (0.38, 0.13, 0.36), stone, bevel_width=0.05)
    sphere("GatePostOrb", post, (0.0, 2.16, 0.0), (0.18, 0.18, 0.18), moon, segments=12, rings=8)

    cobble = empty("Prop_CobblePile", kit)
    for index, (x, z, sx) in enumerate(((-0.30, 0.0, 0.25), (0.0, -0.06, 0.30), (0.30, 0.06, 0.22), (0.13, 0.23, 0.18))):
        ico(f"Cobble_{index}", cobble, (x, 0.10 + 0.02 * (index % 2), z), (sx, 0.12, sx * 0.75), stone if index % 2 else stone_dark)

    landmark = empty("Landmark_MoonCrownGate", kit)
    for x in (-0.98, 0.98):
        cube(f"MoonGateTower_{x}", landmark, (x, 1.48, 0.0), (0.34, 1.48, 0.38), stone_dark, bevel_width=0.06)
        cube(f"MoonGateTowerCap_{x}", landmark, (x, 3.00, 0.0), (0.46, 0.15, 0.46), stone, bevel_width=0.06)
        sphere(f"MoonGateLight_{x}", landmark, (x, 3.30, -0.02), (0.18, 0.18, 0.18), warm, segments=12, rings=8)
    cube("MoonGateLintel", landmark, (0.0, 2.60, 0.0), (1.26, 0.23, 0.38), stone, bevel_width=0.07)
    torus("MoonCrownArc", landmark, (0.0, 3.08, -0.30), 0.46, 0.075, moon, rotation_x=math.pi / 2)
    sphere("MoonCrownCore", landmark, (0.22, 3.08, -0.33), (0.16, 0.20, 0.055), moon, segments=12, rings=8)
