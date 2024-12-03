from fastapi import Request, HTTPException
from workflow.db_app.app import token_validation_middleware
from workflow.util import LOGGER

async def auth_middleware(request: Request, call_next):
    # Skip authorization for OPTIONS requests and health check
    if request.method == "OPTIONS" or request.url.path == "/health":
        response = await call_next(request)
        return response

    LOGGER.debug(f"Auth middleware handling request for path: {request.url.path}")
    token = None
    
    # Check for WebSocket upgrade request
    if request.url.path.startswith("/ws/"):
        # Get token from query params for WebSocket
        token = request.query_params.get("token")
        LOGGER.debug(f"WebSocket token from query params: {token[:20]}..." if token else "No token")
    else:
        # Get token from header for HTTP
        auth_header = request.headers.get("Authorization")
        LOGGER.debug(f"HTTP Authorization header: {auth_header[:20]}..." if auth_header else "No auth header")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        LOGGER.error("No token found in request")
        raise HTTPException(status_code=401, detail="Access denied. No token provided.")

    # Get db_app from app state
    db_app = request.app.state.db_app
    if db_app is None:
        LOGGER.error("db_app not found in app state")
        raise HTTPException(status_code=503, detail="Service not ready. Please try again later.")

    # Use token_validation_middleware
    validation = token_validation_middleware(db_app)(request)
    LOGGER.debug(f"Token validation result: {validation}")
    if not validation["valid"]:
        LOGGER.error(f"Token validation failed: {validation['message']}")
        raise HTTPException(status_code=401, detail=validation["message"])

    db_app.user_data['user_token'] = token
    db_app.user_data['user_obj'] = validation["user"]
    response = await call_next(request)
    return response