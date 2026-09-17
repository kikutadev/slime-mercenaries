from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.magic import create_mage_kit

from .types import SlimeDefinition

DEFINITION = SlimeDefinition(
    slug="mage",
    display_name="Mage Slime",
    body_color=(0.16, 0.38, 0.88, 1.0),
    body_material_name="SlimeMageBlue",
    motion_profile="mage",
)


def build_parts(ctx: BuildContext) -> None:
    """Assemble Mage-specific equipment onto the canonical shared slime body."""
    create_mage_kit(ctx)
