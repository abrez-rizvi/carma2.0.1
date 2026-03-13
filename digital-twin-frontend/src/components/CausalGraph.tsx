"use client";

import { useEffect, useState } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Controls,
  ControlButton,
  Background,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ImpactPanel } from "./ImpactPanel";
import { API_BASE_URL } from '../config';
import { Sparkles, ArrowRight, Activity, Search, Loader2, UploadCloud, Info } from "lucide-react";
import { Reveal } from "./Reveal";

import CausalNode from "./nodes/CausalNode";
import { initialNodes } from "../data/nodes";
import { initialEdges } from "../data/edges";
import { runSimulation } from "./simulation";
import { EmissionForecast } from "./EmissionForecast";
import { AQITrends } from "./AQITrends";
import { HistoricEmissions } from "./HistoricEmissions";
import type { NodeTypes } from "@xyflow/react";
import { AQIMaps } from "./AQIMaps";
import { EmissionMaps } from "./EmissionMaps";
import { SectorMaps } from "./SectorMaps";
import { PolicySimulator } from "./PolicySimulator";
import type { Impact } from "../types";

const nodeTypes: NodeTypes = {
  causal: CausalNode as NodeTypes['causal'],
};

export default function CausalGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Callback to handle slider changes from custom nodes
  const handleNodeValueChange = (id: string, value: number) => {
    setNodes((nds) => {
      const updated = nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, value } };
        }
        return node;
      });
      return runSimulation(updated, edges);
    });
  };

  // Attach the handler to nodes on mount
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onChange: (val: number) => handleNodeValueChange(node.id, val),
        },
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [impactMessage, setImpactMessage] = useState(
    "System activity and emissions propagate through connected sectors."
  );
  const [impact, setImpact] = useState<Impact | null>(null);
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [researchQuery, setResearchQuery] = useState(
    "Generate a policy based on the graph"
  );

  const applyPolicyFromAPI = async () => {
    setLoading(true);
    try {

      // Step 1: Generate policy from research query
      const graphContext = {
        nodes: nodes.map((n) => ({
          id: n.id,
          enabled: n.data.enabled,
          label: n.data.label
        })),
        edges: edges.map((e) => ({
          source: e.source,
          target: e.target,
          weight: e.data?.weight || 0.5,
        })),
      };

      const generateResponse = await fetch(
        `${API_BASE_URL}/api/generate-policy`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            research_query: researchQuery,
            graph_context: graphContext
          }),
        }
      );

      if (!generateResponse.ok) {
        throw new Error(
          `API error: ${generateResponse.status} ${generateResponse.statusText}`
        );
      }

      const generateData = await generateResponse.json();
      const policy = generateData.policy;

      // Step 2: Apply policy to graph
      const applyResponse = await fetch(
        `${API_BASE_URL}/api/apply-policy`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ policy, graph_context: graphContext }),
        }
      );

      if (!applyResponse.ok) {
        throw new Error(
          `API error: ${applyResponse.status} ${applyResponse.statusText}`
        );
      }

      const applyData = await applyResponse.json();
      const snapshot = applyData.snapshot;

      // Step 3: Update frontend visualization
      const postPolicyGraph = snapshot.post_policy_graph;
      setNodes((nds) =>
        nds.map((n) => {
          const postNode = postPolicyGraph.nodes.find(
            (pn: { id: string }) => pn.id === n.id
          );
          return postNode ? { ...n, data: { ...n.data, ...postNode.data } } : n;
        })
      );

      setEdges((eds) =>
        eds.map((e) => {
          const postEdge = postPolicyGraph.edges.find(
            (pe: { source: string; target: string }) => pe.source === e.source && pe.target === e.target
          );
          return postEdge ? { ...e, data: postEdge.data } : e;
        })
      );

      // Step 4: Display impact
      setPolicy(policy);
      setImpact(snapshot.impact);
      setImpactMessage(
        `Policy: ${policy.name}. CO₂ change: ${snapshot.impact.co2.change_pct.toFixed(1)}%. ` +
        `AQI change: ${snapshot.impact.aqi.change_pct.toFixed(1)}%.`
      );
    } catch (error) {
      console.error("Error applying policy:", error);
      setImpactMessage(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const onNodeClick = (_event: unknown, node: { id: string }) => {
    setNodes((nds) => {
      const updated = nds.map((n) =>
        n.id === node.id
          ? {
            ...n,
            data: {
              ...n.data,
              enabled: !n.data.enabled,
            },
          }
          : n
      );

      const clicked = nds.find((n) => n.id === node.id);

      setImpactMessage(
        clicked?.data.enabled
          ? `${clicked.data.label} disabled. Downstream emissions, energy demand, and dependent sectors reduce due to loss of causal input.`
          : `${clicked?.data.label} re-enabled. System activity resumes and emissions propagate through connected sectors.`
      );

      return runSimulation(updated, edges);
    });
  };

  useEffect(() => {
    setNodes((nds) => runSimulation(nds, edges));
  }, [edges, setNodes]);

  const [isFullScreen, setIsFullScreen] = useState(false);

  return (
    <div className={`w-full min-h-screen ${isFullScreen ? 'relative z-[100]' : ''}`}>

      {/* Top Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 h-[600px] border-b border-white/5" style={{ gridTemplateColumns: '2fr 1fr' }}>

        {/* Left: Causal Graph (50%) */}
        <div className={`relative h-full border-r border-white/5 ${isFullScreen ? 'fixed inset-0 z-[60] w-screen h-screen bg-[#050510]' : ''}`}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            colorMode="dark"
          >
            <Background color="#ffffff" gap={30} size={1} className="opacity-[0.05]" />
            <Controls
              className="!bg-black/40 !border-white/10 !backdrop-blur-md !text-white !p-1 !rounded-xl"
              showInteractive={false}
            >
              <ControlButton
                onClick={() => setIsFullScreen(!isFullScreen)}
                title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                className="!bg-transparent hover:!bg-white/10 !text-white/70 hover:!text-white !border-none transition-colors !rounded-lg"
              >
                {isFullScreen ? "↙" : "↗"}
              </ControlButton>
            </Controls>
          </ReactFlow>
        </div>

        {/* Right: Upload Policy Placeholder (50%) */}
        {/* Right: Presets & Upload (1/3) -> Split into 2 sub-cols */}
        <div className="h-full grid grid-rows-2 bg-black/20 relative overflow-hidden group">
          {/* Background ambient effect */}
          <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Sub-col 1: Upload Area */}

          <div className="flex flex-col items-center justify-center p-6 relative z-10">
            <div className="relative text-center border-2 border-dashed border-white/10 rounded-2xl p-6 w-full hover:border-secondary/30 hover:bg-white/5 transition-all duration-300 cursor-pointer group/upload">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover/upload:scale-110 group-hover/upload:bg-secondary/20 transition-all duration-300">
                <UploadCloud className="w-6 h-6 text-white/40 group-hover/upload:text-secondary transition-colors" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Custom Policy</h3>
              <p className="text-[10px] text-white/40 mb-4 leading-tight">
                Upload analysis PDF
              </p>
              <button className="text-[10px] items-center justify-center flex w-full py-2 rounded-lg font-bold text-white bg-white/10 border border-white/10 hover:bg-secondary hover:text-black hover:border-transparent transition-all duration-300">
                BROWSE FILES
              </button>
            </div>
          </div>

          {/* Sub-col 2: Preset Policies */}
          <div className="border-r border-white/5 p-6 flex flex-col justify-center gap-4 relative z-10 backdrop-blur-sm">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Recommended Scenarios
            </h3>

            {[
              { name: 'Aggressive Net-Zero', desc: 'Rapid decarbonization with high short-term costs.' },
              { name: 'Balanced Approach', desc: 'Step-wise reduction minimizing economic shock.' },
              { name: 'Technological Fix', desc: 'Reliance on geo-engineering and carbon capture.' }
            ].map((preset, idx) => (
              <div key={idx} className="group/btn relative">
                <button className="w-full text-left pl-4 pr-10 py-3.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 hover:shadow-lg transition-all text-sm font-bold text-white/90">
                  {preset.name}
                </button>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 group-hover/btn:text-secondary transition-colors" title={preset.desc}>
                  <Info className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>


        </div>

      </div>

      {/* Instructions */}
      <div className="bg-secondary/5 border-y border-secondary/10 p-2">
        <p className="text-[10px] md:text-xs text-secondary text-center flex items-center justify-center gap-2 font-mono uppercase tracking-wide">
          <Sparkles className="w-3 h-3" />
          Interactive System: Click nodes to toggle sector activity
        </p>
      </div>

      {/* Bottom Section - Control Panel & Results */}
      <div className="px-6 py-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left: Policy Generator */}
          <div className="lg:col-span-1">
            <Reveal className="h-full glass-panel p-6 relative overflow-hidden group">
              {/* Gradient glow effect */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/10 blur-[60px] rounded-full pointer-events-none" />

              <div className="flex items-center mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mr-3 border border-white/10 shadow-inner">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">
                  AI Policy Agent
                </h3>
              </div>

              <div className="space-y-4 relative z-10">
                <div>
                  <label className="text-[10px] font-bold block mb-2 text-white/40 uppercase tracking-widest">
                    Prompt
                  </label>
                  <textarea
                    value={researchQuery}
                    onChange={(e) => setResearchQuery(e.target.value)}
                    placeholder="e.g. How can we reduce transport emissions by 20%?"
                    className="w-full text-sm rounded-xl p-4 min-h-[140px] resize-none bg-black/40 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all font-medium leading-relaxed"
                  />
                </div>
                <button
                  onClick={applyPolicyFromAPI}
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 group/btn ${loading
                    ? "bg-white/5 cursor-not-allowed opacity-60"
                    : "btn-primary shadow-lg shadow-green-500/10"
                    }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Generate & Apply
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </Reveal>
          </div>

          {/* Right: Results (2 columns) */}
          <div className="lg:col-span-2">
            <Reveal delay={200} className="h-full">
              {impact ? (
                <ImpactPanel impact={impact} policy={policy} />
              ) : (
                <div className="glass-panel p-8 h-full flex flex-col items-center justify-center text-center group border-dashed border-white/10">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform duration-500">
                    <Activity className="w-8 h-8 text-white/20 group-hover:text-secondary transition-colors" />
                  </div>
                  <h4 className="font-bold text-white mb-2 text-lg">
                    System Awaiting Input
                  </h4>
                  <p className="text-white/40 leading-relaxed max-w-md mx-auto text-sm">
                    {impactMessage}
                  </p>
                </div>
              )}
            </Reveal>
          </div>
        </div>
        <div className="w-full" style={{ minWidth: '100%' }}>
          <div className="lg:flex-col w-full border border-white/10 space-y-6">
            <div className="flex flex-col lg:flex-row gap-4 w-full">
              <Reveal delay={300} className="flex-1 h-full">
                <EmissionForecast />
              </Reveal>
              <Reveal delay={400} className="flex-1 h-full mt-2">
                <AQITrends />
              </Reveal>
            </div>
            <div className="w-full">
              <Reveal delay={450}>
                <HistoricEmissions />
              </Reveal>
            </div>
            <div className="w-full">
              <Reveal delay={475}>
                <PolicySimulator />
              </Reveal>
            </div>
            <div className="w-full">
              <Reveal delay={500}>
                <AQIMaps />
              </Reveal>
            </div>
            <div className="w-full">
              <Reveal delay={525}>
                <EmissionMaps />
              </Reveal>
            </div>
            <div className="w-full">
              <Reveal delay={550}>
                <SectorMaps />
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


