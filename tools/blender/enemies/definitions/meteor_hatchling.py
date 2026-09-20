from enemies.families.dragon import DragonDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'dragon'
DEFINITION = DragonDefinition(
    'meteor-hatchling','meteor-hatchling',
    (0.34,0.39,0.55,1),(0.48,0.46,0.68,1),(0.74,0.60,0.82,1),
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'Body','Belly','FootPad_L','FootPad_R',
        'HeadRoot','Head','Horn_L','Horn_R',
        'GlowRoot','PrimaryRoot','SecondaryRoot','StarMote_L','StarMote_R',
    ),
    silhouette_rule=lambda s: 1.25 <= s.x / s.z <= 1.50,
    description='round hatchling with exactly two orbiting star motes',
    min_meshes=13,
    max_meshes=16,
    parent_rules=(
        ParentRule('Head','HeadRoot'),
        ParentRule('FaceRoot','HeadRoot'),
        ParentRule('PrimaryRoot','GlowRoot'),
        ParentRule('SecondaryRoot','GlowRoot'),
        ParentRule('StarMote_L','PrimaryRoot'),
        ParentRule('StarMote_R','SecondaryRoot'),
    ),
    relative_size_rules=(
        RelativeSizeRule('Head','x',0.44,0.52),
        RelativeSizeRule('StarMote_L','z',0.14,0.22),
        RelativeSizeRule('StarMote_R','z',0.14,0.22),
    ),
    forbidden_prefixes=('StarMote_3','Wing','EggShell','ShellCrown','BackStar','Claw','Spine'),
)
