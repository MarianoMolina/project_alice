from fastapi import APIRouter, Depends, HTTPException, Request
from workflow_logic.tests.component_tests.test_environment import TestEnvironment
from workflow_logic.tests.component_tests.api_test import APITests
from workflow_logic.db_app.initialization import DBStructure
from workflow_logic.api_app.util.dependencies import get_db_app
from workflow_logic.api_app.middleware.auth import auth_middleware

router = APIRouter()

@router.get("/health")
async def health_check() -> dict:
    """
    Basic health check endpoint for the Workflow service.

    Returns:
        dict: A status message indicating the service is healthy.
    """
    return {"status": "OK", "message": "Workflow service is healthy"}

@router.get("/health/admin")
async def admin_health_check(request: Request) -> dict:
    """
    Admin-level health check endpoint.

    This endpoint provides more detailed health information, including initial test results.
    It requires admin-level access.

    Args:
        request (Request): The incoming request object.

    Returns:
        dict: Detailed health status including initial test results.

    Raises:
        HTTPException: 403 error if the user doesn't have admin access.
    """
    if not request.state.user or request.state.user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
   
    return {
        "status": "OK",
        "message": "Admin health check",
        "initial_test_results": request.app.state.initial_test_results
    }

@router.get("/health/user")
async def user_health_check(request: Request, db_app=Depends(get_db_app)) -> dict:
    """
    User-level health check endpoint.

    This endpoint runs API tests for the user's configured APIs and updates their health status
    in the database.

    Args:
        request (Request): The incoming request object.
        db_app: The database application instance (injected dependency).

    Returns:
        dict: Health status of the user's APIs.

    Raises:
        HTTPException: 404 error if no APIs are found for the user.

    Note:
        This endpoint updates the health status of each API in the database based on test results.
    """
    user_apis = await db_app.get_apis()
   
    if not user_apis:
        raise HTTPException(status_code=404, detail="No APIs found for this user")

    test_env = TestEnvironment()
    api_tests = APITests()
    await test_env.add_module(api_tests)
    test_settings = {
        "db_structure": DBStructure(apis=user_apis),
        "verbose": True
    }
    user_test_results = await test_env.run(**test_settings)

    # Update API health status in the database
    for api_name, result in user_test_results["APITests"]["test_results"].items():
        api_id = [api["_id"] for api in user_apis if api["api_name"] == api_name][0]
        if api_id and isinstance(api_id, str):
            await db_app.update_api_health(api_id, "healthy" if result == "Success" else "unhealthy")

    return {
        "status": "OK",
        "message": "User health check completed",
        "api_health": user_test_results["APITests"]
    }

# Apply auth middleware to admin and user health check routes
router.routes[-2].dependencies.append(Depends(auth_middleware))
router.routes[-1].dependencies.append(Depends(auth_middleware))