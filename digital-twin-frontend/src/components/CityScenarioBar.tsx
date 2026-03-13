"use client";

import { useGlobalState } from "../context/GlobalStateContext";
import {
  MapPin,
  Calendar,
  Zap,
  Play,
  Factory,
  Car,
  Plug,
  Home,
  Plane,
} from "lucide-react";

const CITIES = [
  { id: "delhi", label: "Delhi", lat: 28.7041, lon: 77.1025 },
  { id: "mumbai", label: "Mumbai", lat: 19.076, lon: 72.8777 },
  { id: "bangalore", label: "Bangalore", lat: 12.9716, lon: 77.5946 },
  { id: "chennai", label: "Chennai", lat: 13.0827, lon: 80.2707 },
  { id: "kolkata", label: "Kolkata", lat: 22.5726, lon: 88.3639 },
];

const SECTOR_CONFIG = [
  { id: "Ground_Transport", label: "Transport", icon: Car },
  { id: "Industry", label: "Industry", icon: Factory },
  { id: "Power", label: "Energy", icon: Plug },
  { id: "Residential", label: "Residential", icon: Home },
  { id: "Aviation", label: "Aviation", icon: Plane },
];

interface CityScenarioBarProps {
  onRunSimulation: () => void;
}

export function CityScenarioBar({ onRunSimulation }: CityScenarioBarProps) {
  const {
    selectedCity,
    setSelectedCity,
    timeHorizon,
    setTimeHorizon,
    activeSectors,
    toggleSector,
    isSimulating,
  } = useGlobalState();

  return (
    <section
      id="control-bar"
      className="sticky top-20 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* City Selector */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <div className="relative">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-white/5 text-white text-sm border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 appearance-none pr-8 cursor-pointer hover:bg-white/10 transition-colors"
              >
                {CITIES.map((c) => (
                  <option key={c.id} value={c.label} className="bg-slate-900">
                    {c.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-white/10 hidden md:block" />

          {/* Time Horizon */}
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 font-mono">
                {timeHorizon[0]}
              </span>
              <input
                type="range"
                min={2025}
                max={2035}
                value={timeHorizon[1]}
                onChange={(e) =>
                  setTimeHorizon([timeHorizon[0], parseInt(e.target.value)])
                }
                className="w-28 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400
                  [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(6,182,212,0.6)]
                  [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <span className="text-xs text-white/40 font-mono">
                {timeHorizon[1]}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-white/10 hidden md:block" />

          {/* Sector Toggles */}
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <div className="flex gap-1.5">
              {SECTOR_CONFIG.map((sector) => {
                const Icon = sector.icon;
                const isActive = activeSectors.includes(sector.id);
                return (
                  <button
                    key={sector.id}
                    onClick={() => toggleSector(sector.id)}
                    title={sector.label}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                      transition-all duration-200 border ${
                        isActive
                          ? "bg-white/10 text-white border-white/20"
                          : "bg-transparent text-white/30 border-transparent hover:text-white/50"
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">{sector.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Run Simulation */}
          <button
            onClick={onRunSimulation}
            disabled={isSimulating}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm
              transition-all duration-300 shadow-lg ${
                isSimulating
                  ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                  : "btn-primary hover:shadow-green-500/30 hover:scale-105"
              }`}
          >
            {isSimulating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Simulation
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
