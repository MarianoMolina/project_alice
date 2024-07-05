import logging, asyncio, functools
from pydantic import BaseModel
from typing import Dict, Any, List
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from workflow_logic.util.task_utils import TaskResponse, MessageDict, DatabaseTaskResponse, OutputInterface
from workflow_logic.util.utils import LLMConfig
from workflow_logic.core.tasks.task import  AliceTask
from workflow_logic.api.db import available_task_types, token_validation_middleware, ContainerAPI
from workflow_logic.util.const import BACKEND_PORT, FRONTEND_PORT, HOST, FRONTEND_PORT_DOCKER, BACKEND_PORT_DOCKER, FRONTEND_HOST, BACKEND_HOST
from concurrent.futures import ThreadPoolExecutor

libraries = None
thread_pool = None

# Local util
def create_task_from_json(task_dict: dict) -> AliceTask:
    logging.info(f"Creating task from JSON: {task_dict}")
    logging.info(f"Available task types: {available_task_types}")
    task_type = task_dict.pop("task_type", "")
    if not task_type:
        raise ValueError("Task type not specified in task definition.")
    for task in available_task_types:
        if task_type == task.__name__:
            logging.info(f"Creating task of type {task_type}")
            return task.model_validate(**task_dict)
    raise ValueError(f"Task type {task_type} not found in available task types.")

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

@api_app.middleware("http")
async def auth_middleware(request: Request, call_next):
    # Skip authorization for OPTIONS requests
    if request.method == "OPTIONS":
        response = await call_next(request)
        return response

    validation = token_validation_middleware(libraries)(request)
    if not validation["valid"]:
        raise HTTPException(status_code=401, detail=validation["message"])
    response = await call_next(request)
    return response

class TaskExecutionRequest(BaseModel):
    taskId: str
    inputs: Dict[str, Any]

def inject_llm_config(task: AliceTask, llm_config: LLMConfig):
    if task.agent_id and not task.agent_id.llm_config:
        task.agent_id.llm_config = llm_config
    if task.tasks:
        for subtask in task.tasks.values():
            subtask = inject_llm_config(subtask, llm_config)
    return task
@api_app.post("/execute_task", response_model=TaskResponse)
async def execute_task_endpoint(request: TaskExecutionRequest) -> TaskResponse:
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
        task = inject_llm_config(task, llm_config)
        print(f'task: {task}')
        print(f'task type: {type(task)}')
        
        # Run the synchronous task in a thread pool
        loop = asyncio.get_running_loop()
        func = functools.partial(task.execute, **inputs)
        result = await loop.run_in_executor(thread_pool, func)
        
        print(f'Raw result: {result}')
        print(f'Result type: {type(result)}')
        print(f'Result attributes: {dir(result)}')
        
        # Try to identify problematic fields
        for attr in dir(result):
            if not attr.startswith('__'):
                try:
                    value = getattr(result, attr)
                    print(f'{attr}: {type(value)}')
                    if isinstance(value, OutputInterface):
                        print(f'OutputInterface content: {value.content}')
                        print(f'OutputInterface type: {type(value.content)}')
                except Exception as e:
                    print(f'Error accessing {attr}: {e}')
        
        # Try serializing manually
        try:
            serialized = {
                "task_id": result.task_id,
                "task_name": result.task_name,
                "task_description": result.task_description,
                "status": result.status,
                "result_code": result.result_code,
                "task_outputs": str(result.task_outputs) if result.task_outputs else None,
                "result_diagnostic": result.result_diagnostic,
                "task_inputs": result.task_inputs,
                "usage_metrics": result.usage_metrics,
                "execution_history": result.execution_history
            }
            print(f'Manually serialized result: {serialized}')
        except Exception as e:
            print(f'Error manually serializing: {e}')
        
        db_result = await libraries.store_task_response(result)
        return db_result.model_dump()
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
        return db_result.model_dump()
# @api_app.post("/execute_task", response_model=TaskResponse)
# async def execute_task_endpoint(request: TaskExecutionRequest) -> dict:
#     print(f'execute_task_endpoint: {request}')
#     taskId = request.taskId
#     inputs = request.inputs
#     task = None
#     try:
#         task = await libraries.get_tasks(taskId)
#         if not task or not task.get(taskId):
#             raise ValueError(f"Task with ID {taskId} not found")
#         task = task[taskId]
#         llm_config = libraries.model_manager.default_model.autogen_llm_config
#         task = inject_llm_config(task, llm_config)
#         print(f'task: {task}')
#         print(f'task type: {type(task)}')
#         # Run the synchronous task in a thread pool
#         loop = asyncio.get_running_loop()
#         func = functools.partial(task.execute, **inputs)
#         result = await loop.run_in_executor(thread_pool, func)
#         print(f'task_result: {result}')
#         print(f'type: {type(result)}')
#         db_result = await libraries.store_task_response(result)
#         return db_result.model_dump()
#     except Exception as e:
#         import traceback
#         result = DatabaseTaskResponse(
#             task_id=taskId,
#             task_name=task.task_name if task else "Unknown",
#             task_description=task.task_description if task else "Task execution failed",
#             status="failed",
#             result_code=1,
#             task_outputs=None,
#             task_inputs=inputs,
#             result_diagnostic=str(f'Error: {e}\nTraceback: {traceback.format_exc()}'),
#             usage_metrics=None,
#             execution_history=None
#         )
#         db_result = await libraries.store_task_response(result)
#         return db_result.model_dump()
    
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
    responses, task_results = await loop.run_in_executor(thread_pool, chat_data[chat_id].generate_response)
    
    logging.info(f'Responses: {responses}')
    
    # Store messages and task results asynchronously
    if responses:
        responses = await asyncio.gather(*[libraries.store_chat_message(chat_id, response) for response in responses])
    
    if task_results:
        task_results = await asyncio.gather(*[libraries.store_task_response_on_chat(result, chat_id) for result in task_results])
    
    return responses