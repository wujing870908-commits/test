"""
Text-to-speech via Microsoft Edge TTS (free, no API key required).

Audio pipeline for timing accuracy:
  1. TTS → per-segment .mp3
  2. Convert each .mp3 → .wav  (PCM, sample-accurate)
  3. Measure WAV duration via ffprobe  (avoids MP3 frame-boundary drift)
  4. Concatenate WAVs → _concat.wav  (sample-accurate join)
  5. Encode _concat.wav → narration.mp3  (CBR 128k, single encode pass)

This eliminates the cumulative timing error that occurs when summing
durations of individually-measured MP3 files concatenated with -c copy.
"""
from __future__ import annotations

import asyncio
import json
import logging
import subprocess
from pathlib import Path
from typing import Any

import edge_tts

from config import EDGE_TTS_VOICE, EDGE_TTS_RATE

logger = logging.getLogger(__name__)

# WAV encoding params used throughout (must be consistent)
_WAV_RATE = "24000"
_WAV_CH   = "1"


async def _synthesize_one(text: str, out_path: Path, voice: str, rate: str) -> None:
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(str(out_path))


def _to_wav(src: Path, dst: Path) -> None:
    """Convert any audio file to PCM WAV (mono, 24 kHz)."""
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(src),
         "-ar", _WAV_RATE, "-ac", _WAV_CH, "-f", "wav", str(dst)],
        check=True, capture_output=True,
    )


def _get_duration_ms(audio_path: Path) -> int:
    """Sample-accurate duration in milliseconds (works best on WAV)."""
    result = subprocess.run(
        ["ffprobe", "-v", "error",
         "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1",
         str(audio_path)],
        capture_output=True, text=True, check=True,
    )
    # Round to nearest ms instead of truncating to avoid systematic bias
    return round(float(result.stdout.strip()) * 1000)


def _concat_wavs(wav_paths: list[Path], output_wav: Path) -> None:
    """Concatenate WAV files using ffmpeg concat filter (sample-accurate)."""
    list_file = output_wav.parent / "_concat_list.txt"
    with open(list_file, "w") as f:
        for p in wav_paths:
            f.write(f"file '{p.resolve()}'\n")
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0",
         "-i", str(list_file),
         "-ar", _WAV_RATE, "-ac", _WAV_CH,
         str(output_wav)],
        check=True, capture_output=True,
    )
    list_file.unlink(missing_ok=True)


def _wav_to_mp3(wav_path: Path, mp3_path: Path) -> None:
    """Encode WAV → MP3 CBR 128k (single pass, consistent encoder delay)."""
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(wav_path),
         "-codec:a", "libmp3lame", "-b:a", "128k",
         "-ar", _WAV_RATE, "-ac", _WAV_CH,
         str(mp3_path)],
        check=True, capture_output=True,
    )


def synthesize_segments(
    segments: list[dict[str, Any]],
    output_dir: str | Path,
    voice: str = EDGE_TTS_VOICE,
    rate: str = EDGE_TTS_RATE,
) -> dict[str, Any]:
    """
    Converts script segments to audio and returns a precise timing manifest.

    Returns:
    {
      "audio_path": "/path/to/narration.mp3",
      "total_duration_ms": 95000,
      "segments": [
        {"index": 0, "type": "intro", "text": "...",
         "highlight": null, "start_ms": 0, "end_ms": 8200},
        ...
      ]
    }
    """
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    seg_dir = out / "segments"
    seg_dir.mkdir(exist_ok=True)

    wav_paths: list[Path] = []
    timing_segments: list[dict[str, Any]] = []
    cursor_ms = 0

    for i, seg in enumerate(segments):
        text = seg.get("text", "")
        if not text:
            continue

        mp3_path = seg_dir / f"seg_{i:03d}.mp3"
        wav_path = seg_dir / f"seg_{i:03d}.wav"

        logger.info("TTS segment %d/%d: %s…", i + 1, len(segments), text[:40])
        asyncio.run(_synthesize_one(text, mp3_path, voice, rate))

        # Convert to WAV for sample-accurate duration measurement
        try:
            _to_wav(mp3_path, wav_path)
            duration_ms = _get_duration_ms(wav_path)
        except Exception as exc:
            logger.warning("WAV conversion failed for seg %d, estimating: %s", i, exc)
            duration_ms = max(len(text) * 180, 1000)  # ~180ms/char at +40% rate

        timing_segments.append({
            "index":     i,
            "type":      seg.get("type", "unknown"),
            "text":      text,
            "highlight": seg.get("highlight"),
            "start_ms":  cursor_ms,
            "end_ms":    cursor_ms + duration_ms,
        })
        cursor_ms += duration_ms
        wav_paths.append(wav_path)

    if not wav_paths:
        raise RuntimeError("No audio segments were produced.")

    # Concatenate WAVs (sample-accurate) → encode to MP3 (single pass)
    concat_wav = out / "_concat.wav"
    audio_path = out / "narration.mp3"
    _concat_wavs(wav_paths, concat_wav)
    _wav_to_mp3(concat_wav, audio_path)
    concat_wav.unlink(missing_ok=True)

    # Verify total duration of final MP3 matches our manifest
    try:
        actual_ms = _get_duration_ms(audio_path)
        drift_ms  = abs(actual_ms - cursor_ms)
        if drift_ms > 200:
            logger.warning(
                "Audio duration mismatch: manifest=%dms, actual=%dms (drift=%dms)",
                cursor_ms, actual_ms, drift_ms,
            )
        else:
            logger.info(
                "Audio duration verified: manifest=%dms, actual=%dms (drift=%dms ✓)",
                cursor_ms, actual_ms, drift_ms,
            )
    except Exception as exc:
        logger.warning("Could not verify final audio duration: %s", exc)

    manifest = {
        "audio_path":        str(audio_path),
        "total_duration_ms": cursor_ms,
        "segments":          timing_segments,
    }

    manifest_path = out / "timings.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    logger.info("Timings manifest → %s", manifest_path)

    return manifest
