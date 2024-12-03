from typing import List
from workflow.util import LOGGER, get_traceback
from workflow.db_app import DBStructure, DBInitManager, BackendFunctionalityAPI
from workflow.core import APIManager, API
from pydantic import ValidationError

async def create_virtual_database(db_structure: DBStructure) -> DBInitManager:
    db_init_manager = None
    backend_api = BackendFunctionalityAPI()
    backend_api.temp_db_instance = DBInitManager()
    db_init_manager = backend_api.temp_db_instance
    try:
        for entity_type in db_structure.__annotations__:
            for entity_data in getattr(db_structure, entity_type, []):
                if not entity_data.get("key"):
                    raise ValidationError(f"Key not found for entity {entity_type}")
                try:
                    await backend_api.temp_db_instance.create_entity_instance(entity_type, entity_data)
                except Exception as e:
                    LOGGER.error(f"{e} - {get_traceback()}")
    except Exception as e:
        LOGGER.error(f"{e} - {get_traceback()}")
    return db_init_manager

def api_setter(apis: List[API]) -> APIManager:
    api_manager = APIManager()
    for api in apis:
        if not api.id:
            # Generate an ID for the API
            api.id = api.name.lower().replace(" ", "_")
        LOGGER.info(f"Adding API: {api.name}")
        api_manager.add_api(api)
    return api_manager