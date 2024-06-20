from workflow_logic.core.tasks.workflow import TaskLibrary
from workflow_logic.core.model import ModelManager
from workflow_logic.core.agent.agent import AgentLibrary
from workflow_logic.core.template import TemplateLibrary, StoredTemplateLibrary
from workflow_logic.util.utils import Prompt
from workflow_logic.api.db import BackendAPI
from pydantic import BaseModel, Field
from typing import List
import logging

class Libraries(BaseModel):
    model_manager_object: ModelManager = Field(..., description="The model manager object.")
    template_library: TemplateLibrary = Field(..., description="The template library object.")
    agent_library: AgentLibrary = Field(..., description="The agent library object.")
    task_library: TaskLibrary = Field(..., description="The task library object.")

class DBLibraries(Libraries):
    backend_api: BackendAPI = Field(None, description="The backend API object.")
    model_manager_object: ModelManager = Field(None, description="The model manager object.")
    template_library: StoredTemplateLibrary = Field(None, description="The template library object.")
    agent_library: AgentLibrary = Field(None, description="The agent library object.")
    task_library: TaskLibrary = Field(None, description="The task library object.")

    def __init__(self, **data):
        backend_api = BackendAPI()
        available_models = backend_api.get_models()
        logging.info(f'Retrieved: Models -> {available_models}')
        model_manager_object = ModelManager(model_definitions=list(available_models.values()))
        prompts = backend_api.get_prompts()
        logging.info(f'Retrieved: Prompts -> {prompts}')
        template_map_dict = self.get_template_map_from_prompts(list(prompts.values()))
        template_library = StoredTemplateLibrary(template_map=template_map_dict)
        agents = backend_api.get_agents()
        logging.info(f'Retrieved: Agents -> {agents}')
        agent_map = {agent.name: agent for agent in agents.values()}
        agent_library = AgentLibrary(agents=agent_map, template_library=template_library, model_manager_object=model_manager_object)
        db_tasks = backend_api.get_tasks()
        logging.info(f'Retrieved: Tasks -> {db_tasks}')
        task_library = TaskLibrary(agent_library=agent_library, available_tasks=list(db_tasks.values()))

        super().__init__(
            backend_api=backend_api,
            model_manager_object=model_manager_object,
            template_library=template_library,
            agent_library=agent_library,
            task_library=task_library,
            **data
        )

    def get_template_map_from_prompts(self, prompts: List[Prompt]) -> dict[str, str]:
        return {prompt.name: prompt.content for prompt in prompts}