from __future__ import annotations

import math

from common import cube, cylinder, empty, ico, material, sphere


AREA_ID = "frost-ruins"
REQUIRED_ROOTS = (
    "Prop_SnowDrift",
    "Prop_IceCrystal",
    "Prop_RuinColumn",
    "Prop_FrozenLantern",
    "Prop_TornBanner",
    "Prop_IcicleCluster",
    "Prop_SnowRock",
    "Landmark_FrozenTempleGate",
)


def _ice(root, prefix: str, x: float, z: float, h: float, mat) -> None:
    obj = cylinder(f"{prefix}_Ice", root, (x, h * 0.50, z), 0.12 * h, h, mat, vertices=6, rotation_z=0.05 * (-1 if x < 0 else 1))
    obj.scale.x *= 0.72
    obj.scale.z *= 0.85


def build() -> None:
    kit = empty("EnvironmentKitRoot")
    snow = material("Snow", (0.88, 0.94, 0.95, 1.0), 0.90)
    snow_shadow = material("SnowShadow", (0.66, 0.78, 0.82, 1.0), 0.94)
    ice = material(
        "Ice",
        (0.55, 0.82, 0.91, 1.0),
        0.48,
        emissive=(0.28, 0.56, 0.72, 1.0),
        emissive_strength=0.10,
    )
    stone = material("FrostStone", (0.47, 0.55, 0.62, 1.0), 0.96)
    stone_dark = material("FrostStoneDark", (0.31, 0.39, 0.48, 1.0), 0.97)
    metal = material("FrostMetal", (0.42, 0.47, 0.52, 1.0), 0.70, metallic=0.14)
    banner = material("FrostBanner", (0.24, 0.34, 0.51, 1.0), 0.91)
    lantern_glow = material(
        "FrozenGlow",
        (0.64, 0.87, 0.95, 1.0),
        0.42,
        emissive=(0.28, 0.66, 0.86, 1.0),
        emissive_strength=0.40,
    )

    drift = empty("Prop_SnowDrift", kit)
    sphere("SnowDriftA", drift, (-0.16, 0.11, 0.0), (0.46, 0.13, 0.33), snow, segments=14, rings=8)
    sphere("SnowDriftB", drift, (0.27, 0.085, 0.04), (0.34, 0.10, 0.27), snow_shadow, segments=13, rings=8)

    crystal = empty("Prop_IceCrystal", kit)
    _ice(crystal, "IceA", -0.18, 0.03, 0.76, ice)
    _ice(crystal, "IceB", 0.08, -0.04, 0.56, ice)
    _ice(crystal, "IceC", 0.28, 0.08, 0.40, ice)

    column = empty("Prop_RuinColumn", kit)
    cylinder("RuinColumnBase", column, (0.0, 0.12, 0.0), 0.34, 0.24, stone_dark, vertices=10)
    cylinder("RuinColumnShaft", column, (0.0, 0.78, 0.0), 0.22, 1.32, stone, vertices=10, rotation_z=-0.06)
    cube("RuinColumnCap", column, (-0.03, 1.43, 0.0), (0.33, 0.11, 0.30), stone, rotation_z=-0.06, bevel_width=0.04)
    sphere("ColumnSnow", column, (-0.05, 1.54, -0.02), (0.32, 0.08, 0.28), snow, segments=12, rings=7)

    lantern = empty("Prop_FrozenLantern", kit)
    cylinder("FrozenLanternPost", lantern, (0.0, 0.69, 0.0), 0.055, 1.38, metal, vertices=8)
    cube("FrozenLanternArm", lantern, (0.16, 1.18, 0.0), (0.18, 0.04, 0.05), metal, bevel_width=0.02)
    cube("FrozenLanternFrame", lantern, (0.31, 1.02, 0.0), (0.13, 0.19, 0.13), stone_dark, bevel_width=0.025)
    sphere("FrozenLanternCore", lantern, (0.31, 1.02, -0.14), (0.08, 0.12, 0.05), lantern_glow, segments=10, rings=7)
    _ice(lantern, "LanternIcicle", 0.31, -0.01, 0.24, ice)

    torn = empty("Prop_TornBanner", kit)
    cylinder("BannerPole", torn, (0.0, 0.90, 0.0), 0.045, 1.80, metal, vertices=8)
    cube("BannerCloth", torn, (0.28, 1.38, 0.0), (0.28, 0.35, 0.025), banner, rotation_z=-0.10, bevel_width=0.02)
    cube("BannerTear", torn, (0.48, 1.11, -0.01), (0.11, 0.18, 0.028), banner, rotation_z=-0.32, bevel_width=0.015)

    icicles = empty("Prop_IcicleCluster", kit)
    for index, (x, h) in enumerate(((-0.28, 0.52), (-0.08, 0.76), (0.13, 0.62), (0.31, 0.42))):
        _ice(icicles, f"Icicle_{index}", x, 0.0, h, ice)

    rock = empty("Prop_SnowRock", kit)
    ico("SnowRockBody", rock, (0.0, 0.24, 0.0), (0.52, 0.30, 0.42), stone_dark)
    sphere("SnowRockCap", rock, (-0.04, 0.47, -0.02), (0.42, 0.10, 0.32), snow, segments=12, rings=7)

    landmark = empty("Landmark_FrozenTempleGate", kit)
    for x in (-0.90, 0.90):
        cylinder(f"TempleColumn_{x}", landmark, (x, 1.48, 0.0), 0.30, 2.96, stone_dark, vertices=10)
        cube(f"TempleCap_{x}", landmark, (x, 2.88, 0.0), (0.42, 0.13, 0.38), stone, bevel_width=0.05)
        sphere(f"TempleSnow_{x}", landmark, (x, 3.03, -0.01), (0.40, 0.09, 0.34), snow, segments=12, rings=7)
    cube("TempleLintel", landmark, (0.0, 2.66, 0.0), (1.18, 0.22, 0.34), stone, bevel_width=0.06)
    _ice(landmark, "TempleIce_L", -0.45, -0.25, 0.86, ice)
    _ice(landmark, "TempleIce_R", 0.48, -0.25, 0.68, ice)
