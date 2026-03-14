import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  YAxis,
} from "recharts";
import type { HistoryPoint } from "../types";

interface MiniChartProps {
  history: HistoryPoint[];
  color: string;
  width?: number;
  height?: number;
}

export const MiniChart: React.FC<MiniChartProps> = ({
  history,
  color,
  width = 320,
  height = 100,
}) => {
  if (!history || history.length === 0) return null;

  return (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart data={history} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0}   />
          </linearGradient>
        </defs>
        <YAxis domain={["auto", "auto"]} hide />
        <Tooltip
          contentStyle={{ background: "#1a2030", border: "none", fontSize: 12 }}
          labelStyle={{ color: "#aaa" }}
          formatter={(v: number) => [v.toLocaleString(), "收盘"]}
        />
        <Area
          type="monotone"
          dataKey="close"
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${color.replace("#", "")})`}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
