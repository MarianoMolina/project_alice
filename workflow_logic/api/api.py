import logging, asyncio, functools
from typing import List
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from workflow_logic.core.communication import MessageDict, DatabaseTaskResponse, MessageDict
from workflow_logic.api.db import available_task_types, token_validation_middleware, ContainerAPI
from workflow_logic.util.const import BACKEND_PORT, FRONTEND_PORT, HOST, FRONTEND_PORT_DOCKER, BACKEND_PORT_DOCKER, FRONTEND_HOST, BACKEND_HOST
from concurrent.futures import ThreadPoolExecutor
from workflow_logic.api.api_utils import TaskExecutionRequest, inject_llm_config_in_task

libraries = None
thread_pool = None

# Initialize libraries
@asynccontextmanager
async def lifespan(app: FastAPI):
    global libraries, thread_pool
    libraries = ContainerAPI()
    await libraries.initialize_libraries()
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

    validation = token_validation_middleware(libraries)(request)
    if not validation["valid"]:
        raise HTTPException(status_code=401, detail=validation["message"])
    response = await call_next(request)
    return response

@api_app.post("/execute_task", response_model=DatabaseTaskResponse)
async def execute_task_endpoint(request: TaskExecutionRequest) -> dict:
    print(f'execute_task_endpoint: {request}')
    taskId = request.taskId
    inputs = request.inputs
    task = None
    try:
        task = await libraries.get_tasks(taskId)
        if not task or not task.get(taskId):
            raise ValueError(f"Task with ID {taskId} not found")
        task = task[taskId]
        llm_config = libraries.model_manager.default_model.autogen_llm_config
        task = inject_llm_config_in_task(task, llm_config)
        print(f'task: {task}')
        print(f'task_inputs: {inputs}')
        print(f'task type: {type(task)}')
        # Run the synchronous task in a thread pool
        loop = asyncio.get_running_loop()
        func = functools.partial(task.execute, **inputs)
        result = await loop.run_in_executor(thread_pool, func)
        print(f'task_result: {result.model_dump()}')
        print(f'type: {type(result)}')
        db_result = await libraries.store_task_response(result)
        print(f'db_result: {db_result.model_dump()}')
        return db_result.model_dump(by_alias=True, exclude_unset=True)
    except Exception as e:
        import traceback
        result = DatabaseTaskResponse(
            task_id=taskId,
            task_name=task.task_name if task else "Unknown",
            task_description=task.task_description if task else "Task execution failed",
            status="failed",
            result_code=1,
            task_outputs=None,
            task_inputs=inputs,
            result_diagnostic=str(f'Error: {e}\nTraceback: {traceback.format_exc()}'),
            usage_metrics=None,
            execution_history=None
        )
        db_result = await libraries.store_task_response(result)
        return db_result.model_dump(by_alias=True, exclude_unset=True)
    
@api_app.post("/validate-token")
def validate_token(request: Request) -> dict[str, bool]:
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Access denied. No token provided.")
    token = token.split(" ")[1]
    return libraries.validate_token(token)

@api_app.post("/chat_response/{chat_id}")
async def chat_response(chat_id: str) -> List[MessageDict]:
    logging.info(f'Generating chat response for id {chat_id}')
    chat_data = await libraries.get_chats(chat_id)
    if not chat_data:
        raise HTTPException(status_code=404, detail="Chat not found")
   
    logging.info(f'Chat_data: {chat_data}')
   
    # Run generate_response in a thread pool
    loop = asyncio.get_running_loop()
    responses = await loop.run_in_executor(thread_pool, chat_data[chat_id].generate_response)
   
    logging.info(f'Responses: {responses}')
   
    # Store messages and task results asynchronously
    if responses:
        await asyncio.gather(*[libraries.store_chat_message(chat_id, response) for response in responses])
        responses = [MessageDict(**response) for response in responses]
        logging.info(f'Extracted messages: {responses}')
        return responses
   
    return []