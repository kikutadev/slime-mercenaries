from enemies.families.flower import FlowerDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule
FAMILY='flower'
DEFINITION=FlowerDefinition('puff-flower','puff',(0.73,0.85,0.57,1),(0.93,0.78,0.91,1),(0.97,0.82,0.40,1),(0.38,0.67,0.41,1))
VALIDATION_PROFILE=EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES+(
        'StemRoot','HeadRoot','PetalRoot','PuffRoot','Puff_1','Puff_2','Puff_3','Puff_4','Puff_5','Puff_6','Leaf_L','Leaf_R',
    ),
    silhouette_rule=lambda s:0.80 <= s.x/s.z <= 0.92,
    description='round six-lobe puff head on a slim stem, distinct from the closed bud',
    min_meshes=16,max_meshes=18,
    parent_rules=(ParentRule('Puff_1','PuffRoot'),ParentRule('Puff_6','PuffRoot')),
    relative_size_rules=(
        RelativeSizeRule('Puff_1','x',0.45,0.56),
        RelativeSizeRule('Puff_2','z',0.37,0.48),
    ),
    forbidden_nodes=('BudCore','Petal_1'),
)
