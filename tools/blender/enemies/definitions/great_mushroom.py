from __future__ import annotations

from ..families.mushroom import MushroomDefinition
from ..validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

DEFINITION = MushroomDefinition(
    slug="great-mushroom",
    cap_color=(0.72, 0.27, 0.20, 1.0), underside_color=(0.94, 0.75, 0.54, 1.0),
    stem_color=(0.91, 0.80, 0.60, 1.0), spot_color=(0.99, 0.88, 0.66, 1.0),
    accent_color=(0.86, 0.49, 0.20, 1.0), cap_scale=(1.10, 0.82, 0.42),
    stem_scale=(0.60, 0.46, 0.60), cap_height=1.14, cap_profile="reishi",
    body_profile="boss", eye_style="bead", eye_spacing=0.15, eye_height=0.53,
    eye_scale=1.02, mouth_height=0.425,
    spot_layout=((-0.40, -0.12, 0.095), (0.32, 0.02, 0.080), (0.02, 0.22, 0.064)),
    boss_sprouts=True, cap_back_offset=0.12, arm_nubs=True, cheeks=True,
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'PrimaryRoot','SecondaryRoot','Cap','CapUnderside','CapLayer_Back','CapLayer_Top','CapLip','Stem','Belly',
        'BossSproutStem_01','BossSproutCap_01',
    ),
    silhouette_rule=lambda s: 1.24 <= s.x / s.z <= 1.38 and s.x >= 2.0,
    description='boss shelf/reishi mushroom with layered cap and small secondary sprouts',
    min_meshes=22, max_meshes=25,
    parent_rules=(
        ParentRule('Cap','PrimaryRoot'),
        ParentRule('CapLayer_Back','SecondaryRoot'),
        ParentRule('CapLayer_Top','SecondaryRoot'),
        ParentRule('BossSproutCap_01','SecondaryRoot'),
    ),
    relative_size_rules=(
        RelativeSizeRule('Cap','x',0.95,1.02),
        RelativeSizeRule('CapLayer_Back','x',0.76,0.86),
        RelativeSizeRule('CapLayer_Top','x',0.56,0.68),
        RelativeSizeRule('Belly','x',0.46,0.56),
    ),
    forbidden_prefixes=('BodyLobe_','SporePouch_'),
)