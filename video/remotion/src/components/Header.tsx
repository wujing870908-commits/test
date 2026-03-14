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
        height: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 60px",
        opacity,
        borderBottom: "1px solid rgba(0,180,255,0.2)",
        background: "rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Logo dot */}
        <div
          style={{
            width: 10, height: 10, borderRadius: "50%",
            background: "#00b4ff", boxShadow: "0 0 12px #00b4ff",
          }}
        />
        <span style={{ color: "#00b4ff", fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>
          美股日报
        </span>
      </div>
      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 22 }}>{date}</span>
    </div>
  );
};
