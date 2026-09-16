"""Backward-compatible Blender entrypoint for modular slime assembly.

New production work lives under `tools/blender/slimes/`. Existing npm scripts
continue to call this wrapper so accepted Sword / Greatsword / Bow workflows do
not break while the part library expands.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

TOOLS_DIR = Path(__file__).resolve().parent
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

from slimes.build import build  # noqa: E402


VARIANT_TO_SLUG = {
    "plain": "plain",
    "sword": "sword",
    "greatsword": "greatsword",
    "archer": "bow",
    "bow": "bow",
    "shield": "shield",
    "wand": "wand",
    "dagger": "dagger",
    "gun": "gun",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--variant", choices=tuple(VARIANT_TO_SLUG), default="sword")
    argv: list[str] = []
    if "--" in sys.argv:
        argv = sys.argv[sys.argv.index("--") + 1 :]
    return parser.parse_args(argv)


def main() -> None:
    args = parse_args()
    build(VARIANT_TO_SLUG[args.variant], Path(args.output))


if __name__ == "__main__":
    main()
