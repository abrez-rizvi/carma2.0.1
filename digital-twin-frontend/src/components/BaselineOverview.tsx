"use client";

import { useGlobalState } from "../context/GlobalStateContext";
import { AQITrends } from "./AQITrends";
import { HistoricEmissions } from "./HistoricEmissions";
import { EmissionForecast } from "./EmissionForecast";
import { Reveal } from "./Reveal";
import {
  BarChart3,
  Heart,
  DollarSign,
  Wind,
  Activity,
  TrendingDown,
} from "lucide-react";

export function BaselineOverview() {
  const { aqiData } = useGlobalState();
  const currentAQI = aqiData?.aqi ?? 0;

  return (
    <section id="baseline" className="py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <Reveal>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-white/10">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Baseline Overview
              </h2>
              <p className="text-sm text-white/40">
                Current environmental and economic conditions
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-white/40 font-mono uppercase">
                Live Data
              </span>
            </div>
          </div>
        </Reveal>

        {/* KPI Summary Cards */}
        <Reveal delay={100}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {/* AQI */}
            <div className="glass-panel p-4 text-center group hover:border-cyan-500/30 transition-colors">
              <Wind className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {Math.round(currentAQI)}
              </div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
                Current AQI
              </div>
            </div>

            {/* PM2.5 */}
            <div className="glass-panel p-4 text-center group hover:border-rose-500/30 transition-colors">
              <Activity className="w-5 h-5 text-rose-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {aqiData?.pm2_5?.toFixed(1) ?? "--"}
              </div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
                PM2.5 µg/m³
              </div>
            </div>

            {/* Avg Emissions */}
            <div className="glass-panel p-4 text-center group hover:border-amber-500/30 transition-colors">
              <TrendingDown className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">38.8</div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
                CO₂ kt/mo Avg
              </div>
            </div>

            {/* Health Impact */}
            <div className="glass-panel p-4 text-center group hover:border-red-500/30 transition-colors">
              <Heart className="w-5 h-5 text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">Moderate</div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
                Respiratory Risk
              </div>
            </div>

            {/* Healthcare Costs */}
            <div className="glass-panel p-4 text-center group hover:border-purple-500/30 transition-colors">
              <DollarSign className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">₹1,200 Cr</div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
                Healthcare Cost/yr
              </div>
            </div>

            {/* Productivity Loss */}
            <div className="glass-panel p-4 text-center group hover:border-orange-500/30 transition-colors">
              <DollarSign className="w-5 h-5 text-orange-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">₹850 Cr</div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
                Productivity Loss/yr
              </div>
            </div>
          </div>
        </Reveal>

        {/* Charts Row 1: Emission Forecast + AQI Trends */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <Reveal delay={200} className="flex-1">
            <EmissionForecast />
          </Reveal>
          <Reveal delay={300} className="flex-1">
            <AQITrends />
          </Reveal>
        </div>

        {/* Charts Row 2: Historic Monthly Trends */}
        <Reveal delay={400}>
          <HistoricEmissions />
        </Reveal>
      </div>
    </section>
  );
}
