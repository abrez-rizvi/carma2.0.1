"""
Explainability layer: generates human-readable explanations for policy actions.
Links mutations to research evidence and identifies trade-offs.
"""
import json
from typing import List, Dict, Any, Optional
# from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
import config


class ExplanationGenerator:
    """Generates narrative explanations for policy mutations."""
    
    def __init__(self, policy: Dict[str, Any], research_chunks: List[str]):
        """
        Initialize generator.
        
        Args:
            policy: Policy dict with mutations
            research_chunks: List of research excerpts supporting the policy
        """
        self.policy = policy
        self.research = research_chunks
        # self.llm = ChatGroq(
        #     model=config.LLM_MODEL,
        #     temperature=0.5,
        #     api_key=config.GROQ_API_KEY
        # )
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.5,
            google_api_key=config.GEMINI_API_KEY
        )

    
    def generate_full_explanation(self) -> Dict[str, Any]:
        """
        Generate complete explainability output for a policy.
        
        Returns:
            Dict with intro narrative, per-mutation explanations, trade-offs
        """
        explanations = {
            'policy_id': self.policy.get('policy_id'),
            'policy_name': self.policy.get('name'),
            'narrative_intro': self._generate_intro(),
            'mutations': [],
            'overall_narrative': self._generate_overall_narrative()
        }
        
        # Generate explanation for each mutation
        for mutation in self.policy.get('mutations', []):
            exp = self._explain_mutation(mutation)
            explanations['mutations'].append(exp)
        
        return explanations
    
    def _generate_intro(self) -> str:
        """Generate opening narrative for the policy."""
        prompt = f"""
Write a compelling 2-3 sentence introduction to this climate policy intervention.
Focus on why it matters for public health and urban sustainability.

Policy Name: {self.policy.get('name')}
Number of Actions: {len(self.policy.get('mutations', []))}
Expected CO₂ Reduction: {self.policy.get('estimated_impacts', {}).get('co2_reduction_pct', 0)}%
Expected AQI Improvement: {self.policy.get('estimated_impacts', {}).get('aqi_improvement_pct', 0)}%

Keep it concise, impactful, and accessible to policymakers.
"""
        
        try:
            response = self.llm.invoke(prompt)
            return response.content
        except Exception as e:
            print(f"Error generating intro: {e}")
            return f"Policy: {self.policy.get('name')} aims to reduce emissions and improve air quality."
    
    def _generate_overall_narrative(self) -> str:
        """Generate overall policy narrative."""
        prompt = f"""
Summarize this climate policy in 3-4 sentences suitable for a policy brief.
Explain WHAT the policy does, WHY it's effective, and WHO benefits.

Policy: {self.policy.get('name')}
Description: {self.policy.get('description', '')}
Trade-offs: {json.dumps(self.policy.get('trade_offs', []))}

Be concise and professional. Avoid jargon.
"""
        
        try:
            response = self.llm.invoke(prompt)
            return response.content
        except Exception as e:
            print(f"Error generating overall narrative: {e}")
            return "Policy designed to reduce urban emissions through targeted sector interventions."
    
    def _explain_mutation(self, mutation: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate explanation for a single mutation.
        
        Args:
            mutation: Single mutation dict
            
        Returns:
            Dict with narrative, research backing, affected stakeholders
        """
        # Generate narrative explaining the mutation
        narrative = self._generate_mutation_narrative(mutation)
        
        # Extract relevant research quotes
        relevant_quotes = self._extract_relevant_quotes(mutation)
        
        # Identify stakeholders affected
        stakeholders = self._identify_stakeholders(mutation)
        
        return {
            'mutation': {
                'type': mutation.get('type'),
                'target': mutation.get('node_id') or f"{mutation.get('source')} → {mutation.get('target')}",
                'reason': mutation.get('reason', '')
            },
            'narrative': narrative,
            'supporting_research': relevant_quotes,
            'affected_stakeholders': stakeholders
        }
    
    def _generate_mutation_narrative(self, mutation: Dict[str, Any]) -> str:
        """Generate 2-3 sentence explanation of why this mutation is applied."""
        mutation_type = mutation.get('type')
        
        if mutation_type == 'disable_node':
            target = mutation.get('node_id', 'sector')
            prompt = f"""
Explain why disabling the {target} sector is effective for reducing emissions.
Write 2-3 sentences suitable for a policy document.
Focus on: causal mechanism, expected benefits, and evidence base.

Research evidence available:
{chr(10).join(self.research[:2])}
"""
        elif mutation_type == 'reduce_edge_weight':
            source = mutation.get('source', 'source')
            target = mutation.get('target', 'target')
            new_weight = mutation.get('new_weight', 0.5)
            reduction = ((1 - new_weight) * 100) if new_weight else 0
            
            prompt = f"""
Explain why reducing the {source} → {target} relationship (by ~{reduction:.0f}%) helps reduce emissions.
This represents implementing technology or policy to reduce the causal influence.

Write 2-3 sentences. Include: HOW (technology/policy), WHY (mechanism), IMPACT (benefits).

Research evidence:
{chr(10).join(self.research[:2])}
"""
        elif mutation_type == 'increase_edge_weight':
            source = mutation.get('source', 'source')
            target = mutation.get('target', 'target')
            new_weight = mutation.get('new_weight', 0.7)
            increase = ((new_weight - 1) * 100) if new_weight > 1 else 0
            
            prompt = f"""
Explain why strengthening the {source} → {target} relationship helps achieve climate goals.
This might represent policy incentives or investment in beneficial activities.

Write 2-3 sentences explaining the mechanism and benefits.

Research evidence:
{chr(10).join(self.research[:2])}
"""
        else:
            return "This policy action adjusts system dynamics to improve environmental outcomes."
        
        try:
            response = self.llm.invoke(prompt)
            return response.content
        except Exception as e:
            print(f"Error generating mutation narrative: {e}")
            return mutation.get('reason', 'Policy action targeting emissions reduction.')
    
    def _extract_relevant_quotes(self, mutation: Dict[str, Any]) -> List[str]:
        """
        Find research quotes most relevant to this mutation.
        Simple keyword matching; can be enhanced with semantic search.
        """
        quotes = []
        keywords = []
        
        # Determine relevant keywords based on mutation
        if mutation.get('type') == 'disable_node':
            keywords = [mutation.get('node_id', '')]
        else:
            keywords = [
                mutation.get('source', ''),
                mutation.get('target', '')
            ]
        
        # Search for quotes containing keywords
        for chunk in self.research:
            for keyword in keywords:
                if keyword.lower() in chunk.lower():
                    if chunk not in quotes:
                        quotes.append(chunk[:150] + "..." if len(chunk) > 150 else chunk)
                        break
        
        # Return first 2 relevant quotes
        return quotes[:2] if quotes else [
            "Research demonstrates effectiveness of targeted emission control policies.",
            "Evidence supports multi-sector approach to urban air quality improvement."
        ]
    
    def _identify_stakeholders(self, mutation: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        Identify sectors/groups affected by this mutation.
        """
        stakeholders = []
        mutation_type = mutation.get('type')
        
        # Map nodes/sectors to stakeholders
        sector_to_stakeholders = {
            'transport': [
                {'group': 'Transport operators', 'impact': 'operational changes'},
                {'group': 'Auto manufacturers', 'impact': 'R&D investment'},
                {'group': 'Urban commuters', 'impact': 'improved air quality'}
            ],
            'energy': [
                {'group': 'Power utilities', 'impact': 'generation mix shift'},
                {'group': 'Coal industry', 'impact': 'transition costs'},
                {'group': 'Solar/wind companies', 'impact': 'growth opportunities'},
                {'group': 'Citizens', 'impact': 'cleaner air'}
            ],
            'industries': [
                {'group': 'Manufacturers', 'impact': 'efficiency improvements'},
                {'group': 'Workers', 'impact': 'job transitions'},
                {'group': 'Consumers', 'impact': 'potential cost changes'}
            ],
            'infrastructure': [
                {'group': 'Construction sector', 'impact': 'green building standards'},
                {'group': 'Urban planners', 'impact': 'planning considerations'},
                {'group': 'Real estate', 'impact': 'sustainable development'}
            ]
        }
        
        # Extract stakeholders based on affected node/sector
        if mutation_type == 'disable_node':
            target = mutation.get('node_id', '')
        else:
            target = mutation.get('source', '') or mutation.get('target', '')
        
        for key, groups in sector_to_stakeholders.items():
            if key in target.lower():
                stakeholders = groups
                break
        
        return stakeholders if stakeholders else [
            {'group': 'Urban residents', 'impact': 'health and quality of life'},
            {'group': 'Industry stakeholders', 'impact': 'economic adaptation'}
        ]


# ============================================================================
# STANDALONE HELPER FUNCTIONS
# ============================================================================

def generate_policy_explanation(
    policy: Dict[str, Any],
    research_chunks: List[str]
) -> Dict[str, Any]:
    """
    Convenience function to generate explanation for a policy.
    
    Args:
        policy: Policy dict
        research_chunks: List of research excerpts
        
    Returns:
        Full explanation dict
    """
    generator = ExplanationGenerator(policy, research_chunks)
    return generator.generate_full_explanation()
