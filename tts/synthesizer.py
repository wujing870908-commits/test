"""
Text-to-speech via Microsoft Edge TTS (free, no API key required).
Produces one MP3 per segment and a combined final MP3 with a timing manifest.

The timing manifest (timings.json) maps each segment to its start/end in ms,
so Remotion can sync text overlays to audio precisely.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import subprocess
from pathlib import Path
from typing import Any

import edge_tts

from config import EDGE_TTS_VOICE

logger = logging.getLogger(__name__)


async def _synthesize_one(text: str, out_path: Path, voice: str) -> None:
    """Async wrapper around edge_tts for a single segment."""
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(out_path))


def _get_duration_ms(audio_path: Path) -> int:
    """Use ffprobe to get audio duration in milliseconds."""
    result = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(audio_path),
        ],
        capture_output=True, text=True, check=True,
    )
    return int(float(result.stdout.strip()) * 1000)


def _concat_audio(segment_paths: list[Path], output_path: Path) -> None:
    """Concatenate MP3s using ffmpeg concat demuxer."""
    list_file = output_path.parent / "concat_list.txt"
    with open(list_file, "w") as f:
        for p in segment_paths:
            f.write(f"file '{p.resolve()}'\n")
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0",
         "-i", str(list_file), "-c", "copy", str(output_path)],
        check=True, capture_output=True,
    )
    list_file.unlink(missing_ok=True)


def synthesize_segments(
    segments: list[dict[str, Any]],
    output_dir: str | Path,
    voice: str = EDGE_TTS_VOICE,
) -> dict[str, Any]:
    """
    Converts script segments to audio and returns a timing manifest.

    Returns:
    {
      "audio_path": "output/narration.mp3",
      "total_duration_ms": 95000,
      "segments": [
        {"index": 0, "type": "intro", "text": "...",
         "start_ms": 0, "end_ms": 8200},
        ...
      ]
    }
    """
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    seg_dir = out / "segments"
    seg_dir.mkdir(exist_ok=True)

    segment_paths: list[Path] = []
    timing_segments: list[dict[str, Any]] = []
    cursor_ms = 0

    for i, seg in enumerate(segments):
        text = seg.get("text", "")
        if not text:
            continue

        seg_path = seg_dir / f"seg_{i:03d}.mp3"
        logger.info("TTS segment %d/%d: %s…", i + 1, len(segments), text[:30])
        asyncio.run(_synthesize_one(text, seg_path, voice))

        try:
            duration_ms = _get_duration_ms(seg_path)
        except Exception as exc:
            logger.warning("ffprobe failed for seg %d, estimating: %s", i, exc)
            # Rough fallback: ~4 chars/sec in Chinese TTS
            duration_ms = max(len(text) * 250, 1000)

        timing_segments.append({
            "index":      i,
            "type":       seg.get("type", "unknown"),
            "text":       text,
            "highlight":  seg.get("highlight"),
            "start_ms":   cursor_ms,
            "end_ms":     cursor_ms + duration_ms,
        })
        cursor_ms += duration_ms
        segment_paths.append(seg_path)

    # Concatenate all segments into one audio file
    audio_path = out / "narration.mp3"
    if segment_paths:
        _concat_audio(segment_paths, audio_path)
    else:
        raise RuntimeError("No audio segments were produced.")

    manifest = {
        "audio_path":        str(audio_path),
        "total_duration_ms": cursor_ms,
        "segments":          timing_segments,
    }

    # Write manifest to disk (Remotion reads this at render time)
    manifest_path = out / "timings.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    logger.info("Timings manifest → %s", manifest_path)

    return manifest


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    test_segments = [
        {"type": "intro",   "text": "大家早上好，欢迎收看今日美股日报。", "highlight": None},
        {"type": "indices", "text": "昨夜标普五百上涨零点八五个百分点，收于五千一百二十点。", "highlight": "+0.85%"},
    ]
    manifest = synthesize_segments(test_segments, "output")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
