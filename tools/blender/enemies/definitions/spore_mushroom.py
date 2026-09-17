from __future__ import annotations

from ..families.mushroom import MushroomDefinition


# V2: ranged enemy is a tall bell/lantern with paired spore bulbs.
DEFINITION = MushroomDefinition(
    slug="spore-mushroom",
    cap_color=(0.62, 0.43, 0.76, 1.0),
    underside_color=(0.74, 0.82, 0.68, 1.0),
    stem_color=(0.89, 0.87, 0.69, 1.0),
    spot_color=(0.75, 0.91, 0.72, 1.0),
    accent_color=(0.40, 0.72, 0.62, 1.0),
    cap_scale=(0.58, 0.50, 0.36),
    stem_scale=(0.26, 0.23, 0.48),
    cap_height=0.84,
    cap_profile="bell",
    body_profile="lantern",
    eye_style="round",
    eye_spacing=0.075,
    eye_height=0.41,
    eye_scale=0.88,
    mouth_height=0.325,
    spot_layout=((-0.16, -0.02, 0.060), (0.15, 0.08, 0.050)),
    spore_pouches=True,
    cap_back_offset=0.020,
    arm_nubs=True,
    cheeks=False,
)
