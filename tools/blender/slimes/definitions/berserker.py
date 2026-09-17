from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.melee import create_berserker_greatsword, create_berserker_head_accents

from .types import SlimeDefinition


DEFINITION = SlimeDefinition(
    slug="berserker",
    display_name="Berserker Slime",
    # Tier progression must not enlarge the canonical Sword-branch body.
    body_color=(0.045, 0.48, 0.96, 1.0),
    body_material_name="SlimeBlue",
    motion_profile="berserker",
)


def build_parts(ctx: BuildContext) -> None:
    """Assemble the chipped heavy blade and wild head accents onto the shared body."""
    create_berserker_head_accents(ctx)
    create_berserker_greatsword(ctx)
