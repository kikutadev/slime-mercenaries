from enemies.families.castle import CastleDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'castle'
DEFINITION = CastleDefinition(
    'round-sentry','round-sentry',
    (0.16,0.20,0.30,1),(0.38,0.43,0.55,1),(0.78,0.64,0.34,1),
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'Body','BodyBase','ToyFoot_L','ToyFoot_R',
        'HeadRoot','Helmet','HelmetRim','HelmetBadge',
        'PrimaryRoot','SpearShaft','SpearTip',
    ),
    silhouette_rule=lambda s: 1.05 <= s.z / s.x <= 1.35,
    description='toy sentry with giant rounded helmet, tiny body, and one short spear',
    min_meshes=13,
    max_meshes=16,
    parent_rules=(
        ParentRule('Helmet','HeadRoot'),
        ParentRule('FaceRoot','HeadRoot'),
        ParentRule('SpearShaft','PrimaryRoot'),
        ParentRule('SpearTip','PrimaryRoot'),
    ),
    relative_size_rules=(
        RelativeSizeRule('Helmet','z',0.58,0.72),
        RelativeSizeRule('Body','z',0.24,0.38),
        RelativeSizeRule('SpearTip','z',0.12,0.22),
    ),
    forbidden_prefixes=('Shield','Cape','Wing','Key'),
)
