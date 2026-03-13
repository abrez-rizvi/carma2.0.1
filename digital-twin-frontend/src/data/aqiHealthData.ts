// AQI Health Impact Data
// Contains health information for each AQI category

export interface VulnerableGroup {
  group: string;
  effects: string[];
}

export interface AQICategory {
  id: string;
  name: string;
  range: string;
  pm25Range: string;
  color: string;
  bgColor: string;
  borderColor: string;
  physiologicalImpact: string;
  vulnerableGroups: VulnerableGroup[];
  safeguards: string[];
  lifeExpectancyImpact?: string;
}

export const aqiCategories: AQICategory[] = [
  {
    id: "good",
    name: "Good",
    range: "0-50",
    pm25Range: "0-30 µg/m³",
    color: "#22c55e",
    bgColor: "from-green-500/20 to-green-600/10",
    borderColor: "border-green-500/50",
    physiologicalImpact: "Normal pulmonary clearance occurs, allowing for healthy lung development and normal immune responses.",
    vulnerableGroups: [
      {
        group: "Newborns & Children",
        effects: ["Supports normal breathing and growth"]
      },
      {
        group: "Pregnant Women",
        effects: ["Cardiovascular function remains normal", "Healthy placental oxygen flow"]
      },
      {
        group: "Elderly",
        effects: ["Allows for functional independence", "Stable longevity"]
      }
    ],
    safeguards: ["No restrictions", "Natural ventilation encouraged", "Normal outdoor activities recommended"]
  },
  {
    id: "satisfactory",
    name: "Satisfactory",
    range: "51-100",
    pm25Range: "31-60 µg/m³",
    color: "#eab308",
    bgColor: "from-yellow-500/20 to-yellow-600/10",
    borderColor: "border-yellow-500/50",
    physiologicalImpact: "Mild airway irritation is the dominant effect, introducing mild risks for highly sensitive individuals.",
    vulnerableGroups: [
      {
        group: "Infants",
        effects: ["May experience occasional coughs", "Possible nasal congestion"]
      },
      {
        group: "Pregnant Women",
        effects: ["Mild oxidative stress occurs", "Slight reduction in oxygen transfer to fetus"]
      },
      {
        group: "Pre-existing Conditions",
        effects: ["Individuals with asthma may notice mild wheezing"]
      }
    ],
    safeguards: ["Outdoor activity can generally continue", "Sensitive groups should consider mild reductions", "Close windows during peak traffic hours"]
  },
  {
    id: "moderate",
    name: "Moderate",
    range: "101-200",
    pm25Range: "61-90 µg/m³",
    color: "#f97316",
    bgColor: "from-orange-500/20 to-orange-600/10",
    borderColor: "border-orange-500/50",
    physiologicalImpact: "Lung efficiency drops, leading to cardiac strain and the onset of inflammation markers. Body begins to show signs of reduced efficiency.",
    vulnerableGroups: [
      {
        group: "Children",
        effects: ["Early asthma symptoms appear", "Risk of reduced oxygen efficiency"]
      },
      {
        group: "Pregnant Women",
        effects: ["Inflammatory response triggered", "Reduced placental perfusion (blood flow)", "Risk of preterm birth"]
      },
      {
        group: "Elderly",
        effects: ["Reduced balance", "Mild memory issues may manifest"]
      }
    ],
    safeguards: ["Sensitive groups should reduce prolonged exertion", "Basic filtration recommended indoors", "Use exhaust fans"]
  },
  {
    id: "poor",
    name: "Poor",
    range: "201-300",
    pm25Range: "91-120 µg/m³",
    color: "#ef4444",
    bgColor: "from-red-500/20 to-red-600/10",
    borderColor: "border-red-500/50",
    physiologicalImpact: "Chronic inflammation sets in, significantly impacting those with COPD and increasing the risk of reduced VO2 max (oxygen use efficiency).",
    vulnerableGroups: [
      {
        group: "Children",
        effects: ["Risk of growth stunting", "Lung growth delays", "Frequent respiratory infections"]
      },
      {
        group: "Pregnant Women",
        effects: ["Impaired nutrient and oxygen delivery to fetus", "Risk of Low Birth Weight (LBW)", "Risk of Intrauterine Growth Restriction (IUGR)"]
      },
      {
        group: "General Population",
        effects: ["Chronic inflammation onset", "COPD patients significantly impacted"]
      }
    ],
    safeguards: ["Avoid outdoor exercise", "HEPA air purifiers required indoors", "Wet mopping recommended", "N95 masks mandatory outdoors"],
    lifeExpectancyImpact: "Residents in regions with this average AQI may lose 3–5 years of life expectancy"
  },
  {
    id: "very-poor",
    name: "Very Poor",
    range: "301-400",
    pm25Range: "121-250 µg/m³",
    color: "#a855f7",
    bgColor: "from-purple-500/20 to-purple-600/10",
    borderColor: "border-purple-500/50",
    physiologicalImpact: "Systemic oxidative stress occurs, elevating the risk of heart attacks and atherosclerosis. Damage extends beyond the respiratory system.",
    vulnerableGroups: [
      {
        group: "Children",
        effects: ["High risk of permanent lung damage", "Asthma becomes high risk"]
      },
      {
        group: "Pregnant Women",
        effects: ["Endothelial dysfunction may lead to preeclampsia", "Risk of gestational diabetes", "Placental hypoxia"]
      },
      {
        group: "Elderly",
        effects: ["Accelerated cognitive decline", "Early dementia onset observed"]
      }
    ],
    safeguards: ["Stay indoors as much as possible", "Seal rooms from outside air", "Use continuous air purification", "N95/N99 masks compulsory if leaving"]
  },
  {
    id: "severe",
    name: "Severe & Severe Plus",
    range: "401-500+",
    pm25Range: ">250 µg/m³",
    color: "#991b1b",
    bgColor: "from-rose-900/30 to-rose-950/20",
    borderColor: "border-rose-800/50",
    physiologicalImpact: "Multi-organ stress occurs, creating high risks for respiratory failure, stroke, and sepsis. This is the most dangerous category with immediate and critical health threats.",
    vulnerableGroups: [
      {
        group: "Infants & Children",
        effects: ["High risk of fatal infections", "Severe lung inflammation", "Irreversible deficits in lung capacity"]
      },
      {
        group: "Pregnant Women",
        effects: ["Risk of placental failure", "Risk of stillbirth", "Extreme prematurity risk"]
      },
      {
        group: "Pre-existing Conditions",
        effects: ["Life-threatening asthma attacks", "Heart failure risk", "Stroke risk"]
      }
    ],
    safeguards: ["Complete indoor isolation", "No outdoor activity whatsoever", "Emergency medications (nebulizers) should be kept ready", "Seek medical attention for any respiratory symptoms"],
    lifeExpectancyImpact: "Chronic exposure can reduce life expectancy by 10–12 years for general residents and up to 15 years for the elderly"
  }
];
