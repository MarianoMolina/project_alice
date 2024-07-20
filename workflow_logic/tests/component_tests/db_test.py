from typing import Dict, Any
from pydantic import ValidationError
from asynctest import patch
from workflow_logic.db_app.initialization_data import DBStructure
from workflow_logic.db_app.init_db import DBInitManager
from workflow_logic.db_app.db import BackendAPI
from workflow_logic.tests.component_tests.test_environment import TestModule

class DBTests(TestModule):
    name: str = "DBTests"

    async def run(self, db_structure: DBStructure, **kwargs) -> Dict[str, Any]:
        test_results = {}
        db_init_manager = None
        backend_api = BackendAPI()
        backend_api.temp_db_instance = DBInitManager()
        db_init_manager = backend_api.temp_db_instance

        async def mock_create_entity(entity_type: str, entity_data: dict) -> dict:
            return await self._mock_create_entity(backend_api, entity_type, entity_data)

        with patch.object(BackendAPI, 'create_entity', side_effect=mock_create_entity):
            try:
                # Step 1: Initialize all entities
                for entity_type in db_structure.__annotations__:
                    entities = getattr(db_structure, entity_type)
                    for entity_data in entities:
                        await backend_api.create_entity(entity_type, entity_data)
                test_results["initialization"] = "Success"

                # Step 2: Validate all entities
                for entity_type, entities in db_init_manager.entity_key_map.items():
                    for key, entity_data in entities.items():
                        try:
                            # Resolve references before validation
                            resolved_data = await db_init_manager.resolve_references_in_data(entity_type, entity_data)
                            db_init_manager.entity_obj_key_map[entity_type][key] = db_init_manager._get_entity_instance(entity_type, resolved_data)
                        except ValidationError as e:
                            test_results[f"{entity_type}_{key}_validation"] = str(e)
                        except Exception as e:
                            test_results[f"{entity_type}_{key}_validation"] = f"Unexpected error: {str(e)}"
                        else:
                            test_results[f"{entity_type}_{key}_validation"] = "Success"
            except Exception as e:
                test_results["initialization"] = str(e)

        return {
            "test_results": test_results,
            "outputs": {"db_init_manager": db_init_manager}
        }

    @staticmethod
    async def _mock_create_entity(backend_api: BackendAPI, entity_type: str, entity_data: dict) -> dict:
        resolved_data = await backend_api.temp_db_instance.resolve_references_in_data(entity_type, entity_data)
        key = resolved_data.get('key') or resolved_data.get('name')
        backend_api.temp_db_instance.entity_key_map[entity_type][key] = resolved_data
        return resolved_data