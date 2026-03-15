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
  const translateY = interpolate(progress, [0, 1], [20, 0]);

  if (!segment) return null;

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

      {/* Main subtitle */}
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
        <div
          style={{
            color: "#ffffff",
            fontSize: 34,
            lineHeight: 1.65,
            fontWeight: 600,
            letterSpacing: 0.5,
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
          }}
        >
          {segment.text}
        </div>
      </div>
    </div>
  );
};
