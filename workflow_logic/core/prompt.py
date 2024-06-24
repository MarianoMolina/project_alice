import re
from jinja2 import Template
from typing import Optional, List, Any, Mapping, Dict, Union
from pydantic import BaseModel, Field, field_validator, model_validator
from workflow_logic.util.task_utils import FunctionParameters

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

class PromptLibrary(BaseModel):
    template_map: Dict[str, Union[Prompt, TemplatedPrompt]] = Field(..., description="A dictionary mapping template names to prompts.")
    template_names: List[str] = Field(default_factory=list, description="The names of the valid template files. Its value is set by validate_inputs.")

    def render_template_by_name(self, template_name: str, **kwargs) -> str:
        prompt = self.get_prompt_by_name(template_name)
        return prompt.format_prompt(**kwargs)

    def get_prompt_by_name(self, template_name: str) -> Union[Prompt, TemplatedPrompt]:
        if template_name not in self.template_names:
            raise ValueError(f"Template {template_name} not available in library.")
        return self.template_map[template_name]

    def get_template_by_name(self, template_name: str) -> Template:
        prompt = self.get_prompt_by_name(template_name)
        return prompt.get_template()

    def add_prompt(self, name: str, prompt: Union[Prompt, TemplatedPrompt]) -> None:
        if name in self.template_names:
            raise ValueError(f"A prompt with the name '{name}' already exists.")
        self.template_map[name] = prompt
        self.template_names.append(name)

    def remove_prompt(self, name: str) -> None:
        if name not in self.template_names:
            raise ValueError(f"No prompt found with the name '{name}'.")
        del self.template_map[name]
        self.template_names.remove(name)

    def update_prompt(self, name: str, prompt: Union[Prompt, TemplatedPrompt]) -> None:
        if name not in self.template_names:
            raise ValueError(f"No prompt found with the name '{name}'.")
        self.template_map[name] = prompt

    def list_prompts(self) -> List[str]:
        return self.template_names

    def get_prompt_details(self, name: str) -> Dict:
        prompt = self.get_prompt_by_name(name)
        details = {
            "name": prompt.name,
            "type": "Prompt" if isinstance(prompt, Prompt) else "TemplatedPrompt",
            "content": prompt.content,
        }
        if isinstance(prompt, TemplatedPrompt):
            details["parameters"] = prompt.parameters.dict()
            details["partial_variables"] = dict(prompt.partial_variables)
        return details

    @model_validator(mode='after')
    def validate_inputs(self):
        if not self.template_map:
            raise ValueError("template_map must be provided.")
        self.template_names = list(self.template_map.keys())
        return self