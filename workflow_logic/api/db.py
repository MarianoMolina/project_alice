from workflow_logic.util.task_utils import TaskResponse
from workflow_logic.core.tasks import APITask, CVGenerationTask, AliceTask, RedditSearchTask, Workflow, WikipediaSearchTask, GoogleSearchTask, ExaSearchTask, ArxivSearchTask, BasicAgentTask, PromptAgentTask, CheckTask, CodeGenerationLLMTask, CodeExecutionLLMTask, AgentWithFunctions
from workflow_logic.core.agent import AliceAgent
from workflow_logic.core.prompt import Prompt, TemplatedPrompt, PromptLibrary
from workflow_logic.core.model import AliceModel
from workflow_logic.core.chat import AliceChat
from workflow_logic.core.tasks.workflow import TaskLibrary
from workflow_logic.core.model import ModelManager
from workflow_logic.core.agent.agent import AgentLibrary
from workflow_logic.util.task_utils import MessageDict
from workflow_logic.util.const import BACKEND_PORT, HOST, ADMIN_TOKEN, BACKEND_PORT_DOCKER, BACKEND_HOST
from pydantic import BaseModel, Field
from typing import Literal, Optional, Dict
import requests, logging

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
    admin_token: str = Field(ADMIN_TOKEN, description="The admin token for the backend API")

    model_manager: ModelManager = Field(None, description="The model manager object.")
    template_library: PromptLibrary = Field(None, description="The template library object.")
    agent_library: AgentLibrary = Field(None, description="The agent library object.")
    task_library: TaskLibrary = Field(None, description="The task library object.")
    class Config:
        arbitrary_types_allowed = True

    def __init__(self, **data):
        super().__init__(**data)
        self.initialize_libraries()

    @property
    def task_types(self) -> Dict[str, AliceTask]:
        return {task.__name__: task for task in self.available_task_types}

    def initialize_libraries(self):
        # Initialize ModelManager
        available_models = self.get_models()
        logging.info(f'Retrieved: Models -> {available_models}')
        if not available_models:
            raise ValueError("No models found in the database.")
        self.model_manager = ModelManager(model_definitions=list(available_models.values()))

        # Initialize StoredPromptLibrary
        prompts = self.get_prompts()
        logging.info(f'Retrieved: Prompts -> {prompts}')
        if not prompts:
            raise ValueError("No prompts found in the database.")
        template_map_dict = {prompt.name: prompt for prompt in prompts.values()}
        self.template_library = PromptLibrary(template_map=template_map_dict)

        # Initialize AgentLibrary
        agents = self.get_agents()
        logging.info(f'Retrieved: Agents -> {agents}')
        if not agents:
            raise ValueError("No agents found in the database.")
        agent_map = {agent.name: agent for agent in agents.values()}
        self.agent_library = AgentLibrary(agents=agent_map, model_manager_object=self.model_manager)

        # Initialize TaskLibrary
        logging.info(f'Available Task Types: {self.task_types}')
        db_tasks = self.get_tasks()
        logging.info(f'Retrieved: Tasks -> {db_tasks}')
        # if not db_tasks:
        #     raise ValueError("No tasks found in the database.")
        self.task_library = TaskLibrary(agent_library=self.agent_library, available_tasks=list(db_tasks.values()))

    def _get_headers(self):
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.admin_token}"
        }    
    
    # Function to preprocess the data
    def preprocess_data(self, data):
        if isinstance(data, dict):
            return {k: self.preprocess_data(v) for k, v in data.items() if v or v == 0}
        elif isinstance(data, list):
            return [self.preprocess_data(item) for item in data if item or item == 0]
        else:
            return data if data or data == 0 else None

    def store_task_response(self, task_response: TaskResponse) -> str:
        url = f"{self.base_url}/taskResults"
        headers = self._get_headers()
        data = task_response.model_dump()
        try:
            response = requests.post(url, json=data, headers=headers)
            response.raise_for_status()
            print(f"TaskResponse stored successfully with ID: {response.json()['_id']}")
            return f"TaskResponse stored successfully with ID: {response.json()['_id']}"
        except requests.exceptions.RequestException as e:
            print(f"Error storing TaskResponse: {e}")
            return None

    def get_prompts(self, prompt_id: Optional[str] = None) -> Dict[str, Prompt]:
        if prompt_id is None:
            url = f"{self.base_url}/prompts"
        else:
            url = f"{self.base_url}/prompts/{prompt_id}"

        headers = self._get_headers()
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            prompts = response.json()
            if isinstance(prompts, list):
                prompts = [self.preprocess_data(prompt) for prompt in prompts]
                return {prompt["_id"]: TemplatedPrompt(**prompt) if "is_templated" in prompt and prompt["is_templated"] else Prompt(**prompt) for prompt in prompts}
            else:
                prompts = self.preprocess_data(prompts)
                return {prompts["_id"]: TemplatedPrompt(**prompts) if "is_templated" in prompts and prompts["is_templated"] else Prompt(**prompts)}
        except requests.exceptions.RequestException as e:
            print(f"Error retrieving prompts: {e}")
            return {}

    def get_agents(self, agent_id: Optional[str] = None) -> Dict[str, AliceAgent]:
        if agent_id is None:
            url = f"{self.base_url}/agents"
        else:
            url = f"{self.base_url}/agents/{agent_id}"

        headers = self._get_headers()
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            agents = response.json()
            if isinstance(agents, list):
                preprocessed_agents = [self.preprocess_data(agent) for agent in agents]
                return {agent["_id"]: AliceAgent(**agent) for agent in preprocessed_agents}
            else:
                preprocessed_agent = self.preprocess_data(agents)
                return {agents["_id"]: AliceAgent(**preprocessed_agent)}
        except requests.exceptions.RequestException as e:
            print(f"Error retrieving agents: {e}")
            return {}
        
    def task_initializer(self, task: dict) -> AliceTask:
        if not task["task_type"] in self.task_types:
            raise ValueError(f"Task type {task['task_type']} not found in available task types.")
        if "tasks" in task and isinstance(task["tasks"], dict):
            print(f'TASKS: {task["tasks"]}')
            task["tasks"] = {subtask["_id"]: self.task_initializer(subtask) for subtask in task["tasks"].values()}
        return self.task_types[task["task_type"]](**task)

    def get_tasks(self, task_id: Optional[str] = None) -> Dict[str, AliceTask]:
        if task_id is None:
            url = f"{self.base_url}/tasks"
        else:
            url = f"{self.base_url}/tasks/{task_id}"

        headers = self._get_headers()
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            tasks = response.json()
            task_type_map = {task_type.__name__: task_type for task_type in self.available_task_types}
            if isinstance(tasks, list):
                tasks = [self.preprocess_data(task) for task in tasks]
                task_dict = {}
                for task in tasks:
                    task_dict[task["_id"]] = self.task_initializer(task)
                return task_dict
            else:
                tasks = self.preprocess_data(tasks)
                if tasks["task_type"] in task_type_map:
                    return {tasks["_id"]: task_type_map[tasks["task_type"]](**tasks)}
                else:
                    return {}
        except requests.exceptions.RequestException as e:
            print(f"Error retrieving tasks: {e}")
            return {}
    
    def get_models(self, model_id: Optional[str] = None) -> Dict[str, AliceModel]:
        if model_id is None:
            url = f"{self.base_url}/models"
        else:
            url = f"{self.base_url}/models/{model_id}"

        headers = self._get_headers()
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            models = response.json()
            if isinstance(models, list):
                models = [self.preprocess_data(model) for model in models]
                return {model['_id']: AliceModel(**model) for model in models}
            else:
                models = self.preprocess_data(models)
                return {models['_id']: AliceModel(**models)}
        except requests.exceptions.RequestException as e:
            print(f"Error retrieving models: {e}")
            return {}
    
    def get_chats(self, chat_id: Optional[str] = None) -> Dict[str, AliceChat]:
        if chat_id is None:
            url = f"{self.base_url}/chats"
        else:
            url = f"{self.base_url}/chats/{chat_id}"

        headers = self._get_headers()
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            print(f'Chats response: {response.json()}')
            chats = response.json()
            if isinstance(chats, list):
                chats = [self.preprocess_data(chat) for chat in chats]
                return {chat["_id"]: self.populate_chat(chat) for chat in chats}
            else:
                chats = self.preprocess_data(chats)
                return {chats['_id']: self.populate_chat(chats)}
        except requests.exceptions.RequestException as e:
            print(f"Error retrieving chats: {e}")
            return {}
        
    def populate_chat(self, chat: dict) -> AliceChat:
        print(f'Chat: {chat}')
        
        if 'functions' in chat and chat['functions']:
            processed_functions = []
            for function_id in chat['functions']:
                try:
                    task = self.task_initializer(function_id)
                    if not isinstance(task, AliceTask):
                        print(f"Warning: task_initializer returned non-AliceTask object for ID {function_id}")
                        continue
                    processed_functions.append(task)
                except Exception as e:
                    print(f"Error processing function {function_id}: {str(e)}")
            
            chat['functions'] = processed_functions

        try:
            chat_obj = AliceChat.model_validate(chat)
            if not chat_obj:
                raise ValueError(f"Invalid chat object after processing functions. {chat}")
            
            chat_obj.alice_agent.model_manager_object = self.model_manager
            return chat_obj
        except Exception as e:
            print(f"Error validating chat object: {str(e)}")
            raise ValueError(f"Failed to validate chat object: {str(e)}")
    
    def store_chat_message(self, chat_id: str, message: MessageDict) -> bool:
        url = f"{self.base_url}/chats/{chat_id}/add_message"
        headers = self._get_headers()
        data = {"message": message}  # Wrap the message in a "message" key
        try:
            response = requests.patch(url, json=data, headers=headers)
            response.raise_for_status()
            print(f"Messages stored successfully for chat {chat_id}")
            return f"Messages stored successfully for chat {chat_id}"
        except requests.exceptions.RequestException as e:
            print(f"Error storing messages: {e}")
            return None
        
    async def store_task_response(self, task_response: TaskResponse) -> str:
        url = f"{self.base_url}/taskresults"
        headers = self._get_headers()
        data = task_response.model_dump()
        try:
            response = requests.post(url, json=data, headers=headers)
            response.raise_for_status()
            print(f"TaskResponse stored successfully with ID: {response.json()['_id']}")
            return response.json()['_id']
        except requests.exceptions.RequestException as e:
            print(f"Error storing TaskResponse: {e}")

    async def store_task_response_on_chat(self, task_response: TaskResponse, chat_id: str) -> str:
        url = f"{self.base_url}/chats/{chat_id}/add_task_response"
        headers = self._get_headers()
        try:
            id = await self.store_task_response(task_response)
            response = requests.patch(url, json=id, headers=headers)
            response.raise_for_status()
            print(f"TaskResponse stored successfully with ID: {response.json()['_id']}")
            return f'TaskResponse stored successfully with ID: {response.json()["_id"]}'
        except requests.exceptions.RequestException as e:
            print(f"Error storing TaskResponse: {e}")
        
    def validate_token(self, token: str) -> dict:
        url = f"{self.base_url}/users/validate"
        headers = {"Authorization": f"Bearer {token}"}
        try:
            response = requests.get(url, headers=headers)
            print(f"Token validation response: {response}")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error validating token: {e}")
            return {"valid": False, "message": str(e)}
        
class ContainerAPI(BackendAPI):
    base_url: Literal[f"http://{BACKEND_HOST}:{BACKEND_PORT_DOCKER}/api"] = Field(f"http://{BACKEND_HOST}:{BACKEND_PORT_DOCKER}/api", description="The base URL of the backend API", frozen=True)
        
def token_validation_middleware(api: BackendAPI):
    def middleware(request) -> dict[str, bool]:
        token = request.headers.get("Authorization")
        if not token:
            return {"valid": False, "message": "Access denied. No token provided."}

        token = token.split(" ")[1]
        validation_response = api.validate_token(token)
        if not validation_response.get("valid"):
            return {"valid": False, "message": validation_response.get("message", "Invalid token")}

        request.state.user_id = validation_response["user"]["_id"]
        return {"valid": True}
    return middleware