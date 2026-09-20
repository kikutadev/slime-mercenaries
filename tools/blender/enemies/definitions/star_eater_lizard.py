from enemies.families.dragon import DragonDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'dragon'
DEFINITION = DragonDefinition(
    'star-eater-lizard','star-eater-lizard',
    (0.24,0.31,0.43,1),(0.40,0.46,0.60,1),(0.66,0.52,0.76,1),
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'Body','Belly',
        'FootPad_FL','FootPad_FR','FootPad_BL','FootPad_BR',
        'HeadRoot','Head','PrimaryRoot','GlowRoot','BackStar','TailRoot','Tail',
    ),
    silhouette_rule=lambda s: 1.65 <= s.x / s.z <= 2.10,
    description='low compact lizard with exactly one oversized glowing back star',
    min_meshes=11,
    max_meshes=14,
    parent_rules=(
        ParentRule('Head','HeadRoot'),
        ParentRule('FaceRoot','HeadRoot'),
        ParentRule('GlowRoot','PrimaryRoot'),
        ParentRule('BackStar','GlowRoot'),
        ParentRule('Tail','TailRoot'),
    ),
    relative_size_rules=(
        RelativeSizeRule('BackStar','z',0.42,0.60),
        RelativeSizeRule('Body','x',0.62,0.80),
    ),
    forbidden_prefixes=('Wing','EggShell','ShellCrown','StarMote','Claw','Spine'),
)
