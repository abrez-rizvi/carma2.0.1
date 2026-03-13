"use client";

import { useEffect, useState } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import CausalNode from "./nodes/CausalNode";
import { initialNodes } from "../data/nodes";
import { initialEdges } from "../data/edges";
import { runSimulation } from "./simulation";
import { ImpactPanel } from "./ImpactPanel";
import { API_BASE_URL } from "../config";
import { Reveal } from "./Reveal";
import { Network, Sparkles } from "lucide-react";
import type { NodeTypes } from "@xyflow/react";
import type { Impact } from "../types";

const nodeTypes: NodeTypes = {
  causal: CausalNode as NodeTypes["causal"],
};

export function SectorInterdependence() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [impactMessage, setImpactMessage] = useState(
    "Click any sector node to toggle its activity and see cascade effects."
  );
  const [impact, setImpact] = useState<Impact | null>(null);
  const [policy, setPolicy] = useState<any>(null);

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

  useEffect(() => {
    setNodes((nds) => runSimulation(nds, edges));
  }, [edges, setNodes]);

  const onNodeClick = (_event: unknown, node: { id: string }) => {
    setNodes((nds) => {
      const updated = nds.map((n) =>
        n.id === node.id
          ? { ...n, data: { ...n.data, enabled: !n.data.enabled } }
          : n
      );
      const clicked = nds.find((n) => n.id === node.id);
      setImpactMessage(
        clicked?.data.enabled
          ? `${clicked.data.label} disabled. Downstream emissions reduce.`
          : `${clicked?.data.label} re-enabled. System activity resumes.`
      );
      return runSimulation(updated, edges);
    });
  };

  return (
    <section id="interdependence" className="py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <Reveal>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10">
              <Network className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Sector Interdependence Map
              </h2>
              <p className="text-sm text-white/40">
                Causal relationships between sectors, emissions, and air quality
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Causal Graph */}
            <div className="lg:col-span-2 glass-panel p-0 overflow-hidden" style={{ height: 500 }}>
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
                />
              </ReactFlow>
              {/* Instruction bar */}
              <div className="bg-purple-500/5 border-t border-purple-500/10 p-2">
                <p className="text-[10px] text-purple-300 text-center flex items-center justify-center gap-2 font-mono uppercase tracking-wide">
                  <Sparkles className="w-3 h-3" />
                  Click nodes to toggle sector activity and view cascade effects
                </p>
              </div>
            </div>

            {/* Impact Panel / Info */}
            <div className="lg:col-span-1">
              {impact ? (
                <ImpactPanel impact={impact} policy={policy} />
              ) : (
                <div className="glass-panel p-8 h-full flex flex-col items-center justify-center text-center border-dashed border-white/10">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                    <Network className="w-7 h-7 text-white/20" />
                  </div>
                  <h4 className="font-bold text-white mb-2">
                    Cascade Analysis
                  </h4>
                  <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                    {impactMessage}
                  </p>

                  {/* Relationship Legend */}
                  <div className="mt-6 w-full space-y-2">
                    <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3 text-left">
                      Key Relationships
                    </div>
                    {[
                      { from: "Transport", to: "CO₂ Emissions", color: "text-amber-400" },
                      { from: "Industry", to: "CO₂ Emissions", color: "text-rose-400" },
                      { from: "Energy", to: "Industrial Activity", color: "text-cyan-400" },
                      { from: "CO₂ Emissions", to: "AQI", color: "text-purple-400" },
                      { from: "AQI", to: "Health Impact", color: "text-red-400" },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-white/50">
                        <span className={`font-medium ${r.color}`}>{r.from}</span>
                        <span className="text-white/20">→</span>
                        <span>{r.to}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
