from __future__ import annotations

from ..families.mushroom import MushroomDefinition


# V2: heavy enemy is a wide dumpling with a low cloud cap and sleepy bead eyes.
DEFINITION = MushroomDefinition(
    slug="plump-mushroom",
    cap_color=(0.91, 0.53, 0.20, 1.0),
    underside_color=(0.98, 0.80, 0.56, 1.0),
    stem_color=(0.95, 0.82, 0.58, 1.0),
    spot_color=(1.0, 0.92, 0.70, 1.0),
    accent_color=(0.84, 0.60, 0.30, 1.0),
    cap_scale=(0.72, 0.58, 0.24),
    stem_scale=(0.50, 0.38, 0.38),
    cap_height=0.77,
    cap_profile="puff",
    body_profile="dumpling",
    eye_style="sleepy",
    eye_spacing=0.12,
    eye_height=0.30,
    eye_scale=0.94,
    mouth_height=0.222,
    spot_layout=((-0.27, -0.08, 0.095), (0.26, 0.04, 0.082), (0.00, 0.16, 0.064)),
    cap_back_offset=0.035,
    arm_nubs=True,
    cheeks=True,
)
