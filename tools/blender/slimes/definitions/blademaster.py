from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.melee import create_blademaster_scarf, create_blademaster_sword

from .types import SlimeDefinition


DEFINITION = SlimeDefinition(
    slug="blademaster",
    display_name="Blademaster Slime",
    # Tier progression must not enlarge the canonical Sword-branch body.
    body_color=(0.045, 0.48, 0.96, 1.0),
    body_material_name="SlimeBlue",
    motion_profile="blademaster",
)


def build_parts(ctx: BuildContext) -> None:
    """Assemble the long light blade and scarf onto the canonical Base Slime."""
    create_blademaster_scarf(ctx)
    create_blademaster_sword(ctx)
