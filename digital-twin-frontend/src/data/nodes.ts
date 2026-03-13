import type { Node } from "@xyflow/react"
import type { NodeData } from "../components/nodes/CausalNode"

export const initialNodes: Node<NodeData>[] = [
  { id: "industries", type: "causal", position: { x: 600, y: 0 },
    data: { label: "Industries", value: 100, enabled: true, type: "sector" } },

  { id: "transport", type: "causal", position: { x: 600, y: 250 },
    data: { label: "Transport", value: 35, enabled: true, type: "sector" } },

  { id: "energy", type: "causal", position: { x: 900, y: 450 },
    data: { label: "Energy", value: 0, enabled: true, type: "sector" } },

  { id: "infrastructure", type: "causal", position: { x: 200, y: 550 },
    data: { label: "Infrastructure", value: 0, enabled: true, type: "sector" } },

  { id: "co2", type: "causal", position: { x: 300, y: 800 },
    data: { label: "CO₂ Emissions", value: 0, enabled: true, type: "output" } },

  { id: "aqi", type: "causal", position: { x: 300, y: 1000 },
    data: { label: "Air Quality Index (AQI)", value: 0, enabled: true, type: "output" } },
]
