from copy import deepcopy
from workflow_logic.util.logging_config import LOGGER
from typing import get_type_hints, get_origin, get_args, Dict, Any, Union, Optional, List
from pydantic import BaseModel, Field, ConfigDict, ValidationError
from workflow_logic.db_app.db import BackendAPI
from workflow_logic.core import AliceAgent, AliceChat, Prompt, AliceModel, AliceTask, DatabaseTaskResponse, ParameterDefinition, FunctionParameters
from workflow_logic.util import User
from workflow_logic.core.api import API
from workflow_logic.core.api.api_utils import EntityType
from workflow_logic.core.tasks.task_utils import available_task_types

class DBInitManager(BaseModel):
    """
    Manages the initialization and resolution of database entities.

    This class provides functionality to create, store, and resolve references between
    different types of entities during the database initialization process.

    Attributes:
        entity_key_map (Dict[EntityType, Dict[str, Dict[str, Any]]]): Maps entity keys to their data.
        entity_obj_key_map (Dict[EntityType, Dict[str, BaseModel]]): Maps entity keys to their Pydantic model instances.
        entity_class_map (Dict[str, BaseModel]): Maps entity types to their corresponding Pydantic model classes.

    Methods:
        get_entity_instance(entity_type: EntityType, entity_data: dict) -> BaseModel:
            Creates and returns an instance of the specified entity type.

        create_entity_instance(entity_type: EntityType, entity_data: dict, db_app: Optional[BackendAPI] = None) -> BaseModel:
            Creates an entity instance and stores it in the database if a BackendAPI is provided.

        resolve_references_in_data(entity_type: EntityType, data: Dict[str, Any]) -> Dict[str, Any]:
            Resolves references in the entity data, replacing keys with actual entity instances.

    Private Methods:
        Various private methods to handle specific aspects of entity resolution and creation.

    Example:
        >>> init_manager = DBInitManager()
        >>> entity = await init_manager.create_entity_instance(EntityType.PROMPTS, prompt_data, backend_api)
    """
    entity_key_map: Dict[EntityType, Dict[str, Dict[str, Any]]] = Field(default_factory=lambda: {
        "users": {}, 
        "models": {}, 
        "prompts": {}, 
        "agents": {}, 
        "tasks": {}, 
        "chats": {}, 
        "parameters": {}, 
        "task_responses": {},
        "apis": {}
    }, description="Map of entity keys to entity objects")
    entity_obj_key_map: Dict[EntityType, Dict[str, BaseModel]] = Field(default_factory=lambda: {
        "users": {}, 
        "models": {}, 
        "prompts": {}, 
        "agents": {}, 
        "tasks": {}, 
        "chats": {}, 
        "parameters": {}, 
        "task_responses": {},
        "apis": {}
    }, description="Map of entity keys to Pydantic model instances")
    entity_class_map: Dict[str, BaseModel] = Field(default_factory=lambda: {
        "agents": AliceAgent,
        "chats": AliceChat,
        "prompts": Prompt,
        "models": AliceModel,
        "tasks": AliceTask,
        "users": User,
        "parameters": ParameterDefinition, 
        "task_responses": DatabaseTaskResponse,
        "apis": API
    }, description="Map of entity types to Pydantic model classes")
    model_config = ConfigDict(arbitrary_types_allowed=True)

    def _get_entity_class(self, entity_type: EntityType) -> BaseModel:
        return self.entity_class_map.get(entity_type)
        
    def get_entity_instance(self, entity_type: EntityType, entity_data: dict) -> BaseModel:
        EntityClass = self._get_entity_class(entity_type)
        entity_data_copy = self.clean_entity_object(deepcopy(entity_data))
        entity_data_copy.pop("key", None)
        try:
            if entity_type == "tasks":
                entity_instance = self.create_task_from_json(entity_data_copy)
            elif entity_type == "chats":
                entity_instance = self.create_chat_from_json(entity_data_copy)
            else:
                entity_instance = EntityClass(**entity_data_copy)
            return entity_instance
        except Exception as e:
            if entity_type not in ["tasks", "chats"]: LOGGER.error(f"Error creating entity instance for {entity_type}")
            raise e
        
    def clean_entity_object(self, entity_data: dict) -> dict:
        return {k: v for k, v in entity_data.items() if v}

    def get_entity_by_key(self, entity_type: EntityType, key: str) -> Dict[str, Any]:
        entity = self.entity_key_map[entity_type].get(key).copy
        if not entity:
            raise ValueError(f"Unable to find entity dict by key: {entity_type}\n key: {key}")
        return entity
    
    def get_entity_instance_by_key(self, entity_type: EntityType, key: str) -> BaseModel:
        LOGGER.debug(f"Getting entity instance for {entity_type} with key {key}")
        entity = self.entity_obj_key_map[entity_type].get(key)
        if not entity:
            LOGGER.error(f"Unable to find entity instance with key: {entity_type}, key: {key}")
            raise ValueError(f"Unable to find entity instance with key: {entity_type}, key: {key}")
        LOGGER.debug(f"Retrieved entity instance: {entity}")
        LOGGER.debug(f"Current {entity_type} map: {self.entity_obj_key_map[entity_type]}")
        return entity
    
    async def create_entity_instance(self, entity_type: EntityType, entity_data: dict, db_app: Optional[BackendAPI] = None) -> BaseModel:
        try:
            entity_data_copy = self.clean_entity_object(deepcopy(entity_data))
            LOGGER.debug(f"Creating entity instance for {entity_type}: {entity_data_copy}")
            if not entity_data_copy.get('key'):
                raise ValueError(f"Key not found for entity {entity_type}")
            resolved_data = self.resolve_references_in_data(entity_type, entity_data_copy)
            LOGGER.debug(f"Resolved data for {entity_type}: {resolved_data}")
            if db_app:
                response = await db_app.create_entity_in_db(entity_type, resolved_data)
                resolved_data['_id'] = response.get('_id', response.get('id', ''))
                LOGGER.debug(f"Entity created in DB with ID: {resolved_data['_id']}")
            entity_instance = self.get_entity_instance(entity_type, resolved_data)
            LOGGER.debug(f"Created entity instance: {entity_instance}")
            self.entity_obj_key_map[entity_type][entity_data_copy.get('key')] = entity_instance
            LOGGER.debug(f"Stored entity in map: {entity_type}, key: {entity_data_copy.get('key')}, value: {entity_instance}")
            return entity_instance
        except Exception as e:
            LOGGER.error(f"Error creating entity instance for {entity_type}: {str(e)}")
            raise
        
    def create_task_from_json(self, task_dict: dict) -> AliceTask:
        task_type = task_dict.pop("task_type", "")
        if not task_type:
            raise ValueError("Task type not specified in task definition.")

        # Handle nested tasks
        if "tasks" in task_dict:
            nested_tasks = task_dict["tasks"]
            task_dict["tasks"] = {}
            for task_key, task_data in nested_tasks.items():
                if isinstance(task_data, str):
                    # This is a reference to another task
                    resolved_task = self.entity_obj_key_map["tasks"].get(task_data)
                    if not resolved_task:
                        raise ValueError(f"Referenced task '{task_data}' not found in entity_key_map")
                    task_dict["tasks"][task_key] = self.create_task_from_json(resolved_task)
                elif isinstance(task_data, dict):
                    # This is a new task definition
                    task_dict["tasks"][task_key] = self.create_task_from_json(task_data)
                else:
                    LOGGER.error(f"Invalid task data for key '{task_key}': {task_data}")
                    raise ValueError(f"Invalid task data for key '{task_key}': {task_data}")

        for task_class in available_task_types:
            if task_type == task_class.__name__:
                try:
                    return task_class(**task_dict)
                except Exception as e:
                    LOGGER.error(f"Error creating task of type {task_type}: {str(e)} \n Task data: {task_dict}")
                    raise ValidationError(f"Error creating task of type {task_type}: {str(e)}")
        LOGGER.error(f"Task type {task_type} not found in available task types.")
        raise ValueError(f"Task type {task_type} not found in available task types.")
    
    def create_chat_from_json(self, chat_data: dict) -> AliceChat:
        chat_data = deepcopy(chat_data)
        if 'functions' in chat_data and isinstance(chat_data['functions'], list):
            functions = []
            for func in chat_data['functions']:
                if isinstance(func, str):
                    # This is a reference to a task
                    task = self.entity_obj_key_map["tasks"].get(func)
                    if not task:
                        raise ValueError(f"Referenced task '{func}' not found in entity_obj_key_map")
                    functions.append(task)
                elif isinstance(func, dict):
                    # This is a new task definition
                    functions.append(self.create_task_from_json(func))
                elif isinstance(func, AliceTask):
                    functions.append(func)
                else:
                    LOGGER.error(f"Invalid function data: {func}")
                    raise ValueError(f"Invalid function data: {func}")
            chat_data['functions'] = functions

        return AliceChat(**chat_data)
  
    def _resolve_function_parameters(self, func_params: Dict[str, Any]) -> Dict[str, Any]:
        resolved = deepcopy(func_params)
        if 'properties' in resolved:
            for key, value in resolved['properties'].items():
                if isinstance(value, str):
                    # Assume this is a parameter reference
                    try:
                        parameter = self.get_entity_instance_by_key('parameters', value).model_dump(by_alias=True)
                        resolved['properties'][key] = parameter
                    except ValueError:
                        LOGGER.error(f"Unable to resolve parameter reference: {value}")
                        pass
        return resolved
    
    def resolve_references_in_data(self, entity_type: EntityType, data: Dict[str, Any]) -> Dict[str, Any]:
        LOGGER.debug(f"Resolving references for {entity_type}: {data}")
        EntityClass = self._get_entity_class(entity_type)
        
        # Check if this entity has already been resolved
        if self._is_already_resolved(entity_type, data):
            entity = self.entity_obj_key_map[entity_type][data['key']]
            if entity:
                return entity.model_dump(by_alias=True)
            
        resolved_data = deepcopy(data)
        
        for field, field_type in get_type_hints(EntityClass).items():
            if field not in resolved_data:
                continue
            
            value = resolved_data[field]
            if not value:
                resolved_data.pop(field)
                continue
            
            field_type = self._handle_optional_type(field_type)
            origin = get_origin(field_type)
            args = get_args(field_type)
            
            if isinstance(value, str):
                resolved_data[field] = self._resolve_string_value(field_type, value)
                LOGGER.debug(f"Resolved string value for {field}: {resolved_data[field]}")
            elif isinstance(value, list):
                resolved_data[field] = self._resolve_list_value(args, value)
                LOGGER.debug(f"Resolved string value for {field}: {resolved_data[field]}")
            elif isinstance(value, dict):
                resolved_data[field] = self._resolve_dict_value(field_type, origin, args, value)
                LOGGER.debug(f"Resolved string value for {field}: {resolved_data[field]}")
        
        if 'key' in resolved_data:
            resolved_data.pop('key')

        LOGGER.debug(f"Resolved data: {resolved_data}")
        return resolved_data

    def _is_already_resolved(self, entity_type: EntityType, data: Dict[str, Any]) -> bool:
        return 'key' in data and data.get('key') in self.entity_obj_key_map[entity_type]

    def _get_resolved_entity(self, entity_type: EntityType, data: Dict[str, Any]) -> Dict[str, Any]:
        value = self.entity_obj_key_map[entity_type][data['key']]
        EntityClass = self._get_entity_class(entity_type)
        if value is not None and isinstance(value, EntityClass):
            return value.model_dump(by_alias=True)
        self.entity_obj_key_map[entity_type].pop(data['key'])
        return {}

    def _handle_optional_type(self, field_type: Any) -> Any:
        origin = get_origin(field_type)
        args = get_args(field_type)
        if origin is Union and type(None) in args:
            return next(arg for arg in args if arg is not type(None))
        return field_type

    def _resolve_list_value(self, args: Any, value: List[Any]) -> List[Any]:
        if args and isinstance(args[0], type) and issubclass(args[0], BaseModel):
            referenced_entity_type = self._get_referenced_entity_type(args[0])
            if referenced_entity_type:
                return [self._resolve_list_item(referenced_entity_type, item) for item in value]
        return value

    def _resolve_list_item(self, referenced_entity_type: str, item: Any) -> Any:
        if isinstance(item, str):
            return self.get_entity_instance_by_key(referenced_entity_type, item).model_dump(by_alias=True)
        elif isinstance(item, dict) and 'key' in item:
            return self.get_entity_instance_by_key(referenced_entity_type, item['key']).model_dump(by_alias=True)
        return item

    def _resolve_dict_value(self, field_type: Any, origin: Any, args: Any, value: Dict[str, Any]) -> Any:
        if isinstance(field_type, type) and issubclass(field_type, FunctionParameters):
            return self._resolve_function_parameters(value)
        elif isinstance(field_type, type) and issubclass(field_type, BaseModel):
            return self._resolve_basemodel_dict(field_type, value)
        elif origin is dict and len(args) == 2 and isinstance(args[1], type) and issubclass(args[1], BaseModel):
            return self._resolve_dict_with_basemodel_values(args[1], value)
        else:
            return value

    def _resolve_basemodel_dict(self, field_type: Any, value: Dict[str, Any]) -> Any:
        referenced_entity_type = self._get_referenced_entity_type(field_type)
        if referenced_entity_type:
            if 'key' in value:
                return self.get_entity_instance_by_key(referenced_entity_type, value['key']).model_dump(by_alias=True)
            else:
                return self.resolve_references_in_data(referenced_entity_type, value)
        return value

    def _resolve_dict_with_basemodel_values(self, value_type: Any, value: Dict[str, Any]) -> Dict[str, Any]:
        referenced_entity_type = self._get_referenced_entity_type(value_type)
        if referenced_entity_type:
            return {
                key: self._resolve_dict_item(referenced_entity_type, item)
                for key, item in value.items()
            }
        return value

    def _resolve_dict_item(self, referenced_entity_type: str, item: Any) -> Any:
        if isinstance(item, str):
            return self.get_entity_instance_by_key(referenced_entity_type, item).model_dump(by_alias=True)
        elif isinstance(item, dict):
            return self.resolve_references_in_data(referenced_entity_type, item)
        return item

    def _resolve_generic_dict(self, entity_type: EntityType, value: Dict[str, Any]) -> Dict[str, Any]:
        resolved_dict = {}
        for key, item in value.items():
            if isinstance(item, str):
                resolved_dict[key] = self._resolve_string_reference(item)
            elif isinstance(item, dict):
                resolved_dict[key] = self.resolve_references_in_data(entity_type, item)
            else:
                resolved_dict[key] = item
        return resolved_dict

    def _resolve_string_value(self, field_type: Any, value: str) -> Any:
        LOGGER.debug(f"Resolving string value: {value} for field type {field_type}")
        if isinstance(field_type, type) and issubclass(field_type, BaseModel):
            referenced_entity_type = self._get_referenced_entity_type(field_type)
            if referenced_entity_type:
                try:
                    entity = self.get_entity_instance_by_key(referenced_entity_type, value)
                    LOGGER.debug(f"Retrieved entity: {entity}")
                    return entity.model_dump(by_alias=True)
                except ValueError:
                    LOGGER.warning(f"Failed to resolve reference: {value} for {referenced_entity_type}")
        return value

    def _resolve_string_reference(self, item: str) -> Any:
        for ref_type in self.entity_class_map.keys():
            try:
                return self.get_entity_instance_by_key(ref_type, item).model_dump(by_alias=True)
            except ValueError:
                continue
        return item

    def _get_referenced_entity_type(self, field_type: Any) -> Optional[str]:
        return next((et for et, cls in self.entity_class_map.items() if cls == field_type), None)