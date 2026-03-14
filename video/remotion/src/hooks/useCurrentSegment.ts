import { useCurrentFrame, useVideoConfig } from "remotion";
import type { TimingSegment } from "../types";

/**
 * Returns the segment that is active at the current frame,
 * based on the audio timing manifest.
 */
export function useCurrentSegment(segments: TimingSegment[]): TimingSegment | null {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentMs = (frame / fps) * 1000;

  return (
    segments.find((s) => currentMs >= s.start_ms && currentMs < s.end_ms) ?? null
  );
}
