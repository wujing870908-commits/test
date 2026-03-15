import React from "react";
import { Composition } from "remotion";
import { DailyReport } from "./Composition";
import type { DailyReportProps } from "./types";

// Default props for Studio preview (replaced by real data at render time)
const defaultProps: DailyReportProps = {
  snapshot: {
    as_of: "2026-03-14T07:30:00+08:00",
    indices: {
      "标准普尔500": { price: 6632.0, change_pct: -0.61, history: [] },
      "纳斯达克":    { price: 21090.0, change_pct: -0.93, history: [] },
      "道琼斯":      { price: 43428.0, change_pct: -0.26, history: [] },
      "罗素2000":    { price: 2120.0,  change_pct: -1.10, history: [] },
      "恐慌指数":    { price: 21.5,    change_pct:  5.20, history: [] },
    },
    mag7: {
      "苹果":   { price: 213.5, change_pct: -2.21, history: [] },
      "微软":   { price: 388.0, change_pct: -1.57, history: [] },
      "谷歌":   { price: 170.0, change_pct: -0.85, history: [] },
      "亚马逊": { price: 198.0, change_pct: -0.72, history: [] },
      "Meta":  { price: 570.0, change_pct: -3.83, history: [] },
      "特斯拉": { price: 265.0, change_pct: -0.45, history: [] },
      "英伟达": { price: 112.0, change_pct: -1.58, history: [] },
    },
    commodities: {
      "WTI原油":   { price: 68.5,   change_pct:  3.11, history: [] },
      "布伦特原油": { price: 71.2,   change_pct:  2.80, history: [] },
      "黄金":      { price: 2980.0, change_pct: -1.06, history: [] },
      "白银":      { price: 33.5,   change_pct: -0.80, history: [] },
      "天然气":    { price: 4.12,   change_pct:  1.20, history: [] },
      "铜":        { price: 4.85,   change_pct: -0.50, history: [] },
    },
    crypto: {
      "比特币":  { price: 83000.0, change_pct: -0.23, history: [] },
      "以太坊":  { price: 1950.0,  change_pct:  1.10, history: [] },
      "XRP":    { price: 2.35,    change_pct:  0.85, history: [] },
    },
    sectors: {
      "能源":    { price: 92.0, change_pct:  3.11, history: [] },
      "科技":    { price: 220.0, change_pct: -1.84, history: [] },
      "金融":    { price: 48.5, change_pct: -1.63, history: [] },
      "工业":    { price: 113.0, change_pct: -2.51, history: [] },
    },
  },
  manifest: {
    audio_path: "narration.mp3",
    total_duration_ms: 120000,
    segments: [],
  },
  newsItems: [
    { title: "特朗普下令打击伊朗石油枢纽，霍尔木兹局势升温", source: "Reuters" },
    { title: "美联储官员暗示通胀黏性，降息预期降温", source: "Bloomberg" },
  ],
};

export const Root: React.FC = () => {
  return (
    <Composition
      id="DailyReport"
      component={DailyReport}
      // calculateMetadata reads actual props at render time for correct duration
      calculateMetadata={({ props }) => {
        const durationInFrames = Math.ceil(
          (props.manifest.total_duration_ms / 1000) * 30
        );
        return { durationInFrames: Math.max(durationInFrames, 60) };
      }}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
  );
};
