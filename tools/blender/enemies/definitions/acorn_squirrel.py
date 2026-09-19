from enemies.families.critter import CritterDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule
FAMILY='critter'
DEFINITION=CritterDefinition('acorn-squirrel','squirrel',(0.78,0.55,0.36,1),(0.62,0.39,0.25,1),(0.93,0.75,0.53,1))
VALIDATION_PROFILE=EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES+(
        'HeadRoot','TailRoot','Body','Head','Belly','TailLobe_1','TailLobe_2','TailLobe_3','AcornCharm','Ear_L','Ear_R',
    ),
    silhouette_rule=lambda s:0.92 <= s.x/s.z <= 1.08 and s.z >= 1.05,
    description='pear squirrel whose three-lobe oversized tail is the silhouette hook',
    min_meshes=15,max_meshes=17,
    parent_rules=(ParentRule('TailLobe_1','TailRoot'),ParentRule('TailLobe_2','TailRoot'),ParentRule('TailLobe_3','TailRoot')),
    relative_size_rules=(
        RelativeSizeRule('TailLobe_2','z',0.60,0.72),
        RelativeSizeRule('Body','z',0.52,0.62),
        RelativeSizeRule('Head','x',0.36,0.46),
    ),
    forbidden_nodes=('ShellRoot','QuillLobe_1'),
)