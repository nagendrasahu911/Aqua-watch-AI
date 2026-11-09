from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database.session import get_db
from backend.database.models import IoTDevice, IoTReading
from backend.models.schemas import (
    IoTDeviceRegister,
    IoTDeviceResponse,
    IoTReadingInput,
    IoTReadingResponse
)

router = APIRouter(prefix="/iot", tags=["IoT Hardware Integration"])

DEFAULT_MASTER_KEY = "aquawatch-secret-key-2026"

def verify_device_auth(device_id: str, api_key: str, db: Session) -> IoTDevice:
    device = db.query(IoTDevice).filter(IoTDevice.device_id == device_id).first()
    if not device:
        # Auto-register if master key matches (convenient for plug-and-play hackathon setups)
        if api_key == DEFAULT_MASTER_KEY:
            device = IoTDevice(
                device_id=device_id,
                device_name=f"ESP32 Station {device_id}",
                location_name="Field Node",
                api_key=api_key,
                status="ACTIVE"
            )
            db.add(device)
            db.commit()
            db.refresh(device)
            return device
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device '{device_id}' is not registered. Please register first."
        )

    if device.api_key != api_key and api_key != DEFAULT_MASTER_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid device credentials or API key."
        )

    return device

# 1. POST /iot/devices/register
@router.post("/devices/register", response_model=IoTDeviceResponse, summary="Register an ESP32 hardware device")
def register_device(device_in: IoTDeviceRegister, db: Session = Depends(get_db)):
    existing = db.query(IoTDevice).filter(IoTDevice.device_id == device_in.device_id).first()
    if existing:
        existing.device_name = device_in.device_name
        existing.location_name = device_in.location_name
        existing.firmware_version = device_in.firmware_version
        if device_in.api_key:
            existing.api_key = device_in.api_key
        existing.status = "ACTIVE"
        db.commit()
        db.refresh(existing)
        return existing

    new_device = IoTDevice(
        device_id=device_in.device_id,
        device_name=device_in.device_name,
        location_name=device_in.location_name,
        api_key=device_in.api_key or DEFAULT_MASTER_KEY,
        firmware_version=device_in.firmware_version or "1.0.0",
        status="ACTIVE"
    )
    db.add(new_device)
    db.commit()
    db.refresh(new_device)
    return new_device

# 2. GET /iot/devices
@router.get("/devices", response_model=List[IoTDeviceResponse], summary="List all registered ESP32 devices")
def list_devices(db: Session = Depends(get_db)):
    devices = db.query(IoTDevice).all()
    # Check for offline status (no heartbeat in > 5 minutes)
    now = datetime.now(timezone.utc)
    for dev in devices:
        if dev.last_seen_at:
            delta_seconds = (now - dev.last_seen_at.replace(tzinfo=timezone.utc)).total_seconds()
            if delta_seconds > 300 and dev.status != "OFFLINE":
                dev.status = "OFFLINE"
    db.commit()
    return devices

# 3. GET /iot/devices/{device_id}/status
@router.get("/devices/{device_id}/status", summary="Check specific device connection status and telemetry")
def get_device_status(device_id: str, db: Session = Depends(get_db)):
    device = db.query(IoTDevice).filter(IoTDevice.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail=f"Device '{device_id}' not found.")

    latest_reading = db.query(IoTReading).filter(
        IoTReading.device_id == device_id
    ).order_by(desc(IoTReading.timestamp)).first()

    return {
        "device_id": device.device_id,
        "device_name": device.device_name,
        "location_name": device.location_name,
        "status": device.status,
        "firmware_version": device.firmware_version,
        "registered_at": device.registered_at,
        "last_seen_at": device.last_seen_at,
        "latest_reading": {
            "timestamp": latest_reading.timestamp if latest_reading else None,
            "is_simulated": latest_reading.is_simulated if latest_reading else False,
            "ph": latest_reading.ph if latest_reading else None,
            "tds": latest_reading.tds if latest_reading else None,
            "turbidity": latest_reading.turbidity if latest_reading else None,
            "temperature": latest_reading.temperature if latest_reading else None,
            "rule_status": latest_reading.rule_status if latest_reading else "NO_DATA",
            "ai_status": latest_reading.ai_status if latest_reading else "NO_DATA",
            "ai_message": latest_reading.ai_message if latest_reading else "No telemetry received yet."
        } if latest_reading else None
    }

# 4. POST /iot/readings
@router.post("/readings", response_model=IoTReadingResponse, summary="Ingest real or simulated ESP32 sensor telemetry")
def ingest_reading(payload: IoTReadingInput, db: Session = Depends(get_db)):
    # Authenticate device
    device = verify_device_auth(payload.device_id, payload.api_key, db)

    # Duplicate reading protection (reject identical timestamp & measurements within 2 seconds)
    latest = db.query(IoTReading).filter(
        IoTReading.device_id == payload.device_id
    ).order_by(desc(IoTReading.timestamp)).first()
    
    now = datetime.now(timezone.utc)
    if latest and (now - latest.timestamp.replace(tzinfo=timezone.utc)).total_seconds() < 2.0:
        if (latest.ph == payload.ph and latest.tds == payload.tds and latest.turbidity == payload.turbidity):
            # Duplicate reading sent in rapid succession; return existing without inserting duplicate
            return latest

    # Evaluate WHO physical/chemical threshold rules for IoT parameters
    violations = []
    if payload.ph is not None:
        if payload.ph < 6.5 or payload.ph > 8.5:
            violations.append(f"pH {payload.ph:.2f} is outside WHO safe drinking range (6.5 - 8.5).")
    if payload.tds is not None:
        if payload.tds > 1000.0:
            violations.append(f"TDS {payload.tds:.0f} ppm exceeds desirable drinking threshold (1000 ppm).")
    if payload.turbidity is not None:
        if payload.turbidity > 5.0:
            violations.append(f"Turbidity {payload.turbidity:.2f} NTU exceeds WHO clarity limit (5.0 NTU).")
    if payload.temperature is not None:
        if payload.temperature > 35.0:
            violations.append(f"High water temperature ({payload.temperature:.1f} °C) accelerates bacterial growth.")

    rule_status = "NORMAL"
    if len(violations) == 1:
        rule_status = "WARNING"
    elif len(violations) >= 2:
        rule_status = "CRITICAL"

    # PART 5: Rigorous ML Compatibility Protection
    # The trained 9-feature model CANNOT safely classify drinking water potability without
    # Hardness, Chloramines, Sulfate, Organic Carbon, and Trihalomethanes.
    ai_status = "INSUFFICIENT_DATA"
    ai_message = "Insufficient sensor data for complete AI analysis (measured 4 parameters; 9 required for certified ML potability screening)."

    db_reading = IoTReading(
        device_id=payload.device_id,
        timestamp=now,
        is_simulated=payload.is_simulated,
        ph=payload.ph,
        tds=payload.tds,
        turbidity=payload.turbidity,
        temperature=payload.temperature,
        conductivity=payload.conductivity,
        ph_voltage=payload.ph_voltage,
        tds_voltage=payload.tds_voltage,
        turbidity_voltage=payload.turbidity_voltage,
        rule_status=rule_status,
        rule_violations="; ".join(violations) if violations else None,
        ai_status=ai_status,
        ai_message=ai_message
    )
    db.add(db_reading)

    # Update device heartbeat
    device.last_seen_at = now
    device.status = "ACTIVE"
    db.commit()
    db.refresh(db_reading)

    return db_reading

# 5. GET /iot/readings/latest
@router.get("/readings/latest", response_model=Optional[IoTReadingResponse], summary="Get most recent reading for a device")
def get_latest_reading(
    device_id: Optional[str] = Query(None, description="Optional device ID filter"),
    is_simulated: Optional[bool] = Query(None, description="Filter by real (False) or simulated (True)"),
    db: Session = Depends(get_db)
):
    query = db.query(IoTReading)
    if device_id:
        query = query.filter(IoTReading.device_id == device_id)
    if is_simulated is not None:
        query = query.filter(IoTReading.is_simulated == is_simulated)
    return query.order_by(desc(IoTReading.timestamp)).first()

# 6. GET /iot/readings/history
@router.get("/readings/history", response_model=List[IoTReadingResponse], summary="Retrieve chronological IoT telemetry readings")
def get_readings_history(
    device_id: Optional[str] = Query(None, description="Filter by device ID"),
    is_simulated: Optional[bool] = Query(None, description="Filter strictly: False=Hardware, True=Simulation"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(IoTReading)
    if device_id:
        query = query.filter(IoTReading.device_id == device_id)
    if is_simulated is not None:
        query = query.filter(IoTReading.is_simulated == is_simulated)
    return query.order_by(desc(IoTReading.timestamp)).offset(offset).limit(limit).all()
