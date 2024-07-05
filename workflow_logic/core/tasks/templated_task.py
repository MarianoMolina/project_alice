from typing import Dict, Any
from pydantic import BaseModel, Field
from workflow_logic.core.prompt import Prompt

class TemplatedTask(BaseModel):
    templates: Dict[str, Prompt] = Field({}, description="A dictionary of template names and their file names")

    def add_template(self, template_name: str, prompt: Prompt):
        self.templates[template_name] = prompt

    def get_prompt_template(self, template_name: str) -> Prompt:
        if template_name not in self.templates or not self.templates[template_name]:
            raise ValueError(f"Template {template_name} not found in the task templates dictionary.")
        return self.templates[template_name]
        
    def render_template(self, template_name: str, inputs: Dict[str, Any]) -> str:
        template = self.get_prompt_template(template_name)
        if not template:
            raise ValueError(f"Template {template_name} not retrieved correctly.")
        return template.format_prompt(inputs)
