import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { TimingSegment } from "../types";

interface SubtitleBarProps {
  segment: TimingSegment | null;
}

// Max Chinese characters per subtitle line (based on available width ≈ 864px at fontSize 34)
const CHARS_PER_LINE = 24;

/** Split text into lines of at most CHARS_PER_LINE characters. */
function splitLines(text: string): string[] {
  const lines: string[] = [];
  let i = 0;
  while (i < text.length) {
    lines.push(text.slice(i, i + CHARS_PER_LINE));
    i += CHARS_PER_LINE;
  }
  return lines;
}

export const SubtitleBar: React.FC<SubtitleBarProps> = ({ segment }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame, fps, config: { damping: 18, stiffness: 160 } });
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [20, 0]);

  if (!segment) return null;

  // Calculate which 2 lines to show based on playback position within this segment
  const lines = splitLines(segment.text);
  const currentMs = Math.round((frame / fps) * 1000);
  const segDuration = segment.end_ms - segment.start_ms;
  const elapsed = Math.max(0, currentMs - segment.start_ms);
  const readProgress = segDuration > 0 ? Math.min(1, elapsed / segDuration) : 0;

  // Current character index being spoken
  const charPos = Math.floor(readProgress * segment.text.length);
  const currentLineIdx = Math.floor(charPos / CHARS_PER_LINE);
  // Snap the window: show currentLine and the next one (max 2 lines)
  const windowStart = Math.max(0, Math.min(currentLineIdx, lines.length - 2));
  const visibleLines = lines.slice(windowStart, windowStart + 2);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 290,   // Douyin UI covers bottom ~250px (caption + username area)
        left: 40,
        right: 120,    // Douyin action buttons occupy right ~100px
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {/* Highlight chip */}
      {segment.highlight && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "rgba(0,180,255,0.18)",
            border: "1px solid rgba(0,180,255,0.5)",
            borderRadius: 8,
            padding: "4px 18px",
            color: "#00d4ff",
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 12,
            letterSpacing: 1,
            textShadow: "0 0 12px rgba(0,212,255,0.6)",
          }}
        >
          {segment.highlight}
        </div>
      )}

      {/* Main subtitle — max 2 lines, advances with audio */}
      <div
        style={{
          background: "rgba(4, 12, 28, 0.88)",
          backdropFilter: "blur(12px)",
          borderLeft: "5px solid #00b4ff",
          borderRadius: "0 12px 12px 0",
          padding: "18px 28px",
          boxShadow: "0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {visibleLines.map((line, i) => (
          <div
            key={`${windowStart}-${i}`}
            style={{
              color: "#ffffff",
              fontSize: 34,
              lineHeight: 1.65,
              fontWeight: 600,
              letterSpacing: 0.5,
              textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};
