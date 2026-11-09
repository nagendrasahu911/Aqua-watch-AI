import os
import sys
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.linear_model import LogisticRegression

# Import our modular evaluation functions
from backend.ml.model_evaluation import evaluate_classifier, print_evaluation_summary

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "water_potability.csv")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

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
TARGET = "Potability"

def train_and_evaluate_all():
    print("=" * 65)
    print("   AquaWatch AI - Phase 2: Machine Learning Model Development")
    print("=" * 65)

    # 1. Dataset Verification
    abs_data_path = os.path.abspath(DATA_PATH)
    if not os.path.exists(abs_data_path):
        print(f"\n[ERROR] Dataset not found at: {abs_data_path}")
        print("Please ensure 'water_potability.csv' is placed inside 'backend/data/'.")
        print("You can download it from Kaggle: https://www.kaggle.com/datasets/adityakadiwal/water-potability")
        sys.exit(1)

    print(f"\n[Step 1] Loading Dataset from: {abs_data_path}")
    df = pd.read_csv(abs_data_path)
    print(f"         Total Samples: {df.shape[0]}, Features: {df.shape[1]}")

    # 2. Inspect Missing Values
    print("\n[Step 2] Inspecting Missing Values per Feature:")
    null_counts = df[FEATURES].isnull().sum()
    for col, count in null_counts.items():
        pct = (count / len(df)) * 100
        print(f"         • {col:16s}: {count:4d} missing ({pct:5.2f}%)")

    # 3. Train-Test Split (Avoiding Data Leakage)
    print("\n[Step 3] Splitting Data into 80% Train and 20% Test (Stratified)...")
    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"         Training Samples: {X_train.shape[0]} ({X_train.shape[0]/len(df)*100:.0f}%)")
    print(f"         Testing Samples:  {X_test.shape[0]} ({X_test.shape[0]/len(df)*100:.0f}%)")

    # 4. Pipelines Construction
    # Using Median Imputation (robust against environmental outliers) and Standard Scaling
    print("\n[Step 4] Building Pipelines with SimpleImputer & StandardScaler...")

    rf_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("classifier", RandomForestClassifier(
            n_estimators=200,
            max_depth=12,
            random_state=42,
            class_weight="balanced"
        ))
    ])

    lr_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(
            max_iter=1000,
            random_state=42,
            class_weight="balanced"
        ))
    ])

    # 5. Train Supervised Classification Models
    print("\n[Step 5] Training Classification Models...")
    print("         -> Training Random Forest Classifier (Primary Model)...")
    rf_pipeline.fit(X_train, y_train)

    print("         -> Training Logistic Regression (Comparison Baseline)...")
    lr_pipeline.fit(X_train, y_train)

    # 6. Evaluate Models on Unseen Test Partition
    print("\n[Step 6] Evaluating Models on 20% Holdout Test Set (Real Dataset Metrics):")
    rf_metrics = evaluate_classifier("Random Forest Classifier", rf_pipeline, X_test, y_test)
    lr_metrics = evaluate_classifier("Logistic Regression (Baseline)", lr_pipeline, X_test, y_test)

    print_evaluation_summary(rf_metrics)
    print_evaluation_summary(lr_metrics)

    # 7. Unsupervised Anomaly Detection: Isolation Forest
    print("[Step 7] Training Isolation Forest for Unusual Water Sample Detection...")
    # Fits on imputed/scaled features to detect multivariate outliers
    iso_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("isolation_forest", IsolationForest(
            n_estimators=150,
            contamination=0.05,  # Anticipate ~5% extreme anomaly samples
            random_state=42
        ))
    ])
    iso_pipeline.fit(X_train)
    print("         -> Isolation Forest trained successfully.")

    # 8. Persist Models and Pipelines using Joblib
    os.makedirs(MODELS_DIR, exist_ok=True)
    rf_save_path = os.path.join(MODELS_DIR, "water_potability_pipeline.joblib")
    lr_save_path = os.path.join(MODELS_DIR, "logistic_regression_pipeline.joblib")
    iso_save_path = os.path.join(MODELS_DIR, "isolation_forest_pipeline.joblib")

    print(f"\n[Step 8] Persisting Models & Preprocessing Pipelines via Joblib:")

    joblib.dump({
        "model_name": "Random Forest Classifier",
        "features": FEATURES,
        "metrics": rf_metrics,
        "pipeline": rf_pipeline
    }, rf_save_path)
    print(f"         [SAVED] Random Forest saved to: {rf_save_path}")

    joblib.dump({
        "model_name": "Logistic Regression Baseline",
        "features": FEATURES,
        "metrics": lr_metrics,
        "pipeline": lr_pipeline
    }, lr_save_path)
    print(f"         [SAVED] Logistic Regression saved to: {lr_save_path}")

    joblib.dump({
        "model_name": "Isolation Forest Anomaly Detector",
        "features": FEATURES,
        "pipeline": iso_pipeline
    }, iso_save_path)
    print(f"         [SAVED] Isolation Forest saved to: {iso_save_path}")

    print("\n" + "=" * 65)
    print("   [SUCCESS] Phase 2 Machine Learning Pipeline Training Complete!")
    print("=" * 65)

if __name__ == "__main__":
    train_and_evaluate_all()
