"""
Real-World Environmental Policy Definitions
Policies that can be simulated to see their impact on emissions

Policy Simulation Calculation Engine
Reduced-Form Model: ΔE = D × Σ Bᵢ × (αᵢ/100)
Where:
  - D = Calibration constant (0.5)
  - Bᵢ = Sector weight (derived from dataset averages)
  - αᵢ = Policy reduction percentage for sector i
"""

# ============================================================================
# SECTOR WEIGHTS (Derived from dataset averages)
# These represent the normalized influence of each sector on total emissions
# ============================================================================
SECTOR_WEIGHTS = {
    'Aviation':          0.075821,
    'Ground_Transport':  0.141200,
    'Industry':          0.334083,
    'Power':             0.282731,
    'Residential':       0.166165
}

# Calibration constant for the reduced-form model
CALIBRATION_D = 0.5

# ============================================================================
# POLICY DEFINITIONS
# Each policy specifies reduction percentages (αᵢ) for affected sectors
# ============================================================================
POLICIES = [
    {
        "id": "odd-even",
        "name": "Odd-Even Scheme",
        "icon": "🚗",
        "description": "Private vehicles restricted based on license plate (odd/even) on alternate days",
        "category": "Transport",
        "sector_reductions": {
            # αᵢ values in percentage
            "Aviation": 0,
            "Ground_Transport": 18,  # 18% reduction
            "Industry": 0,
            "Power": 0,
            "Residential": 0
        },
        "details": {
            "implementation_cost": "Low",
            "public_acceptance": "Mixed",
            "duration": "Temporary (during high pollution)",
            "last_implemented": "Nov 2024"
        },
        "economic_data": {
            "implementation_cost_cr": 50,   # Crores INR
            "annual_savings_cr": 320,       # Health + Fuel savings
            "gdp_impact_percent": -0.1,     # Slight negative (transport disruption)
            "jobs_affected": 15000,         # Temporary gig workers impact
            "roi_years": 0.5,               # Return on investment
            "health_benefits_cr": 280,      # Healthcare cost reduction
            "carbon_credit_value_cr": 45,   # Carbon market value
            "productivity_loss_cr": 120,    # Lost work hours
            "enforcement_cost_cr": 25       # Police, signage, apps
        }
    },
    {
        "id": "beijing-emergency",
        "name": "Beijing Emergency Response",
        "icon": "🏭",
        "description": "Aggressive industrial shutdown + 50% vehicles off road during pollution emergency",
        "category": "Emergency",
        "sector_reductions": {
            "Aviation": 10,
            "Ground_Transport": 50,
            "Industry": 50,
            "Power": 20,
            "Residential": 10
        },
        "details": {
            "implementation_cost": "High",
            "public_acceptance": "Low (economic impact)",
            "duration": "Emergency only (3-7 days)",
            "last_implemented": "Reference: Beijing 2015-2020"
        },
        "economic_data": {
            "implementation_cost_cr": 500,
            "annual_savings_cr": 180,
            "gdp_impact_percent": -2.5,
            "jobs_affected": 250000,
            "roi_years": 3.0,
            "health_benefits_cr": 450,
            "carbon_credit_value_cr": 120,
            "productivity_loss_cr": 800,
            "enforcement_cost_cr": 150
        }
    },
    {
        "id": "grap-stage-3",
        "name": "GRAP Stage III (Severe)",
        "icon": "⚠️",
        "description": "Graded Response: Odd-even, halt construction, stop diesel generators",
        "category": "Emergency",
        "sector_reductions": {
            "Aviation": 0,
            "Ground_Transport": 25,
            "Industry": 30,
            "Power": 15,
            "Residential": 10
        },
        "details": {
            "implementation_cost": "Medium",
            "public_acceptance": "Moderate",
            "duration": "Until AQI improves",
            "last_implemented": "Nov 2024"
        },
        "economic_data": {
            "implementation_cost_cr": 200,
            "annual_savings_cr": 380,
            "gdp_impact_percent": -0.8,
            "jobs_affected": 85000,
            "roi_years": 1.2,
            "health_benefits_cr": 420,
            "carbon_credit_value_cr": 85,
            "productivity_loss_cr": 320,
            "enforcement_cost_cr": 80
        }
    },
    {
        "id": "construction-ban",
        "name": "Construction Ban",
        "icon": "🏗️",
        "description": "No construction activities during Nov-Feb (peak smog season)",
        "category": "Industry",
        "sector_reductions": {
            "Aviation": 0,
            "Ground_Transport": 0,
            "Industry": 12,
            "Power": 0,
            "Residential": 0
        },
        "details": {
            "implementation_cost": "Medium",
            "public_acceptance": "Low (job losses)",
            "duration": "Seasonal (4 months)",
            "last_implemented": "Nov 2023"
        },
        "economic_data": {
            "implementation_cost_cr": 80,
            "annual_savings_cr": 150,
            "gdp_impact_percent": -0.4,
            "jobs_affected": 45000,
            "roi_years": 1.5,
            "health_benefits_cr": 180,
            "carbon_credit_value_cr": 35,
            "productivity_loss_cr": 90,
            "enforcement_cost_cr": 40
        }
    },
    {
        "id": "industrial-closure",
        "name": "Winter Industrial Closure",
        "icon": "🧱",
        "description": "Brick kilns and polluting industries shut during Dec-Jan",
        "category": "Industry",
        "sector_reductions": {
            "Aviation": 0,
            "Ground_Transport": 0,
            "Industry": 20,
            "Power": 0,
            "Residential": 0
        },
        "details": {
            "implementation_cost": "High",
            "public_acceptance": "Low",
            "duration": "Seasonal (2 months)",
            "last_implemented": "Dec 2023"
        },
        "economic_data": {
            "implementation_cost_cr": 350,
            "annual_savings_cr": 220,
            "gdp_impact_percent": -1.2,
            "jobs_affected": 120000,
            "roi_years": 2.0,
            "health_benefits_cr": 350,
            "carbon_credit_value_cr": 75,
            "productivity_loss_cr": 450,
            "enforcement_cost_cr": 65
        }
    },
    {
        "id": "stubble-ban",
        "name": "Stubble Burning Ban",
        "icon": "🌾",
        "description": "Strict enforcement on crop residue burning in Punjab/Haryana",
        "category": "Agricultural",
        "sector_reductions": {
            "Aviation": 0,
            "Ground_Transport": 0,
            "Industry": 0,
            "Power": 0,
            "Residential": 25
        },
        "details": {
            "implementation_cost": "Medium",
            "public_acceptance": "Variable (farmer resistance)",
            "duration": "Seasonal (Oct-Nov)",
            "last_implemented": "Ongoing since 2020"
        },
        "economic_data": {
            "implementation_cost_cr": 250,
            "annual_savings_cr": 480,
            "gdp_impact_percent": 0.2,
            "jobs_affected": 5000,
            "roi_years": 0.8,
            "health_benefits_cr": 520,
            "carbon_credit_value_cr": 95,
            "productivity_loss_cr": 30,
            "enforcement_cost_cr": 120
        }
    },
    {
        "id": "ev-push",
        "name": "EV Fleet Mandate",
        "icon": "⚡",
        "description": "30% of public transport converted to electric vehicles",
        "category": "Transport",
        "sector_reductions": {
            "Aviation": 0,
            "Ground_Transport": 12,
            "Industry": 0,
            "Power": -3,  # Negative = increase (more power demand)
            "Residential": 0
        },
        "details": {
            "implementation_cost": "Very High",
            "public_acceptance": "High",
            "duration": "Permanent",
            "last_implemented": "Ongoing since 2022"
        },
        "economic_data": {
            "implementation_cost_cr": 2500,
            "annual_savings_cr": 850,
            "gdp_impact_percent": 0.5,
            "jobs_affected": -25000,
            "roi_years": 4.0,
            "health_benefits_cr": 380,
            "carbon_credit_value_cr": 180,
            "productivity_loss_cr": 0,
            "enforcement_cost_cr": 50
        }
    },
    {
        "id": "clean-fuel",
        "name": "Clean Fuel Mandate",
        "icon": "🔥",
        "description": "LPG/PNG mandatory for industries, coal usage banned",
        "category": "Industry",
        "sector_reductions": {
            "Aviation": 0,
            "Ground_Transport": 0,
            "Industry": 25,
            "Power": 15,
            "Residential": 10
        },
        "details": {
            "implementation_cost": "High",
            "public_acceptance": "Moderate",
            "duration": "Permanent",
            "last_implemented": "Phased rollout 2021-2024"
        },
        "economic_data": {
            "implementation_cost_cr": 1800,
            "annual_savings_cr": 720,
            "gdp_impact_percent": 0.3,
            "jobs_affected": -15000,
            "roi_years": 3.5,
            "health_benefits_cr": 580,
            "carbon_credit_value_cr": 150,
            "productivity_loss_cr": 80,
            "enforcement_cost_cr": 90
        }
    }
]


def get_all_policies():
    """Return all available policies with computed sector impacts for backward compatibility"""
    policies_with_impacts = []
    for policy in POLICIES:
        p = policy.copy()
        # Convert sector_reductions (%) to sector_impacts (decimal) for backward compatibility
        p["sector_impacts"] = {
            sector: -reduction/100 if reduction > 0 else -reduction/100
            for sector, reduction in policy["sector_reductions"].items()
        }
        policies_with_impacts.append(p)
    return policies_with_impacts


def get_policy_by_id(policy_id: str):
    """Get a specific policy by ID"""
    for policy in POLICIES:
        if policy["id"] == policy_id:
            p = policy.copy()
            # Add sector_impacts for backward compatibility
            p["sector_impacts"] = {
                sector: -reduction/100 if reduction > 0 else -reduction/100
                for sector, reduction in policy["sector_reductions"].items()
            }
            return p
    return None


def calculate_delta_e(policy_ids: list) -> dict:
    """
    Calculate ΔE using the reduced-form model: ΔE = D × Σ Bᵢ × (αᵢ/100)
    
    Returns:
        Dictionary with:
        - delta_e: The proportional change (e.g., 0.105 = 10.5% reduction)
        - sector_contributions: Per-sector breakdown
        - combined_reductions: Combined αᵢ per sector (after stacking policies)
        - formula_breakdown: Detailed calculation steps
    """
    sectors = ["Aviation", "Ground_Transport", "Industry", "Power", "Residential"]
    
    # Step 1: Combine reduction percentages from all selected policies
    # Using additive combination with cap at 95%
    combined_reductions = {sector: 0.0 for sector in sectors}
    
    for pid in policy_ids:
        policy = None
        for p in POLICIES:
            if p["id"] == pid:
                policy = p
                break
        
        if policy:
            for sector in sectors:
                reduction = policy["sector_reductions"].get(sector, 0)
                # Additive stacking with diminishing returns
                current = combined_reductions[sector]
                if reduction > 0:
                    # For reductions: stack but cap
                    combined_reductions[sector] = min(95, current + reduction * (1 - current/100))
                else:
                    # For increases (negative values like EV power demand)
                    combined_reductions[sector] = max(-50, current + reduction)
    
    # Step 2: Calculate sector contributions: Bᵢ × (αᵢ/100)
    sector_contributions = {}
    for sector in sectors:
        B_i = SECTOR_WEIGHTS[sector]
        alpha_i = combined_reductions[sector]
        sector_contributions[sector] = B_i * (alpha_i / 100)
    
    # Step 3: Sum contributions and apply calibration constant
    total_contribution = sum(sector_contributions.values())
    delta_e = CALIBRATION_D * total_contribution
    
    return {
        "delta_e": round(delta_e, 6),
        "delta_e_pct": round(delta_e * 100, 2),
        "sector_weights": SECTOR_WEIGHTS,
        "combined_reductions": {k: round(v, 2) for k, v in combined_reductions.items()},
        "sector_contributions": {k: round(v, 6) for k, v in sector_contributions.items()},
        "total_contribution": round(total_contribution, 6),
        "calibration_d": CALIBRATION_D,
        "formula": f"ΔE = {CALIBRATION_D} × {round(total_contribution, 4)} = {round(delta_e, 4)}"
    }


def calculate_combined_impact(policy_ids: list) -> dict:
    """
    Calculate the combined sector impacts when multiple policies are applied.
    Returns sector impacts as decimals (e.g., -0.18 = 18% reduction)
    
    This method uses the reduced-form model internally.
    """
    result = calculate_delta_e(policy_ids)
    
    # Convert combined_reductions to sector_impacts format (decimal)
    sector_impacts = {
        sector: -reduction/100
        for sector, reduction in result["combined_reductions"].items()
    }
    
    return sector_impacts


def get_model_metadata():
    """Return metadata about the reduced-form model for display in UI"""
    return {
        "model_name": "Reduced-Form Policy Response Model",
        "formula": "ΔE = D × Σ Bᵢ × (αᵢ/100)",
        "calibration_d": CALIBRATION_D,
        "sector_weights": SECTOR_WEIGHTS,
        "description": (
            "This result represents a policy response proxy, not a causal prediction. "
            "Under the specified linear response model, the combined sector-weighted "
            "policy interventions yield an aggregate proportional change relative to "
            "the business-as-usual (BAU) baseline."
        ),
        "interpretation": (
            "The result should be interpreted as a scenario comparison tool rather than "
            "an empirical forecast of actual emission or AQI changes."
        )
    }
