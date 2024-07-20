from fastapi import FastAPI
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor
from workflow_logic.db_app.db import ContainerAPI
from workflow_logic.api_app.middleware.cors import add_cors_middleware
from workflow_logic.api_app.middleware.auth import auth_middleware
from workflow_logic.api_app.routes import health_route, task_execute, chat_response, db_init

db_app = None
thread_pool = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_app, thread_pool
    db_app = ContainerAPI()
    await db_app.initialize_db_app()
    thread_pool = ThreadPoolExecutor()
    app.state.db_app = db_app  # Set db_app in app state here
    yield
    # Clean up resources if necessary

WORKFLOW_APP = FastAPI(lifespan=lifespan)

# Add middleware
add_cors_middleware(WORKFLOW_APP)
WORKFLOW_APP.middleware("http")(auth_middleware)

# Include routers
WORKFLOW_APP.include_router(health_route)
WORKFLOW_APP.include_router(task_execute)
WORKFLOW_APP.include_router(chat_response)
WORKFLOW_APP.include_router(db_init)