import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
} from "recharts";
import type { IntradayPoint } from "../types";

interface IntradayChartProps {
  data: IntradayPoint[];
  color: string;
  width?: number;
  height?: number;
}

/**
 * Intraday 1-min line chart showing today's price movement.
 * Uses fixed pixel dimensions to avoid per-frame recalculation flicker in Remotion.
 */
export const IntradayChart: React.FC<IntradayChartProps> = ({
  data,
  color,
  width = 980,
  height = 340,
}) => {
  if (!data || data.length < 2) return null;

  const gradId = `intra-grad-${color.replace("#", "")}`;

  // Show tick labels at roughly every hour
  const tickInterval = Math.max(1, Math.floor(data.length / 7));

  return (
    <div>
      <div style={{ color: "#94a3b8", fontSize: 18, marginBottom: 8, letterSpacing: 0.5 }}>
        日内走势 (1min)
      </div>
      <AreaChart
        width={width}
        height={height}
        data={data}
        margin={{ top: 8, right: 12, bottom: 4, left: 12 }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="time"
          tick={{ fontSize: 14, fill: "#94a3b8" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
          interval={tickInterval}
        />
        <YAxis
          domain={["auto", "auto"]}
          tick={{ fontSize: 14, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={60}
          tickFormatter={(v: number) => v.toFixed(0)}
        />
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
    </div>
  );
};
