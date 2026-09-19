from enemies.families.mine import MineDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'mine'
DEFINITION = MineDefinition('crystal-beetle','beetle',(0.59,0.48,0.37,1),(0.76,0.62,0.41,1),(0.95,0.57,0.18,1))
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'PrimaryRoot','CrystalRoot','BackCrystal','HeadLobe',
        'Foot_FL','Foot_FR','Foot_BL','Foot_BR',
    ),
    silhouette_rule=lambda s: 1.05 <= s.x / s.z <= 1.35,
    description='low beetle whose single back crystal dominates the top silhouette',
    min_meshes=13,
    max_meshes=16,
    parent_rules=(ParentRule('BackCrystal','CrystalRoot'),),
    relative_size_rules=(
        RelativeSizeRule('BackCrystal','z',0.50,0.72),
        RelativeSizeRule('HeadLobe','x',0.55,0.75),
    ),
)
