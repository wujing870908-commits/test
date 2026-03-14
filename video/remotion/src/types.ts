export interface HistoryPoint {
  date: string;
  close: number;
}

export interface AssetData {
  price: number | null;
  change_pct: number | null;
  history: HistoryPoint[];
}

export interface TimingSegment {
  index: number;
  type: "intro" | "indices" | "mag7" | "commodities" | "news" | "outro";
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
}

/** Props passed to the Remotion composition */
export interface DailyReportProps {
  snapshot: MarketSnapshot;
  manifest: Manifest;
  newsItems: Array<{ title: string; source: string }>;
}
