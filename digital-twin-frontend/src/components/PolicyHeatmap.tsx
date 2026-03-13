"use client";

import { useGlobalState } from "../context/GlobalStateContext";
import { Reveal } from "./Reveal";
import { Grid3X3 } from "lucide-react";

const SECTORS = [
  { id: "Ground_Transport", label: "Transport" },
  { id: "Industry", label: "Industry" },
  { id: "Power", label: "Power" },
  { id: "Residential", label: "Residential" },
  { id: "Aviation", label: "Aviation" },
];

const METRICS = [
  { id: "emissions", label: "Emissions Reduction" },
  { id: "aqi", label: "AQI Contribution" },
  { id: "economic", label: "Economic Output" },
  { id: "health", label: "Health Impact" },
];

/** Get color based on value (-100 to 100 scale) */
function getHeatColor(value: number): string {
  if (value > 0) {
    // Green scale for improvement
    const intensity = Math.min(value / 50, 1);
    return `rgba(16, 185, 129, ${0.1 + intensity * 0.6})`;
  } else if (value < 0) {
    // Red scale for deterioration
    const intensity = Math.min(Math.abs(value) / 50, 1);
    return `rgba(239, 68, 68, ${0.1 + intensity * 0.6})`;
  }
  return "rgba(255, 255, 255, 0.03)";
}

function getTextColor(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-white/30";
}

/** Generate placeholder heatmap values from simulation results */
function getHeatmapData(
  sectorEmissions: Record<string, number>
): Record<string, Record<string, number>> {
  const data: Record<string, Record<string, number>> = {};

  SECTORS.forEach((sector) => {
    const emissionReduction = sectorEmissions[sector.id] || 0;
    data[sector.id] = {
      emissions: emissionReduction,
      aqi: emissionReduction * 0.65, // AQI roughly tracks emissions
      economic: emissionReduction > 20 ? -(emissionReduction * 0.15) : emissionReduction * 0.1,
      health: emissionReduction * 0.8,
    };
  });

  return data;
}

export function PolicyHeatmap() {
  const { latestResult } = useGlobalState();

  const heatmapData = latestResult
    ? getHeatmapData(latestResult.metrics.sectorEmissions)
    : null;

  return (
    <section id="heatmap" className="py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <Reveal>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center border border-white/10">
              <Grid3X3 className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Policy Impact Heatmap
              </h2>
              <p className="text-sm text-white/40">
                Sector × metric impact matrix
              </p>
            </div>
            {/* Legend */}
            <div className="ml-auto flex items-center gap-4 text-xs text-white/40">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-3 rounded" style={{ backgroundColor: "rgba(16, 185, 129, 0.5)" }} />
                <span>Improvement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-3 rounded" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }} />
                <span>Neutral</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-3 rounded" style={{ backgroundColor: "rgba(239, 68, 68, 0.5)" }} />
                <span>Deterioration</span>
              </div>
            </div>
          </div>
        </Reveal>

        {!heatmapData ? (
          <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-white/10 rounded-2xl">
            <div className="text-center">
              <Grid3X3 className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">
                Run a simulation to see the impact heatmap
              </p>
            </div>
          </div>
        ) : (
          <Reveal delay={100}>
            <div className="glass-panel p-6 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-4 text-xs text-white/30 uppercase tracking-wider w-36">
                      Sector
                    </th>
                    {METRICS.map((m) => (
                      <th
                        key={m.id}
                        className="text-center py-3 px-4 text-xs text-white/30 uppercase tracking-wider"
                      >
                        {m.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SECTORS.map((sector) => (
                    <tr key={sector.id} className="border-t border-white/5">
                      <td className="py-4 px-4 text-sm font-medium text-white/70">
                        {sector.label}
                      </td>
                      {METRICS.map((metric) => {
                        const val = heatmapData[sector.id]?.[metric.id] || 0;
                        return (
                          <td key={metric.id} className="py-4 px-4">
                            <div
                              className="rounded-lg p-3 text-center transition-all duration-300 hover:scale-105"
                              style={{ backgroundColor: getHeatColor(val) }}
                            >
                              <div
                                className={`text-lg font-bold font-mono ${getTextColor(val)}`}
                              >
                                {val > 0 ? "+" : ""}
                                {val.toFixed(1)}%
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
