from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check() -> dict:
    return {"status": "OK", "message": "NEW HEALTH CHECK - Workflow service is healthy"}