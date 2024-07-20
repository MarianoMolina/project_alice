from workflow_logic.util.logging_config import LOGGER
from typing import get_type_hints, get_origin, get_args, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict
from workflow_logic.core import AliceAgent, AliceChat, Prompt, AliceModel, AliceTask, DatabaseTaskResponse, ParameterDefinition, FunctionParameters
from workflow_logic.util import User
from workflow_logic.core.api import API
from workflow_logic.core.api.api_utils import EntityType, available_task_types

class DBInitManager(BaseModel):
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

    def get_entity_class(self, entity_type: EntityType) -> BaseModel:
        return self.entity_class_map.get(entity_type)
    
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
                    resolved_task = self.entity_key_map["tasks"].get(task_data)
                    if not resolved_task:
                        raise ValueError(f"Referenced task '{task_data}' not found in entity_key_map")
                    task_dict["tasks"][task_key] = self.create_task_from_json(resolved_task)
                elif isinstance(task_data, dict):
                    # This is a new task definition
                    task_dict["tasks"][task_key] = self.create_task_from_json(task_data)
                else:
                    raise ValueError(f"Invalid task data for key '{task_key}': {task_data}")

        for task_class in available_task_types:
            if task_type == task_class.__name__:
                try:
                    return task_class(**task_dict)
                except Exception as e:
                    LOGGER.error(f"Error creating task of type {task_type}: {str(e)}")
                    LOGGER.error(f"Task data: {task_dict}")
                    raise

        raise ValueError(f"Task type {task_type} not found in available task types.")
        
    def _get_entity_instance(self, entity_type: EntityType, entity_data: dict) -> BaseModel:
        EntityClass = self.get_entity_class(entity_type)
        try:
            if entity_type == "tasks":
                entity_data.pop("key", None)
                entity_instance = self.create_task_from_json(entity_data)
            elif entity_type == "chats":
                entity_instance = self.create_chat_from_json(entity_data)
            else:
                entity_instance = EntityClass(**entity_data)
            return entity_instance
        except Exception as e:
            print(f"Error creating entity instance for {entity_type}: {entity_data}")
            raise e

    def create_chat_from_json(self, chat_data: dict) -> AliceChat:
        chat_data = chat_data.copy()
        if 'functions' in chat_data and isinstance(chat_data['functions'], list):
            functions = []
            for func in chat_data['functions']:
                if isinstance(func, str):
                    # This is a reference to a task
                    task = self.entity_key_map["tasks"].get(func)
                    if not task:
                        raise ValueError(f"Referenced task '{func}' not found in entity_key_map")
                    functions.append(self.create_task_from_json(task))
                elif isinstance(func, dict):
                    # This is a new task definition
                    functions.append(self.create_task_from_json(func))
                else:
                    raise ValueError(f"Invalid function data: {func}")
            chat_data['functions'] = functions

        return AliceChat(**chat_data)

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