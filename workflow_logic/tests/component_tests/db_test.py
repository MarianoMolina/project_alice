import traceback
from typing import Dict, Any
from pydantic import ValidationError
from workflow_logic.util.logging_config import LOGGER
from workflow_logic.db_app import DBStructure, DBInitManager, BackendFunctionalityAPI
from workflow_logic.tests.component_tests.test_environment import TestModule

class DBTests(TestModule):
    name: str = "DBTests"
    async def run(self, db_structure: DBStructure, **kwargs) -> Dict[str, Any]:
        test_results = {}
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
                        test_results[f"{entity_type}_{entity_data.get('key')}_validation"] = "Success"
                    except Exception as e:
                        LOGGER.error(traceback.format_exc())
                        test_results[f"{entity_type}_{entity_data.get('key')}_validation"] = str(e)
            test_results["initialization"] = "Success"
        except Exception as e:
            test_results["initialization"] = str(e)

        return {
            "test_results": test_results,
            "outputs": {"db_init_manager": db_init_manager}
        }