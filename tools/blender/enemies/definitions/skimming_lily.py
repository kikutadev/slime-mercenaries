from enemies.families.marsh import MarshDefinition
from enemies.validation_profiles import COMMON_REQUIRED_NODES, EnemyValidationProfile, ParentRule, RelativeSizeRule

FAMILY = 'marsh'
DEFINITION = MarshDefinition('skimming-lily','lily',(0.30,0.58,0.31,1),(0.45,0.70,0.40,1),(0.52,0.80,0.78,0.65))
VALIDATION_PROFILE = EnemyValidationProfile(
    required_nodes=COMMON_REQUIRED_NODES + (
        'PrimaryRoot','PadRoot','LilyPad','PadFrontLip','SecondaryRoot','DewDrop','TinyLeaf',
    ),
    silhouette_rule=lambda s: 4.4 <= s.x / s.z <= 5.6,
    description='extremely flat notched lily pad with bead-scale face and central dewdrop',
    min_meshes=6,
    max_meshes=7,
    parent_rules=(ParentRule('FaceRoot','PrimaryRoot'),ParentRule('LilyPad','PadRoot')),
    relative_size_rules=(
        RelativeSizeRule('LilyPad','x',0.95,1.01),
        RelativeSizeRule('DewDrop','z',0.65,0.90),
    ),
)