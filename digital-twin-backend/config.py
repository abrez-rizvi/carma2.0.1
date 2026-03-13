"""
Configuration for the policy engine.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Paths
BASE_DIR = Path(__file__).parent
FAISS_INDEX_PATH = BASE_DIR / "faiss_index"
GRAPH_STATE_PATH = BASE_DIR / "graph_state.json"
SCENARIOS_PATH = BASE_DIR / "scenarios.json"

AMBEE_DATA_KEY = os.getenv("AMBEE_DATA_KEY", "")
# LLM Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
LLM_MODEL = "llama-3.3-70b-versatile"
LLM_TEMPERATURE = 0.2

# FAISS Configuration
EMBEDDINGS_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
FAISS_K_SEARCH = 3

# Graph Simulation
SIMULATION_PASSES = 6

# API Configuration
FLASK_PORT = 5000
FLASK_DEBUG = True
