from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.magic import create_archmage_kit

from .types import SlimeDefinition

DEFINITION = SlimeDefinition(
    slug="archmage",
    display_name="Archmage Slime",
    body_color=(0.13, 0.31, 0.80, 1.0),
    body_material_name="SlimeArchmageBlue",
    motion_profile="archmage",
)


def build_parts(ctx: BuildContext) -> None:
    """Assemble Tier-3 Archmage equipment onto the canonical shared slime body."""
    create_archmage_kit(ctx)
