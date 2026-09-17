from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.melee import create_fighter_headband, create_fighter_sword

from .types import SlimeDefinition


DEFINITION = SlimeDefinition(
    slug="fighter",
    display_name="Fighter Slime",
    # Keep the Sword-branch body invariant; Tier-2 identity comes from silhouette and warm-red accents.
    body_color=(0.045, 0.48, 0.96, 1.0),
    body_material_name="SlimeBlue",
    motion_profile="fighter",
)


def build_parts(ctx: BuildContext) -> None:
    """Assemble Fighter-specific equipment onto the canonical Base Slime."""
    create_fighter_headband(ctx)
    create_fighter_sword(ctx)
