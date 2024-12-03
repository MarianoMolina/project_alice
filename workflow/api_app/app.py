import asyncio
from types import SimpleNamespace
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor
from workflow.db_app import ContainerAPI, DB_STRUCTURE, token_validation_middleware
from workflow.api_app.middleware import add_cors_middleware, auth_middleware
from workflow.api_app.routes import (
    health_route, task_execute, chat_response, db_init, file_transcript,
    task_resume, chat_resume
)
from workflow.util import LOGGER
from workflow.test.component_tests import TestEnvironment, DBTests
from workflow.api_app.util.queue_manager import QueueManager

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

    # Initialize core services
    db_app = ContainerAPI()
    thread_pool = ThreadPoolExecutor()
    app.state.db_app = db_app

    # Initialize queue manager
    queue_manager = QueueManager(db_app=db_app)
    await queue_manager.initialize()
    app.state.queue_manager = queue_manager

    # Start request processing
    app.state.request_processor = asyncio.create_task(
        queue_manager.process_requests()
    )

    # Run initial tests
    await run_initial_tests(app)

    yield

    # Cleanup
    thread_pool.shutdown()
    app.state.request_processor.cancel()
    await queue_manager.cleanup()

# Initialize FastAPI app
WORKFLOW_APP = FastAPI(lifespan=lifespan)

# Add middleware
add_cors_middleware(WORKFLOW_APP)
WORKFLOW_APP.middleware("http")(auth_middleware)
class MockState:
    pass

# WebSocket endpoint
@WORKFLOW_APP.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    LOGGER.debug(f"WebSocket connection attempt received for task {task_id}")
    try:
        # Get token from query parameters
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=1008, reason="Access denied. No token provided.")
            return

        # Get db_app from app state
        db_app = WORKFLOW_APP.state.db_app
        if db_app is None:
            await websocket.close(code=1011, reason="Service not ready. Please try again later.")
            return

        # Check if task has already completed
        result = await WORKFLOW_APP.state.queue_manager.get_task_result(task_id)
        if result:
            LOGGER.info(f"Task {task_id} already completed, sending final status")
            await websocket.accept()
            await websocket.send_json(result)
            return

        # Create a mock request object for token validation
        mock_request = type('MockRequest', (), {
            'headers': {'Authorization': f'Bearer {token}'},
            'method': 'GET',
            'url': type('URL', (), {'path': f'/ws/{task_id}'})(),
            'state': SimpleNamespace()  # Add this line
        })()

        # Validate token using the mock request
        validation = token_validation_middleware(db_app)(mock_request)
        if not validation["valid"]:
            await websocket.close(code=1008, reason=validation["message"])
            return

        # Set user data
        db_app.user_data['user_token'] = token
        db_app.user_data['user_obj'] = validation["user"]

        # Now proceed with normal WebSocket handling
        await WORKFLOW_APP.state.queue_manager.connect(websocket, task_id)
        while True:
            try:
                await websocket.receive_text()
            except WebSocketDisconnect:
                break
    finally:
        await WORKFLOW_APP.state.queue_manager.disconnect(task_id)

# Include routes
WORKFLOW_APP.include_router(health_route)
WORKFLOW_APP.include_router(task_execute)
WORKFLOW_APP.include_router(chat_response)
WORKFLOW_APP.include_router(db_init)
WORKFLOW_APP.include_router(file_transcript)
WORKFLOW_APP.include_router(task_resume)
WORKFLOW_APP.include_router(chat_resume)