from enemies.families.mine import MineDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'mine'
DEFINITION = MineDefinition('amber-turtle','turtle',(0.49,0.42,0.31,1),(0.72,0.55,0.29,1),(0.94,0.48,0.10,1))
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'ShellRoot','ShellRim','AmberShell','PrimaryRoot','HeadRoot','Head','Muzzle',
        'Foot_FL','Foot_FR','Foot_BL','Foot_BR','TailNub',
    ),
    silhouette_rule=lambda s: 1.35 <= s.x / s.z <= 1.60 and s.x >= 1.0,
    description='boss turtle whose amber shell is the first read, with a retracting small head',
    min_meshes=17,
    max_meshes=20,
    parent_rules=(ParentRule('FaceRoot','HeadRoot'),),
    relative_size_rules=(
        RelativeSizeRule('AmberShell','x',0.82,0.98),
        RelativeSizeRule('Head','x',0.40,0.60),
    ),
)
