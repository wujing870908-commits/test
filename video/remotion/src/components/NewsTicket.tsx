import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface NewsTicketProps {
  items: Array<{ title: string; source: string }>;
  /** Frame at which the news panel enters */
  startFrame?: number;
}

export const NewsTicket: React.FC<NewsTicketProps> = ({ items, startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateX = interpolate(progress, [0, 1], [60, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 120,
        right: 60,
        width: 520,
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      <div
        style={{
          color: "#00b4ff",
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 12,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        宏观焦点
      </div>
      {items.slice(0, 3).map((item, i) => (
        <div
          key={i}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "14px 18px",
            marginBottom: 10,
          }}
        >
          <div style={{ color: "#fff", fontSize: 18, lineHeight: 1.5, marginBottom: 6 }}>
            {item.title}
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>{item.source}</div>
        </div>
      ))}
    </div>
  );
};
