"use client";

import { useGlobalState } from "../context/GlobalStateContext";
import { Reveal } from "./Reveal";
import { GitCompare, Trash2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const COLORS = ["#6b7280", "#10b981", "#a855f7"];
const NAMES = ["Baseline", "User Policy", "AI Generated"];

export function ScenarioComparison() {
  const { simulationResults, clearScenarios } = useGlobalState();

  if (simulationResults.length === 0) {
    return (
      <section id="comparison" className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center border border-white/10">
                <GitCompare className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Scenario Comparison
                </h2>
                <p className="text-sm text-white/40">
                  Save scenarios from the Results Dashboard to compare them here
                </p>
              </div>
            </div>
          </Reveal>
          <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-white/10 rounded-2xl">
            <div className="text-center">
              <GitCompare className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">
                No saved scenarios yet. Run simulations and save them to compare.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Build bar chart data
  const barData = [
    {
      metric: "CO₂ Reduction",
      ...Object.fromEntries(
        simulationResults.map((s, i) => [
          NAMES[i] || s.name,
          s.metrics.co2Reduction,
        ])
      ),
    },
    {
      metric: "AQI Improvement",
      ...Object.fromEntries(
        simulationResults.map((s, i) => [
          NAMES[i] || s.name,
          s.metrics.aqiImprovement,
        ])
      ),
    },
    {
      metric: "Health Benefit (×100 Cr)",
      ...Object.fromEntries(
        simulationResults.map((s, i) => [
          NAMES[i] || s.name,
          s.metrics.healthBenefit / 100,
        ])
      ),
    },
  ];

  // Build radar data
  const radarData = [
    { metric: "CO₂", fullMark: 50 },
    { metric: "AQI", fullMark: 50 },
    { metric: "GDP", fullMark: 2 },
    { metric: "Health", fullMark: 30 },
    { metric: "Cost Eff.", fullMark: 50 },
  ].map((m) => {
    const entry: Record<string, unknown> = { metric: m.metric };
    simulationResults.forEach((s, i) => {
      const name = NAMES[i] || s.name;
      if (m.metric === "CO₂") entry[name] = s.metrics.co2Reduction;
      else if (m.metric === "AQI") entry[name] = s.metrics.aqiImprovement;
      else if (m.metric === "GDP") entry[name] = Math.max(0, s.metrics.gdpChange + 1);
      else if (m.metric === "Health") entry[name] = s.metrics.healthBenefit / 100;
      else entry[name] = s.metrics.co2Reduction * 0.8;
    });
    return entry;
  });

  const chartTooltipStyle: React.CSSProperties = {
    backgroundColor: "rgba(15, 5, 24, 0.95)",
    borderColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: "12px",
  };

  return (
    <section id="comparison" className="py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <Reveal>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center border border-white/10">
                <GitCompare className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Scenario Comparison
                </h2>
                <p className="text-sm text-white/40">
                  {simulationResults.length} scenarios saved
                </p>
              </div>
            </div>
            <button
              onClick={clearScenarios}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          </div>
        </Reveal>

        {/* Comparison Table */}
        <Reveal delay={100}>
          <div className="glass-panel p-6 mb-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-3 text-white/40 text-xs uppercase tracking-wider">
                    Metric
                  </th>
                  {simulationResults.map((s, i) => (
                    <th
                      key={s.id}
                      className="text-right py-3 px-3 text-xs uppercase tracking-wider"
                      style={{ color: COLORS[i] }}
                    >
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "CO₂ Reduction", key: "co2Reduction", suffix: "%" },
                  { label: "AQI Improvement", key: "aqiImprovement", suffix: "%" },
                  { label: "GDP Impact", key: "gdpChange", suffix: "%" },
                  { label: "Health Benefit", key: "healthBenefit", suffix: " Cr" },
                ].map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="py-3 px-3 text-white/60">{row.label}</td>
                    {simulationResults.map((s, i) => {
                      const val = s.metrics[row.key as keyof typeof s.metrics];
                      const numVal = typeof val === 'number' ? val : 0;
                      return (
                        <td
                          key={s.id}
                          className="py-3 px-3 text-right font-mono font-bold"
                          style={{ color: COLORS[i] }}
                        >
                          {numVal.toFixed(1)}{row.suffix}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <Reveal delay={200}>
            <div className="glass-panel p-6">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-4">
                Metric Comparison
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="metric"
                      stroke="rgba(255,255,255,0.4)"
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.4)"
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend />
                    {simulationResults.map((s, i) => (
                      <Bar
                        key={s.id}
                        dataKey={NAMES[i] || s.name}
                        fill={COLORS[i]}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Reveal>

          {/* Radar Chart */}
          <Reveal delay={300}>
            <div className="glass-panel p-6">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-4">
                Multi-Dimensional Comparison
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                    />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    {simulationResults.map((s, i) => (
                      <Radar
                        key={s.id}
                        name={s.name}
                        dataKey={NAMES[i] || s.name}
                        stroke={COLORS[i]}
                        fill={COLORS[i]}
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    ))}
                    <Legend />
                    <Tooltip contentStyle={chartTooltipStyle} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
