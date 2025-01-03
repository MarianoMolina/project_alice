from pydantic import BaseModel, Field
from typing import Annotated, Optional, Any, Literal, Dict, List, Union
from anthropic.types import ToolParam
from workflow.core.data_structures.base_models import BaseDataStructure

class ParameterDefinition(BaseDataStructure):
    """
    Defines a single parameter with its type, description, and optional default value.
    """
    type: Annotated[str, Field(description="Type of the parameter")]
    description: Annotated[str, Field(description="Description of the parameter")]
    default: Annotated[Optional[Any], Field(default=None, description="Default value of the parameter")]
    
    def model_dump(self, *args, **kwargs):
        """
        Serializes the parameter definition, ensuring proper handling of default values
        and maintaining compatibility with OpenAI's function call format.
        """
        # Get base serialization from parent
        data = super().model_dump(*args, **kwargs)
        
        # Only include default if it's not None
        if self.default is None:
            data.pop('default', None)
            
        return data
    
    def get_dict(self) -> Dict[str, Any]:
        dict_data = {
            "type": self.type,
            "description": self.description
        }
        if self.default is not None:
            dict_data["default"] = self.default
        return dict_data
    
    def get_gemini_parameter(self) -> Dict[str, Any]:
        description = self.description
        if self.default is not None:
            description += f" (default: {self.default})"
        return {
            "type": self.type,
            "description": description,
        }

    @classmethod
    def model_validate(cls, obj: Any):
        if isinstance(obj, dict) and 'default' not in obj:
            obj = obj.copy()
            obj['default'] = None
        return super().model_validate(obj)

class FunctionParameters(BaseModel):
    """
    Parameters of a function as defined by the OpenAI API.
    Handles the overall parameter structure including properties and required fields.
    """
    type: Annotated[Literal["object"], Field(default="object", description="Type of the parameters")]
    properties: Annotated[Dict[str, ParameterDefinition], Field(description="Dict of parameters name to their type, description, and default value")]
    required: Annotated[List[str], Field(default_factory=list, description="Required parameters")]
    
    def model_dump(self, *args, **kwargs):
        """
        Serializes the function parameters into the OpenAI function call format.
        """
        return {
            "type": self.type,
            "properties": {
                param_name: param.model_dump(*args, **kwargs)
                for param_name, param in self.properties.items()
            },
            "required": self.required
        }
    
    def get_dict(self) -> Dict[str, Any]:
        dict_data = {
            "type": self.type,
            "properties": {
                param_name: param.get_dict()
                for param_name, param in self.properties.items()
            }
        }
        if self.required:
            dict_data["required"] = self.required
        return dict_data
    
    def get_gemini_function(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "properties": {
                param_name: param.get_gemini_parameter()
                for param_name, param in self.properties.items()
            },
        }
    
class FunctionConfig(BaseModel):
    """A function as defined by the OpenAI API"""
    name: Annotated[str, Field(description="Name of the function")]
    description: Annotated[str, Field(description="Description of the function")]
    parameters: Annotated[FunctionParameters, Field(description="Parameters of the function")]

    def convert_to_tool_params(self) -> ToolParam:
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.parameters.get_dict()
        }
    
    def get_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters.get_dict()
        }
    
    def model_dump(self, *args, **kwargs):
        data = super().model_dump(*args, **kwargs)
        data['parameters'] = self.parameters.model_dump(*args, **kwargs)
        return data
 
class ToolFunction(BaseModel):
    """A function under tool as defined by the OpenAI API."""
    type: Annotated[Literal["function"], Field(default="function", description="Type of the tool function")]
    function: Annotated[FunctionConfig, Field(description="Function under tool")]

    def convert_to_tool_params(self) -> ToolParam:
        return self.function.convert_to_tool_params()
    
    def get_dict(self) -> Dict[str, Any]:
        dict_data = {
            "type": self.type,
            "function": self.function.get_dict()
        }
        return dict_data
    
    def model_dump(self, *args, **kwargs):
        data = super().model_dump(*args, **kwargs)
        data['function'] = self.function.model_dump(*args, **kwargs)
        return data


def ensure_tool_function(item: Union[ToolFunction, Dict[str, Any]]) -> ToolFunction:
    if isinstance(item, ToolFunction):
        return item
    elif isinstance(item, dict):
        return ToolFunction(**item)
    else:
        raise ValueError("Item must be either a ToolFunction instance or a dictionary.")