import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { API_BASE_URL } from '../config';
import type { ChatMessage } from '../types';
import { ChatInterface } from './ChatInterface';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    ComposedChart
} from 'recharts';
import { Scale, TrendingDown, Check, Calendar, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Policy {
    id: string;
    name: string;
    icon: string;
    description: string;
    category: string;
    sector_impacts: {
        Aviation: number;
        Ground_Transport: number;
        Industry: number;
        Power: number;
        Residential: number;
    };
    details: {
        implementation_cost: string;
        public_acceptance: string;
        duration: string;
        last_implemented: string;
    };
    economic_data?: {
        implementation_cost_cr: number;
        annual_savings_cr: number;
        gdp_impact_percent: number;
        jobs_affected: number;
        health_benefits_cr: number;
    };
}

interface ForecastPoint {
    date: string;
    emission: number;
    sectors: {
        Aviation: number;
        Ground_Transport: number;
        Industry: number;
        Power: number;
        Residential: number;
    };
}

interface ModelCalculation {
    delta_e: number;
    delta_e_pct: number;
    formula: string;
    sector_weights: Record<string, number>;
    combined_reductions: Record<string, number>;
    sector_contributions: Record<string, number>;
    total_contribution: number;
    calibration_d: number;
    model_name: string;
    interpretation: string;
}

interface SimulationResult {
    year?: number;
    baseline: ForecastPoint[];
    with_policy: ForecastPoint[];
    combined_impacts: Record<string, number>;
    model_calculation?: ModelCalculation;
    summary: {
        baseline_avg: number;
        adjusted_avg: number;
        change_pct: number;
        delta_e_pct?: number;
        total_reduction: number;
        yearly_baseline_total?: number;
        yearly_adjusted_total?: number;
        yearly_savings?: number;
    };
    applied_policies: {
        id: string;
        name: string;
        icon: string;
        description: string;
        category: string;
        details?: {
            implementation_cost: string;
            public_acceptance: string;
            duration: string;
            last_implemented: string;
        };
    }[];
    data_points?: number;
}

export function PolicySimulator() {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
    const [selectedYear, setSelectedYear] = useState<number>(2026);
    const [simulation, setSimulation] = useState<SimulationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingPolicies, setLoadingPolicies] = useState(true);

    const years = [2026, 2027, 2028];

    useEffect(() => {
        fetchPolicies();
    }, []);

    useEffect(() => {
        if (selectedPolicies.length > 0) {
            runSimulation();
        } else {
            setSimulation(null);
        }
    }, [selectedPolicies, selectedYear]);

    const fetchPolicies = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/policies`);
            const result = await response.json();
            if (result.status === 'success') {
                setPolicies(result.policies);
            }
        } catch (e) {
            console.error("Error fetching policies:", e);
        } finally {
            setLoadingPolicies(false);
        }
    };

    const runSimulation = async () => {
        if (selectedPolicies.length === 0) return;

        setLoading(true);
        try {
            // Use the year-based endpoint with actual forecast data
            const response = await fetch(`${API_BASE_URL}/api/policies/simulate-year`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    policy_ids: selectedPolicies,
                    year: selectedYear
                })
            });
            const result = await response.json();
            if (result.status === 'success') {
                setSimulation(result);
            }
        } catch (e) {
            console.error("Error running simulation:", e);
        } finally {
            setLoading(false);
        }
    };

    const togglePolicy = (policyId: string) => {
        setSelectedPolicies(prev =>
            prev.includes(policyId)
                ? prev.filter(id => id !== policyId)
                : [...prev, policyId]
        );
    };

    const getChartData = () => {
        if (!simulation) return [];

        // Sample data for smoother chart (every 7th day for yearly data)
        const data = simulation.baseline.map((baseline, index) => ({
            date: baseline.date,
            baseline: baseline.emission,
            withPolicy: simulation.with_policy[index]?.emission || baseline.emission
        }));

        // Sample every 7 days if we have a lot of data points
        if (data.length > 60) {
            return data.filter((_, idx) => idx % 7 === 0);
        }
        return data;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}`;
    };

    const getSectorIcon = (sector: string) => {
        switch (sector) {
            case 'Ground_Transport': return '🚗';
            case 'Industry': return '🏭';
            case 'Power': return '⚡';
            case 'Residential': return '🏠';
            case 'Aviation': return '✈️';
            default: return '📊';
        }
    };

    const generateReport = (): string => {
        if (!simulation) return '';

        const now = new Date();
        const policyNames = simulation.applied_policies.map(p => `${p.icon} ${p.name}`).join(', ');

        let report = `
======================================================================
            POLICY IMPACT SIMULATION REPORT - ${selectedYear}
======================================================================

Generated: ${now.toLocaleString()}
Forecast Year: ${selectedYear}
Policies Applied: ${policyNames}
Data Points: ${simulation.data_points || simulation.baseline.length} days

----------------------------------------------------------------------
                        SUMMARY STATISTICS
----------------------------------------------------------------------

  Baseline Daily Average:     ${simulation.summary.baseline_avg.toFixed(2)} kt CO₂
  With Policy Average:        ${simulation.summary.adjusted_avg.toFixed(2)} kt CO₂
  Daily Reduction:            ${simulation.summary.total_reduction.toFixed(2)} kt CO₂
  Percentage Change:          ${simulation.summary.change_pct.toFixed(2)}%
`;

        if (simulation.summary.yearly_baseline_total && simulation.summary.yearly_savings) {
            report += `
  Yearly Baseline Total:      ${(simulation.summary.yearly_baseline_total / 1000).toFixed(2)} Mt CO₂
  Yearly With Policy:         ${((simulation.summary.yearly_adjusted_total || 0) / 1000).toFixed(2)} Mt CO₂
  Yearly Savings:             ${(simulation.summary.yearly_savings / 1000).toFixed(2)} Mt CO₂
`;
        }

        report += `
----------------------------------------------------------------------
                     SECTOR IMPACT BREAKDOWN
----------------------------------------------------------------------

  Sector                      Impact         Change
  ------------------------------------------------------------------
`;

        Object.entries(simulation.combined_impacts).forEach(([sector, impact]) => {
            const impactPct = (impact * 100).toFixed(1);
            const direction = impact < 0 ? 'Reduction' : impact > 0 ? 'Increase' : 'No Change';
            const sectorLabel = sector.replace('_', ' ').padEnd(25);
            report += `  ${sectorLabel} ${impactPct.padStart(8)}%     ${direction}\n`;
        });

        if (simulation.model_calculation) {
            const mc = simulation.model_calculation;
            report += `
----------------------------------------------------------------------
               REDUCED-FORM MODEL CALCULATION
----------------------------------------------------------------------

  Model: ${mc.model_name}
  Formula: ΔE = D × Σ Bᵢ × (αᵢ/100)
  Calibration Constant (D): ${mc.calibration_d}
  
  SECTOR CONTRIBUTIONS:
  ------------------------------------------------------------------
  Sector                  Weight(Bᵢ)  Reduction(αᵢ)  Contribution
  ------------------------------------------------------------------
`;

            Object.entries(mc.sector_weights).forEach(([sector, weight]) => {
                const reduction = mc.combined_reductions[sector] || 0;
                const contribution = mc.sector_contributions[sector] || 0;
                const sectorLabel = sector.replace('_', ' ').padEnd(22);
                report += `  ${sectorLabel} ${(weight as number).toFixed(4).padStart(8)}   ${reduction.toFixed(1).padStart(10)}%   ${contribution.toFixed(6).padStart(12)}\n`;
            });

            report += `  ------------------------------------------------------------------
  TOTAL CONTRIBUTION (Σ):                          ${mc.total_contribution.toFixed(6)}
  
  CALCULATION:
  ${mc.formula}
  
  PROPORTIONAL CHANGE (ΔE): ${mc.delta_e_pct.toFixed(2)}% relative to BAU baseline
`;
        }

        report += `
----------------------------------------------------------------------
                         INTERPRETATION
----------------------------------------------------------------------

  This result represents a policy response proxy, not a causal prediction.
  Under the specified linear response model, the combined sector-weighted
  policy interventions yield an aggregate proportional change of
  ${simulation.model_calculation?.delta_e_pct.toFixed(2) || simulation.summary.change_pct.toFixed(2)}% relative to the business-as-usual (BAU) baseline.
  
  The result should be interpreted as a scenario comparison tool rather
  than an empirical forecast of actual emission changes.

----------------------------------------------------------------------
                      APPLIED POLICIES DETAIL
----------------------------------------------------------------------

`;

        simulation.applied_policies.forEach((p, idx) => {
            report += `  ${idx + 1}. ${p.icon} ${p.name}\n`;
        });

        report += `
======================================================================
                         END OF REPORT
======================================================================
`;

        return report;
    };


    const chartRef = useRef<HTMLDivElement>(null);

    // Helper: Calculate detailed stats for the report
    const calculateReportStats = (data: ForecastPoint[]) => {
        const months: Record<string, { sum: number; count: number; aqiSum: number }> = {};
        let minEmission = Infinity, maxEmission = -Infinity;
        let minAQI = Infinity, maxAQI = -Infinity;
        const sectorTotals: Record<string, number> = {
            Aviation: 0, Ground_Transport: 0, Industry: 0, Power: 0, Residential: 0
        };

        data.forEach(d => {
            // Monthly aggregation
            const date = new Date(d.date);
            const month = date.toLocaleString('default', { month: 'long' });
            if (!months[month]) months[month] = { sum: 0, count: 0, aqiSum: 0 };
            months[month].sum += d.emission;
            months[month].count++;
            // Mock AQI approximation based on emission if not present (simplified for now)
            // In a real app, we'd have AQI in the forecast point
            const approxAQI = d.emission * 4.5; // Rough correlation factor
            months[month].aqiSum += approxAQI;

            // Ranges
            if (d.emission < minEmission) minEmission = d.emission;
            if (d.emission > maxEmission) maxEmission = d.emission;
            if (approxAQI < minAQI) minAQI = approxAQI;
            if (approxAQI > maxAQI) maxAQI = approxAQI;

            // Sector totals
            Object.entries(d.sectors).forEach(([sec, val]) => {
                if (sectorTotals[sec] !== undefined) sectorTotals[sec] += val;
            });
        });

        const monthlyAverages = Object.entries(months).map(([m, val]) => ({
            month: m,
            avgEmission: val.sum / val.count,
            avgAQI: val.aqiSum / val.count
        }));

        return {
            monthlyAverages,
            minEmission, maxEmission,
            minAQI, maxAQI,
            sectorTotals,
            totalEmission: Object.values(sectorTotals).reduce((a, b) => a + b, 0)
        };
    };

    const generatePDF = async () => {
        if (!simulation || selectedPolicies.length === 0) return;

        const baselineStats = calculateReportStats(simulation.baseline);
        const policyStats = calculateReportStats(simulation.with_policy);

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            let themeColor = [16, 185, 129]; // Emerald-500

            // Helper for centered text
            const centerText = (text: string, y: number, size: number = 10) => {
                doc.setFontSize(size);
                const textWidth = doc.getTextWidth(text);
                doc.text(text, (pageWidth - textWidth) / 2, y);
            };

            // Helper for horizontal line
            const drawLine = (y: number) => {
                doc.setDrawColor(200, 200, 200);
                doc.line(margin, y, pageWidth - margin, y);
                return y + 2; // Return next yPos
            };

            // Helper for section header
            const drawSectionHeader = (title: string, y: number) => {
                doc.setFillColor(240, 240, 240);
                doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');
                doc.setFontSize(10);
                doc.setTextColor(50, 50, 50);
                doc.setFont("helvetica", "bold");
                doc.text(title.toUpperCase(), centerTextX(title), y + 5.5);
                doc.setFont("helvetica", "normal");
                return y + 14;
            };

            const centerTextX = (text: string) => {
                return (pageWidth - doc.getTextWidth(text)) / 2 + (doc.getTextWidth(text) / 2) - (doc.getTextWidth(text) / 2); // Simpler: (PageWidth - TextWidth) / 2
            };

            // 1. Header & Logo
            doc.setFillColor(15, 23, 42); // Slate-900 heading
            doc.rect(0, 0, pageWidth, 40, 'F');

            // Add Logo
            const logoImg = new Image();
            logoImg.src = '/carma-logo.png';
            await new Promise((resolve) => {
                logoImg.onload = resolve;
                logoImg.onerror = resolve;
            });
            doc.addImage(logoImg, 'PNG', margin, 5, 30, 30);

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text(`${selectedYear} Emissions Data Analysis Report`, margin + 35, 20);

            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleString()}`, margin + 35, 32);
            doc.text(`Simulation Duration: ${simulation.data_points} days`, pageWidth - margin - 50, 32);

            let yPos = 55;
            doc.setTextColor(0, 0, 0);

            // 2. Average Values & Key Stats
            yPos = drawSectionHeader("AVERAGE VALUES & KEY STATS", yPos);

            const tableHeaders = ["Metric", "Baseline", "With Policy", "Change", "% Change"];
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            let xPos = margin;
            tableHeaders.forEach(h => { doc.text(h, xPos, yPos); xPos += 35; });
            yPos += 5;
            doc.line(margin, yPos - 3, pageWidth - margin, yPos - 3); // Header line

            const rows = [
                ["Daily Avg Emissions",
                    `${simulation.summary.baseline_avg.toFixed(2)}`,
                    `${simulation.summary.adjusted_avg.toFixed(2)}`,
                    `${simulation.summary.total_reduction.toFixed(2)}`,
                    `${simulation.summary.change_pct.toFixed(2)}%`
                ],
                ["Yearly Total (Mt)",
                    `${((simulation.summary.yearly_baseline_total ?? 0) / 1000).toFixed(2)}`,
                    `${((simulation.summary.yearly_adjusted_total ?? 0) / 1000).toFixed(2)}`,
                    `${((simulation.summary.yearly_savings ?? 0) / 1000).toFixed(2)}`,
                    `${simulation.summary.change_pct.toFixed(2)}%`
                ]
            ];

            doc.setFont("helvetica", "normal");
            rows.forEach(row => {
                xPos = margin;
                row.forEach(cell => { doc.text(cell, xPos, yPos); xPos += 35; });
                yPos += 6;
            });
            yPos += 8;

            // 3. Sector Breakdown (Table)
            yPos = drawSectionHeader("SECTOR BREAKDOWN & COMPARISON", yPos);

            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("Sector", margin, yPos);
            doc.text("Baseline (kt)", margin + 50, yPos);
            doc.text("With Policy (kt)", margin + 85, yPos);
            doc.text("Impact", margin + 120, yPos);
            doc.text("Contribution %", margin + 150, yPos);
            yPos += 5;
            doc.line(margin, yPos - 3, pageWidth - margin, yPos - 3);

            doc.setFont("helvetica", "normal");
            Object.keys(baselineStats.sectorTotals).forEach(sector => {
                const baseVal = baselineStats.sectorTotals[sector];
                const polVal = policyStats.sectorTotals[sector];
                const diff = baseVal - polVal; // Positive means reduction
                const pctChange = ((polVal - baseVal) / baseVal) * 100;
                const contribPct = (polVal / policyStats.totalEmission) * 100;

                doc.text(sector.replace('_', ' '), margin, yPos);
                doc.text((baseVal / 1000).toFixed(2), margin + 50, yPos); // kt -> roughly similar scale
                doc.text((polVal / 1000).toFixed(2), margin + 85, yPos);
                doc.setTextColor(diff > 0 ? 0 : 200, diff > 0 ? 150 : 0, 0); // Green for reduction, Red for increase
                doc.text(`${Math.abs(pctChange).toFixed(1)}% ${pctChange < 0 ? '↓' : '↑'}`, margin + 120, yPos);
                doc.setTextColor(0, 0, 0);
                doc.text(`${contribPct.toFixed(1)}%`, margin + 150, yPos);

                yPos += 6;
            });
            yPos += 8;

            // 4. Monthly Averages (Quick Table)
            // Only show if we have enough months (e.g., > 1)
            if (policyStats.monthlyAverages.length > 1) {
                // Check space
                if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }

                yPos = drawSectionHeader("MONTHLY AVERAGES (FORECAST)", yPos);
                doc.setFontSize(9);
                doc.setFont("helvetica", "bold");
                doc.text("Month", margin, yPos);
                doc.text("Avg Emissions (kt)", margin + 60, yPos);
                doc.text("Avg AQI (Est)", margin + 120, yPos);
                yPos += 5;
                doc.line(margin, yPos - 3, pageWidth - margin, yPos - 3);

                doc.setFont("helvetica", "normal");
                policyStats.monthlyAverages.forEach(m => {
                    doc.text(m.month, margin, yPos);
                    doc.text(m.avgEmission.toFixed(2), margin + 60, yPos);
                    doc.text(m.avgAQI.toFixed(0), margin + 120, yPos);
                    yPos += 6;

                    if (yPos > pageHeight - 20) { doc.addPage(); yPos = 20; }
                });
                yPos += 8;
            }

            // 5. Identified Trends & Conclusion
            if (yPos > pageHeight - 80) { doc.addPage(); yPos = 20; }
            yPos = drawSectionHeader("IDENTIFIED TRENDS & INSIGHTS", yPos);

            // Find max/min month
            const maxMonth = policyStats.monthlyAverages.reduce((a, b) => a.avgEmission > b.avgEmission ? a : b);
            const minMonth = policyStats.monthlyAverages.reduce((a, b) => a.avgEmission < b.avgEmission ? a : b);

            // Find top sector
            const topSector = Object.entries(policyStats.sectorTotals).reduce((a, b) => a[1] > b[1] ? a : b);
            const topSectorPct = ((topSector[1] / policyStats.totalEmission) * 100).toFixed(1);

            const trends = [
                `• Peak Emissions: Observed in ${maxMonth.month} (${maxMonth.avgEmission.toFixed(2)} kt avg).`,
                `• Lowest Emissions: Observed in ${minMonth.month} (${minMonth.avgEmission.toFixed(2)} kt avg).`,
                `• Primary Contributor: ${topSector[0].replace('_', ' ')} accounts for ${topSectorPct}% of total emissions.`,
                `• Policy Impact: The selected policies resulted in a ${Math.abs(simulation.summary.change_pct).toFixed(1)}% reduction in total emissions.`
            ];

            doc.setFontSize(10);
            trends.forEach(t => {
                doc.text(t, margin, yPos);
                yPos += 6;
            });
            yPos += 5;

            doc.setFont("helvetica", "italic");
            const conclusion = `CONCLUSION: The simulation for ${selectedYear} indicates that policy interventions like ${selectedPolicies.length > 0 ? selectedPolicies[0] : '...'} efficiently mitigate emissions, particularly in the ${topSector[0]} sector.`;
            const splitConclusion = doc.splitTextToSize(conclusion, pageWidth - (margin * 2));
            doc.text(splitConclusion, margin, yPos);
            yPos += (splitConclusion.length * 5) + 10;

            // 6. Visual Chart (New Page for cleanup)
            doc.addPage();
            yPos = 20;
            yPos = drawSectionHeader("VISUALIZATION", yPos);

            if (chartRef.current) {
                const canvas = await html2canvas(chartRef.current, {
                    scale: 2,
                    backgroundColor: '#111827',
                    logging: false
                } as any);
                const imgData = canvas.toDataURL('image/png');
                const imgProps = (doc as any).getImageProperties(imgData);
                const pdfWidth = pageWidth - (margin * 2);
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                doc.addImage(imgData, 'PNG', margin, yPos, pdfWidth, pdfHeight);
            }

            // Footer
            const pageCount = doc.internal.pages.length - 1; // jsPDF array has extra empty page? check docs logic or just use simple counter
            // doc.text(`Page 1 of ${pageCount}`, ...) - hard to know total beforehand without buffering
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text("Generated by CARMA Urban Digital Twin", margin, pageHeight - 10);

            doc.save(`analyzed_report_${selectedYear}.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    };

    const [chatOpen, setChatOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatLoading, setChatLoading] = useState(false);

    const handleChatSubmit = async (userMsg: string) => {
        if (selectedPolicies.length === 0) return;

        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setChatLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/policies/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    policy_ids: selectedPolicies,
                    question: userMsg
                })
            });
            const result = await response.json();
            if (result.status === 'success') {
                setChatHistory(prev => [...prev, { role: 'assistant', content: result.answer }]);
            } else {
                setChatHistory(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't process that request." }]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            setChatHistory(prev => [...prev, { role: 'assistant', content: "Error connecting to AI service." }]);
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <div className="glass-panel p-6 mt-6 relative">
            {/* Chat Interface - Floating or Integrated */}
            {selectedPolicies.length > 0 && (
                <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${chatOpen ? 'w-96' : 'w-auto'}`}>
                    {!chatOpen && (
                        <button
                            onClick={() => setChatOpen(true)}
                            className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white p-4 pl-5 pr-6 rounded-full shadow-lg shadow-emerald-600/40 flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/50 border border-white/10"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none blur-md" />
                            <span className="text-2xl animate-pulse">✨</span>
                            <div className="flex flex-col items-start leading-tight">
                                <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-bold">AI Assistant</span>
                                <span className="font-bold text-sm">Analyze Policies</span>
                            </div>
                        </button>
                    )}

                    {chatOpen && (
                        <div className="bg-[#0f1014] border border-white/10 rounded-2xl shadow-2xl flex flex-col h-[500px] overflow-hidden">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                                <h4 className="font-bold text-white flex items-center gap-2">
                                    <span className="text-xl">✨</span> Gemini Policy Analyst
                                </h4>
                                <button
                                    onClick={() => setChatOpen(false)}
                                    className="text-white/40 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            <ChatInterface
                                messages={chatHistory}
                                onSendMessage={handleChatSubmit}
                                isLoading={chatLoading}
                                placeholder="Ask about policies..."
                                height="100%"
                                className="flex-1 border-0 rounded-none"
                                emptyState={{
                                    title: "👋 Hi! I'm your policy assistant.",
                                    suggestions: ['Policy costs?', 'Environmental impact?'],
                                }}
                                renderMessage={(msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white/10 text-white/90 rounded-tl-none'
                                            }`}>
                                            <ReactMarkdown
                                                components={{
                                                    strong: (props: any) => <span className="font-bold text-blue-200" {...props} />,
                                                    ul: (props: any) => <ul className="list-disc pl-4 space-y-1 my-1" {...props} />,
                                                    li: (props: any) => <li className="marker:text-blue-400" {...props} />,
                                                    p: (props: any) => <p className="mb-1 last:mb-0" {...props} />
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Calculate Economic Totals for Selected Policies */}
            {(() => {
                const selectedPolicyData = policies.filter(p => selectedPolicies.includes(p.id));
                const totalImplementationCost = selectedPolicyData.reduce((sum, p) => sum + (p.economic_data?.implementation_cost_cr || 0), 0);
                const totalAnnualSavings = selectedPolicyData.reduce((sum, p) => sum + (p.economic_data?.annual_savings_cr || 0), 0);
                const totalHealthBenefits = selectedPolicyData.reduce((sum, p) => sum + (p.economic_data?.health_benefits_cr || 0), 0);
                const avgGdpImpact = selectedPolicyData.length > 0
                    ? selectedPolicyData.reduce((sum, p) => sum + (p.economic_data?.gdp_impact_percent || 0), 0) / selectedPolicyData.length
                    : 0;
                const totalJobsAffected = selectedPolicyData.reduce((sum, p) => sum + Math.abs(p.economic_data?.jobs_affected || 0), 0);
                const netBenefit = totalAnnualSavings + totalHealthBenefits - totalImplementationCost;

                return (
                    <>
                        {/* Header with Year Selector */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Scale className="w-5 h-5 text-amber-400" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                                    Policy Impact Simulator
                                </span>
                                {simulation && (
                                    <span className="text-xs font-normal bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30 ml-2">
                                        {selectedYear} Forecast
                                    </span>
                                )}
                            </h3>
                            <div className="flex items-center gap-3">
                                {/* Year Selector */}
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-white/40" />
                                    <div className="flex bg-white/5 rounded-full p-0.5 border border-white/10">
                                        {years.map(year => (
                                            <button
                                                key={year}
                                                onClick={() => setSelectedYear(year)}
                                                className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${selectedYear === year
                                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                                    : 'text-white/50 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                {year}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {simulation && (
                                    <button
                                        onClick={generatePDF}
                                        className="flex items-center gap-1.5 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-full transition-all border border-emerald-500/30"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Download PDF Report
                                    </button>
                                )}
                                {selectedPolicies.length > 0 && (
                                    <button
                                        onClick={() => setSelectedPolicies([])}
                                        className="text-xs bg-white/5 hover:bg-white/10 text-white/60 px-3 py-1.5 rounded-full transition-all border border-white/10"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Economic Impact Summary - Shown when policies are selected */}
                        {selectedPolicies.length > 0 && (
                            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-amber-400 text-lg">💰</span>
                                    <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Economic Impact Summary</h4>
                                    <span className="text-xs text-white/40 ml-auto">{selectedPolicies.length} {selectedPolicies.length === 1 ? 'policy' : 'policies'} selected</span>
                                </div>

                                {/* Key Metrics Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                                        <div className="text-[10px] text-white/40 uppercase mb-1">Total Implementation Cost</div>
                                        <div className="text-lg font-bold text-red-400">₹{totalImplementationCost >= 1000 ? `${(totalImplementationCost / 1000).toFixed(1)}K` : totalImplementationCost} Cr</div>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                                        <div className="text-[10px] text-white/40 uppercase mb-1">Annual Cost Savings</div>
                                        <div className="text-lg font-bold text-emerald-400">₹{totalAnnualSavings >= 1000 ? `${(totalAnnualSavings / 1000).toFixed(1)}K` : totalAnnualSavings} Cr</div>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                                        <div className="text-[10px] text-white/40 uppercase mb-1">Health Benefits</div>
                                        <div className="text-lg font-bold text-blue-400">₹{totalHealthBenefits >= 1000 ? `${(totalHealthBenefits / 1000).toFixed(1)}K` : totalHealthBenefits} Cr</div>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                                        <div className="text-[10px] text-white/40 uppercase mb-1">Net Economic Benefit</div>
                                        <div className={`text-lg font-bold ${netBenefit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {netBenefit >= 0 ? '+' : '-'}₹{Math.abs(netBenefit) >= 1000 ? `${(Math.abs(netBenefit) / 1000).toFixed(1)}K` : Math.abs(netBenefit)} Cr
                                        </div>
                                    </div>
                                </div>

                                {/* Bullet Points Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs text-white/70">
                                    <div className="flex items-start gap-2">
                                        <span className="text-amber-400 mt-0.5">•</span>
                                        <span><strong className="text-white/90">GDP Impact:</strong> {avgGdpImpact >= 0 ? '+' : ''}{avgGdpImpact.toFixed(2)}% average across selected policies</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-amber-400 mt-0.5">•</span>
                                        <span><strong className="text-white/90">Employment:</strong> ~{totalJobsAffected.toLocaleString()} jobs potentially affected</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-amber-400 mt-0.5">•</span>
                                        <span><strong className="text-white/90">ROI:</strong> Estimated payback in {totalImplementationCost > 0 ? (totalImplementationCost / (totalAnnualSavings + totalHealthBenefits)).toFixed(1) : '0'} years</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-amber-400 mt-0.5">•</span>
                                        <span><strong className="text-white/90">Benefit-Cost Ratio:</strong> {totalImplementationCost > 0 ? ((totalAnnualSavings + totalHealthBenefits) / totalImplementationCost).toFixed(2) : 'N/A'}:1</span>
                                    </div>
                                </div>

                                {/* Additional Insights */}
                                <div className="mt-3 pt-3 border-t border-white/10">
                                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Policy Cost Breakdown</div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedPolicyData.map(policy => (
                                            <div key={policy.id} className="bg-white/5 rounded-full px-3 py-1 text-xs flex items-center gap-2 border border-white/10">
                                                <span>{policy.icon}</span>
                                                <span className="text-white/70">{policy.name}</span>
                                                <span className="text-amber-300/80">₹{policy.economic_data?.implementation_cost_cr || 0} Cr</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Policy Selection */}
                        <div className="mb-6">
                            <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Select Policies to Simulate</div>
                            {loadingPolicies ? (
                                <div className="flex gap-2 flex-wrap">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-10 w-32 bg-white/5 rounded-full animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex gap-2 flex-wrap">
                                    {policies.map(policy => {
                                        const isSelected = selectedPolicies.includes(policy.id);
                                        return (
                                            <button
                                                key={policy.id}
                                                onClick={() => togglePolicy(policy.id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${isSelected
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                                                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                                                    }`}
                                            >
                                                <span>{policy.icon}</span>
                                                <span>{policy.name}</span>
                                                {isSelected && <Check className="w-4 h-4" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Simulation Results */}
                        {loading && (
                            <div className="h-[300px] flex items-center justify-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                    <div className="text-white/60 animate-pulse">Running {selectedYear} simulation...</div>
                                </div>
                            </div>
                        )}

                        {!loading && simulation && (
                            <>
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Baseline Daily Avg</div>
                                        <div className="text-xl font-bold text-white/60">{simulation.summary.baseline_avg.toFixed(1)} kt</div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">With Policy</div>
                                        <div className="text-xl font-bold text-emerald-400">{simulation.summary.adjusted_avg.toFixed(1)} kt</div>
                                    </div>
                                    <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30">
                                        <div className="text-[10px] text-emerald-400/60 uppercase tracking-wider mb-1">Reduction</div>
                                        <div className="text-xl font-bold text-emerald-400 flex items-center gap-1">
                                            <TrendingDown className="w-5 h-5" />
                                            {Math.abs(simulation.summary.change_pct).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Daily Savings</div>
                                        <div className="text-xl font-bold text-white">{simulation.summary.total_reduction.toFixed(1)} kt</div>
                                    </div>
                                    {simulation.summary.yearly_savings && (
                                        <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/30">
                                            <div className="text-[10px] text-blue-400/60 uppercase tracking-wider mb-1">{selectedYear} Total Saved</div>
                                            <div className="text-xl font-bold text-blue-400">{(simulation.summary.yearly_savings / 1000).toFixed(1)} Mt</div>
                                        </div>
                                    )}
                                </div>

                                {/* Chart with Year Label */}
                                <div className="mb-2">
                                    <div className="text-xs text-white/40 uppercase tracking-wider flex items-center gap-2">
                                        <span>📈 Emission Forecast Comparison</span>
                                        <span className="text-blue-400 font-bold">{selectedYear}</span>
                                        <span className="text-white/20">|</span>
                                        <span className="text-white/30">{simulation.data_points || getChartData().length * 7} days of data</span>
                                    </div>
                                </div>
                                <div ref={chartRef} className="h-[300px] w-full mb-6 p-2 bg-[#0d121f] rounded-xl">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={getChartData()}>
                                            <defs>
                                                <linearGradient id="policyGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                stroke="rgba(255,255,255,0.4)"
                                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                                                tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                                tickFormatter={formatDate}
                                                interval={Math.floor(getChartData().length / 8)}
                                            />
                                            <YAxis
                                                stroke="rgba(255,255,255,0.4)"
                                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                                                tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                                domain={['auto', 'auto']}
                                                label={{ value: 'kt CO₂/day', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(15, 5, 24, 0.95)',
                                                    borderColor: 'rgba(255,255,255,0.1)',
                                                    color: '#fff',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                                    backdropFilter: 'blur(10px)'
                                                }}
                                                itemStyle={{ color: '#fff' }}
                                                formatter={(value: number | undefined, name: string | undefined) => {
                                                    if (value === undefined) return ['-', name ?? ''];
                                                    // Map dataKey to proper labels
                                                    if (name === 'baseline' || name === 'Baseline (No Policy)') {
                                                        return [`${value.toFixed(2)} kt CO₂`, 'Baseline (No Policy)'];
                                                    } else if (name === 'withPolicy' || name === 'With Selected Policies') {
                                                        return [`${value.toFixed(2)} kt CO₂`, 'With Policy'];
                                                    }
                                                    return [`${value.toFixed(2)} kt CO₂`, name ?? ''];
                                                }}
                                                labelFormatter={(dateStr) => {
                                                    const date = new Date(dateStr);
                                                    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                                                }}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                            <Area
                                                type="monotone"
                                                dataKey="withPolicy"
                                                fill="url(#policyGradient)"
                                                stroke="transparent"
                                                legendType="none"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="baseline"
                                                stroke="#6b7280"
                                                strokeWidth={2}
                                                strokeDasharray="5 5"
                                                dot={false}
                                                name="Baseline (No Policy)"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="withPolicy"
                                                stroke="#10b981"
                                                strokeWidth={3}
                                                dot={false}
                                                activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                                                name="With Selected Policies"
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Sector Impact Breakdown */}
                                <div className="border-t border-white/10 pt-6">
                                    <div className="text-xs text-white/40 uppercase tracking-wider mb-4">Sector Impact Breakdown</div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        {Object.entries(simulation.combined_impacts).map(([sector, impact]) => {
                                            const impactPct = (impact * 100).toFixed(1);
                                            const isReduction = impact < 0;
                                            return (
                                                <div
                                                    key={sector}
                                                    className={`p-3 rounded-xl border ${isReduction
                                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                                        : impact > 0
                                                            ? 'bg-red-500/5 border-red-500/20'
                                                            : 'bg-white/5 border-white/10'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-lg">{getSectorIcon(sector)}</span>
                                                        <span className="text-xs text-white/60">{sector.replace('_', ' ')}</span>
                                                    </div>
                                                    <div className={`text-lg font-bold ${isReduction
                                                        ? 'text-emerald-400'
                                                        : impact > 0
                                                            ? 'text-red-400'
                                                            : 'text-white/40'
                                                        }`}>
                                                        {impact > 0 ? '+' : ''}{impactPct}%
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Model Calculation Display */}
                                {simulation.model_calculation && (
                                    <div className="border-t border-white/10 pt-6 mt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-xs text-white/40 uppercase tracking-wider">
                                                {simulation.model_calculation.model_name}
                                            </div>
                                            <div className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                                                ΔE = D × Σ Bᵢ × (αᵢ/100)
                                            </div>
                                        </div>

                                        {/* Formula Result */}
                                        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 rounded-xl border border-purple-500/20 mb-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Proportional Change (ΔE)</div>
                                                    <div className="text-2xl font-bold text-purple-400">
                                                        {simulation.model_calculation.delta_e_pct.toFixed(2)}%
                                                    </div>
                                                    <div className="text-xs text-white/30 mt-1">relative to BAU baseline</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-white/40 font-mono bg-black/30 px-3 py-2 rounded-lg">
                                                        {simulation.model_calculation.formula}
                                                    </div>
                                                    <div className="text-[10px] text-white/30 mt-2">
                                                        D = {simulation.model_calculation.calibration_d} (calibration constant)
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sector Contributions Table */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="text-white/40 border-b border-white/10">
                                                        <th className="text-left py-2 px-2">Sector</th>
                                                        <th className="text-right py-2 px-2">Weight (Bᵢ)</th>
                                                        <th className="text-right py-2 px-2">Reduction (αᵢ)</th>
                                                        <th className="text-right py-2 px-2">Contribution</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Object.entries(simulation.model_calculation.sector_weights).map(([sector, weight]) => {
                                                        const reduction = simulation.model_calculation!.combined_reductions[sector] || 0;
                                                        const contribution = simulation.model_calculation!.sector_contributions[sector] || 0;
                                                        return (
                                                            <tr key={sector} className="border-b border-white/5 hover:bg-white/5">
                                                                <td className="py-2 px-2 text-white/70">
                                                                    <span className="mr-2">{getSectorIcon(sector)}</span>
                                                                    {sector.replace('_', ' ')}
                                                                </td>
                                                                <td className="py-2 px-2 text-right text-white/50 font-mono">
                                                                    {(weight as number).toFixed(4)}
                                                                </td>
                                                                <td className="py-2 px-2 text-right font-mono">
                                                                    <span className={reduction > 0 ? 'text-emerald-400' : reduction < 0 ? 'text-red-400' : 'text-white/30'}>
                                                                        {reduction > 0 ? '-' : ''}{Math.abs(reduction).toFixed(1)}%
                                                                    </span>
                                                                </td>
                                                                <td className="py-2 px-2 text-right text-purple-400 font-mono">
                                                                    {contribution.toFixed(6)}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    <tr className="border-t border-white/20">
                                                        <td colSpan={3} className="py-2 px-2 text-right text-white/60 font-bold">Total Σ</td>
                                                        <td className="py-2 px-2 text-right text-purple-400 font-mono font-bold">
                                                            {simulation.model_calculation.total_contribution.toFixed(6)}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Interpretation Note */}
                                        <div className="mt-4 text-[10px] text-white/30 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                                            <span className="text-white/50 font-bold">Note:</span> {simulation.model_calculation.interpretation}
                                        </div>
                                    </div>
                                )}

                                {/* Applied Policies */}
                                <div className="mt-6 flex items-center gap-2 text-xs text-white/40 flex-wrap">
                                    <span>Active:</span>
                                    {simulation.applied_policies.map(p => (
                                        <span key={p.id} className="bg-white/10 px-2 py-1 rounded-full">
                                            {p.icon} {p.name}
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Empty State */}
                        {!loading && !simulation && (
                            <div className="h-[250px] flex items-center justify-center border-2 border-dashed border-white/10 rounded-2xl">
                                <div className="text-center">
                                    <Scale className="w-12 h-12 text-white/20 mx-auto mb-3" />
                                    <p className="text-white/40 text-sm">Select one or more policies above to see their impact on <span className="text-blue-400 font-bold">{selectedYear}</span></p>
                                    <p className="text-white/20 text-xs mt-1">Policies can be combined for cumulative effect</p>
                                </div>
                            </div>
                        )}
                    </>
                );
            })()}
        </div>
    );
}
