from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "service": "AquaWatch AI",
        "version": "0.1.0"
    }
