from fastapi.middleware.cors import CORSMiddleware
from workflow.util.const import BACKEND_PORT, FRONTEND_PORT, HOST, FRONTEND_PORT_DOCKER, BACKEND_PORT_DOCKER, FRONTEND_HOST, BACKEND_HOST, DOCKER_HOST

def add_cors_middleware(app):
    origins = [
        # HTTP origins
        f"http://{HOST}",
        f"http://{HOST}:{BACKEND_PORT}",
        f"http://{HOST}:{FRONTEND_PORT}",
        f"http://{DOCKER_HOST}:{BACKEND_PORT}",
        f"http://{DOCKER_HOST}:{FRONTEND_PORT}",
        f"http://{BACKEND_HOST}:{BACKEND_PORT_DOCKER}",
        f"http://{FRONTEND_HOST}:{FRONTEND_PORT_DOCKER}",
        # WebSocket origins
        f"ws://{HOST}",
        f"ws://{HOST}:{BACKEND_PORT}",
        f"ws://{HOST}:{FRONTEND_PORT}",
        f"ws://{DOCKER_HOST}:{BACKEND_PORT}",
        f"ws://{DOCKER_HOST}:{FRONTEND_PORT}",
        f"ws://{BACKEND_HOST}:{BACKEND_PORT_DOCKER}",
        f"ws://{FRONTEND_HOST}:{FRONTEND_PORT_DOCKER}",
    ]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )