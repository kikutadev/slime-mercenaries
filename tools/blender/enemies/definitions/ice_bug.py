from enemies.families.frost import FrostDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'frost'
DEFINITION = FrostDefinition(
    'ice-bug','bug',
    (0.89,0.95,0.97,1),(0.65,0.79,0.87,1),(0.39,0.74,0.92,1),
)
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'Body','Underbody','PrimaryRoot','SpikeRoot',
        'IceSpike_1','IceSpike_2','IceSpike_3',
        'Foot_FL','Foot_FR','Foot_BL','Foot_BR',
    ),
    silhouette_rule=lambda s: 1.40 <= s.x / s.z <= 1.75,
    description='low dumpling bug with exactly three broad ice spikes',
    min_meshes=11,
    max_meshes=14,
    parent_rules=(
        ParentRule('IceSpike_1','SpikeRoot'),
        ParentRule('IceSpike_2','SpikeRoot'),
        ParentRule('IceSpike_3','SpikeRoot'),
    ),
    relative_size_rules=(
        RelativeSizeRule('IceSpike_2','z',0.34,0.48),
        RelativeSizeRule('Body','x',0.95,1.01),
    ),
    forbidden_prefixes=('IceSpike_4','IceSpike_5','Wing','Horn'),
)