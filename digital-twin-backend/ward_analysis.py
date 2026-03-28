"""
Ward-wise Hyper-Local AQI & Pollution Analysis Module.

Provides:
 - Data preprocessing (encode, normalize)
 - RandomForest pollution-source prediction
 - KMeans ward clustering (k=3)
 - Pollution risk scoring
 - Rule-based policy recommendations
 - Simulated AQI generation
 - GeoJSON merge with enriched properties
 - Flask route registration
"""

import os
import json
import random
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.cluster import KMeans
from flask import jsonify, request

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).parent
WARDS_EXCEL = BASE_DIR.parent / "Wards and zones.xlsx"
WARDS_GEOJSON = BASE_DIR / "wards.geojson"


# ===========================================================================
# WardAnalyzer — all ML + analytics in one class
# ===========================================================================

class WardAnalyzer:
    """Loads ward data, trains models, and exposes enriched results."""

    def __init__(self):
        self.df = None
        self.df_enriched = None
        self.label_encoders: dict[str, LabelEncoder] = {}
        self.scaler = MinMaxScaler()
        self.rf_model = None
        self.kmeans_model = None
        self.feature_importances = {}
        self._build()

    # ------------------------------------------------------------------
    # 1. Load & preprocess
    # ------------------------------------------------------------------

    # Ordinal maps for text-based severity columns
    _ORDINAL_MAP = {"low": 1, "medium": 2, "high": 3, "very high": 4, "unknown": 0}

    def _load_data(self) -> pd.DataFrame:
        df = pd.read_excel(str(WARDS_EXCEL), engine="openpyxl")
        # Standardise column names (strip whitespace)
        df.columns = [c.strip() for c in df.columns]
        # Drop rows where Ward_No is missing
        df.dropna(subset=["Ward_No"], inplace=True)
        # Fill remaining NAs for text cols
        for col in ["Area_Type", "CO2_Source", "AQI_Sensitivity", "Density",
                     "Dominant_Local_Pollution_Source", "Zone", "AC_Name"]:
            if col in df.columns:
                df[col].fillna("Unknown", inplace=True)
        # Population — keep numeric
        if "Population" in df.columns:
            df["Population"] = pd.to_numeric(df["Population"], errors="coerce")
            df["Population"].fillna(df["Population"].median(), inplace=True)
        # Density & AQI_Sensitivity are categorical (Low/Medium/High/Very High)
        # → convert to ordinal numeric for ML
        for col in ["Density", "AQI_Sensitivity"]:
            if col in df.columns:
                df[f"{col}_num"] = (
                    df[col].astype(str).str.strip().str.lower()
                    .map(self._ORDINAL_MAP).fillna(0).astype(int)
                )
        # Ensure Ward_No is string for merge
        df["Ward_No"] = df["Ward_No"].astype(str).str.strip()
        return df

    def _encode_categoricals(self, df: pd.DataFrame) -> pd.DataFrame:
        for col in ["Area_Type", "CO2_Source", "AQI_Sensitivity"]:
            le = LabelEncoder()
            df[f"{col}_enc"] = le.fit_transform(df[col].astype(str))
            self.label_encoders[col] = le
        return df

    def _normalize(self, df: pd.DataFrame) -> pd.DataFrame:
        # Population & Density_num (ordinal-encoded) are the numeric features
        norm_cols = ["Population", "Density_num"]
        df[["Population_norm", "Density_norm"]] = self.scaler.fit_transform(
            df[norm_cols].values
        )
        # Also normalise AQI_Sensitivity_num for risk calc
        sens_vals = df["AQI_Sensitivity_num"].values.reshape(-1, 1)
        from sklearn.preprocessing import MinMaxScaler as MMS
        s = MMS()
        df["AQI_Sensitivity_norm"] = s.fit_transform(sens_vals).ravel()
        return df

    # ------------------------------------------------------------------
    # 2. Pollution source prediction (RandomForest)
    # ------------------------------------------------------------------
    def _train_rf(self, df: pd.DataFrame) -> pd.DataFrame:
        feature_cols = [
            "Population_norm", "Density_norm",
            "Area_Type_enc", "CO2_Source_enc", "AQI_Sensitivity_enc",
        ]
        X = df[feature_cols].values
        # Encode target
        le_target = LabelEncoder()
        y = le_target.fit_transform(df["Dominant_Local_Pollution_Source"].astype(str))
        self.label_encoders["target"] = le_target

        self.rf_model = RandomForestClassifier(
            n_estimators=100, random_state=42, n_jobs=-1
        )
        self.rf_model.fit(X, y)

        # Predictions
        preds = self.rf_model.predict(X)
        df["predicted_source"] = le_target.inverse_transform(preds)

        # Feature importances
        self.feature_importances = dict(
            zip(feature_cols, self.rf_model.feature_importances_.tolist())
        )
        return df

    # ------------------------------------------------------------------
    # 3. KMeans clustering  (k=3)
    # ------------------------------------------------------------------
    def _cluster(self, df: pd.DataFrame) -> pd.DataFrame:
        cluster_cols = ["Population_norm", "Density_norm", "AQI_Sensitivity_norm"]
        X_cluster = df[cluster_cols].values

        self.kmeans_model = KMeans(n_clusters=3, random_state=42, n_init=10)
        df["cluster"] = self.kmeans_model.fit_predict(X_cluster)

        # Assign semantic labels based on cluster-center magnitude
        centers = self.kmeans_model.cluster_centers_
        center_mags = centers.sum(axis=1)
        order = np.argsort(center_mags)  # ascending risk
        label_map = {}
        risk_labels = ["Low Risk", "Medium Risk", "High Risk"]
        for rank, cluster_id in enumerate(order):
            label_map[int(cluster_id)] = risk_labels[rank]
        df["cluster_label"] = df["cluster"].map(label_map)
        return df

    # ------------------------------------------------------------------
    # 4. Risk score
    # ------------------------------------------------------------------
    @staticmethod
    def _risk_score(df: pd.DataFrame) -> pd.DataFrame:
        df["risk_score"] = (
            0.4 * df["Density_norm"]
            + 0.3 * df["Population_norm"]
            + 0.3 * df["AQI_Sensitivity_norm"]
        )
        df["risk_score"] = df["risk_score"].round(4)

        def categorize(v):
            if v > 0.66:
                return "High"
            elif v > 0.33:
                return "Medium"
            return "Low"

        df["risk_level"] = df["risk_score"].apply(categorize)
        return df

    # ------------------------------------------------------------------
    # 5. Policy recommendations
    # ------------------------------------------------------------------
    @staticmethod
    def _recommend(source: str) -> str:
        s = str(source).lower()
        parts: list[str] = []
        if "traffic" in s or "vehicular" in s or "vehicle" in s or "transport" in s:
            parts.append("Restrict heavy vehicles in peak hours; promote public transit & EV adoption")
        if "construction" in s or "dust" in s:
            parts.append("Enforce dust-control measures on construction sites; use water sprinklers")
        if "biomass" in s or "burning" in s or "fuel" in s or "domestic" in s:
            parts.append("Implement biomass-burning ban; provide subsidised LPG/electric alternatives")
        if "industr" in s or "emission" in s or "factory" in s:
            parts.append("Tighten industrial emission norms; mandate scrubbers & real-time monitoring")
        if "waste" in s or "landfill" in s:
            parts.append("Improve solid-waste management; close illegal dump sites; increase recycling")
        if not parts:
            parts.append("Increase green cover; deploy air-quality monitoring stations")
        return "; ".join(parts)

    # ------------------------------------------------------------------
    # 6. Simulated AQI
    # ------------------------------------------------------------------
    @staticmethod
    def _simulate_aqi(density_norm: float) -> int:
        """AQI = Density_norm × 200 + random noise (50–150)."""
        return int(density_norm * 200 + random.uniform(50, 150))

    # ------------------------------------------------------------------
    # Master build
    # ------------------------------------------------------------------
    def _build(self):
        df = self._load_data()
        df = self._encode_categoricals(df)
        df = self._normalize(df)
        df = self._train_rf(df)
        df = self._cluster(df)
        df = self._risk_score(df)
        # Recommendations
        df["recommendation"] = df["Dominant_Local_Pollution_Source"].apply(
            self._recommend
        )
        self.df = df
        # Create enriched copy (will regenerate AQI on each call)
        self.df_enriched = df.copy()
        print(f"[WardAnalyzer] Loaded {len(df)} wards, "
              f"RF accuracy = {(df['predicted_source'] == df['Dominant_Local_Pollution_Source']).mean():.1%}")

    # ==================================================================
    # Public API helpers
    # ==================================================================

    def get_wards_data(self) -> list[dict]:
        """Return enriched ward data with freshly-simulated AQI."""
        df = self.df_enriched.copy()
        df["simulated_aqi"] = df["Density_norm"].apply(self._simulate_aqi)

        keep = [
            "Ward_No", "Ward_Name", "Zone", "AC_Name",
            "Population", "Density", "Area_Type", "AQI_Sensitivity",
            "CO2_Source", "Dominant_Local_Pollution_Source",
            "risk_score", "risk_level",
            "cluster", "cluster_label",
            "predicted_source", "simulated_aqi", "recommendation",
        ]
        out = df[[c for c in keep if c in df.columns]]
        return json.loads(out.to_json(orient="records"))

    def get_recommendations(self) -> list[dict]:
        """Return ward-wise policy recommendations."""
        df = self.df_enriched
        recs = df[["Ward_No", "Ward_Name", "Zone", "Dominant_Local_Pollution_Source",
                    "predicted_source", "recommendation"]].copy()
        return json.loads(recs.to_json(orient="records"))

    def get_geo_data(self) -> dict:
        """Merge enriched ward data into GeoJSON feature properties."""
        with open(str(WARDS_GEOJSON), "r", encoding="utf-8") as f:
            geojson = json.load(f)

        # Build lookup by Ward_No (string)
        df = self.df_enriched.copy()
        df["simulated_aqi"] = df["Density_norm"].apply(self._simulate_aqi)
        lookup = {}
        for _, row in df.iterrows():
            key = str(row["Ward_No"]).strip()
            lookup[key] = {
                "Ward_Name": str(row.get("Ward_Name", "")),
                "Zone": str(row.get("Zone", "")),
                "Population": int(row.get("Population", 0)),
                "Density": str(row.get("Density", "")),
                "Area_Type": str(row.get("Area_Type", "")),
                "AQI_Sensitivity": str(row.get("AQI_Sensitivity", "")),
                "CO2_Source": str(row.get("CO2_Source", "")),
                "risk_score": float(row.get("risk_score", 0)),
                "risk_level": str(row.get("risk_level", "Unknown")),
                "cluster": int(row.get("cluster", -1)),
                "cluster_label": str(row.get("cluster_label", "Unknown")),
                "predicted_source": str(row.get("predicted_source", "")),
                "simulated_aqi": int(row.get("simulated_aqi", 0)),
                "recommendation": str(row.get("recommendation", "")),
            }

        # Also build a Ward_Name lookup (uppercased) for fallback merge
        name_lookup: dict[str, dict] = {}
        for _, row in df.iterrows():
            name_key = str(row.get("Ward_Name", "")).strip().upper()
            if name_key:
                name_lookup[name_key] = lookup[str(row["Ward_No"]).strip()]

        # Merge into GeoJSON features
        for feature in geojson.get("features", []):
            props = feature.get("properties", {})
            ward_no = str(props.get("Ward_No", "")).strip()
            ward_name = str(props.get("Ward_Name", "")).strip().upper()

            enriched = lookup.get(ward_no) or name_lookup.get(ward_name)
            if enriched:
                feature["properties"].update(enriched)
            else:
                # No match — fill with defaults so frontend can handle gracefully
                feature["properties"].update({
                    "risk_level": "Unknown",
                    "risk_score": 0,
                    "cluster_label": "Unknown",
                    "simulated_aqi": 0,
                    "Population": 0,
                    "Density": "Unknown",
                    "predicted_source": "N/A",
                    "recommendation": "No data available",
                })

        return geojson

    def get_feature_importance(self) -> dict:
        return self.feature_importances


# ===========================================================================
# Flask route registration  (matches project pattern)
# ===========================================================================

# Lazily initialised singleton
_analyzer: WardAnalyzer | None = None


def _get_analyzer() -> WardAnalyzer:
    global _analyzer
    if _analyzer is None:
        _analyzer = WardAnalyzer()
    return _analyzer


def register_ward_routes(app):
    """Register all ward-analysis API routes on the Flask app."""

    @app.route("/api/wards-data", methods=["GET"])
    def api_wards_data():
        """Return all ward data with risk, cluster, prediction, AQI."""
        try:
            analyzer = _get_analyzer()
            data = analyzer.get_wards_data()

            # Optional filters via query params
            zone = request.args.get("zone")
            risk = request.args.get("risk_level")
            source = request.args.get("source")

            if zone:
                data = [d for d in data if d.get("Zone", "").lower() == zone.lower()]
            if risk:
                data = [d for d in data if d.get("risk_level", "").lower() == risk.lower()]
            if source:
                data = [d for d in data
                        if source.lower() in d.get("predicted_source", "").lower()]

            return jsonify({"status": "success", "count": len(data), "data": data})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({"status": "error", "error": str(e)}), 500

    @app.route("/api/recommendations", methods=["GET"])
    def api_recommendations():
        """Return ward-wise policy suggestions."""
        try:
            analyzer = _get_analyzer()
            recs = analyzer.get_recommendations()
            return jsonify({"status": "success", "count": len(recs), "data": recs})
        except Exception as e:
            return jsonify({"status": "error", "error": str(e)}), 500

    @app.route("/api/geo-data", methods=["GET"])
    def api_geo_data():
        """Return merged GeoJSON with enriched ward properties."""
        try:
            analyzer = _get_analyzer()
            geojson = analyzer.get_geo_data()
            return jsonify(geojson)
        except Exception as e:
            return jsonify({"status": "error", "error": str(e)}), 500

    @app.route("/api/ward-feature-importance", methods=["GET"])
    def api_ward_feature_importance():
        """Return Random Forest feature importances."""
        try:
            analyzer = _get_analyzer()
            fi = analyzer.get_feature_importance()
            return jsonify({"status": "success", "feature_importances": fi})
        except Exception as e:
            return jsonify({"status": "error", "error": str(e)}), 500

    print("[WardAnalysis] Routes registered: /api/wards-data, /api/recommendations, /api/geo-data, /api/ward-feature-importance")
