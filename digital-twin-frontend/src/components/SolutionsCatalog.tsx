"use client";

import { useState } from "react";
import { solutionCategories, type Solution, type SolutionCategory } from "../data/solutionsData";
import {
  Globe,
  Building2,
  Dna,
  Atom,
  Trees,
  Sun,
  Shield,
  Wind,
  Layers,
  Lightbulb,
  Zap,
  Waves,
  Leaf,
  Droplet,
  Wifi,
  CloudRain,
  Plane,
  Bus,
  Rocket,
  Sparkles
} from "lucide-react";

import { API_BASE_URL } from '../config';
import { Reveal } from "./Reveal";
import type { ImpactResult } from "../types";



const getCategoryIcon = (id: string) => {
  switch (id) {
    case 'geo-engineering': return <Globe className="w-6 h-6" />;
    case 'infrastructure': return <Building2 className="w-6 h-6" />;
    case 'bio-engineering': return <Dna className="w-6 h-6" />;
    case 'physics-active': return <Atom className="w-6 h-6" />;
    default: return <Globe className="w-6 h-6" />;
  }
};

const getSolutionIcon = (id: string) => {
  switch (id) {
    case 'artificial-forest': return <Trees className="w-8 h-8" />;
    case 'solar-updraft': return <Sun className="w-8 h-8" />;
    case 'city-dome': return <Shield className="w-8 h-8" />;
    case 'wind-corridors': return <Wind className="w-8 h-8" />;
    case 'photocatalytic-skins': return <Layers className="w-8 h-8" />;
    case 'smart-streetlights': return <Lightbulb className="w-8 h-8" />;
    case 'urban-sequoia': return <Building2 className="w-8 h-8" />;
    case 'kinetic-speed-bumps': return <Zap className="w-8 h-8" />;
    case 'algae-curtains': return <Waves className="w-8 h-8" />;
    case 'supercharged-plants': return <Leaf className="w-8 h-8" />;
    case 'liquid-trees': return <Droplet className="w-8 h-8" />;
    case 'aura-towers': return <Wind className="w-8 h-8" />;
    case 'laser-zapping': return <Wifi className="w-8 h-8" />;
    case 'cloud-seeding': return <CloudRain className="w-8 h-8" />;
    case 'jet-engines': return <Plane className="w-8 h-8" />;
    case 'bus-filters': return <Bus className="w-8 h-8" />;
    case 'drone-swarms': return <Rocket className="w-8 h-8" />;
    default: return <Sparkles className="w-8 h-8" />;
  }
};

function CategoryTabs({
  categories,
  selected,
  onSelect,
}: {
  categories: SolutionCategory[];
  selected: SolutionCategory;
  onSelect: (cat: SolutionCategory) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 justify-center mb-8">
      {categories.map((cat) => {
        const isSelected = selected.id === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 border ${isSelected
              ? "bg-white/10 text-white border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] scale-105"
              : "bg-transparent text-white/50 border-white/5 hover:bg-white/5 hover:text-white"
              }`}
          >
            <span className={isSelected ? "text-secondary" : "opacity-50"}>{getCategoryIcon(cat.id)}</span>
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function SolutionCard({
  solution,
  categoryColor,
  onApply,
  isApplying,
}: {
  solution: Solution;
  categoryColor: string;
  onApply: (solution: Solution) => void;
  isApplying: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="glass-panel p-6 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-300 group relative overflow-hidden"
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5"
        style={{ backgroundColor: categoryColor, boxShadow: `0 0 10px ${categoryColor}` }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 pl-3">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/5 rounded-xl border border-white/5 text-white shadow-inner">
            {getSolutionIcon(solution.id)}
          </div>
          <h3 className="text-xl font-bold text-white tracking-wide">{solution.name}</h3>
        </div>
        <button
          onClick={() => onApply(solution)}
          disabled={isApplying}
          className={`px-5 py-2 rounded-full font-bold text-sm transition-all duration-300 border ${isApplying
            ? "bg-white/5 text-white/30 border-white/5 cursor-not-allowed"
            : "btn-primary shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 border-transparent hover:-translate-y-0.5"
            }`}
        >
          {isApplying ? "Initializing..." : "Run Simulation"}
        </button>
      </div>

      {/* Concept */}
      <p className="text-white/70 text-sm mb-4 leading-relaxed pl-3">{solution.concept}</p>

      {/* Expand/Collapse */}
      <div className="pl-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-secondary hover:text-white mb-4 flex items-center gap-1 transition-colors"
        >
          {expanded ? "Hide Technical Details" : "View Technical Specifications"}
        </button>

        {expanded && (
          <div className="space-y-4 mt-2 pt-4 border-t border-white/10 animate-in slide-in-from-top-2 duration-200">
            <div>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1 block">Mechanism</span>
              <p className="text-white/60 text-sm bg-white/5 p-3 rounded-lg border border-white/5">{solution.mechanism}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1 block">Key Barrier</span>
              <p className="text-white/60 text-sm bg-white/5 p-3 rounded-lg border border-white/5">{solution.barrier}</p>
            </div>
          </div>
        )}
      </div>

      {/* Expected Impact Preview */}
      <div className="flex gap-6 mt-4 pt-4 border-t border-white/10 pl-3">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-white/30 font-bold mb-1">CO₂ Est.</span>
          <span className="text-white font-bold text-lg tabular-nums">
            -{solution.policy.estimated_impacts.co2_reduction_pct}%
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-white/30 font-bold mb-1">AQI Est.</span>
          <span className="text-white font-bold text-lg tabular-nums">
            -{solution.policy.estimated_impacts.aqi_improvement_pct}%
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-white/30 font-bold mb-1">Feasibility</span>
          <span className="text-right font-mono text-sm text-secondary pt-1">
            {Math.round(solution.policy.estimated_impacts.confidence * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}

function ImpactModal({
  solution,
  impact,
  onClose,
}: {
  solution: Solution;
  impact: ImpactResult;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg p-0 overflow-hidden shadow-2xl shadow-blue-900/20 border border-white/20">

        <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-secondary/10 rounded-lg text-secondary border border-secondary/20">
              {getSolutionIcon(solution.id)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-0.5">{solution.name}</h3>
              <div className="text-xs text-secondary font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                Simulation Complete
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <div className="p-8">
          {/* Impact Results */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-3xl font-bold text-[#00ff9d] mb-1 relative z-10">
                {impact.co2.change_pct.toFixed(1)}%
              </div>
              <div className="text-xs text-white/50 uppercase tracking-widest relative z-10">CO₂ Reduction</div>
              <div className="mt-3 text-[10px] text-white/30 font-mono bg-black/20 rounded-full py-1 px-2 inline-block relative z-10">
                {impact.co2.baseline.toFixed(0)} → {impact.co2.post_policy.toFixed(0)}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-3xl font-bold text-secondary mb-1 relative z-10">
                {impact.aqi.change_pct.toFixed(1)}%
              </div>
              <div className="text-xs text-white/50 uppercase tracking-widest relative z-10">AQI Improvement</div>
              <div className="mt-3 text-[10px] text-white/30 font-mono bg-black/20 rounded-full py-1 px-2 inline-block relative z-10">
                {impact.aqi.baseline.toFixed(0)} → {impact.aqi.post_policy.toFixed(0)}
              </div>
            </div>
          </div>

          {/* Policy Details */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-5 mb-8">
            <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Policy Logic</h4>
            <p className="text-white/80 text-sm leading-relaxed">{solution.policy.description}</p>
          </div>

          <button
            onClick={onClose}
            className="w-full btn-primary py-3.5 rounded-xl font-bold text-white shadow-lg text-sm tracking-wide"
          >
            CLOSE REPORT
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SolutionsCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<SolutionCategory>(
    solutionCategories[0]
  );
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [showImpact, setShowImpact] = useState<{
    solution: Solution;
    impact: ImpactResult;
  } | null>(null);

  const applySolution = async (solution: Solution) => {
    setApplyingId(solution.id);
    try {
      // Create policy object matching backend format
      const policy = {
        policy_id: solution.id,
        name: solution.policy.name,
        description: solution.policy.description,
        mutations: solution.policy.mutations.map((m) => ({
          ...m,
          reversible: true,
        })),
        estimated_impacts: solution.policy.estimated_impacts,
        trade_offs: [],
        source_research: {
          paper_ids: [],
          key_quotes: [solution.mechanism],
          confidence: solution.policy.estimated_impacts.confidence,
        },
      };

      // Call backend apply-policy endpoint
      const response = await fetch(`${API_BASE_URL}/api/apply-policy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const impact = data.snapshot.impact;

      setShowImpact({ solution, impact });
    } catch (error) {
      console.error("Error applying solution:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative border-b border-white/5 pt-12 pb-16 overflow-hidden">
        {/* Background blobs for hero specifically */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-secondary/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 flex items-center justify-center gap-4 tracking-tight">
            <Sparkles className="w-10 h-10 text-secondary" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
              Future City Solutions
            </span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-lg leading-relaxed">
            Deploy experimental urban technologies to mitigate pollution.
            Select a module to simulate its impact in real-time.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Category Tabs */}
        <CategoryTabs
          categories={solutionCategories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* Category Description */}
        <Reveal>
          <div
            className="glass-panel p-6 mb-10 flex items-center gap-6 relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-secondary to-green-500" />

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-lg backdrop-blur-sm">
              <span className="text-white/90">{getCategoryIcon(selectedCategory.id)}</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{selectedCategory.name}</h3>
              <p className="text-white/60 text-lg leading-snug">{selectedCategory.description}</p>
            </div>
          </div>
        </Reveal>

        {/* Solutions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {selectedCategory.solutions.map((solution, index) => (
            <Reveal key={solution.id} delay={index * 100} className="h-full">
              <SolutionCard
                solution={solution}
                categoryColor={selectedCategory.color}
                onApply={applySolution}
                isApplying={applyingId === solution.id}
              />
            </Reveal>
          ))}
        </div>
      </div>

      {/* Impact Modal */}
      {showImpact && (
        <ImpactModal
          solution={showImpact.solution}
          impact={showImpact.impact}
          onClose={() => setShowImpact(null)}
        />
      )}
    </div>
  );
}
