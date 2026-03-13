import type { Node, Edge } from "@xyflow/react"
import type { NodeData } from "./nodes/CausalNode"

export function runSimulation(
  nodes: Node<NodeData>[],
  edges: Edge[],
): Node<NodeData>[] {
  const nodeMap = new Map<string, Node<NodeData>>(
    nodes.map((n) => [n.id, { ...n, data: { ...n.data } }]),
  )

  // Initialize values
  nodeMap.forEach((node) => {
    if (node.data.type !== "sector") {
      node.data.value = 0
    }
  })

  // Propagate values (flow-based, NOT additive)
  for (let i = 0; i < 6; i++) {
    const nextValues = new Map<string, number>()

    edges.forEach((edge) => {
      const source = nodeMap.get(edge.source)
      const target = nodeMap.get(edge.target)

      if (!source || !target) return
      if (!source.data.enabled || !target.data.enabled) return

      const weight = (edge.data?.weight ?? 0) as number
      const contribution = (source.data.value as number) * weight

      nextValues.set(
        target.id,
        (nextValues.get(target.id) ?? 0) + contribution,
      )
    })

    // Apply computed values (overwrite, not add)
    nextValues.forEach((val, nodeId) => {
      const node = nodeMap.get(nodeId)
      if (node && node.data.type !== "sector") {
        node.data.value = val
      }
    })
  }

  return Array.from(nodeMap.values())
}
