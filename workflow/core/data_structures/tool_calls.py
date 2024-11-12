from pydantic import BaseModel, Field, model_validator
from typing import Annotated, Optional, Any, Literal, Dict, Union
from workflow.core.data_structures.base_models import Embeddable

class ToolCallConfig(BaseModel):
    """A tool call config"""
    arguments: Annotated[Union[Dict[str, Any], str], Field(description="Arguments to the tool call")]
    name: Annotated[str, Field(description="Name of the tool call")]

    def model_dump(self, *args, **kwargs):
        data = super().model_dump(*args, **kwargs)
        if isinstance(self.arguments, dict):
            data['arguments'] = {k: v.model_dump(*args, **kwargs) if isinstance(v, BaseModel) else v for k, v in self.arguments.items()}
        return data
    
    def __str__(self):
        return f"Config:\nTool Name: {self.name}\nArguments: {self.arguments}"

class ToolCall(Embeddable):
    """A tool call as defined by the OpenAI API"""
    id: Optional[str] = Field(None, description="The tool call ID")
    type: Annotated[Literal["function"], Field(default="function", description="Type of the tool function")]
    function: Annotated[ToolCallConfig, Field(description="Function under tool")]

    @model_validator(mode='before')
    @classmethod
    def validate_function(cls, data: Dict) -> Dict:
        """Ensures the function field is an instance of ToolCallConfig"""
        if not data.get('function'):
            return data
            
        if not isinstance(data['function'], ToolCallConfig):
            # If function is a dict, convert it to ToolCallConfig
            data['function'] = ToolCallConfig(**data['function'])
        return data

    def model_dump(self, *args, **kwargs):
        data = super().model_dump(*args, **kwargs)
        data['function'] = self.function.model_dump(*args, **kwargs)
        return data
    
    def __str__(self):
        string: str = "Tool Call:\n"
        if self.id:
            string += f"ID: {self.id}\n"
        string += str(self.function)
        return string