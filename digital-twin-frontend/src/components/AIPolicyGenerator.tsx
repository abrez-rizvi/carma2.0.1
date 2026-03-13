"use client";

import { useState } from "react";
import { useGlobalState } from "../context/GlobalStateContext";
import { Reveal } from "./Reveal";
import { Sparkles, Target, Wallet, Clock, Zap, ChevronDown } from "lucide-react";

const PRESET_POLICIES: Record<string, Record<string, number>> = {
  "aggressive-high": {
    ev_subsidy: 70,
    carbon_tax: 60,
    public_transit: 80,
    dust_regulation: 90,
    energy_transition: 50,
  },
  "aggressive-medium": {
    ev_subsidy: 55,
    carbon_tax: 50,
    public_transit: 65,
    dust_regulation: 70,
    energy_transition: 40,
  },
  "moderate-high": {
    ev_subsidy: 40,
    carbon_tax: 30,
    public_transit: 50,
    dust_regulation: 60,
    energy_transition: 30,
  },
  "moderate-medium": {
    ev_subsidy: 30,
    carbon_tax: 25,
    public_transit: 40,
    dust_regulation: 45,
    energy_transition: 25,
  },
  "conservative-low": {
    ev_subsidy: 15,
    carbon_tax: 10,
    public_transit: 20,
    dust_regulation: 25,
    energy_transition: 15,
  },
  "default": {
    ev_subsidy: 25,
    carbon_tax: 20,
    public_transit: 35,
    dust_regulation: 40,
    energy_transition: 20,
  },
};

function getPresetKey(targetAQI: number, budget: string): string {
  if (targetAQI <= 100) {
    return budget === "High" ? "aggressive-high" : budget === "Medium" ? "aggressive-medium" : "moderate-high";
  }
  if (targetAQI <= 150) {
    return budget === "High" ? "moderate-high" : budget === "Medium" ? "moderate-medium" : "conservative-low";
  }
  return budget === "High" ? "moderate-medium" : "conservative-low";
}

export function AIPolicyGenerator() {
  const { setPolicyValues } = useGlobalState();
  const [targetAQI, setTargetAQI] = useState(100);
  const [budget, setBudget] = useState("Medium");
  const [timeline, setTimeline] = useState("3yr");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerated(false);

    // Simulate a brief delay for UX
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const key = getPresetKey(targetAQI, budget);
    const values = PRESET_POLICIES[key] || PRESET_POLICIES.default;

    // Scale based on timeline
    const timelineScale = timeline === "1yr" ? 1.3 : timeline === "5yr" ? 0.7 : 1.0;
    const scaled: Record<string, number> = {};
    Object.entries(values).forEach(([k, v]) => {
      scaled[k] = Math.min(100, Math.round(v * timelineScale));
    });

    setPolicyValues(scaled);
    setIsGenerating(false);
    setGenerated(true);
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="glass-panel p-6 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none" />

            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-white/10">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">AI Policy Generator</h3>
                <p className="text-xs text-white/40">
                  Auto-generate a policy bundle based on your targets
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
              {/* Target AQI */}
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5 block">
                  <Target className="w-3 h-3" />
                  Target AQI
                </label>
                <input
                  type="number"
                  value={targetAQI}
                  onChange={(e) => setTargetAQI(parseInt(e.target.value) || 100)}
                  min={50}
                  max={300}
                  className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-mono"
                />
              </div>

              {/* Budget */}
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5 block">
                  <Wallet className="w-3 h-3" />
                  Budget
                </label>
                <div className="relative">
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-purple-500/50 appearance-none cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <option value="Low" className="bg-slate-900">Low</option>
                    <option value="Medium" className="bg-slate-900">Medium</option>
                    <option value="High" className="bg-slate-900">High</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                </div>
              </div>

              {/* Timeline */}
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5 block">
                  <Clock className="w-3 h-3" />
                  Timeline
                </label>
                <div className="relative">
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-purple-500/50 appearance-none cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <option value="1yr" className="bg-slate-900">1 Year</option>
                    <option value="3yr" className="bg-slate-900">3 Years</option>
                    <option value="5yr" className="bg-slate-900">5 Years</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex items-end">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                    isGenerating
                      ? "bg-white/5 text-white/30 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/20 hover:shadow-purple-500/30"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Generate Policy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Success Message */}
            {generated && (
              <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300">
                  Policy bundle generated and applied to sliders above! Target AQI: {targetAQI}, Budget: {budget}, Timeline: {timeline}.
                </span>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
