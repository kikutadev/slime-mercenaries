from enemies.families.frost import FrostDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'frost'
DEFINITION = FrostDefinition(
    'scarf-snowman','scarf',
    (0.91,0.95,0.97,1),(0.82,0.31,0.36,1),(0.51,0.80,0.93,1),
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'SnowBody','BellyPatch','ScarfCollar','TailRoot','ScarfTail','SnowPad_L','SnowPad_R',
    ),
    silhouette_rule=lambda s: 1.55 <= s.x / s.z <= 1.80,
    description='single snow mass with one oversized short scarf; never a two-ball humanoid snowman',
    min_meshes=10,
    max_meshes=13,
    parent_rules=(ParentRule('ScarfTail','TailRoot'),),
    relative_size_rules=(
        RelativeSizeRule('SnowBody','x',0.55,0.68),
        RelativeSizeRule('ScarfTail','x',0.42,0.60),
    ),
    forbidden_nodes=('SnowUpper','UpperMass','Arm_L','Arm_R','Hand_L','Hand_R'),
)