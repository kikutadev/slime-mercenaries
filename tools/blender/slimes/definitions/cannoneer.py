from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.gun import create_cannoneer_cannon

from .types import SlimeDefinition

DEFINITION = SlimeDefinition(
    slug="cannoneer",
    display_name="Cannoneer Slime",
    body_color=(0.055, 0.31, 0.56, 1.0),
    body_material_name="SlimeCannoneerBlue",
    body_scale=(1.0, 1.0, 1.0),
    motion_profile="cannoneer",
)


def build_parts(ctx: BuildContext) -> None:
    """Assemble Tier-3 cannon equipment around the unchanged shared slime body."""
    create_cannoneer_cannon(ctx)
