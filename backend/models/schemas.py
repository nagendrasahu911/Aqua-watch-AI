from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# Input schema for water quality sample (Core + Optional Extended Laboratory Contaminants)
class WaterSampleInput(BaseModel):
    # Core Parameters
    ph: Optional[float] = Field(None, ge=0.0, le=14.0, description="pH of water (BIS IS 10500: 6.5 - 8.5)")
    hardness: Optional[float] = Field(None, ge=0.0, description="Hardness in mg/L (BIS Acceptable: 200, Permissible: 600)")
    solids: Optional[float] = Field(None, ge=0.0, description="Total Dissolved Solids in mg/L (BIS Acceptable: 500, Permissible: 2000)")
    chloramines: Optional[float] = Field(None, ge=0.0, description="Chloramines in mg/L (Max: 4.0)")
    sulfate: Optional[float] = Field(None, ge=0.0, description="Sulphate in mg/L (BIS Acceptable: 200, Permissible: 400)")
    conductivity: Optional[float] = Field(None, ge=0.0, description="Conductivity in uS/cm (No BIS limit)")
    organic_carbon: Optional[float] = Field(None, ge=0.0, description="Total Organic Carbon in mg/L (No BIS limit)")
    trihalomethanes: Optional[float] = Field(None, ge=0.0, description="Trihalomethanes in ug/L (Max: 100 ug/L)")
    turbidity: Optional[float] = Field(None, ge=0.0, description="Turbidity in NTU (BIS Acceptable: 1.0, Permissible: 5.0)")

    # Section 5: Extended Laboratory Contaminants (Microbiology & Toxic Inorganics)
    e_coli: Optional[float] = Field(None, ge=0.0, description="E. coli / 100 mL (BIS: 0 MPN/100 mL)")
    total_coliform: Optional[float] = Field(None, ge=0.0, description="Total coliform / 100 mL (BIS: 0 MPN/100 mL)")
    arsenic: Optional[float] = Field(None, ge=0.0, description="Arsenic in mg/L (BIS Acceptable: 0.01, Permissible: 0.05)")
    lead: Optional[float] = Field(None, ge=0.0, description="Lead in mg/L (BIS: 0.01 mg/L, No relaxation)")
    fluoride: Optional[float] = Field(None, ge=0.0, description="Fluoride in mg/L (BIS Acceptable: 1.0, Permissible: 1.5)")
    nitrate: Optional[float] = Field(None, ge=0.0, description="Nitrate in mg/L (BIS: 45.0 mg/L, No relaxation)")
    iron: Optional[float] = Field(None, ge=0.0, description="Iron in mg/L (BIS Acceptable: 0.3, Permissible: 1.0)")
    chloride: Optional[float] = Field(None, ge=0.0, description="Chloride in mg/L (BIS Acceptable: 250, Permissible: 1000)")

    class Config:
        json_schema_extra = {
            "example": {
                "ph": 7.2,
                "hardness": 180.0,
                "solids": 450.0,
                "turbidity": 0.8,
                "sulfate": 150.0,
                "chloramines": 2.0
            }
        }

# Parameter Row in BIS IS 10500 Evaluation Table
class ParameterScreeningRow(BaseModel):
    key: str
    name: str
    measured_value: Optional[float]
    unit: str
    acceptable_limit: str
    permissible_limit: str
    status: str
    status_code: str
    category: str
    note: str
    explanation: str

# Scientific Screening Assessment Object
class ScientificScreeningResult(BaseModel):
    assessment_outcome: str # 1. WITHIN ACCEPTABLE LIMITS, 2. EXCEEDS REFERENCE LIMIT, 3. INSUFFICIENT INFORMATION
    outcome_code: str
    outcome_detail: str
    tested_parameters_count: int
    exceeded_parameters: List[str]
    permissible_parameters: List[str]
    parameter_results: List[ParameterScreeningRow]
    missing_crucial_tests: List[str]
    standard_reference: str
    disclaimer: str

# Anomaly detection result (Maintains backward compatibility)
class AnomalyEvaluation(BaseModel):
    is_anomaly: bool
    risk_level: str
    violations: List[str]
    sample_values: Dict[str, Optional[float]]
    isolation_forest_anomaly: Optional[bool] = None
    isolation_forest_score: Optional[float] = None
    isolation_forest_label: Optional[str] = None

# Dual-Engine Output Schema: Scientific Screening + Separate ML Model
class PredictionResponse(BaseModel):
    id: Optional[int] = None
    created_at: Optional[datetime] = None

    # Engine A: Scientific Screening (BIS IS 10500)
    scientific_screening: ScientificScreeningResult

    # Engine B: Machine Learning Prediction (Random Forest)
    ml_prediction: Dict[str, Any]

    # Legacy compatibility fields
    potability: int
    is_potable: bool
    confidence: float
    probability_potable: float
    probability_not_potable: float
    verdict: str
    anomaly_status: AnomalyEvaluation

# Historical sample response
class WaterSampleRecord(BaseModel):
    id: int
    created_at: datetime
    ph: Optional[float]
    hardness: Optional[float]
    solids: Optional[float]
    chloramines: Optional[float]
    sulfate: Optional[float]
    conductivity: Optional[float]
    organic_carbon: Optional[float]
    trihalomethanes: Optional[float]
    turbidity: Optional[float]
    potability: int
    is_potable: bool
    confidence: float
    verdict: str
    is_anomaly: bool
    anomaly_reasons: Optional[str]
    source: str

    class Config:
        from_attributes = True

# Schema for Batch PDF Report Request
class SelectedReportsRequest(BaseModel):
    sample_ids: List[int] = Field(..., min_length=1, description="List of sample IDs to include in the PDF report")

# Dashboard statistics schema
class DashboardStatsResponse(BaseModel):
    total_samples: int
    potable_count: int
    non_potable_count: int
    potable_percentage: float
    anomaly_count: int
    anomaly_percentage: float
    average_ph: Optional[float]
    average_turbidity: Optional[float]
    average_solids: Optional[float]
    latest_verdict: Optional[str]

# ESP32 IoT Schemas
class IoTDeviceRegister(BaseModel):
    device_id: str
    device_name: str
    location_name: Optional[str] = "Main Intake Tank"
    api_key: Optional[str] = "aquawatch-secret-key-2026"
    firmware_version: Optional[str] = "1.0.0"

class IoTDeviceResponse(BaseModel):
    device_id: str
    device_name: str
    location_name: Optional[str]
    status: str
    registered_at: datetime
    last_seen_at: Optional[datetime]
    firmware_version: str

    class Config:
        from_attributes = True

class IoTReadingInput(BaseModel):
    device_id: str
    api_key: str
    is_simulated: Optional[bool] = False
    ph: Optional[float] = None
    tds: Optional[float] = None
    turbidity: Optional[float] = None
    temperature: Optional[float] = None
    conductivity: Optional[float] = None
    ph_voltage: Optional[float] = None
    tds_voltage: Optional[float] = None
    turbidity_voltage: Optional[float] = None

class IoTReadingResponse(BaseModel):
    id: int
    device_id: str
    timestamp: datetime
    is_simulated: bool
    ph: Optional[float]
    tds: Optional[float]
    turbidity: Optional[float]
    temperature: Optional[float]
    conductivity: Optional[float]
    rule_status: str
    rule_violations: Optional[str]
    ai_status: str
    ai_message: str

    class Config:
        from_attributes = True
