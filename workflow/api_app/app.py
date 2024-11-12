"""
FastAPI application for the Workflow service.

This module sets up the FastAPI application with middleware, routes, and initial tests.
It uses a ContainerAPI for database operations and includes various routes for
health checks, task execution, chat responses, and database initialization.

Global Variables:
    db_app (ContainerAPI): The database application instance.
    thread_pool (ThreadPoolExecutor): Thread pool for concurrent operations.
    WORKFLOW_APP (FastAPI): The main FastAPI application instance.

Functions:
    run_initial_tests(app: FastAPI): 
        Runs initial tests for the application and stores results in app state.

    lifespan(app: FastAPI): 
        Asynchronous context manager for application lifespan management.

Usage:
    This module is typically used as the entry point for the Workflow service.
    It can be run using a ASGI server like uvicorn:
    
    ```
    uvicorn main:WORKFLOW_APP
    ```
"""
from fastapi import FastAPI
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor
from workflow.db_app import ContainerAPI, DB_STRUCTURE
from workflow.api_app.middleware import add_cors_middleware, auth_middleware
from workflow.api_app.routes import health_route, task_execute, chat_response, db_init, file_transcript, task_resume, chat_resume
from workflow.test.component_tests import TestEnvironment, DBTests
from workflow.util import LOGGER

db_app = None
thread_pool = None
async def run_initial_tests(app: FastAPI):
    test_env = TestEnvironment()
    db_tests = DBTests()
    await test_env.add_module(db_tests)
    test_settings = {
        "db_structure": DB_STRUCTURE,
        "verbose": True
    }
    initial_test_results = await test_env.run(**test_settings)
    app.state.initial_test_results = initial_test_results
    LOGGER.info("Initial tests completed")

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_app, thread_pool
    db_app = ContainerAPI()
    thread_pool = ThreadPoolExecutor()
    app.state.db_app = db_app
    # Run initial tests
    await run_initial_tests(app)
    yield
    # Clean up resources if necessary
    thread_pool.shutdown()

WORKFLOW_APP = FastAPI(lifespan=lifespan)
add_cors_middleware(WORKFLOW_APP)
WORKFLOW_APP.middleware("http")(auth_middleware)
WORKFLOW_APP.include_router(health_route)
WORKFLOW_APP.include_router(task_execute)
WORKFLOW_APP.include_router(chat_response)
WORKFLOW_APP.include_router(db_init)
WORKFLOW_APP.include_router(file_transcript)
WORKFLOW_APP.include_router(task_resume)
WORKFLOW_APP.include_router(chat_resume)