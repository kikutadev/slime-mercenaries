from enemies.families.ember import EmberDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'ember'
DEFINITION = EmberDefinition(
    'magma-crab','crab',
    (0.22,0.18,0.17,1),(0.56,0.25,0.16,1),(1.00,0.36,0.07,1),
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'Body','Underbody','PrimaryRoot','SecondaryRoot','Claw_L','Claw_R',
        'Shoulder_L','Shoulder_R','Pad_L','Pad_R','GlowRoot','MagmaCore',
    ),
    silhouette_rule=lambda s: 2.15 <= s.x / s.z <= 2.75,
    description='extremely wide rounded crab with exactly two compact dominant claws',
    min_meshes=11,
    max_meshes=14,
    parent_rules=(
        ParentRule('Claw_L','PrimaryRoot'),
        ParentRule('Claw_R','SecondaryRoot'),
    ),
    relative_size_rules=(
        RelativeSizeRule('Claw_L','x',0.18,0.28),
        RelativeSizeRule('Claw_R','x',0.18,0.28),
        RelativeSizeRule('Body','x',0.48,0.64),
    ),
    forbidden_prefixes=('Leg_','PincerTooth','Finger','Arm'),
)
