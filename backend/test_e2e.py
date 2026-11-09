import sys
from fastapi.testclient import TestClient
from backend.main import app

def run_tests():
    print("=" * 60)
    print("   AquaWatch AI - Backend & ML Integration Tests")
    print("=" * 60)

    client = TestClient(app)

    # 1. Health
    print("[1/8] Testing GET /health...")
    r = client.get("/health")
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    health_data = r.json()
    print(f"      -> Status: {health_data.get('status')}")
    print(f"      -> Model Loaded: {health_data.get('model_loaded')}")
    print(f"      -> Database: {health_data.get('database')}")

    # 2. Water Analyzer & Prediction
    print("\n[2/8] Testing POST /predict (Valid Measurements)...")
    sample = {
        "ph": 7.45,
        "hardness": 195.0,
        "solids": 16500.0,
        "chloramines": 6.2,
        "sulfate": 310.0,
        "conductivity": 390.0,
        "organic_carbon": 10.5,
        "trihalomethanes": 58.0,
        "turbidity": 3.1
    }
    r = client.post("/predict", json=sample)
    assert r.status_code == 200, f"Predict failed: {r.status_code}"
    pred_res = r.json()
    print(f"      -> Verdict: {pred_res['verdict']}")
    print(f"      -> Confidence: {pred_res['confidence']*100:.1f}%")
    print(f"      -> Potable Prob: {pred_res['probability_potable']:.4f}")
    print(f"      -> Saved DB Record ID: #{pred_res['id']}")

    # 3. Anomaly Detection
    print("\n[3/8] Testing POST /anomaly...")
    r = client.post("/anomaly", json=sample)
    assert r.status_code == 200, f"Anomaly failed: {r.status_code}"
    anom = r.json()
    print(f"      -> Anomaly Flag: {anom['is_anomaly']}")
    print(f"      -> Risk Level: {anom['risk_level']}")
    print(f"      -> Total Violations Detected: {len(anom['violations'])}")

    # 4. CSV Batch Upload
    print("\n[4/8] Testing POST /upload-csv (Batch Ingestion)...")
    csv_data = """ph,Hardness,Solids,Chloramines,Sulfate,Conductivity,Organic_carbon,Trihalomethanes,Turbidity
6.8,180.0,14000.0,4.8,290.0,380.0,9.5,45.0,2.8
8.5,260.0,26000.0,8.8,410.0,520.0,19.0,95.0,5.2
7.2,150.0,500.0,2.5,150.0,290.0,2.0,30.0,1.5
"""
    files = {"file": ("e2e_telemetry.csv", csv_data.encode("utf-8"), "text/csv")}
    r = client.post("/upload-csv", files=files)
    assert r.status_code == 200, f"Upload failed: {r.status_code}"
    up_res = r.json()
    print(f"      -> Processed Samples: {up_res['processed_samples']}")
    print(f"      -> Potable Count: {up_res['potable_samples']}")
    print(f"      -> Non-Potable Count: {up_res['non_potable_samples']}")

    # 5. Database History Check
    print("\n[5/8] Testing GET /history (Persistence Verification)...")
    r = client.get("/history?limit=100")
    assert r.status_code == 200
    history = r.json()
    print(f"      -> Total Records Stored in SQLite DB: {len(history)}")
    assert len(history) >= 4, "History does not contain expected samples"

    # 6. Dashboard Stats
    print("\n[6/8] Testing GET /dashboard/stats (Live Aggregation)...")
    r = client.get("/dashboard/stats")
    assert r.status_code == 200
    stats = r.json()
    print(f"      -> Total Analyzed: {stats['total_samples']}")
    print(f"      -> Potability Ratio: {stats['potable_percentage']}%")
    print(f"      -> Anomaly Ratio: {stats['anomaly_percentage']}%")
    print(f"      -> Average pH: {stats['average_ph']}")

    # 7. Input Validation & Error Handling
    print("\n[7/8] Testing Input Validation & Error Handling...")
    invalid_sample = {"ph": 18.5}  # Out of range (max 14)
    r = client.post("/predict", json=invalid_sample)
    assert r.status_code == 422, "Pydantic validation should reject pH > 14"
    print("      -> Out-of-bounds pH (18.5) properly rejected with HTTP 422 Unprocessable Entity")

    # 8. Swagger Docs
    print("\n[8/8] Testing Swagger Documentation Endpoint...")
    r = client.get("/docs")
    assert r.status_code == 200
    print("      -> Swagger UI /docs is active and serving (HTTP 200)")

    print("\n" + "=" * 60)
    print("   >>> ALL 8 BACKEND INTEGRATION TESTS PASSED! <<<")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
