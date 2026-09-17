from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.rogue import create_assassin_blades, create_assassin_mask

from .types import SlimeDefinition


DEFINITION = SlimeDefinition(
    slug="assassin",
    display_name="Assassin Slime",
    # Quieter than Ninja: darker jelly, narrow face wrap and two compact curved blades.
    body_color=(0.032, 0.13, 0.43, 1.0),
    body_material_name="SlimeAssassinIndigo",
    eye_spacing=0.235,
    motion_profile="assassin",
)


def build_parts(ctx: BuildContext) -> None:
    """Assemble Assassin's narrow mask and physically tipped curved execution blades."""
    create_assassin_mask(ctx)
    create_assassin_blades(ctx)
