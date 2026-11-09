import io
import json
import pandas as pd
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.database.session import get_db
from backend.database.models import WaterSample
from backend.models.schemas import (
    WaterSampleInput,
    PredictionResponse,
    AnomalyEvaluation,
    WaterSampleRecord,
    DashboardStatsResponse,
    ScientificScreeningResult,
    SelectedReportsRequest
)
from backend.ml.prediction import get_predictor
from backend.ml.anomaly import evaluate_water_anomalies
from backend.ml.bis_screening import evaluate_bis_is_10500
from backend.reports.pdf_generator import build_pdf_report

router = APIRouter()

# 1. GET /health
@router.get("/health", summary="Health check endpoint")
def health_check():
    predictor = get_predictor()
    model_name = predictor.metadata.get("model_name", "Unknown") if predictor.metadata else "Unavailable"
    return {
        "status": "healthy",
        "service": "AquaWatch AI Backend",
        "model_loaded": model_name,
        "database": "sqlite_connected"
    }

# 2. POST /predict
@router.post("/predict", response_model=PredictionResponse, summary="Scientific Screening (BIS IS 10500) and ML Prediction")
def predict_sample(sample_in: WaterSampleInput, db: Session = Depends(get_db)):
    # Prepare dictionary
    sample_dict = sample_in.model_dump()

    # System A: Scientific Parameter Screening (BIS IS 10500:2012)
    screening_res = evaluate_bis_is_10500(sample_dict)

    # Legacy Anomaly Evaluation (Thresholds + Isolation Forest)
    anomaly_eval = evaluate_water_anomalies(sample_dict)

    # System B: Separate Machine Learning Prediction (Random Forest)
    predictor = get_predictor()
    preds = predictor.predict(sample_dict)
    if not preds:
        raise HTTPException(status_code=500, detail="Failed to run model inference.")

    pred_res = preds[0]

    # Package ML metadata & limitations clearly
    ml_output = {
        "model_name": "Random Forest Classifier (Balanced)",
        "prediction": pred_res["potability"],
        "is_potable": pred_res["is_potable"],
        "confidence": pred_res["confidence"],
        "probability_potable": pred_res["probability_potable"],
        "probability_not_potable": pred_res["probability_not_potable"],
        "verdict": pred_res["verdict"],
        "limitations": "Trained on Kaggle Water Potability dataset. Reflects statistical pattern matching on 9 features, NOT official drinking-water compliance."
    }

    # Save to SQLite database
    db_sample = WaterSample(
        ph=sample_dict.get("ph"),
        hardness=sample_dict.get("hardness"),
        solids=sample_dict.get("solids"),
        chloramines=sample_dict.get("chloramines"),
        sulfate=sample_dict.get("sulfate"),
        conductivity=sample_dict.get("conductivity"),
        organic_carbon=sample_dict.get("organic_carbon"),
        trihalomethanes=sample_dict.get("trihalomethanes"),
        turbidity=sample_dict.get("turbidity"),
        potability=pred_res["potability"],
        is_potable=pred_res["is_potable"],
        confidence=pred_res["confidence"],
        verdict=pred_res["verdict"],
        is_anomaly=anomaly_eval.is_anomaly,
        anomaly_reasons="; ".join(anomaly_eval.violations) if anomaly_eval.violations else None,
        source="single_api"
    )

    db.add(db_sample)
    db.commit()
    db.refresh(db_sample)

    return PredictionResponse(
        id=db_sample.id,
        created_at=db_sample.created_at,
        scientific_screening=screening_res,
        ml_prediction=ml_output,
        potability=pred_res["potability"],
        is_potable=pred_res["is_potable"],
        confidence=pred_res["confidence"],
        probability_potable=pred_res["probability_potable"],
        probability_not_potable=pred_res["probability_not_potable"],
        verdict=pred_res["verdict"],
        anomaly_status=anomaly_eval
    )

# 3. POST /anomaly
@router.post("/anomaly", response_model=AnomalyEvaluation, summary="Inspect sample for biochemical & sensor anomalies")
def check_anomaly(sample_in: WaterSampleInput):
    sample_dict = sample_in.model_dump()
    return evaluate_water_anomalies(sample_dict)

# 4. GET /dashboard/stats
@router.get("/dashboard/stats", response_model=DashboardStatsResponse, summary="Get high-level dashboard metrics")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total = db.query(WaterSample).count()

    if total == 0:
        return DashboardStatsResponse(
            total_samples=0,
            potable_count=0,
            non_potable_count=0,
            potable_percentage=0.0,
            anomaly_count=0,
            anomaly_percentage=0.0,
            average_ph=None,
            average_turbidity=None,
            average_solids=None,
            latest_verdict="No records yet"
        )

    potable_count = db.query(WaterSample).filter(WaterSample.potability == 1).count()
    non_potable_count = total - potable_count
    anomaly_count = db.query(WaterSample).filter(WaterSample.is_anomaly == True).count()

    avg_ph = db.query(func.avg(WaterSample.ph)).scalar()
    avg_turb = db.query(func.avg(WaterSample.turbidity)).scalar()
    avg_solids = db.query(func.avg(WaterSample.solids)).scalar()

    latest = db.query(WaterSample).order_by(desc(WaterSample.id)).first()

    return DashboardStatsResponse(
        total_samples=total,
        potable_count=potable_count,
        non_potable_count=non_potable_count,
        potable_percentage=round((potable_count / total) * 100, 2),
        anomaly_count=anomaly_count,
        anomaly_percentage=round((anomaly_count / total) * 100, 2),
        average_ph=round(avg_ph, 2) if avg_ph is not None else None,
        average_turbidity=round(avg_turb, 2) if avg_turb is not None else None,
        average_solids=round(avg_solids, 2) if avg_solids is not None else None,
        latest_verdict=latest.verdict if latest else None
    )

# 5. POST /upload-csv
@router.post("/upload-csv", summary="Upload CSV file of water samples for batch prediction and storage")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a .csv file."
        )

    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error parsing CSV file: {str(e)}"
        )

    # Standardize column names to lowercase
    rename_map = {col: col.lower().strip() for col in df.columns}
    df = df.rename(columns=rename_map)

    records = df.to_dict(orient="records")
    if not records:
        raise HTTPException(status_code=400, detail="The uploaded CSV contains no rows.")

    predictor = get_predictor()
    predictions = predictor.predict(records)

    db_objects = []
    potable_count = 0
    anomaly_count = 0

    for rec, pred in zip(records, predictions):
        anomaly_eval = evaluate_water_anomalies(rec)
        if pred["is_potable"]:
            potable_count += 1
        if anomaly_eval.is_anomaly:
            anomaly_count += 1

        db_sample = WaterSample(
            ph=rec.get("ph"),
            hardness=rec.get("hardness"),
            solids=rec.get("solids"),
            chloramines=rec.get("chloramines"),
            sulfate=rec.get("sulfate"),
            conductivity=rec.get("conductivity"),
            organic_carbon=rec.get("organic_carbon"),
            trihalomethanes=rec.get("trihalomethanes"),
            turbidity=rec.get("turbidity"),
            potability=pred["potability"],
            is_potable=pred["is_potable"],
            confidence=pred["confidence"],
            verdict=pred["verdict"],
            is_anomaly=anomaly_eval.is_anomaly,
            anomaly_reasons="; ".join(anomaly_eval.violations) if anomaly_eval.violations else None,
            source="csv_upload"
        )
        db_objects.append(db_sample)

    db.bulk_save_objects(db_objects)
    db.commit()

    return {
        "filename": file.filename,
        "processed_samples": len(records),
        "potable_samples": potable_count,
        "non_potable_samples": len(records) - potable_count,
        "anomaly_samples": anomaly_count,
        "message": f"Successfully processed and stored {len(records)} samples in the database."
    }

# 6. GET /history
@router.get("/history", response_model=List[WaterSampleRecord], summary="Retrieve historical water samples")
def get_sample_history(
    limit: int = Query(50, ge=1, le=1000, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    db: Session = Depends(get_db)
):
    samples = db.query(WaterSample).order_by(desc(WaterSample.id)).offset(offset).limit(limit).all()
    return samples

# ==========================================
# 7. Official PDF Compliance Report Endpoints
# ==========================================

@router.get("/reports/all", summary="Download PDF Report for All Samples")
def download_all_reports_pdf(db: Session = Depends(get_db)):
    samples = db.query(WaterSample).order_by(desc(WaterSample.id)).all()
    if not samples:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No water sample records found in database to generate report."
        )
    
    pdf_buffer = build_pdf_report(samples, mode="ALL")
    date_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"AquaWatch_Master_Report_All_Samples_{date_str}.pdf"
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

@router.get("/reports/sample/{sample_id}", summary="Download PDF Report for a Specific Sample")
def download_single_sample_report_pdf(sample_id: int, db: Session = Depends(get_db)):
    sample = db.query(WaterSample).filter(WaterSample.id == sample_id).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Water sample with ID #{sample_id} not found."
        )
    
    pdf_buffer = build_pdf_report([sample], mode="SINGLE")
    filename = f"AquaWatch_Sample_Report_ID{sample_id}.pdf"
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

@router.post("/reports/selected", summary="Download PDF Report for Multiple Selected Samples")
def download_selected_samples_report_pdf(payload: SelectedReportsRequest, db: Session = Depends(get_db)):
    if not payload.sample_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one sample ID must be provided."
        )
    
    # Query matching records
    samples = db.query(WaterSample).filter(WaterSample.id.in_(payload.sample_ids)).order_by(desc(WaterSample.id)).all()
    if not samples:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="None of the selected sample IDs were found in the database."
        )
    
    pdf_buffer = build_pdf_report(samples, mode="SELECTED")
    date_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"AquaWatch_Batch_Report_{len(samples)}_Samples_{date_str}.pdf"
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
