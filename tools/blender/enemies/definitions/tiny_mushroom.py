from __future__ import annotations

from ..families.mushroom import MushroomDefinition


# V2: the baseline enemy is a compact button/bean, not a miniature humanoid face.
DEFINITION = MushroomDefinition(
    slug="tiny-mushroom",
    cap_color=(0.90, 0.31, 0.23, 1.0),
    underside_color=(0.96, 0.74, 0.56, 1.0),
    stem_color=(0.95, 0.86, 0.67, 1.0),
    spot_color=(0.99, 0.89, 0.70, 1.0),
    accent_color=(0.92, 0.63, 0.43, 1.0),
    cap_scale=(0.58, 0.50, 0.28),
    stem_scale=(0.34, 0.29, 0.36),
    cap_height=0.73,
    cap_profile="button",
    body_profile="bean",
    eye_style="bead",
    eye_spacing=0.085,
    eye_height=0.30,
    eye_scale=0.92,
    mouth_height=0.215,
    spot_layout=((-0.21, -0.10, 0.085), (0.22, 0.02, 0.072), (0.02, 0.18, 0.060)),
    cap_back_offset=0.025,
    arm_nubs=True,
    cheeks=True,
)
