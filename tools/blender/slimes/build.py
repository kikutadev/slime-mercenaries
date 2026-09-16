"""Assemble one slime form from the canonical Base Slime and reusable parts."""

from __future__ import annotations

import argparse
import importlib
from pathlib import Path
import sys

# Blender does not guarantee that tools/blender is importable when this script is
# invoked by path, so add it explicitly before importing the `slimes` package.
BLENDER_TOOLS_DIR = Path(__file__).resolve().parents[1]
if str(BLENDER_TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(BLENDER_TOOLS_DIR))

from slimes.base.body import create_body  # noqa: E402
from slimes.base.character import clear_scene, create_face, create_root, create_sockets, export_glb  # noqa: E402
from slimes.base.context import BuildContext  # noqa: E402
from slimes.base.materials import make_material  # noqa: E402
from slimes.definitions.types import SlimeDefinition  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--slug", required=True, help="Definition module slug, e.g. sword or greatsword")
    parser.add_argument("--output", required=True, help="Destination .glb path")
    argv: list[str] = []
    if "--" in sys.argv:
        argv = sys.argv[sys.argv.index("--") + 1 :]
    return parser.parse_args(argv)


def load_definition(slug: str):
    """Load one independent composition module without a central registry edit."""
    module_name = slug.replace("-", "_")
    try:
        module = importlib.import_module(f"slimes.definitions.{module_name}")
    except ModuleNotFoundError as exc:
        raise SystemExit(f"Unknown slime definition: {slug}") from exc
    definition = getattr(module, "DEFINITION", None)
    if not isinstance(definition, SlimeDefinition):
        raise SystemExit(f"Definition module {module.__name__} does not expose SlimeDefinition as DEFINITION")
    build_parts = getattr(module, "build_parts", None)
    if build_parts is None:
        build_parts = lambda _ctx: None
    return definition, build_parts


def build(slug: str, output_path: Path) -> None:
    definition, build_parts = load_definition(slug)
    clear_scene()

    root = create_root()
    sockets = create_sockets(root)
    body_material = make_material(
        definition.body_material_name,
        definition.body_color,
        roughness=definition.body_roughness,
    )
    eye_material = make_material("SlimeEyeBlack", (0.003, 0.005, 0.008, 1.0), roughness=1.0, coat_weight=0.0)

    create_body(root, body_material, scale=definition.body_scale)
    create_face(
        root,
        eye_material,
        eye_spacing=definition.eye_spacing,
        eye_scale=definition.eye_scale,
        eye_height=definition.eye_height,
        face_offset_y=definition.face_offset_y,
    )
    context = BuildContext(root=root, sockets=sockets)
    context.materials[definition.body_material_name] = body_material
    context.materials["SlimeEyeBlack"] = eye_material
    build_parts(context)
    export_glb(output_path.expanduser().resolve())


def main() -> None:
    args = parse_args()
    build(args.slug, Path(args.output))


if __name__ == "__main__":
    main()
