import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Union, List

# Default model artifact path
DEFAULT_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "models", "water_potability_pipeline.joblib"
)

# Canonical feature list
FEATURES = [
    "ph",
    "Hardness",
    "Solids",
    "Chloramines",
    "Sulfate",
    "Conductivity",
    "Organic_carbon",
    "Trihalomethanes",
    "Turbidity"
]

class WaterPotabilityPredictor:
    """Wrapper class for loading the trained pipeline and performing water potability predictions."""

    def __init__(self, model_path: str = DEFAULT_MODEL_PATH):
        self.model_path = os.path.abspath(model_path)
        self.metadata = None
        self.pipeline = None
        self._load_model()

    def _load_model(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"Model file not found at {self.model_path}. "
                "Please run `python backend/ml/train.py` first to train and save the pipeline."
            )
        self.metadata = joblib.load(self.model_path)
        self.pipeline = self.metadata["pipeline"]

    def predict(self, sample: Union[Dict[str, Any], List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """
        Accepts a dictionary (single sample) or list of dictionaries (batch samples)
        with water chemical metrics and returns predictions with probability scores.
        """
        if isinstance(sample, dict):
            samples = [sample]
        else:
            samples = sample

        # Convert to DataFrame ensuring proper column names
        df_input = pd.DataFrame(samples)

        # Normalize column names case-insensitively to match training features exactly
        # e.g., 'hardness' -> 'Hardness', 'solids' -> 'Solids', 'ph' -> 'ph'
        col_rename = {}
        for col in df_input.columns:
            for feat in FEATURES:
                if col.lower().strip() == feat.lower().strip():
                    col_rename[col] = feat
        df_input = df_input.rename(columns=col_rename)

        # Ensure all required features are present (allow NaN which imputer handles)
        for col in FEATURES:
            if col not in df_input.columns:
                df_input[col] = np.nan

        # Enforce column order
        df_input = df_input[FEATURES]

        # Predict classes and probabilities
        preds = self.pipeline.predict(df_input)
        probs = self.pipeline.predict_proba(df_input)

        results = []
        for i, (pred, prob) in enumerate(zip(preds, probs)):
            potable = bool(pred == 1)
            confidence = float(prob[1] if potable else prob[0])
            results.append({
                "sample_index": i,
                "potability": int(pred),
                "is_potable": potable,
                "confidence": round(confidence, 4),
                "probability_potable": round(float(prob[1]), 4),
                "probability_not_potable": round(float(prob[0]), 4),
                "verdict": "Potable (Safe for Consumption)" if potable else "Not Potable (Unsafe)"
            })

        return results

# Convenience instance for direct import
_predictor = None

def get_predictor() -> WaterPotabilityPredictor:
    global _predictor
    if _predictor is None:
        _predictor = WaterPotabilityPredictor()
    return _predictor

def predict_water_quality(sample: Union[Dict[str, Any], List[Dict[str, Any]]]):
    """Functional helper for direct use in FastAPI routes."""
    predictor = get_predictor()
    return predictor.predict(sample)

if __name__ == "__main__":
    print("Testing WaterPotabilityPredictor...")
    predictor = get_predictor()
    print("Model loaded successfully:", predictor.metadata.get("model_name"))
    print("Model test metrics:", predictor.metadata.get("metrics"))

    # Test sample (clean sample)
    clean_sample = {
        "ph": 7.2,
        "Hardness": 180.0,
        "Solids": 18000.0,
        "Chloramines": 6.5,
        "Sulfate": 300.0,
        "Conductivity": 400.0,
        "Organic_carbon": 10.5,
        "Trihalomethanes": 60.0,
        "Turbidity": 3.8
    }

    # Test sample with missing values (should be handled cleanly by median imputer)
    sample_with_nans = {
        "Hardness": 210.0,
        "Solids": 22000.0,
        "Chloramines": 8.0,
        "Conductivity": 450.0,
        "Organic_carbon": 15.0,
        "Turbidity": 4.5
    }

    results = predictor.predict([clean_sample, sample_with_nans])
    for r in results:
        print(f"\nResult {r['sample_index'] + 1}:")
        print(f"  Verdict: {r['verdict']}")
        print(f"  Confidence: {r['confidence'] * 100:.2f}%")
        print(f"  Potability Prob: {r['probability_potable']:.4f}")
