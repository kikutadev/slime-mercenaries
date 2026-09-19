from enemies.families.mine import MineDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'mine'
DEFINITION = MineDefinition('drill-nose-mole','mole',(0.55,0.43,0.35,1),(0.76,0.61,0.48,1),(0.93,0.49,0.15,1))
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'PrimaryRoot','NoseRoot','DrillNose','Muzzle','Paw_L','Paw_R','Foot_L','Foot_R',
    ),
    silhouette_rule=lambda s: 1.25 <= s.x / s.z <= 1.55,
    description='squat mole with one short mineral nose and mitten paws',
    min_meshes=13,
    max_meshes=16,
    parent_rules=(ParentRule('DrillNose','NoseRoot'),),
    relative_size_rules=(
        RelativeSizeRule('DrillNose','max',0.30,0.42,character_axis='z'),
        RelativeSizeRule('Muzzle','x',0.42,0.60),
    ),
    forbidden_prefixes=('Pickaxe','Weapon'),
)