"""
BIS IS 10500:2012 Drinking Water Specification Rule-Based Screening Engine.

Provides dual-tier parameter evaluation:
1. Acceptable Limit (Optimal desirable drinking water quality)
2. Permissible Limit in the absence of alternate source (Maximum allowable threshold; No relaxation for toxic/heavy metals)

Parameters without official BIS limits (e.g., Electrical Conductivity, Total Organic Carbon)
are documented without arbitrary limits.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel

# Official BIS IS 10500:2012 Specification Dictionary
BIS_IS_10500_RULES = {
    # 1. Physical & General Chemical (Field / Basic Lab)
    "ph": {
        "name": "pH",
        "unit": "pH units",
        "acceptable_min": 6.5,
        "acceptable_max": 8.5,
        "permissible_min": 6.5,
        "permissible_max": 8.5,
        "relaxation_allowed": False,
        "category": "Physical",
        "note": "BIS IS 10500 specifies 6.5 - 8.5 with no relaxation."
    },
    "hardness": {
        "name": "Total Hardness (as CaCO3)",
        "unit": "mg/L",
        "acceptable_min": None,
        "acceptable_max": 200.0,
        "permissible_min": None,
        "permissible_max": 600.0,
        "relaxation_allowed": True,
        "category": "General Chemical",
        "note": "Acceptable: 200 mg/L, Permissible: 600 mg/L in absence of alternate source."
    },
    "solids": {
        "name": "Total Dissolved Solids (TDS)",
        "unit": "mg/L (ppm)",
        "acceptable_min": None,
        "acceptable_max": 500.0,
        "permissible_min": None,
        "permissible_max": 2000.0,
        "relaxation_allowed": True,
        "category": "Physical",
        "note": "Acceptable: 500 mg/L, Permissible: 2000 mg/L in absence of alternate source."
    },
    "turbidity": {
        "name": "Turbidity",
        "unit": "NTU",
        "acceptable_min": None,
        "acceptable_max": 1.0,
        "permissible_min": None,
        "permissible_max": 5.0,
        "relaxation_allowed": True,
        "category": "Physical",
        "note": "Acceptable: 1.0 NTU, Permissible: 5.0 NTU in absence of alternate source."
    },
    "sulfate": {
        "name": "Sulphate (as SO4)",
        "unit": "mg/L",
        "acceptable_min": None,
        "acceptable_max": 200.0,
        "permissible_min": None,
        "permissible_max": 400.0,
        "relaxation_allowed": True,
        "category": "General Chemical",
        "note": "Acceptable: 200 mg/L, Permissible: 400 mg/L in absence of alternate source."
    },
    "chloramines": {
        "name": "Chloramines (Disinfectant residual)",
        "unit": "mg/L (ppm)",
        "acceptable_min": None,
        "acceptable_max": 4.0,
        "permissible_min": None,
        "permissible_max": 4.0,
        "relaxation_allowed": False,
        "category": "Disinfectant Residual",
        "note": "Maximum cap: 4.0 mg/L with no relaxation allowed beyond this limit."
    },
    "trihalomethanes": {
        "name": "Total Trihalomethanes (THMs)",
        "unit": "ug/L (ppb)",
        "acceptable_min": None,
        "acceptable_max": 100.0, # Sum cap / WHO/BIS benchmark for chloroform (0.2mg/L = 200ug/L) and individual THMs
        "permissible_min": None,
        "permissible_max": 100.0,
        "relaxation_allowed": False,
        "category": "Disinfection By-Product",
        "note": "Disinfection byproduct limit (100 ug/L aggregate). No relaxation allowed."
    },

    # Informational Parameters (No BIS IS 10500 standalone drinking limit)
    "conductivity": {
        "name": "Electrical Conductivity (EC)",
        "unit": "uS/cm",
        "acceptable_min": None,
        "acceptable_max": None,
        "permissible_min": None,
        "permissible_max": None,
        "relaxation_allowed": False,
        "category": "Physical (Informational)",
        "note": "BIS IS 10500 does not specify a numerical limit for EC; TDS is the standard mineral metric."
    },
    "organic_carbon": {
        "name": "Total Organic Carbon (TOC)",
        "unit": "mg/L (ppm)",
        "acceptable_min": None,
        "acceptable_max": None,
        "permissible_min": None,
        "permissible_max": None,
        "relaxation_allowed": False,
        "category": "Organic (Informational)",
        "note": "BIS IS 10500 does not establish a standalone limit for TOC; typically monitored for DBP precursor potential."
    },

    # 2. Advanced Laboratory Contaminants (Microbiological & Toxic Metals)
    "e_coli": {
        "name": "E. coli / Thermotolerant Coliforms",
        "unit": "MPN/100 mL",
        "acceptable_min": None,
        "acceptable_max": 0.0,
        "permissible_min": None,
        "permissible_max": 0.0,
        "relaxation_allowed": False,
        "category": "Microbiological",
        "note": "Must not be detectable in any 100 mL sample. Critical health parameter. No relaxation."
    },
    "total_coliform": {
        "name": "Total Coliform Bacteria",
        "unit": "MPN/100 mL",
        "acceptable_min": None,
        "acceptable_max": 0.0,
        "permissible_min": None,
        "permissible_max": 0.0,
        "relaxation_allowed": False,
        "category": "Microbiological",
        "note": "Must not be detectable in any 100 mL sample. No relaxation."
    },
    "arsenic": {
        "name": "Arsenic (as As)",
        "unit": "mg/L",
        "acceptable_min": None,
        "acceptable_max": 0.01,
        "permissible_min": None,
        "permissible_max": 0.05,
        "relaxation_allowed": True,
        "category": "Toxic Heavy Metal",
        "note": "Acceptable: 0.01 mg/L, Permissible: 0.05 mg/L in absence of alternate source."
    },
    "lead": {
        "name": "Lead (as Pb)",
        "unit": "mg/L",
        "acceptable_min": None,
        "acceptable_max": 0.01,
        "permissible_min": None,
        "permissible_max": 0.01,
        "relaxation_allowed": False,
        "category": "Toxic Heavy Metal",
        "note": "Acceptable: 0.01 mg/L with No Relaxation allowed. Neurotoxin."
    },
    "fluoride": {
        "name": "Fluoride (as F)",
        "unit": "mg/L",
        "acceptable_min": None,
        "acceptable_max": 1.0,
        "permissible_min": None,
        "permissible_max": 1.5,
        "relaxation_allowed": True,
        "category": "Toxic Substance",
        "note": "Acceptable: 1.0 mg/L, Permissible: 1.5 mg/L. Excess causes dental/skeletal fluorosis."
    },
    "nitrate": {
        "name": "Nitrate (as NO3)",
        "unit": "mg/L",
        "acceptable_min": None,
        "acceptable_max": 45.0,
        "permissible_min": None,
        "permissible_max": 45.0,
        "relaxation_allowed": False,
        "category": "Toxic Substance",
        "note": "Acceptable: 45.0 mg/L with No Relaxation allowed. Risk of methemoglobinemia."
    },
    "iron": {
        "name": "Iron (as Fe)",
        "unit": "mg/L",
        "acceptable_min": None,
        "acceptable_max": 0.3, # updated in IS 10500 amendments to 0.3 / 1.0 depending on source
        "permissible_min": None,
        "permissible_max": 1.0,
        "relaxation_allowed": True,
        "category": "Mineral/Metallic",
        "note": "Acceptable: 0.3 mg/L, Permissible: 1.0 mg/L in absence of alternate source."
    },
    "chloride": {
        "name": "Chloride (as Cl)",
        "unit": "mg/L",
        "acceptable_min": None,
        "acceptable_max": 250.0,
        "permissible_min": None,
        "permissible_max": 1000.0,
        "relaxation_allowed": True,
        "category": "General Chemical",
        "note": "Acceptable: 250 mg/L, Permissible: 1000 mg/L in absence of alternate source."
    }
}

# The 3 Standard Scientific Assessment Outcomes
OUTCOME_ACCEPTABLE = "WITHIN TESTED PARAMETERS' ACCEPTABLE LIMITS"
OUTCOME_PERMISSIBLE = "WITHIN PERMISSIBLE LIMITS (NO ALTERNATE SOURCE)"
OUTCOME_EXCEEDS = "PARAMETER EXCEEDS REFERENCE LIMIT"
OUTCOME_INSUFFICIENT = "INSUFFICIENT INFORMATION"

def evaluate_bis_is_10500(sample_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates water sample against official BIS IS 10500:2012 standards.
    Categorizes results parameter-by-parameter and determines overall assessment outcome.
    """
    parameter_results = []
    has_exceedance = False
    has_permissible_only = False
    exceeded_params = []
    permissible_params = []
    tested_count = 0

    # Essential drinking parameters needed for basic physical/chemical screening
    core_physical_params = ["ph", "solids", "turbidity"]
    tested_core_params = 0

    for key, spec in BIS_IS_10500_RULES.items():
        val = sample_data.get(key)
        # Handle null, empty string, or undefined
        if val is None or val == "":
            parameter_results.append({
                "key": key,
                "name": spec["name"],
                "measured_value": None,
                "unit": spec["unit"],
                "acceptable_limit": f"{spec['acceptable_min']} - {spec['acceptable_max']}" if spec["acceptable_min"] else (f"<= {spec['acceptable_max']}" if spec["acceptable_max"] is not None else "No official BIS limit"),
                "permissible_limit": f"{spec['permissible_min']} - {spec['permissible_max']}" if spec["permissible_min"] else (f"<= {spec['permissible_max']}" if spec["permissible_max"] is not None else ("No relaxation" if not spec["relaxation_allowed"] and spec["acceptable_max"] is not None else "N/A")),
                "status": "NOT TESTED",
                "status_code": "NOT_TESTED",
                "category": spec["category"],
                "note": spec["note"],
                "explanation": "Parameter was not provided or tested in this sample batch."
            })
            continue

        try:
            val_float = float(val)
        except (ValueError, TypeError):
            continue

        tested_count += 1
        if key in core_physical_params:
            tested_core_params += 1

        # Check if parameter has no BIS limit (e.g. EC, TOC)
        if spec["acceptable_max"] is None and spec["acceptable_min"] is None:
            parameter_results.append({
                "key": key,
                "name": spec["name"],
                "measured_value": val_float,
                "unit": spec["unit"],
                "acceptable_limit": "No official BIS limit",
                "permissible_limit": "N/A",
                "status": "INFORMATIONAL",
                "status_code": "INFO",
                "category": spec["category"],
                "note": spec["note"],
                "explanation": "Informational measurement. BIS IS 10500 specifies no standalone numerical limit."
            })
            continue

        status_text = "ACCEPTABLE"
        status_code = "ACCEPTABLE"
        explanation = "Measurement satisfies BIS IS 10500 Acceptable Limit."

        acc_min = spec["acceptable_min"]
        acc_max = spec["acceptable_max"]
        perm_min = spec["permissible_min"]
        perm_max = spec["permissible_max"]

        # Check for lower bound violation
        below_acc_min = (acc_min is not None and val_float < acc_min)
        below_perm_min = (perm_min is not None and val_float < perm_min)

        # Check for upper bound violation
        above_acc_max = (acc_max is not None and val_float > acc_max)
        above_perm_max = (perm_max is not None and val_float > perm_max)

        if below_perm_min or above_perm_max:
            has_exceedance = True
            status_text = "EXCEEDS PERMISSIBLE LIMIT"
            status_code = "EXCEEDS"
            exceeded_params.append(spec["name"])
            if above_perm_max:
                explanation = f"Value ({val_float} {spec['unit']}) breaches maximum permissible limit of {perm_max} {spec['unit']}."
            else:
                explanation = f"Value ({val_float} {spec['unit']}) falls below minimum permissible limit of {perm_min} {spec['unit']}."
        elif below_acc_min or above_acc_max:
            if spec["relaxation_allowed"]:
                has_permissible_only = True
                status_text = "WITHIN PERMISSIBLE LIMIT"
                status_code = "PERMISSIBLE"
                permissible_params.append(spec["name"])
                explanation = f"Value ({val_float} {spec['unit']}) exceeds acceptable limit ({acc_max} {spec['unit']}) but is within permissible limit ({perm_max} {spec['unit']}) in absence of alternate source."
            else:
                has_exceedance = True
                status_text = "EXCEEDS LIMIT (NO RELAXATION)"
                status_code = "EXCEEDS"
                exceeded_params.append(spec["name"])
                explanation = f"Value ({val_float} {spec['unit']}) breaches limit. BIS IS 10500 allows NO RELAXATION for this parameter."

        parameter_results.append({
            "key": key,
            "name": spec["name"],
            "measured_value": val_float,
            "unit": spec["unit"],
            "acceptable_limit": f"{acc_min} - {acc_max}" if acc_min else f"<= {acc_max}",
            "permissible_limit": f"{perm_min} - {perm_max}" if perm_min else (f"<= {perm_max}" if perm_max is not None else "No relaxation"),
            "status": status_text,
            "status_code": status_code,
            "category": spec["category"],
            "note": spec["note"],
            "explanation": explanation
        })

    # Determine 3-Tier Outcome
    if tested_core_params < 2 or tested_count < 3:
        overall_outcome = OUTCOME_INSUFFICIENT
        outcome_code = "INSUFFICIENT"
        outcome_detail = "Fewer than minimum required baseline parameters were tested. Cannot evaluate water safety without core physical/chemical readings."
    elif has_exceedance:
        overall_outcome = OUTCOME_EXCEEDS
        outcome_code = "EXCEEDS_LIMIT"
        outcome_detail = f"One or more parameters exceed BIS IS 10500 reference limits: {', '.join(exceeded_params)}."
    elif has_permissible_only:
        overall_outcome = OUTCOME_PERMISSIBLE
        outcome_code = "PERMISSIBLE_SOURCE"
        outcome_detail = f"Parameters exceed ideal acceptable limits but remain within permissible limits in the absence of an alternate drinking source: {', '.join(permissible_params)}."
    else:
        overall_outcome = OUTCOME_ACCEPTABLE
        outcome_code = "ACCEPTABLE"
        outcome_detail = "All measured parameters are within applicable BIS IS 10500 Acceptable Limits. Note: This screening applies strictly to tested parameters and does not constitute a certified potability guarantee for unmeasured microbial/toxic contaminants."

    # Identify unmeasured crucial contaminants
    microbial_tested = sample_data.get("e_coli") is not None or sample_data.get("total_coliform") is not None
    heavy_metals_tested = sample_data.get("arsenic") is not None or sample_data.get("lead") is not None

    untested_recommendations = []
    if not microbial_tested:
        untested_recommendations.append("Microbiological Testing (E. coli / Coliforms) not performed — essential to rule out pathogenic contamination.")
    if not heavy_metals_tested:
        untested_recommendations.append("Heavy Metal Screen (Lead, Arsenic, Fluoride) not performed — recommended for groundwater and borehole sources.")

    return {
        "assessment_outcome": overall_outcome,
        "outcome_code": outcome_code,
        "outcome_detail": outcome_detail,
        "tested_parameters_count": tested_count,
        "exceeded_parameters": exceeded_params,
        "permissible_parameters": permissible_params,
        "parameter_results": parameter_results,
        "missing_crucial_tests": untested_recommendations,
        "standard_reference": "Bureau of Indian Standards (BIS) IS 10500:2012 Drinking Water Specification (Second Revision)",
        "disclaimer": "This scientific parameter screening evaluates water samples strictly against BIS IS 10500 reference values for the provided measurements. Water quality cannot be certified safe without comprehensive laboratory testing including microbiological and heavy metal profiles."
    }
