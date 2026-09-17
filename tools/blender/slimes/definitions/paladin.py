from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.defense import create_paladin_aegis, create_paladin_halo_crest

from .types import SlimeDefinition


DEFINITION = SlimeDefinition(
    slug="paladin",
    display_name="Paladin Slime",
    # Tier-3 Shield branch keeps the canonical body scale; identity is equipment-only.
    body_color=(0.08, 0.58, 0.90, 1.0),
    body_material_name="SlimeBlue",
    motion_profile="paladin",
)


def build_parts(ctx: BuildContext) -> None:
    """Assemble the sustain-tank silhouette without changing the shared slime body."""
    create_paladin_halo_crest(ctx)
    create_paladin_aegis(ctx)
