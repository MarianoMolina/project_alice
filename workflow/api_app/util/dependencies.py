from fastapi import Request
from workflow.db_app.app import ContainerAPI

def get_db_app(request: Request) -> ContainerAPI:
    return request.app.state.db_app

def get_queue_manager(request: Request):
    return request.app.state.queue_manager