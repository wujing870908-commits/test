import React from "react";

/** Dark gradient background with a subtle grid */
export const Background: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: "linear-gradient(135deg, #0a0e1a 0%, #0d1b2a 60%, #0a1628 100%)",
    }}
  >
    {/* Subtle grid overlay */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(0,180,255,0.04) 1px, transparent 1px), " +
          "linear-gradient(90deg, rgba(0,180,255,0.04) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />
  </div>
);
