export interface HistoryPoint {
  date: string;
  close: number;
}

export interface IntradayPoint {
  time: string;   // "HH:MM"
  close: number;
}

export interface AssetData {
  price: number | null;
  change_pct: number | null;
  history: HistoryPoint[];
  intraday?: IntradayPoint[];
}

export interface TimingSegment {
  index: number;
  type: "intro" | "indices" | "mag7" | "commodities" | "crypto" | "sectors" | "news" | "outro";
  text: string;
  highlight: string | null;
  start_ms: number;
  end_ms: number;
}

export interface Manifest {
  audio_path: string;
  total_duration_ms: number;
  segments: TimingSegment[];
}

export interface MarketSnapshot {
  as_of: string;
  indices: Record<string, AssetData>;
  mag7: Record<string, AssetData>;
  commodities: Record<string, AssetData>;
  crypto: Record<string, AssetData>;
  sectors: Record<string, AssetData>;
}

/** Props passed to the Remotion composition */
export interface DailyReportProps {
  snapshot: MarketSnapshot;
  manifest: Manifest;
  newsItems: Array<{ title: string; source: string }>;
  /** Custom video title (replaces "每日市场报告") */
  customTitle?: string;
  /** Custom English subtitle (replaces "Daily Market Report") */
  customSubtitle?: string;
  /** Override section titles, e.g. { indices: "德系车企股价" } */
  sectionTitles?: Record<string, string>;
}
