/**
 * Main Remotion composition: DailyReport
 *
 * Sections driven by the timing manifest from TTS:
 *  intro        → full-screen opening with date
 *  indices      → S&P / Nasdaq / Dow cards + mini-charts
 *  mag7         → Mag7 grid
 *  commodities  → Gold / Oil / BTC cards
 *  news         → News ticket panel
 *  outro        → Closing screen
 */
import React from "react";
import { Audio, useCurrentFrame, useVideoConfig } from "remotion";
import type { DailyReportProps } from "./types";
import { Background } from "./components/Background";
import { Header } from "./components/Header";
import { StockCard } from "./components/StockCard";
import { MiniChart } from "./components/MiniChart";
import { SubtitleBar } from "./components/SubtitleBar";
import { NewsTicket } from "./components/NewsTicket";
import { useCurrentSegment } from "./hooks/useCurrentSegment";

export const DailyReport: React.FC<DailyReportProps> = ({
  snapshot,
  manifest,
  newsItems,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentMs = (frame / fps) * 1000;

  const currentSegment = useCurrentSegment(manifest.segments);
  const segType = currentSegment?.type ?? "intro";

  // Determine which section content to show
  const showIndices     = segType === "indices"     || segType === "intro";
  const showMag7        = segType === "mag7";
  const showCommodities = segType === "commodities";
  const showNews        = segType === "news"        || segType === "outro";

  // Color helper
  const cardColor = (changePct: number | null) =>
    changePct == null ? "#888" : changePct >= 0 ? "#00e676" : "#ff1744";

  return (
    <div style={{ width: "100%", height: "100%", fontFamily: "'PingFang SC', 'Noto Sans SC', sans-serif", position: "relative", overflow: "hidden" }}>
      <Background />
      <Header asOf={snapshot.as_of} />

      {/* Narration audio */}
      <Audio src={manifest.audio_path} />

      {/* ── INDICES section ── */}
      {showIndices && (
        <div
          style={{
            position: "absolute",
            top: 130,
            left: 60,
            display: "flex",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          {Object.entries(snapshot.indices).map(([name, data], i) => (
            <div key={name}>
              <StockCard name={name} data={data} delay={i * 5} />
              {data.history.length > 0 && (
                <MiniChart
                  history={data.history}
                  color={cardColor(data.change_pct)}
                  width={220}
                  height={80}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── MAG7 section ── */}
      {showMag7 && (
        <div
          style={{
            position: "absolute",
            top: 130,
            left: 60,
            right: 60,
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {Object.entries(snapshot.mag7).map(([name, data], i) => (
            <StockCard key={name} name={name} data={data} delay={i * 4} />
          ))}
        </div>
      )}

      {/* ── COMMODITIES section ── */}
      {showCommodities && (
        <div
          style={{
            position: "absolute",
            top: 130,
            left: 60,
            display: "flex",
            gap: 24,
          }}
        >
          {Object.entries(snapshot.commodities).map(([name, data], i) => (
            <div key={name}>
              <StockCard name={name} data={data} delay={i * 6} />
              {data.history.length > 0 && (
                <MiniChart
                  history={data.history}
                  color={cardColor(data.change_pct)}
                  width={280}
                  height={100}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── NEWS section ── */}
      {showNews && (
        <NewsTicket items={newsItems} startFrame={0} />
      )}

      {/* ── Subtitle bar (always visible) ── */}
      <SubtitleBar segment={currentSegment} />

      {/* ── Outro overlay ── */}
      {segType === "outro" && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#00b4ff", fontSize: 48, fontWeight: 700 }}>美股日报</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 24, marginTop: 12 }}>
            感谢收看，明天见
          </div>
        </div>
      )}
    </div>
  );
};
