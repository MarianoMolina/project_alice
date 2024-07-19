import pytest
import asyncio
from typing import Dict
from unittest.mock import AsyncMock, patch
from workflow_logic.api.db_app.initialization_data import DB_STRUCTURE
from workflow_logic.core import AliceAgent, AliceModel, AliceTask, Prompt
from workflow_logic.core.api import API, APIManager
from workflow_logic.api.api_util.api_utils import available_task_types
from workflow_logic.core.parameters import ParameterDefinition
from workflow_logic.core.communication import DatabaseTaskResponse

pytest.ini_options = {"asyncio_mode": "auto"}

class _TestTaskEnvironment:
    def __init__(self):
        self.models: Dict[str, AliceModel] = {}
        self.agents: Dict[str, AliceAgent] = {}
        self.tasks: Dict[str, AliceTask] = {}
        self.apis: Dict[str, API] = {}
        self.prompts: Dict[str, Prompt] = {}
        self.api_manager: APIManager = APIManager()
        self.task_types: Dict[str, type] = {task.__name__: task for task in available_task_types}
        self.parameters: Dict[str, ParameterDefinition] = {}

    async def task_initializer(self, task: dict) -> AliceTask:
        if task["task_type"] not in self.task_types:
            raise ValueError(f"Task type {task['task_type']} not found in available task types.")
        
        if "tasks" in task and isinstance(task["tasks"], dict):
            subtasks = await asyncio.gather(*[
                self.task_initializer(subtask)
                for subtask in task["tasks"].values()
            ])
            task["tasks"] = {
                subtask["_id"]: initialized_subtask
                for subtask, initialized_subtask in zip(task["tasks"].values(), subtasks)
            }
        
        if 'input_variables' in task and 'properties' in task['input_variables']:
            for key, value in task['input_variables']['properties'].items():
                if isinstance(value, str) and value in self.parameters:
                    task['input_variables']['properties'][key] = self.parameters[value]
        
        if 'agent' in task and isinstance(task['agent'], str):
            task['agent'] = self.agents[task['agent']]
        
        return self.task_types[task["task_type"]](**task)

    async def setup_entities(self):
        # Set up parameters
        for param_data in DB_STRUCTURE.parameters:
            param = ParameterDefinition(**param_data)
            self.parameters[param_data['key']] = param

        # Set up models
        for model_data in DB_STRUCTURE.models:
            model = AliceModel(**model_data)
            self.models[model_data['key']] = model

        # Set up prompts
        for prompt_data in DB_STRUCTURE.prompts:
            prompt = Prompt(**prompt_data)
            self.prompts[prompt_data['key']] = prompt

        # Set up APIs
        for api_data in DB_STRUCTURE.apis:
            api_data = api_data.copy()
            if 'default_model' in api_data and isinstance(api_data['default_model'], str):
                api_data['default_model'] = self.models.get(api_data['default_model'])
            api = API(**api_data)
            self.apis[api_data['key']] = api
            self.api_manager.add_api(api)

        # Set up agents
        for agent_data in DB_STRUCTURE.agents:
            agent_data = agent_data.copy()
            agent_data['system_message'] = self.prompts[agent_data['system_message']]
            agent_data['model_id'] = self.models.get(agent_data['model_id'])
            agent = AliceAgent(**agent_data)
            self.agents[agent_data['key']] = agent

        # Set up tasks
        for task_data in DB_STRUCTURE.tasks:
            task = await self.task_initializer(task_data)
            self.tasks[task_data['key']] = task

@pytest.fixture
async def task_env():
    env = _TestTaskEnvironment()
    await env.setup_entities()
    return env

@pytest.mark.asyncio
async def test_google_search_task(task_env):
    env = await task_env
    google_search_task = env.tasks.get("google_search")
    assert google_search_task is not None, "Google search task not found"
    
    # Mock the API call
    mock_search_result = [{"title": "Paris", "link": "https://en.wikipedia.org/wiki/Paris", "snippet": "Paris is the capital of France."}]
    with patch('workflow_logic.core.api.APIManager.retrieve_api_data', return_value={"api_key": "mock_key", "cse_id": "mock_cse_id"}), \
         patch('googleapiclient.discovery.build') as mock_build:
        mock_cse = AsyncMock()
        mock_cse().list().execute.return_value = {"items": mock_search_result}
        mock_build.return_value = mock_cse
        
        result = await google_search_task.execute(prompt="What is the capital of France?", api_manager=env.api_manager)
    
    assert result.status == "complete", "Task did not complete successfully"
    assert "Paris" in str(result.task_outputs), "Expected result not found in task outputs"

@pytest.mark.asyncio
async def test_openai_llm_task(task_env):
    env = await task_env
    openai_task = env.tasks.get("openai_completion")  # Assume you have an OpenAI completion task
    assert openai_task is not None, "OpenAI task not found"
    
    # Mock the API call
    mock_response = "The capital of France is Paris."
    with patch('workflow_logic.core.api.APIManager.retrieve_api_data', return_value={"api_key": "mock_key"}), \
         patch('openai.Completion.create', return_value=AsyncMock(choices=[AsyncMock(text=mock_response)])):
        
        # Mock the agent's generate_reply method
        with patch.object(openai_task.agent, 'get_autogen_agent') as mock_get_autogen_agent:
            mock_agent = AsyncMock()
            mock_agent.generate_reply.return_value = mock_response
            mock_get_autogen_agent.return_value = mock_agent
            
            result = await openai_task.execute(prompt="What is the capital of France?", api_manager=env.api_manager)
    
    assert result.status == "complete", "Task did not complete successfully"
    assert mock_response in str(result.task_outputs), "Expected result not found in task outputs"

@pytest.mark.asyncio
async def test_anthropic_llm_task(task_env):
    env = await task_env
    anthropic_task = env.tasks.get("anthropic_completion")  # Assume you have an Anthropic completion task
    assert anthropic_task is not None, "Anthropic task not found"
    
    # Mock the API call
    mock_response = "The capital of France is Paris."
    with patch('workflow_logic.core.api.APIManager.retrieve_api_data', return_value={"api_key": "mock_key"}), \
         patch('anthropic.Anthropic.completions.create', return_value=AsyncMock(completion=mock_response)):
        
        # Mock the agent's generate_reply method
        with patch.object(anthropic_task.agent, 'get_autogen_agent') as mock_get_autogen_agent:
            mock_agent = AsyncMock()
            mock_agent.generate_reply.return_value = mock_response
            mock_get_autogen_agent.return_value = mock_agent
            
            result = await anthropic_task.execute(prompt="What is the capital of France?", api_manager=env.api_manager)
    
    assert result.status == "complete", "Task did not complete successfully"
    assert mock_response in str(result.task_outputs), "Expected result not found in task outputs"

# Add more test functions for other task types as needed

if __name__ == "__main__":
    pytest.main(["-v", __file__])