from enemies.families.leaf import LeafDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile
FAMILY='leaf'
DEFINITION=LeafDefinition('whirl-leaf','whirl',(0.72,0.86,0.54,1),(0.25,0.64,0.36,1),(0.50,0.78,0.36,1))
VALIDATION_PROFILE=EnemyValidationProfile(required_nodes=COMMON_REQUIRED_NODES+('LeafRoot','LeafSecondary','LeafTip'),silhouette_rule=lambda s: s.x/s.z >= .95,description='two-leaf pinwheel silhouette')
