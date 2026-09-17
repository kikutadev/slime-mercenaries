from enemies.families.critter import CritterDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile
FAMILY='critter'
DEFINITION=CritterDefinition('acorn-squirrel','squirrel',(0.78,0.55,0.36,1),(0.62,0.39,0.25,1),(0.93,0.75,0.53,1))
VALIDATION_PROFILE=EnemyValidationProfile(required_nodes=COMMON_REQUIRED_NODES+('HeadRoot','TailRoot','Ear_L','Ear_R'),silhouette_rule=lambda s:s.x>=.85 and s.z>=.75,description='pear body with oversized tail silhouette')
