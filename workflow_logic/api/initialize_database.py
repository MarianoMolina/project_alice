import aiohttp, asyncio, getpass
from aiohttp import ClientError
from dotenv import load_dotenv, find_dotenv, set_key
from typing import get_type_hints, get_origin, get_args, Dict, Any, Optional, Union, Tuple
from pydantic import BaseModel, Field
from tqdm import tqdm
from workflow_logic.core import AliceAgent, AliceChat, Prompt, AliceModel, AliceTask, DatabaseTaskResponse, ParameterDefinition, FunctionParameters
from workflow_logic.util import User
from workflow_logic.api.api_utils import create_task_from_json, EntityType
from workflow_logic.api.db import BackendAPI
from workflow_logic.api.initialization_data import DBStructure, DB_STRUCTURE

class InitializationBackendAPI(BackendAPI):
    entity_key_map: Dict[EntityType, Dict[str, Dict[str, any]]] = Field(default_factory=lambda: {
        "users": {}, 
        "models": {}, 
        "prompts": {}, 
        "agents": {}, 
        "tasks": {}, 
        "chats": {}, 
        "parameters": {}, 
        "task_responses": {}
    }, description="Map of entity keys to entity objects")
    collection_map: Dict[EntityType, str] = Field(default_factory=lambda: {
        "users": "users",
        "models": "models",
        "prompts": "prompts",
        "agents": "agents",
        "tasks": "tasks",
        "chats": "chats", 
        "parameters": "parameters",
        "task_responses": "taskresults"
    }, description="Map of entity types to collection names")
    entity_class_map: Dict[str, BaseModel] = Field(default_factory=lambda: {
        "agents": AliceAgent,
        "chats": AliceChat,
        "prompts": Prompt,
        "models": AliceModel,
        "tasks": AliceTask,
        "users": User,
        "parameters": ParameterDefinition, 
        "task_responses": DatabaseTaskResponse
    }, description="Map of entity types to Pydantic model classes")
    existing_admin: Optional[User] = Field(default=None, description="Existing admin user data")
    admin_data: Optional[User] = Field(default=None, description="Active admin user data")
    admin_password: Optional[str] = Field(default=None, description="Active admin user password")
    use_existing_admin: bool = Field(default=False, description="Flag to use existing admin user")

    async def create_admin_user(self, admin_data: User) -> str:
        url = f"{self.base_url}/users/register"
        headers = {"Content-Type": "application/json"}

        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=admin_data.model_dump(), headers=headers) as response:
                response.raise_for_status()
                result = await response.json()
                admin_data.id = result['_id']
                return admin_data

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

    async def store_admin_token(self, token: str) -> None:
        dotenv_path = find_dotenv()
        if not dotenv_path:
            raise FileNotFoundError(".env file not found")
        set_key(dotenv_path, "ADMIN_TOKEN", token)
        load_dotenv(dotenv_path, override=True)
        print("Admin token has been updated in the .env file")

    def get_entity_class(self, entity_type: EntityType) -> BaseModel:
        return self.entity_class_map.get(entity_type)
    
    def _get_entity_instance(self, entity_type: EntityType, entity_data: dict) -> BaseModel:
        EntityClass = self.get_entity_class(entity_type)
        try:
            if entity_type == "tasks":
                entity_data.pop("key", None)
                entity_instance = create_task_from_json(entity_data)
            else:
                entity_instance = EntityClass(**entity_data)
            return entity_instance
        except Exception as e:
            print(f"Error creating entity instance for {entity_type}: {entity_data}")
            print_traceback()
            raise e

    async def create_entity(self, entity_type: EntityType, entity_data: dict) -> str:
        
        # Resolve references in the data before creating the instance
        resolved_data = await self.resolve_references_in_data(entity_type, entity_data)
        
        # entity_instance = self._get_entity_instance(entity_type, resolved_data)
        # entity_dict = entity_instance.model_dump(by_alias=True, exclude_unset=True)
        # # Ensure 'id' is mapped to '_id' for MongoDB
        # if 'id' in entity_dict:
        #     entity_dict['_id'] = entity_dict.pop('id')

        collection_name = self.collection_map[entity_type]
        url = f"{self.base_url}/{collection_name}"
        headers = self._get_headers()

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, json=resolved_data, headers=headers) as response:
                    if response.status == 400:
                        error_data = await response.json()
                        print_traceback()
                        raise ValueError(f"Bad request when creating {entity_type}: {error_data}")
                    
                    response.raise_for_status()
                    result = await response.json()
                    print(f'Created {entity_type[:-1]}: {entity_data.get("key", entity_data.get("name", entity_data.get("email")))}')
                    self.entity_key_map[entity_type][entity_data.get('key') or entity_data.get('name')] = result
                    return result
            except aiohttp.ClientResponseError as e:
                print(f"HTTP error during entity creation: {e.status} - {e.message}")
                print(f"Entity data: {resolved_data}")
                print_traceback()
                raise
            except Exception as e:
                print(f"Unexpected error during entity creation: {str(e)}")
                print(f"Entity data: {resolved_data}")
                print_traceback()
                raise

    async def resolve_references_in_data(self, entity_type: EntityType, data: Dict[str, Any]) -> Dict[str, Any]:
        EntityClass = self.get_entity_class(entity_type)
        resolved_data = data.copy()
        
        for field, field_type in get_type_hints(EntityClass).items():
            if field in resolved_data:
                value = resolved_data[field]
                origin = get_origin(field_type)
                args = get_args(field_type)

                # Handle Optional types
                if origin is Union and type(None) in args:
                    field_type = next(arg for arg in args if arg is not type(None))
                    origin = get_origin(field_type)
                    args = get_args(field_type)

                if isinstance(value, str):
                    if isinstance(field_type, type) and issubclass(field_type, BaseModel):
                        referenced_entity_type = next((et for et, cls in self.entity_class_map.items() if cls == field_type), None)
                        if referenced_entity_type:
                            resolved_value = await self.get_entity_by_key(referenced_entity_type, value)
                            resolved_data[field] = resolved_value
                elif isinstance(value, list):
                    if args and isinstance(args[0], type) and issubclass(args[0], BaseModel):
                        referenced_entity_type = next((et for et, cls in self.entity_class_map.items() if cls == args[0]), None)
                        if referenced_entity_type:
                            resolved_list = []
                            for item in value:
                                if isinstance(item, str):
                                    resolved_item = await self.get_entity_by_key(referenced_entity_type, item)
                                    resolved_list.append(resolved_item)
                                elif isinstance(item, dict) and 'key' in item:
                                    resolved_item = await self.get_entity_by_key(referenced_entity_type, item['key'])
                                    resolved_list.append(resolved_item)
                                else:
                                    resolved_list.append(item)
                            resolved_data[field] = resolved_list
                elif isinstance(value, dict):
                    if isinstance(field_type, type) and issubclass(field_type, FunctionParameters):
                        # Special handling for FunctionParameters
                        resolved_data[field] = await self.resolve_function_parameters(value)
                    elif isinstance(field_type, type) and issubclass(field_type, BaseModel):
                        referenced_entity_type = next((et for et, cls in self.entity_class_map.items() if cls == field_type), None)
                        if referenced_entity_type:
                            if 'key' in value:
                                resolved_value = await self.get_entity_by_key(referenced_entity_type, value['key'])
                                resolved_data[field] = resolved_value
                            else:
                                resolved_data[field] = await self.resolve_references_in_data(referenced_entity_type, value)
                    else:
                        # New handling for dictionaries of references
                        resolved_dict = {}
                        for key, item in value.items():
                            if isinstance(item, str):
                                # Attempt to resolve the reference
                                for ref_type in self.entity_class_map.keys():
                                    try:
                                        resolved_item = await self.get_entity_by_key(ref_type, item)
                                        resolved_dict[key] = resolved_item
                                        break
                                    except ValueError:
                                        continue
                                else:
                                    # If no resolution was successful, keep the original string
                                    resolved_dict[key] = item
                            elif isinstance(item, dict):
                                # Recursively resolve nested dictionaries
                                resolved_dict[key] = await self.resolve_references_in_data(entity_type, item)
                            else:
                                resolved_dict[key] = item
                        resolved_data[field] = resolved_dict

        return resolved_data

    async def resolve_function_parameters(self, func_params: Dict[str, Any]) -> Dict[str, Any]:
        resolved = func_params.copy()
        if 'properties' in resolved:
            for key, value in resolved['properties'].items():
                if isinstance(value, str):
                    # Assume this is a parameter reference
                    try:
                        parameter = await self.get_entity_by_key('parameters', value)
                        resolved['properties'][key] = parameter
                    except ValueError:
                        # If not found, leave as is
                        pass
        return resolved

    async def get_entity_by_key(self, entity_type: EntityType, key: str) -> Dict[str, Any]:
        entity = self.entity_key_map[entity_type].get(key)
        if not entity:
            raise ValueError(f"Unable to find entity ID: {entity_type} with key {key}")
        return entity

    async def check_existing_data(self, max_retries=3, retry_delay=1) -> bool:
        for attempt in range(max_retries):
            try:
                for collection in self.collection_map.values():
                    url = f"{self.base_url}/{collection}"
                    headers = self._get_headers()
                    async with aiohttp.ClientSession() as session:
                        async with session.get(url, headers=headers, timeout=30) as response:
                            if response.status == 200:
                                data = await response.json()
                                if data:
                                    return True
                return False
            except (ClientError, asyncio.TimeoutError) as e:
                if attempt == max_retries - 1:
                    print(f"Failed to check existing data after {max_retries} attempts: {str(e)}")
                    raise
                print(f"Attempt {attempt + 1} failed, retrying in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)

    async def initialize_database(self, db_structure: DBStructure) -> bool:
        try:
            # Login as admin and get JWT
            admin_token = await self.login_admin_user(self.admin_data.email, self.admin_password)
            
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
                    await self.create_entities_by_type(entity_type, db_structure, pbar)
            return True
        except Exception as e:
            print(f"Error in initialize_database: {str(e)}")
            print_traceback()   
        
    async def create_entities_by_type(self, entity_type: EntityType, db_structure: DBStructure, pbar: tqdm) -> bool:
        entities = getattr(db_structure, entity_type, [])
        for entity_data in entities:
            try:
                await self.create_entity(entity_type, entity_data)
            except aiohttp.ClientResponseError as e:
                if e.status == 409:
                    print(f"Entity already exists: {entity_type} - {entity_data.get('name', entity_data.get('email'))}")
                else:
                    print(f"Error creating entity {entity_type}: {str(e)}")
                    print(f"Entity data: {entity_data}")
                    print_traceback()
                    # If you want to stop the entire process on any error, uncomment the next line
                    # raise
            except Exception as e:
                print(f"Unexpected error creating entity {entity_type}: {str(e)}")
                print(f"Entity data: {entity_data}")
                print_traceback()
                # If you want to stop the entire process on any error, uncomment the next line
                # raise
            pbar.update(1)
        
    async def get_admin_user(self) -> Optional[User]:
        url = f"{self.base_url}/users?role=admin"
        headers = self._get_headers()
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    users = await response.json()
                    return User(**users[0]) if users else None
                return None

    async def handle_admin_user(self, db_structure: DBStructure):
        self.existing_admin = await self.get_admin_user()
        if self.existing_admin:
            print(f"Existing admin user found: {self.existing_admin.email}")
            self.use_existing_admin = input("Use existing admin? (y/n): ").lower() == 'y'
            if self.use_existing_admin:
                self.admin_data = self.existing_admin
                self.admin_password = getpass.getpass(f"Enter password for existing admin with email {self.existing_admin.email}: ")
            else:
                self.admin_data, self.admin_password = self.get_new_admin_data()
        else:
            print("No existing admin user found. Creating new admin.")
            self.admin_data, self.admin_password = self.get_new_admin_data()

        if not self.existing_admin or not self.use_existing_admin:
            self.admin_data = await self.create_admin_user(self.admin_data)

    def get_new_admin_data(self) -> Tuple[User, str]:
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
        
        return User(**admin_data), admin_password
    
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
                            if not self.existing_admin and not self.use_existing_admin:
                                expected_count += 1  # Add 1 if we're creating an admin

                            if len(db_entities) != expected_count:
                                print(f"Mismatch in {entity_type} count. Expected: {expected_count}, Found: {len(db_entities)}")
                                return False
                        else:
                            if len(db_entities) != len(structure_entities):
                                print(f"Mismatch in {entity_type} count. Expected: {len(structure_entities)}, Found: {len(db_entities)}")
                                return False
                        
                        # Check for the presence of each entity by name or email
                        for entity in structure_entities:
                            
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
        print_traceback()

def print_traceback():
    print("Traceback:")
    import traceback
    traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())