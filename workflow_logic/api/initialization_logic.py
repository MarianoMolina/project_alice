import logging
import aiohttp
import asyncio
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field

class BackendAPI(BaseModel):
    base_url: str = Field(..., description="The base URL of the backend API")
    admin_token: str = Field(..., description="The admin token for the backend API")

    async def initialize_database(self, db_structure: Dict[str, List[Dict[str, Any]]]):
        try:
            admin_token = await self.create_admin_user(db_structure["users"][0])
            self.admin_token = admin_token

            for entity_type in ["models", "prompts", "agents", "tasks"]:
                await self.create_entities(entity_type, db_structure[entity_type])

            await self.resolve_references(db_structure)
            
            return await self.get_database_structure()
        except Exception as e:
            logging.error(f"Error initializing database: {e}")
            raise

    async def create_admin_user(self, admin_data: Dict[str, Any]) -> str:
        try:
            await self.create_user(admin_data)
            token = await self.login_user(admin_data["email"], admin_data["password"])
            return token
        except aiohttp.ClientResponseError as e:
            if e.status == 400 and "User already exists" in str(e):
                logging.info("Admin user already exists. Proceeding with login.")
                return await self.login_user(admin_data["email"], admin_data["password"])
            raise

    async def create_user(self, user_data: Dict[str, Any]):
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/users/register", json=user_data) as response:
                response.raise_for_status()
                return await response.json()

    async def login_user(self, email: str, password: str) -> str:
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/users/login", json={"email": email, "password": password}) as response:
                response.raise_for_status()
                data = await response.json()
                return data["token"]

    async def create_entities(self, entity_type: str, entities: List[Dict[str, Any]]):
        for entity in entities:
            await self.create_entity(entity_type, entity)

    async def create_entity(self, entity_type: str, entity_data: Dict[str, Any]) -> Dict[str, Any]:
        headers = self._get_headers()
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/{entity_type}", json=entity_data, headers=headers) as response:
                response.raise_for_status()
                return await response.json()

    async def update_entity(self, entity_type: str, entity_id: str, entity_data: Dict[str, Any]) -> Dict[str, Any]:
        headers = self._get_headers()
        async with aiohttp.ClientSession() as session:
            async with session.put(f"{self.base_url}/{entity_type}/{entity_id}", json=entity_data, headers=headers) as response:
                response.raise_for_status()
                return await response.json()

    async def resolve_references(self, db_structure: Dict[str, List[Dict[str, Any]]]):
        entities = await self.get_database_structure()
        for entity_type in ["agents", "tasks"]:
            for entity in db_structure[entity_type]:
                entity_id = self._find_entity_id(entities[entity_type], entity)
                if entity_id:
                    updated_entity = self._resolve_entity_references(entity, entities)
                    await self.update_entity(entity_type, entity_id, updated_entity)

    def _find_entity_id(self, entities: List[Dict[str, Any]], entity: Dict[str, Any]) -> Optional[str]:
        for e in entities:
            if e.get("name") == entity.get("name") or e.get("task_name") == entity.get("task_name"):
                return e["_id"]
        return None

    def _resolve_entity_references(self, entity: Dict[str, Any], entities: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
        resolved_entity = entity.copy()
        for key, value in resolved_entity.items():
            if isinstance(value, str):
                for entity_type, entity_list in entities.items():
                    for e in entity_list:
                        if e.get("name") == value or e.get("short_name") == value:
                            resolved_entity[key] = e["_id"]
                            break
        return resolved_entity

    async def get_database_structure(self) -> Dict[str, List[Dict[str, Any]]]:
        structure = {}
        for entity_type in ["models", "prompts", "agents", "tasks"]:
            structure[entity_type] = await self.get_entities(entity_type)
        return structure

    async def get_entities(self, entity_type: str) -> List[Dict[str, Any]]:
        headers = self._get_headers()
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/{entity_type}", headers=headers) as response:
                response.raise_for_status()
                return await response.json()

    def _get_headers(self):
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.admin_token}"
        }
    
import asyncio
import logging
from typing import Dict, List, Any
from pydantic import BaseModel, Field

from backend_api import BackendAPI  # Assuming the BackendAPI class is in a file named backend_api.py

# Configuration
BASE_URL = "http://localhost:3000/api"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "adminpassword123"

class DBStructure(BaseModel):
    users: List[Dict[str, Any]] = Field(..., description="List of users to create")
    models: List[Dict[str, Any]] = Field(..., description="List of models to create")
    prompts: List[Dict[str, Any]] = Field(..., description="List of prompts to create")
    agents: List[Dict[str, Any]] = Field(..., description="List of agents to create")
    tasks: List[Dict[str, Any]] = Field(..., description="List of tasks to create")

# Database structure
DB_STRUCTURE = DBStructure(
    users=[
        {
            "name": "Admin User",
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "role": "admin"
        },
        {
            "name": "Test User",
            "email": "testuser@example.com",
            "password": "testpassword123",
            "role": "user"
        }
    ],
    models=[
        {
            "short_name": "GPT-3.5",
            "model_name": "gpt-3.5-turbo",
            "model_format": "OpenChat",
            "ctx_size": 4096,
            "model_type": "chat",
            "deployment": "remote",
            "api_type": "openai",
            "base_url": "https://api.openai.com/v1"
        }
    ],
    prompts=[
        {
            "name": "default_system_message",
            "content": "You are a helpful AI assistant.",
            "is_templated": False
        }
    ],
    agents=[
        {
            "name": "Default Assistant",
            "system_message": "default_system_message",
            "autogen_class": "AssistantAgent",
            "modelId": "GPT-3.5"
        }
    ],
    tasks=[
        {
            "task_name": "simple_chat",
            "task_description": "A simple chat task",
            "task_type": "BasicAgentTask",
            "agent_id": "Default Assistant",
            "execution_agent_id": "Default Assistant"
        }
    ]
)

async def initialize_database():
    logging.basicConfig(level=logging.INFO)
    api = BackendAPI(base_url=BASE_URL, admin_token="")

    try:
        final_structure = await api.initialize_database(DB_STRUCTURE.dict())
        logging.info("Database initialization completed successfully.")
        logging.info("Final Database Structure:")
        logging.info(final_structure)
        logging.info(f"Admin Token: {api.admin_token}")
    except Exception as e:
        logging.error(f"Database initialization failed: {e}")

if __name__ == "__main__":
    asyncio.run(initialize_database())