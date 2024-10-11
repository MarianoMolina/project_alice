from workflow.db_app.app.db_functionality import BackendFunctionalityAPI
from typing import Literal
from pydantic import Field
from workflow.util.const import BACKEND_HOST, BACKEND_PORT_DOCKER

class ContainerAPI(BackendFunctionalityAPI):
    base_url: Literal[f"http://{BACKEND_HOST}:{BACKEND_PORT_DOCKER}/api"] = Field(f"http://{BACKEND_HOST}:{BACKEND_PORT_DOCKER}/api", description="The base URL of the backend API", frozen=True)
        