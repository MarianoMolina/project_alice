from fastapi import APIRouter, Request, HTTPException, Depends
from workflow_logic.db_app.initialization_data import DB_STRUCTURE
from workflow_logic.util.logging_config import LOGGER
from workflow_logic.api_app.util.dependencies import get_db_app

router = APIRouter()

@router.post("/initialize_user_database/")
async def initialize_user_database(request: Request, db_app=Depends(get_db_app)) -> dict:
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