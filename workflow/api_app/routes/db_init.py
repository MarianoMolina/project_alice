from fastapi import APIRouter, Request, HTTPException, Depends
from workflow.api_app.util.dependencies import get_db_app
from workflow.db_app.initialization import DB_STRUCTURE
from workflow.util.logging_config import LOGGER

router = APIRouter()

@router.post("/initialize_user_database/")
async def initialize_user_database(request: Request, db_app=Depends(get_db_app)) -> dict:
    """
    Initialize the user's database with the default structure.

    This endpoint checks if the user's database is empty and then initializes it
    with the predefined database structure (DB_STRUCTURE).

    Args:
        request (Request): The incoming request object.
        db_app: The database application instance (injected dependency).

    Returns:
        dict: A message indicating successful initialization.

    Raises:
        HTTPException: 
            - 401 if no authorization token is provided.
            - 400 if the user database already exists.
            - 500 if there's an error during initialization.

    Note:
        This endpoint requires a valid authorization token in the request headers.
    """
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Access denied. No token provided.")
    try:
        # Validate this user has an otherwise empty DB
        user_db = await db_app.check_existing_data()
        if user_db:
            raise HTTPException(status_code=400, detail="User database already exists")
        try:
            # Initialize the database using the existing method
            success = await db_app.initialize_database(DB_STRUCTURE)
           
            if success:
                return {"message": "User database initialized successfully"}
            else:
                raise HTTPException(status_code=500, detail="Failed to initialize user database")
       
        except Exception as e:
            LOGGER.error(f"Error initializing user database: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error initializing user database: {str(e)}")
    except Exception as e:
        LOGGER.error(f"Error initializing user database: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error initializing user database: {str(e)}")