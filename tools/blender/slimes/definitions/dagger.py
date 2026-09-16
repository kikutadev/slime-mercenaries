from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.rogue import create_rogue_dagger, create_small_hood

from .types import SlimeDefinition

DEFINITION = SlimeDefinition(
    slug="dagger",
    display_name="Dagger Slime",
    body_color=(0.045, 0.20, 0.62, 1.0),
    body_material_name="SlimeIndigo",
    eye_spacing=0.235,
    motion_profile="dagger",
)


def build_parts(ctx: BuildContext) -> None:
    """Assemble the Tier-1 rogue vocabulary on the canonical Base Slime."""
    create_rogue_dagger(ctx)
    create_small_hood(ctx)
