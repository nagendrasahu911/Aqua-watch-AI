import os
import sys
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

def run_ml_pipeline(data_path="backend/data/water_potability.csv", model_dir="backend/models"):
    print("=" * 65)
    print("   AquaWatch AI - Machine Learning Pipeline Training")
    print("=" * 65)

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at: {data_path}")

    # 1. Load Dataset
    print(f"\n[1/7] Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"      Total records: {len(df)}")
    print(f"      Feature columns: {list(df.columns)}")

    # 2. Inspect missing values
    print("\n[2/7] Missing Value Inspection:")
    null_counts = df.isnull().sum()
    for col, count in null_counts.items():
        if count > 0:
            pct = (count / len(df)) * 100
            print(f"      - {col}: {count} missing ({pct:.2f}%)")

    # Target and Features separation
    target_col = "Potability"
    feature_cols = [c for c in df.columns if c != target_col]
    X = df[feature_cols]
    y = df[target_col]

    # 3. Stratified Train-Test Split (80% train, 20% test)
    print("\n[3/7] Splitting data into 80% Train and 20% Test (stratified by class)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"      Train set size: {X_train.shape[0]} samples")
    print(f"      Test set size:  {X_test.shape[0]} samples")

    # 4. Pipelines
    # Preprocessing: Impute missing values with median (robust against outliers in environmental data)
    # and Standardize features
    print("\n[4/7] Constructing Scikit-learn Pipelines...")

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

    # 5. Train Models
    print("\n[5/7] Training models on training partition...")
    print("      -> Training Random Forest Classifier...")
    rf_pipeline.fit(X_train, y_train)

    print("      -> Training Logistic Regression Classifier (Comparison Baseline)...")
    lr_pipeline.fit(X_train, y_train)

    # 6. Evaluation Function
    def evaluate_model(name, pipeline, X_eval, y_eval):
        y_pred = pipeline.predict(X_eval)
        acc = accuracy_score(y_eval, y_pred)
        prec = precision_score(y_eval, y_pred, zero_division=0)
        rec = recall_score(y_eval, y_pred, zero_division=0)
        f1 = f1_score(y_eval, y_pred, zero_division=0)
        cm = confusion_matrix(y_eval, y_pred)
        return {
            "name": name,
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "confusion_matrix": cm,
            "y_pred": y_pred
        }

    rf_results = evaluate_model("Random Forest", rf_pipeline, X_test, y_test)
    lr_results = evaluate_model("Logistic Regression", lr_pipeline, X_test, y_test)

    print("\n[6/7] Model Evaluation Metrics on Test Set (20% Holdout):")
    print("-" * 65)
    for res in [rf_results, lr_results]:
        print(f"Model: {res['name']}")
        print(f"  • Accuracy:         {res['accuracy'] * 100:.2f}%")
        print(f"  • Precision:        {res['precision'] * 100:.2f}%")
        print(f"  • Recall:           {res['recall'] * 100:.2f}%")
        print(f"  • F1-Score:         {res['f1_score'] * 100:.2f}%")
        print(f"  • Confusion Matrix:\n{res['confusion_matrix']}")
        print("    [[TN, FP],")
        print("     [FN, TP]]")
        print("-" * 65)

    # 7. Model Selection & Persistence
    os.makedirs(model_dir, exist_ok=True)

    # Compare by F1-Score / Accuracy
    best_pipeline = rf_pipeline if rf_results["f1_score"] >= lr_results["f1_score"] else lr_pipeline
    best_results = rf_results if rf_results["f1_score"] >= lr_results["f1_score"] else lr_results

    model_save_path = os.path.join(model_dir, "water_potability_pipeline.joblib")
    print(f"\n[7/7] Selecting Best Model: {best_results['name']}")
    print(f"      Saving pipeline to: {model_save_path}")

    metadata = {
        "model_name": best_results["name"],
        "features": feature_cols,
        "metrics": {
            "accuracy": float(best_results["accuracy"]),
            "precision": float(best_results["precision"]),
            "recall": float(best_results["recall"]),
            "f1_score": float(best_results["f1_score"]),
            "confusion_matrix": best_results["confusion_matrix"].tolist()
        },
        "pipeline": best_pipeline
    }

    joblib.dump(metadata, model_save_path)
    print("      Model pipeline and metadata successfully saved!")
    print("=" * 65)

    return metadata

if __name__ == "__main__":
    run_ml_pipeline()
