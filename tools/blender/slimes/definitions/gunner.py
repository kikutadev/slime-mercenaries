from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.gun import create_gunner_kit

from .types import SlimeDefinition

DEFINITION = SlimeDefinition(
    slug="gunner",
    display_name="Gunner Slime",
    body_color=(0.07, 0.52, 0.84, 1.0),
    body_material_name="SlimeSteelBlue",
    motion_profile="gunner",
)


def build_parts(ctx: BuildContext) -> None:
    create_gunner_kit(ctx)
