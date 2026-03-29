/**
 * Main Remotion composition: DailyReport
 *
 * Sections:
 *  intro        → clean cover card (title + date)
 *  indices      → major index rows + mini-chart
 *  mag7         → Mag7 list
 *  commodities  → commodities list + horizontal bar chart
 *  crypto       → crypto rows
 *  sectors      → sector rows
 *  news         → macro news panel
 *  outro        → closing screen
 *
 * Visual style: clean light background, dark text, colored category pills
 */
import React from "react";
import { Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { AssetData, DailyReportProps } from "./types";
import { Background } from "./components/Background";
import { StockCard } from "./components/StockCard";
import { MiniChart } from "./components/MiniChart";
import { IntradayChart } from "./components/IntradayChart";
import { SubtitleBar } from "./components/SubtitleBar";
import { NewsTicket } from "./components/NewsTicket";
import { useCurrentSegment } from "./hooks/useCurrentSegment";

// ── Section configuration ─────────────────────────────────────────────────
const SECTION_CONFIG: Record<string, { enLabel: string; pillBg: string; pillColor: string }> = {
  indices:     { enLabel: "Market Indices",  pillBg: "#e0f2f1", pillColor: "#00796b" },
  mag7:        { enLabel: "Magnificent 7",   pillBg: "#e8eaf6", pillColor: "#3949ab" },
  commodities: { enLabel: "Commodities",     pillBg: "#fff3e0", pillColor: "#e65100" },
  crypto:      { enLabel: "Crypto",          pillBg: "#fce4ec", pillColor: "#c2185b" },
  sectors:     { enLabel: "Sectors",         pillBg: "#f3e5f5", pillColor: "#7b1fa2" },
  news:        { enLabel: "Macro Focus",     pillBg: "#e3f2fd", pillColor: "#1565c0" },
  outro:       { enLabel: "Macro Focus",     pillBg: "#e3f2fd", pillColor: "#1565c0" },
};

// ── Category pill ─────────────────────────────────────────────────────────
const CategoryPill: React.FC<{ type: string }> = ({ type }) => {
  const cfg = SECTION_CONFIG[type];
  if (!cfg) return null;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: { damping: 18, stiffness: 200 } });

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: cfg.pillBg,
        color: cfg.pillColor,
        fontSize: 20,
        fontWeight: 700,
        padding: "8px 20px",
        borderRadius: 30,
        marginBottom: 20,
        letterSpacing: 1,
        opacity: interpolate(progress, [0, 1], [0, 1]),
      }}
    >
      {cfg.enLabel}
    </div>
  );
};

// ── Section title (52–60px per layout spec) ──────────────────────────────
const SectionTitle: React.FC<{ children: string }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });

  return (
    <div
      style={{
        color: "#0f172a",
        fontSize: 56,
        fontWeight: 800,
        letterSpacing: -1,
        lineHeight: 1.1,
        marginBottom: 24,
        opacity: interpolate(progress, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(progress, [0, 1], [16, 0])}px)`,
      }}
    >
      {children}
    </div>
  );
};

// ── Horizontal bar chart (commodities / crypto) ───────────────────────────
const HBarChart: React.FC<{ data: Record<string, AssetData> }> = ({ data }) => {
  const entries = Object.entries(data);
  const maxAbs = Math.max(...entries.map(([, d]) => Math.abs(d.change_pct ?? 0)), 1);

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ color: "#94a3b8", fontSize: 18, marginBottom: 14, letterSpacing: 0.5 }}>
        当日涨跌幅 (%)
      </div>
      {entries.map(([name, d]) => {
        const pct = d.change_pct ?? 0;
        const isUp = pct >= 0;
        const color = isUp ? "#16a34a" : "#dc2626";
        const barFrac = Math.abs(pct) / maxAbs;

        return (
          <div key={name} style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
            {/* Label */}
            <div style={{ width: 80, color: "#475569", fontSize: 20, textAlign: "right", marginRight: 14, flexShrink: 0 }}>
              {name}
            </div>
            {/* Bar track */}
            <div style={{ flex: 1, height: 28, display: "flex", alignItems: "center", position: "relative" }}>
              {/* Negative side */}
              <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", paddingRight: 1 }}>
                {!isUp && (
                  <div style={{
                    width: `${barFrac * 100}%`,
                    height: 22,
                    background: color,
                    borderRadius: "4px 0 0 4px",
                  }} />
                )}
              </div>
              {/* Center line */}
              <div style={{ width: 2, height: 28, background: "#cbd5e1", flexShrink: 0 }} />
              {/* Positive side */}
              <div style={{ flex: 1, display: "flex", justifyContent: "flex-start", alignItems: "center", paddingLeft: 1 }}>
                {isUp && (
                  <div style={{
                    width: `${barFrac * 100}%`,
                    height: 22,
                    background: color,
                    borderRadius: "0 4px 4px 0",
                  }} />
                )}
              </div>
            </div>
            {/* Value */}
            <div style={{ width: 90, color, fontSize: 20, fontWeight: 700, marginLeft: 12, textAlign: "right" }}>
              {pct > 0 ? "+" : ""}{pct.toFixed(2)}%
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Intro cover card ──────────────────────────────────────────────────────
const IntroCover: React.FC<{ asOf: string; title?: string; subtitle?: string }> = ({ asOf, title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Always fully visible from frame 0 so the first frame works as a cover image
  const scale   = 1;
  const opacity = 1;

  const date = new Date(asOf).toLocaleDateString("zh-CN", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {/* Icon badge */}
      <div
        style={{
          width: 90,
          height: 90,
          borderRadius: 22,
          background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 48,
          boxShadow: "0 12px 40px rgba(14,165,233,0.30)",
        }}
      >
        <div style={{ fontSize: 42 }}>📈</div>
      </div>

      {/* Main title */}
      <div
        style={{
          color: "#0f172a",
          fontSize: (title && title.length > 8) ? 52 : 72,
          fontWeight: 900,
          letterSpacing: (title && title.length > 8) ? 4 : 8,
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        {title || "每日市场报告"}
      </div>

      {/* English subtitle */}
      <div
        style={{
          color: "#0ea5e9",
          fontSize: 22,
          letterSpacing: 5,
          fontWeight: 600,
          marginBottom: 64,
        }}
      >
        {subtitle || "Daily Market Report"}
      </div>

      {/* Date box */}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: "18px 48px",
          marginBottom: 16,
          textAlign: "center",
          background: "#ffffff",
          width: 580,
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ color: "#94a3b8", fontSize: 17, marginBottom: 8, letterSpacing: 2 }}>日期</div>
        <div style={{ color: "#1e293b", fontSize: 30, fontWeight: 700 }}>{date}</div>
      </div>

      {/* Market box */}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: "18px 48px",
          textAlign: "center",
          background: "#ffffff",
          width: 580,
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ color: "#94a3b8", fontSize: 17, marginBottom: 8, letterSpacing: 2 }}>市场</div>
        <div style={{ color: "#1e293b", fontSize: 30, fontWeight: 700 }}>{title ? "全球汽车产业" : "美国股市"}</div>
      </div>
    </div>
  );
};

// ── Risk disclaimer bar (Footer zone: 1860–1920px) ──────────────────────
const RiskDisclaimer: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 1860,
      left: 0,
      right: 0,
      height: 60,
      background: "rgba(15,23,42,0.82)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 40px",
    }}
  >
    <div
      style={{
        color: "rgba(241,245,249,0.5)",
        fontSize: 17,
        letterSpacing: 0.5,
        textAlign: "center",
      }}
    >
      ⚠️ 投资有风险，入市需谨慎 · 本内容仅供参考，不构成投资建议 · 历史数据不代表未来表现
    </div>
  </div>
);

// ── Layout zones (9:16, 1080×1920) ───────────────────────────────────────
// Header:  0 – 280px   → Section label + title
// Content: 280 – 1720px → Cards, charts, tables
// Caption: 1720 – 1860px → Narration subtitle (handled by SubtitleBar)
// Footer:  1860 – 1920px → Risk disclaimer

const ContentArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      top: 280,
      bottom: 200,           // leaves room for caption (1720px) + disclaimer
      left: 50,
      right: 50,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      gap: 20,
      overflowY: "hidden",
    }}
  >
    {children}
  </div>
);

const HeaderArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 50,
      right: 50,
      height: 280,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      paddingBottom: 20,
    }}
  >
    {children}
  </div>
);

const cardColor = (v: number | null) =>
  v == null ? "#94a3b8" : v >= 0 ? "#16a34a" : "#dc2626";

// ── Main composition ───────────────────────────────────────────────────────
export const DailyReport: React.FC<DailyReportProps> = ({ snapshot, manifest, newsItems, customTitle, customSubtitle, sectionTitles }) => {
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
    <div
      style={{
        width: "100%", height: "100%",
        fontFamily: "'PingFang SC','Noto Sans SC','Microsoft YaHei',sans-serif",
        position: "relative", overflow: "hidden",
      }}
    >
      <Background />
      <Audio src={staticFile(manifest.audio_path)} />

      {/* ── INTRO: clean cover card ── */}
      {showIntro && <IntroCover asOf={snapshot.as_of} title={customTitle} subtitle={customSubtitle} />}

      {/* ── INDICES ── */}
      {showIndices && (
        <>
          <HeaderArea>
            <CategoryPill type="indices" />
            <SectionTitle>{sectionTitles?.indices || "主要股指表现"}</SectionTitle>
          </HeaderArea>
          <ContentArea>
            {Object.entries(snapshot.indices).map(([name, data], i) => (
              <StockCard key={name} name={name} data={data} delay={i * 4} />
            ))}
            {/* Chart: prefer intraday (1-min) chart, fall back to 30-day MiniChart */}
            {(() => {
              const entry = Object.entries(snapshot.indices).find(
                ([, d]) => (d.intraday && d.intraday.length > 1) || d.history.length > 0
              );
              if (!entry) return null;
              const [, d] = entry;
              const color = cardColor(d.change_pct);
              if (d.intraday && d.intraday.length > 1) {
                return <IntradayChart data={d.intraday} color={color} width={980} height={340} />;
              }
              return (
                <div>
                  <div style={{ color: "#94a3b8", fontSize: 18, marginBottom: 8 }}>近期走势</div>
                  <MiniChart history={d.history} color={color} width={980} height={260} />
                </div>
              );
            })()}
          </ContentArea>
        </>
      )}

      {/* ── MAG7 ── */}
      {showMag7 && (
        <>
          <HeaderArea>
            <CategoryPill type="mag7" />
            <SectionTitle>{sectionTitles?.mag7 || "七巨头表现"}</SectionTitle>
          </HeaderArea>
          <ContentArea>
            {Object.entries(snapshot.mag7).map(([name, data], i) => (
              <StockCard key={name} name={name} data={data} delay={i * 3} compact />
            ))}
          </ContentArea>
        </>
      )}

      {/* ── COMMODITIES ── */}
      {showCommodities && (
        <>
          <HeaderArea>
            <CategoryPill type="commodities" />
            <SectionTitle>{sectionTitles?.commodities || "大宗商品"}</SectionTitle>
          </HeaderArea>
          <ContentArea>
            {Object.entries(snapshot.commodities).map(([name, data], i) => (
              <StockCard key={name} name={name} data={data} delay={i * 4} compact />
            ))}
            <HBarChart data={snapshot.commodities} />
          </ContentArea>
        </>
      )}

      {/* ── CRYPTO ── */}
      {showCrypto && (
        <>
          <HeaderArea>
            <CategoryPill type="crypto" />
            <SectionTitle>加密货币</SectionTitle>
          </HeaderArea>
          <ContentArea>
            {Object.entries(snapshot.crypto ?? {}).map(([name, data], i) => (
              <StockCard key={name} name={name} data={data} delay={i * 5} />
            ))}
          </ContentArea>
        </>
      )}

      {/* ── SECTORS ── */}
      {showSectors && (
        <>
          <HeaderArea>
            <CategoryPill type="sectors" />
            <SectionTitle>板块表现</SectionTitle>
          </HeaderArea>
          <ContentArea>
            {Object.entries(snapshot.sectors ?? {}).map(([name, data], i) => (
              <StockCard key={name} name={name} data={data} delay={i * 3} compact />
            ))}
          </ContentArea>
        </>
      )}

      {/* ── NEWS ── */}
      {showNews && <NewsTicket items={newsItems} />}

      {/* ── OUTRO overlay ── */}
      {segType === "outro" && (
        <div
          style={{
            position: "absolute",
            top: "32%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#0f172a", fontSize: 64, fontWeight: 900, letterSpacing: 6 }}>
            每日市场报告
          </div>
          <div style={{ width: 120, height: 3, background: "#0ea5e9", margin: "20px auto", borderRadius: 2 }} />
          <div style={{ color: "#64748b", fontSize: 28, letterSpacing: 2 }}>
            感谢收看，明天见
          </div>
        </div>
      )}

      {/* ── Subtitle bar ── */}
      {!showIntro && <SubtitleBar segment={currentSegment} />}

      {/* ── Risk disclaimer (always visible at very bottom) ── */}
      <RiskDisclaimer />
    </div>
  );
};
