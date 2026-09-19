from __future__ import annotations

from dataclasses import dataclass
import importlib
from typing import Callable

from mathutils import Vector

COMMON_REQUIRED_NODES = (
    "EnemyRoot",
    "BodyRoot",
    "FaceRoot",
    "Eye_L",
    "Eye_R",
    "AttackOrigin",
    "EffectOrigin",
    "GroundOrigin",
)


@dataclass(frozen=True)
class ParentRule:
    child: str
    parent: str


@dataclass(frozen=True)
class RelativeSizeRule:
    node: str
    node_axis: str
    min_ratio: float
    max_ratio: float | None = None
    character_axis: str | None = None


@dataclass(frozen=True)
class EnemyValidationProfile:
    required_nodes: tuple[str, ...] = COMMON_REQUIRED_NODES
    silhouette_rule: Callable[[Vector], bool] | None = None
    description: str = "common enemy"
    min_meshes: int = 1
    max_meshes: int | None = None
    parent_rules: tuple[ParentRule, ...] = ()
    relative_size_rules: tuple[RelativeSizeRule, ...] = ()
    forbidden_nodes: tuple[str, ...] = ()
    forbidden_prefixes: tuple[str, ...] = ()


LEGACY_MUSHROOM_PROFILES: dict[str, EnemyValidationProfile] = {
    "tiny-mushroom": EnemyValidationProfile(
        required_nodes=COMMON_REQUIRED_NODES + ("Stem", "Cap", "Mouth"),
        silhouette_rule=lambda size: 0.95 <= size.x / size.z <= 1.25,
        description="compact button/bean mushroom",
    ),
    "plump-mushroom": EnemyValidationProfile(
        required_nodes=COMMON_REQUIRED_NODES + ("Stem", "Cap", "Mouth"),
        silhouette_rule=lambda size: size.x / size.z >= 1.18,
        description="wide dumpling mushroom",
    ),
    "spore-mushroom": EnemyValidationProfile(
        required_nodes=COMMON_REQUIRED_NODES + ("Stem", "Cap", "Mouth"),
        silhouette_rule=lambda size: size.z / size.x >= 1.02,
        description="tall lantern mushroom",
    ),
    "great-mushroom": EnemyValidationProfile(
        required_nodes=COMMON_REQUIRED_NODES + ("Stem", "Cap", "Mouth"),
        silhouette_rule=lambda size: size.x / size.z >= 1.24 and size.x >= 1.8,
        description="broad layered boss mushroom",
    ),
}


def validation_profile_for_slug(slug: str) -> EnemyValidationProfile:
    """Resolve validation beside the definition so each character owns its gates."""
    try:
        module = importlib.import_module(f"enemies.definitions.{slug.replace('-', '_')}")
    except ModuleNotFoundError:
        module = None
    if module is not None:
        profile = getattr(module, "VALIDATION_PROFILE", None)
        if isinstance(profile, EnemyValidationProfile):
            return profile
    return LEGACY_MUSHROOM_PROFILES.get(slug, EnemyValidationProfile())
