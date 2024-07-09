import aiohttp
import asyncio
import getpass
from dotenv import load_dotenv, find_dotenv, set_key
from typing import get_type_hints, get_origin, get_args, Dict, Any, Literal, Optional
from pydantic import BaseModel, Field
from tqdm import tqdm
from workflow_logic.core.agent import AliceAgent
from workflow_logic.core.chat import AliceChat
from workflow_logic.core.prompt import Prompt
from workflow_logic.core.model import AliceModel
from workflow_logic.core.tasks import AliceTask
from workflow_logic.core.communication import DatabaseTaskResponse
from workflow_logic.core.parameters import ParameterDefinition
from workflow_logic.util import User
from workflow_logic.api.db import BackendAPI
from workflow_logic.api.initialization_data import DBStructure, DB_STRUCTURE, create_task_from_json

EntityType = Literal["users", "models", "prompts", "agents", "tasks", "chats", "parameters", "task_responses"]

class InitializationBackendAPI(BackendAPI):
    id_map: Dict[EntityType, Dict[str, str]] = Field(default_factory=lambda: {
        "users": {}, "models": {}, "prompts": {}, "agents": {}, "tasks": {}, "chats": {}, "parameters": {}, "task_responses": {}
    })
    collection_map: Dict[EntityType, str] = Field(default_factory=lambda: {
        "users": "users",
        "models": "models",
        "prompts": "prompts",
        "agents": "agents",
        "tasks": "tasks",
        "chats": "chats", 
        "parameters": "parameters",
        "task_responses": "taskresults"
    })
    entity_class_map: Dict[str, Any] = Field(default_factory=lambda: {
        "agents": AliceAgent,
        "chats": AliceChat,
        "prompts": Prompt,
        "models": AliceModel,
        "tasks": AliceTask,
        "users": User,
        "parameters": ParameterDefinition, 
        "task_responses": DatabaseTaskResponse
    })
    existing_admin: Optional[Dict[str, Any]] = Field(default=None)
    admin_data: Optional[Dict[str, Any]] = Field(default=None)
    admin_password: Optional[str] = Field(default=None)
    use_existing_admin: bool = Field(default=False)

    async def create_admin_user(self, admin_data: dict) -> str:
        url = f"{self.base_url}/users/register"
        headers = {"Content-Type": "application/json"}

        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=admin_data, headers=headers) as response:
                response.raise_for_status()
                result = await response.json()
                admin_id = result['_id']
                self.id_map["users"][admin_data['email']] = admin_id  # Use email as the key
                return admin_id

    async def login_admin_user(self, email: str, password: str) -> str:
        url = f"{self.base_url}/users/login"
        data = {"email": email, "password": password}
        headers = {"Content-Type": "application/json"}

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, json=data, headers=headers) as response:
                    if response.status == 400:
                        error_data = await response.json()
                        print(f"Login failed: {error_data.get('message', 'Unknown error')}")
                        raise ValueError("Invalid credentials")
                    
                    response.raise_for_status()
                    result = await response.json()
                    if 'token' not in result:
                        raise ValueError("No token received in login response")
                    return result['token']
            except aiohttp.ClientResponseError as e:
                print(f"HTTP error during login: {e.status} - {e.message}")
                raise
            except aiohttp.ClientError as e:
                print(f"Network error during login: {str(e)}")
                raise
            except ValueError as e:
                print(f"Login error: {str(e)}")
                raise
            except Exception as e:
                print(f"Unexpected error during login: {str(e)}")
                raise

    async def store_admin_token(self, token: str):
        dotenv_path = find_dotenv()
        if not dotenv_path:
            raise FileNotFoundError(".env file not found")
        set_key(dotenv_path, "ADMIN_TOKEN", token)
        load_dotenv(dotenv_path, override=True)
        print("Admin token has been updated in the .env file")

    def get_entity_class(self, entity_type: EntityType):
        return self.entity_class_map.get(entity_type)

    async def create_entity(self, entity_type: EntityType, entity_data: dict) -> str:
        EntityClass = self.get_entity_class(entity_type)
        
        # Resolve references in the data before creating the instance
        resolved_data = await self.resolve_references_in_data(entity_type, entity_data)
        
        if entity_type == "tasks":
            entity_instance = create_task_from_json(resolved_data)
        else:
            entity_instance = EntityClass(**resolved_data)

        collection_name = self.collection_map[entity_type]
        url = f"{self.base_url}/{collection_name}"
        headers = self._get_headers()

        entity_dict = entity_instance.dict(by_alias=True, exclude_unset=True)
        
        # Remove the 'key' field if it exists
        entity_dict.pop('key', None)


        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, json=entity_dict, headers=headers) as response:
                    if response.status == 400:
                        error_data = await response.json()
                        print(f"Error creating entity: {error_data}")
                        raise ValueError(f"Bad request when creating {entity_type}: {error_data}")
                    
                    response.raise_for_status()
                    result = await response.json()
                    print(f'Created {entity_type[:-1]}: {entity_data.get("name", entity_data.get("email"))}')
                    entity_id = result['_id']
                    self.id_map[entity_type][entity_data.get('key') or entity_data.get('email')] = entity_id
                    return entity_id
            except aiohttp.ClientResponseError as e:
                print(f"HTTP error during entity creation: {e.status} - {e.message}")
                print(f"Entity data: {entity_dict}")
                raise
            except Exception as e:
                print(f"Unexpected error during entity creation: {str(e)}")
                print(f"Entity data: {entity_dict}")
                raise

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
        resolved_id = self.id_map[entity_type].get(key)
        if resolved_id is None:
            raise ValueError(f"Unable to resolve reference: {entity_type} with key {key}")
        return resolved_id

    async def check_existing_data(self) -> bool:
        for collection in self.collection_map.values():
            url = f"{self.base_url}/{collection}"
            headers = self._get_headers()
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data:
                            return True
        return False

    async def initialize_database(self, db_structure: DBStructure) -> bool:
        try:
            # Login as admin and get JWT
            admin_token = await self.login_admin_user(self.admin_data['email'], self.admin_password)
            
            # Store the admin token
            await self.store_admin_token(admin_token)
            
            # Update the instance's admin_token
            self.admin_token = admin_token

            # Get the list of entity types from EntityType
            entity_types = list(get_args(EntityType))
            
            # Create other entities
            total_entities = sum(len(getattr(db_structure, et, [])) for et in entity_types)
            
            with tqdm(total=total_entities, desc="Initializing database") as pbar:
                for entity_type in entity_types:
                    entities = getattr(db_structure, entity_type, [])
                    if entity_type == "users" and self.existing_admin and self.use_existing_admin:
                        entities = entities[1:]  # Skip admin user if using existing
                    for entity_data in entities:
                        try:
                            await self.create_entity(entity_type, entity_data)
                        except aiohttp.ClientResponseError as e:
                            if e.status == 409:  # Assuming 409 is used for conflicts/duplicates
                                print(f"Entity already exists: {entity_type} - {entity_data.get('name', entity_data.get('email'))}")
                            else:
                                print(f"Error creating entity {entity_type}: {str(e)}")
                                print(f"Entity data: {entity_data}")
                                # Optionally, you can choose to continue with the next entity instead of raising
                                # If you want to stop the entire process on any error, uncomment the next line
                                # raise
                        except Exception as e:
                            print(f"Unexpected error creating entity {entity_type}: {str(e)}")
                            print(f"Entity data: {entity_data}")
                            # Optionally, you can choose to continue with the next entity instead of raising
                            # If you want to stop the entire process on any error, uncomment the next line
                            # raise
                        pbar.update(1)
            
            return True
        except Exception as e:
            print(f"Error in initialize_database: {str(e)}")
            return False
        
    async def get_admin_user(self):
        url = f"{self.base_url}/users?role=admin"
        headers = self._get_headers()
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    users = await response.json()
                    return users[0] if users else None
                return None

    async def handle_admin_user(self, db_structure: DBStructure):
        self.existing_admin = await self.get_admin_user()
        if self.existing_admin:
            print(f"Existing admin user found: {self.existing_admin['email']}")
            self.use_existing_admin = input("Use existing admin? (y/n): ").lower() == 'y'
            if self.use_existing_admin:
                self.admin_data = self.existing_admin
                self.admin_password = getpass.getpass(f"Enter password for existing admin with email {self.existing_admin['email']}: ")
            else:
                self.admin_data, self.admin_password = self.get_new_admin_data()
        else:
            print("No existing admin user found. Creating new admin.")
            self.admin_data, self.admin_password = self.get_new_admin_data()

        if not self.existing_admin or not self.use_existing_admin:
            await self.create_admin_user(self.admin_data)

    def get_new_admin_data(self):
        print("Please enter details for the new admin user:")
        admin_name = input("Admin name: ")
        admin_email = input("Admin email: ")
        admin_password = getpass.getpass("Admin password: ")
        
        admin_data = {
            "name": admin_name,
            "email": admin_email,
            "password": admin_password,
            "role": "admin",
        }
        
        return admin_data, admin_password
    
    async def validate_initialization(self) -> bool:
        try:
            for entity_type in get_args(EntityType):
                url = f"{self.base_url}/{self.collection_map[entity_type]}"
                headers = self._get_headers()
                
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, headers=headers) as response:
                        response.raise_for_status()
                        db_entities = await response.json()
                        
                        structure_entities = getattr(DB_STRUCTURE, entity_type, [])
                        
                        if entity_type == "users":
                            # For users, we need to account for the possibility of an existing admin
                            expected_count = len(structure_entities)
                            if self.existing_admin and self.use_existing_admin:
                                expected_count -= 1  # Subtract 1 if we're using an existing admin
                            
                            if len(db_entities) != expected_count:
                                print(f"Mismatch in {entity_type} count. Expected: {expected_count}, Found: {len(db_entities)}")
                                return False
                        else:
                            if len(db_entities) != len(structure_entities):
                                print(f"Mismatch in {entity_type} count. Expected: {len(structure_entities)}, Found: {len(db_entities)}")
                                return False
                        
                        # Check for the presence of each entity by name or email
                        for entity in structure_entities:
                            if entity_type == "users" and self.existing_admin and self.use_existing_admin and entity == structure_entities[0]:
                                continue  # Skip the first user if we're using an existing admin
                            
                            identifier = entity.get('name') or entity.get('email')
                            if not any(db_entity.get('name') == identifier or db_entity.get('email') == identifier for db_entity in db_entities):
                                print(f"Entity not found in database: {entity_type} - {identifier}")
                                return False
            
            print("All entities validated successfully")
            return True
        
        except Exception as e:
            print(f"Error during validation: {str(e)}")
            return False

async def main():
    print("Initializing Backend API")
    api = InitializationBackendAPI()

    existing_data = await api.check_existing_data()
    if existing_data:
        print("Warning: The database already contains data.")
        action = input("Do you want to (A)ppend new data, (S)kip initialization, or (C)ancel? [A/S/C]: ").upper()
        if action == 'S':
            print("Initialization skipped.")
            return
        elif action == 'C':
            print("Operation cancelled.")
            return
        elif action != 'A':
            print("Invalid input. Proceeding with initialization.")
    else:
        print("No existing data found. Proceeding with full initialization.")

    try:
        await api.handle_admin_user(DB_STRUCTURE)
        
        # Update the DB_STRUCTURE with the new admin user details if a new admin was created
        if not api.existing_admin or not api.use_existing_admin:
            DB_STRUCTURE.users[0] = api.admin_data
        
        success = await api.initialize_database(DB_STRUCTURE)
        if success:
            print("Database initialization completed")
            
            # Validate initialization
            print("Validating initialization...")
            try:
                validation_success = await api.validate_initialization()
                if validation_success:
                    print("Initialization validated successfully")
                else:
                    print("Initialization validation failed")
            except Exception as e:
                print(f"Error during initialization validation: {str(e)}")
            
            # Validate admin token
            print("Validating admin token...")
            try:
                validation_result = api.validate_token(api.admin_token)
                if validation_result["valid"]:
                    print("Admin token is valid")
                else:
                    print(f"Admin token validation failed: {validation_result['message']}")
            except Exception as e:
                print(f"Error during admin token validation: {str(e)}")
        else:
            print("Database initialization failed")
    except Exception as e:
        print("An error occurred during initialization:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print("Traceback:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())