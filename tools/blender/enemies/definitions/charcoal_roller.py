from enemies.families.ember import EmberDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'ember'
DEFINITION = EmberDefinition(
    'charcoal-roller','charcoal',
    (0.16,0.15,0.15,1),(0.25,0.23,0.22,1),(0.92,0.20,0.06,1),
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'CharcoalBody','CharcoalBase','CharcoalChip','GlowRoot',
        'GlowCrack_1','GlowCrack_2','GlowCrack_3',
    ),
    silhouette_rule=lambda s: 0.95 <= s.x / s.z <= 1.12,
    description='single charcoal ball with exactly three broad emissive cracks',
    min_meshes=9,
    max_meshes=12,
    parent_rules=(
        ParentRule('GlowCrack_1','GlowRoot'),
        ParentRule('GlowCrack_2','GlowRoot'),
        ParentRule('GlowCrack_3','GlowRoot'),
    ),
    relative_size_rules=(
        RelativeSizeRule('CharcoalBody','x',0.92,1.01),
        RelativeSizeRule('GlowCrack_1','z',0.28,0.46),
    ),
    forbidden_prefixes=('Foot','Leg','Arm','Hand','Wing','Tail'),
    forbidden_nodes=('GlowCrack_4','GlowCrack_5'),
)
