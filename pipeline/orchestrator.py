"""
Main pipeline orchestrator.

Steps:
  1. Fetch market snapshot (yfinance) + macro news
  2. Generate Chinese broadcast script (Claude)
  3. Synthesize speech (edge-tts) → narration.mp3 + timings.json
  4. Write Remotion props → remotion_props.json
  5. Render video with `npx remotion render`

All output lands in OUTPUT_DIR (default: ./output/<date>/).
"""
from __future__ import annotations

import json
import logging
import os
import subprocess
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

from config import OUTPUT_DIR, VIDEO_FILENAME
from fetcher import fetch_market_snapshot, fetch_macro_news
from ai import generate_script
from tts import synthesize_segments

logger = logging.getLogger(__name__)


def _dated_output_dir() -> Path:
    """Returns ./output/YYYY-MM-DD/ based on Beijing date."""
    beijing_date = datetime.now(timezone(timedelta(hours=8))).strftime("%Y-%m-%d")
    path = Path(OUTPUT_DIR) / beijing_date
    path.mkdir(parents=True, exist_ok=True)
    return path


def _write_remotion_props(
    out_dir: Path,
    snapshot: dict[str, Any],
    manifest: dict[str, Any],
    news: list[dict[str, str]],
) -> Path:
    """Dumps all data as a JSON file that Remotion reads at render time."""
    props = {
        "snapshot": snapshot,
        "manifest": manifest,
        "newsItems": [{"title": n["title"], "source": n["source"]} for n in news],
    }
    props_path = out_dir / "remotion_props.json"
    with open(props_path, "w", encoding="utf-8") as f:
        json.dump(props, f, ensure_ascii=False, indent=2)
    logger.info("Remotion props → %s", props_path)
    return props_path


def _render_video(props_path: Path, out_dir: Path) -> Path:
    """Calls `npx remotion render` with injected props."""
    video_path = out_dir / VIDEO_FILENAME
    remotion_dir = Path(__file__).parent.parent / "video" / "remotion"

    cmd = [
        "npx", "remotion", "render",
        "DailyReport",
        str(video_path),
        "--props", str(props_path.resolve()),
    ]
    logger.info("Rendering video: %s", " ".join(cmd))

    result = subprocess.run(cmd, cwd=str(remotion_dir), capture_output=False)
    if result.returncode != 0:
        raise RuntimeError(f"Remotion render failed with code {result.returncode}")

    logger.info("Video saved → %s", video_path)
    return video_path


def run_pipeline(render_video: bool = True) -> dict[str, Any]:
    """
    End-to-end pipeline. Returns a summary dict.
    Set render_video=False to skip the Remotion step (useful for CI/testing).
    """
    out_dir = _dated_output_dir()
    logger.info("=" * 60)
    logger.info("Pipeline started → %s", out_dir)

    # Step 1: Fetch data
    logger.info("[1/4] Fetching market data…")
    snapshot = fetch_market_snapshot()

    logger.info("[1/4] Fetching macro news…")
    news = fetch_macro_news()

    # Step 2: Generate script
    logger.info("[2/4] Generating broadcast script with Claude…")
    segments = generate_script(snapshot, news)
    script_path = out_dir / "script.json"
    with open(script_path, "w", encoding="utf-8") as f:
        json.dump(segments, f, ensure_ascii=False, indent=2)
    logger.info("Script saved → %s (%d segments)", script_path, len(segments))

    # Step 3: TTS
    logger.info("[3/4] Synthesizing speech…")
    manifest = synthesize_segments(segments, out_dir)

    # Step 4: Write props + render
    props_path = _write_remotion_props(out_dir, snapshot, manifest, news)

    video_path = None
    if render_video:
        logger.info("[4/4] Rendering video with Remotion…")
        try:
            video_path = _render_video(props_path, out_dir)
        except Exception as exc:
            logger.error("Video render failed: %s", exc)

    return {
        "output_dir":  str(out_dir),
        "script_path": str(script_path),
        "audio_path":  manifest["audio_path"],
        "video_path":  str(video_path) if video_path else None,
        "segments":    len(segments),
        "duration_ms": manifest["total_duration_ms"],
    }


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    no_video = "--no-video" in sys.argv
    result = run_pipeline(render_video=not no_video)
    print(json.dumps(result, ensure_ascii=False, indent=2))
