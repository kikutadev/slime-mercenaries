from enemies.families.critter import CritterDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile
FAMILY='critter'
DEFINITION=CritterDefinition('round-hedgehog','hedgehog',(0.76,0.62,0.47,1),(0.54,0.40,0.31,1),(0.91,0.79,0.62,1))
VALIDATION_PROFILE=EnemyValidationProfile(required_nodes=COMMON_REQUIRED_NODES+('HeadRoot','ShellRoot','Ear_L','Ear_R'),silhouette_rule=lambda s:s.x/s.z>=1.05,description='low wide soft-quill hedgehog')
