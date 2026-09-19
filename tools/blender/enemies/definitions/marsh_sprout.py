from enemies.families.marsh import MarshDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'marsh'
DEFINITION = MarshDefinition('marsh-sprout','sprout',(0.37,0.68,0.66,0.82),(0.39,0.63,0.30,1),(0.48,0.80,0.82,0.70))
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'DropBody','PrimaryRoot','LeafPairRoot','Leaf_L','Leaf_R','SecondaryRoot','WaterCore',
    ),
    silhouette_rule=lambda s: 0.85 <= s.z / s.x <= 1.08,
    description='one-piece seed/drop body topped by exactly two broad leaves',
    min_meshes=11,
    max_meshes=14,
    parent_rules=(ParentRule('Leaf_L','LeafPairRoot'),ParentRule('Leaf_R','LeafPairRoot')),
    relative_size_rules=(
        RelativeSizeRule('DropBody','z',0.84,0.98),
        RelativeSizeRule('Leaf_L','x',0.45,0.62),
        RelativeSizeRule('Leaf_R','x',0.45,0.62),
    ),
    forbidden_nodes=('DropLower','DropUpper'),
)
