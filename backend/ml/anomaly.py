from typing import Dict, Any, List
from backend.models.schemas import AnomalyEvaluation
from backend.ml.anomaly_detection import get_anomaly_detector

# WHO / US EPA Standard Thresholds
STANDARDS = {
    "ph": {"min": 6.5, "max": 8.5, "unit": "pH", "desc": "WHO permissible pH range (6.5 - 8.5)"},
    "hardness": {"max": 300.0, "unit": "mg/L", "desc": "Hardness standard (< 300 mg/L)"},
    "solids": {"max": 1000.0, "unit": "ppm", "desc": "Total Dissolved Solids (< 1000 ppm desirable for drinking)"},
    "chloramines": {"max": 4.0, "unit": "ppm", "desc": "Chloramines disinfectant limit (< 4 ppm)"},
    "sulfate": {"max": 250.0, "unit": "mg/L", "desc": "Sulfate maximum threshold (< 250 mg/L)"},
    "conductivity": {"max": 400.0, "unit": "uS/cm", "desc": "Electrical conductivity standard (< 400 uS/cm)"},
    "organic_carbon": {"max": 4.0, "unit": "ppm", "desc": "Total Organic Carbon (< 4 ppm)"},
    "trihalomethanes": {"max": 80.0, "unit": "ug/L", "desc": "Trihalomethanes toxic disinfection byproduct (< 80 ug/L)"},
    "turbidity": {"max": 5.0, "unit": "NTU", "desc": "Turbidity clarity standard (< 5 NTU)"}
}

def evaluate_water_anomalies(data: Dict[str, Any]) -> AnomalyEvaluation:
    """
    Evaluates water sample against WHO and US EPA environmental water quality guidelines.
    Returns whether an anomaly is present, list of violated parameters, and risk level.
    """
    violations: List[str] = []

    for key, rule in STANDARDS.items():
        val = data.get(key)
        if val is None:
            continue

        min_val = rule.get("min")
        max_val = rule.get("max")
        unit = rule.get("unit")

        if min_val is not None and val < min_val:
            violations.append(
                f"{key.capitalize()} is {val:.2f} {unit}, which is critically below the minimum safe limit of {min_val} {unit}."
            )
        if max_val is not None and val > max_val:
            violations.append(
                f"{key.capitalize()} is {val:.2f} {unit}, exceeding the maximum standard threshold of {max_val} {unit}."
            )

    # Also evaluate using trained Isolation Forest ML model
    iso_anomaly = False
    iso_score = None
    iso_label = "Normal Sample"
    try:
        iso_detector = get_anomaly_detector()
        iso_res = iso_detector.detect(data)[0]
        iso_anomaly = iso_res["is_unusual_sample"]
        iso_score = iso_res["anomaly_score"]
        iso_label = iso_res["anomaly_label"]
        if iso_anomaly:
            violations.append(
                f"Isolation Forest ML detected multivariate outlier (Score: {iso_score:.4f})."
            )
    except Exception as e:
        print(f"Isolation Forest evaluation warning: {e}")

    num_violations = len(violations)
    if num_violations == 0 and not iso_anomaly:
        risk_level = "NORMAL"
        is_anomaly = False
    elif num_violations <= 2:
        risk_level = "MODERATE"
        is_anomaly = True
    else:
        risk_level = "CRITICAL"
        is_anomaly = True

    return AnomalyEvaluation(
        is_anomaly=is_anomaly,
        risk_level=risk_level,
        violations=violations,
        sample_values=data,
        isolation_forest_anomaly=iso_anomaly,
        isolation_forest_score=iso_score,
        isolation_forest_label=iso_label
    )
