"""
Graph mutation and simulation engine.
Applies policies to the causal graph and runs multi-pass propagation.
"""
import json
import copy
from typing import Dict, List, Any, Tuple
from datetime import datetime


class GraphState:
    """Represents the state of the causal graph."""
    
    def __init__(self, nodes: List[Dict], edges: List[Dict]):
        """
        Initialize graph state.
        
        Args:
            nodes: List of node dicts with {id, label, type, enabled, value, ...}
            edges: List of edge dicts with {id, source, target, weight, ...}
        """
        self.nodes = copy.deepcopy(nodes)
        self.edges = copy.deepcopy(edges)
        self.history = []  # For undo/redo
        self.baseline_snapshot = None
    
    @staticmethod
    def from_file(filepath: str) -> 'GraphState':
        """Load graph state from JSON file."""
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        instance = GraphState(data.get('nodes', []), data.get('edges', []))
        instance.baseline_snapshot = copy.deepcopy(data)
        return instance
    
    def to_dict(self) -> Dict[str, Any]:
        """Export graph state to dict."""
        return {
            'nodes': self.nodes,
            'edges': self.edges,
            'timestamp': datetime.now().isoformat()
        }
    
    def get_node(self, node_id: str) -> Dict:
        """Get a node by ID."""
        for node in self.nodes:
            if node['id'] == node_id:
                return node
        return None
    
    def get_edge(self, source: str, target: str) -> Dict:
        """Get an edge by source and target."""
        for edge in self.edges:
            if edge['source'] == source and edge['target'] == target:
                return edge
        return None
    
    def apply_mutation(self, mutation: Dict) -> Dict:
        """
        Apply a single mutation, return change record.
        
        Args:
            mutation: {type, node_id, source, target, new_weight, reason, ...}
            
        Returns:
            Change record for audit trail
        """
        change = {
            'type': mutation['type'],
            'before': None,
            'after': None,
            'timestamp': datetime.now().isoformat()
        }
        
        if mutation['type'] == 'disable_node':
            node_id = mutation['node_id']
            node = next((n for n in self.nodes if n['id'] == node_id), None)
            
            if not node:
                raise ValueError(f"Node not found: {node_id}")
            
            change['before'] = {'id': node_id, 'enabled': node.get('enabled', True)}
            node['enabled'] = False
            change['after'] = {'id': node_id, 'enabled': False}
        
        elif mutation['type'] == 'reduce_edge_weight' or mutation['type'] == 'increase_edge_weight':
            source = mutation['source']
            target = mutation['target']
            edge = next((e for e in self.edges if e['source'] == source and e['target'] == target), None)
            
            if not edge:
                raise ValueError(f"Edge not found: {source} -> {target}")
            
            old_weight = edge.get('data', {}).get('weight', 0.5) if isinstance(edge.get('data'), dict) else 0.5
            change['before'] = {'source': source, 'target': target, 'weight': old_weight}
            
            # Update edge weight
            if 'data' not in edge:
                edge['data'] = {}
            edge['data']['weight'] = mutation['new_weight']
            
            change['after'] = {'source': source, 'target': target, 'weight': mutation['new_weight']}
        
        self.history.append(change)
        return change
    
    def apply_policy(self, policy: Dict) -> Dict:
        """
        Apply all mutations in a policy.
        
        Args:
            policy: Policy dict with 'mutations' list
            
        Returns:
            Result dict with applied mutations and any errors
        """
        results = {
            'policy_id': policy.get('policy_id'),
            'mutations_applied': [],
            'timestamp': datetime.now().isoformat(),
            'errors': []
        }
        
        for mutation in policy.get('mutations', []):
            try:
                result = self.apply_mutation(mutation)
                results['mutations_applied'].append(result)
            except Exception as e:
                results['errors'].append({
                    'mutation': mutation.get('type'),
                    'error': str(e)
                })
        
        return results
    
    def run_simulation(self) -> Dict[str, Any]:
        """
        Multi-pass value propagation through causal graph.
        Simulates how changes cascade through the system.
        
        Returns:
            Dict with node_values and output metrics (co2, aqi)
        """
        # Initialize node values
        node_values = {}
        for node in self.nodes:
            node_id = node['id']
            node_type = node.get('data', {}).get('type') if isinstance(node.get('data'), dict) else node.get('type', 'intermediate')
            
            # Sector nodes start with baseline values
            if node_type == 'sector':
                node_values[node_id] = node.get('data', {}).get('value', 100) if isinstance(node.get('data'), dict) else 100
            else:
                node_values[node_id] = 0
        
        # Multi-pass propagation (captures cascading effects)
        for iteration in range(6):  # config.SIMULATION_PASSES
            for edge in self.edges:
                source_id = edge['source']
                target_id = edge['target']
                
                # Skip if nodes disabled or not found
                source_node = next((n for n in self.nodes if n['id'] == source_id), None)
                target_node = next((n for n in self.nodes if n['id'] == target_id), None)
                
                if not source_node or not target_node:
                    continue
                
                source_enabled = source_node.get('data', {}).get('enabled', True) if isinstance(source_node.get('data'), dict) else True
                target_enabled = target_node.get('data', {}).get('enabled', True) if isinstance(target_node.get('data'), dict) else True
                
                if not (source_enabled and target_enabled):
                    continue
                
                # Propagate value
                source_val = node_values.get(source_id, 0)
                weight = edge.get('data', {}).get('weight', 0.5) if isinstance(edge.get('data'), dict) else 0.5
                
                if source_val > 0:
                    node_values[target_id] = node_values.get(target_id, 0) + source_val * weight
        
        # Extract outputs
        return {
            'node_values': node_values,
            'outputs': {
                'co2': node_values.get('co2', 0),
                'aqi': node_values.get('aqi', 0)
            }
        }
    
    def reset(self):
        """Reset graph to baseline state."""
        if self.baseline_snapshot:
            self.nodes = copy.deepcopy(self.baseline_snapshot.get('nodes', []))
            self.edges = copy.deepcopy(self.baseline_snapshot.get('edges', []))
            self.history = []
    
    def undo(self, steps: int = 1) -> bool:
        """Revert last N mutations."""
        for _ in range(steps):
            if not self.history:
                return False
            
            change = self.history.pop()
            
            # Reverse the change
            if change['type'] == 'disable_node':
                node_id = change['before']['id']
                node = next((n for n in self.nodes if n['id'] == node_id), None)
                if node:
                    node['enabled'] = change['before']['enabled']
            
            elif 'weight' in str(change['type']):
                source = change['before']['source']
                target = change['before']['target']
                edge = next((e for e in self.edges if e['source'] == source and e['target'] == target), None)
                if edge:
                    if 'data' not in edge:
                        edge['data'] = {}
                    edge['data']['weight'] = change['before']['weight']
        
        return True


class ImpactAnalyzer:
    """Analyzes impact of policies by comparing baseline vs post-policy states."""
    
    def __init__(self, baseline_state: GraphState, post_policy_state: GraphState):
        """
        Initialize analyzer.
        
        Args:
            baseline_state: GraphState before policy
            post_policy_state: GraphState after policy
        """
        self.baseline = baseline_state
        self.post_policy = post_policy_state
    
    def calculate_impact(self) -> Dict[str, Any]:
        """
        Calculate impact metrics.
        
        Returns:
            Dict with CO₂ and AQI changes, cascade analysis, etc.
        """
        baseline_sim = self.baseline.run_simulation()
        post_sim = self.post_policy.run_simulation()
        
        baseline_co2 = baseline_sim['outputs']['co2']
        post_co2 = post_sim['outputs']['co2']
        baseline_aqi = baseline_sim['outputs']['aqi']
        post_aqi = post_sim['outputs']['aqi']
        
        # Calculate impacts
        impact = {
            'co2': {
                'baseline': baseline_co2,
                'post_policy': post_co2,
                'change_absolute': post_co2 - baseline_co2,
                'change_pct': (
                    ((post_co2 - baseline_co2) / baseline_co2 * 100)
                    if baseline_co2 > 0 else 0
                )
            },
            'aqi': {
                'baseline': baseline_aqi,
                'post_policy': post_aqi,
                'change_absolute': post_aqi - baseline_aqi,
                'change_pct': (
                    ((post_aqi - baseline_aqi) / baseline_aqi * 100)
                    if baseline_aqi > 0 else 0
                )
            }
        }
        
        # Cascade analysis
        cascade = self.analyze_cascade(baseline_sim, post_sim)
        impact['cascade_analysis'] = cascade
        
        return impact
    
    def analyze_cascade(self, baseline_sim: Dict, post_sim: Dict) -> Dict[str, Any]:
        """
        Identify which nodes changed most (1st, 2nd, 3rd order effects).
        """
        baseline_vals = baseline_sim['node_values']
        post_vals = post_sim['node_values']
        
        node_changes = {}
        for node_id in baseline_vals:
            baseline_val = baseline_vals[node_id]
            post_val = post_vals.get(node_id, 0)
            
            if baseline_val > 0.001:  # Avoid division by very small numbers
                pct_change = ((post_val - baseline_val) / baseline_val) * 100
                node_changes[node_id] = {
                    'baseline': baseline_val,
                    'post_policy': post_val,
                    'change_pct': pct_change
                }
        
        # Sort by magnitude of change
        sorted_changes = sorted(
            node_changes.items(),
            key=lambda x: abs(x[1]['change_pct']),
            reverse=True
        )
        
        return {
            'most_affected_nodes': [(node_id, data['change_pct']) for node_id, data in sorted_changes[:10]],
            'all_node_changes': node_changes,
            'summary': {
                'nodes_with_reduction': len([d for d in node_changes.values() if d['change_pct'] < 0]),
                'nodes_with_increase': len([d for d in node_changes.values() if d['change_pct'] > 0]),
                'avg_change_pct': sum(d['change_pct'] for d in node_changes.values()) / len(node_changes) if node_changes else 0
            }
        }
