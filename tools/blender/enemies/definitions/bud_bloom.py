from enemies.families.flower import FlowerDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile
FAMILY='flower'
DEFINITION=FlowerDefinition('bud-bloom','bud',(0.70,0.84,0.52,1),(0.96,0.52,0.60,1),(0.98,0.78,0.36,1),(0.34,0.64,0.36,1))
VALIDATION_PROFILE=EnemyValidationProfile(required_nodes=COMMON_REQUIRED_NODES+('StemRoot','HeadRoot','PetalRoot','BudCore'),silhouette_rule=lambda s:s.z/s.x>=1.02,description='vertical closed bud silhouette')
