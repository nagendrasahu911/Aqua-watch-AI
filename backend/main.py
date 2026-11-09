from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database.session import engine, Base
from backend.database import models
from backend.routes.water_api import router as water_router
from backend.routes.iot_api import router as iot_router
from backend.ml.prediction import get_predictor

# Create SQLite database tables on import
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and pre-warm model
    Base.metadata.create_all(bind=engine)
    get_predictor()
    yield

app = FastAPI(
    title="AquaWatch AI API",
    description="Smart Water Quality Intelligence Platform - Machine Learning & Telemetry Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Enable CORS for frontend applications (React, Vite, local development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include route endpoints
app.include_router(water_router, tags=["Water Quality Intelligence"])
app.include_router(iot_router)

@app.get("/", summary="Root Welcome")
def root():
    return {
        "platform": "AquaWatch AI",
        "status": "online",
        "docs": "/docs",
        "version": "1.0.0",
        "message": "Welcome to AquaWatch AI Smart Water Quality Intelligence Platform API"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
