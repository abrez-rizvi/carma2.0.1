"use client";

import { useState, useEffect } from "react";
import { aqiCategories, type AQICategory } from "../data/aqiHealthData";
import { useGlobalState } from "../context/GlobalStateContext";
import {
  Baby,
  Smile,
  Users,
  PersonStanding,
  User,
  Hospital,
  AlertTriangle,
  Activity,
  Shield,
  Check
} from "lucide-react";
import { LiveAQI } from "./LiveAQI";
import { Reveal } from "./Reveal";

// ... imports stay same ...

function AQISelector({
  categories,
  selected,
  onSelect,
  currentAQI
}: {
  categories: AQICategory[];
  selected: AQICategory;
  onSelect: (category: AQICategory) => void;
  currentAQI: number | null;
}) {
  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {categories.map((category) => {
        const isSelected = selected.id === category.id;

        // Parsing ranges like "0-50", "401-500+"
        const rangeParts = category.range.split('-');
        const min = parseInt(rangeParts[0]);
        const max = rangeParts[1].includes('+') ? Infinity : parseInt(rangeParts[1]);

        const isCurrent = currentAQI !== null && currentAQI >= min && currentAQI <= max;

        return (
          <button
            key={category.id}
            onClick={() => onSelect(category)}
            className={`relative px-6 py-4 rounded-xl font-bold transition-all duration-300 border ${isSelected
              ? "scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              : "opacity-60 hover:opacity-100 hover:scale-102 border-transparent bg-white/5"
              }`}
            style={{
              backgroundColor: isSelected ? category.color : undefined,
              borderColor: isSelected ? 'white' : 'rgba(255,255,255,0.1)',
              color: isSelected ? "white" : "white",
              textShadow: isSelected ? "0 2px 4px rgba(0,0,0,0.3)" : "none"
            }}
          >
            {isCurrent && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-white border-2 border-white/50"></span>
              </span>
            )}
            <div className="text-sm font-bold tracking-wide uppercase">{category.name}</div>
            <div className={`text-xs ${isSelected ? 'opacity-90' : 'opacity-50'} font-mono mt-1`}>AQI {category.range}</div>
          </button>
        );
      })}
    </div>
  );
}

function VulnerableGroupCard({
  group,
  effects,
  accentColor,
}: {
  group: string;
  effects: string[];
  accentColor: string;
}) {
  const icons: Record<string, React.ReactNode> = {
    "Newborns & Children": <Baby className="w-6 h-6" />,
    "Children": <Smile className="w-6 h-6" />,
    "Infants": <Baby className="w-6 h-6" />,
    "Infants & Children": <Baby className="w-6 h-6" />,
    "Pregnant Women": <PersonStanding className="w-6 h-6" />,
    "Elderly": <User className="w-6 h-6" />,
    "Pre-existing Conditions": <Hospital className="w-6 h-6" />,
    "General Population": <Users className="w-6 h-6" />,
  };

  return (
    <div
      className="glass-panel p-6 hover:shadow-lg transition-all duration-300 group"
      style={{ borderTop: `4px solid ${accentColor}` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/5 rounded-lg text-white group-hover:scale-110 transition-transform">
          {icons[group] || <User className="w-5 h-5" />}
        </div>
        <h4 className="font-bold text-white text-lg tracking-tight">{group}</h4>
      </div>
      <ul className="space-y-3">
        {effects.map((effect, idx) => (
          <li key={idx} className="flex items-start gap-3 text-sm text-white/70">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/50 shrink-0"></span>
            <span className="leading-snug">{effect}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AQIHealthImpact() {
  const { aqiData } = useGlobalState();
  const currentAqiValue = aqiData?.aqi ?? null;

  const [selectedCategory, setSelectedCategory] = useState<AQICategory>(
    aqiCategories[0]
  );

  useEffect(() => {
    if (currentAqiValue !== null) {
      // Find category that matches the AQI range
      // Mappings: 0-50, 51-100, 101-200, 201-300, 301-400, 401+
      const categoryId =
        currentAqiValue <= 50 ? "good" :
          currentAqiValue <= 100 ? "satisfactory" :
            currentAqiValue <= 200 ? "moderate" :
              currentAqiValue <= 300 ? "poor" :
                currentAqiValue <= 400 ? "very-poor" :
                  "severe";

      const matchedCategory = aqiCategories.find(c => c.id === categoryId);
      if (matchedCategory && matchedCategory.id !== selectedCategory.id) {
        setSelectedCategory(matchedCategory);
      }
    }
  }, [currentAqiValue]);

  return (
    <div className="min-h-screen relative">

      {/* Fixed Live AQI Indicator */}
      {currentAqiValue !== null && (
        <div className="fixed top-24 right-8 z-50 glass-panel !bg-black/80 !border-white/20 px-5 py-2.5 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" style={{ backgroundColor: currentAqiValue <= 100 ? "#22c55e" : "#ef4444" }}></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" style={{ backgroundColor: currentAqiValue <= 100 ? "#22c55e" : "#ef4444" }}></span>
          </div>
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <span className="text-white/50 text-xs font-mono uppercase">Live AQI</span>
            {Math.round(currentAqiValue)}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div
        className="relative transition-all duration-700 ease-in-out border-b border-white/5 pt-16 pb-20 overflow-hidden"
      >
        {/* Dynamic ambient bg based on selection */}
        <div
          className="absolute inset-0 opacity-20 transition-colors duration-700"
          style={{ backgroundColor: selectedCategory.bgColor === 'bg-emerald-950' ? '#059669' : selectedCategory.color }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f0518] via-transparent to-[#0f0518]" />

        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-secondary font-mono mb-4 uppercase tracking-widest">
              <Activity className="w-3 h-3" />
              Medical Guidance System
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              AQI Health Impact Guide
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg leading-relaxed">
              Interactive analysis of air quality implications for public health. Select a level to view detailed protocols.
            </p>
          </div>

          {/* AQI Selector */}
          <AQISelector
            categories={aqiCategories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            currentAQI={currentAqiValue}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Category Header */}
        <Reveal>
          <div
            className="glass-panel p-8 mb-10 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 w-2 h-full transition-colors duration-500" style={{ backgroundColor: selectedCategory.color }} />

            <div className="flex items-center justify-between flex-wrap gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: selectedCategory.color }}
                  >
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white tracking-tight">
                      {selectedCategory.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded text-white/80">AQI {selectedCategory.range}</span>
                    </div>
                  </div>
                </div>
                <p className="text-white/60 pl-16">
                  PM2.5 Concentration: <span className="text-white font-bold">{selectedCategory.pm25Range}</span>
                </p>
              </div>
              {selectedCategory.lifeExpectancyImpact && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-6 py-4 max-w-sm backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-widest mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Life Expectancy Warning</span>
                  </div>
                  <p className="text-white font-medium text-lg tracking-tight">{selectedCategory.lifeExpectancyImpact}</p>
                </div>
              )}
            </div>
          </div>
        </Reveal>

        {/* Physiological Impact */}
        <Reveal delay={100}>
          <div className="glass-panel p-8 mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/5 rounded-lg">
                <Activity className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-white">Physiological Impact</h3>
            </div>
            <p className="text-white/80 leading-relaxed text-lg border-l-2 border-white/10 pl-4 py-1">
              {selectedCategory.physiologicalImpact}
            </p>
          </div>
        </Reveal>

        {/* Vulnerable Groups Grid */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-secondary" />
            <h3 className="text-2xl font-bold text-white">Vulnerable Population Analysis</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedCategory.vulnerableGroups.map((vg, idx) => (
              <Reveal key={idx} delay={200 + idx * 50}>
                <VulnerableGroupCard
                  group={vg.group}
                  effects={vg.effects}
                  accentColor={selectedCategory.color}
                />
              </Reveal>
            ))}
          </div>
        </div>

        {/* Safeguards */}
        <div className="glass-panel p-8 mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 blur-[80px] rounded-full pointer-events-none" />

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <Shield className="w-6 h-6 text-secondary" />
            <h3 className="text-2xl font-bold text-white">Recommended Protocols</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {selectedCategory.safeguards.map((safeguard, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 bg-white/5 border border-white/5 rounded-xl px-5 py-4 hover:bg-white/10 transition-colors"
              >
                <div className="mt-0.5 p-1 bg-green-500/20 rounded-full">
                  <Check className="w-3 h-3 text-green-400" />
                </div>
                <span className="text-white/90 leading-snug">{safeguard}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Data Section (Moved to Bottom) */}
        <div className="mt-16 pt-10 border-t border-white/10">
          <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            Live Data Feed
          </h3>
          <LiveAQI />
        </div>
      </div>
    </div>
  );
}
