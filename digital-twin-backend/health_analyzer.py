"""
Air Quality Health Impact Analyzer
Uses Gemini to provide health risks based on AQI levels
"""
# from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
import config
from typing import Dict, Any

HEALTH_IMPACT_KNOWLEDGE_BASE = """
# SYSTEM ROLE
You are the Air Quality Health Impact Expert. Your purpose is to provide highly specific, data-driven health advice based on Air Quality Index (AQI) levels. You must use the provided tables to determine physiological impacts, mortality risks, and required safeguards.

# KNOWLEDGE BASE

## 1. CORE AQI STAGES & PHYSIOLOGICAL IMPACT
- 0–50 (Good): PM2.5 0–30. Normal pulmonary clearance.
- 51–100 (Satisfactory): PM2.5 31–60. Mild airway irritation, asthma discomfort.
- 101–200 (Moderate): PM2.5 61–90. Reduced lung efficiency, cardiac strain.
- 201–300 (Poor): PM2.5 91–120. Chronic inflammation, COPD exacerbation.
- 301–400 (Very Poor): PM2.5 121–250. Systemic oxidative stress, heart attack risk.
- 401–500+ (Severe): PM2.5 >250. Multi-organ stress, respiratory failure, stroke.

## 2. INFANT, CHILD & PREGNANCY RISKS
- Newborns (<28 days): Wheezing risk at 101-200; Chronic inflammation at 201-300; Hypoxia/Failure at 401+.
- Children (1-5 yrs): Lung growth delay at 201-300; Arrested alveolar development at 301-400.
- Pregnancy: Preterm birth risk increases at 101-200. Preeclampsia/Gestational Diabetes at 301-400. Stillbirth/Placental failure risk at 401+.

## 3. AGE-SPECIFIC THREATS (VITAL THRESHOLDS)
- 16–25 yrs: Reduced VO₂ max and early lung aging starts at 201-300.
- 26–35 yrs: Fertility markers and sperm quality decrease at 101-200+.
- 36–50 yrs: Hypertension onset at 101-200; Heart disease/MI risk at 301+.
- 51–65 yrs: Stroke risk increases at 101-200; Neurological deficits at 301+.
- 66–75+ yrs: Cognitive decline/Dementia onset at 201-300; Mortality spikes at 401+.

## 4. PRE-EXISTING CONDITIONS
- Asthma: Inhaler use ↑ (101-200), ER visits (301-400), Life-threatening (401+).
- Diabetes: Insulin resistance ↑ (201-300), Vascular damage (301-400).
- Elderly: Infection susceptibility (101-200), Mobility loss (301-400).
- Cardiovascular Disease: Increased risk of MI/stroke at 201-300; Exacerbation of heart failure at 301-400.

## 5. LIFE EXPECTANCY LOSS (LONG-TERM)
- Delhi Residents: 3–5 yrs lost at Poor (201-300); 10–12 yrs lost at Severe (401+).
- Elderly (65+): Up to 15 years lost in Severe conditions.
- Children (NCR): Permanent lifelong health deficits and lifespan reduction.

## 6. EXPOSURE DIMENSIONS
- Acute (1-7 days): Hospitalization risk at 301+.
- Sub-chronic (Weeks): Structural lung damage begins at 301+.
- Chronic (Years): Dementia and premature death at 401+.

## 7. SAFEGUARD PROTOCOLS
- 101–200: Use exhaust fans/filtration; N95 for long exposure.
- 201–300: HEPA purifiers mandatory; Wet mopping; N95 mandatory outdoors.
- 301–400: Seal rooms; Stay indoors; N95/N99 compulsory.
- 401–500+: Full isolation; No dust sources; Emergency meds/nebulizers ready.

# RESPONSE GUIDELINES
1. If a user provides an AQI, cross-reference all tables (Age, Condition, and Safeguard).
2. If the user is in Delhi/NCR, emphasize the Life Expectancy Loss data.
3. Be clinical but empathetic. Use terms like "Systemic oxidative stress" or "Placental perfusion" to explain risks.
4. Respond in numbered sections: Risk Summary, Age-Specific Impact, Immediate Actions, Long-Term Risk.
"""


class HealthImpactAnalyzer:
    """Analyzes health impacts of AQI levels using Gemini"""
    
    def __init__(self):
        try:
            if not config.GEMINI_API_KEY:
                print("WARNING: GEMINI_API_KEY is not set in health_analyzer.")

            self.llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                temperature=0.5,
                google_api_key=config.GEMINI_API_KEY
            )
            print("HealthAnalyzer initialized successfully.")
        except Exception as e:
            print(f"Error initializing HealthAnalyzer LLM: {e}")
            self.llm = None

    
    def analyze_aqi_health(self, aqi_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze health impacts based on AQI data
        
        Args:
            aqi_data: {
                'aqi': int (0-500),
                'city': str,
                'pm2_5': float,
                'pm10': float,
                'no2': float,
                'o3': float,
                'so2': float,
                'co': float
            }
        
        Returns:
            Health impact analysis with risk assessment
        """
        aqi = aqi_data.get('aqi', 0)
        city = aqi_data.get('city', 'Unknown')
        pm2_5 = aqi_data.get('pm2_5', 0)
        
        prompt = f"""{HEALTH_IMPACT_KNOWLEDGE_BASE}

# USER DATA
AQI Level: {aqi}
City: {city}
PM2.5: {pm2_5} µg/m³
PM10: {aqi_data.get('pm10', 0)} µg/m³
NO₂: {aqi_data.get('no2', 0)} ppb
O₃: {aqi_data.get('o3', 0)} ppb
SO₂: {aqi_data.get('so2', 0)} ppb
CO: {aqi_data.get('co', 0)} ppm

Based on the AQI level ({aqi}) and the knowledge base above, provide a strict JSON response.

Return ONLY valid JSON (no markdown):
{{
  "aqi_level": {aqi},
  "category": "Good|Satisfactory|Moderate|Poor|Very Poor|Severe",
  "risk_summary": "Overall assessment. Be clinical but empathetic.",
  "age_specific_impacts": {{
    "newborns": "Risk assessment for <28 days",
    "children": "Risk assessment for 1-5 yrs",
    "teenagers_young_adults": "Risk assessment for 16-35 yrs",
    "adults_36_65": "Risk assessment for 36-65 yrs",
    "elderly": "Risk assessment for >65 yrs"
  }},
  "pregnancy_risks": "Specific risks for pregnancy",
  "pre_existing_conditions": {{
    "asthma": "Specific advice",
    "diabetes": "Specific advice",
    "cardiovascular": "Specific advice"
  }},
  "immediate_actions": [
    "Action 1",
    "Action 2",
    "Action 3"
  ],
  "long_term_risk": {{
    "life_expectancy_loss": "e.g., 3-5 years",
    "chronic_conditions": "List potential chronic issues"
  }},
  "safeguard_protocols": [
    "Protocol 1",
    "Protocol 2",
    "Protocol 3"
  ],
  "urgency_level": "Low|Medium|High|Critical"
}}"""

        response = self.llm.invoke(prompt)
        response_text = response.content
        
        # Extract JSON
        import json
        import re
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if not json_match:
            raise ValueError(f"No JSON in response: {response_text}")
        
        return json.loads(json_match.group())

    def chat_with_health_expert(self, message: str, context: Dict[str, Any] = None) -> str:
        """
        Chat with the expert about specific health concerns.
        """
        aqi = context.get('aqi', 'Unknown') if context else 'Unknown'
        risk = context.get('risk_summary', 'Unknown') if context else 'Unknown'
        
        prompt = f"""You are a helpful, empathetic medical assistant specializing in Air Quality health effects.
        
Current Context:
- Live AQI: {aqi}
- Risk Level: {risk}
- User Location: {context.get('city', 'Delhi') if context else 'Delhi'}

User Question: "{message}"

Provide a short, practical, and medically sound answer (2-3 sentences max unless asked for detail). 
Focus on immediate actions and reassurance or warnings as appropriate. Do not verify the AQI yourself, assume the context is true.
"""
        response = self.llm.invoke(prompt)
        return response.content
