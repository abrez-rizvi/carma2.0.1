"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../config';
import type { AQIData } from '../types';
export type { AQIData };

export interface HealthImpactData {
    aqi_level: number;
    category: string;
    risk_summary: string;
    age_specific_impacts: {
        newborns: string;
        children: string;
        teenagers_young_adults: string;
        adults_36_65: string;
        elderly: string;
    };
    pregnancy_risks: string;
    pre_existing_conditions: {
        asthma: string;
        diabetes: string;
        cardiovascular: string;
    };
    immediate_actions: string[];
    long_term_risk: {
        life_expectancy_loss: string;
        chronic_conditions: string;
    };
    safeguard_protocols: string[];
    urgency_level: "Low" | "Medium" | "High" | "Critical";
}

/* ── Simulation Workflow State ────────────────── */

export interface PolicySliderValue {
    id: string;
    label: string;
    value: number; // 0-100
    sector: string;
    weight: number;
}

export interface ScenarioResult {
    id: string;
    name: string;
    policyConfig: Record<string, number>;
    metrics: {
        co2Reduction: number;
        aqiImprovement: number;
        gdpChange: number;
        healthBenefit: number;
        sectorEmissions: Record<string, number>;
    };
    timestamp: number;
}

interface GlobalStateContextType {
    /* Existing */
    aqiData: AQIData | null;
    isLoading: boolean;
    refreshAQI: () => Promise<void>;
    healthAnalysis: HealthImpactData | null;
    isAnalyzing: boolean;
    generateHealthAnalysis: () => Promise<void>;

    /* Simulation Workflow */
    selectedCity: string;
    setSelectedCity: (city: string) => void;
    timeHorizon: [number, number];
    setTimeHorizon: (range: [number, number]) => void;
    activeSectors: string[];
    setActiveSectors: (sectors: string[]) => void;
    toggleSector: (sector: string) => void;
    policyValues: Record<string, number>;
    setPolicyValues: (values: Record<string, number>) => void;
    updatePolicyValue: (id: string, value: number) => void;
    isSimulating: boolean;
    setIsSimulating: (v: boolean) => void;
    simulationResults: ScenarioResult[];
    addScenario: (scenario: ScenarioResult) => void;
    clearScenarios: () => void;
    latestResult: ScenarioResult | null;
    setLatestResult: (result: ScenarioResult | null) => void;
}

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

const ALL_SECTORS = ['Ground_Transport', 'Industry', 'Power', 'Residential', 'Aviation'];

export function GlobalProvider({ children }: { children: ReactNode }) {
    /* ── Existing AQI State ─────────────────────── */
    const [aqiData, setAqiData] = useState<AQIData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [healthAnalysis, setHealthAnalysis] = useState<HealthImpactData | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const fetchAQI = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/aqi?lat=28.7041&lon=77.1025`);
            if (!response.ok) {
                console.error(`API error: ${response.status}. Using mock data.`);
                const mockData = {
                    aqi: 50,
                    aqi_category: 'Good',
                    pm2_5: 12.5,
                    pm10: 25.0,
                    o3: 45.2,
                    no2: 28.5,
                    so2: 8.1,
                    co: 0.5
                };
                setAqiData(mockData);
                return;
            }
            const data = await response.json();
            setAqiData(data);
        } catch (error) {
            console.error('Failed to fetch AQI data:', error);
            const mockData = {
                aqi: 50,
                aqi_category: 'Good',
                pm2_5: 12.5,
                pm10: 25.0,
                o3: 45.2,
                no2: 28.5,
                so2: 8.1,
                co: 0.5
            };
            setAqiData(mockData);
        } finally {
            setIsLoading(false);
        }
    };

    const generateHealthAnalysis = async () => {
        if (!aqiData) return;
        setIsAnalyzing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/analyze-aqi-health`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ aqi_data: aqiData }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch health analysis');
            }

            const data = await response.json();
            if (data.health_impact) {
                setHealthAnalysis(data.health_impact);
            }
        } catch (err) {
            console.error("Error fetching health impact:", err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        fetchAQI();
        const interval = setInterval(fetchAQI, 600000); // 10 minutes
        return () => clearInterval(interval);
    }, []);

    /* ── Simulation Workflow State ────────────────── */
    const [selectedCity, setSelectedCity] = useState('Delhi');
    const [timeHorizon, setTimeHorizon] = useState<[number, number]>([2025, 2030]);
    const [activeSectors, setActiveSectors] = useState<string[]>(ALL_SECTORS);
    const [policyValues, setPolicyValues] = useState<Record<string, number>>({});
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationResults, setSimulationResults] = useState<ScenarioResult[]>([]);
    const [latestResult, setLatestResult] = useState<ScenarioResult | null>(null);

    const toggleSector = (sector: string) => {
        setActiveSectors(prev =>
            prev.includes(sector)
                ? prev.filter(s => s !== sector)
                : [...prev, sector]
        );
    };

    const updatePolicyValue = (id: string, value: number) => {
        setPolicyValues(prev => ({ ...prev, [id]: value }));
    };

    const addScenario = (scenario: ScenarioResult) => {
        setSimulationResults(prev => [...prev.slice(-2), scenario]); // Keep max 3
    };

    const clearScenarios = () => {
        setSimulationResults([]);
    };

    return (
        <GlobalStateContext.Provider value={{
            /* Existing */
            aqiData,
            isLoading,
            refreshAQI: fetchAQI,
            healthAnalysis,
            isAnalyzing,
            generateHealthAnalysis,
            /* Simulation Workflow */
            selectedCity,
            setSelectedCity,
            timeHorizon,
            setTimeHorizon,
            activeSectors,
            setActiveSectors,
            toggleSector,
            policyValues,
            setPolicyValues,
            updatePolicyValue,
            isSimulating,
            setIsSimulating,
            simulationResults,
            addScenario,
            clearScenarios,
            latestResult,
            setLatestResult,
        }}>
            {children}
        </GlobalStateContext.Provider>
    );
}

export function useGlobalState() {
    const context = useContext(GlobalStateContext);
    if (context === undefined) {
        throw new Error('useGlobalState must be used within a GlobalProvider');
    }
    return context;
}
