import React from "react";
import { ClipboardList, Target, BarChart2 } from "lucide-react";
import type { Impact } from "../types";


interface ImpactPanelProps {
  impact: Impact | null;
  policy?: {
    name: string;
    description: string;
    mutations: Array<{
      type: string;
      reason: string;
    }>;
  } | null;
}

export function ImpactPanel({ impact, policy }: ImpactPanelProps) {
  if (!impact) {
    return null;
  }

  const co2Change = impact.co2.change_pct;
  const aiqChange = impact.aqi.change_pct;

  return (
    <div className="w-full p-6 glass-panel hover:shadow-[0_8px_32px_rgba(217,2,130,0.15)] transition-all duration-300">
      {/* Policy Details */}
      {policy && (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />

          <div className="flex items-start gap-3 relative z-10">
            <ClipboardList className="w-6 h-6 text-green-400 mt-1" />
            <div className="flex-1">
              <h4 className="font-bold text-white text-lg tracking-tight">{policy.name}</h4>
              <p className="text-white/70 text-sm mt-1 leading-relaxed">{policy.description}</p>
              {policy.mutations && policy.mutations.length > 0 && (
                <div className="mt-3 text-xs text-white/50 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/5">
                    {policy.mutations.length} mutations
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center mb-5 gap-2">
        <Target className="w-5 h-5 text-secondary" />
        <h3 className="text-lg font-bold text-white">Impact Analysis</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* CO₂ Impact */}
        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-transparent rounded-xl border border-blue-500/20 relative group">
          <div className="flex justify-between items-start mb-2">
            <span className="font-semibold text-xs text-blue-300 uppercase tracking-wider">CO₂ Emissions</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span
              className={`text-2xl font-bold tabular-nums drop-shadow-sm ${co2Change < 0 ? "text-secondary" : "text-green-500"
                }`}
            >
              {co2Change > 0 ? "+" : ""}
              {co2Change.toFixed(1)}%
            </span>
          </div>

          <div className="text-xs text-white/40 font-mono mb-3">
            {impact.co2.baseline.toFixed(0)} → {impact.co2.post_policy.toFixed(0)}
          </div>

          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
              style={{ width: Math.min(100, Math.max(20, (impact.co2.post_policy / Math.max(impact.co2.baseline, impact.co2.post_policy)) * 100)) + '%' }}
            ></div>
          </div>
        </div>

        {/* AQI Impact */}
        <div className="p-4 bg-gradient-to-br from-orange-500/10 to-transparent rounded-xl border border-orange-500/20">
          <div className="flex justify-between items-start mb-2">
            <span className="font-semibold text-xs text-orange-300 uppercase tracking-wider">AQI Level</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span
              className={`text-2xl font-bold tabular-nums drop-shadow-sm ${aiqChange < 0 ? "text-[#00ff9d]" : "text-green-500"
                }`}
            >
              {aiqChange > 0 ? "+" : ""}
              {aiqChange.toFixed(1)}%
            </span>
          </div>

          <div className="text-xs text-white/40 font-mono mb-3">
            {impact.aqi.baseline.toFixed(0)} → {impact.aqi.post_policy.toFixed(0)}
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 shadow-[0_0_10px_#f97316]"
              style={{ width: Math.min(100, Math.max(20, (impact.aqi.post_policy / Math.max(impact.aqi.baseline, impact.aqi.post_policy)) * 100)) + '%' }}
            ></div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="p-4 bg-gradient-to-br from-purple-500/10 to-transparent rounded-xl border border-purple-500/20">
          <div className="text-xs font-semibold mb-3 text-purple-300 uppercase tracking-wider">Network Effect</div>
          <div className="text-xs text-white/70 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/50">Improved:</span>
              <span className="text-[#00ff9d] font-bold">
                {impact.cascade_analysis.summary.nodes_with_reduction}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50">Worsened:</span>
              <span className="text-red-500 font-bold">
                {impact.cascade_analysis.summary.nodes_with_increase}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <span className="text-white/50">Avg Shift:</span>
              <span className={`font-bold tabular-nums ${impact.cascade_analysis.summary.avg_change_pct < 0 ? 'text-secondary' : 'text-green-500'}`}>
                {impact.cascade_analysis.summary.avg_change_pct > 0 ? '+' : ''}
                {impact.cascade_analysis.summary.avg_change_pct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Most Affected Sectors */}
      {impact.cascade_analysis.most_affected_nodes.length > 0 && (
        <div className="mt-6 pt-5 border-t border-white/10">
          <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4" /> Ripple Effects (Top 5)
          </h4>
          <div className="flex flex-wrap gap-2">
            {impact.cascade_analysis.most_affected_nodes.slice(0, 5).map(
              ([nodeId, change]) => (
                <div
                  key={nodeId}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-200 flex items-center gap-2 ${change < 0
                    ? "bg-secondary/10 border-secondary/20 text-secondary"
                    : "bg-green-500/10 border-green-500/20 text-green-400"
                    }`}
                >
                  <span className="font-semibold">{nodeId}</span>
                  <span className="opacity-80">
                    {change > 0 ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%
                  </span>
                </div>
              )
            )}
            {impact.cascade_analysis.most_affected_nodes.length > 5 && (
              <div className="px-2 py-1.5 text-xs text-white/30 italic">
                +{impact.cascade_analysis.most_affected_nodes.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ProgressBar component not currently used
/*
interface ProgressBarProps {
  from: number;
  to: number;
  label?: string;
}

function ProgressBar({ from, to, label }: ProgressBarProps) {
  const maxVal = Math.max(from, to) * 1.1;
  const fromPercent = (from / maxVal) * 100;
  const toPercent = (to / maxVal) * 100;

  return (
    <div className="space-y-1">
      {label && <div className="text-xs text-gray-500">{label}</div>}
      <div className="flex gap-2 items-center">
        <div className="flex-1 h-4 bg-gray-200 rounded overflow-hidden">
          <div
            className="h-full bg-blue-400 transition-all duration-300"
            style={{ width: `${fromPercent}%` }}
          />
        </div>
        <span className="text-xs text-gray-600 w-6 text-right">
          {from.toFixed(0)}
        </span>
      </div>
      <div className="flex gap-2 items-center">
        <div className="flex-1 h-4 bg-gray-200 rounded overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              to < from ? "bg-green-400" : "bg-red-400"
            }`}
            style={{ width: `${toPercent}%` }}
          />
        </div>
        <span className="text-xs text-gray-600 w-6 text-right">
          {to.toFixed(0)}
        </span>
      </div>
    </div>
  );
}
*/
