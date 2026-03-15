import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { AssetData } from "../types";

interface StockCardProps {
  name: string;
  data: AssetData;
  delay?: number;
}

export const StockCard: React.FC<StockCardProps> = ({ name, data, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 16, stiffness: 130 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [16, 0]);

  const isUp = (data.change_pct ?? 0) >= 0;
  const color = isUp ? "#00e676" : "#ff4060";
  const arrow = isUp ? "▲" : "▼";
  const sign = isUp ? "+" : "";

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        border: `1px solid ${color}40`,
        borderRadius: 16,
        padding: "22px 26px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent glow bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, transparent 0%, ${color} 40%, ${color} 60%, transparent 100%)`,
          opacity: 0.9,
        }}
      />
      {/* Corner glow */}
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        }}
      />

      {/* Name */}
      <div
        style={{
          color: "rgba(255,255,255,0.65)",
          fontSize: 20,
          fontWeight: 500,
          letterSpacing: 1,
          marginBottom: 10,
        }}
      >
        {name}
      </div>

      {/* Price */}
      <div
        style={{
          color: "#ffffff",
          fontSize: 38,
          fontWeight: 900,
          letterSpacing: -0.5,
          lineHeight: 1,
          marginBottom: 8,
          textShadow: "0 0 30px rgba(255,255,255,0.15)",
        }}
      >
        {data.price != null ? data.price.toLocaleString() : "--"}
      </div>

      {/* Change */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          color,
          fontSize: 24,
          fontWeight: 700,
          textShadow: `0 0 16px ${color}80`,
        }}
      >
        <span style={{ fontSize: 18 }}>{arrow}</span>
        <span>
          {sign}{data.change_pct != null ? data.change_pct.toFixed(2) : "--"}%
        </span>
      </div>
    </div>
  );
};
