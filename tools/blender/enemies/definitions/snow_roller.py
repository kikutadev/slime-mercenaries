from enemies.families.frost import FrostDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'frost'
DEFINITION = FrostDefinition(
    'snow-roller','roller',
    (0.88,0.94,0.97,1),(0.72,0.84,0.91,1),(0.47,0.78,0.92,1),
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'SnowBody','SnowUnderside','FacePatch','PrimaryRoot','IceNubRoot','IceNub',
    ),
    silhouette_rule=lambda s: 1.05 <= s.x / s.z <= 1.25,
    description='single soft snowball with exactly one small rear ice nub',
    min_meshes=9,
    max_meshes=12,
    parent_rules=(ParentRule('IceNub','IceNubRoot'),),
    relative_size_rules=(
        RelativeSizeRule('SnowBody','x',0.95,1.01),
        RelativeSizeRule('IceNub','z',0.18,0.30),
    ),
    forbidden_nodes=('IceSpike_1','IceSpike_2','IceSpike_3','SnowUpper','UpperMass'),
)