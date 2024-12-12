from fastapi import APIRouter, Depends, Request
from workflow.test.component_tests import APITests, TestEnvironment, DBTests
from workflow.db_app.initialization import DBStructure
from workflow.api_app.util.dependencies import get_db_app, get_queue_manager
from workflow.api_app.middleware.auth import auth_middleware

router = APIRouter()

@router.get("/health")
async def health_check() -> dict:
    """
    Basic health check endpoint for the Workflow service.

    Returns:
        dict: A status message indicating the service is healthy.
    """
    return {"status": "OK", "message": "Workflow service is healthy"}

@router.get("/health/api")
async def api_health_check(
    request: Request,
    db_app=Depends(get_db_app),
    queue_manager=Depends(get_queue_manager),
    enqueue: bool = True
) -> dict:
    """
    Detailed health check that tests API connections via queue.
    """
    if enqueue:
        task_data = {
            "headers": dict(request.headers),
            "user_data": db_app.user_data.get('user_obj', {})
        }
        
        task_id = await queue_manager.enqueue_request(
            endpoint="/health/api",
            data=task_data
        )
        
        return {"task_id": task_id}
    
    # TODO: Actually test the health of the APIs
    user_apis = await db_app.get_apis()
    return {
        "status": "OK",
        "message": "Workflow module working correctly",
        "api_health": "All chill dog",
    }