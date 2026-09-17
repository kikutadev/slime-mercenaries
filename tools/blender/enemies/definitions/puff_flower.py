from enemies.families.flower import FlowerDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile
FAMILY='flower'
DEFINITION=FlowerDefinition('puff-flower','puff',(0.73,0.85,0.57,1),(0.93,0.78,0.91,1),(0.97,0.82,0.40,1),(0.38,0.67,0.41,1))
VALIDATION_PROFILE=EnemyValidationProfile(required_nodes=COMMON_REQUIRED_NODES+('StemRoot','HeadRoot','PetalRoot','PuffRoot'),silhouette_rule=lambda s:s.x/s.z>=.82,description='round puff-head silhouette')
