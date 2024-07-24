import re
from bson import ObjectId
from jinja2 import Template
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from workflow_logic.core.parameters import FunctionParameters

TYPE_MAPPING = {
    "string": str,
    "integer": int,
    "float": float,
    "boolean": bool,
    "list": list,
    "dict": dict
}

class Prompt(BaseModel):
    """
    Represents a prompt for language models, with support for templating and parameter validation.

    This class encapsulates the properties and methods needed to create, validate, and format
    prompts, including support for templated prompts with defined parameters.

    Attributes:
        id (Optional[str]): The unique identifier for the prompt.
        name (str): The name of the prompt.
        content (str): The content of the prompt, which may include template variables.
        is_templated (bool): Indicates whether the prompt is a template (default: False).
        parameters (Optional[FunctionParameters]): The parameters expected by the prompt if it's templated.
        partial_variables (Dict[str, Any]): Pre-filled variables for partial templates.

    Methods:
        input_variables() -> List[str]:
            Returns a list of input variables required by the prompt template.
        format(**kwargs: Any) -> str:
            Formats the prompt using the provided variables.
        format_prompt(**kwargs: Any) -> str:
            Validates inputs (if templated) and formats the prompt.
        validate_input(**kwargs: Any) -> None:
            Validates the input against the prompt's parameters.
        get_template() -> Template:
            Returns a Jinja2 Template object for the prompt content.
        partial(**kwargs: Any) -> 'Prompt':
            Creates a new Prompt instance with some variables pre-filled.

    Validators:
        validate_templated_prompt():
            Ensures consistency between is_templated flag and parameters.
        validate_content(v: str, info: Any) -> str:
            Validates that all parameters are used in templated prompts.

    Example:
        >>> prompt = Prompt(name="Greeting", content="Hello, {{name}}!", is_templated=True,
        ...                 parameters=FunctionParameters(properties={"name": {"type": "string"}}, required=["name"]))
        >>> prompt.format_prompt(name="Alice")
        'Hello, Alice!'
    """
    id: Optional[str] = Field(default=None, description="The unique ID of the prompt, must match the ID in the database", alias="_id")
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
                print(f'kwargs in failed validation: {kwargs}')
                raise ValueError(f"Missing required parameter: {required}")
        
        for param_name, param_value in all_variables.items():
            if param_name not in self.parameters.properties:
                print(f'param_name not needed: {param_name} in Prompt: {self.name}')
                continue
                # raise ValueError(f"Unexpected parameter: {param_name}")
            
            param_def = self.parameters.properties[param_name]           
            expected_type = TYPE_MAPPING.get(param_def.type)
            if expected_type is None:
                raise ValueError(f"Unknown type: {param_def.type}")
            
            # Check if the parameter is required
            is_required = param_name in self.parameters.required

            # If the value is None and the parameter is not required, skip the type check
            if param_value is None:
                if is_required:
                    raise ValueError(f"Required parameter {param_name} cannot be None")
                continue

            if not isinstance(param_value, expected_type):
                raise TypeError(f"Parameter {param_name} should be of type {param_def.type}: value is {param_value} ({type(param_value)})")
    
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