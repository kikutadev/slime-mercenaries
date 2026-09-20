from __future__ import annotations

import math

from common import cube, cylinder, empty, ico, material, sphere, torus


AREA_ID = "dragon-crater"
REQUIRED_ROOTS = (
    "Prop_Obsidian",
    "Prop_StarCrystal",
    "Prop_LavaVent",
    "Prop_EggShell",
    "Prop_ClawMark",
    "Prop_RockSpire",
    "Prop_AncientScaleStone",
    "Landmark_StarAltar",
)


def _crystal(root, prefix: str, x: float, z: float, h: float, mat) -> None:
    obj = cylinder(
        f"{prefix}_Crystal",
        root,
        (x, h * 0.5, z),
        0.14 * h,
        h,
        mat,
        vertices=6,
        rotation_z=0.06 * (-1 if x < 0 else 1),
    )
    obj.scale.x *= 0.72
    obj.scale.z *= 0.82


def build() -> None:
    kit = empty("EnvironmentKitRoot")
    obsidian = material("Obsidian", (0.13, 0.12, 0.18, 1.0), 0.62, metallic=0.08)
    rock = material("CraterRock", (0.24, 0.20, 0.26, 1.0), 0.96)
    rock_light = material("CraterRockLight", (0.35, 0.27, 0.34, 1.0), 0.94)
    shell = material("DragonShell", (0.62, 0.56, 0.48, 1.0), 0.95)
    star = material(
        "StarCrystal",
        (0.48, 0.39, 0.76, 1.0),
        0.42,
        emissive=(0.29, 0.20, 0.70, 1.0),
        emissive_strength=0.50,
    )
    lava = material(
        "CraterLava",
        (0.91, 0.26, 0.08, 1.0),
        0.42,
        emissive=(1.0, 0.12, 0.02, 1.0),
        emissive_strength=0.55,
    )
    lava_yellow = material(
        "CraterLavaCore",
        (0.97, 0.54, 0.12, 1.0),
        0.38,
        emissive=(1.0, 0.28, 0.02, 1.0),
        emissive_strength=0.68,
    )

    obs = empty("Prop_Obsidian", kit)
    for index, (x, h) in enumerate(((-0.22, 0.72), (0.02, 1.00), (0.28, 0.62))):
        _crystal(obs, f"Obsidian_{index}", x, 0.03 * index, h, obsidian)

    stars = empty("Prop_StarCrystal", kit)
    _crystal(stars, "StarA", -0.18, 0.03, 0.76, star)
    _crystal(stars, "StarB", 0.08, -0.04, 0.54, star)
    _crystal(stars, "StarC", 0.28, 0.08, 0.38, star)

    vent = empty("Prop_LavaVent", kit)
    torus("LavaVentRing", vent, (0.0, 0.06, 0.0), 0.31, 0.07, rock_light, rotation_x=math.pi / 2)
    sphere("LavaVentPool", vent, (0.0, 0.035, 0.0), (0.26, 0.025, 0.20), lava, segments=12, rings=6)
    sphere("LavaVentCore", vent, (0.02, 0.055, -0.01), (0.13, 0.025, 0.10), lava_yellow, segments=10, rings=6)

    egg = empty("Prop_EggShell", kit)
    torus("EggShellRing", egg, (0.0, 0.11, 0.0), 0.36, 0.07, shell, rotation_x=math.pi / 2)
    for index, angle in enumerate((-0.85, -0.25, 0.35, 0.95)):
        x = math.sin(angle) * 0.28
        z = math.cos(angle) * 0.22
        cube(f"EggShard_{index}", egg, (x, 0.14, z), (0.10, 0.10, 0.07), shell, rotation_y=angle, rotation_z=angle * 0.22, bevel_width=0.035)

    claw = empty("Prop_ClawMark", kit)
    for index, x in enumerate((-0.22, 0.0, 0.22)):
        cube(
            f"ClawGroove_{index}",
            claw,
            (x, 0.018, 0.0),
            (0.045, 0.018, 0.46),
            obsidian,
            rotation_y=(index - 1) * 0.06,
            bevel_width=0.012,
        )

    spire = empty("Prop_RockSpire", kit)
    for index, (x, h, r) in enumerate(((-0.25, 1.05, 0.22), (0.02, 1.52, 0.28), (0.32, 0.90, 0.19))):
        cylinder(f"RockSpire_{index}", spire, (x, h * 0.5, 0.03 * index), r, h, rock if index != 1 else rock_light, vertices=6)

    scale = empty("Prop_AncientScaleStone", kit)
    ico("ScaleStoneBody", scale, (0.0, 0.27, 0.0), (0.56, 0.32, 0.42), rock)
    for index, x in enumerate((-0.23, 0.0, 0.23)):
        sphere(f"ScalePlate_{index}", scale, (x, 0.48 - abs(x) * 0.25, -0.31), (0.16, 0.08, 0.06), star if index == 1 else rock_light, segments=10, rings=6)

    landmark = empty("Landmark_StarAltar", kit)
    cylinder("AltarBase", landmark, (0.0, 0.22, 0.0), 1.05, 0.44, obsidian, vertices=10)
    cylinder("AltarStep", landmark, (0.0, 0.48, 0.0), 0.72, 0.22, rock_light, vertices=10)
    for index, angle in enumerate((0.0, math.pi * 2 / 3, math.pi * 4 / 3)):
        x = math.cos(angle) * 0.72
        z = math.sin(angle) * 0.48
        _crystal(landmark, f"AltarStar_{index}", x, z, 1.18 if index == 0 else 0.88, star)
    _crystal(landmark, "AltarCore", 0.0, -0.02, 2.10, star)
    torus("AltarLavaRing", landmark, (0.0, 0.10, 0.0), 1.22, 0.10, lava, rotation_x=math.pi / 2)
    for x in (-1.10, 1.10):
        cylinder(f"AltarSpire_{x}", landmark, (x, 1.25, 0.15), 0.22, 2.50, rock, vertices=6, rotation_z=0.06 * (-1 if x < 0 else 1))
