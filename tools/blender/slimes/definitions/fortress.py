from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.defense import create_fortress_pavise

from .types import SlimeDefinition


DEFINITION = SlimeDefinition(
    slug="fortress",
    display_name="Fortress Slime",
    # Pure-tank mass comes from the pavise and low equipment language, never body growth.
    body_color=(0.08, 0.58, 0.90, 1.0),
    body_material_name="SlimeBlue",
    motion_profile="fortress",
)


def build_parts(ctx: BuildContext) -> None:
    """Assemble the square-pavise pure tank on the unchanged canonical Base Slime."""
    create_fortress_pavise(ctx)
