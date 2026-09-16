from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.defense import create_round_shield

from .types import SlimeDefinition

DEFINITION = SlimeDefinition(
    slug="shield",
    display_name="Shield Slime",
    body_color=(0.08, 0.58, 0.90, 1.0),
    body_material_name="SlimeBlue",
    motion_profile="shield",
)


def build_parts(ctx: BuildContext) -> None:
    create_round_shield(ctx)
