import { type Edge, MarkerType } from "@xyflow/react"

const defaultEdgeStyle = {
    strokeWidth: 2,
    stroke: '#3b82f6', // Default blue-ish
};

const transportEdgeStyle = {
    stroke: '#4ade80', // Green
    strokeWidth: 2,
};

const industrialEdgeStyle = {
    stroke: '#2dd4bf', // Teal
    strokeWidth: 2,
};

const environmentalEdgeStyle = {
    stroke: '#00f0ff', // Cyan
    strokeWidth: 2,
    strokeDasharray: '5,5', // Dashed for impact/pollution flow
};

const commonEdgeConfig = {
    type: "smoothstep",
    animated: true,
    style: defaultEdgeStyle,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
    labelStyle: { fill: 'white', fontWeight: 600, fontSize: 11 },
    labelBgStyle: { fill: '#0f0518', fillOpacity: 0.7, stroke: '#ffffff30', rx: 4, ry: 4 },
    labelBgPadding: [6, 4] as [number, number],
    labelBgBorderRadius: 4,
};

export const initialEdges: Edge[] = [
  // 1. Industries -> Transport
  { 
    id: "ind-trans", 
    source: "industries", 
    target: "transport", 
    label: "Moves goods → CO₂ & particulates",
    ...commonEdgeConfig,
    style: industrialEdgeStyle,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#2dd4bf' }
  },
  
  // 2. Industries -> Energy
  { 
    id: "ind-energy", 
    source: "industries", 
    target: "energy",
    label: "Uses power → ↑ CO₂ & pollutants",
    ...commonEdgeConfig,
    style: industrialEdgeStyle,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#2dd4bf' }
  },
  
  // 3. Industries -> Infrastructure
  { 
    id: "ind-infra", 
    source: "industries", 
    target: "infrastructure", 
    label: "Drives construction → ↑ CO₂",
    ...commonEdgeConfig,
    style: industrialEdgeStyle,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#2dd4bf' }
  },
  
  // 4. Industries -> CO2 Emissions
  { 
    id: "ind-co2", 
    source: "industries", 
    target: "co2", 
    label: "Direct + indirect",
    ...commonEdgeConfig,
    style: environmentalEdgeStyle,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#00f0ff' }
  },

  // 5. Industries -> AQI
  { 
    id: "ind-aqi", 
    source: "industries", 
    target: "aqi", 
    label: "Industrial pollutants (PM, NOx, SO₂)",
    ...commonEdgeConfig,
    style: environmentalEdgeStyle,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#00f0ff' }
  },

  // 6. Transport -> Energy
  { 
    id: "trans-energy", 
    source: "transport", 
    target: "energy",
    label: "Fuel demand & refining → ↑ CO₂",
    ...commonEdgeConfig,
    style: transportEdgeStyle,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#4ade80' }
  },
  
  // 7. Transport -> Infrastructure
  { 
    id: "trans-infra", 
    source: "transport", 
    target: "infrastructure", 
    label: "Needs roads/airports → ↑ CO₂",
    ...commonEdgeConfig,
    style: transportEdgeStyle,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#4ade80' }
  },
  
  // 8. Transport -> CO2 Emissions
  { 
    id: "trans-co2", 
    source: "transport", 
    target: "co2", 
    label: "Fuel & vehicle emissions",
    ...commonEdgeConfig,
    style: environmentalEdgeStyle,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#00f0ff' }
  },
  
  // 9. Transport -> AQI
  { 
    id: "trans-aqi", 
    source: "transport", 
    target: "aqi", 
    label: "Vehicle emissions (PM, NOx)",
    ...commonEdgeConfig,
    style: environmentalEdgeStyle,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#00f0ff' }
  },

  // 10. Energy -> Industries
  { 
    id: "energy-ind", 
    source: "energy", 
    target: "industries", 
    label: "Powers industry → ↑ CO₂",
    ...commonEdgeConfig,
    style: { stroke: '#eab308', strokeWidth: 2 }, // Yellow for energy
    markerEnd: { type: MarkerType.ArrowClosed, color: '#eab308' }
  },
  { 
    id: "energy-trans", 
    source: "energy", 
    target: "transport", 
    label: "Fuel transport → ↑ CO₂",
    ...commonEdgeConfig,
    style: { stroke: '#eab308', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#eab308' }
  },
  
  // 11. Energy -> CO2 Emissions
  { 
    id: "energy-co2", 
    source: "energy", 
    target: "co2", 
    label: "Power generation emissions",
    ...commonEdgeConfig,
    style: environmentalEdgeStyle,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#00f0ff' }
  },
  
  // 12. Energy -> AQI
  { 
    id: "energy-aqi", 
    source: "energy", 
    target: "aqi", 
    label: "Power Generation (SO₂ & NOx)",
    ...commonEdgeConfig,
    style: environmentalEdgeStyle,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#00f0ff' }
  },

  // 13. Infrastructure -> Transport
  { 
    id: "infra-trans", 
    source: "infrastructure", 
    target: "transport", 
    label: "Urban Sprawl → ↑ CO₂ & emissions",
    ...commonEdgeConfig,
  },
  
  // 14. Infrastructure -> Industries
  { 
    id: "infra-ind", 
    source: "infrastructure", 
    target: "industries", 
    label: "Enables industry → ↑ CO₂",
    ...commonEdgeConfig,
  },
  { 
    id: "infra-energy", 
    source: "infrastructure", 
    target: "energy", 
    label: "Energy demand → ↑ CO₂",
    ...commonEdgeConfig,
  },
  
  // 15. Infrastructure -> CO2 Emissions
  { 
    id: "infra-co2", 
    source: "infrastructure", 
    target: "co2", 
    label: "Embodied & use emissions",
    ...commonEdgeConfig,
    style: environmentalEdgeStyle,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#00f0ff' }
  },

  // 16. CO2 Emissions -> AQI
  { 
    id: "co2-aqi", 
    source: "co2", 
    target: "aqi", 
    label: "Contributes to air pollution",
    ...commonEdgeConfig,
    style: { stroke: '#ef4444', strokeWidth: 3, strokeDasharray: '5,5' }, // Red alert style
    markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' }
  },
  { 
    id: "aqi-infra", 
    source: "aqi", 
    target: "infrastructure", 
    label: "Poor AQI → Urban health/stability",
    ...commonEdgeConfig,
    style: { stroke: '#ef4444', strokeWidth: 3, strokeDasharray: '5,5' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' }
  },
];
