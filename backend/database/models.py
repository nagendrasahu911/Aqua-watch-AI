from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime
from backend.database.session import Base

class WaterSample(Base):
    __tablename__ = "water_samples"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # 9 chemical features
    ph = Column(Float, nullable=True)
    hardness = Column(Float, nullable=True)
    solids = Column(Float, nullable=True)
    chloramines = Column(Float, nullable=True)
    sulfate = Column(Float, nullable=True)
    conductivity = Column(Float, nullable=True)
    organic_carbon = Column(Float, nullable=True)
    trihalomethanes = Column(Float, nullable=True)
    turbidity = Column(Float, nullable=True)

    # ML Predictions & Status
    potability = Column(Integer, nullable=False) # 0 or 1
    is_potable = Column(Boolean, nullable=False)
    confidence = Column(Float, nullable=False)
    verdict = Column(String, nullable=False)

    # Anomaly status
    is_anomaly = Column(Boolean, default=False)
    anomaly_reasons = Column(String, nullable=True)
    source = Column(String, default="single_api") # "single_api", "csv_upload", or "iot_hardware"

class IoTDevice(Base):
    __tablename__ = "iot_devices"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    device_id = Column(String, unique=True, index=True, nullable=False)
    device_name = Column(String, nullable=False)
    location_name = Column(String, nullable=True)
    api_key = Column(String, nullable=False)
    registered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_seen_at = Column(DateTime, nullable=True)
    status = Column(String, default="ACTIVE") # "ACTIVE", "OFFLINE", "WARNING"
    firmware_version = Column(String, default="1.0.0")

class IoTReading(Base):
    __tablename__ = "iot_readings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    device_id = Column(String, index=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    is_simulated = Column(Boolean, default=False, nullable=False) # STRICT separation: False=real hardware, True=simulated

    # Hardware measurements
    ph = Column(Float, nullable=True)
    tds = Column(Float, nullable=True) # mg/L or ppm
    turbidity = Column(Float, nullable=True) # NTU
    temperature = Column(Float, nullable=True) # Celsius
    conductivity = Column(Float, nullable=True) # uS/cm

    # Raw voltage telemetry for sensor diagnostics & calibration verification
    ph_voltage = Column(Float, nullable=True)
    tds_voltage = Column(Float, nullable=True)
    turbidity_voltage = Column(Float, nullable=True)

    # Rule-based threshold evaluation
    rule_status = Column(String, default="NORMAL") # "NORMAL", "WARNING", "CRITICAL"
    rule_violations = Column(String, nullable=True)

    # ML Status (Explicitly distinguishes full 9-param AI prediction from incomplete IoT data)
    ai_status = Column(String, default="INSUFFICIENT_DATA")
    ai_message = Column(String, default="Insufficient sensor data for complete AI analysis.")
