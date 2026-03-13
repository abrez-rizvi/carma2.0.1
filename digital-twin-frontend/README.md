# Urban Digital Twin Platform

![Cyberpunk Aesthetic](https://img.shields.io/badge/Style-Cyberpunk%2FWeb3-d90282)
![System-Full Stack](https://img.shields.io/badge/System-Full_Stack-blueviolet)
![Next.js](https://img.shields.io/badge/Frontend-Next.js-black)
![Flask](https://img.shields.io/badge/Backend-Flask-green)
![LangChain](https://img.shields.io/badge/AI-LangChain-orange)

A futuristic, high-fidelity Urban Digital Twin designed to simulate city-wide environmental policies. This platform combines a **Cyberpunk/Web3 frontend** with a powerful **Causal AI backend** to visualize AQI data, forecast emissions, and generate AI-driven policy interventions.

---

## 🏗️ System Architecture

The project consists of two main services:

1.  **Frontend (`/frontend`)**: A Next.js 14 application providing the interactive "Glass & Neon" dashboard.
2.  **Backend (`/digital-twin-backend`)**: A Flask API powered by LangChain and Causal Graphs to handle logic, simulations, and AI queries.

## ✨ Key Features

### 🖥️ Frontend (Dashboard)
- **Deep Cyberpunk Aesthetics**: Custom "Glass/Dark" theme with neon accents (#d90282, #00f0ff).
- **Live AQI Monitoring**: Real-time air quality tracking with dynamic health risk indicators.
- **Solutions Marketplace**: An "NFT-style" catalog where users can deploy futuristic urban tech (e.g., *Cloud Seeding*, *Bio-Filters*).
- **Interactive Visualizations**: Recharts-powered graphs for emission forecasting and causal loops.

### 🧠 Backend (Intelligence)
- **Causal Graph Engine**: Simulates the ripple effects of policies across sectors (Transport, Energy, Health).
- **Policy Generator (RAG/LLM)**: Uses LangChain + Groq to research and generate structured policy JSONs.
- **Emission Forecasting**: Random Forest models trained on historical data to predict future CO2/AQI trends.
- **Health Impact Analysis**: Generates personalized health advice based on live environmental data.
- **Speculative Download**: Optimized model loading with "Light Mode" for instant startup.

---

## 🚀 Getting Started

Follow these steps to run the full stack locally.

### Prerequisites
- **Node.js** 18+
- **Python** 3.10+
- **Git**

### 1️⃣ Backend Setup

The backend handles data processing and AI.

1.  Navigate to the backend folder:
    ```bash
    cd digital-twin-backend
    ```

2.  Create and activate a virtual environment (optional but recommended):
    ```bash
    python -m venv venv
    # Windows
    .\venv\Scripts\activate
    # Mac/Linux
    source venv/bin/activate
    ```

3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4.  Configure Environment:
    Create a `.env` file in `digital-twin-backend/` with your keys:
    ```env
    GROQ_API_KEY=your_groq_api_key
    AMBEE_DATA_KEY=your_ambee_key
    HF_HUB_ENABLE_HF_TRANSFER=1
    ```

5.  Run the Server:
    ```bash
    python app.py
    ```
    *The server will start on `http://localhost:5000`*

### 2️⃣ Frontend Setup

The frontend provides the user interface.

1.  Open a new terminal and navigate to the frontend folder:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the Development Server:
    ```bash
    npm run dev
    ```

4.  **Launch**: Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📂 Project Structure

```bash
urban-digital-twin/
├── digital-twin-backend/     # Python/Flask Server
│   ├── app.py                # API Entry Point
│   ├── policy_engine.py      # LLM & RAG Logic
│   ├── graph_engine.py       # Causal Simulation Logic
│   ├── faiss_index/          # Vector Store for Research
│   └── requirements.txt      # Python Dependencies
│
└── frontend/                 # Next.js Client
    ├── app/                  # Pages & Layouts
    ├── src/
    │   ├── components/       # UI Components (CausalGraph, LiveAQI...)
    │   └── data/             # Static Data
    └── public/               # Assets
```

## 🛠️ Configuration

### "Light Mode" (Instant Startup)
The backend is currently configured in **Light Mode** to avoid downloading large embedding models (~500MB) on startup.
- **Enabled**: `policy_engine.py` skips `snapshot_download`.
- **Effect**: Start time is <5 seconds. RAG research is bypassed in favor of direct LLM generation.
- **To Disable**: Uncomment the download logic in `policy_engine.py` to enable full RAG capabilities.

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.
