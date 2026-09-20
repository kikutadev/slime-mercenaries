from enemies.families.ember import EmberDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'ember'
DEFINITION = EmberDefinition(
    'ember-gecko','gecko',
    (0.23,0.20,0.19,1),(0.38,0.28,0.22,1),(1.00,0.34,0.08,1),
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'Body','Belly','TailRoot','TailBase','GlowRoot','FlameTip',
        'Foot_FL','Foot_FR','Foot_BL','Foot_BR',
    ),
    silhouette_rule=lambda s: 1.65 <= s.x / s.z <= 2.05,
    description='low rounded gecko with one delayed ember tail tip',
    min_meshes=12,
    max_meshes=15,
    parent_rules=(
        ParentRule('TailBase','TailRoot'),
        ParentRule('GlowRoot','TailRoot'),
        ParentRule('FlameTip','GlowRoot'),
    ),
    relative_size_rules=(
        RelativeSizeRule('FlameTip','z',0.20,0.34),
        RelativeSizeRule('Body','x',0.55,0.78),
    ),
    forbidden_prefixes=('Spike','Wing','Horn'),
)
