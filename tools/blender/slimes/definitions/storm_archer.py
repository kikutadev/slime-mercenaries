from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.ranged import create_storm_archer_bow, create_storm_feather_crest

from .types import SlimeDefinition


DEFINITION = SlimeDefinition(
    slug="storm-archer",
    display_name="Storm Archer Slime",
    body_color=(0.055, 0.56, 0.72, 1.0),
    body_material_name="SlimeStormBlue",
    motion_profile="storm-archer",
)


def build_parts(ctx: BuildContext) -> None:
    create_storm_feather_crest(ctx)
    create_storm_archer_bow(ctx)
