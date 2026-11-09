import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

def evaluate_classifier(model_name: str, pipeline, X_test, y_test) -> dict:
    """
    Evaluates a classification pipeline on unseen test data.
    Computes accuracy, precision, recall, f1-score, and confusion matrix.
    """
    y_pred = pipeline.predict(X_test)
    
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    cm = confusion_matrix(y_test, y_pred).tolist()
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    
    return {
        "model_name": model_name,
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1_score": f1,
        "confusion_matrix": cm,
        "classification_report": report
    }

def print_evaluation_summary(metrics: dict):
    """Prints a clean, formatted evaluation report to the console."""
    print(f"\n=======================================================")
    print(f"   Model Evaluation Report: {metrics['model_name']}")
    print(f"=======================================================")
    print(f"  • Accuracy:        {metrics['accuracy'] * 100:.2f}%")
    print(f"  • Precision:       {metrics['precision'] * 100:.2f}%")
    print(f"  • Recall:          {metrics['recall'] * 100:.2f}%")
    print(f"  • F1-Score:        {metrics['f1_score'] * 100:.2f}%")
    print(f"\n  • Confusion Matrix:")
    cm = np.array(metrics['confusion_matrix'])
    print(f"      [[True Negative (TN): {cm[0][0]:3d},  False Positive (FP): {cm[0][1]:3d}],")
    print(f"       [False Negative (FN): {cm[1][0]:3d},  True Positive (TP):  {cm[1][1]:3d}]]")
    print(f"=======================================================\n")
