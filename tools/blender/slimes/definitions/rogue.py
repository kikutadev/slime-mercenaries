from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.rogue import (
    create_rogue_dagger,
    create_rogue_offhand_dagger,
    create_rogue_tier2_hood_accents,
    create_small_hood,
)

from .types import SlimeDefinition

DEFINITION = SlimeDefinition(
    slug="rogue",
    display_name="Rogue Slime",
    body_color=(0.045, 0.20, 0.62, 1.0),
    body_material_name="SlimeIndigo",
    eye_spacing=0.235,
    motion_profile="rogue",
)


def build_parts(ctx: BuildContext) -> None:
    """Assemble Rogue Tier 2 by extending, not replacing, the accepted Dagger vocabulary."""
    create_rogue_dagger(ctx)
    create_small_hood(ctx)
    create_rogue_offhand_dagger(ctx)
    create_rogue_tier2_hood_accents(ctx)
