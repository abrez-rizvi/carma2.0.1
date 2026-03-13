"""
Core policy engine: transforms research into structured policies.
Uses LLM with structured prompting and Pydantic validation.
"""
import os
# Enable fast download for HuggingFace (must be set before other imports)
os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "1"

import json
import re
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ValidationError, Field
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
# from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

import config


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class PolicyMutation(BaseModel):
    """Represents a single mutation to the causal graph."""
    type: str = Field(..., description="disable_node | reduce_edge_weight | increase_edge_weight")
    node_id: Optional[str] = Field(None, description="For disable_node mutations")
    source: Optional[str] = Field(None, description="For edge mutations")
    target: Optional[str] = Field(None, description="For edge mutations")
    new_weight: Optional[float] = Field(None, description="New edge weight [0.0, 1.0]")
    original_weight: Optional[float] = Field(None, description="Original weight (optional)")
    reason: str = Field(..., description="Why this mutation is applied")
    reversible: bool = Field(True, description="Can this be undone?")


class SourceResearch(BaseModel):
    """Research evidence backing the policy."""
    paper_ids: List[str] = Field(default_factory=list)
    key_quotes: List[str] = Field(default_factory=list)
    confidence: float = Field(0.8, description="Confidence in policy [0.0, 1.0]")


class TradeOff(BaseModel):
    """Trade-off from policy implementation."""
    sector: str
    impact: str = Field(..., description="positive | negative | neutral")
    magnitude: str = Field(..., description="mild | moderate | strong")
    description: str


class EstimatedImpact(BaseModel):
    """Estimated system-wide impacts."""
    co2_reduction_pct: float = Field(0.0, description="% reduction in CO₂")
    aqi_improvement_pct: float = Field(0.0, description="% reduction in AQI")
    confidence: float = Field(0.7)


class Policy(BaseModel):
    """Complete structured policy JSON."""
    policy_id: str
    name: str
    description: Optional[str] = None
    mutations: List[PolicyMutation]
    estimated_impacts: EstimatedImpact
    trade_offs: List[TradeOff] = Field(default_factory=list)
    source_research: SourceResearch
    timestamp: Optional[str] = None


# ============================================================================
# POLICY ENGINE
# ============================================================================

class PolicyEngine:
    """Converts research insights into structured policies via LLM."""

    def __init__(self):
        """Initialize FAISS index and LLM."""
        # SKIP EMBEDDINGS DOWNLOAD: "Can we not do it at all?" 
        # User requested instant startup without RAG.
        # -----------------------------------------------------------------
        # from huggingface_hub import snapshot_download
        
        print("\n[INFO] RAG/Embeddings initialization SKIPPED by configuration.")
        print("[INFO] Policy Engine running in 'Direct Query' mode (LLM only).")
        
        self.embeddings = None
        self.db = None
        
        # -----------------------------------------------------------------
        # Original logic commented out to prevent 400MB+ download on Spaces:
        #
        # print(f"Initializing PolicyEngine with model: {config.EMBEDDINGS_MODEL}")
        # try:
        #     snapshot_download(...)
        # except Exception: ...
        # self.embeddings = HuggingFaceEmbeddings(...)
        # self.db = FAISS.load_local(...)
        # -----------------------------------------------------------------

        # self.llm = ChatGroq(
        #     model=config.LLM_MODEL,
        #     temperature=0.5,
        #     api_key=config.GROQ_API_KEY
        # )
        if not config.GEMINI_API_KEY:
            print("WARNING: GEMINI_API_KEY is not set. AI features will fail.")
        
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.5,
            google_api_key=config.GEMINI_API_KEY
        )

    
    def query_research(self, question: str, k: int = None) -> tuple[List[str], bool]:
        """
        Retrieve research chunks from FAISS.
        
        Args:
            question: Search query
            k: Number of results (default from config)
            
        Returns:
            Tuple of (research chunks or [question], is_direct_query)
        """
        if not self.db:
            print(f"FAISS DB not initialized, using direct query: {question}")
            # Return the user's query directly when FAISS is not available
            return [question], True
        
        k = k or config.FAISS_K_SEARCH
        results = self.db.similarity_search(question, k=k)
        return [r.page_content for r in results], False
    
    def extract_policy(
        self,
        research_chunks: List[str],
        graph_context: Dict[str, Any],
        is_direct_query: bool = False,
        user_query: str = ""
    ) -> Policy:
        """
        Use LLM to extract structured policy from research.
        
        Args:
            research_chunks: List of research excerpts or [user_query] if direct
            graph_context: Dict with node/edge structure for validation
            is_direct_query: True if research_chunks contains user query (no FAISS)
            user_query: The original user query string (optional but recommended)
            
        Returns:
            Validated Policy object
        """
        # Format content for prompt
        # Ensure all chunks are strings (handle potential nested lists)
        flat_chunks = []
        for chunk in research_chunks:
            if isinstance(chunk, list):
                flat_chunks.extend([str(c) for c in chunk])
            else:
                flat_chunks.append(str(chunk))
        
        # Determine intent from user_query if available, otherwise check chunks
        query_text = user_query if user_query else (flat_chunks[0] if flat_chunks else "")
        query_lower = query_text.lower()
        
        increase_emissions = any(word in query_lower for word in ["increase", "raise", "boost", "expand", "grow", "worsen", "high"])
        
        if is_direct_query:
            research_section = f"USER QUERY: {query_text}\n\nUse your knowledge to create a policy addressing this query."
        else:
            research_section = f"USER QUERY: {query_text}\n\nRESEARCH FINDINGS:\n" + "\n---\n".join(flat_chunks)
        
        formatted_nodes = ""
        disabled_nodes = []
        
        # Handle new graph_context structure (list of dicts) vs old (list of ids)
        if 'nodes' in graph_context and isinstance(graph_context['nodes'], list):
            formatted_nodes = ", ".join([n['id'] for n in graph_context['nodes']])
            disabled_nodes = [n['id'] for n in graph_context['nodes'] if not n.get('enabled', True)]
        else:
            formatted_nodes = ", ".join(graph_context.get("node_ids", []))
            
        formatted_edges = "\n".join([
            f"  {e['source']}->{e['target']} (current weight: {e.get('weight', 0.5)})"
            for e in graph_context.get("edges", [])
        ])
        
        disabled_section = ""
        if disabled_nodes:
            disabled_section = f"""
DISABLED SECTORS (User has manually disconnected these):
{', '.join(disabled_nodes)}

IMPORTANT: The above sectors are DISCONNECTED. 
- Do NOT try to modify edges coming FROM these sectors, as they have no effect.
- You should acknowledge that they are disabled in your reasoning.
- Focus policies on the remaining ACTIVE sectors to achieve the goal."""
        
        # Determine policy direction
        if increase_emissions:
            task_description = "INCREASE emissions"
            mutation_type = "increase_edge_weight"
            mechanics_section = """TO INCREASE EMISSIONS:
  - MUST increase the edge weight to a LARGER number
  - Example: 0.7 → 0.9 (increases flow by 28%)
  - Example: 0.5 → 0.75 (increases flow by 50%)
  - Example: 0.4 → 0.7 (increases flow by 75%)

CRITICAL: new_weight MUST BE GREATER THAN current weight. Do not decrease!"""
            correct_examples = """  ✓ Change transport→co2 from 0.7 to 0.9 (increases flow)
  ✓ Change energy→co2 from 0.8 to 0.95 (increases propagation)"""
            estimated_field = "co2_increase_pct"
        else:
            task_description = "REDUCE emissions"
            mutation_type = "reduce_edge_weight"
            mechanics_section = """TO REDUCE EMISSIONS:
  - MUST decrease the edge weight to a SMALLER number
  - Example: 0.7 → 0.35 (50% reduction in flow)
  - Example: 0.5 → 0.25 (50% reduction in flow)
  - Example: 0.8 → 0.4 (50% reduction in flow)

CRITICAL: new_weight MUST BE LESS THAN current weight. Do not increase!"""
            correct_examples = """  ✓ Change transport→co2 from 0.7 to 0.35 (cuts in half)
  ✓ Change transport→co2 from 0.7 to 0.49 (30% reduction)
  ✓ Change energy→co2 from 0.8 to 0.48 (40% reduction)"""
            estimated_field = "co2_reduction_pct"
        
        prompt = f"""You are a climate policy expert. Your task is to design policies that {task_description}.

{research_section}
{disabled_section}

CURRENT SYSTEM EDGES (with current weights):
{formatted_edges}

Available nodes: {formatted_nodes}

EMISSION MECHANICS - READ CAREFULLY:
The system propagates emissions through edges. Each edge has a weight (0.0 to 1.0):
  - target_value = source_value × weight
  - A weight of 0.7 means 70% of the source value flows to the target
  - A weight of 0.3 means 30% of the source value flows to the target

{mechanics_section}

CRITICAL INSTRUCTION:
1. You MUST follow the TASK direction ({task_description}).
2. USE ONLY THE EDGES LISTED ABOVE. Do not hallucinate connections.
3. If a node (e.g., 'transport') is NOT in the "Available nodes" list, YOU CANNOT CREATE A POLICY FOR IT.
4. If a node is listed in DISABLED SECTORS, do not attempt to change its edges (it is already off).
5. If the user asks to INCREASE emissions, you MUST generate a policy that INCREASES them.
6. Ignore research advice if it contradicts the goal to {task_description}.
7. Use the research only for context on *what* to modify, but reverse the action if needed to match the goal.

WRONG EXAMPLES (DO NOT DO THIS):
  ✗ Change 0.7 to 0.75 (wrong direction)
  ✗ Change 0.5 to 0.8 (wrong direction)
  ✗ Change 0.6 to 0.7 (wrong direction)

CORRECT EXAMPLES:
{correct_examples}

TASK: Create ONE policy to {task_description} by addressing: "{flat_chunks[0][:100] if flat_chunks else 'emissions policy'}..."
If the research suggests "Promoting EV", and your task is to INCREASE emissions, your policy should be "Tax EVs / Promote Gas Cars".

Return ONLY valid JSON:
{{
  "policy_id": "policy-slug",
  "name": "Policy Name",
  "description": "Description",
  "mutations": [
    {{
      "type": "{mutation_type}",
      "source": "transport",
      "target": "vehicle-emissions",
      "new_weight": {"0.35" if not increase_emissions else "0.9"},
      "original_weight": 0.7,
      "reason": "Research shows..."
    }}
  ],
  "estimated_impacts": {{
    "{estimated_field}": {"15.0" if not increase_emissions else "12.0"},
    "aqi_improvement_pct": {"18.0" if not increase_emissions else "-15.0"},
    "confidence": 0.8
  }},
  "trade_offs": [],
  "source_research": {{
    "paper_ids": [],
    "key_quotes": [],
    "confidence": 0.85
  }}
}}"""
        
        # Call LLM
        response = self.llm.invoke(prompt)
        response_text = response.content
        
        # Extract JSON (handle markdown code blocks)
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if not json_match:
            raise ValueError(f"No JSON found in LLM response: {response_text}")
        
        json_str = json_match.group()
        policy_dict = json.loads(json_str)
        
        # Clean up trade_offs - LLM sometimes returns strings instead of objects
        if 'trade_offs' in policy_dict:
            cleaned_trade_offs = []
            for item in policy_dict['trade_offs']:
                if isinstance(item, str):
                    # Convert string to proper TradeOff object
                    cleaned_trade_offs.append({
                        'sector': 'general',
                        'impact': 'neutral',
                        'magnitude': 'mild',
                        'description': item
                    })
                elif isinstance(item, dict):
                    cleaned_trade_offs.append(item)
            policy_dict['trade_offs'] = cleaned_trade_offs
        
        # Validate against schema
        policy = Policy(**policy_dict)
        
        # Log the mutations for debugging
        print(f"\n[Policy Generated]")
        print(f"Policy: {policy.name}")
        print(f"Description: {policy.description}")
        print(f"Mutations: {len(policy.mutations)}")
        for i, mut in enumerate(policy.mutations):
            if mut.type in ["reduce_edge_weight", "increase_edge_weight"]:
                print(f"  {i+1}. {mut.type}: {mut.source} -> {mut.target}")
                print(f"     New weight: {mut.new_weight} (reason: {mut.reason})")
        print(f"Estimated CO₂ reduction: {policy.estimated_impacts.co2_reduction_pct}%")
        print(f"Estimated AQI improvement: {policy.estimated_impacts.aqi_improvement_pct}%\n")
        
        # Validate mutations reference real nodes/edges
        self._validate_mutations(policy, graph_context)
        
        return policy
    
    def _validate_mutations(self, policy: Policy, graph_context: Dict) -> None:
        """Ensure mutations reference real nodes/edges."""
        # Handle both old (node_ids list) and new (nodes dict list) formats
        if 'nodes' in graph_context and isinstance(graph_context['nodes'], list):
            node_ids = set(n['id'] for n in graph_context['nodes'])
        else:
            node_ids = set(graph_context.get("node_ids", []))
            
        edge_pairs = set((e['source'], e['target']) for e in graph_context.get("edges", []))
        
        for mutation in policy.mutations:
            if mutation.type == "disable_node":
                if mutation.node_id not in node_ids:
                    raise ValueError(f"Unknown node: {mutation.node_id}")
            
            elif mutation.type in ["reduce_edge_weight", "increase_edge_weight"]:
                if (mutation.source, mutation.target) not in edge_pairs:
                    raise ValueError(f"Unknown edge: {mutation.source} -> {mutation.target}")
                
                if mutation.new_weight is None or not (0.0 <= mutation.new_weight <= 1.0):
                    raise ValueError(f"Invalid weight: {mutation.new_weight}")


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_graph_context_from_file(filepath: str) -> Dict[str, Any]:
    """
    Load graph context (nodes, edges) from snapshot file.
    Used for validation during policy extraction.
    """
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        # Extract node IDs
        node_ids = [n['id'] for n in data.get('nodes', [])]
        
        # Extract edges with weights
        edges = [
            {
                'source': e['source'],
                'target': e['target'],
                'weight': e.get('data', {}).get('weight', 0.5)
            }
            for e in data.get('edges', [])
        ]
        
        return {
            'node_ids': node_ids,
            'edges': edges,
            'full_graph': data
        }
    except Exception as e:
        print(f"Could not load graph context: {e}")
        return {
            'node_ids': [
                'industries', 'transport', 'energy', 'infrastructure',
                'moves-goods', 'uses-power', 'fuels-transport', 'co2', 'aqi'
            ],
            'edges': [
                {'source': 'industries', 'target': 'transport', 'weight': 0.6},
                {'source': 'transport', 'target': 'vehicle-emissions', 'weight': 0.7},
                {'source': 'energy', 'target': 'co2', 'weight': 0.8},
                {'source': 'co2', 'target': 'aqi', 'weight': 0.9}
            ]
        }
