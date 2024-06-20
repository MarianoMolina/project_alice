from workflow_logic.util.task_utils import TaskResponse
from workflow_logic.core.tasks import APITask, CVGenerationTask, AliceTask, RedditSearchTask, Workflow, WikipediaSearchTask, GoogleSearchTask, ExaSearchTask, ArxivSearchTask, BasicAgentTask, PromptAgentTask, CheckTask, CodeGenerationLLMTask, CodeExecutionLLMTask, AgentWithFunctions
from workflow_logic.core.agent import AliceAgent
from workflow_logic.util.utils import Prompt
from workflow_logic.core.model import AliceModel
from workflow_logic.util.const import BACKEND_PORT, HOST
from pydantic import BaseModel, Field
from typing import Literal
import requests
available_task_types: list[AliceTask] = [
    Workflow,
    AgentWithFunctions,
    PromptAgentTask,
    CodeGenerationLLMTask,
    CodeExecutionLLMTask,
    CheckTask,
    BasicAgentTask,
    RedditSearchTask,
    ExaSearchTask,
    WikipediaSearchTask,
    GoogleSearchTask,
    ArxivSearchTask,
    APITask,
    CVGenerationTask
]
class BackendAPI(BaseModel):
    base_url: Literal[f"http://{HOST}:{BACKEND_PORT}/api"] = Field(f"http://{HOST}:{BACKEND_PORT}/api", description="The base URL of the backend API", frozen=True)
    available_task_types: list[AliceTask] = Field(available_task_types, frozen=True, description="The available task types")

    class Config:
        arbitrary_types_allowed = True

    def store_task_response(self, task_response: TaskResponse):
        url = f"{self.base_url}/taskResults"
        headers = {"Content-Type": "application/json"}
        data = task_response.model_dump()
        try:
            response = requests.post(url, json=data, headers=headers)
            response.raise_for_status()
            print(f"TaskResponse stored successfully with ID: {response.json()['_id']}")
            return f"TaskResponse stored successfully with ID: {response.json()['_id']}"
        except requests.exceptions.RequestException as e:
            print(f"Error storing TaskResponse: {e}")

    def get_prompts(self) -> dict[str, Prompt]:
        url = f"{self.base_url}/prompts"
        try:
            response = requests.get(url)
            response.raise_for_status()
            prompts = response.json()
            return {prompt["_id"]: Prompt(**prompt) for prompt in prompts}
        except requests.exceptions.RequestException as e:
            print(f"Error retrieving prompts: {e}")
            return {}

    def get_agents(self):
        url = f"{self.base_url}/agents"
        try:
            response = requests.get(url)
            response.raise_for_status()
            agents = response.json()
            return {agent["_id"]: AliceAgent(**agent) for agent in agents}
        except requests.exceptions.RequestException as e:
            print(f"Error retrieving agents: {e}")
            return {}

    def get_tasks(self) -> dict[str, AliceTask]:
        url = f"{self.base_url}/tasks"
        try:
            response = requests.get(url)
            response.raise_for_status()
            tasks = response.json()
            task_type_map = {task_type.__name__: task_type for task_type in self.available_task_types}
            return {
                task["_id"]: task_type_map[task["task_type"]](**task)
                for task in tasks
                if task["task_type"] in task_type_map
            }
        except requests.exceptions.RequestException as e:
            print(f"Error retrieving tasks: {e}")
            return {}
    
    def get_models(self) -> dict[str, AliceModel]:
        url = f"{self.base_url}/models"
        try:
            response = requests.get(url)
            response.raise_for_status()
            models = response.json()
            print(f"Models: {models}")
            return {model['_id']: AliceModel(**model) for model in models}
        except requests.exceptions.RequestException as e:
            print(f"Error retrieving models: {e}")
            return {}