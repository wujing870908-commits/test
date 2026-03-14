import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { TimingSegment } from "../types";

interface SubtitleBarProps {
  segment: TimingSegment | null;
}

export const SubtitleBar: React.FC<SubtitleBarProps> = ({ segment }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame, fps, config: { damping: 18, stiffness: 160 } });
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  if (!segment) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 60,
        right: 60,
        opacity,
      }}
    >
      {/* Highlight chip */}
      {segment.highlight && (
        <div
          style={{
            display: "inline-block",
            background: "rgba(0,180,255,0.15)",
            border: "1px solid rgba(0,180,255,0.4)",
            borderRadius: 6,
            padding: "2px 14px",
            color: "#00b4ff",
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          {segment.highlight}
        </div>
      )}

      {/* Main subtitle text */}
      <div
        style={{
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(8px)",
          borderLeft: "4px solid #00b4ff",
          borderRadius: "0 8px 8px 0",
          padding: "14px 24px",
          color: "#fff",
          fontSize: 30,
          lineHeight: 1.6,
          fontWeight: 500,
        }}
      >
        {segment.text}
      </div>
    </div>
  );
};
