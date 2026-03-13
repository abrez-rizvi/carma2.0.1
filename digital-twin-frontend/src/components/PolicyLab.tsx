"use client";

import { useGlobalState } from "../context/GlobalStateContext";
import { Reveal } from "./Reveal";
import {
  SlidersHorizontal,
  Car,
  Factory,
  Bus,
  HardHat,
  Leaf,
  TrendingDown,
  Wind,
  DollarSign,
} from "lucide-react";

const POLICY_CONTROLS = [
  {
    id: "ev_subsidy",
    label: "EV Subsidy Level",
    description: "Subsidize electric vehicle adoption",
    icon: Car,
    sector: "Ground_Transport",
    weight: 0.4,
    unit: "%",
    color: "emerald",
  },
  {
    id: "carbon_tax",
    label: "Industrial Carbon Tax",
    description: "Tax on industrial CO₂ emissions",
    icon: Factory,
    sector: "Industry",
    weight: 0.35,
    unit: "%",
    color: "amber",
  },
  {
    id: "public_transit",
    label: "Public Transport Investment",
    description: "Expand metro, bus networks",
    icon: Bus,
    sector: "Ground_Transport",
    weight: 0.3,
    unit: "%",
    color: "cyan",
  },
  {
    id: "dust_regulation",
    label: "Construction Dust Regulation",
    description: "Regulate construction site emissions",
    icon: HardHat,
    sector: "Residential",
    weight: 0.25,
    unit: "%",
    color: "rose",
  },
  {
    id: "energy_transition",
    label: "Energy Transition Incentive",
    description: "Shift from fossil to renewable energy",
    icon: Leaf,
    sector: "Power",
    weight: 0.45,
    unit: "%",
    color: "green",
  },
];

/** Calculate estimated impacts based on slider values */
function calculateEstimatedImpacts(policyValues: Record<string, number>) {
  // Sum sector reductions from all policies
  const sectorReductions: Record<string, number> = {};
  POLICY_CONTROLS.forEach((pc) => {
    const val = policyValues[pc.id] || 0;
    const reduction = val * pc.weight;
    sectorReductions[pc.sector] =
      (sectorReductions[pc.sector] || 0) + reduction;
  });

  // Cap each sector at 90%
  Object.keys(sectorReductions).forEach((s) => {
    sectorReductions[s] = Math.min(sectorReductions[s], 90);
  });

  // Sector weights from the backend model
  const sectorWeights: Record<string, number> = {
    Ground_Transport: 0.25,
    Industry: 0.35,
    Power: 0.2,
    Residential: 0.12,
    Aviation: 0.08,
  };

  const totalReduction = Object.entries(sectorReductions).reduce(
    (acc, [sector, reduction]) => {
      return acc + (sectorWeights[sector] || 0) * (reduction / 100);
    },
    0
  );

  const co2Reduction = totalReduction * 100;
  const aqiImprovement = co2Reduction * 0.6;

  // GDP change: higher investment → slight GDP drag short-term, but net positive from savings
  const totalInvestment = Object.values(policyValues).reduce(
    (a, b) => a + b,
    0
  );
  const avgInvestment = totalInvestment / POLICY_CONTROLS.length;
  const gdpChange = avgInvestment > 50 ? -0.3 + avgInvestment * 0.008 : avgInvestment * 0.005;

  return { co2Reduction, aqiImprovement, gdpChange, sectorReductions };
}

const COLOR_CLASSES: Record<string, string> = {
  emerald: "from-emerald-500 to-emerald-600",
  amber: "from-amber-500 to-amber-600",
  cyan: "from-cyan-500 to-cyan-600",
  rose: "from-rose-500 to-rose-600",
  green: "from-green-500 to-green-600",
};

const ACCENT_CLASSES: Record<string, string> = {
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  cyan: "text-cyan-400",
  rose: "text-rose-400",
  green: "text-green-400",
};

export function PolicyLab() {
  const { policyValues, updatePolicyValue } = useGlobalState();

  const impacts = calculateEstimatedImpacts(policyValues);

  return (
    <section id="policy-lab" className="py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <Reveal>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-white/10">
              <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Policy Lab</h2>
              <p className="text-sm text-white/40">
                Adjust policy interventions and see estimated impacts in
                real-time
              </p>
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Policy Sliders */}
          <div className="lg:col-span-2 space-y-4">
            {POLICY_CONTROLS.map((pc, idx) => {
              const Icon = pc.icon;
              const val = policyValues[pc.id] || 0;
              const accentClass = ACCENT_CLASSES[pc.color] || "text-emerald-400";
              const gradientClass = COLOR_CLASSES[pc.color] || "from-emerald-500 to-emerald-600";
              return (
                <Reveal key={pc.id} delay={idx * 80}>
                  <div className="glass-panel p-5 group hover:border-white/20 transition-all">
                    <div className="flex items-center gap-4 mb-3">
                      <div className={`p-2 bg-white/5 rounded-lg ${accentClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white">
                          {pc.label}
                        </h4>
                        <p className="text-xs text-white/40">{pc.description}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold tabular-nums ${accentClass}`}>
                          {val}
                          <span className="text-sm text-white/30 ml-0.5">%</span>
                        </div>
                      </div>
                    </div>

                    {/* Slider */}
                    <div className="relative">
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${gradientClass} rounded-full transition-all duration-200`}
                          style={{ width: `${val}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={val}
                        onChange={(e) =>
                          updatePolicyValue(pc.id, parseInt(e.target.value))
                        }
                        className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                      />
                    </div>

                    {/* Sector & Impact */}
                    <div className="flex items-center justify-between mt-2 text-[10px] text-white/30">
                      <span className="uppercase tracking-wider">
                        Affects: {pc.sector.replace("_", " ")}
                      </span>
                      <span>
                        Est. sector reduction:{" "}
                        {(val * pc.weight).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* Live Impact Preview */}
          <div className="lg:col-span-1">
            <Reveal delay={200}>
              <div className="glass-panel p-6 sticky top-44">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Impact Estimate
                </div>

                {/* CO₂ */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-white/70">
                      CO₂ Reduction
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-emerald-400 tabular-nums">
                    {impacts.co2Reduction.toFixed(1)}%
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(impacts.co2Reduction, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* AQI */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Wind className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-white/70">
                      AQI Improvement
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-cyan-400 tabular-nums">
                    {impacts.aqiImprovement.toFixed(1)}%
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(impacts.aqiImprovement, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* GDP */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-white/70">GDP Impact</span>
                  </div>
                  <div
                    className={`text-3xl font-bold tabular-nums ${
                      impacts.gdpChange >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {impacts.gdpChange >= 0 ? "+" : ""}
                    {impacts.gdpChange.toFixed(2)}%
                  </div>
                </div>

                {/* Sector Breakdown */}
                <div className="border-t border-white/10 pt-4">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3">
                    Sector Reduction Preview
                  </div>
                  {Object.entries(impacts.sectorReductions).map(
                    ([sector, red]) => (
                      <div
                        key={sector}
                        className="flex items-center justify-between text-xs mb-2"
                      >
                        <span className="text-white/50">
                          {sector.replace("_", " ")}
                        </span>
                        <span className="text-emerald-400 font-mono font-bold">
                          -{red.toFixed(1)}%
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

export { POLICY_CONTROLS, calculateEstimatedImpacts };
