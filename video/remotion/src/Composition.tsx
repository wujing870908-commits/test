/**
 * Main Remotion composition: DailyReport
 *
 * Sections:
 *  intro        → full-screen cover card (title + date)
 *  indices      → S&P / Nasdaq / Dow cards + mini-charts
 *  mag7         → Mag7 grid
 *  commodities  → commodities cards
 *  crypto       → crypto cards
 *  sectors      → sector ETF cards
 *  news         → macro news panel
 *  outro        → closing screen
 */
import React from "react";
import { Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { DailyReportProps } from "./types";
import { Background } from "./components/Background";
import { Header } from "./components/Header";
import { StockCard } from "./components/StockCard";
import { MiniChart } from "./components/MiniChart";
import { SubtitleBar } from "./components/SubtitleBar";
import { NewsTicket } from "./components/NewsTicket";
import { useCurrentSegment } from "./hooks/useCurrentSegment";

// ── Section title ──────────────────────────────────────────────────────────
const SECTION_LABELS: Record<string, string> = {
  indices:     "主要指数",
  mag7:        "七巨头",
  commodities: "大宗商品",
  crypto:      "加密货币",
  sectors:     "板块表现",
};

const SectionTitle: React.FC<{ type: string }> = ({ type }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: { damping: 18, stiffness: 140 } });
  const opacity  = interpolate(progress, [0, 1], [0, 1]);
  const tx       = interpolate(progress, [0, 1], [-24, 0]);
  const label    = SECTION_LABELS[type] ?? type;

  return (
    <div style={{ opacity, transform: `translateX(${tx}px)`, display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
      <div style={{ width: 6, height: 36, borderRadius: 3, background: "linear-gradient(180deg,#00d4ff,#0070ff)", boxShadow: "0 0 16px rgba(0,180,255,0.7)" }} />
      <div style={{ color: "#fff", fontSize: 36, fontWeight: 900, letterSpacing: 2 }}>{label}</div>
    </div>
  );
};

// ── Intro cover card ──────────────────────────────────────────────────────
const IntroCover: React.FC<{ asOf: string }> = ({ asOf }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame, fps, config: { damping: 16, stiffness: 100 } });
  const opacity  = interpolate(progress, [0, 1], [0, 1]);
  const scale    = interpolate(progress, [0, 1], [0.92, 1]);

  const date = new Date(asOf).toLocaleDateString("zh-CN", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  return (
    <div style={{
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      opacity,
      transform: `scale(${scale})`,
    }}>
      {/* Decorative top line */}
      <div style={{ width: 180, height: 2, background: "linear-gradient(90deg,transparent,#00b4ff,transparent)", marginBottom: 48 }} />

      {/* Main title */}
      <div style={{
        fontSize: 88,
        fontWeight: 900,
        letterSpacing: 12,
        color: "#ffffff",
        textShadow: "0 0 60px rgba(0,180,255,0.5), 0 0 120px rgba(0,100,255,0.3)",
        lineHeight: 1,
        marginBottom: 16,
      }}>
        {props.title || "海外金融周报"}
      </div>

      {/* Subtitle accent */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 40,
      }}>
        <div style={{ width: 40, height: 1, background: "rgba(0,180,255,0.5)" }} />
        <div style={{ color: "#00b4ff", fontSize: 22, letterSpacing: 6, fontWeight: 500 }}>
          {props.subtitle?.toUpperCase() || "US MARKET WEEKLY REPORT"}
        </div>
        <div style={{ width: 40, height: 1, background: "rgba(0,180,255,0.5)" }} />
      </div>

      {/* Date */}
      <div style={{
        background: "rgba(0,180,255,0.1)",
        border: "1px solid rgba(0,180,255,0.3)",
        borderRadius: 12,
        padding: "14px 36px",
        color: "rgba(255,255,255,0.85)",
        fontSize: 28,
        letterSpacing: 2,
        fontWeight: 500,
      }}>
        {date}
      </div>

      {/* Decorative bottom line */}
      <div style={{ width: 180, height: 2, background: "linear-gradient(90deg,transparent,#00b4ff,transparent)", marginTop: 48 }} />
    </div>
  );
};

// ── Risk disclaimer bar (persistent, very bottom) ────────────────────────
const RiskDisclaimer: React.FC = () => (
  <div style={{
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    background: "rgba(0,0,0,0.75)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 40px",
  }}>
    <div style={{
      color: "rgba(255,255,255,0.45)",
      fontSize: 18,
      letterSpacing: 0.5,
      textAlign: "center",
    }}>
      ⚠️ 投资有风险，入市需谨慎 · 本内容仅供参考，不构成投资建议 · 历史数据不代表未来表现
    </div>
  </div>
);

// ── Content wrapper — vertically centered, Douyin safe zone ──────────────
const ContentArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    position: "absolute",
    top: 120,
    bottom: 530,
    left: 40,
    right: 120,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  }}>
    {children}
  </div>
);

const cardColor = (v: number | null) =>
  v == null ? "#888" : v >= 0 ? "#00e676" : "#ff4060";

// ── Main composition ───────────────────────────────────────────────────────
export const DailyReport: React.FC<DailyReportProps> = ({ snapshot, manifest, newsItems }) => {
  const currentSegment = useCurrentSegment(manifest.segments);
  const segType = currentSegment?.type ?? "intro";

  const showIntro       = segType === "intro";
  const showIndices     = segType === "indices";
  const showMag7        = segType === "mag7";
  const showCommodities = segType === "commodities";
  const showCrypto      = segType === "crypto";
  const showSectors     = segType === "sectors";
  const showNews        = segType === "news" || segType === "outro";

  return (
    <div style={{
      width: "100%", height: "100%",
      fontFamily: "'PingFang SC','Noto Sans SC','Microsoft YaHei',sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      <Background />
      <Audio src={staticFile(manifest.audio_path)} />

      {/* ── INTRO: cover card (no header) ── */}
      {showIntro && <IntroCover asOf={snapshot.as_of} />}

      {/* ── All other sections show header ── */}
      {!showIntro && <Header asOf={snapshot.as_of} />}

      {/* ── INDICES ── */}
      {showIndices && (
        <ContentArea>
          <SectionTitle type="indices" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {Object.entries(snapshot.indices).map(([name, data], i) => (
              <div key={name}>
                <StockCard name={name} data={data} delay={i * 4} />
                {data.history.length > 0 && (
                  <MiniChart history={data.history} color={cardColor(data.change_pct)} width={400} height={70} />
                )}
              </div>
            ))}
          </div>
        </ContentArea>
      )}

      {/* ── MAG7 ── */}
      {showMag7 && (
        <ContentArea>
          <SectionTitle type="mag7" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {Object.entries(snapshot.mag7).map(([name, data], i) => (
              <StockCard key={name} name={name} data={data} delay={i * 3} />
            ))}
          </div>
        </ContentArea>
      )}

      {/* ── COMMODITIES ── */}
      {showCommodities && (
        <ContentArea>
          <SectionTitle type="commodities" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {Object.entries(snapshot.commodities).map(([name, data], i) => (
              <div key={name}>
                <StockCard name={name} data={data} delay={i * 4} />
                {data.history.length > 0 && (
                  <MiniChart history={data.history} color={cardColor(data.change_pct)} width={400} height={70} />
                )}
              </div>
            ))}
          </div>
        </ContentArea>
      )}

      {/* ── CRYPTO ── */}
      {showCrypto && (
        <ContentArea>
          <SectionTitle type="crypto" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {Object.entries(snapshot.crypto ?? {}).map(([name, data], i) => (
              <StockCard key={name} name={name} data={data} delay={i * 5} />
            ))}
          </div>
        </ContentArea>
      )}

      {/* ── SECTORS ── */}
      {showSectors && (
        <ContentArea>
          <SectionTitle type="sectors" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {Object.entries(snapshot.sectors ?? {}).map(([name, data], i) => (
              <StockCard key={name} name={name} data={data} delay={i * 3} />
            ))}
          </div>
        </ContentArea>
      )}

      {/* ── NEWS ── */}
      {showNews && <NewsTicket items={newsItems} />}

      {/* ── Subtitle bar ── */}
      {!showIntro && <SubtitleBar segment={currentSegment} />}

      {/* ── Outro overlay ── */}
      {segType === "outro" && (
        <div style={{
          position: "absolute", top: "35%", left: "50%",
          transform: "translate(-50%,-50%)", textAlign: "center",
        }}>
          <div style={{ color: "#00b4ff", fontSize: 64, fontWeight: 900, letterSpacing: 6, textShadow: "0 0 40px rgba(0,180,255,0.7)" }}>
            {props.title || "海外金融周报"}
          </div>
          <div style={{ width: 120, height: 3, background: "linear-gradient(90deg,transparent,#00b4ff,transparent)", margin: "20px auto", borderRadius: 2 }} />
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 28, letterSpacing: 2 }}>
            感谢收看，明天见
          </div>
        </div>
      )}

      {/* ── Risk disclaimer (always visible at very bottom) ── */}
      <RiskDisclaimer />
    </div>
  );
};
