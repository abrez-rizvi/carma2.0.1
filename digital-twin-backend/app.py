"""
Flask API server for the policy engine.
Endpoints for generating policies, applying them, and analyzing impacts.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json
import traceback

from policy_engine import PolicyEngine, get_graph_context_from_file
from graph_engine import GraphState, ImpactAnalyzer
from health_analyzer import HealthImpactAnalyzer
from explainability import generate_policy_explanation
from explainability import generate_policy_explanation
from aqi import register_aqi_routes
from emission_forecast import register_emission_routes
import config
import os


# ============================================================================
# SETUP
# ============================================================================

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Initialize engines
policy_engine = PolicyEngine()
health_analyzer = HealthImpactAnalyzer()

# Register AQI routes
register_aqi_routes(app)
register_emission_routes(app)
from aqi_history import register_aqi_history_routes
register_aqi_history_routes(app)

# Register Ward Analysis routes (Hyper-Local AQI)
from ward_analysis import register_ward_routes
register_ward_routes(app)

# Pre-initialize AQI Data & Model to prevent timeout on first request
from aqi_history import get_aqi_history
print("Initializing AQI History & Model...")
get_aqi_history()
from aqi_map import generate_heatmap_html, generate_hotspots_html, generate_forecast_hotspots_html, render_map_to_png, generate_ward_geojson_heatmap, generate_zone_geojson_heatmap
from emission_map import generate_emission_heatmap_html, generate_emission_hotspots_html, generate_forecast_emission_hotspots_html, render_map_to_png as render_emission_map_to_png
import threading

# Ensure map directory exists
STATIC_DIR = os.path.join(os.getcwd(), 'static')
os.makedirs(STATIC_DIR, exist_ok=True)
HEATMAP_PATH = os.path.join(STATIC_DIR, 'aqi_map_heatmap.png')
HOTSPOTS_PATH = os.path.join(STATIC_DIR, 'aqi_map_hotspots.png')

# Emission map paths
EMISSION_HEATMAP_PATH = os.path.join(STATIC_DIR, 'emission_map_heatmap.png')
EMISSION_HOTSPOTS_PATH = os.path.join(STATIC_DIR, 'emission_map_hotspots.png')

# Default map path (alias to heatmap for backward compat)
MAP_IMAGE_PATH = HEATMAP_PATH 

@app.route('/api/aqi-map', methods=['GET'])
def get_aqi_map_html():
    """Returns the Interactive Heatmap HTML (Default)"""
    return generate_heatmap_html()

@app.route('/api/aqi-map/heatmap', methods=['GET'])
def get_heatmap_html():
    """Explicit endpoint for Heatmap HTML"""
    return generate_heatmap_html()

@app.route('/api/aqi-map/hotspots', methods=['GET'])
def get_hotspots_html():
    """Returns the Interactive Hotspots HTML. Accepts optional 'year' param for forecast."""
    year = request.args.get('year', type=int)
    
    # Validate year if provided
    if year and year in [2026, 2027, 2028]:
        return generate_forecast_hotspots_html(year)
    
    return generate_hotspots_html()

@app.route('/api/aqi-map.png', methods=['GET'])
def get_aqi_map_png():
    """Default map image (Heatmap)"""
    return get_heatmap_png()

@app.route('/api/aqi-map/heatmap.png', methods=['GET'])
def get_heatmap_png():
    """Returns the Heatmap Grid PNG"""
    from flask import send_file
    
    # Simple caching/regeneration logic
    if not os.path.exists(HEATMAP_PATH) or request.args.get('refresh'):
        html = generate_heatmap_html()
        render_map_to_png(html, HEATMAP_PATH)
        
    return send_file(HEATMAP_PATH, mimetype='image/png')

@app.route('/api/aqi-map/hotspots.png', methods=['GET'])
def get_hotspots_png():
    """Returns the Hotspots PNG. Accepts optional 'year' param for forecast (2026-2028)."""
    from flask import send_file
    
    year = request.args.get('year', type=int)
    
    # Validate year if provided
    if year and year not in [2026, 2027, 2028]:
        year = None
    
    if year:
        # Generate forecast-based hotspots for the selected year
        cache_path = os.path.join(STATIC_DIR, f'aqi_map_hotspots_{year}.png')
        if not os.path.exists(cache_path) or request.args.get('refresh'):
            html = generate_forecast_hotspots_html(year)
            render_map_to_png(html, cache_path)
        return send_file(cache_path, mimetype='image/png')
    else:
        # Original baseline hotspots
        if not os.path.exists(HOTSPOTS_PATH) or request.args.get('refresh'):
            html = generate_hotspots_html()
            render_map_to_png(html, HOTSPOTS_PATH)
        return send_file(HOTSPOTS_PATH, mimetype='image/png')

# Ward/Zone GeoJSON map paths
WARD_GEOJSON_PATH = os.path.join(STATIC_DIR, 'aqi_map_ward_geojson.png')
ZONE_GEOJSON_PATH = os.path.join(STATIC_DIR, 'aqi_map_zone_geojson.png')

@app.route('/api/aqi-map/ward-geojson', methods=['GET'])
def get_ward_geojson_html():
    """Returns the Interactive Ward GeoJSON Heatmap HTML"""
    return generate_ward_geojson_heatmap()

@app.route('/api/aqi-map/ward-geojson.png', methods=['GET'])
def get_ward_geojson_png():
    """Returns the Ward GeoJSON Heatmap PNG"""
    from flask import send_file
    if not os.path.exists(WARD_GEOJSON_PATH) or request.args.get('refresh'):
        html = generate_ward_geojson_heatmap()
        render_map_to_png(html, WARD_GEOJSON_PATH)
    return send_file(WARD_GEOJSON_PATH, mimetype='image/png')

@app.route('/api/aqi-map/zone-geojson', methods=['GET'])
def get_zone_geojson_html():
    """Returns the Interactive Zone GeoJSON Heatmap HTML"""
    return generate_zone_geojson_heatmap()

@app.route('/api/aqi-map/zone-geojson.png', methods=['GET'])
def get_zone_geojson_png():
    """Returns the Zone GeoJSON Heatmap PNG"""
    from flask import send_file
    if not os.path.exists(ZONE_GEOJSON_PATH) or request.args.get('refresh'):
        html = generate_zone_geojson_heatmap()
        render_map_to_png(html, ZONE_GEOJSON_PATH)
    return send_file(ZONE_GEOJSON_PATH, mimetype='image/png')

# ============================================================================
# EMISSION MAPS - CO2 Visualization
# ============================================================================

@app.route('/api/emission-map', methods=['GET'])
def get_emission_map_html():
    """Returns the Interactive Emission Heatmap HTML (Default)"""
    return generate_emission_heatmap_html()

@app.route('/api/emission-map/heatmap', methods=['GET'])
def get_emission_heatmap_html():
    """Explicit endpoint for Emission Heatmap HTML"""
    return generate_emission_heatmap_html()

@app.route('/api/emission-map/hotspots', methods=['GET'])
def get_emission_hotspots_html():
    """Returns the Interactive Emission Hotspots HTML. Accepts optional 'year' param."""
    year = request.args.get('year', type=int)
    
    if year and year in [2026, 2027, 2028]:
        return generate_forecast_emission_hotspots_html(year)
    
    return generate_emission_hotspots_html()

@app.route('/api/emission-map/heatmap.png', methods=['GET'])
def get_emission_heatmap_png():
    """Returns the Emission Heatmap Grid PNG"""
    from flask import send_file
    
    if not os.path.exists(EMISSION_HEATMAP_PATH) or request.args.get('refresh'):
        html = generate_emission_heatmap_html()
        render_emission_map_to_png(html, EMISSION_HEATMAP_PATH)
        
    return send_file(EMISSION_HEATMAP_PATH, mimetype='image/png')

@app.route('/api/emission-map/hotspots.png', methods=['GET'])
def get_emission_hotspots_png():
    """Returns the Emission Hotspots PNG. Accepts optional 'year' param (2026-2028)."""
    from flask import send_file
    
    year = request.args.get('year', type=int)
    
    if year and year not in [2026, 2027, 2028]:
        year = None
    
    if year:
        cache_path = os.path.join(STATIC_DIR, f'emission_map_hotspots_{year}.png')
        if not os.path.exists(cache_path) or request.args.get('refresh'):
            html = generate_forecast_emission_hotspots_html(year)
            render_emission_map_to_png(html, cache_path)
        return send_file(cache_path, mimetype='image/png')
    else:
        if not os.path.exists(EMISSION_HOTSPOTS_PATH) or request.args.get('refresh'):
            html = generate_emission_hotspots_html()
            render_emission_map_to_png(html, EMISSION_HOTSPOTS_PATH)
        return send_file(EMISSION_HOTSPOTS_PATH, mimetype='image/png')

# ============================================================================
# SECTOR-SPECIFIC EMISSION MAPS
# ============================================================================

VALID_SECTORS = ['Industry', 'Transport', 'Power', 'Residential', 'Aviation', 'Commercial']

@app.route('/api/emission-map/sector/heatmap', methods=['GET'])
def get_sector_heatmap_html():
    """Returns sector-specific emission heatmap HTML."""
    from emission_map import generate_sector_heatmap_html
    
    sector = request.args.get('sector', 'Industry')
    if sector not in VALID_SECTORS:
        sector = 'Industry'
    
    return generate_sector_heatmap_html(sector)

@app.route('/api/emission-map/sector/heatmap.png', methods=['GET'])
def get_sector_heatmap_png():
    """Returns sector-specific emission heatmap PNG."""
    from flask import send_file
    from emission_map import generate_sector_heatmap_html, render_map_to_png
    
    sector = request.args.get('sector', 'Industry')
    if sector not in VALID_SECTORS:
        sector = 'Industry'
    
    cache_path = os.path.join(STATIC_DIR, f'sector_heatmap_{sector.lower()}.png')
    if not os.path.exists(cache_path) or request.args.get('refresh'):
        html = generate_sector_heatmap_html(sector)
        render_map_to_png(html, cache_path)
    
    return send_file(cache_path, mimetype='image/png')

@app.route('/api/emission-map/sector/hotspots', methods=['GET'])
def get_sector_hotspots_html():
    """Returns sector-specific emission hotspots HTML."""
    from emission_map import generate_sector_hotspots_html
    
    sector = request.args.get('sector', 'Industry')
    year = request.args.get('year', type=int)
    
    if sector not in VALID_SECTORS:
        sector = 'Industry'
    if year and year not in [2026, 2027, 2028]:
        year = None
    
    return generate_sector_hotspots_html(sector, year)

@app.route('/api/emission-map/sector/hotspots.png', methods=['GET'])
def get_sector_hotspots_png():
    """Returns sector-specific emission hotspots PNG."""
    from flask import send_file
    from emission_map import generate_sector_hotspots_html, render_map_to_png
    
    sector = request.args.get('sector', 'Industry')
    year = request.args.get('year', type=int)
    
    if sector not in VALID_SECTORS:
        sector = 'Industry'
    if year and year not in [2026, 2027, 2028]:
        year = None
    
    cache_key = f'sector_hotspots_{sector.lower()}'
    if year:
        cache_key += f'_{year}'
    cache_path = os.path.join(STATIC_DIR, f'{cache_key}.png')
    
    if not os.path.exists(cache_path) or request.args.get('refresh'):
        html = generate_sector_hotspots_html(sector, year)
        render_map_to_png(html, cache_path)
    
    return send_file(cache_path, mimetype='image/png')

# Background task to refresh map periodically (optional)
def refresh_map_periodically():
    while True:
        try:
            print("Refreshing AQI Map image...")
            html = generate_aqi_map_html()
            render_map_to_png(html, MAP_IMAGE_PATH)
        except Exception as e:
            print(f"Error refreshing map: {e}")
        time.sleep(3600) # Every hour

# Start background thread for map refresh
# threading.Thread(target=refresh_map_periodically, daemon=True).start()


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_graph_state():
    """Load current graph state."""
    try:
        return GraphState.from_file(str(config.GRAPH_STATE_PATH))
    except Exception as e:
        print(f"Error loading graph: {e}")
        return None


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/', methods=['GET'])
def index():
    """Root endpoint to show server status."""
    return jsonify({
        'message': 'Digital Twin Policy Engine API is running',
        'endpoints': {
            'health': '/api/health',
            'aqi': '/api/aqi?lat=28.7041&lon=77.1025'
        },
        'status': 'active'
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'service': 'policy-engine'
    })


@app.route('/api/graph-state', methods=['GET'])
def get_current_graph_state():
    """
    Get current graph state (nodes, edges, values).
    Used by frontend for validation and context.
    """
    try:
        graph = get_graph_state()
        if not graph:
            return jsonify({'error': 'Could not load graph'}), 500
        
        return jsonify({
            'status': 'success',
            'graph': graph.to_dict(),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/generate-policy', methods=['POST'])
def generate_policy():
    """
    Generate policy from research query.
    
    Request body:
    {
        "research_query": "How to reduce transport emissions?"
    }
    
    Returns:
    {
        "policy": { Policy JSON },
        "research_evidence": ["chunk1", "chunk2", ...],
        "status": "success"
    }
    """
    try:
        data = request.json
        query = data.get('research_query')
        
        if not query:
            return jsonify({'error': 'Missing research_query'}), 400
        
        # Retrieve research
        research_chunks = policy_engine.query_research(query, k=3)
        
        # Get graph context for validation
        graph_context = data.get('graph_context')
        if not graph_context:
            print("Using static graph context from file")
            graph_context = get_graph_context_from_file(str(config.GRAPH_STATE_PATH))
        else:
            print("Using dynamic graph context from frontend")
        
        # Extract policy via LLM
        policy = policy_engine.extract_policy(research_chunks, graph_context, user_query=query)
        
        return jsonify({
            'status': 'success',
            'policy': policy.dict(),
            'research_evidence': research_chunks,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        print(f"Error in generate_policy: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/apply-policy', methods=['POST'])
def apply_policy():
    """
    Apply policy to graph and calculate impact.
    
    Request body:
    {
        "policy": { Policy JSON from generate-policy }
    }
    
    Returns:
    {
        "snapshot": {
            "scenario_id": "id",
            "policy_id": "id",
            "impact": { CO2 and AQI changes },
            "cascade_analysis": { affected nodes },
            ...
        },
        "status": "success"
    }
    """
    try:
        data = request.json
        policy_dict = data.get('policy')
        
        if not policy_dict:
            return jsonify({'error': 'Missing policy'}), 400
        
        # Load baseline
        graph_context = data.get('graph_context')
        if graph_context:
            print("Using dynamic graph context for baseline")
            # Reconstruct GraphState from context
            # Context has { node_ids: [], edges: [{source, target, weight}] }
            # We need to map this back to the GraphState structure
            try:
                # Load full default graph to get default node data (values, labels) which might be missing in context list
                file_graph = get_graph_state()
                
                # Reconstruct nodes with enabled status
                context_nodes = graph_context.get('nodes', [])
                if context_nodes and isinstance(context_nodes, list):
                     # New format: list of dicts with enabled status
                     reconstructed_nodes = []
                     for n_ctx in context_nodes:
                         # Find original node data to preserve other fields (x, y, label, etc)
                         original = next((on for on in file_graph.nodes if on['id'] == n_ctx['id']), None)
                         if original:
                             new_node = original.copy()
                             if 'data' not in new_node:
                                 new_node['data'] = {}
                             new_node['data']['enabled'] = n_ctx.get('enabled', True)
                             reconstructed_nodes.append(new_node)
                     baseline_nodes = reconstructed_nodes
                else:
                    # Old format: list of IDs
                    valid_node_ids = set(graph_context.get('node_ids', context_nodes)) # fallback if context_nodes is list of strings
                    baseline_nodes = [n for n in file_graph.nodes if n['id'] in valid_node_ids]
                
                # Reconstruct edges
                context_edges = graph_context.get('edges', [])
                reconstructed_edges = []
                for e in context_edges:
                    reconstructed_edges.append({
                        'source': e['source'],
                        'target': e['target'],
                        'data': {'weight': e['weight']}
                    })
                
                baseline = GraphState(baseline_nodes, reconstructed_edges)
            except Exception as e:
                print(f"Error reconstructing dynamic baseline: {e}")
                baseline = get_graph_state()
        else:
            baseline = get_graph_state()

        if not baseline:
            return jsonify({'error': 'Could not load baseline graph'}), 500
        
        # Create post-policy state (deep copy baseline)
        import copy
        post_policy = GraphState(
            copy.deepcopy(baseline.nodes),
            copy.deepcopy(baseline.edges)
        )
        
        # Apply mutations
        mutation_results = post_policy.apply_policy(policy_dict)
        
        # Log mutations with before/after values
        print(f"\n[Policy Applied]")
        # Print transport value if it exists, safely
        trans_node = baseline.get_node('transport')
        if trans_node:
            print(f"Baseline Transport value: {trans_node['data'].get('value', 'N/A')}")
            
        print(f"Baseline CO2 value: {baseline.get_node('co2')['data']['value']}")
        print(f"Baseline AQI value: {baseline.get_node('aqi')['data']['value']}")
        
        for i, mut in enumerate(mutation_results.get('mutations_applied', [])):
            print(f"Mutation {i+1}: {mut['type']}")
            if 'before' in mut and 'after' in mut:
                print(f"  Before: {mut['before']}")
                print(f"  After: {mut['after']}")
        
        # Calculate impact
        analyzer = ImpactAnalyzer(baseline, post_policy)
        impact = analyzer.calculate_impact()
        
        if trans_node:
             post_trans = post_policy.get_node('transport')
             print(f"Post-policy Transport value: {post_trans['data'].get('value', 'N/A')}")
             
        print(f"Post-policy CO2 value: {post_policy.get_node('co2')['data']['value']}")
        print(f"Post-policy AQI value: {post_policy.get_node('aqi')['data']['value']}")
        print(f"Impact: CO₂ change {impact['co2']['change_pct']:.1f}%, AQI change {impact['aqi']['change_pct']:.1f}%\n")
        
        # Create snapshot
        snapshot = {
            'scenario_id': f"snap-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            'policy_id': policy_dict.get('policy_id'),
            'policy_name': policy_dict.get('name'),
            'baseline_graph': baseline.to_dict(),
            'post_policy_graph': post_policy.to_dict(),
            'mutations_applied': mutation_results['mutations_applied'],
            'impact': impact,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify({
            'snapshot': snapshot,
            'status': 'success'
        })
    
    except Exception as e:
        print(f"Error in apply_policy: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/compare-scenarios', methods=['POST'])
def compare_scenarios():
    """
    Compare multiple scenarios side-by-side.
    
    Request body:
    {
        "scenarios": [
            { "name": "Scenario 1", "policy": { Policy JSON } },
            { "name": "Scenario 2", "policy": { Policy JSON } },
            ...
        ]
    }
    
    Returns:
    {
        "comparison": [ Snapshots for each scenario ],
        "ranking": {
            "best_co2_reduction": "Scenario name",
            "best_aqi_improvement": "Scenario name"
        }
    }
    """
    try:
        data = request.json
        scenarios = data.get('scenarios', [])
        
        if not scenarios:
            return jsonify({'error': 'Missing scenarios'}), 400
        
        results = []
        
        for scenario in scenarios:
            # Apply each policy
            baseline = get_graph_state()
            if not baseline:
                continue
            
            import copy
            post_policy = GraphState(
                copy.deepcopy(baseline.nodes),
                copy.deepcopy(baseline.edges)
            )
            
            post_policy.apply_policy(scenario.get('policy', {}))
            
            analyzer = ImpactAnalyzer(baseline, post_policy)
            impact = analyzer.calculate_impact()
            
            results.append({
                'name': scenario.get('name'),
                'impact': impact
            })
        
        # Rank by impact
        best_co2 = max(results, key=lambda r: abs(r['impact']['co2']['change_pct']), default={})
        best_aqi = max(results, key=lambda r: abs(r['impact']['aqi']['change_pct']), default={})
        
        return jsonify({
            'status': 'success',
            'comparison': results,
            'ranking': {
                'best_co2_reduction': best_co2.get('name'),
                'best_aqi_improvement': best_aqi.get('name')
            },
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        print(f"Error in compare_scenarios: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/explain-policy', methods=['POST'])
def explain_policy():
    """
    Generate explanation for a policy.
    
    Request body:
    {
        "policy": { Policy JSON },
        "research_evidence": ["chunk1", "chunk2", ...]
    }
    
    Returns:
    {
        "explanation": {
            "policy_id": "...",
            "narrative_intro": "...",
            "mutations": [ { narrative, supporting_research, stakeholders } ],
            "overall_narrative": "..."
        }
    }
    """
    try:
        data = request.json
        policy = data.get('policy')
        research_evidence = data.get('research_evidence', [])
        
        if not policy:
            return jsonify({'error': 'Missing policy'}), 400
        
        # Generate explanation
        explanation = generate_policy_explanation(policy, research_evidence)
        
        return jsonify({
            'status': 'success',
            'explanation': explanation,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        print(f"Error in explain_policy: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/analyze-aqi-health', methods=['POST'])
def analyze_aqi_health():
    """
    Analyze health impacts based on AQI data.
    
    Request body:
    {
        "aqi_data": {
            "aqi": 410,
            "city": "Delhi",
            "pm2_5": 250,
            "pm10": 400,
            "no2": 85,
            "o3": 45,
            "so2": 15,
            "co": 1.5
        }
    }
    
    Response:
    {
        "health_impact": { Health analysis from Gemini },
        "status": "success",
        "timestamp": "..."
    }
    """
    try:
        data = request.json
        aqi_data = data.get('aqi_data')
        
        if not aqi_data:
            return jsonify({'error': 'Missing aqi_data'}), 400
        
        # Analyze health impact
        health_impact = health_analyzer.analyze_aqi_health(aqi_data)
        
        return jsonify({
            'health_impact': health_impact,
            'status': 'success',
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        print(f"Error analyzing AQI health: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@app.route('/api/chat-health', methods=['POST'])
def chat_health():
    """
    Chat with health expert.
    
    Request:
    {
        "message": "Should I wear a mask?",
        "context": { "aqi": 350, "city": "Delhi", ... }
    }
    """
    try:
        data = request.json
        message = data.get('message')
        context = data.get('context', {})
        
        if not message:
            return jsonify({'error': 'Missing message'}), 400
            
        response = health_analyzer.chat_with_health_expert(message, context)
        
        return jsonify({
            'response': response,
            'status': 'success'
        })
    except Exception as e:
        print(f"Error in chat_health: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    is_hf = bool(os.getenv("HF_SPACE_ID"))

    port = 7860 if is_hf else config.FLASK_PORT
    debug = False if is_hf else config.FLASK_DEBUG

    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug
    )

