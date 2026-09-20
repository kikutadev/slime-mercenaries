from enemies.families.dragon import DragonDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'dragon'
DEFINITION = DragonDefinition(
    'tiny-wing-dragon','tiny-wing-dragon',
    (0.32,0.40,0.54,1),(0.47,0.55,0.70,1),(0.73,0.61,0.40,1),
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'Body','Belly','FootPad_L','FootPad_R',
        'HeadRoot','Head','Horn_L','Horn_R',
        'WingPairRoot','Wing_L','Wing_R','TailRoot','Tail',
    ),
    silhouette_rule=lambda s: 1.20 <= s.z / s.x <= 1.48,
    description='giant-headed hatchling whose wings are comically too small to carry it',
    min_meshes=13,
    max_meshes=16,
    parent_rules=(
        ParentRule('Head','HeadRoot'),
        ParentRule('FaceRoot','HeadRoot'),
        ParentRule('Wing_L','WingPairRoot'),
        ParentRule('Wing_R','WingPairRoot'),
        ParentRule('Tail','TailRoot'),
    ),
    relative_size_rules=(
        RelativeSizeRule('Head','x',0.72,0.82),
        RelativeSizeRule('Wing_L','x',0.14,0.20),
        RelativeSizeRule('Wing_R','x',0.14,0.20),
    ),
    forbidden_prefixes=('EggShell','ShellCrown','BackStar','StarMote','Claw','Spine'),
)
