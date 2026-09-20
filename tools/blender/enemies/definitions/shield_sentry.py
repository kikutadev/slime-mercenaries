from enemies.families.castle import CastleDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'castle'
DEFINITION = CastleDefinition(
    'shield-sentry','shield-sentry',
    (0.17,0.22,0.32,1),(0.34,0.42,0.54,1),(0.73,0.61,0.33,1),
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'Body','BodyBase','ToyFoot_L','ToyFoot_R',
        'HeadRoot','Helmet','HelmetRim','HelmetBadge',
        'ShellRoot','RoundShield','ShieldRim','ShieldBoss',
    ),
    silhouette_rule=lambda s: 1.10 <= s.x / s.z <= 1.42,
    description='shield-first toy defender with one oversized round shield',
    min_meshes=13,
    max_meshes=16,
    parent_rules=(
        ParentRule('Helmet','HeadRoot'),
        ParentRule('FaceRoot','HeadRoot'),
        ParentRule('RoundShield','ShellRoot'),
        ParentRule('ShieldRim','ShellRoot'),
        ParentRule('ShieldBoss','ShellRoot'),
    ),
    relative_size_rules=(
        RelativeSizeRule('RoundShield','x',0.94,1.01),
        RelativeSizeRule('Body','x',0.32,0.50),
    ),
    forbidden_prefixes=('Spear','Cape','Wing','Key'),
)
