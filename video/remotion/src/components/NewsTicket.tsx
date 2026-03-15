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
        bottom: 530,   // same safe zone as ContentArea
        left: 40,
        right: 120,    // avoid Douyin action buttons
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 20,
      }}
    >
      {/* Section header */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            borderBottom: "2px solid rgba(0,180,255,0.4)",
            paddingBottom: 12,
          }}
        >
          <div
            style={{
              width: 6,
              height: 28,
              background: "#00b4ff",
              borderRadius: 3,
              boxShadow: "0 0 12px #00b4ff",
            }}
          />
          <span
            style={{
              color: "#00b4ff",
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: 4,
              textShadow: "0 0 16px rgba(0,180,255,0.5)",
            }}
          >
            宏观焦点
          </span>
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
              background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderLeft: "4px solid rgba(0,180,255,0.6)",
              borderRadius: "0 14px 14px 0",
              padding: "20px 24px",
            }}
          >
            <div
              style={{
                color: "#ffffff",
                fontSize: 26,
                lineHeight: 1.55,
                fontWeight: 600,
                marginBottom: 8,
                textShadow: "0 1px 3px rgba(0,0,0,0.5)",
              }}
            >
              {item.title}
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "rgba(0,180,255,0.65)",
                fontSize: 18,
                fontWeight: 500,
              }}
            >
              <span style={{ opacity: 0.5 }}>●</span>
              {item.source}
            </div>
          </div>
        );
      })}
    </div>
  );
};
