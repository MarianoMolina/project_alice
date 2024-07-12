from workflow_logic.core.communication import DatabaseTaskResponse, MessageDict
from workflow_logic.core.tasks import TaskLibrary, AliceTask
from workflow_logic.core.agent import AliceAgent, AgentLibrary
from workflow_logic.core.prompt import Prompt, PromptLibrary
from workflow_logic.core.model import AliceModel, ModelManager
from workflow_logic.core.chat import AliceChat
from workflow_logic.api.api_utils import available_task_types
from workflow_logic.util.const import BACKEND_PORT, HOST, ADMIN_TOKEN, BACKEND_PORT_DOCKER, BACKEND_HOST
from pydantic import BaseModel, Field
from typing import Literal, Optional, Dict, Any
import requests, logging, aiohttp, asyncio

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
        protected_namespaces = ()

    @property
    def task_types(self) -> Dict[str, AliceTask]:
        return {task.__name__: task for task in self.available_task_types}
    
    async def initialize_libraries(self):
        try:
            # Initialize ModelManager
            available_models = await self.get_models()
            # logging.info(f'Retrieved: Models -> {available_models}')
            if not available_models:
                raise ValueError("No models found in the database.")
            self.model_manager = ModelManager(model_definitions=list(available_models.values()))

            # Initialize StoredPromptLibrary
            prompts = await self.get_prompts()
            # logging.info(f'Retrieved: Prompts -> {prompts}')
            if not prompts:
                raise ValueError("No prompts found in the database.")
            template_map_dict = {prompt.name: prompt for prompt in prompts.values()}
            self.template_library = PromptLibrary(template_map=template_map_dict)

            # Initialize AgentLibrary
            agents = await self.get_agents()
            # logging.info(f'Retrieved: Agents -> {agents}')
            if not agents:
                raise ValueError("No agents found in the database.")
            agent_map = {agent.name: agent for agent in agents.values()}
            self.agent_library = AgentLibrary(agents=agent_map, model_manager_object=self.model_manager)

            # Initialize TaskLibrary
            # logging.info(f'Available Task Types: {self.task_types}')
            db_tasks = await self.get_tasks()
            # logging.info(f'Retrieved: Tasks -> {db_tasks}')
            # if not db_tasks:
            #     raise ValueError("No tasks found in the database.")
            self.task_library = TaskLibrary(agent_library=self.agent_library, available_tasks=list(db_tasks.values()))
        except Exception as e:
            logging.error(f"Error in initialize_libraries: {e}")
            raise

    def _get_headers(self):
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.admin_token}"
        }    
    
    # Function to preprocess the data
    async def preprocess_data(self, data):
        if isinstance(data, dict):
            return {k: await self.preprocess_data(v) for k, v in data.items() if v or v == 0}
        elif isinstance(data, list):
            return [await self.preprocess_data(item) for item in data if item or item == 0]
        else:
            return data if data or data == 0 else None
        
    async def get_prompts(self, prompt_id: Optional[str] = None) -> Dict[str, Prompt]:
        if prompt_id is None:
            url = f"{self.base_url}/prompts"
        else:
            url = f"{self.base_url}/prompts/{prompt_id}"
        headers = self._get_headers()

        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url, headers=headers) as response:
                    if response is None:
                        raise ValueError(f"Failed to get a response from {url}")
                    print(f'RESPONSE :{response}')
                    response.raise_for_status()
                    prompts = await response.json()

                    if isinstance(prompts, list):
                        print(f'PROMPTS: {prompts}')
                        prompts = [await self.preprocess_data(prompt) for prompt in prompts]
                        return {prompt["_id"]: Prompt(**prompt) for prompt in prompts}
                    else:
                        prompts = await self.preprocess_data(prompts)
                        return {prompts["_id"]: Prompt(**prompts)}
            except aiohttp.ClientError as e:
                logging.error(f"Error retrieving prompts: {e}")
                return {}
            except Exception as e:
                logging.error(f"Unexpected error retrieving prompts: {e}")
                return {}

    async def get_agents(self, agent: Optional[str] = None) -> Dict[str, AliceAgent]:
        if agent is None:
            url = f"{self.base_url}/agents"
        else:
            url = f"{self.base_url}/agents/{agent}"
        headers = self._get_headers()
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url, headers=headers) as response:
                    if response is None:
                        raise ValueError(f"Failed to get a response from {url}")
                    print(f'RESPONSE :{response}')
                    response.raise_for_status()
                    agents = await response.json()
                    
                    if isinstance(agents, list):
                        preprocessed_agents = [await self.preprocess_data(agent) for agent in agents]
                        return {agent["_id"]: AliceAgent(**agent) for agent in preprocessed_agents}
                    else:
                        preprocessed_agent = await self.preprocess_data(agents)
                        return {agents["_id"]: AliceAgent(**preprocessed_agent)}
            except aiohttp.ClientError as e:
                print(f"Error retrieving agents: {e}")
                return {}

    async def get_tasks(self, task_id: Optional[str] = None) -> Dict[str, AliceTask]:
        if task_id is None:
            url = f"{self.base_url}/tasks"
        else:
            url = f"{self.base_url}/tasks/{task_id}"
        headers = self._get_headers()
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url, headers=headers) as response:
                    if response is None:
                        raise ValueError(f"Failed to get a response from {url}")
                    print(f'RESPONSE :{response}')
                    response.raise_for_status()
                    tasks = await response.json()
                    
                    if isinstance(tasks, list):
                        tasks = [await self.preprocess_data(task) for task in tasks]
                        return {task["_id"]: await self.task_initializer(task) for task in tasks}
                    else:
                        tasks = await self.preprocess_data(tasks)
                        return {tasks["_id"]: await self.task_initializer(tasks)}
            except aiohttp.ClientError as e:
                print(f"Error retrieving tasks: {e}")
                return {}

    async def get_models(self, model_id: Optional[str] = None) -> Dict[str, AliceModel]:
        if model_id is None:
            url = f"{self.base_url}/models"
        else:
            url = f"{self.base_url}/models/{model_id}"
        headers = self._get_headers()
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url, headers=headers) as response:
                    if response is None:
                        raise ValueError(f"Failed to get a response from {url}")
                    response.raise_for_status()
                    models = await response.json()
                    
                    if isinstance(models, list):
                        models = [await self.preprocess_data(model) for model in models]
                        return {model['_id']: AliceModel(**model) for model in models}
                    else:
                        models = await self.preprocess_data(models)
                        return {models['_id']: AliceModel(**models)}
            except aiohttp.ClientError as e:
                print(f"Error retrieving models: {e}")
                return {}
            
    async def task_initializer(self, task: dict) -> AliceTask:
        if not task["task_type"] in self.task_types:
            raise ValueError(f"Task type {task['task_type']} not found in available task types.")
        
        if "tasks" in task and isinstance(task["tasks"], dict):
            # Use asyncio.gather to initialize subtasks concurrently
            subtasks = await asyncio.gather(*[
                self.task_initializer(subtask) 
                for subtask in task["tasks"].values()
            ])
            task["tasks"] = {
                subtask["_id"]: initialized_subtask 
                for subtask, initialized_subtask in zip(task["tasks"].values(), subtasks)
            }
    
        # Assuming the task_types constructors are not async
        return self.task_types[task["task_type"]](**task)
    
    async def get_chats(self, chat_id: Optional[str] = None) -> Dict[str, AliceChat]:
        if chat_id is None:
            url = f"{self.base_url}/chats"
        else:
            url = f"{self.base_url}/chats/{chat_id}"
        headers = self._get_headers()
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url, headers=headers) as response:
                    response.raise_for_status()
                    chats = await response.json()
                    print(f'Chats response: {chats}')
                    
                    if isinstance(chats, list):
                        chats = [await self.preprocess_data(chat) for chat in chats]
                        return {chat["_id"]: await self.populate_chat(chat) for chat in chats}
                    else:
                        chats = await self.preprocess_data(chats)
                        return {chats['_id']: await self.populate_chat(chats)}
            except aiohttp.ClientError as e:
                print(f"Error retrieving chats: {e}")
                return {}
        
    async def populate_chat(self, chat: dict) -> AliceChat:
        print(f'Chat: {chat}')

        if 'functions' in chat and chat['functions']:
            processed_functions = []
            for function in chat['functions']:
                try:
                    task = await self.task_initializer(function)
                    if not isinstance(task, AliceTask):
                        print(f"Warning: task_initializer returned non-AliceTask object for function {function.get('task_name', 'Unknown')}")
                        continue
                    processed_functions.append(task)
                except Exception as e:
                    print(f"Error processing function {function.get('task_name', 'Unknown')}: {str(e)}")
    
            chat['functions'] = processed_functions

        # Ensure all required fields are present in messages
        for message in chat.get('messages', []):
            if 'task_responses' not in message:
                message['task_responses'] = []

        print(f'Messages: {chat["messages"]}')
        
        try:
            return AliceChat(**chat)
        except Exception as e:
            print(f"Error creating AliceChat object: {str(e)}")
            # You might want to add more detailed error handling here
            raise
    
    async def store_chat_message(self, chat_id: str, message: MessageDict) -> AliceChat:
        url = f"{self.base_url}/chats/{chat_id}/add_message"
        headers = self._get_headers()
        data = {"message": message}  # Wrap the message in a "message" key
        try:
            async with aiohttp.ClientSession() as session:
                async with session.patch(url, json=data, headers=headers) as response:
                    response.raise_for_status()
                    result = await response.json()
                    return await self.populate_chat(result["chat"])
        except aiohttp.ClientError as e:
            print(f"Error storing messages: {e}")
            return None

    async def store_task_response(self, task_response: DatabaseTaskResponse) -> DatabaseTaskResponse:
        url = f"{self.base_url}/taskResults"
        headers = self._get_headers()
        data = task_response.model_dump()
        
        print(f"Storing DatabaseTaskResponse with data: {data}")

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=data, headers=headers) as response:
                    try:
                        response.raise_for_status()
                    except aiohttp.ClientResponseError as e:
                        print(f"Response status: {response.status}")
                        response_text = await response.text()
                        print(f"Response content: {response_text}")
                        raise

                    result = await response.json()
                    print(f"DatabaseTaskResponse stored successfully with ID: {result['_id']}")
                    return DatabaseTaskResponse(**result)
        except aiohttp.ClientError as e:
            print(f"Error storing DatabaseTaskResponse: {e}")
            raise
        except Exception as e:
            print(f"Unexpected error: {e}")
            raise
        
    async def store_task_response_on_chat(self, task_response: DatabaseTaskResponse, chat_id: str) -> Dict[str, Any]:
        url = f"{self.base_url}/chats/{chat_id}/add_task_response"
        headers = self._get_headers()
        try:
            result = await self.store_task_response(task_response)
            async with aiohttp.ClientSession() as session:
                async with session.patch(url, json={"task_response_id": result.id}, headers=headers) as response:
                    response.raise_for_status()
                    chat_result = await response.json()
                    print(f"DatabaseTaskResponse added to chat successfully: {chat_result}")
                    return chat_result
        except aiohttp.ClientError as e:
            print(f"Error storing DatabaseTaskResponse on chat: {e}")
            raise
        
    def validate_token(self, token: str) -> dict:
        url = f"{self.base_url}/users/validate"
        headers = {"Authorization": f"Bearer {token}"}
        print(f"Attempting to validate token at URL: {url}")
        print(f"Headers: {headers}")
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