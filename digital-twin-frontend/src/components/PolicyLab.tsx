"use client";

import { useState, useEffect } from "react";
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
  Zap,
  Check,
  AlertTriangle,
  Shield,
  Flame,
  Wheat,
  Building2,
  Receipt,
  PiggyBank,
  HeartPulse,
  TrendingUp,
} from "lucide-react";

// ============================================================================
// POLICY SLIDER CONTROLS
// ============================================================================

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

// ============================================================================
// MITIGATION POLICY PRESETS
// ============================================================================

interface MitigationPreset {
  id: string;
  name: string;
  icon: React.ReactNode;
  performance: "Low" | "Moderate" | "High" | "Extreme";
  performanceColor: string;
  performanceBg: string;
  sliderValues: Record<string, number>;
  economicData: {
    implementation_cost_cr: number;
    annual_savings_cr: number;
    health_benefits_cr: number;
    gdp_impact_percent: number;
    jobs_affected: number;
    carbon_credit_value_cr: number;
    productivity_loss_cr: number;
    enforcement_cost_cr: number;
  };
}

const MITIGATION_PRESETS: MitigationPreset[] = [
  {
    id: "odd-even",
    name: "Odd-Even Scheme",
    icon: <Car className="w-3.5 h-3.5" />,
    performance: "Low",
    performanceColor: "text-yellow-400",
    performanceBg: "bg-yellow-500/20 border-yellow-500/30",
    sliderValues: { ev_subsidy: 45, carbon_tax: 0, public_transit: 0, dust_regulation: 0, energy_transition: 0 },
    economicData: {
      implementation_cost_cr: 50,
      annual_savings_cr: 320,
      health_benefits_cr: 280,
      gdp_impact_percent: -0.1,
      jobs_affected: 15000,
      carbon_credit_value_cr: 45,
      productivity_loss_cr: 120,
      enforcement_cost_cr: 25,
    },
  },
  {
    id: "beijing-emergency",
    name: "Beijing Emergency",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    performance: "Extreme",
    performanceColor: "text-red-400",
    performanceBg: "bg-red-500/20 border-red-500/30",
    sliderValues: { ev_subsidy: 75, carbon_tax: 70, public_transit: 55, dust_regulation: 40, energy_transition: 35 },
    economicData: {
      implementation_cost_cr: 500,
      annual_savings_cr: 180,
      health_benefits_cr: 450,
      gdp_impact_percent: -2.5,
      jobs_affected: 250000,
      carbon_credit_value_cr: 120,
      productivity_loss_cr: 800,
      enforcement_cost_cr: 150,
    },
  },
  {
    id: "grap-stage-3",
    name: "GRAP Stage III",
    icon: <Shield className="w-3.5 h-3.5" />,
    performance: "High",
    performanceColor: "text-orange-400",
    performanceBg: "bg-orange-500/20 border-orange-500/30",
    sliderValues: { ev_subsidy: 35, carbon_tax: 45, public_transit: 30, dust_regulation: 40, energy_transition: 25 },
    economicData: {
      implementation_cost_cr: 200,
      annual_savings_cr: 380,
      health_benefits_cr: 420,
      gdp_impact_percent: -0.8,
      jobs_affected: 85000,
      carbon_credit_value_cr: 85,
      productivity_loss_cr: 320,
      enforcement_cost_cr: 80,
    },
  },
  {
    id: "construction-ban",
    name: "Construction Ban",
    icon: <Building2 className="w-3.5 h-3.5" />,
    performance: "Moderate",
    performanceColor: "text-emerald-400",
    performanceBg: "bg-emerald-500/20 border-emerald-500/30",
    sliderValues: { ev_subsidy: 0, carbon_tax: 0, public_transit: 0, dust_regulation: 48, energy_transition: 0 },
    economicData: {
      implementation_cost_cr: 80,
      annual_savings_cr: 150,
      health_benefits_cr: 180,
      gdp_impact_percent: -0.4,
      jobs_affected: 45000,
      carbon_credit_value_cr: 35,
      productivity_loss_cr: 90,
      enforcement_cost_cr: 40,
    },
  },
  {
    id: "industrial-closure",
    name: "Winter Industrial Closure",
    icon: <Factory className="w-3.5 h-3.5" />,
    performance: "High",
    performanceColor: "text-orange-400",
    performanceBg: "bg-orange-500/20 border-orange-500/30",
    sliderValues: { ev_subsidy: 0, carbon_tax: 60, public_transit: 0, dust_regulation: 0, energy_transition: 0 },
    economicData: {
      implementation_cost_cr: 350,
      annual_savings_cr: 220,
      health_benefits_cr: 350,
      gdp_impact_percent: -1.2,
      jobs_affected: 120000,
      carbon_credit_value_cr: 75,
      productivity_loss_cr: 450,
      enforcement_cost_cr: 65,
    },
  },
  {
    id: "stubble-ban",
    name: "Stubble Burning Ban",
    icon: <Wheat className="w-3.5 h-3.5" />,
    performance: "Low",
    performanceColor: "text-yellow-400",
    performanceBg: "bg-yellow-500/20 border-yellow-500/30",
    sliderValues: { ev_subsidy: 0, carbon_tax: 0, public_transit: 0, dust_regulation: 0, energy_transition: 55 },
    economicData: {
      implementation_cost_cr: 250,
      annual_savings_cr: 480,
      health_benefits_cr: 520,
      gdp_impact_percent: 0.2,
      jobs_affected: 5000,
      carbon_credit_value_cr: 95,
      productivity_loss_cr: 30,
      enforcement_cost_cr: 120,
    },
  },
  {
    id: "ev-push",
    name: "EV Fleet Mandate",
    icon: <Zap className="w-3.5 h-3.5" />,
    performance: "Moderate",
    performanceColor: "text-emerald-400",
    performanceBg: "bg-emerald-500/20 border-emerald-500/30",
    sliderValues: { ev_subsidy: 30, carbon_tax: 0, public_transit: 0, dust_regulation: 0, energy_transition: 0 },
    economicData: {
      implementation_cost_cr: 2500,
      annual_savings_cr: 850,
      health_benefits_cr: 380,
      gdp_impact_percent: 0.5,
      jobs_affected: -25000,
      carbon_credit_value_cr: 180,
      productivity_loss_cr: 0,
      enforcement_cost_cr: 50,
    },
  },
  {
    id: "clean-fuel",
    name: "Clean Fuel Mandate",
    icon: <Flame className="w-3.5 h-3.5" />,
    performance: "High",
    performanceColor: "text-orange-400",
    performanceBg: "bg-orange-500/20 border-orange-500/30",
    sliderValues: { ev_subsidy: 0, carbon_tax: 40, public_transit: 0, dust_regulation: 40, energy_transition: 30 },
    economicData: {
      implementation_cost_cr: 1800,
      annual_savings_cr: 720,
      health_benefits_cr: 580,
      gdp_impact_percent: 0.3,
      jobs_affected: -15000,
      carbon_credit_value_cr: 150,
      productivity_loss_cr: 80,
      enforcement_cost_cr: 90,
    },
  },
];

// ============================================================================
// CALCULATIONS
// ============================================================================

/** Calculate estimated impacts based on slider values */
function calculateEstimatedImpacts(policyValues: Record<string, number>) {
  const sectorReductions: Record<string, number> = {};
  POLICY_CONTROLS.forEach((pc) => {
    const val = policyValues[pc.id] || 0;
    const reduction = val * pc.weight;
    sectorReductions[pc.sector] =
      (sectorReductions[pc.sector] || 0) + reduction;
  });

  Object.keys(sectorReductions).forEach((s) => {
    sectorReductions[s] = Math.min(sectorReductions[s], 90);
  });

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

  const totalInvestment = Object.values(policyValues).reduce(
    (a, b) => a + b,
    0
  );
  const avgInvestment = totalInvestment / POLICY_CONTROLS.length;
  const gdpChange = avgInvestment > 50 ? -0.3 + avgInvestment * 0.008 : avgInvestment * 0.005;

  return { co2Reduction, aqiImprovement, gdpChange, sectorReductions };
}

/** Calculate economic costs based on slider values, weighted by preset economic data */
function calculateEconomicCosts(policyValues: Record<string, number>) {
  // Total slider intensity (0-500 max possible across 5 sliders)
  const totalIntensity = Object.values(policyValues).reduce((a, b) => a + b, 0);
  if (totalIntensity === 0) {
    return {
      implementationCost: 0,
      annualSavings: 0,
      healthBenefits: 0,
      carbonCredits: 0,
      enforcementCost: 0,
      productivityLoss: 0,
      netBenefit: 0,
      roiYears: 0,
    };
  }

  // Weight each preset's economic data by how closely the current sliders match it
  let totalWeight = 0;
  const presetWeights: number[] = [];

  MITIGATION_PRESETS.forEach((preset) => {
    // Calculate similarity: inversely proportional to distance
    let match = 0;
    let presetTotal = 0;
    POLICY_CONTROLS.forEach((pc) => {
      const currentVal = policyValues[pc.id] || 0;
      const presetVal = preset.sliderValues[pc.id] || 0;
      // How much of this slider overlaps with the preset
      if (presetVal > 0 && currentVal > 0) {
        match += Math.min(currentVal, presetVal) / presetVal;
      }
      presetTotal += presetVal;
    });

    // Overall match score: how well current values cover this preset
    const weight = presetTotal > 0 ? (match / POLICY_CONTROLS.length) : 0;
    presetWeights.push(weight);
    totalWeight += weight;
  });

  // Calculate weighted average of economic metrics
  let implCost = 0, annSavings = 0, healthBen = 0, carbonCr = 0, enfCost = 0, prodLoss = 0;

  MITIGATION_PRESETS.forEach((preset, i) => {
    const w = totalWeight > 0 ? presetWeights[i] / totalWeight : 0;
    implCost += preset.economicData.implementation_cost_cr * w;
    annSavings += preset.economicData.annual_savings_cr * w;
    healthBen += preset.economicData.health_benefits_cr * w;
    carbonCr += preset.economicData.carbon_credit_value_cr * w;
    enfCost += preset.economicData.enforcement_cost_cr * w;
    prodLoss += preset.economicData.productivity_loss_cr * w;
  });

  // Scale by overall intensity (0-1 range, mapped from max 500)
  const intensityScale = Math.min(totalIntensity / 250, 2.0);
  implCost *= intensityScale;
  annSavings *= intensityScale;
  healthBen *= intensityScale;
  carbonCr *= intensityScale;
  enfCost *= intensityScale;
  prodLoss *= intensityScale;

  const netBenefit = annSavings + healthBen + carbonCr - implCost - enfCost - prodLoss;
  const roiYears = implCost > 0 ? implCost / Math.max(annSavings + healthBen + carbonCr - enfCost - prodLoss, 1) : 0;

  return {
    implementationCost: Math.round(implCost),
    annualSavings: Math.round(annSavings),
    healthBenefits: Math.round(healthBen),
    carbonCredits: Math.round(carbonCr),
    enforcementCost: Math.round(enfCost),
    productivityLoss: Math.round(prodLoss),
    netBenefit: Math.round(netBenefit),
    roiYears: Math.round(roiYears * 10) / 10,
  };
}

// ============================================================================
// STYLE MAPS
// ============================================================================

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

// ============================================================================
// COMPONENT
// ============================================================================

export function PolicyLab() {
  const { policyValues, updatePolicyValue, setPolicyValues } = useGlobalState();
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const impacts = calculateEstimatedImpacts(policyValues);
  const economics = calculateEconomicCosts(policyValues);

  // Detect if sliders match any preset
  useEffect(() => {
    const matchingPreset = MITIGATION_PRESETS.find((preset) =>
      POLICY_CONTROLS.every(
        (pc) => (policyValues[pc.id] || 0) === (preset.sliderValues[pc.id] || 0)
      )
    );
    setActivePreset(matchingPreset?.id || null);
  }, [policyValues]);

  const applyPreset = (preset: MitigationPreset) => {
    setPolicyValues({ ...preset.sliderValues });
    setActivePreset(preset.id);
  };

  const formatCost = (val: number): string => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return `${val}`;
  };

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

        {/* ============================================================ */}
        {/* MITIGATION POLICY PRESETS                                     */}
        {/* ============================================================ */}
        <Reveal delay={80}>
          <div className="mb-8">
            <div className="text-[10px] text-white/40 uppercase tracking-wider mb-3">
              Quick Presets — Apply a Mitigation Policy
            </div>
            <div className="flex gap-2 flex-wrap">
              {MITIGATION_PRESETS.map((preset) => {
                const isActive = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium transition-all border ${
                      isActive
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                        : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
                    }`}
                  >
                    <span className={isActive ? "text-emerald-400" : "text-white/50 group-hover:text-white/70"}>
                      {preset.icon}
                    </span>
                    <span>{preset.name}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                        isActive
                          ? "bg-emerald-500/30 border-emerald-500/40 text-emerald-300"
                          : `${preset.performanceBg} ${preset.performanceColor}`
                      }`}
                    >
                      {preset.performance}
                    </span>
                    {isActive && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                );
              })}
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

            {/* ============================================================ */}
            {/* ECONOMIC COST ANALYSIS                                       */}
            {/* ============================================================ */}
            <Reveal delay={500}>
              <div className="glass-panel p-5 mt-2 border border-amber-500/10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                    <Receipt className="w-4.5 h-4.5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Economic Cost Analysis</h3>
                    <p className="text-[10px] text-white/40">Raw cost of implementing current policy configuration</p>
                  </div>
                </div>

                {economics.implementationCost === 0 ? (
                  <div className="text-center py-6 text-white/30 text-xs">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-white/15" />
                    Adjust sliders or select a preset to see economic costs
                  </div>
                ) : (
                  <>
                    {/* Cost vs Benefit Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {/* Costs Column */}
                      <div className="space-y-2">
                        <div className="text-[9px] text-red-400/60 uppercase tracking-wider font-bold mb-2">
                          Costs
                        </div>
                        <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/10">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Receipt className="w-3 h-3 text-red-400/60" />
                            <span className="text-[10px] text-white/40">Implementation</span>
                          </div>
                          <div className="text-lg font-bold text-red-400 tabular-nums">
                            ₹{formatCost(economics.implementationCost)} Cr
                          </div>
                        </div>
                        <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/10">
                          <div className="flex items-center gap-1.5 mb-1">
                            <TrendingDown className="w-3 h-3 text-red-400/60" />
                            <span className="text-[10px] text-white/40">Productivity Loss</span>
                          </div>
                          <div className="text-sm font-bold text-red-300 tabular-nums">
                            ₹{formatCost(economics.productivityLoss)} Cr/yr
                          </div>
                        </div>
                        <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/10">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Shield className="w-3 h-3 text-red-400/60" />
                            <span className="text-[10px] text-white/40">Enforcement</span>
                          </div>
                          <div className="text-sm font-bold text-red-300 tabular-nums">
                            ₹{formatCost(economics.enforcementCost)} Cr/yr
                          </div>
                        </div>
                      </div>

                      {/* Benefits Column */}
                      <div className="space-y-2">
                        <div className="text-[9px] text-emerald-400/60 uppercase tracking-wider font-bold mb-2">
                          Benefits
                        </div>
                        <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
                          <div className="flex items-center gap-1.5 mb-1">
                            <PiggyBank className="w-3 h-3 text-emerald-400/60" />
                            <span className="text-[10px] text-white/40">Annual Savings</span>
                          </div>
                          <div className="text-lg font-bold text-emerald-400 tabular-nums">
                            ₹{formatCost(economics.annualSavings)} Cr/yr
                          </div>
                        </div>
                        <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
                          <div className="flex items-center gap-1.5 mb-1">
                            <HeartPulse className="w-3 h-3 text-emerald-400/60" />
                            <span className="text-[10px] text-white/40">Health Benefits</span>
                          </div>
                          <div className="text-sm font-bold text-emerald-300 tabular-nums">
                            ₹{formatCost(economics.healthBenefits)} Cr/yr
                          </div>
                        </div>
                        <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Leaf className="w-3 h-3 text-emerald-400/60" />
                            <span className="text-[10px] text-white/40">Carbon Credits</span>
                          </div>
                          <div className="text-sm font-bold text-emerald-300 tabular-nums">
                            ₹{formatCost(economics.carbonCredits)} Cr/yr
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Net Benefit Bar */}
                    <div className={`rounded-xl p-4 border ${
                      economics.netBenefit >= 0
                        ? "bg-gradient-to-r from-emerald-500/10 to-green-500/5 border-emerald-500/20"
                        : "bg-gradient-to-r from-red-500/10 to-orange-500/5 border-red-500/20"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">
                            Net Economic Benefit
                          </div>
                          <div className={`text-2xl font-bold tabular-nums ${
                            economics.netBenefit >= 0 ? "text-emerald-400" : "text-red-400"
                          }`}>
                            {economics.netBenefit >= 0 ? "+" : "-"}₹{formatCost(Math.abs(economics.netBenefit))} Cr
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-white/40 mb-0.5">ROI Payback</div>
                          <div className="text-lg font-bold text-white/70 tabular-nums">
                            {economics.roiYears > 0 ? `${economics.roiYears} yrs` : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Reveal>
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

export { POLICY_CONTROLS, calculateEstimatedImpacts, calculateEconomicCosts };
