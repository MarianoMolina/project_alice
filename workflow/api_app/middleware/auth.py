from fastapi import Request, HTTPException
from workflow.db_app.app import token_validation_middleware

async def auth_middleware(request: Request, call_next):
    # Skip authorization for OPTIONS requests and health check
    if request.method == "OPTIONS" or request.url.path == "/health":
        response = await call_next(request)
        return response

    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Access denied. No token provided.")

    # Extract the token part
    token = auth_header.split(" ")[-1]

    # Get db_app from app state
    db_app = request.app.state.db_app

    # Check if db_app is initialized
    if db_app is None:
        raise HTTPException(status_code=503, detail="Service not ready. Please try again later.")

    # Use token_validation_middleware
    validation = token_validation_middleware(db_app)(request)
    if not validation["valid"]:
        raise HTTPException(status_code=401, detail=validation["message"])

    db_app.user_data['user_token'] = token  # Set only the token part for the db_app
    db_app.user_data['user_obj'] = validation["user"]  # Set the user for the db_app
    response = await call_next(request)
    return response