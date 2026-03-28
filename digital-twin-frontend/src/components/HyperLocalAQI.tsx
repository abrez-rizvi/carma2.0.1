"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { API_BASE_URL } from "../config";
import {
  RefreshCw,
  Filter,
  MapPin,
  AlertTriangle,
  TrendingUp,
  Wind,
  Layers,
  ChevronDown,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface WardData {
  Ward_No: string;
  Ward_Name: string;
  Zone: string;
  AC_Name: string;
  Population: number;
  Density: string;
  Area_Type: string;
  AQI_Sensitivity: string;
  CO2_Source: string;
  Dominant_Local_Pollution_Source: string;
  risk_score: number;
  risk_level: string;
  cluster: number;
  cluster_label: string;
  predicted_source: string;
  simulated_aqi: number;
  recommendation: string;
}

type MapViewMode = "risk" | "cluster" | "source";

// ═══════════════════════════════════════════════════════════════════
// Color palettes
// ═══════════════════════════════════════════════════════════════════

const RISK_COLORS: Record<string, string> = {
  High: "#ef4444",
  Medium: "#eab308",
  Low: "#22c55e",
  Unknown: "#6b7280",
};

const CLUSTER_COLORS: Record<string, string> = {
  "High Risk": "#ef4444",
  "Medium Risk": "#f59e0b",
  "Low Risk": "#10b981",
  Unknown: "#6b7280",
};

const SOURCE_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#14b8a6",
  "#8b5cf6",
];

const PIE_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export function HyperLocalAQI() {
  // --- state ---
  const [wardsData, setWardsData] = useState<WardData[]>([]);
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [zoneFilter, setZoneFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  // Map view mode
  const [viewMode, setViewMode] = useState<MapViewMode>("risk");

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const geoLayerRef = useRef<any>(null);

  // --- data fetching ---
  const fetchData = useCallback(async () => {
    try {
      const [wardsRes, geoRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/wards-data`),
        fetch(`${API_BASE_URL}/api/geo-data`),
      ]);

      if (!wardsRes.ok || !geoRes.ok)
        throw new Error("Failed to fetch ward data");

      const wardsJson = await wardsRes.json();
      const geoJson = await geoRes.json();

      setWardsData(wardsJson.data || []);
      setGeoData(geoJson);
      setLastRefresh(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // --- filtered data ---
  const filteredData = wardsData.filter((w) => {
    if (zoneFilter && w.Zone !== zoneFilter) return false;
    if (riskFilter && w.risk_level !== riskFilter) return false;
    if (
      sourceFilter &&
      !w.predicted_source.toLowerCase().includes(sourceFilter.toLowerCase())
    )
      return false;
    return true;
  });

  // --- derived values for dropdowns ---
  const zones = [...new Set(wardsData.map((w) => w.Zone))].sort();
  const sources = [
    ...new Set(wardsData.map((w) => w.predicted_source)),
  ].sort();

  // --- chart data ---
  const sourceDistribution = (() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((w) => {
      // Shorten long source names for display
      const src = w.predicted_source.length > 40
        ? w.predicted_source.substring(0, 37) + "..."
        : w.predicted_source;
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  const riskDistribution = (() => {
    const counts: Record<string, number> = { High: 0, Medium: 0, Low: 0 };
    filteredData.forEach((w) => {
      if (counts[w.risk_level] !== undefined) counts[w.risk_level]++;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  })();

  // --- Leaflet map ---
  const getFeatureColor = useCallback(
    (props: any) => {
      if (viewMode === "risk") {
        return RISK_COLORS[props.risk_level] || RISK_COLORS.Unknown;
      } else if (viewMode === "cluster") {
        return CLUSTER_COLORS[props.cluster_label] || CLUSTER_COLORS.Unknown;
      } else {
        // source — hash-based color
        const src = props.predicted_source || "";
        let hash = 0;
        for (let i = 0; i < src.length; i++)
          hash = src.charCodeAt(i) + ((hash << 5) - hash);
        return SOURCE_COLORS[Math.abs(hash) % SOURCE_COLORS.length];
      }
    },
    [viewMode]
  );

  // Initialize / update map
  useEffect(() => {
    if (!geoData || !mapContainerRef.current) return;

    // Dynamic import of leaflet (client-side only)
    import("leaflet").then((L) => {
      // Import leaflet CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href =
          "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Create map if not exists
      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current!, {
          center: [28.65, 77.22],
          zoom: 11,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        // Dark tile layer
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          {
            attribution:
              '&copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 18,
          }
        ).addTo(mapRef.current);
      }

      // Remove old layer
      if (geoLayerRef.current) {
        mapRef.current.removeLayer(geoLayerRef.current);
      }

      // Build filter set for highlighting
      const filteredNos = new Set(filteredData.map((w) => String(w.Ward_No)));

      // Add GeoJSON layer
      geoLayerRef.current = L.geoJSON(geoData as any, {
        style: (feature: any) => {
          const props = feature?.properties || {};
          const wardNo = String(props.Ward_No || "");
          const isFiltered =
            filteredNos.size === wardsData.length || filteredNos.has(wardNo);

          return {
            fillColor: getFeatureColor(props),
            weight: 1.5,
            opacity: isFiltered ? 1 : 0.3,
            color: "rgba(255,255,255,0.4)",
            fillOpacity: isFiltered ? 0.7 : 0.15,
          };
        },
        onEachFeature: (feature: any, layer: any) => {
          const p = feature?.properties || {};
          // Hover tooltip
          const tooltipContent = `
            <div style="font-family:system-ui;font-size:12px;line-height:1.5">
              <strong style="font-size:13px">${p.Ward_Name || "Unknown"}</strong><br/>
              <span style="color:#aaa">Pop:</span> ${(p.Population || 0).toLocaleString()}<br/>
              <span style="color:#aaa">Density:</span> ${p.Density || "N/A"}
            </div>`;
          layer.bindTooltip(tooltipContent, {
            sticky: true,
            className: "ward-tooltip",
          });

          // Click popup
          const popupContent = `
            <div style="font-family:system-ui;font-size:12px;min-width:220px;line-height:1.6;color:#e5e7eb;background:#1a1a2e;padding:12px;border-radius:8px">
              <div style="font-size:15px;font-weight:700;margin-bottom:8px;color:#fff">${p.Ward_Name || "Unknown"}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px">
                <span style="color:#9ca3af">Zone</span><span>${p.Zone || "N/A"}</span>
                <span style="color:#9ca3af">Population</span><span>${(p.Population || 0).toLocaleString()}</span>
                <span style="color:#9ca3af">Density</span><span>${p.Density || "N/A"}</span>
                <span style="color:#9ca3af">AQI Sensitivity</span><span>${p.AQI_Sensitivity || "N/A"}</span>
              </div>
              <hr style="border-color:#333;margin:8px 0"/>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px">
                <span style="color:#9ca3af">Risk Level</span>
                <span style="color:${RISK_COLORS[p.risk_level] || "#fff"};font-weight:600">${p.risk_level || "Unknown"}</span>
                <span style="color:#9ca3af">Cluster</span>
                <span style="color:${CLUSTER_COLORS[p.cluster_label] || "#fff"}">${p.cluster_label || "Unknown"}</span>
                <span style="color:#9ca3af">Simulated AQI</span>
                <span style="font-weight:600;color:${(p.simulated_aqi || 0) > 200 ? "#ef4444" : (p.simulated_aqi || 0) > 100 ? "#eab308" : "#22c55e"}">${p.simulated_aqi || 0}</span>
              </div>
              <hr style="border-color:#333;margin:8px 0"/>
              <div style="margin-bottom:4px">
                <span style="color:#9ca3af;font-size:11px">Predicted Source</span><br/>
                <span style="font-size:11px">${p.predicted_source || "N/A"}</span>
              </div>
              <div>
                <span style="color:#9ca3af;font-size:11px">Recommendation</span><br/>
                <span style="font-size:11px;color:#4ade80">${p.recommendation || "N/A"}</span>
              </div>
            </div>`;
          layer.bindPopup(popupContent, {
            maxWidth: 320,
            className: "ward-popup",
          });
        },
      }).addTo(mapRef.current);
    });
  }, [geoData, viewMode, filteredData, wardsData.length, getFeatureColor]);

  // --- stats ---
  const avgAQI = filteredData.length
    ? Math.round(
        filteredData.reduce((s, w) => s + w.simulated_aqi, 0) /
          filteredData.length
      )
    : 0;
  const highRiskCount = filteredData.filter(
    (w) => w.risk_level === "High"
  ).length;
  const medRiskCount = filteredData.filter(
    (w) => w.risk_level === "Medium"
  ).length;

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">
            Loading Hyper-Local AQI Insights...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel p-8 text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">
            Connection Error
          </h3>
          <p className="text-sm text-white/50 mb-4">{error}</p>
          <button onClick={fetchData} className="btn-primary text-sm">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-4 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* ── HEADER ──────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-white/10">
              <span className="text-2xl">🌍</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Hyper-Local AQI Insights
              </h1>
              <p className="text-sm text-white/40">
                Ward-wise pollution analysis, ML-based risk scoring &
                policy recommendations
              </p>
            </div>
          </div>
        </div>

        {/* ── STAT CARDS ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<MapPin className="w-5 h-5" />}
            label="Wards Analyzed"
            value={String(filteredData.length)}
            accent="emerald"
          />
          <StatCard
            icon={<Wind className="w-5 h-5" />}
            label="Avg Simulated AQI"
            value={String(avgAQI)}
            accent={avgAQI > 200 ? "red" : avgAQI > 100 ? "yellow" : "emerald"}
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="High Risk Wards"
            value={String(highRiskCount)}
            accent="red"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Medium Risk Wards"
            value={String(medRiskCount)}
            accent="yellow"
          />
        </div>

        {/* ── FILTER BAR ─────────────────────────────────────── */}
        <div className="glass-panel p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filters</span>
            </div>

            <SelectFilter
              value={zoneFilter}
              onChange={setZoneFilter}
              placeholder="All Zones"
              options={zones}
            />
            <SelectFilter
              value={riskFilter}
              onChange={setRiskFilter}
              placeholder="All Risk Levels"
              options={["High", "Medium", "Low"]}
            />
            <SelectFilter
              value={sourceFilter}
              onChange={setSourceFilter}
              placeholder="All Sources"
              options={sources}
            />

            {(zoneFilter || riskFilter || sourceFilter) && (
              <button
                onClick={() => {
                  setZoneFilter("");
                  setRiskFilter("");
                  setSourceFilter("");
                }}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Clear All
              </button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              {(
                [
                  { id: "risk", label: "Risk", icon: AlertTriangle },
                  { id: "cluster", label: "Cluster", icon: Layers },
                  { id: "source", label: "Source", icon: Wind },
                ] as const
              ).map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      viewMode === mode.id
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {mode.label}
                  </button>
                );
              })}
            </div>

            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                autoRefresh
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-white/30 border border-white/10"
              }`}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  autoRefresh ? "animate-spin" : ""
                }`}
                style={autoRefresh ? { animationDuration: "3s" } : {}}
              />
              {autoRefresh ? "Live" : "Paused"}
            </button>
          </div>
          <div className="mt-2 text-[10px] text-white/20">
            Last updated: {lastRefresh.toLocaleTimeString()}
            {autoRefresh && " • Auto-refreshing every 30s"}
          </div>
        </div>

        {/* ── MAP ─────────────────────────────────────────────── */}
        <div className="glass-panel p-1 mb-6 relative overflow-hidden">
          <div
            ref={mapContainerRef}
            id="hyper-local-map"
            className="w-full rounded-xl"
            style={{ height: "520px", background: "#0a0a1a" }}
          />

          {/* Map legend overlay */}
          <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md rounded-lg p-3 border border-white/10 text-xs">
            <div className="font-bold text-white/70 mb-2">
              {viewMode === "risk"
                ? "Risk Level"
                : viewMode === "cluster"
                ? "Cluster"
                : "Pollution Source"}
            </div>
            {viewMode === "risk" &&
              Object.entries(RISK_COLORS)
                .filter(([k]) => k !== "Unknown")
                .map(([label, color]) => (
                  <div key={label} className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ background: color }}
                    />
                    <span className="text-white/60">{label}</span>
                  </div>
                ))}
            {viewMode === "cluster" &&
              Object.entries(CLUSTER_COLORS)
                .filter(([k]) => k !== "Unknown")
                .map(([label, color]) => (
                  <div key={label} className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ background: color }}
                    />
                    <span className="text-white/60">{label}</span>
                  </div>
                ))}
            {viewMode === "source" && (
              <span className="text-white/40">
                Colors by predicted source
              </span>
            )}
          </div>
        </div>

        {/* ── CHARTS ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pie: Pollution Source Distribution */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-white mb-1">
              Pollution Source Distribution
            </h3>
            <p className="text-xs text-white/30 mb-4">
              Predicted dominant source across {filteredData.length} wards
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={55}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name = "", percent = 0 }) =>
                    `${String(name).substring(0, 18)}${String(name).length > 18 ? ".." : ""} (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={{ stroke: "rgba(255,255,255,0.2)" }}
                >
                  {sourceDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a2e",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#e5e7eb",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar: Risk Level Distribution */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-white mb-1">
              Risk Level Distribution
            </h3>
            <p className="text-xs text-white/30 mb-4">
              Wards categorized by pollution risk index
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskDistribution}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a2e",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#e5e7eb",
                    fontSize: 12,
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}
                />
                <Bar
                  dataKey="count"
                  name="Number of Wards"
                  radius={[6, 6, 0, 0]}
                >
                  {riskDistribution.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={RISK_COLORS[entry.name] || "#6b7280"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── WARD TABLE ──────────────────────────────────────── */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                Ward Details
              </h3>
              <p className="text-xs text-white/30">
                Showing {filteredData.length} of {wardsData.length} wards
              </p>
            </div>
            <button
              onClick={fetchData}
              className="btn-secondary text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {[
                    "Ward",
                    "Zone",
                    "Population",
                    "Density",
                    "Risk",
                    "AQI",
                    "Cluster",
                    "Predicted Source",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-3 text-white/40 font-medium text-xs"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 50).map((w) => (
                  <tr
                    key={w.Ward_No}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-white font-medium">
                      {w.Ward_Name}
                    </td>
                    <td className="py-2.5 px-3 text-white/60">{w.Zone}</td>
                    <td className="py-2.5 px-3 text-white/60">
                      {w.Population?.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-white/60">
                      {w.Density}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: `${RISK_COLORS[w.risk_level]}20`,
                          color: RISK_COLORS[w.risk_level],
                          border: `1px solid ${RISK_COLORS[w.risk_level]}40`,
                        }}
                      >
                        {w.risk_level}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className="font-mono font-bold"
                        style={{
                          color:
                            w.simulated_aqi > 200
                              ? "#ef4444"
                              : w.simulated_aqi > 100
                              ? "#eab308"
                              : "#22c55e",
                        }}
                      >
                        {w.simulated_aqi}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className="text-xs"
                        style={{
                          color:
                            CLUSTER_COLORS[w.cluster_label] || "#9ca3af",
                        }}
                      >
                        {w.cluster_label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-white/50 text-xs max-w-[200px] truncate">
                      {w.predicted_source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length > 50 && (
              <p className="text-center text-xs text-white/20 mt-3">
                Showing first 50 of {filteredData.length} wards
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Leaflet popup/tooltip styles */}
      <style jsx global>{`
        .ward-tooltip {
          background: rgba(0, 0, 0, 0.85) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 8px !important;
          color: #e5e7eb !important;
          padding: 8px 12px !important;
          font-size: 12px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
        }
        .ward-tooltip::before {
          border-top-color: rgba(0, 0, 0, 0.85) !important;
        }
        .ward-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          border-radius: 8px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
          padding: 0 !important;
        }
        .ward-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .ward-popup .leaflet-popup-tip {
          background: #1a1a2e !important;
        }
        .ward-popup .leaflet-popup-close-button {
          color: rgba(255, 255, 255, 0.5) !important;
          font-size: 18px !important;
          top: 6px !important;
          right: 8px !important;
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "emerald" | "red" | "yellow" | "cyan";
}) {
  const colors = {
    emerald: {
      bg: "from-emerald-500/10 to-emerald-500/5",
      border: "border-emerald-500/20",
      text: "text-emerald-400",
      icon: "text-emerald-500/60",
    },
    red: {
      bg: "from-red-500/10 to-red-500/5",
      border: "border-red-500/20",
      text: "text-red-400",
      icon: "text-red-500/60",
    },
    yellow: {
      bg: "from-yellow-500/10 to-yellow-500/5",
      border: "border-yellow-500/20",
      text: "text-yellow-400",
      icon: "text-yellow-500/60",
    },
    cyan: {
      bg: "from-cyan-500/10 to-cyan-500/5",
      border: "border-cyan-500/20",
      text: "text-cyan-400",
      icon: "text-cyan-500/60",
    },
  };
  const c = colors[accent];

  return (
    <div
      className={`glass-card bg-gradient-to-br ${c.bg} ${c.border} border p-4`}
    >
      <div className={`${c.icon} mb-2`}>{icon}</div>
      <div className={`text-2xl font-bold ${c.text}`}>{value}</div>
      <div className="text-xs text-white/40 mt-0.5">{label}</div>
    </div>
  );
}

function SelectFilter({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 pr-8 text-xs text-white/70 focus:outline-none focus:border-emerald-500/40 transition-colors cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-gray-900">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
    </div>
  );
}
