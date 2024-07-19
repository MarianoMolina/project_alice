import logging, asyncio, functools
from typing import List
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from workflow_logic.core.communication import MessageDict, DatabaseTaskResponse, MessageDict
from workflow_logic.api.db_app.db import token_validation_middleware, ContainerAPI
from workflow_logic.util.const import BACKEND_PORT, FRONTEND_PORT, HOST, FRONTEND_PORT_DOCKER, BACKEND_PORT_DOCKER, FRONTEND_HOST, BACKEND_HOST
from concurrent.futures import ThreadPoolExecutor
from workflow_logic.api.api_util.api_utils import TaskExecutionRequest, deep_api_check
from workflow_logic.api.db_app.initialization_data import DB_STRUCTURE

db_app = None
thread_pool = None

# Initialize db_app
@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_app, thread_pool
    db_app = ContainerAPI()
    await db_app.initialize_db_app()
    thread_pool = ThreadPoolExecutor()
    yield
    # Clean up resources if necessary

api_app = FastAPI(lifespan=lifespan)

# Middleware
origins = [
    f"http://{HOST}",
    f"http://{HOST}:{BACKEND_PORT}",
    f"http://{HOST}:{FRONTEND_PORT}",
    f"http://localhost:{BACKEND_PORT}",
    f"http://localhost:{FRONTEND_PORT}",
    f"http://{BACKEND_HOST}:{BACKEND_PORT_DOCKER}",
    f"http://{FRONTEND_HOST}:{FRONTEND_PORT_DOCKER}",
]

api_app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@api_app.get("/health")
async def health_check() -> dict:
    return {"status": "OK", "message": "NEW HEALTH CHECK - Workflow service is healthy"}

@api_app.middleware("http")
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

    validation = token_validation_middleware(db_app)(request)
    if not validation["valid"]:
        raise HTTPException(status_code=401, detail=validation["message"])

    db_app.user_token = token  # Set only the token part for the db_app
    response = await call_next(request)
    return response
    
@api_app.post("/validate-token")
def validate_token(request: Request) -> dict[str, bool]:
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Access denied. No token provided.")
    token = token.split(" ")[1]
    return db_app.validate_token(token)
    
@api_app.post("/execute_task", response_model=DatabaseTaskResponse)
async def execute_task_endpoint(request: TaskExecutionRequest) -> dict:
    print(f'execute_task_endpoint: {request}')
    taskId = request.taskId
    inputs = request.inputs
    inputs_copy = inputs.copy()
    task = None
    try:
        task = await db_app.get_tasks(taskId)
        if not task or not task.get(taskId):
            raise ValueError(f"Task with ID {taskId} not found")
        task = task[taskId]
        
        # Retrieve API manager
        api_manager = await db_app.api_setter()
        
        # Perform deep API availability check
        api_check_result = await deep_api_check(task, api_manager)
        print(f'API Check Result: {api_check_result}')
        
        if api_check_result["status"] == "warning":
            print(f'API Warning: {api_check_result["warnings"]}')
            print(f'Api_check_result: {api_check_result}')
        
        # Add api_manager to inputs
        inputs['api_manager'] = api_manager
        
        print(f'task: {task}')
        print(f'task_inputs: {inputs_copy}')
        print(f'task type: {type(task)}')
        
        result = await task.a_execute(**inputs)
        
        print(f'task_result: {result.model_dump()}')
        print(f'type: {type(result)}')
        db_result = await db_app.store_task_response(result)
        print(f'db_result: {db_result.model_dump(by_alias=True)}')
        return db_result.model_dump(by_alias=True)
    except Exception as e:
        import traceback
        result = DatabaseTaskResponse(
            task_id=taskId,
            task_name=task.task_name if task else "Unknown",
            task_description=task.task_description if task else "Task execution failed",
            status="failed",
            result_code=1,
            task_outputs=None,
            task_inputs=inputs_copy,
            result_diagnostic=str(f'Error: {e}\nTraceback: {traceback.format_exc()}'),
            usage_metrics=None,
            execution_history=None
        )
        db_result = await db_app.store_task_response(result)
        return db_result.model_dump(by_alias=True)

@api_app.post("/chat_response/{chat_id}")
async def chat_response(chat_id: str) -> List[MessageDict]:
    logging.info(f'Generating chat response for id {chat_id}')
    chat_data = await db_app.get_chats(chat_id)
    if not chat_data:
        raise HTTPException(status_code=404, detail="Chat not found")
   
    logging.info(f'Chat_data: {chat_data}')
    
    # Retrieve API manager
    api_manager = await db_app.api_setter()
    
    # Perform deep API availability check
    api_check_result = await deep_api_check(chat_data[chat_id], api_manager)
    print(f'API Check Result: {api_check_result}')
    
    if api_check_result["status"] == "warning":
        print(f'API Warning: {api_check_result["warnings"]}')
   
    responses = await chat_data[chat_id].generate_response(api_manager)
   
    logging.info(f'Responses: {responses}')
   
    # Store messages and task results asynchronously
    if responses:
        await asyncio.gather(*[db_app.store_chat_message(chat_id, response) for response in responses])
        responses = [MessageDict(**response) for response in responses]
        logging.info(f'Extracted messages: {responses}')
        return responses
   
    return []

@api_app.post("/initialize_user_database/")
async def initialize_user_database(
    request: Request,
    ) -> dict:
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
            raise HTTPException(status_code=500, detail=f"Error initializing user database: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error initializing user database: {str(e)}")