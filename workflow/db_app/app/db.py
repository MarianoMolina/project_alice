import requests, aiohttp, asyncio, json
from aiohttp import ClientError
from bson import ObjectId
from typing import Dict, Any, Optional, Literal, Union
from pydantic import BaseModel, Field, ConfigDict
from workflow.core.tasks import available_task_types
from workflow.core import AliceChat, AliceTask, API, MessageDict, FileReference, FileContentReference, ChatThread
from workflow.util.const import BACKEND_PORT, DOCKER_HOST, WORKFLOW_SERVICE_KEY
from workflow.core.data_structures import EntityType
from workflow.util import LOGGER

class BackendAPI(BaseModel):
    """
    Represents a connection to the backend API, providing methods to interact with various entities.

    This class encapsulates the functionality to communicate with the backend API,
    including methods to retrieve, create, and update various entities such as prompts,
    users, agents, tasks, models, APIs, and chats.

    Attributes:
        base_url (str): The base URL of the backend API.
        user_token (str): The authentication token for API requests.
        available_task_types (list[AliceTask]): List of available task types.
        collection_map (Dict[EntityType, str]): Mapping of entity types to collection names.

    Methods:
        get_prompts(prompt_id: Optional[str] = None) -> Dict[str, Prompt]: Retrieves prompts.
        get_users(user_id: Optional[str] = None) -> Dict[str, User]: Retrieves users.
        get_agents(agent: Optional[str] = None) -> Dict[str, AliceAgent]: Retrieves agents.
        get_tasks(task_id: Optional[str] = None) -> Dict[str, AliceTask]: Retrieves tasks.
        get_models(model_id: Optional[str] = None) -> Dict[str, AliceModel]: Retrieves models.
        get_apis(api_id: Optional[str] = None) -> Dict[str, API]: Retrieves APIs.
        update_api_health(api_id: str, health_status: str) -> bool: Updates API health status.
        get_chat(chat_id: str) -> AliceChat: Retrieves chat.
        store_chat_message(chat_id: str, message: MessageDict) -> AliceChat: Stores a chat message.
        store_task_response(task_response: TaskResponse) -> TaskResponse: Stores a task response.
        validate_token(token: str) -> dict: Validates an authentication token.
        create_entity_in_db(entity_type: EntityType, entity_data: dict) -> str: Creates an entity in the database.
        check_existing_data(max_retries=3, retry_delay=1) -> bool: Checks for existing data in the database.

    Example:
        >>> api = BackendAPI(base_url="http://api.example.com", user_token="your_token_here")
        >>> prompts = await api.get_prompts()
    """
    base_url: Literal[f"http://{DOCKER_HOST}:{BACKEND_PORT}/api"] = Field(f"http://{DOCKER_HOST}:{BACKEND_PORT}/api", description="The base URL of the backend API", frozen=True)
    user_data: dict = Field(default={
        "user_token": None, 
        "user_obj": None
    }, description="The user data for the backend API")
    available_task_types: list[AliceTask] = Field(available_task_types, frozen=True, description="The available task types")
    collection_map: Dict[EntityType, str] = Field(default_factory=lambda: {
        "agents": "agents",
        "apis": "apis",
        "users": "users",
        "models": "models",
        "prompts": "prompts",
        "user_checkpoints": "usercheckpoints",
        "user_interactions": "userinteractions",
        "embedding_chunks": "embeddingchunks",
        "data_clusters": "dataclusters",
        "tasks": "tasks",
        "chats": "chats", 
        "parameters": "parameters",
        "task_responses": "taskresults",
        "files": "files",
        "messages": "messages",
        "entity_references": "entityreferences",
        "tool_calls": "toolcalls",
        "code_executions": "codeexecutions",
        "api_configs": "apiconfigs"
    }, description="Map of entity types to collection names")
    model_config = ConfigDict(protected_namespaces=(), json_encoders = {ObjectId: str}, arbitrary_types_allowed=True)
    
    def model_dump(self, *args, **kwargs):
        # Ensure we exclude model_config from serialization
        kwargs['exclude'] = {
            'model_config', 
            *kwargs.get('exclude', set())
        }
        
        data = super().model_dump(*args, **kwargs)

    @property
    def task_types(self) -> Dict[str, AliceTask]:
        return {task.__name__: task for task in self.available_task_types}


    def _get_headers(self):
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.user_data.get('user_token')}"
        }
    def _get_headers_workflow(self):
        return {
            'Content-Type': 'application/json',
            'X-Workflow-Service-Key': WORKFLOW_SERVICE_KEY,
            'X-User-Context': self.user_data.get('user_token')
        }

    # Function to preprocess the data
    async def preprocess_data(self, data):
        if isinstance(data, dict):
            # Keep the filtering for dictionary values
            return {
                k: await self.preprocess_data(v)
                for k, v in data.items()
                if v or v == 0 or v is False
            }
        elif isinstance(data, list):
            # Do not filter items in lists
            return [await self.preprocess_data(item) for item in data]
        else:
            # Keep the existing condition for scalar values
            return data if data or data == 0 or data is False else None

    async def get_task(self, task_id: str) -> AliceTask:
        url = f"{self.base_url}/tasks/{task_id}/populated"
        headers = self._get_headers()
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url, headers=headers) as response:
                    if response is None:
                        raise ValueError(f"Failed to get a response from {url}")
                    response.raise_for_status()
                    task = await response.json()

                    task = await self.preprocess_data(task)
                    return await self.task_initializer(task)
            except aiohttp.ClientError as e:
                LOGGER.error(f"Error retrieving tasks: {e}")
                return {}

    async def get_apis(self) -> Dict[str, API]:
        url = f"{self.base_url}/workflow/api_request"
        headers = self._get_headers_workflow()
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url, headers=headers) as response:
                    response.raise_for_status()
                    response_object = await response.json()
                    if response_object.get("message") != "Success":
                        raise ValueError(f"Failed to retrieve APIs: {response_object.get('message')}")
                    apis = [await self.preprocess_data(api) for api in response_object.get("apis")]
                    return {api["_id"]: API(**api) for api in apis}
            except aiohttp.ClientError as e:
                LOGGER.error(f"Error retrieving APIs: {e}")
                return {}
            
    async def update_api_config_health(self, api_config_id: str, health_status: str) -> bool:
        url = f"{self.base_url}/apiconfigs/{api_config_id}"
        headers = self._get_headers()
        data = {"health_status": health_status}

        async with aiohttp.ClientSession() as session:
            try:
                async with session.patch(url, json=data, headers=headers) as response:
                    response.raise_for_status()
                    return True
            except aiohttp.ClientError as e:
                LOGGER.error(f"Error updating API health: {e}")
                return False
    
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
    
        # Assuming the task_types constructors are async
        return self.task_types[task["task_type"]](**task)
    
    async def get_chat(self, chat_id: str) -> AliceChat:
        # Retrieves populated chats but without threads
        url = f"{self.base_url}/workflow/chat_without_threads/{chat_id}"
        headers = self._get_headers_workflow()
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url, headers=headers) as response:
                    response.raise_for_status()
                    chat_response = await response.json()
                    chat_data = chat_response['chat']
                    del chat_data['threads']
                    chat = await self.preprocess_data(chat_response['chat'])
                    return AliceChat(**chat)
            except aiohttp.ClientError as e:
                LOGGER.error(f"Error retrieving chats: {e}")
                return {}
            
    async def get_chat_thread(self, thread_id: str) -> AliceChat:
        url = f"{self.base_url}/chatthreads/{thread_id}/populated"
        headers = self._get_headers()
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url, headers=headers) as response:
                    response.raise_for_status()
                    thread = await response.json()
                    thread = await self.preprocess_data(thread)
                    return ChatThread(**thread)
            except aiohttp.ClientError as e:
                LOGGER.error(f"Error retrieving chats: {e}")
                return {}

    async def store_chat_message(self, chat_id: str, thread_id: str, message: MessageDict) -> AliceChat:
        url = f"{self.base_url}/chats/{chat_id}/add_message"
        headers = self._get_headers()
        data = {"message": message.model_dump(by_alias=True), "threadId": thread_id}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.patch(url, json=data, headers=headers) as response:
                    response.raise_for_status()
                    return True
        except aiohttp.ClientError as e:
            LOGGER.error(f"Error storing messages: {e}")
            return None
        
    def validate_token(self, token: str) -> dict:
        url = f"{self.base_url}/users/validate"
        headers = {"Authorization": f"Bearer {token}"}
        LOGGER.debug(f"Attempting to validate token at URL: {url}")
        LOGGER.debug(f"Headers: {headers}")
        try:
            response = requests.get(url, headers=headers)
            LOGGER.debug(f"Token validation response: {response}")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            LOGGER.error(f"Error validating token: {e}")
            return {"valid": False, "message": str(e)}
        
    async def get_entity_from_db(self, entity_type: EntityType, entity_id: str) -> Dict[str, Any]:
        collection_name = self.collection_map[entity_type]
        url = f"{self.base_url}/{collection_name}/{entity_id}/populated"
        headers = self._get_headers()
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url, headers=headers) as response:
                    response.raise_for_status()
                    result = await response.json()
                    return result
            except aiohttp.ClientError as e:
                LOGGER.error(f"Error retrieving entity: {e}")
                return {}
        
    async def create_entity_in_db(self, entity_type: EntityType, entity_data: dict) -> Dict[str, Any]:
        collection_name = self.collection_map[entity_type]
        url = f"{self.base_url}/{collection_name}"
        headers = self._get_headers()

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, json=entity_data, headers=headers) as response:
                    if response.status == 400:
                        error_data = await response.json()
                        raise ValueError(f"Bad request when creating {entity_type}: {error_data}")
                    
                    response.raise_for_status()
                    result = await response.json()
                    LOGGER.debug(f'Created {entity_type} with ID: {result["_id"]}')
                    return result
            except aiohttp.ClientResponseError as e:
                LOGGER.error(f"HTTP error during entity creation: {e.status} - {e.message}")
                LOGGER.error(f"Entity data: {entity_data}")
                raise
            except Exception as e:
                LOGGER.error(f"Unexpected error during entity creation: {str(e)}")
                LOGGER.error(f"Entity data: {entity_data}")
                raise
        
    async def update_entity_in_db(self, entity_type: EntityType, entity_id: str, entity_data: dict) -> Dict[str, Any]:
        collection_name = self.collection_map[entity_type]
        url = f"{self.base_url}/{collection_name}/{entity_id}"
        headers = self._get_headers()
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.patch(url, json=entity_data, headers=headers) as response:
                    if response.status == 400:
                        error_data = await response.json()
                        raise ValueError(f"Bad request when updating {entity_type}: {error_data}")
                    response.raise_for_status()
                    result = await response.json()
                    LOGGER.info(f'Updated {entity_type} with ID: {entity_id}')
                    return result
            except aiohttp.ClientError as e:
                LOGGER.error(f"HTTP error during entity creation: {e.status} - {e.message}")
                LOGGER.error(f"Error updating entity: {e}")
                raise
            except Exception as e:
                LOGGER.error(f"Unexpected error during entity creation: {str(e)}")
                LOGGER.error(f"Unexpected error updating entity: {e}")
                raise

    async def check_existing_data(self, max_retries=3, retry_delay=1) -> bool:
        for attempt in range(max_retries):
            try:
                for collection in self.collection_map.values():
                    if collection == "users":
                        continue
                    url = f"{self.base_url}/{collection}"
                    headers = self._get_headers()
                    async with aiohttp.ClientSession() as session:
                        async with session.get(url, headers=headers, timeout=30) as response:
                            if response.status == 200:
                                data = await response.json()
                                if data:
                                    LOGGER.warning(f"Existing data found in collection: {collection} - {data}")
                                    return True
                return False
            except (ClientError, asyncio.TimeoutError) as e:
                if attempt == max_retries - 1:
                    LOGGER.error(f"Failed to check existing data after {max_retries} attempts: {str(e)}")
                    raise
                LOGGER.error(f"Attempt {attempt + 1} failed, retrying in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)
                
    async def get_file_reference(self, file_reference_id: str): 
        url = f"{self.base_url}/files/{file_reference_id}"
        headers = self._get_headers()
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url, headers=headers) as response:
                    response.raise_for_status()
                    file = await response.json()
                    
                    file = await self.preprocess_data(file)
                    return {file['_id']: FileReference(**file)}
            except aiohttp.ClientError as e:
                LOGGER.error(f"Error retrieving chats: {e}")
                return {}
            
    async def update_file_reference(self, file_reference: Union[FileReference, FileContentReference]): 
        url = f"{self.base_url}/files/{file_reference.id}"
        headers = self._get_headers()
        data = file_reference.model_dump(by_alias=True)
        LOGGER.info(f"Updating file reference: {json.dumps(data, indent=2)}")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.patch(url, json=data, headers=headers) as response:
                    file = response.raise_for_status()
                    file = await self.preprocess_data(file)
                    return {file['_id']: FileReference(**file)}
        except aiohttp.ClientError as e:
            LOGGER.error(f"Error storing messages: {e}")
            return None

def token_validation_middleware(api: BackendAPI):
    def middleware(request) -> dict[str, Any]:
        token = request.headers.get("Authorization")
        if not token:
            return {"valid": False, "message": "Access denied. No token provided."}

        token = token.split(" ")[1]
        validation_response = api.validate_token(token)
        if not validation_response.get("valid"):
            return {
                "valid": False, 
                "message": validation_response.get("message", "Invalid token"), 
                "user": validation_response.get("user", None)
                }
        LOGGER.error('validation_response', validation_response)
        request.state.user_id = validation_response["user"]["_id"]
        return {
            "valid": True, 
            "message": validation_response.get("message", "Valid token"), 
            "user": validation_response.get("user")
            }
    return middleware