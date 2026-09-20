from enemies.families.castle import CastleDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'castle'
DEFINITION = CastleDefinition(
    'moon-crown-knight','moon-knight',
    (0.11,0.14,0.25,1),(0.30,0.32,0.50,1),(0.76,0.72,0.58,1),
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'TailRoot','Cape','CapeClasp_L','CapeClasp_R',
        'Body','BodyBase','Mantle_L','Mantle_R',
        'HeadRoot','Helmet','HelmetRim','HelmetLug_L','HelmetLug_R','CrownCrescent',
        'PrimaryRoot','BladeGrip','MoonBlade',
    ),
    silhouette_rule=lambda s: 1.08 <= s.x / s.z <= 1.38 and s.x >= 1.35 and s.z >= 1.25,
    description='short moon-crown boss dominated by giant helmet, broad cape, and one blade',
    min_meshes=16,
    max_meshes=20,
    parent_rules=(
        ParentRule('Cape','TailRoot'),
        ParentRule('Helmet','HeadRoot'),
        ParentRule('FaceRoot','HeadRoot'),
        ParentRule('MoonBlade','PrimaryRoot'),
    ),
    relative_size_rules=(
        RelativeSizeRule('Cape','x',0.80,0.96),
        RelativeSizeRule('Helmet','x',0.52,0.68),
    ),
    forbidden_prefixes=('Arm','Leg','Hand','Foot','Wing','Shield'),
)
