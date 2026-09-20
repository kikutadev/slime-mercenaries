from enemies.families.flower import FlowerDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule
FAMILY='flower'
DEFINITION=FlowerDefinition('bud-bloom','bud',(0.70,0.84,0.52,1),(0.96,0.52,0.60,1),(0.98,0.78,0.36,1),(0.34,0.64,0.36,1))
VALIDATION_PROFILE=EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES+(
        'StemRoot','HeadRoot','PetalRoot','BudCore','Petal_1','Petal_2','Petal_3','Petal_4','Leaf_L','Leaf_R',
    ),
    silhouette_rule=lambda s:1.65 <= s.z/s.x <= 1.90,
    description='closed vertical bud with four enclosing petals and a narrow plant body',
    min_meshes=14,max_meshes=16,
    parent_rules=(ParentRule('BudCore','HeadRoot'),ParentRule('Petal_1','PetalRoot')),
    relative_size_rules=(
        RelativeSizeRule('BudCore','z',0.60,0.76),
        RelativeSizeRule('Petal_1','z',0.54,0.72),
    ),
    forbidden_nodes=('PuffRoot','Puff_1'),
)