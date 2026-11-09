import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Union, List

DEFAULT_ANOMALY_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "models", "isolation_forest_pipeline.joblib"
)

CANONICAL_FEATURES = [
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

class WaterAnomalyDetector:
    """
    Unsupervised Anomaly Detection using Isolation Forest.
    Detects unusual, out-of-distribution water samples (chemical spills, sensor faults).
    """

    def __init__(self, model_path: str = DEFAULT_ANOMALY_MODEL_PATH):
        self.model_path = os.path.abspath(model_path)
        self.metadata = None
        self.pipeline = None
        self._load_model()

    def _load_model(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"Anomaly model artifact not found at {self.model_path}. "
                "Please run `python backend/ml/train_model.py` first to train and save the pipeline."
            )
        self.metadata = joblib.load(self.model_path)
        self.pipeline = self.metadata["pipeline"]

    def detect(self, sample: Union[Dict[str, Any], List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """
        Takes a single water sample dictionary or a list of sample dictionaries.
        Returns whether each sample is an outlier/anomaly, along with an anomaly score.
        """
        if isinstance(sample, dict):
            samples = [sample]
        else:
            samples = sample

        df_input = pd.DataFrame(samples)

        # Normalize column names to canonical features
        rename_map = {col: col for col in df_input.columns}
        for col in df_input.columns:
            for feat in CANONICAL_FEATURES:
                if col.lower().strip() == feat.lower().strip():
                    rename_map[col] = feat
        df_input = df_input.rename(columns=rename_map)

        # Ensure all canonical features are present
        for feat in CANONICAL_FEATURES:
            if feat not in df_input.columns:
                df_input[feat] = np.nan

        df_input = df_input[CANONICAL_FEATURES]

        # In Isolation Forest: 1 = Inlier (Normal), -1 = Outlier (Anomaly)
        preds = self.pipeline.predict(df_input)
        scores = self.pipeline.score_samples(df_input)

        results = []
        for i, (pred, score) in enumerate(zip(preds, scores)):
            is_anomaly = bool(pred == -1)
            results.append({
                "sample_index": i,
                "is_unusual_sample": is_anomaly,
                "anomaly_label": "Unusual / Anomaly" if is_anomaly else "Normal Sample",
                # Higher score = more normal; lower/negative score = more anomalous
                "anomaly_score": round(float(score), 4),
                "severity": "HIGH_DEVIATION" if is_anomaly else "NORMAL_RANGE"
            })

        return results

# Singleton instance
_anomaly_detector = None

def get_anomaly_detector() -> WaterAnomalyDetector:
    global _anomaly_detector
    if _anomaly_detector is None:
        _anomaly_detector = WaterAnomalyDetector()
    return _anomaly_detector

def detect_unusual_sample(sample: Union[Dict[str, Any], List[Dict[str, Any]]]):
    """Functional convenience helper."""
    detector = get_anomaly_detector()
    return detector.detect(sample)

if __name__ == "__main__":
    print("Testing WaterAnomalyDetector...")
    try:
        detector = get_anomaly_detector()
        print("Model loaded successfully:", detector.metadata.get("model_name"))
        
        normal_sample = {
            "ph": 7.0, "Hardness": 190.0, "Solids": 15000.0, "Chloramines": 5.0,
            "Sulfate": 300.0, "Conductivity": 400.0, "Organic_carbon": 10.0,
            "Trihalomethanes": 60.0, "Turbidity": 3.0
        }
        extreme_sample = {
            "ph": 1.2, "Hardness": 950.0, "Solids": 85000.0, "Chloramines": 25.0,
            "Sulfate": 950.0, "Conductivity": 1800.0, "Organic_carbon": 45.0,
            "Trihalomethanes": 350.0, "Turbidity": 25.0
        }
        res = detector.detect([normal_sample, extreme_sample])
        for r in res:
            print(f"Sample {r['sample_index'] + 1}: {r['anomaly_label']} (Score: {r['anomaly_score']}, Severity: {r['severity']})")
    except Exception as e:
        print(f"Error testing detector: {e}")
