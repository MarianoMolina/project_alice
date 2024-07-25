from fastapi import Request
from workflow_logic.db_app.app import ContainerAPI

def get_db_app(request: Request) -> ContainerAPI:
    return request.app.state.db_app