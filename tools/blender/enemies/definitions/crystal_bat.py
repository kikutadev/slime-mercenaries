from enemies.families.mine import MineDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'mine'
DEFINITION = MineDefinition('crystal-bat','bat',(0.38,0.34,0.43,1),(0.55,0.47,0.61,1),(0.96,0.61,0.22,1))
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'PrimaryRoot','WingPairRoot','Wing_L_Upper','Wing_R_Upper',
        'SecondaryRoot','CrystalRoot','BatCrystal','Belly','Ear_L','Ear_R',
    ),
    silhouette_rule=lambda s: 1.65 <= s.x / s.z <= 2.15,
    description='wide plush bat with one-piece scalloped wings and a small crystal accent',
    min_meshes=13,
    max_meshes=16,
    parent_rules=(
        ParentRule('Wing_L_Upper','WingPairRoot'),
        ParentRule('Wing_R_Upper','WingPairRoot'),
        ParentRule('BatCrystal','CrystalRoot'),
    ),
    relative_size_rules=(
        RelativeSizeRule('Wing_L_Upper','x',0.30,0.43),
        RelativeSizeRule('Wing_R_Upper','x',0.30,0.43),
        RelativeSizeRule('BatCrystal','z',0.14,0.28),
    ),
    forbidden_nodes=('Wing_L_Lower','Wing_R_Lower'),
)
