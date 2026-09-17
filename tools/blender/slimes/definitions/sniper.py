from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.ranged import create_sniper_longbow, create_sniper_quiver

from .types import SlimeDefinition


DEFINITION = SlimeDefinition(
    slug="sniper",
    display_name="Sniper Slime",
    # Preserve the canonical Bow-branch body. Tier-3 identity is equipment-only.
    body_color=(0.045, 0.49, 0.80, 1.0),
    body_material_name="SlimeSniperBlue",
    motion_profile="sniper",
)


def build_parts(ctx: BuildContext) -> None:
    create_sniper_longbow(ctx)
    create_sniper_quiver(ctx)
