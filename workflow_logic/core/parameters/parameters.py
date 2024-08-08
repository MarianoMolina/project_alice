from pydantic import BaseModel, Field
from typing import Annotated, Optional, Any, Literal, Dict, List, Union
from anthropic.types import ToolParam

class ParameterDefinition(BaseModel):
    id: Optional[str] = Field(None, description="The parameter ID", alias="_id")
    type: Annotated[str, Field(description="Type of the parameter")]
    description: Annotated[str, Field(description="Description of the parameter")]
    default: Annotated[Optional[Any], Field(default=None, description="Default value of the parameter")]

    def model_dump(self, **kwargs):
        data = super().model_dump(**kwargs)
        if data['default'] is None:
            del data['default']
        return data

    @classmethod
    def model_validate(cls, obj: Any):
        if isinstance(obj, dict) and 'default' not in obj:
            obj = obj.copy()
            obj['default'] = None
        return super().model_validate(obj)

class FunctionParameters(BaseModel):
    """Parameters of a function as defined by the OpenAI API"""
    type: Annotated[Literal["object"], Field("object", description="Type of the parameters")]
    properties: Annotated[Dict[str, ParameterDefinition], Field(description="Dict of parameters name to their type, description, and default value")]
    required: Annotated[List[str], Field(description="Required parameters")]

    def model_dump(self, **kwargs):
        input_schema = {
            "type": "object",
            "properties": {},
            "required": self.required
        }
        
        for param_name, param in self.properties.items():
            param_schema = {
                "type": param.type,
                "description": param.description
            }
            if param.default is not None:
                param_schema["default"] = param.default
            input_schema["properties"][param_name] = param_schema
        
        return input_schema
    
class FunctionConfig(BaseModel):
    """A function as defined by the OpenAI API"""
    name: Annotated[str, Field(description="Name of the function")]
    description: Annotated[str, Field(description="Description of the function")]
    parameters: Annotated[FunctionParameters, Field(description="Parameters of the function")]

    def convert_to_tool_params(self) -> ToolParam:
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.parameters.model_dump()
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
    
    def model_dump(self, *args, **kwargs):
        data = super().model_dump(*args, **kwargs)
        data['function'] = self.function.model_dump(*args, **kwargs)
        return data

class ToolCallConfig(BaseModel):
    """A tool call config as defined by the OpenAI API"""
    arguments: Annotated[Union[Dict[str, Any], str], Field(description="Arguments to the tool call")]
    name: Annotated[str, Field(description="Name of the tool call")]

    def model_dump(self, *args, **kwargs):
        data = super().model_dump(*args, **kwargs)
        if isinstance(self.arguments, dict):
            data['arguments'] = {k: v.model_dump(*args, **kwargs) if isinstance(v, BaseModel) else v for k, v in self.arguments.items()}
        return data

class ToolCall(BaseModel):
    """A tool call as defined by the OpenAI API"""
    id: Optional[str] = Field(None, description="The tool call ID")
    type: Annotated[Literal["function"], Field(default="function", description="Type of the tool function")]
    function: Annotated[ToolCallConfig, Field(description="Function under tool")]

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