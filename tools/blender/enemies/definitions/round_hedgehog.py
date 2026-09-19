from enemies.families.critter import CritterDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule
FAMILY='critter'
DEFINITION=CritterDefinition('round-hedgehog','hedgehog',(0.76,0.62,0.47,1),(0.54,0.40,0.31,1),(0.91,0.79,0.62,1))
VALIDATION_PROFILE=EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES+(
        'HeadRoot','ShellRoot','Body','Head','Snout','QuillLobe_1','QuillLobe_2','QuillLobe_3','QuillLobe_4','Ear_L','Ear_R',
    ),
    silhouette_rule=lambda s:1.08 <= s.x/s.z <= 1.22,
    description='low bean hedgehog whose soft four-lobe shell is wider than its head',
    min_meshes=16,max_meshes=18,
    parent_rules=(ParentRule('QuillLobe_2','ShellRoot'),ParentRule('Head','HeadRoot')),
    relative_size_rules=(
        RelativeSizeRule('Body','x',0.80,0.90),
        RelativeSizeRule('QuillLobe_2','x',0.52,0.64),
        RelativeSizeRule('Head','x',0.46,0.56),
    ),
    forbidden_nodes=('TailRoot','TailLobe_1'),
)
