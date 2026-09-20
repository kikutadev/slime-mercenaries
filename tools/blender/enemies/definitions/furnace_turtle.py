from enemies.families.ember import EmberDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'ember'
DEFINITION = EmberDefinition(
    'furnace-turtle','turtle',
    (0.20,0.19,0.18,1),(0.38,0.28,0.23,1),(1.00,0.34,0.06,1),
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'LowerBody','LowerBase','Foot_L','Foot_R','NeckCore',
        'ShellRoot','FurnaceShell','FurnaceRim','ShellBand_L','ShellBand_R',
        'GlowRoot','Core','HeadRoot','Head','Vent_L','Vent_R',
    ),
    silhouette_rule=lambda s: 1.05 <= s.z / s.x <= 1.30 and s.x >= 1.10 and s.z >= 1.20,
    description='thick vertical turtle boss with one central furnace shell and one core',
    min_meshes=16,
    max_meshes=19,
    parent_rules=(
        ParentRule('FurnaceShell','ShellRoot'),
        ParentRule('GlowRoot','ShellRoot'),
        ParentRule('Core','GlowRoot'),
        ParentRule('Head','HeadRoot'),
        ParentRule('FaceRoot','HeadRoot'),
    ),
    relative_size_rules=(
        RelativeSizeRule('FurnaceShell','x',0.62,0.80),
        RelativeSizeRule('Core','z',0.18,0.30),
        RelativeSizeRule('Head','x',0.34,0.48),
    ),
    forbidden_prefixes=('Amber','Crystal','Weapon'),
)