import React, { useEffect, useState } from 'react';
import { HealthChat } from './HealthChat';
import { Stethoscope, Shield, Zap, Sparkles } from 'lucide-react';
import { useGlobalState } from '../context/GlobalStateContext';
import type { AQIData } from '../types';

interface HealthImpactProps {
  aqiData: AQIData;
}

export function HealthImpact({ aqiData }: HealthImpactProps) {
  const { healthAnalysis, isAnalyzing, generateHealthAnalysis } = useGlobalState();

  if (isAnalyzing) {
    return (
      <div className="glass-panel p-8 mt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-secondary rounded-full border-t-transparent animate-spin"></div>
          <Stethoscope className="absolute inset-0 m-auto text-secondary w-8 h-8 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2 tracking-wide">Analysing Bio-Metrics...</h3>
        <p className="text-white/50 max-w-md text-sm">
          AI is cross-referencing AQI data with health vulnerability models.
        </p>
      </div>
    );
  }

  if (!healthAnalysis) {
    return (
      <div className="glass-panel p-8 mt-6 text-center group hover:border-secondary/30 transition-colors">
        <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 group-hover:scale-110 transition-transform duration-500">
          <Stethoscope className="w-10 h-10 text-secondary" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Health Impact Analysis</h3>
        <p className="text-white/60 max-w-lg mx-auto mb-8 leading-relaxed">
          Generate a comprehensive AI-powered analysis of the current air quality's impact on your health, including age-specific risks and immediate safeguards.
        </p>
        <button
          onClick={generateHealthAnalysis}
          className="btn-primary px-8 py-3.5 rounded-full font-bold flex items-center gap-2 mx-auto shadow-lg shadow-green-500/20 hover:shadow-green-500/40 text-white"
        >
          <Sparkles className="w-5 h-5" />
          Run AI Health Scan
        </button>
      </div>
    );
  }

  const getUrgencyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'text-[#00ff9d] drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]';
      case 'medium': return 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]';
      case 'high': return 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]';
      case 'critical': return 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse';
      default: return 'text-white';
    }
  };

  return (
    <div className="glass-panel p-6 mt-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-lg border border-white/10">
            <Stethoscope className="w-5 h-5 text-secondary" />
          </div>
          Health Analysis
        </h3>
        <span className={`font-bold text-sm uppercase tracking-widest ${getUrgencyColor(healthAnalysis.urgency_level)}`}>
          {healthAnalysis.urgency_level} Risk
        </span>
      </div>

      <div className="mb-8">
        <p className="text-white/80 text-lg leading-relaxed italic border-l-2 border-secondary pl-4 py-1">
          "{healthAnalysis.risk_summary}"
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Age Specific Risks */}
        <div>
          <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">
            Vulnerability Index
          </h4>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-[100px_1fr] gap-3 items-center p-2 rounded-lg hover:bg-white/5 transition-colors">
              <span className="text-secondary font-medium">Newborns</span>
              <span className="text-white/70">{healthAnalysis.age_specific_impacts.newborns}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-3 items-center p-2 rounded-lg hover:bg-white/5 transition-colors">
              <span className="text-secondary font-medium">Children</span>
              <span className="text-white/70">{healthAnalysis.age_specific_impacts.children}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-3 items-center p-2 rounded-lg hover:bg-white/5 transition-colors">
              <span className="text-secondary font-medium">Adults</span>
              <span className="text-white/70">{healthAnalysis.age_specific_impacts.adults_36_65}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-3 items-center p-2 rounded-lg hover:bg-white/5 transition-colors">
              <span className="text-secondary font-medium">Elderly</span>
              <span className="text-white/70">{healthAnalysis.age_specific_impacts.elderly}</span>
            </div>
          </div>
        </div>

        {/* Protection & Actions */}
        <div>
          <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">
            Critical Safeguards
          </h4>
          <ul className="space-y-3">
            {healthAnalysis.safeguard_protocols.map((protocol, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-white/80 bg-white/5 p-3 rounded-xl border border-white/5">
                <Shield className="w-4 h-4 text-[#00ff9d] mt-0.5 shrink-0" />
                {protocol}
              </li>
            ))}
          </ul>
          <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 mt-6">
            Immediate Response
          </h4>
          <ul className="space-y-2">
            {healthAnalysis.immediate_actions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                <Zap className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Long Term & Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/10">
        <div>
          <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
            Long Term Projection
          </h4>
          <p className="text-red-500 font-bold text-lg mb-1 drop-shadow-sm">
            Life Expectancy Loss: <span className="text-white">{healthAnalysis.long_term_risk.life_expectancy_loss}</span>
          </p>
          <p className="text-white/50 text-xs">
            Risk Factors: {healthAnalysis.long_term_risk.chronic_conditions}
          </p>
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
            At-Risk Segments
          </h4>
          <div className="flex flex-wrap gap-2">
            <div className="text-xs text-secondary bg-secondary/10 px-3 py-1.5 rounded-full border border-secondary/20">
              <span className="font-bold">Asthma:</span> {healthAnalysis.pre_existing_conditions.asthma}
            </div>
            {healthAnalysis.pregnancy_risks && healthAnalysis.pregnancy_risks.length > 5 && (
              <div className="text-xs text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20">
                <span className="font-bold">Pregnancy:</span> {healthAnalysis.pregnancy_risks}
              </div>
            )}
            <div className="text-xs text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
              <span className="font-bold">Conditions:</span> {healthAnalysis.pre_existing_conditions.cardiovascular}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Health Chat */}
      <HealthChat aqiContext={{ ...aqiData, risk_summary: healthAnalysis.risk_summary }} />
    </div>
  );
}
