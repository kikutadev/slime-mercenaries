from __future__ import annotations

from ..families.mushroom import MushroomDefinition
from ..validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

DEFINITION = MushroomDefinition(
    slug="tiny-mushroom",
    cap_color=(0.90, 0.31, 0.23, 1.0), underside_color=(0.96, 0.74, 0.56, 1.0),
    stem_color=(0.95, 0.86, 0.67, 1.0), spot_color=(0.99, 0.89, 0.70, 1.0),
    accent_color=(0.92, 0.63, 0.43, 1.0), cap_scale=(0.58, 0.50, 0.28),
    stem_scale=(0.34, 0.29, 0.36), cap_height=0.73, cap_profile="button",
    body_profile="bean", eye_style="bead", eye_spacing=0.085, eye_height=0.30,
    eye_scale=0.92, mouth_height=0.215,
    spot_layout=((-0.21, -0.10, 0.085), (0.22, 0.02, 0.072), (0.02, 0.18, 0.060)),
    cap_back_offset=0.025, arm_nubs=True, cheeks=True,
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + ('PrimaryRoot','Cap','CapUnderside','Stem','Foot','Foot_R','Arm_L','Arm_R'),
    silhouette_rule=lambda s: 1.00 <= s.x / s.z <= 1.18,
    description='baseline compact button mushroom with bean body and one clean cap',
    min_meshes=14, max_meshes=16,
    parent_rules=(ParentRule('Cap','PrimaryRoot'),),
    relative_size_rules=(
        RelativeSizeRule('Cap','x',0.95,1.02),
        RelativeSizeRule('Stem','x',0.52,0.66),
    ),
    forbidden_prefixes=('BodyLobe_','CapPuff_','SporePouch_','BossSprout'),
)