from workflow_logic.api.db import BackendAPI
from workflow_logic.api.initialization_data import DBStructure, DB_STRUCTURE
from dotenv import load_dotenv, find_dotenv, set_key

from typing import get_type_hints, get_origin, get_args, Dict, Any, Literal
from pydantic import BaseModel, Field
import aiohttp
import asyncio
import json
import os

from workflow_logic.core.agent import AliceAgent
from workflow_logic.core.chat import AliceChat
from workflow_logic.core.prompt import Prompt
from workflow_logic.core.model import AliceModel
from workflow_logic.core.tasks import AliceTask
from workflow_logic.util.task_utils import ParameterDefinition, TaskResponse, DatabaseTaskResponse

EntityType = Literal["users", "models", "prompts", "agents", "tasks", "chats"]

class InitializationBackendAPI(BackendAPI):
    _id_map: Dict[EntityType, Dict[str, str]] = Field(default_factory=lambda: {
        "users": {}, "models": {}, "prompts": {}, "agents": {}, "tasks": {}, "chats": {}
    })

    _collection_map: Dict[EntityType, str] = {
        "users": "users",
        "models": "models",
        "prompts": "prompts",
        "agents": "agents",
        "tasks": "tasks",
        "chats": "chats"
    }

    async def create_admin_user(self, admin_data: dict) -> str:
        url = f"{self.base_url}/users/register"
        headers = {"Content-Type": "application/json"}

        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=admin_data, headers=headers) as response:
                response.raise_for_status()
                result = await response.json()
                admin_id = result['_id']
                self._id_map["users"][admin_data['key']] = admin_id
                return admin_id

    async def login_admin_user(self, email: str, password: str) -> str:
        url = f"{self.base_url}/users/login"
        data = {"email": email, "password": password}
        headers = {"Content-Type": "application/json"}

        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=data, headers=headers) as response:
                response.raise_for_status()
                result = await response.json()
                return result['token']

    async def store_admin_token(self, token: str):
        dotenv_path = find_dotenv()
        if not dotenv_path:
            raise FileNotFoundError(".env file not found")
        set_key(dotenv_path, "ADMIN_TOKEN", token)
        load_dotenv(dotenv_path, override=True)
        print("Admin token has been updated in the .env file")

    def get_entity_class(self, entity_type: EntityType):
        entity_class_map = {
            "agents": AliceAgent,
            "chats": AliceChat,
            "prompts": Prompt,
            "models": AliceModel,
            "tasks": AliceTask,
            "users": dict  # Assuming no specific class for users
        }
        return entity_class_map.get(entity_type)

    async def create_entity(self, entity_type: EntityType, entity_data: dict) -> str:
        EntityClass = self.get_entity_class(entity_type)
        
        # Resolve references in the data before creating the instance
        resolved_data = await self.resolve_references_in_data(entity_type, entity_data)
        
        entity_instance = EntityClass(**resolved_data)

        collection_name = self._collection_map[entity_type]
        url = f"{self.base_url}/{collection_name}"
        headers = self._get_headers()

        entity_dict = entity_instance.dict(by_alias=True, exclude_unset=True)
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=entity_dict, headers=headers) as response:
                response.raise_for_status()
                result = await response.json()
                entity_id = result['_id']
                self._id_map[entity_type][entity_data['key']] = entity_id
                return entity_id

    async def resolve_references_in_data(self, entity_type: EntityType, data: Dict[str, Any]) -> Dict[str, Any]:
        EntityClass = self.get_entity_class(entity_type)
        resolved_data = data.copy()
        
        for field, field_type in get_type_hints(EntityClass).items():
            if field in resolved_data:
                value = resolved_data[field]
                if isinstance(value, str):
                    origin = get_origin(field_type)
                    if origin is None and issubclass(field_type, BaseModel):
                        # This is a reference to another entity
                        referenced_entity_type = field_type.__name__.lower() + 's'
                        resolved_value = await self.resolve_reference(referenced_entity_type, value)
                        resolved_data[field] = resolved_value
                elif isinstance(value, list):
                    args = get_args(field_type)
                    if args and issubclass(args[0], BaseModel):
                        resolved_list = []
                        for item in value:
                            if isinstance(item, str):
                                referenced_entity_type = args[0].__name__.lower() + 's'
                                resolved_item = await self.resolve_reference(referenced_entity_type, item)
                                resolved_list.append(resolved_item)
                            elif isinstance(item, dict) and 'key' in item:
                                referenced_entity_type = args[0].__name__.lower() + 's'
                                resolved_item = await self.resolve_reference(referenced_entity_type, item['key'])
                                resolved_list.append(resolved_item)
                            else:
                                resolved_list.append(item)
                        resolved_data[field] = resolved_list
                elif isinstance(value, dict):
                    if 'key' in value:
                        # This is a nested reference
                        referenced_entity_type = field_type.__name__.lower() + 's'
                        resolved_value = await self.resolve_reference(referenced_entity_type, value['key'])
                        resolved_data[field] = resolved_value
                    else:
                        # This is a nested object, recursively resolve its references
                        resolved_data[field] = await self.resolve_references_in_data(field_type.__name__.lower() + 's', value)
        
        return resolved_data

    async def resolve_reference(self, entity_type: EntityType, key: str) -> str:
        resolved_id = self._id_map[entity_type].get(key)
        if resolved_id is None:
            raise ValueError(f"Unable to resolve reference: {entity_type} with key {key}")
        return resolved_id


    async def initialize_database(self, db_structure: DBStructure) -> bool:
        # Create admin user
        admin_data = db_structure.users[0]  # Assuming the first user is admin
        await self.create_admin_user(admin_data)
        
        # Login as admin and get JWT
        admin_token = await self.login_admin_user(admin_data['email'], admin_data['password'])
        
        # Store the admin token
        await self.store_admin_token(admin_token)
        
        # Update the instance's admin_token
        self.admin_token = admin_token

        # Create other entities
        for entity_type in ["users", "models", "prompts", "agents", "tasks", "chats"]:
            entities = getattr(db_structure, entity_type)
            if entity_type == "users":
                entities = entities[1:]  # Skip admin user as it's already created
            for entity_data in entities:
                await self.create_entity(entity_type, entity_data)
        
        return True

    async def validate_initialization(self) -> bool:
        for entity_type in self._collection_map.keys():
            url = f"{self.base_url}/{self._collection_map[entity_type]}"
            headers = self._get_headers()
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status != 200:
                        print(f"Failed to validate {entity_type}: HTTP {response.status}")
                        return False
                    
                    entities = await response.json()
                    if not entities:
                        print(f"No {entity_type} found in the database")
                        return False
                    
                    expected_count = len(getattr(DB_STRUCTURE, entity_type))
                    if len(entities) != expected_count:
                        print(f"Mismatch in {entity_type} count. Expected: {expected_count}, Found: {len(entities)}")
                        return False
        
        print("All entities validated successfully")
        return True

async def main():
    api = InitializationBackendAPI()
    
    try:
        success = await api.initialize_database(DB_STRUCTURE)
        if success:
            print("Database initialized successfully")
            
            # Validate initialization
            validation_success = await api.validate_initialization()
            if validation_success:
                print("Initialization validated successfully")
            else:
                print("Initialization validation failed")
            
            # Validate admin token
            validation_result = api.validate_token(api.admin_token)
            if validation_result["valid"]:
                print("Admin token is valid")
            else:
                print(f"Admin token validation failed: {validation_result['message']}")
        else:
            print("Database initialization failed")
    except Exception as e:
        print(f"An error occurred during initialization: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())