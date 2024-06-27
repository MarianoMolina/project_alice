import logging
from pydantic import ValidationError
from typing import Dict, Any, List
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from workflow_logic.util.task_utils import TaskResponse, MessageDict
from workflow_logic.core.tasks.task import  AliceTask
from workflow_logic.api.db import available_task_types, token_validation_middleware, ContainerAPI
from workflow_logic.util.const import BACKEND_PORT, FRONTEND_PORT, HOST, FRONTEND_PORT_DOCKER, BACKEND_PORT_DOCKER, FRONTEND_HOST, BACKEND_HOST

libraries = None

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
    global libraries
    libraries = ContainerAPI()
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

# Endpoints
@api_app.post("/execute_task", response_model=TaskResponse)
def execute_task_endpoint(task_name: str, inputs: Dict[str, Any]) -> TaskResponse:
    try:
        task = libraries.task_library.get_task(task_name)
        result = task.execute(**inputs)
        libraries.store_task_response(result)
        return result
    except Exception as e:
        return TaskResponse(
            task_name=task_name,
            task_description=task.description,
            status="failed",
            result_code=0,
            task_outputs=None,
            task_inputs=inputs,
            result_diagnostic=str(e),
            usage_metrics=None,
            execution_history=None
        )

@api_app.post("/execute_task_from_definition", response_model=TaskResponse)
def execute_task_from_definition_endpoint(task_kwargs: Dict[str, Any], input_kwargs: Dict[str, Any]) -> TaskResponse:
    try:
        task_kwargs["agent_library"] = libraries.agent_library
        task_kwargs["template_library"] = libraries.template_library
        task = create_task_from_json(task_kwargs)
        result = task.execute(**input_kwargs)
        libraries.store_task_response(result)
        return result
    except ValidationError as e:
        return TaskResponse(
            task_name=task_kwargs.get("task_name", ""),
            task_description=task_kwargs.get("task_description", ""),
            status="failed",
            result_code=0,
            task_outputs=None,
            result_diagnostic=str(e),
            task_inputs=input_kwargs,
            usage_metrics=None,
            execution_history=None
        )
    except Exception as e:
        return TaskResponse(
            task_name=task_kwargs.get("task_name", ""),
            task_description=task_kwargs.get("task_description", ""),
            status="failed",
            result_code=0,
            task_outputs=None,
            result_diagnostic=str(e),
            task_inputs=input_kwargs,
            usage_metrics=None,
            execution_history=None
        )

@api_app.post("/validate-token")
async def validate_token(request: Request) -> dict[str, bool]:
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Access denied. No token provided.")
    token = token.split(" ")[1]
    return libraries.validate_token(token)

@api_app.post("/chat_response/{chat_id}")
async def chat_response(chat_id: str) -> List[MessageDict]:
    logging.info(f'Generating chat response for id {chat_id}')
    chat_data = libraries.get_chats(chat_id)
    if not chat_data:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    logging.info(f'Chat_data: {chat_data}')
    responses, task_results = chat_data[chat_id].generate_response()
    logging.info(f'Responses: {responses}')
    if responses:
        for response in responses:
            libraries.store_chat_message(chat_id, response)
    if task_results:
        for result in task_results:
            libraries.store_task_response_on_chat(result, chat_id)
    return responses