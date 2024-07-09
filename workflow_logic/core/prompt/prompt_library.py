from jinja2 import Template
from typing import List, Dict, Union
from pydantic import BaseModel, Field, model_validator
from workflow_logic.core.prompt.prompt import Prompt, TemplatedPrompt

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