from enemies.families.frost import FrostDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'frost'
DEFINITION = FrostDefinition(
    'icicle-lantern','lantern',
    (0.82,0.90,0.94,1),(0.50,0.66,0.77,1),(0.42,0.82,0.96,1),
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'LanternBody','FrostRim','LanternBand','TopCap','BottomIcicle','GlowRoot','LightCore',
    ),
    silhouette_rule=lambda s: 1.35 <= s.z / s.x <= 1.70,
    description='legless floating frost lantern with one lower icicle and a bounded internal glow core',
    min_meshes=9,
    max_meshes=12,
    parent_rules=(ParentRule('LightCore','GlowRoot'),),
    relative_size_rules=(
        RelativeSizeRule('LanternBody','z',0.75,0.92),
        RelativeSizeRule('LightCore','z',0.18,0.30),
    ),
    forbidden_prefixes=('Foot','Leg','Arm','Hand','Staff','Weapon'),
)