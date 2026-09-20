from enemies.families.frost import FrostDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'frost'
DEFINITION = FrostDefinition(
    'snow-statue-guardian','guardian',
    (0.85,0.92,0.95,1),(0.62,0.74,0.82,1),(0.35,0.72,0.92,1),
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'LowerMass','LowerShadow','LowerLobe_L','LowerLobe_R','NeckCore','PrimaryRoot','UpperMass','UpperFacePatch',
        'SecondaryRoot','CrestRoot','IceCrest','CrestTip_L','CrestTip_R',
        'GlowRoot','CrestGlow',
    ),
    silhouette_rule=lambda s: 0.90 <= s.x / s.z <= 1.15 and s.x >= 1.15 and s.z >= 1.15,
    description='non-humanoid two-mass snow statue boss with one broad ice crest',
    min_meshes=13,
    max_meshes=17,
    parent_rules=(
        ParentRule('UpperMass','PrimaryRoot'),
        ParentRule('SecondaryRoot','PrimaryRoot'),
        ParentRule('IceCrest','CrestRoot'),
        ParentRule('FaceRoot','PrimaryRoot'),
    ),
    relative_size_rules=(
        RelativeSizeRule('LowerMass','x',0.92,1.01),
        RelativeSizeRule('UpperMass','x',0.52,0.70),
        RelativeSizeRule('IceCrest','x',0.68,0.88),
    ),
    forbidden_prefixes=('Arm','Leg','Hand','Foot','Weapon'),
)