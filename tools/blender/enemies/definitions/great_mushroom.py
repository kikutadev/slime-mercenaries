from __future__ import annotations

from ..families.mushroom import MushroomDefinition


# V2: boss is a layered shelf/reishi creature with tiny sprouts, never a scaled-up Tiny.
DEFINITION = MushroomDefinition(
    slug="great-mushroom",
    cap_color=(0.72, 0.27, 0.20, 1.0),
    underside_color=(0.94, 0.75, 0.54, 1.0),
    stem_color=(0.91, 0.80, 0.60, 1.0),
    spot_color=(0.99, 0.88, 0.66, 1.0),
    accent_color=(0.86, 0.49, 0.20, 1.0),
    cap_scale=(1.10, 0.82, 0.42),
    stem_scale=(0.60, 0.46, 0.60),
    cap_height=1.14,
    cap_profile="reishi",
    body_profile="boss",
    eye_style="bead",
    eye_spacing=0.15,
    eye_height=0.53,
    eye_scale=1.02,
    mouth_height=0.425,
    spot_layout=((-0.40, -0.12, 0.095), (0.32, 0.02, 0.080), (0.02, 0.22, 0.064)),
    boss_sprouts=True,
    cap_back_offset=0.12,
    arm_nubs=True,
    cheeks=True,
)
