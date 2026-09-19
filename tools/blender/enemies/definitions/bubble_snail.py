from enemies.families.marsh import MarshDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'marsh'
DEFINITION = MarshDefinition('bubble-snail','snail',(0.49,0.61,0.34,1),(0.62,0.72,0.42,1),(0.60,0.84,0.86,0.52))
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'SecondaryRoot','BubbleShellRoot','BubbleShell','BubbleCore','BubbleInnerRing',
        'Head','Antenna_L','Antenna_R','Antenna_L_Tip','Antenna_R_Tip',
    ),
    silhouette_rule=lambda s: 1.00 <= s.x / s.z <= 1.20,
    description='tiny low snail body dominated by a single oversized bubble shell',
    min_meshes=15,
    max_meshes=18,
    parent_rules=(ParentRule('BubbleShell','BubbleShellRoot'),),
    relative_size_rules=(
        RelativeSizeRule('BubbleShell','x',0.90,1.02),
        RelativeSizeRule('Head','x',0.52,0.72),
    ),
)
