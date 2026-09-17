from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.rogue import create_ninja_scarf_and_plate, create_ninja_shuriken

from .types import SlimeDefinition


DEFINITION = SlimeDefinition(
    slug="ninja",
    display_name="Ninja Slime",
    # Keep the canonical body scale; Tier 3 identity comes from shuriken + scarf vocabulary.
    body_color=(0.038, 0.17, 0.55, 1.0),
    body_material_name="SlimeNinjaIndigo",
    eye_spacing=0.235,
    motion_profile="ninja",
)


def build_parts(ctx: BuildContext) -> None:
    """Assemble Ninja's non-humanoid throwing-star, scarf-tail and forehead-plate silhouette."""
    create_ninja_shuriken(ctx)
    create_ninja_scarf_and_plate(ctx)
