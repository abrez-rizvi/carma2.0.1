// ── AQI ────────────────────────────────────────
export interface AQIData {
  aqi: number;
  aqi_category: string;
  pm2_5: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  city?: string;
  source?: string;
  risk_summary?: string;
}

// ── Impact ─────────────────────────────────────
export interface Impact {
  co2: {
    baseline: number;
    post_policy: number;
    change_pct: number;
    change_absolute: number;
  };
  aqi: {
    baseline: number;
    post_policy: number;
    change_pct: number;
    change_absolute: number;
  };
  cascade_analysis: {
    most_affected_nodes: [string, number][];
    summary: {
      nodes_with_reduction: number;
      nodes_with_increase: number;
      avg_change_pct: number;
    };
  };
}

/** Subset used by SolutionsCatalog impact modal */
export interface ImpactResult {
  co2: { baseline: number; post_policy: number; change_pct: number };
  aqi: { baseline: number; post_policy: number; change_pct: number };
}

// ── Chat ───────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ── Forecast / Emissions ───────────────────────
export interface SectorBreakdown {
  Aviation: number;
  Ground_Transport: number;
  Industry: number;
  Power: number;
  Residential: number;
}

export interface ForecastPoint {
  date: string;
  emission: number;
  sectors: SectorBreakdown;
  is_historical?: boolean;
}

export interface MonthlyData {
  month: string;
  total_emissions: number;
  aqi: number;
  sectors: SectorBreakdown;
}
