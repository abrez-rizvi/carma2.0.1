"use client";

import { useState } from "react";
import { useGlobalState, type ScenarioResult } from "../context/GlobalStateContext";
import { CityScenarioBar } from "./CityScenarioBar";
import { BaselineOverview } from "./BaselineOverview";
import { SectorInterdependence } from "./SectorInterdependence";
import { PolicyLab, calculateEstimatedImpacts, POLICY_CONTROLS } from "./PolicyLab";
import { AIPolicyGenerator } from "./AIPolicyGenerator";
import { ResultsDashboard } from "./ResultsDashboard";
import { AQIMaps } from "./AQIMaps";
import { EmissionMaps } from "./EmissionMaps";
import { SectorMaps } from "./SectorMaps";
import { ScenarioComparison } from "./ScenarioComparison";
import { PolicyHeatmap } from "./PolicyHeatmap";
import { API_BASE_URL } from "../config";
import { Download, Loader2, FileText, CheckCircle2 } from "lucide-react";

// ============================================================================
// PDF REPORT GENERATOR  (text-rich + targeted chart screenshot)
// ============================================================================

async function generateFullReport(
  policyValues: Record<string, number>,
  latestResult: ScenarioResult | null,
  scenarios: ScenarioResult[],
  onProgress: (step: string, pct: number) => void
) {
  onProgress("Loading PDF library...", 5);
  const jsPDFModule = await import("jspdf");
  const jsPDF = jsPDFModule.default;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docAny = doc as any;
  const pw = doc.internal.pageSize.getWidth();   // 210
  const ph = doc.internal.pageSize.getHeight();   // 297
  const m = 15; // margin
  const cw = pw - m * 2; // content width
  let y = m;

  // ── DRAWING HELPERS ───────────────────────────────────────────
  const ensureSpace = (need: number) => {
    if (y + need > ph - 15) { doc.addPage(); y = m; return true; }
    return false;
  };

  const text = (t: string, sz: number, clr: number[], bold = false, x = m) => {
    ensureSpace(sz * 0.45 + 2);
    doc.setFontSize(sz);
    doc.setTextColor(clr[0], clr[1], clr[2]);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(t, x, y);
    y += sz * 0.45 + 1.5;
  };

  const gap = (mm = 3) => { y += mm; };

  const hr = () => {
    ensureSpace(5);
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.3);
    doc.line(m, y, pw - m, y);
    y += 4;
  };

  const sectionTitle = (title: string) => {
    ensureSpace(14);
    // Accent bar
    doc.setFillColor(16, 185, 129);
    doc.rect(m, y, 3, 8, "F");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(title, m + 6, y + 6);
    y += 14;
  };

  // Draw a data row (label + value)
  const dataRow = (label: string, value: string, labelClr = [180, 180, 180], valClr = [255, 255, 255]) => {
    ensureSpace(7);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(labelClr[0], labelClr[1], labelClr[2]);
    doc.text(label, m + 4, y);
    doc.setTextColor(valClr[0], valClr[1], valClr[2]);
    doc.setFont("helvetica", "bold");
    doc.text(value, m + cw * 0.55, y);
    y += 6;
  };

  // Draw table header
  const tableHeader = (cols: { label: string; x: number }[]) => {
    ensureSpace(10);
    doc.setFillColor(30, 30, 30);
    doc.rect(m, y - 1, cw, 7, "F");
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    cols.forEach(c => doc.text(c.label, c.x, y + 3));
    y += 9;
  };

  // Draw table row
  const tableRow = (cols: { text: string; x: number; clr?: number[] }[]) => {
    ensureSpace(7);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    cols.forEach(c => {
      doc.setTextColor(...(c.clr || [200, 200, 200]) as [number, number, number]);
      doc.text(c.text, c.x, y);
    });
    y += 5.5;
  };

  const fillPage = (r: number, g: number, b: number) => {
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, pw, ph, "F");
  };

  // ──────────────────────────────────────────────────────────────
  // PAGE 1: COVER PAGE
  // ──────────────────────────────────────────────────────────────
  onProgress("Building cover page...", 10);
  fillPage(10, 10, 15);

  // Accent line
  doc.setFillColor(16, 185, 129);
  doc.rect(m, 40, 50, 3, "F");

  y = 52;
  text("CARMA", 40, [16, 185, 129], true);
  text("Urban CO\u2082 Digital Twin", 16, [180, 180, 180]);
  gap(4);
  text("Policy Simulation Report", 24, [255, 255, 255], true);
  gap(12);
  hr();
  gap(4);

  const now = new Date();
  text(`Generated:  ${now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`, 10, [140, 140, 140]);
  text(`Time:       ${now.toLocaleTimeString("en-IN")}`, 10, [140, 140, 140]);
  text(`City:       Delhi, India`, 10, [140, 140, 140]);
  text(`Region:     National Capital Territory`, 10, [140, 140, 140]);
  gap(10);

  // Quick summary box
  if (latestResult) {
    doc.setFillColor(16, 185, 129, 0.15);
    doc.setFillColor(20, 35, 25);
    doc.roundedRect(m, y, cw, 40, 3, 3, "F");
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.roundedRect(m, y, cw, 40, 3, 3, "S");

    const by = y + 8;
    doc.setFontSize(9);
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    doc.text("QUICK RESULTS", m + 6, by);

    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129);
    doc.text(`${latestResult.metrics.co2Reduction.toFixed(1)}%`, m + 6, by + 12);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text("CO\u2082 Reduction", m + 6, by + 17);

    doc.setFontSize(20);
    doc.setTextColor(6, 182, 212);
    doc.text(`${latestResult.metrics.aqiImprovement.toFixed(1)}%`, m + 50, by + 12);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text("AQI Improvement", m + 50, by + 17);

    const gdpClr = latestResult.metrics.gdpChange >= 0 ? [34, 197, 94] : [239, 68, 68];
    doc.setFontSize(20);
    doc.setTextColor(gdpClr[0], gdpClr[1], gdpClr[2]);
    doc.text(`${latestResult.metrics.gdpChange >= 0 ? "+" : ""}${latestResult.metrics.gdpChange.toFixed(2)}%`, m + 100, by + 12);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text("GDP Impact", m + 100, by + 17);

    doc.setFontSize(20);
    doc.setTextColor(244, 114, 182);
    doc.text(`Rs.${latestResult.metrics.healthBenefit.toFixed(0)} Cr`, m + 145, by + 12);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text("Health Benefit", m + 145, by + 17);

    y += 46;
  }

  // ──────────────────────────────────────────────────────────────
  // PAGE 2: POLICY CONFIGURATION
  // ──────────────────────────────────────────────────────────────
  onProgress("Adding policy configuration...", 25);
  doc.addPage();
  fillPage(10, 10, 15);
  y = m;

  sectionTitle("POLICY CONFIGURATION");
  gap(2);

  const activeSliders = Object.entries(policyValues).filter(([, v]) => v > 0);
  if (activeSliders.length === 0) {
    text("No policies configured. All sliders at 0%.", 10, [140, 140, 140]);
  } else {
    // Table
    const cx1 = m + 4;
    const cx2 = m + cw * 0.35;
    const cx3 = m + cw * 0.55;
    const cx4 = m + cw * 0.75;
    tableHeader([
      { label: "Policy Lever", x: cx1 },
      { label: "Level", x: cx2 },
      { label: "Sector", x: cx3 },
      { label: "Est. Reduction", x: cx4 },
    ]);

    POLICY_CONTROLS.forEach(pc => {
      const val = policyValues[pc.id] || 0;
      if (val > 0) {
        const reduction = (val * pc.weight).toFixed(1);
        tableRow([
          { text: pc.label, x: cx1 },
          { text: `${val}%`, x: cx2, clr: [16, 185, 129] },
          { text: pc.sector.replace("_", " "), x: cx3 },
          { text: `${reduction}%`, x: cx4, clr: [6, 182, 212] },
        ]);
      }
    });
  }

  // ──────────────────────────────────────────────────────────────
  // SIMULATION RESULTS
  // ──────────────────────────────────────────────────────────────
  if (latestResult) {
    gap(8);
    sectionTitle("SIMULATION RESULTS");
    gap(2);
    text(`Scenario: ${latestResult.name}`, 11, [200, 200, 200]);
    gap(4);

    dataRow("CO\u2082 Reduction", `${latestResult.metrics.co2Reduction.toFixed(1)}%`, [180, 180, 180], [16, 185, 129]);
    dataRow("AQI Improvement", `${latestResult.metrics.aqiImprovement.toFixed(1)}%`, [180, 180, 180], [6, 182, 212]);
    dataRow("GDP Impact", `${latestResult.metrics.gdpChange >= 0 ? "+" : ""}${latestResult.metrics.gdpChange.toFixed(2)}%`, [180, 180, 180], latestResult.metrics.gdpChange >= 0 ? [34, 197, 94] : [239, 68, 68]);
    dataRow("Health Benefit", `Rs.${latestResult.metrics.healthBenefit.toFixed(0)} Crores`, [180, 180, 180], [244, 114, 182]);
    dataRow("Est. Lives Saved", `${Math.round(latestResult.metrics.co2Reduction * 120)}+`, [180, 180, 180], [168, 85, 247]);

    // Sector breakdown table
    gap(6);
    sectionTitle("SECTOR IMPACT BREAKDOWN");
    gap(2);

    const sx1 = m + 4;
    const sx2 = m + cw * 0.4;
    const sx3 = m + cw * 0.65;
    tableHeader([
      { label: "Sector", x: sx1 },
      { label: "Reduction %", x: sx2 },
      { label: "Impact Level", x: sx3 },
    ]);

    Object.entries(latestResult.metrics.sectorEmissions).forEach(([sector, val]) => {
      const numVal = Number(val);
      const level = numVal > 10 ? "High" : numVal > 5 ? "Medium" : numVal > 0 ? "Low" : "None";
      const clr = numVal > 10 ? [16, 185, 129] : numVal > 5 ? [251, 191, 36] : numVal > 0 ? [6, 182, 212] : [100, 100, 100];
      tableRow([
        { text: sector.replace("_", " "), x: sx1 },
        { text: numVal > 0 ? `-${numVal.toFixed(1)}%` : "0.0%", x: sx2, clr },
        { text: level, x: sx3, clr },
      ]);
    });

    // ──────────────────────────────────────────────────────────
    // CHART SCREENSHOT
    // ──────────────────────────────────────────────────────────
    onProgress("Capturing results chart...", 45);
    try {
      // Target the chart container inside the results section
      const chartEl = document.querySelector("#results .recharts-responsive-container")?.parentElement;
      if (chartEl) {
        const html2canvasModule = await import("html2canvas");
        const html2canvas = html2canvasModule.default;
        const canvas = await html2canvas(chartEl as HTMLElement, {
          scale: 2,
          backgroundColor: "#111827",
          logging: false,
        } as any);
        const imgData = canvas.toDataURL("image/png");
        const imgProps = docAny.getImageProperties?.(imgData) || { width: canvas.width, height: canvas.height };
        const imgW = cw;
        const imgH = (imgProps.height * imgW) / imgProps.width;

        ensureSpace(imgH + 14);
        gap(4);
        sectionTitle("EMISSION FORECAST CHART");
        gap(2);
        doc.addImage(imgData, "PNG", m, y, imgW, Math.min(imgH, 100));
        y += Math.min(imgH, 100) + 4;
      }
    } catch (err) {
      console.warn("Chart capture failed:", err);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // ECONOMIC COST ANALYSIS
  // ──────────────────────────────────────────────────────────────
  onProgress("Adding economic analysis...", 60);

  const impacts = calculateEstimatedImpacts(policyValues);

  // Import the economic calculator from PolicyLab
  const { calculateEconomicCosts } = await import("./PolicyLab");
  const economics = calculateEconomicCosts(policyValues);

  if (economics.implementationCost > 0) {
    ensureSpace(60);
    gap(4);
    sectionTitle("ECONOMIC COST ANALYSIS");
    gap(2);

    // Cost section
    text("COSTS", 10, [239, 68, 68], true);
    gap(1);
    dataRow("Implementation Cost", `Rs.${economics.implementationCost.toLocaleString()} Crores`, [180, 180, 180], [239, 68, 68]);
    dataRow("Productivity Loss", `Rs.${economics.productivityLoss.toLocaleString()} Cr/year`, [180, 180, 180], [239, 120, 120]);
    dataRow("Enforcement Cost", `Rs.${economics.enforcementCost.toLocaleString()} Cr/year`, [180, 180, 180], [239, 120, 120]);
    gap(3);

    // Benefits section
    text("BENEFITS", 10, [16, 185, 129], true);
    gap(1);
    dataRow("Annual Savings", `Rs.${economics.annualSavings.toLocaleString()} Cr/year`, [180, 180, 180], [16, 185, 129]);
    dataRow("Health Benefits", `Rs.${economics.healthBenefits.toLocaleString()} Cr/year`, [180, 180, 180], [34, 197, 94]);
    dataRow("Carbon Credits", `Rs.${economics.carbonCredits.toLocaleString()} Cr/year`, [180, 180, 180], [34, 197, 94]);
    gap(3);

    // Net benefit
    hr();
    const netClr = economics.netBenefit >= 0 ? [16, 185, 129] : [239, 68, 68];
    dataRow("NET ECONOMIC BENEFIT", `${economics.netBenefit >= 0 ? "+" : "-"}Rs.${Math.abs(economics.netBenefit).toLocaleString()} Crores`, [255, 255, 255], netClr);
    if (economics.roiYears > 0) {
      dataRow("ROI Payback Period", `${economics.roiYears} years`, [180, 180, 180], [251, 191, 36]);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // SCENARIO COMPARISON (if saved scenarios exist)
  // ──────────────────────────────────────────────────────────────
  if (scenarios.length > 0) {
    onProgress("Adding scenario comparison...", 75);
    doc.addPage();
    fillPage(10, 10, 15);
    y = m;

    sectionTitle("SCENARIO COMPARISON");
    gap(2);

    const scx1 = m + 4;
    const scx2 = m + cw * 0.3;
    const scx3 = m + cw * 0.5;
    const scx4 = m + cw * 0.7;
    tableHeader([
      { label: "Scenario", x: scx1 },
      { label: "CO2 Red.", x: scx2 },
      { label: "AQI Imp.", x: scx3 },
      { label: "GDP", x: scx4 },
    ]);

    scenarios.forEach(sc => {
      tableRow([
        { text: sc.name.substring(0, 25), x: scx1 },
        { text: `${sc.metrics.co2Reduction.toFixed(1)}%`, x: scx2, clr: [16, 185, 129] },
        { text: `${sc.metrics.aqiImprovement.toFixed(1)}%`, x: scx3, clr: [6, 182, 212] },
        { text: `${sc.metrics.gdpChange >= 0 ? "+" : ""}${sc.metrics.gdpChange.toFixed(2)}%`, x: scx4, clr: sc.metrics.gdpChange >= 0 ? [34, 197, 94] : [239, 68, 68] },
      ]);
    });
  }

  // ──────────────────────────────────────────────────────────────
  // MAP SECTION NOTE
  // ──────────────────────────────────────────────────────────────
  onProgress("Adding maps reference...", 85);
  ensureSpace(30);
  gap(4);
  sectionTitle("MAPS & VISUALIZATIONS");
  gap(2);
  text("The following interactive maps are available in the web dashboard:", 10, [180, 180, 180]);
  gap(2);
  const maps = [
    "Delhi AQI Heatmap          - Grid-level AQI distribution across Delhi",
    "AQI Hotspots               - Live sensor readings from 40+ stations",
    "CO2 Emission Heatmap       - Sector-wise emission concentration",
    "Emission Sources           - Industry, Transport, Power source locations",
    "Sector-Specific Maps       - Per-sector heatmaps and hotspot analysis",
  ];
  maps.forEach(m_text => {
    text(`  * ${m_text}`, 9, [140, 140, 140]);
  });
  gap(2);
  text("Note: Interactive maps contain live data and cannot be embedded in static PDFs.", 8, [100, 100, 100]);
  text("Access the web dashboard for full interactive map visualization.", 8, [100, 100, 100]);

  // ──────────────────────────────────────────────────────────────
  // FOOTER ON ALL PAGES
  // ──────────────────────────────────────────────────────────────
  onProgress("Finalizing...", 95);
  let totalPages = 1;
  try { totalPages = docAny.getNumberOfPages() || docAny.internal.pages.length - 1 || 1; } catch { /* fallback */ }
  for (let p = 1; p <= totalPages; p++) {
    if (docAny.setPage) docAny.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text(`CARMA Urban CO\u2082 Digital Twin  |  Policy Simulation Report`, m, ph - 8);
    doc.text(`Page ${p} of ${totalPages}`, pw - m - 22, ph - 8);
  }

  onProgress("Downloading...", 100);
  doc.save(`CARMA_Report_${now.toISOString().slice(0, 10)}.pdf`);
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SimulationDashboard() {
  const {
    policyValues,
    activeSectors,
    timeHorizon,
    setIsSimulating,
    setLatestResult,
    addScenario,
    latestResult,
    simulationResults,
  } = useGlobalState();

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState("");
  const [pdfPct, setPdfPct] = useState(0);
  const [pdfDone, setPdfDone] = useState(false);

  const runSimulation = async () => {
    setIsSimulating(true);

    try {
      const impacts = calculateEstimatedImpacts(policyValues);

      try {
        const selectedPolicies = Object.entries(policyValues)
          .filter(([, val]) => val > 0)
          .map(([id]) => id);

        if (selectedPolicies.length > 0) {
          const response = await fetch(
            `${API_BASE_URL}/api/policies/simulate-year?year=${timeHorizon[1]}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                selected_policies: selectedPolicies,
                policy_values: policyValues,
                sectors: activeSectors,
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data && data.monthly_data) {
              console.log("API simulation successful", data);
            }
          }
        }
      } catch {
        console.log("API unavailable, using placeholder calculations");
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const sectorEmissions: Record<string, number> = {};
      Object.entries(impacts.sectorReductions).forEach(([sector, red]) => {
        sectorEmissions[sector] = red;
      });

      activeSectors.forEach((s) => {
        if (!(s in sectorEmissions)) {
          sectorEmissions[s] = 0;
        }
      });

      const scenarioResult: ScenarioResult = {
        id: Date.now().toString(),
        name: `Scenario ${new Date().toLocaleTimeString()}`,
        policyConfig: { ...policyValues },
        metrics: {
          co2Reduction: impacts.co2Reduction,
          aqiImprovement: impacts.aqiImprovement,
          gdpChange: impacts.gdpChange,
          healthBenefit: impacts.co2Reduction * 45,
          sectorEmissions,
        },
        timestamp: Date.now(),
      };

      setLatestResult(scenarioResult);
    } catch (error) {
      console.error("Simulation error:", error);
    } finally {
      setIsSimulating(false);
      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 200);
    }
  };

  const saveScenario = () => {
    if (latestResult) {
      addScenario(latestResult);
      setTimeout(() => {
        document.getElementById("comparison")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    }
  };

  const handleDownloadReport = async () => {
    setIsGeneratingPDF(true);
    setPdfDone(false);
    setPdfProgress("Initializing...");
    setPdfPct(0);

    try {
      await generateFullReport(policyValues, latestResult, simulationResults, (step, pct) => {
        setPdfProgress(step);
        setPdfPct(pct);
      });
      setPdfDone(true);
      setTimeout(() => {
        setIsGeneratingPDF(false);
        setPdfDone(false);
      }, 2000);
    } catch (err) {
      console.error("PDF generation error:", err);
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Sticky Control Bar */}
      <CityScenarioBar onRunSimulation={runSimulation} />

      {/* EXPLORE Phase */}
      <BaselineOverview />
      <SectorInterdependence />

      {/* EXPERIMENT Phase */}
      <PolicyLab />
      <AIPolicyGenerator />

      {/* EVALUATE Phase */}
      <ResultsDashboard onSaveScenario={saveScenario} />

      {/* MAPS Section */}
      <section id="maps" className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-white/10">
              <span className="text-lg">🗺️</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Maps</h2>
              <p className="text-sm text-white/40">
                AQI heatmaps, emission sources, and sector-specific visualizations
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <AQIMaps />
            <EmissionMaps />
            <div className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🗺️</span>
                <h3 className="text-lg font-bold text-white">
                  Sector-Specific Carbon Emissions
                </h3>
              </div>
              <SectorMaps />
            </div>
          </div>
        </div>
      </section>

      <ScenarioComparison />
      <PolicyHeatmap />

      {/* ── FLOATING DOWNLOAD REPORT BUTTON ──────────────────── */}
      <button
        onClick={handleDownloadReport}
        disabled={isGeneratingPDF}
        className="report-download-btn fixed bottom-6 right-6 z-50 group"
      >
        <div
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl transition-all border ${
            isGeneratingPDF
              ? pdfDone
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20"
                : "bg-white/10 text-white/70 border-white/20 cursor-wait"
              : "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white border-transparent hover:shadow-emerald-500/30 hover:scale-105 active:scale-95"
          }`}
        >
          {isGeneratingPDF ? (
            pdfDone ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Report Downloaded!
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <div className="flex flex-col items-start -space-y-0.5">
                  <span className="text-xs">{pdfProgress}</span>
                  <span className="text-[10px] text-white/40">{pdfPct}%</span>
                </div>
              </>
            )
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Download Full Report
              <Download className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
            </>
          )}
        </div>
      </button>

      {/* Footer */}
      <div className="py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs text-white/20">
            CARMA Urban CO₂ Digital Twin • Policy Simulation Workflow
          </p>
        </div>
      </div>
    </div>
  );
}
