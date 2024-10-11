import aiohttp
from typing import get_args, Optional
from pydantic import Field
from tqdm import tqdm
from workflow.core import APIManager
from workflow.core.data_structures import EntityType
from workflow.util import LOGGER
from workflow.db_app.initialization import DBStructure, DBInitManager
from workflow.db_app.app.db import BackendAPI

class BackendFunctionalityAPI(BackendAPI):
    """
    Extends BackendAPI with additional functionality for database initialization and validation.

    This class provides methods to initialize the database with a given structure,
    create entities of various types, and validate the initialization process.

    Attributes:
        temp_db_instance (Optional[DBInitManager]): Temporary database instance for initialization.

    Methods:
        initialize_database(db_structure: DBStructure) -> bool:
            Initializes the database with the given structure.

        create_entities_by_type(entity_type: EntityType, db_structure: DBStructure, pbar: tqdm) -> bool:
            Creates entities of a specific type from the database structure.

        validate_initialization(db_structure: DBStructure) -> bool:
            Validates that the database was initialized correctly.

        api_setter() -> APIManager:
            Sets up and returns an APIManager instance with the current APIs.

    Example:
        >>> api = BackendFunctionalityAPI(base_url="http://api.example.com", user_token="your_token_here")
        >>> success = await api.initialize_database(your_db_structure)
    """
    temp_db_instance: Optional[DBInitManager] = Field(DBInitManager(), description="Temporary database instance for initialization")
        
    async def initialize_database(self, db_structure: DBStructure) -> bool:
        try:
            db_structure_copy = db_structure.model_dump()
            self.temp_db_instance = DBInitManager()
            # Get the list of entity types from EntityType
            entity_types = list(get_args(EntityType))
            
            # Create entities
            total_entities = sum(len(getattr(db_structure, et, [])) for et in entity_types)
            
            with tqdm(total=total_entities, desc="Initializing database") as pbar:
                for entity_type in entity_types:
                    await self.create_entities_by_type(entity_type, db_structure, pbar)
            return await self.validate_initialization(DBStructure(**db_structure_copy))
        except Exception as e:
            LOGGER.error(f"Error in initialize_database: {str(e)}")

    async def create_entities_by_type(self, entity_type: EntityType, db_structure: DBStructure, pbar: tqdm) -> bool:
        entities = getattr(db_structure, entity_type, [])
        for entity_data in entities:
            try:
                await self.temp_db_instance.create_entity_instance(entity_type, entity_data, self)
            except aiohttp.ClientResponseError as e:
                if e.status == 409:
                    LOGGER.error(f"Entity already exists: {entity_type} - {entity_data.get('name', entity_data.get('id', entity_data.get('_id')))}")
                else:
                    LOGGER.error(f"Error creating entity {entity_type}: {str(e)}")
                    LOGGER.error(f"Entity data: {entity_data}")
                    # If you want to stop the entire process on any error, uncomment the next line
                    # raise
            except Exception as e:
                LOGGER.error(f"Unexpected error creating entity {entity_type}: {str(e)}")
                LOGGER.error(f"Entity data: {entity_data}")
                # If you want to stop the entire process on any error, uncomment the next line
                # raise
            pbar.update(1)

    async def validate_initialization(self, db_structure: DBStructure) -> bool:
        try:
            for entity_type in get_args(EntityType):
                if entity_type == 'users':
                    continue
                url = f"{self.base_url}/{self.collection_map[entity_type]}"
                headers = self._get_headers()
                
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, headers=headers) as response:
                        response.raise_for_status()
                        db_entities = await response.json()
                        
                        structure_entities = getattr(db_structure, entity_type, [])
                        
                        
                        if len(db_entities) != len(structure_entities):
                            LOGGER.error(f"Mismatch in {entity_type} count. Expected: {len(structure_entities)}, Found: {len(db_entities)}")
                            return False
                        
                        # Check for the presence of each entity by name or email
                        for entity in structure_entities:
                            
                            identifier = entity.get('name') or entity.get('email')
                            if not any(db_entity.get('name') == identifier or db_entity.get('email') == identifier for db_entity in db_entities):
                                LOGGER.error(f"Entity not found in database: {entity_type} - {identifier}")
                                return False
            
            LOGGER.info("All entities validated successfully")
            return True
        
        except Exception as e:
            LOGGER.error(f"Error during validation: {str(e)}")
            return False
        
    async def api_setter(self) -> APIManager:
        api_manager = APIManager()
        apis = await self.get_apis()
        for api in apis.values():
            api_manager.add_api(api)
        return api_manager