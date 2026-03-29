import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { TimingSegment } from "../types";

interface SubtitleBarProps {
  segment: TimingSegment | null;
}

// Max Chinese characters per subtitle line (based on available width ≈ 864px at fontSize 30)
const CHARS_PER_LINE = 26;

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

  const lines = splitLines(segment.text);
  const currentMs = Math.round((frame / fps) * 1000);
  const segDuration = segment.end_ms - segment.start_ms;
  const elapsed = Math.max(0, currentMs - segment.start_ms);
  const readProgress = segDuration > 0 ? Math.min(1, elapsed / segDuration) : 0;

  const charPos = Math.floor(readProgress * segment.text.length);
  const currentLineIdx = Math.floor(charPos / CHARS_PER_LINE);
  const windowStart = Math.max(0, Math.min(currentLineIdx, lines.length - 2));
  const visibleLines = lines.slice(windowStart, windowStart + 2);

  return (
    <div
      style={{
        position: "absolute",
        top: 1720,           // Caption zone: 1720–1860px
        left: 40,
        right: 120,
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
            background: "#1e40af",
            borderRadius: 8,
            padding: "4px 18px",
            color: "#ffffff",
            fontSize: 22,
            fontWeight: 800,
            marginBottom: 12,
            letterSpacing: 1,
          }}
        >
          {segment.highlight}
        </div>
      )}

      {/* Main subtitle box */}
      <div
        style={{
          background: "rgba(15, 23, 42, 0.90)",
          backdropFilter: "blur(8px)",
          borderLeft: "5px solid #0ea5e9",
          borderRadius: "0 12px 12px 0",
          padding: "16px 24px",
        }}
      >
        {visibleLines.map((line, i) => (
          <div
            key={`${windowStart}-${i}`}
            style={{
              color: "#f1f5f9",
              fontSize: 30,
              lineHeight: 1.65,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};
