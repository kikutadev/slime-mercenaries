from enemies.families.ember import EmberDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'ember'
DEFINITION = EmberDefinition(
    'crackle-bug','bug',
    (0.19,0.17,0.17,1),(0.48,0.25,0.17,1),(1.00,0.42,0.08,1),
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'Body','Underbody','ShellMount','ShellRoot','ChargeShell','ShellRim','GlowRoot','ShellGlow',
        'Foot_FL','Foot_FR','Foot_BL','Foot_BR','Antenna_L','Antenna_R',
    ),
    silhouette_rule=lambda s: 1.28 <= s.x / s.z <= 1.60,
    description='compact four-pad bug dominated by one rounded charge shell',
    min_meshes=14,
    max_meshes=15,
    parent_rules=(
        ParentRule('ChargeShell','ShellRoot'),
        ParentRule('ShellRim','ShellRoot'),
        ParentRule('GlowRoot','ShellRoot'),
    ),
    relative_size_rules=(
        RelativeSizeRule('ChargeShell','x',0.72,0.90),
        RelativeSizeRule('Body','x',0.78,1.01),
    ),
    forbidden_prefixes=('Foot_M','Leg','Wing','Antenna_3'),
)