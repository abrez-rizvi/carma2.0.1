import React, { useEffect } from 'react';
import { useGlobalState } from '../context/GlobalStateContext';
import { HealthImpact } from './HealthImpact';
import { CloudFog, RefreshCcw } from 'lucide-react';
import type { AQIData } from '../types';



export function LiveAQI({ onAqiUpdate }: { onAqiUpdate?: (aqi: number) => void }) {
  const { aqiData: aqi, isLoading, refreshAQI } = useGlobalState();

  useEffect(() => {
    if (aqi && onAqiUpdate) {
      onAqiUpdate(aqi.aqi);
    }
  }, [aqi, onAqiUpdate]);

  const getAQIColor = (aqi: number) => {
    // Standard AQI Scale (India/global mix adaptation)
    if (aqi <= 50) return '#00ff9d';      // Good (Neon Green)
    if (aqi <= 100) return '#eab308';     // Satisfactory
    if (aqi <= 200) return '#f97316';     // Moderate
    if (aqi <= 300) return '#ff0055';     // Poor (Neon Red)
    if (aqi <= 400) return '#a855f7';     // Very Poor
    return '#991b1b';                     // Severe
  };

  const getAQILabel = (aqi: number) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Satisfactory';
    if (aqi <= 200) return 'Moderate';
    if (aqi <= 300) return 'Poor';
    if (aqi <= 400) return 'Very Poor';
    return 'Severe';
  };

  if (isLoading || !aqi) return <div className="text-white/50 animate-pulse">Loading Live Data...</div>;

  return (
    <div className="glass-panel p-6 relative overflow-hidden group">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <CloudFog className="w-5 h-5 text-secondary" />
          Live AQI
        </h3>
        <button
          onClick={refreshAQI}
          className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white flex items-center gap-1.5 transition-all"
        >
          <RefreshCcw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Main AQI Index */}
      <div
        className="rounded-2xl p-6 mb-6 text-center relative overflow-hidden border border-white/10"
        style={{
          background: `linear-gradient(135deg, ${getAQIColor(aqi.aqi)}20 0%, rgba(0,0,0,0) 100%)`,
        }}
      >
        <div className="text-4xl font-bold text-white mb-1" style={{ textShadow: `0 0 20px ${getAQIColor(aqi.aqi)}` }}>
          {getAQILabel(aqi.aqi)}
        </div>
        <div className="text-sm text-white/70 font-mono">
          Current Index: <span className="text-white font-bold">{Math.round(aqi.aqi)}</span> / 500
        </div>
      </div>

      {/* Pollutants Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-6">
        {[
          { label: 'PM2.5', value: aqi.pm2_5 },
          { label: 'PM10', value: aqi.pm10 },
          { label: 'NO₂', value: aqi.no2 },
          { label: 'O₃', value: aqi.o3 }
        ].map((item) => (
          <div key={item.label} className="bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <div className="text-white/50 text-xs mb-1">{item.label}</div>
            <div className="text-white font-bold text-lg">{item.value.toFixed(1)}</div>
          </div>
        ))}
      </div>

      {/* AI Health Analysis */}
      <HealthImpact aqiData={aqi} />
    </div>
  );
}