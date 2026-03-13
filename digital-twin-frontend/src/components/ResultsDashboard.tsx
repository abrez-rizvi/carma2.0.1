"use client";

import { useGlobalState } from "../context/GlobalStateContext";
import { Reveal } from "./Reveal";
import {
  BarChart3,
  TrendingDown,
  Wind,
  DollarSign,
  Heart,
  Activity,
  ArrowDown,
  ArrowUp,
  Save,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";

/** Generate mock forecast data for visualization */
function generateForecastData(
  co2Reduction: number,
  months: number = 12
): Array<{ month: string; baseline: number; withPolicy: number }> {
  const data = [];
  const now = new Date();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthStr = d.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
    const baseline = 35 + Math.sin(i * 0.5) * 8 + Math.random() * 4;
    const withPol = baseline * (1 - co2Reduction / 100);
    data.push({
      month: monthStr,
      baseline: parseFloat(baseline.toFixed(2)),
      withPolicy: parseFloat(withPol.toFixed(2)),
    });
  }
  return data;
}

interface ResultsDashboardProps {
  onSaveScenario?: () => void;
}

export function ResultsDashboard({ onSaveScenario }: ResultsDashboardProps) {
  const { latestResult, isSimulating } = useGlobalState();

  if (isSimulating) {
    return (
      <section id="results" className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-white/60 animate-pulse text-lg">
                Running simulation model...
              </div>
              <p className="text-xs text-white/30 max-w-md text-center">
                Calculating sector-specific emission reductions, AQI projections, and economic impacts
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!latestResult) {
    return (
      <section id="results" className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-white/10">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Results Dashboard
                </h2>
                <p className="text-sm text-white/40">
                  Simulation outputs will appear here after running
                </p>
              </div>
            </div>
          </Reveal>
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-white/10 rounded-2xl">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">
                Adjust policies above and click <strong className="text-emerald-400">Run Simulation</strong> to see results
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const { metrics } = latestResult;
  const forecastData = generateForecastData(metrics.co2Reduction);

  const chartTooltipStyle: React.CSSProperties = {
    backgroundColor: "rgba(15, 5, 24, 0.95)",
    borderColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
  };

  return (
    <section id="results" className="py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <Reveal>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-white/10">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Results Dashboard
                </h2>
                <p className="text-sm text-white/40">
                  Scenario: {latestResult.name}
                </p>
              </div>
            </div>
            {onSaveScenario && (
              <button
                onClick={onSaveScenario}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Scenario
              </button>
            )}
          </div>
        </Reveal>

        {/* Summary Metrics */}
        <Reveal delay={100}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] text-emerald-400/60 uppercase tracking-wider">
                  CO₂ Reduction
                </span>
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {metrics.co2Reduction.toFixed(1)}%
              </div>
            </div>
            <div className="bg-cyan-500/10 p-4 rounded-xl border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-1">
                <Wind className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] text-cyan-400/60 uppercase tracking-wider">
                  AQI Improvement
                </span>
              </div>
              <div className="text-2xl font-bold text-cyan-400">
                {metrics.aqiImprovement.toFixed(1)}%
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${metrics.gdpChange >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] text-white/40 uppercase tracking-wider">
                  GDP Impact
                </span>
              </div>
              <div className={`text-2xl font-bold ${metrics.gdpChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.gdpChange >= 0 ? "+" : ""}{metrics.gdpChange.toFixed(2)}%
              </div>
            </div>
            <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/30">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-4 h-4 text-rose-400" />
                <span className="text-[10px] text-rose-400/60 uppercase tracking-wider">
                  Health Benefit
                </span>
              </div>
              <div className="text-2xl font-bold text-rose-400">
                ₹{metrics.healthBenefit.toFixed(0)} Cr
              </div>
            </div>
            <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/30">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] text-purple-400/60 uppercase tracking-wider">
                  Lives Saved Est.
                </span>
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {Math.round(metrics.co2Reduction * 120)}+
              </div>
            </div>
          </div>
        </Reveal>

        {/* Forecast Chart */}
        <Reveal delay={200}>
          <div className="glass-panel p-6 mb-8">
            <div className="text-xs text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
              📈 Emission Forecast Comparison
              <span className="text-blue-400 font-bold">{new Date().getFullYear()}</span>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastData}>
                  <defs>
                    <linearGradient id="resultPolicyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="rgba(255,255,255,0.4)"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.4)"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                    tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    domain={["auto", "auto"]}
                    label={{ value: "kt CO₂/month", angle: -90, position: "insideLeft", fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: "#fff" }} />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Area type="monotone" dataKey="withPolicy" fill="url(#resultPolicyGrad)" stroke="transparent" legendType="none" />
                  <Line type="monotone" dataKey="baseline" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Baseline (No Policy)" />
                  <Line type="monotone" dataKey="withPolicy" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} name="With Policy" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>

        {/* Sector Impact Breakdown */}
        <Reveal delay={300}>
          <div className="glass-panel p-6">
            <div className="text-xs text-white/40 uppercase tracking-wider mb-4">
              Sector Impact Breakdown
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(metrics.sectorEmissions).map(([sector, reduction]) => {
                const isReduction = reduction > 0;
                return (
                  <div
                    key={sector}
                    className={`p-3 rounded-xl border ${
                      isReduction
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-white/60">
                        {sector.replace("_", " ")}
                      </span>
                    </div>
                    <div className={`text-lg font-bold flex items-center gap-1 ${
                      isReduction ? "text-emerald-400" : "text-white/40"
                    }`}>
                      {isReduction ? (
                        <ArrowDown className="w-4 h-4" />
                      ) : (
                        <ArrowUp className="w-4 h-4" />
                      )}
                      {Math.abs(reduction).toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
