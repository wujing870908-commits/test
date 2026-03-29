import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface NewsTicketProps {
  items: Array<{ title: string; source: string }>;
  startFrame?: number;
}

export const NewsTicket: React.FC<NewsTicketProps> = ({ items, startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        position: "absolute",
        top: 120,
        bottom: 530,
        left: 40,
        right: 120,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: 20,
      }}
    >
      {/* Section header */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "#e3f2fd",
            color: "#1565c0",
            fontSize: 20,
            fontWeight: 700,
            padding: "8px 20px",
            borderRadius: 30,
            marginBottom: 20,
            letterSpacing: 1,
          }}
        >
          Macro Focus
        </div>
        <div style={{
          color: "#0f172a",
          fontSize: 60,
          fontWeight: 900,
          letterSpacing: -1,
          lineHeight: 1.1,
        }}>
          宏观焦点
        </div>
      </div>

      {/* News cards */}
      {items.slice(0, 4).map((item, i) => {
        const progress = spring({
          frame: frame - i * 6,
          fps,
          config: { damping: 14, stiffness: 100 },
        });
        const opacity = interpolate(progress, [0, 1], [0, 1]);
        const translateY = interpolate(progress, [0, 1], [20, 0]);

        return (
          <div
            key={i}
            style={{
              opacity,
              transform: `translateY(${translateY}px)`,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderLeft: "5px solid #1565c0",
              borderRadius: "0 14px 14px 0",
              padding: "20px 24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                color: "#1e293b",
                fontSize: 26,
                lineHeight: 1.5,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              {item.title}
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "#64748b",
                fontSize: 18,
                fontWeight: 500,
              }}
            >
              <span style={{ color: "#1565c0" }}>●</span>
              {item.source}
            </div>
          </div>
        );
      })}
    </div>
  );
};
