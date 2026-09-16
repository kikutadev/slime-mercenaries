from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.ranged import create_bow

from .types import SlimeDefinition

DEFINITION = SlimeDefinition(
    slug="bow",
    display_name="Bow Slime",
    body_color=(0.06, 0.55, 0.88, 1.0),
    body_material_name="SlimeBlue",
    motion_profile="bow",
)


def build_parts(ctx: BuildContext) -> None:
    create_bow(ctx)
