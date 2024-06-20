import logging
from pydantic import ValidationError
from typing import Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from workflow_logic.util.task_utils import TaskResponse
from workflow_logic.core.tasks.task import  AliceTask
from workflow_logic.api.libraries import DBLibraries
from workflow_logic.api.db import available_task_types
from workflow_logic.util.const import BACKEND_PORT, WORKFLOW_PORT, FRONTEND_PORT, HOST

libraries = None

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    global libraries
    libraries = DBLibraries()
    yield
    # Clean up resources if necessary

origins = [
    f"http://{HOST}",
    f"http://{HOST}:{BACKEND_PORT}",
    f"http://{HOST}:{WORKFLOW_PORT}",
    f"http://{HOST}:{FRONTEND_PORT}",
]

api_app = FastAPI(lifespan=lifespan)

api_app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@api_app.post("/execute_task", response_model=TaskResponse)
def execute_task_endpoint(task_name: str, inputs: Dict[str, Any]) -> TaskResponse:
    try:
        task = libraries.task_library.get_task(task_name)
        result = task.execute(**inputs)
        libraries.backend_api.store_task_response(result)
        return result
    except Exception as e:
        return TaskResponse(
            task_name=task_name,
            task_description=task.description,
            status="failed",
            result_code=0,
            task_outputs=None,
            result_diagnostic=str(e),
            task_content=None,
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
        libraries.backend_api.store_task_response(result)
        return result
    except ValidationError as e:
        return TaskResponse(
            task_name=task_kwargs.get("task_name", ""),
            task_description=task_kwargs.get("task_description", ""),
            status="failed",
            result_code=0,
            task_outputs=None,
            result_diagnostic=str(e),
            task_content=None,
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
            task_content=None,
            usage_metrics=None,
            execution_history=None
        )
