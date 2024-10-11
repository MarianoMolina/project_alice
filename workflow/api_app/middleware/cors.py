from fastapi.middleware.cors import CORSMiddleware
from workflow.util.const import BACKEND_PORT, FRONTEND_PORT, HOST, FRONTEND_PORT_DOCKER, BACKEND_PORT_DOCKER, FRONTEND_HOST, BACKEND_HOST

def add_cors_middleware(app):
    origins = [
        f"http://{HOST}",
        f"http://{HOST}:{BACKEND_PORT}",
        f"http://{HOST}:{FRONTEND_PORT}",
        f"http://localhost:{BACKEND_PORT}",
        f"http://localhost:{FRONTEND_PORT}",
        f"http://{BACKEND_HOST}:{BACKEND_PORT_DOCKER}",
        f"http://{FRONTEND_HOST}:{FRONTEND_PORT_DOCKER}",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )