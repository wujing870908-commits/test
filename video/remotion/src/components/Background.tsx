import React from "react";

/** Deep dark background with radial glow orbs for a premium broadcast look */
export const Background: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: "linear-gradient(160deg, #080c18 0%, #0b1525 50%, #070d1a 100%)",
    }}
  >
    {/* Grid lines */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(0,180,255,0.05) 1px, transparent 1px), " +
          "linear-gradient(90deg, rgba(0,180,255,0.05) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
      }}
    />
    {/* Top-right blue glow orb */}
    <div
      style={{
        position: "absolute",
        top: -200,
        right: -200,
        width: 700,
        height: 700,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,140,255,0.18) 0%, transparent 70%)",
      }}
    />
    {/* Bottom-left accent orb */}
    <div
      style={{
        position: "absolute",
        bottom: -150,
        left: -150,
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,200,160,0.10) 0%, transparent 70%)",
      }}
    />
    {/* Center subtle glow */}
    <div
      style={{
        position: "absolute",
        top: "40%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 800,
        height: 800,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,100,220,0.06) 0%, transparent 65%)",
      }}
    />
  </div>
);
