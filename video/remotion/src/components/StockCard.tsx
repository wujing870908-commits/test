import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { AssetData } from "../types";

interface StockCardProps {
  name: string;
  data: AssetData;
  delay?: number;
  compact?: boolean;
}

export const StockCard: React.FC<StockCardProps> = ({ name, data, delay = 0, compact = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 16, stiffness: 130 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateX = interpolate(progress, [0, 1], [-16, 0]);

  const isUp = (data.change_pct ?? 0) >= 0;
  const color = isUp ? "#16a34a" : "#dc2626";
  const badgeBg = isUp ? "#dcfce7" : "#fee2e2";
  const sign = isUp ? "+" : "";
  const arrow = isUp ? "▲" : "▼";

  const rowPad = compact ? 14 : 20;
  const nameSz = compact ? 24 : 28;
  const priceSz = compact ? 26 : 32;
  const changeSz = compact ? 18 : 22;
  const arrowSz = compact ? 14 : 16;

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${translateX}px)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: rowPad,
        paddingBottom: rowPad,
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      {/* Left: name */}
      <div style={{ color: "#1e293b", fontSize: nameSz, fontWeight: 700 }}>
        {name}
      </div>

      {/* Right: price + change badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ color: "#1e293b", fontSize: priceSz, fontWeight: 800 }}>
          {data.price != null ? data.price.toLocaleString() : "--"}
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: badgeBg,
            color,
            fontSize: changeSz,
            fontWeight: 700,
            padding: "4px 14px",
            borderRadius: 6,
            minWidth: 110,
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: arrowSz }}>{arrow}</span>
          <span>
            {sign}{data.change_pct != null ? data.change_pct.toFixed(2) : "--"}%
          </span>
        </div>
      </div>
    </div>
  );
};
