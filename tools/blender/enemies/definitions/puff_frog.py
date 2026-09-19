from enemies.families.marsh import MarshDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, RelativeSizeRule

FAMILY = 'marsh'
DEFINITION = MarshDefinition('puff-frog','frog',(0.43,0.66,0.36,1),(0.66,0.78,0.42,1),(0.48,0.78,0.75,0.72))
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'ThroatRoot','ThroatSac','EyeMound_L','EyeMound_R','Foot_L','Foot_R','Paw_L','Paw_R',
    ),
    silhouette_rule=lambda s: 1.65 <= s.x / s.z <= 2.00,
    description='flat wide frog whose throat sac is the attack tell',
    min_meshes=13,
    max_meshes=16,
    relative_size_rules=(RelativeSizeRule('ThroatSac','x',0.42,0.58),),
)
