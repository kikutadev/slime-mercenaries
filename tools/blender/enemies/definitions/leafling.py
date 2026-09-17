from enemies.families.leaf import LeafDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile
FAMILY='leaf'
DEFINITION=LeafDefinition('leafling','single',(0.73,0.86,0.48,1),(0.30,0.66,0.30,1),(0.48,0.76,0.31,1))
VALIDATION_PROFILE=EnemyValidationProfile(required_nodes=COMMON_REQUIRED_NODES+('LeafRoot','LeafTip','Leaf'),silhouette_rule=lambda s: .85 <= s.x/s.z <= 1.35,description='single broad leaf compact silhouette')
