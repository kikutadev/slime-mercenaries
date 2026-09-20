from enemies.families.leaf import LeafDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule
FAMILY='leaf'
DEFINITION=LeafDefinition('leafling','single',(0.73,0.86,0.48,1),(0.30,0.66,0.30,1),(0.48,0.76,0.31,1))
VALIDATION_PROFILE=EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES+('LeafRoot','SecondaryRoot','LeafTip','Leaf','LeafVein','LeafTipLobe','Core','Foot_L','Foot_R'),
    silhouette_rule=lambda s:1.05 <= s.x/s.z <= 1.28,
    description='single broad leaf whose one blade occupies almost the full width',
    min_meshes=9,max_meshes=11,
    parent_rules=(ParentRule('Leaf','LeafRoot'),ParentRule('LeafVein','LeafRoot'),ParentRule('LeafTipLobe','SecondaryRoot')),
    relative_size_rules=(RelativeSizeRule('Leaf','x',0.95,1.02),RelativeSizeRule('Core','x',0.38,0.50)),
    forbidden_nodes=('LeafSecondary','Leaf_Secondary'),
)