import { useCurrentFrame, useVideoConfig } from "remotion";
import type { TimingSegment } from "../types";

/**
 * Returns the segment active at the current frame, based on the audio timing manifest.
 *
 * Fixes vs. naive implementation:
 * - Math.round() instead of raw float to avoid floating-point boundary jitter
 *   (e.g. 33.333...ms vs 33ms at 30fps could skip a segment for one frame)
 * - The last segment's end_ms is treated as open (≥ start_ms with no upper bound)
 *   so the subtitle never disappears in the final frames due to rounding
 */
export function useCurrentSegment(segments: TimingSegment[]): TimingSegment | null {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Round to nearest ms to avoid systematic floating-point bias at boundaries
  const currentMs = Math.round((frame / fps) * 1000);

  if (segments.length === 0) return null;

  // Find the matching segment; last segment stays active until video ends
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const isLast = i === segments.length - 1;
    if (currentMs >= s.start_ms && (isLast || currentMs < s.end_ms)) {
      return s;
    }
  }

  return null;
}
