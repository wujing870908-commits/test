import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { AssetData } from "../types";

interface StockCardProps {
  name: string;
  data: AssetData;
  delay?: number;   // stagger entrance delay in frames
}

export const StockCard: React.FC<StockCardProps> = ({ name, data, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [24, 0]);

  const isUp = (data.change_pct ?? 0) >= 0;
  const color = isUp ? "#00e676" : "#ff1744";
  const arrow = isUp ? "▲" : "▼";
  const sign = isUp ? "+" : "";

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${color}33`,
        borderRadius: 12,
        padding: "18px 24px",
        minWidth: 200,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow accent */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />
      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, marginBottom: 8 }}>
        {name}
      </div>
      <div style={{ color: "#fff", fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
        {data.price != null ? data.price.toLocaleString() : "--"}
      </div>
      <div style={{ color, fontSize: 20, fontWeight: 600 }}>
        {arrow} {sign}{data.change_pct != null ? data.change_pct.toFixed(2) : "--"}%
      </div>
    </div>
  );
};
