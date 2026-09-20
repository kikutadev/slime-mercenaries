from enemies.families.dragon import DragonDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'dragon'
DEFINITION = DragonDefinition(
    'star-eater-dragon','star-eater-dragon',
    (0.18,0.22,0.36,1),(0.37,0.38,0.58,1),(0.67,0.55,0.78,1),
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'WingPairRoot','Wing_L','Wing_R','WingTip_L','WingTip_R',
        'Body','Belly','FootPad_L','FootPad_R',
        'HeadRoot','Head','Horn_L','Horn_R',
        'GlowRoot','ChestStar','TailRoot','Tail',
    ),
    silhouette_rule=lambda s: 1.28 <= s.x / s.z <= 1.62 and s.x >= 1.70 and s.z >= 1.38,
    description='final toy dragon boss with enormous head, broad wings, bounded horns and one tail',
    min_meshes=18,
    max_meshes=22,
    parent_rules=(
        ParentRule('Wing_L','WingPairRoot'),
        ParentRule('Wing_R','WingPairRoot'),
        ParentRule('Head','HeadRoot'),
        ParentRule('FaceRoot','HeadRoot'),
        ParentRule('ChestStar','GlowRoot'),
        ParentRule('Tail','TailRoot'),
    ),
    relative_size_rules=(
        RelativeSizeRule('Head','x',0.48,0.64),
        RelativeSizeRule('Wing_L','x',0.34,0.50),
        RelativeSizeRule('Wing_R','x',0.34,0.50),
    ),
    forbidden_prefixes=('Neck','Leg','Arm','Hand','Claw','Spine','Tooth','Fang'),
)
