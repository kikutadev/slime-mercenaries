from __future__ import annotations

import math

from common import cube, cylinder, empty, ico, material, sphere


AREA_ID = "amber-mine"
REQUIRED_ROOTS = (
    "Prop_AmberCrystal",
    "Prop_MineTimber",
    "Prop_MineCart",
    "Prop_RailSection",
    "Prop_Lantern",
    "Prop_Rubble",
    "Prop_RockPillar",
    "Landmark_AmberVein",
)


def _crystal(root, prefix: str, x: float, z: float, height: float, mat) -> None:
    crystal = cylinder(
        f"{prefix}_Crystal",
        root,
        (x, height * 0.48, z),
        0.13 * height,
        height,
        mat,
        vertices=6,
        rotation_z=0.05 * (1 if x >= 0 else -1),
    )
    crystal.scale.x *= 0.78
    crystal.scale.z *= 0.88


def build() -> None:
    kit = empty("EnvironmentKitRoot")
    rock = material("MineRock", (0.33, 0.27, 0.25, 1.0), 0.98)
    rock_light = material("MineRockLight", (0.44, 0.35, 0.29, 1.0), 0.96)
    wood = material("MineTimber", (0.34, 0.22, 0.13, 1.0), 0.95)
    wood_light = material("MineTimberLight", (0.50, 0.33, 0.18, 1.0), 0.92)
    metal = material("MineMetal", (0.29, 0.30, 0.31, 1.0), 0.72, metallic=0.18)
    amber = material(
        "Amber",
        (0.86, 0.52, 0.16, 1.0),
        0.52,
        emissive=(0.72, 0.27, 0.05, 1.0),
        emissive_strength=0.18,
    )
    lantern_glow = material(
        "LanternGlow",
        (0.95, 0.68, 0.24, 1.0),
        0.38,
        emissive=(1.0, 0.42, 0.08, 1.0),
        emissive_strength=0.58,
    )

    crystal = empty("Prop_AmberCrystal", kit)
    _crystal(crystal, "AmberA", -0.16, 0.04, 0.74, amber)
    _crystal(crystal, "AmberB", 0.10, -0.02, 0.54, amber)
    _crystal(crystal, "AmberC", 0.28, 0.08, 0.38, amber)

    timber = empty("Prop_MineTimber", kit)
    for x in (-0.48, 0.48):
        cube(f"TimberPost_{x}", timber, (x, 0.62, 0.0), (0.12, 0.62, 0.14), wood, bevel_width=0.035)
    cube("TimberBeam", timber, (0.0, 1.20, 0.0), (0.60, 0.12, 0.16), wood_light, bevel_width=0.04)
    cube("TimberBrace_L", timber, (-0.29, 0.83, -0.01), (0.06, 0.42, 0.08), wood_light, rotation_z=-0.48, bevel_width=0.025)
    cube("TimberBrace_R", timber, (0.29, 0.83, -0.01), (0.06, 0.42, 0.08), wood_light, rotation_z=0.48, bevel_width=0.025)

    cart = empty("Prop_MineCart", kit)
    cube("CartBody", cart, (0.0, 0.34, 0.0), (0.45, 0.25, 0.34), metal, bevel_width=0.08)
    cube("CartLip", cart, (0.0, 0.57, -0.02), (0.52, 0.05, 0.38), metal, bevel_width=0.04)
    for x in (-0.34, 0.34):
        cylinder(f"CartWheel_{x}", cart, (x, 0.14, 0.23), 0.12, 0.08, metal, vertices=12, rotation_x=math.pi / 2)
        cylinder(f"CartWheelRear_{x}", cart, (x, 0.14, -0.23), 0.12, 0.08, metal, vertices=12, rotation_x=math.pi / 2)

    rails = empty("Prop_RailSection", kit)
    for x in (-0.25, 0.25):
        cube(f"Rail_{x}", rails, (x, 0.035, 0.0), (0.035, 0.035, 0.78), metal, bevel_width=0.015)
    for index, z in enumerate((-0.60, -0.20, 0.20, 0.60)):
        cube(f"Tie_{index}", rails, (0.0, 0.012, z), (0.38, 0.025, 0.06), wood, bevel_width=0.015)

    lantern = empty("Prop_Lantern", kit)
    cylinder("LanternPost", lantern, (0.0, 0.62, 0.0), 0.055, 1.24, wood, vertices=8)
    cube("LanternArm", lantern, (0.15, 1.08, 0.0), (0.18, 0.04, 0.05), wood_light, bevel_width=0.02)
    cube("LanternFrame", lantern, (0.30, 0.94, 0.0), (0.12, 0.18, 0.12), metal, bevel_width=0.025)
    sphere("LanternCore", lantern, (0.30, 0.94, -0.13), (0.075, 0.11, 0.045), lantern_glow, segments=10, rings=7)

    rubble = empty("Prop_Rubble", kit)
    for name, x, z, scale in (
        ("A", -0.30, 0.05, (0.29, 0.16, 0.22)),
        ("B", 0.02, -0.08, (0.24, 0.13, 0.19)),
        ("C", 0.30, 0.08, (0.18, 0.10, 0.15)),
        ("D", 0.16, 0.24, (0.13, 0.08, 0.11)),
    ):
        ico(f"Rubble_{name}", rubble, (x, scale[1] * 0.78, z), scale, rock_light)

    pillar = empty("Prop_RockPillar", kit)
    cylinder("RockPillarBase", pillar, (0.0, 0.58, 0.0), 0.34, 1.16, rock, vertices=7)
    ico("RockPillarTop", pillar, (0.04, 1.26, 0.0), (0.40, 0.36, 0.34), rock_light)
    _crystal(pillar, "RockPillarAmber", -0.12, -0.24, 0.42, amber)

    landmark = empty("Landmark_AmberVein", kit)
    for index, (x, h, size) in enumerate(((-0.88, 2.0, 1.0), (-0.42, 2.65, 1.20), (0.05, 3.15, 1.38), (0.52, 2.55, 1.15), (0.94, 1.85, 0.92))):
        _crystal(landmark, f"Vein_{index}", x, 0.05 * index, h * 0.78, amber)
        vein_obj = landmark.children[-1]
        vein_obj.scale.x *= size
        vein_obj.scale.z *= size
    cube("VeinRockBase", landmark, (0.0, 0.40, 0.20), (1.35, 0.40, 0.52), rock, bevel_width=0.18)
    for x in (-1.18, 1.18):
        cube(f"VeinTimber_{x}", landmark, (x, 1.28, 0.18), (0.13, 1.28, 0.16), wood, rotation_z=0.07 * (-1 if x < 0 else 1), bevel_width=0.04)
