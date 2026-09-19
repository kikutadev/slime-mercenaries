from __future__ import annotations

from ..families.mushroom import MushroomDefinition
from ..validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

DEFINITION = MushroomDefinition(
    slug="spore-mushroom",
    cap_color=(0.62, 0.43, 0.76, 1.0), underside_color=(0.74, 0.82, 0.68, 1.0),
    stem_color=(0.89, 0.87, 0.69, 1.0), spot_color=(0.75, 0.91, 0.72, 1.0),
    accent_color=(0.40, 0.72, 0.62, 1.0), cap_scale=(0.58, 0.50, 0.36),
    stem_scale=(0.26, 0.23, 0.48), cap_height=0.84, cap_profile="bell",
    body_profile="lantern", eye_style="round", eye_spacing=0.075, eye_height=0.41,
    eye_scale=0.88, mouth_height=0.325,
    spot_layout=((-0.16, -0.02, 0.060), (0.15, 0.08, 0.050)),
    spore_pouches=True, cap_back_offset=0.020, arm_nubs=True, cheeks=False,
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'PrimaryRoot','Cap','CapRim','CapUnderside','Stem','LanternBase',
        'SporePouch_01','SporePouch_02','SporeBud_01','SporeBud_02',
    ),
    silhouette_rule=lambda s: 1.00 <= s.z / s.x <= 1.10,
    description='tall lantern mushroom with horizontal bell rim and paired spore pouches',
    min_meshes=17, max_meshes=19,
    parent_rules=(
        ParentRule('Cap','PrimaryRoot'),
        ParentRule('CapRim','PrimaryRoot'),
        ParentRule('SporePouch_01','PrimaryRoot'),
        ParentRule('SporePouch_02','PrimaryRoot'),
    ),
    relative_size_rules=(
        RelativeSizeRule('CapRim','x',0.92,1.02),
        RelativeSizeRule('Stem','z',0.72,0.84),
        RelativeSizeRule('SporePouch_01','z',0.20,0.30),
        RelativeSizeRule('SporePouch_02','z',0.20,0.30),
    ),
    forbidden_prefixes=('BodyLobe_','BossSprout'),
)