from pathlib import Path
from typing import List, Dict
from jinja2 import Environment, FileSystemLoader, Template, meta
from pydantic import BaseModel, Field, field_validator, model_validator
from workflow_logic.util.const import PROMPT_PATH
from abc import abstractmethod, ABC

class TemplateLibrary(BaseModel, ABC):
    template_names: List[str] = Field(default_factory=list, description="The names of the valid template files.")

    @abstractmethod
    def get_template_by_name(self, template_name: str) -> Template:
        """
        Returns a Jinja2 template object by its name.
        """
        ...

    def render_template_by_name(self, template_name: str, **kwargs) -> str:
        template = self.get_template_by_name(template_name)
        return template.render(**kwargs)
    
class StoredTemplateLibrary(TemplateLibrary):
    template_map: Dict[str, str] = Field(..., description="A dictionary mapping template names to template str.")
    template_names: List[str] = Field(default_factory=list, description="The names of the valid template files. Its value is set by load_template_names.")

    @model_validator(mode='after')
    def validate_inputs(self):
        if not self.template_map:
            raise ValueError("template_map must be provided.")
        self.template_names = list(self.template_map.keys())
        return self

    def get_template_by_name(self, template_name: str) -> Template:
        if template_name not in self.template_names:
            raise ValueError(f"Template {template_name} not available in library.")
        return Template(self.template_map[template_name])

class LocalTemplateLibrary(TemplateLibrary):
    folder_path: Path = Field(Path(PROMPT_PATH), description="The folder path where the templates are stored.")
    template_names: List[str] = Field(default_factory=list, description="The names of the valid template files. Its value is set by load_template_names.")

    def __init__(self, **data):
        super().__init__(**data)
        self.load_template_names()

    @field_validator("folder_path")
    def validate_folder_path(cls, v: Path) -> Path:
        if not v.is_dir():
            raise ValueError(f"The provided folder path '{v}' is not a valid directory.")
        return v

    def load_template_names(self) -> None:
        self.template_names = [file_path.stem for file_path in self.folder_path.glob("*.prompt")]

    def get_template_by_name(self, template_name: str) -> Template:
        if not template_name:
            raise ValueError("template_name must be provided.")
        if template_name not in self.template_names:
            raise ValueError(f"Template '{template_name}' not found.")

        file_loader = FileSystemLoader(self.folder_path)
        file_loader_env = Environment(loader=file_loader)
        return file_loader_env.get_template(f"{template_name}.prompt")
    
    def get_template_variables(self, template_name: str) -> List[str]:
        """
        Extracts the variables used in a Jinja2 template.
        :param template_name: Name of the template file.
        :return: List of variable names used in the template.
        """
        if template_name is None:
            raise ValueError("template_name must be provided.")
        env = Environment(loader=FileSystemLoader(self.folder_path))
        template_source = env.loader.get_source(env, f"{template_name}.prompt")
        parsed_content = env.parse(template_source)
        
        # Use meta.find_undeclared_variables to find all undeclared variables in the template
        variables = meta.find_undeclared_variables(parsed_content)
        
        # Return the variables as a sorted list
        return sorted(variables)