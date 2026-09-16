from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.melee import create_greatsword

from .types import SlimeDefinition

DEFINITION = SlimeDefinition(
    slug="greatsword",
    display_name="Greatsword Slime",
    body_color=(0.045, 0.48, 0.96, 1.0),
    body_material_name="SlimeBlue",
    motion_profile="greatsword",
)


def build_parts(ctx: BuildContext) -> None:
    create_greatsword(ctx)
