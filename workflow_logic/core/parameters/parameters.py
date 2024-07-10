from pydantic import BaseModel, Field
from typing import Annotated, Optional, Any, Literal, Dict,List
    
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
    type: Annotated[Literal["object"], Field(description="Type of the parameters")]
    properties: Annotated[Dict[str, ParameterDefinition], Field(description="Dict of parameters name to their type, description, and default value")]
    required: Annotated[List[str], Field(description="Required parameters")]

class FunctionConfig(BaseModel):
    """A function as defined by the OpenAI API"""
    name: Annotated[str, Field(description="Name of the function")]
    description: Annotated[str, Field(description="Description of the function")]
    parameters: Annotated[FunctionParameters, Field(description="Parameters of the function")]

class ToolFunction(BaseModel):
    """A function under tool as defined by the OpenAI API."""
    type: Annotated[Literal["function"], Field(default="function", description="Type of the tool function")]
    function: Annotated[FunctionConfig, Field(description="Function under tool")]