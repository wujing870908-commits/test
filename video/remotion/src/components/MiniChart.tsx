import React from "react";
import {
  AreaChart,
  Area,
  YAxis,
} from "recharts";
import type { HistoryPoint } from "../types";

interface MiniChartProps {
  history: HistoryPoint[];
  color: string;
  width?: number;
  height?: number;
}

// Use fixed pixel dimensions — ResponsiveContainer causes per-frame recalculation
// in Remotion's headless renderer, which makes the chart flicker and jump.
export const MiniChart: React.FC<MiniChartProps> = ({
  history,
  color,
  width = 400,
  height = 70,
}) => {
  if (!history || history.length === 0) return null;

  const gradId = `grad-${color.replace("#", "")}`;

  return (
    <AreaChart
      width={width}
      height={height}
      data={history}
      margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
          <stop offset="95%" stopColor={color} stopOpacity={0}   />
        </linearGradient>
      </defs>
      <YAxis domain={["auto", "auto"]} hide />
      <Area
        type="monotone"
        dataKey="close"
        stroke={color}
        strokeWidth={2.5}
        fill={`url(#${gradId})`}
        dot={false}
        isAnimationActive={false}
      />
    </AreaChart>
  );
};
