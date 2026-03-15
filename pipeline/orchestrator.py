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
import shutil
import subprocess
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

from config import OUTPUT_DIR
from fetcher import fetch_market_snapshot, fetch_macro_news
from ai import generate_script, translate_news, generate_report
from tts import synthesize_segments

logger = logging.getLogger(__name__)


def _dated_output_dir() -> tuple[Path, str]:
    """Returns (~/jobs/海外日报/YYYY-MM-DD/, date_str) based on Beijing date."""
    beijing_date = datetime.now(timezone(timedelta(hours=8))).strftime("%Y-%m-%d")
    path = Path(OUTPUT_DIR) / beijing_date
    path.mkdir(parents=True, exist_ok=True)
    return path, beijing_date


def _write_remotion_props(
    out_dir: Path,
    snapshot: dict[str, Any],
    manifest: dict[str, Any],
    news: list[dict[str, str]],
) -> Path:
    """Dumps all data as a JSON file that Remotion reads at render time."""
    # audio_path in the manifest is a local path; Remotion reads it via staticFile("narration.mp3")
    remotion_manifest = {**manifest, "audio_path": "narration.mp3"}
    props = {
        "snapshot": snapshot,
        "manifest": remotion_manifest,
        "newsItems": [{"title": n["title"], "source": n["source"]} for n in news],
    }
    props_path = out_dir / "remotion_props.json"
    with open(props_path, "w", encoding="utf-8") as f:
        json.dump(props, f, ensure_ascii=False, indent=2)
    logger.info("Remotion props → %s", props_path)
    return props_path


def _render_video(props_path: Path, out_dir: Path, audio_path: str, date_str: str) -> Path:
    """Calls `npx remotion render` with injected props."""
    video_filename = f"daily_report_video_v2_{date_str}.mp4"
    video_path = out_dir / video_filename
    remotion_dir = Path(__file__).parent.parent / "video" / "remotion"

    # Copy audio into Remotion's public/ dir so it can be served via staticFile()
    public_dir = remotion_dir / "public"
    public_dir.mkdir(exist_ok=True)
    dest_audio = public_dir / "narration.mp3"
    shutil.copy2(audio_path, dest_audio)

    cmd = [
        "npx", "remotion", "render",
        "DailyReport",
        str(video_path.resolve()),
        "--props",          str(props_path.resolve()),
        # Douyin/TikTok compatible encoding
        "--codec=h264",          # H.264, widely supported
        "--crf=18",              # High quality (0-51, lower = better)
        "--pixel-format=yuv420p",# Required for broad device compatibility
    ]
    logger.info("Rendering video: %s", " ".join(cmd))

    result = subprocess.run(cmd, cwd=str(remotion_dir), capture_output=False)
    if result.returncode != 0:
        raise RuntimeError(f"Remotion render failed with code {result.returncode}")

    logger.info("Video saved → %s", video_path)

    # Also save a copy as "latest.mp4" at the top-level output dir for easy access
    latest_path = video_path.parent.parent / "latest.mp4"
    shutil.copy2(video_path, latest_path)
    logger.info("Latest copy → %s", latest_path)

    return video_path


def run_pipeline(render_video: bool = True) -> dict[str, Any]:
    """
    End-to-end pipeline. Returns a summary dict.
    Set render_video=False to skip the Remotion step (useful for CI/testing).
    """
    out_dir, date_str = _dated_output_dir()
    logger.info("=" * 60)
    logger.info("Pipeline started → %s", out_dir)

    # Step 1: Fetch data
    logger.info("[1/5] Fetching market data…")
    snapshot = fetch_market_snapshot()

    logger.info("[1/5] Fetching macro news…")
    news = fetch_macro_news()

    logger.info("[1/5] Translating news titles to Chinese…")
    news = translate_news(news)

    # Step 2: Generate markdown report
    logger.info("[2/5] Generating daily report (report_zh.md)…")
    report_md = generate_report(snapshot, news)
    report_path = out_dir / "report_zh.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_md)
    logger.info("Report saved → %s", report_path)

    # Step 3: Generate broadcast script
    logger.info("[3/5] Generating broadcast script…")
    segments = generate_script(snapshot, news)
    script_path = out_dir / "script.json"
    with open(script_path, "w", encoding="utf-8") as f:
        json.dump(segments, f, ensure_ascii=False, indent=2)
    logger.info("Script saved → %s (%d segments)", script_path, len(segments))

    # Step 4: TTS
    logger.info("[4/5] Synthesizing speech…")
    manifest = synthesize_segments(segments, out_dir)

    # Step 5: Write props + render
    props_path = _write_remotion_props(out_dir, snapshot, manifest, news)

    video_path = None
    if render_video:
        logger.info("[5/5] Rendering video with Remotion…")
        try:
            video_path = _render_video(props_path, out_dir, manifest["audio_path"], date_str)
        except Exception as exc:
            logger.error("Video render failed: %s", exc)

    return {
        "output_dir":   str(out_dir),
        "report_path":  str(report_path),
        "script_path":  str(script_path),
        "audio_path":   manifest["audio_path"],
        "video_path":   str(video_path) if video_path else None,
        "segments":     len(segments),
        "duration_ms":  manifest["total_duration_ms"],
    }


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    no_video = "--no-video" in sys.argv
    result = run_pipeline(render_video=not no_video)
    print(json.dumps(result, ensure_ascii=False, indent=2))
