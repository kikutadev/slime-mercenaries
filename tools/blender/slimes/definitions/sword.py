from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.melee import create_basic_sword

from .types import SlimeDefinition

DEFINITION = SlimeDefinition(
    slug="sword",
    display_name="Sword Slime",
    body_color=(0.045, 0.48, 0.96, 1.0),
    body_material_name="SlimeBlue",
    motion_profile="sword",
)


def build_parts(ctx: BuildContext) -> None:
    create_basic_sword(ctx)
