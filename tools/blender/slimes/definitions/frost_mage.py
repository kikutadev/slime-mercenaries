from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.magic import create_frost_mage_kit

from .types import SlimeDefinition

DEFINITION = SlimeDefinition(
    slug="frost_mage",
    display_name="Frost Mage Slime",
    body_color=(0.16, 0.48, 0.76, 1.0),
    body_material_name="SlimeFrostCyan",
    body_roughness=0.20,
    motion_profile="frost_mage",
)


def build_parts(ctx: BuildContext) -> None:
    """Assemble Tier-3 Frost Mage equipment onto the canonical shared slime body."""
    create_frost_mage_kit(ctx)
