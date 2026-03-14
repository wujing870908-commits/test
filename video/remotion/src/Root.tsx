import React from "react";
import { Composition } from "remotion";
import { DailyReport } from "./Composition";
import type { DailyReportProps } from "./types";

// Default props for Studio preview (replaced by real data at render time)
const defaultProps: DailyReportProps = {
  snapshot: {
    as_of: "2026-03-14T07:30:00+08:00",
    indices: {
      "S&P 500": { price: 5120.5,  change_pct:  0.85, history: [] },
      "纳斯达克":  { price: 16230.0, change_pct:  1.12, history: [] },
      "道琼斯":   { price: 38400.0, change_pct:  0.43, history: [] },
      "恐慌指数":  { price: 14.2,   change_pct: -5.10, history: [] },
    },
    mag7: {
      "苹果":   { price: 178.5, change_pct:  0.6, history: [] },
      "微软":   { price: 415.0, change_pct:  1.2, history: [] },
      "谷歌":   { price: 172.0, change_pct:  0.9, history: [] },
      "亚马逊": { price: 195.0, change_pct:  2.1, history: [] },
      "Meta":  { price: 530.0, change_pct:  1.8, history: [] },
      "特斯拉": { price: 183.0, change_pct: -1.5, history: [] },
      "英伟达": { price: 875.0, change_pct:  3.2, history: [] },
    },
    commodities: {
      "黄金":   { price: 2320.0, change_pct: -0.30, history: [] },
      "原油":   { price:   82.5, change_pct:  1.10, history: [] },
      "比特币": { price: 72000.0, change_pct: 2.50, history: [] },
    },
  },
  manifest: {
    audio_path: "narration.mp3",
    total_duration_ms: 60000,
    segments: [],
  },
  newsItems: [
    { title: "美联储维持利率不变，暗示年内降息两次", source: "Reuters" },
    { title: "英伟达发布新一代 AI 芯片，股价大涨", source: "Bloomberg" },
  ],
};

export const Root: React.FC = () => {
  // Duration driven by audio manifest; default 60 s at 30 fps = 1800 frames
  const durationInFrames = Math.ceil((defaultProps.manifest.total_duration_ms / 1000) * 30);

  return (
    <Composition
      id="DailyReport"
      component={DailyReport}
      durationInFrames={Math.max(durationInFrames, 60)}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={defaultProps}
    />
  );
};
