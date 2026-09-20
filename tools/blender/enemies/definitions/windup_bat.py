from enemies.families.castle import CastleDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'castle'
DEFINITION = CastleDefinition(
    'windup-bat','windup-bat',
    (0.13,0.16,0.28,1),(0.34,0.39,0.54,1),(0.72,0.63,0.38,1),
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'Body','Belly','Ear_L','Ear_R','WingPairRoot',
        'Wing_L','Wing_R','WingTip_L','WingTip_R',
        'TailRoot','KeyStem','KeyBar','KeyKnob_L','KeyKnob_R',
    ),
    silhouette_rule=lambda s: 2.10 <= s.x / s.z <= 2.75,
    description='wide toy bat with one asymmetric oversized winding key',
    min_meshes=13,
    max_meshes=16,
    parent_rules=(
        ParentRule('Wing_L','WingPairRoot'),
        ParentRule('Wing_R','WingPairRoot'),
        ParentRule('KeyStem','TailRoot'),
        ParentRule('KeyBar','TailRoot'),
    ),
    relative_size_rules=(
        RelativeSizeRule('Wing_L','x',0.34,0.46),
        RelativeSizeRule('Wing_R','x',0.34,0.46),
        RelativeSizeRule('KeyBar','x',0.18,0.32),
    ),
    forbidden_prefixes=('Spear','Shield','Cape'),
)
