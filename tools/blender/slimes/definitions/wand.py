from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.magic import create_wand_and_cap

from .types import SlimeDefinition

DEFINITION = SlimeDefinition(
    slug="wand",
    display_name="Wand Slime",
    body_color=(0.18, 0.48, 0.90, 1.0),
    body_material_name="SlimeArcaneBlue",
    motion_profile="wand",
)


def build_parts(ctx: BuildContext) -> None:
    create_wand_and_cap(ctx)
