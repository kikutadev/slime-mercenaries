from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.ranged import create_ranger_hood, create_ranger_quiver, create_ranger_recurve_bow

from .types import SlimeDefinition

DEFINITION = SlimeDefinition(
    slug="ranger",
    display_name="Ranger Slime",
    # Keep the accepted Bow branch jelly body unchanged; Tier-2 identity comes from
    # modular equipment rather than body growth or a duplicated body generator.
    body_color=(0.06, 0.55, 0.88, 1.0),
    body_material_name="SlimeBlue",
    motion_profile="ranger",
)


def build_parts(ctx: BuildContext) -> None:
    create_ranger_hood(ctx)
    create_ranger_quiver(ctx)
    create_ranger_recurve_bow(ctx)
