from enemies.families.castle import CastleDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'castle'
DEFINITION = CastleDefinition(
    'bell-mage','bell-mage',
    (0.21,0.23,0.38,1),(0.43,0.38,0.58,1),(0.77,0.67,0.42,1),
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'PrimaryRoot','BellBody','BellCrown','BellRim','BellCollar',
        'SecondaryRoot','ClapperStem','Clapper',
    ),
    silhouette_rule=lambda s: 1.28 <= s.z / s.x <= 1.58,
    description='footless bell-shaped caster with one delayed clapper',
    min_meshes=10,
    max_meshes=13,
    parent_rules=(
        ParentRule('BellBody','PrimaryRoot'),
        ParentRule('FaceRoot','PrimaryRoot'),
        ParentRule('SecondaryRoot','PrimaryRoot'),
        ParentRule('Clapper','SecondaryRoot'),
    ),
    relative_size_rules=(
        RelativeSizeRule('BellBody','z',0.58,0.70),
        RelativeSizeRule('Clapper','z',0.12,0.22),
    ),
    forbidden_prefixes=('Foot','ToyFoot','Spear','Shield','Cape','Wing','Key'),
)
