from enemies.families.marsh import MarshDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, RelativeSizeRule

FAMILY = 'marsh'
DEFINITION = MarshDefinition('great-marsh-frog','boss-frog',(0.34,0.55,0.28,1),(0.70,0.78,0.36,1),(0.40,0.72,0.68,0.58))
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'ThroatRoot','GiantThroatSac','ThroatLowerLobe','SecondaryRoot','BackRipple',
        'EyeMound_L','EyeMound_R','Foot_L','Foot_R','Paw_L','Paw_R',
    ),
    silhouette_rule=lambda s: 1.20 <= s.x / s.z <= 1.45 and s.x >= 1.20 and s.z >= 0.90,
    description='boss frog with tall two-level mass and a hanging two-lobe giant throat',
    min_meshes=17,
    max_meshes=20,
    relative_size_rules=(
        RelativeSizeRule('GiantThroatSac','z',0.55,0.72),
        RelativeSizeRule('ThroatLowerLobe','z',0.30,0.45),
    ),
)
