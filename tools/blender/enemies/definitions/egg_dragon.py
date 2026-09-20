from enemies.families.dragon import DragonDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'dragon'
DEFINITION = DragonDefinition(
    'egg-dragon','egg-dragon',
    (0.36,0.43,0.56,1),(0.50,0.56,0.68,1),(0.72,0.61,0.42,1),
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'Body','Belly','FootPad_L','FootPad_R',
        'HeadRoot','Head','Horn_L','Horn_R',
        'ThroatRoot','ThroatPuff',
        'ShellRoot','EggShellRing','ShellCrown_1','ShellCrown_2','ShellCrown_3',
    ),
    silhouette_rule=lambda s: 1.38 <= s.x / s.z <= 1.58,
    description='round hatchling dominated by a giant head and one lower eggshell ring',
    min_meshes=16,
    max_meshes=18,
    parent_rules=(
        ParentRule('Head','HeadRoot'),
        ParentRule('FaceRoot','HeadRoot'),
        ParentRule('ThroatRoot','HeadRoot'),
        ParentRule('EggShellRing','ShellRoot'),
    ),
    relative_size_rules=(
        RelativeSizeRule('Head','x',0.42,0.50),
        RelativeSizeRule('EggShellRing','x',0.94,1.01),
    ),
    forbidden_prefixes=('Wing','BackStar','StarMote','Claw','Spine'),
)
