from enemies.families.mine import MineDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'mine'
DEFINITION = MineDefinition('pebble-golem','golem',(0.47,0.43,0.39,1),(0.62,0.56,0.48,1),(0.88,0.53,0.17,1))
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'PrimaryRoot','RockClusterRoot','RockCenter','RockLeft','RockRight','FacePatch',
    ),
    silhouette_rule=lambda s: 1.35 <= s.x / s.z <= 1.60,
    description='three asymmetrical rounded rocks; never humanoid',
    min_meshes=9,
    max_meshes=10,
    parent_rules=(ParentRule('FaceRoot','RockClusterRoot'),),
    relative_size_rules=(
        RelativeSizeRule('RockCenter','x',0.50,0.68),
        RelativeSizeRule('RockLeft','x',0.30,0.48),
        RelativeSizeRule('RockRight','x',0.30,0.48),
    ),
    forbidden_prefixes=('Arm','Leg','Hand','Foot'),
)
