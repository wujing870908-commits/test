import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface HeaderProps {
  asOf: string;
}

export const Header: React.FC<HeaderProps> = ({ asOf }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const date = new Date(asOf).toLocaleDateString("zh-CN", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 110,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 50px",
        opacity,
        background: "linear-gradient(180deg, rgba(0,10,30,0.95) 0%, rgba(0,10,30,0.6) 100%)",
        borderBottom: "1px solid rgba(0,180,255,0.25)",
      }}
    >
      {/* Left: Logo + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ position: "relative" }}>
          {/* Outer ring */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "2px solid rgba(0,180,255,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Inner dot */}
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#00b4ff",
                boxShadow: "0 0 16px #00b4ff, 0 0 32px rgba(0,180,255,0.4)",
              }}
            />
          </div>
        </div>
        <div>
          <div
            style={{
              color: "#00b4ff",
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: 4,
              textShadow: "0 0 20px rgba(0,180,255,0.6)",
              lineHeight: 1,
            }}
          >
            {"美股日报"}
          </div>
          <div
            style={{
              color: "rgba(0,180,255,0.5)",
              fontSize: 14,
              letterSpacing: 3,
              marginTop: 3,
            }}
          >
            US MARKET DAILY
          </div>
        </div>
      </div>

      {/* Right: Date */}
      <div style={{ textAlign: "right" }}>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 20, fontWeight: 500 }}>
          {date}
        </div>
        <div
          style={{
            marginTop: 4,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#00e676",
              boxShadow: "0 0 8px #00e676",
            }}
          />
          <span style={{ color: "rgba(0,230,118,0.8)", fontSize: 14, letterSpacing: 1 }}>
            LIVE
          </span>
        </div>
      </div>
    </div>
  );
};
