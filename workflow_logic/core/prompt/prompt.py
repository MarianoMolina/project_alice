import re
from jinja2 import Template
from typing import Optional, List, Any, Mapping
from pydantic import BaseModel, Field, field_validator
from workflow_logic.core.parameters import FunctionParameters

class Prompt(BaseModel):
    id: Optional[str] = Field(default="", description="The unique ID of the prompt, must match the ID in the database", alias="_id")
    name: str = Field(..., description="The name of the prompt.")
    content: str = Field(..., description="The content of the prompt.")

    def format(self, **kwargs: Any) -> str:
        """Format the prompt with the inputs using Jinja2 templating."""
        template = Template(self.content)
        return template.render(**kwargs)
    
    def format_prompt(self, **kwargs: Any) -> str:
        return self.format(**kwargs)

    def get_template(self) -> Template:
        return Template(self.content)
    
class TemplatedPrompt(Prompt):
    parameters: FunctionParameters = Field(..., description="The parameters that the prompt expects.")
    partial_variables: Mapping[str, Any] = Field(default_factory=dict, description="A dictionary of the partial variables the prompt template carries.")

    @property
    def input_variables(self) -> List[str]:
        """Derive input variables from parameters."""
        return list(set(self.parameters.properties.keys()) - set(self.partial_variables.keys()))

    def format(self, **kwargs: Any) -> str:
        """Format the prompt with the inputs using Jinja2 templating."""
        all_variables = {**self.partial_variables, **kwargs}
        return super().format(**all_variables)

    def validate_input(self, **kwargs: Any) -> None:
        """Validate the input against the prompt's parameters."""
        all_variables = {**self.partial_variables, **kwargs}
        for required in self.parameters.required:
            if required not in all_variables:
                raise ValueError(f"Missing required parameter: {required}")
        
        for param_name, param_value in all_variables.items():
            if param_name not in self.parameters.properties:
                raise ValueError(f"Unexpected parameter: {param_name}")
            
            param_def = self.parameters.properties[param_name]
            if not isinstance(param_value, eval(param_def.type)):
                raise TypeError(f"Parameter {param_name} should be of type {param_def.type}")

    def format_prompt(self, **kwargs: Any) -> str:
        """Validate input and format the prompt."""
        self.validate_input(**kwargs)
        return self.format(**kwargs)

    def partial(self, **kwargs: Any) -> 'Prompt':
        """Return a partial of the prompt with some variables pre-filled."""
        new_content = self.content
        new_params = self.parameters.model_copy(deep=True)
        new_partial_variables = dict(self.partial_variables)
        
        for key, value in kwargs.items():
            if key in new_params.properties:
                # Replace the parameter in the content with its value
                pattern = r'\{{\s*' + re.escape(key) + r'\s*\}}|\{\s*' + re.escape(key) + r'\s*\}'
                new_content = re.sub(pattern, str(value), new_content)
                
                # Remove the parameter from the properties and required list
                del new_params.properties[key]
                if key in new_params.required:
                    new_params.required.remove(key)
                
                # Add the variable to partial_variables
                new_partial_variables[key] = value
        
        return TemplatedPrompt(
            id=self.id,
            name=f"{self.name} (Partial)",
            content=new_content,
            parameters=new_params,
            partial_variables=new_partial_variables
        )

    @field_validator('content')
    @classmethod
    def validate_content(cls, v: str, info: Any) -> str:
        """Validate that all parameters are used in the content"""
        if 'parameters' in info.data:
            template = Template(v)
            undefined = template.undefined_names
            for param in info.data['parameters'].properties:
                if param not in undefined:
                    raise ValueError(f"Parameter '{param}' is not used in the prompt content")
        return v