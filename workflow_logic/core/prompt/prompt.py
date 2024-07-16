import re
from bson import ObjectId
from jinja2 import Template
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from workflow_logic.core.parameters import FunctionParameters

class Prompt(BaseModel):
    id: Optional[str] = Field(default="", description="The unique ID of the prompt, must match the ID in the database", alias="_id")
    name: str = Field(..., description="The name of the prompt.")
    content: str = Field(..., description="The content of the prompt.")
    is_templated: bool = Field(default=False, description="Whether the prompt is templated or not.")
    parameters: Optional[FunctionParameters] = Field(None, description="The parameters that the prompt expects if it's templated.")
    partial_variables: Dict[str, Any] = Field(default_factory=dict, description="A dictionary of the partial variables the prompt template carries.")
    model_config = ConfigDict(protected_namespaces=(), json_encoders = {ObjectId: str})

    @model_validator(mode='after')
    def validate_templated_prompt(self):
        if self.is_templated and not self.parameters:
            raise ValueError("Templated prompts must have parameters defined.")
        if not self.is_templated and self.parameters:
            raise ValueError("Non-templated prompts should not have parameters defined.")
        return self

    @property
    def input_variables(self) -> List[str]:
        """Derive input variables from parameters."""
        if not self.is_templated:
            return []
        return list(set(self.parameters.properties.keys()) - set(self.partial_variables.keys()))

    def format(self, **kwargs: Any) -> str:
        """Format the prompt with the inputs using Jinja2 templating."""
        all_variables = {**self.partial_variables, **kwargs}
        template = Template(self.content)
        return template.render(**all_variables)

    def format_prompt(self, **kwargs: Any) -> str:
        """Validate input (if templated) and format the prompt."""
        if self.is_templated:
            self.validate_input(**kwargs)
        return self.format(**kwargs)

    def validate_input(self, **kwargs: Any) -> None:
        """Validate the input against the prompt's parameters."""
        if not self.is_templated or not self.parameters:
            return
        
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

    def get_template(self) -> Template:
        return Template(self.content)

    def partial(self, **kwargs: Any) -> 'Prompt':
        """Return a partial of the prompt with some variables pre-filled."""
        if not self.is_templated:
            raise ValueError("Cannot create a partial from a non-templated prompt.")

        new_content = self.content
        new_params = self.parameters.model_copy(deep=True) if self.parameters else None
        new_partial_variables = dict(self.partial_variables)
        
        for key, value in kwargs.items():
            if new_params and key in new_params.properties:
                # Replace the parameter in the content with its value
                pattern = r'\{{\s*' + re.escape(key) + r'\s*\}}|\{\s*' + re.escape(key) + r'\s*\}'
                new_content = re.sub(pattern, str(value), new_content)
                
                # Remove the parameter from the properties and required list
                del new_params.properties[key]
                if key in new_params.required:
                    new_params.required.remove(key)
                
                # Add the variable to partial_variables
                new_partial_variables[key] = value
        
        return Prompt(
            id=self.id,
            name=f"{self.name} (Partial)",
            content=new_content,
            is_templated=self.is_templated,
            parameters=new_params,
            partial_variables=new_partial_variables
        )

    @field_validator('content')
    @classmethod
    def validate_content(cls, v: str, info: Any) -> str:
        """Validate that all parameters are used in the content for templated prompts"""
        if info.data.get('is_templated') and 'parameters' in info.data:
            template = Template(v)
            undefined = template.undefined_names
            for param in info.data['parameters'].properties:
                if param not in undefined:
                    raise ValueError(f"Parameter '{param}' is not used in the prompt content")
        return v