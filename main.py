#!/usr/bin/env python3
"""
Entrypoint for one-shot pipeline execution.

Usage:
  python main.py              # full pipeline (fetch + script + TTS + render)
  python main.py --no-video   # skip Remotion render (faster, for testing)
"""
import logging
import sys

from pipeline import run_pipeline

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    no_video = "--no-video" in sys.argv
    result = run_pipeline(render_video=not no_video)
    print("\n=== Pipeline Result ===")
    for k, v in result.items():
        print(f"  {k}: {v}")
