from enemies.families.leaf import LeafDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule
FAMILY='leaf'
DEFINITION=LeafDefinition('whirl-leaf','whirl',(0.72,0.86,0.54,1),(0.25,0.64,0.36,1),(0.50,0.78,0.36,1))
VALIDATION_PROFILE=EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES+('LeafRoot','Leaf','LeafSecondary','Leaf_Secondary','LeafTip','Core'),
    silhouette_rule=lambda s:1.00 <= s.x/s.z <= 1.22,
    description='two-leaf pinwheel with two similarly dominant blades',
    min_meshes=9,max_meshes=11,
    parent_rules=(ParentRule('Leaf','LeafRoot'),ParentRule('Leaf_Secondary','LeafSecondary')),
    relative_size_rules=(
        RelativeSizeRule('Leaf','x',0.60,0.78),
        RelativeSizeRule('Leaf_Secondary','x',0.58,0.76),
    ),
    forbidden_nodes=('LeafVein',),
)