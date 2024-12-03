from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator
from workflow.db_app.initialization.modules import InitializationModule, module_list

modules: Dict[str, InitializationModule] = {module.name: module for module in module_list}
all_modules = [module.name for module in module_list]

class ModularDBStructure(BaseModel):
    modules: Dict[str, InitializationModule] = Field(default=modules)

    @field_validator('modules')
    @classmethod
    def validate_module_dependencies(cls, v: Dict[str, InitializationModule]) -> Dict[str, InitializationModule]:
        modular_db = cls(modules=v)
        error = modular_db.validate_dependencies()
        if error:
            raise ValueError(error)
        return v
    
    def add_module(self, module: InitializationModule):
        self.modules[module.name] = module

    def get_initialization_order(self, selected_modules: List[str]) -> List[str]:
        def dfs(module: str, visited: set, stack: List[str]):
            visited.add(module)
            for dep in self.modules[module].dependencies:
                if dep not in visited:
                    dfs(dep, visited, stack)
            stack.append(module)

        visited = set()
        stack = []
        for module in selected_modules:
            if module not in visited:
                dfs(module, visited, stack)
        return stack

    def get_combined_data(self, selected_modules: List[str]) -> Dict[str, List[Dict[str, Any]]]:
        combined_data: Dict[str, List[Dict[str, Any]]] = {}
        initialization_order = self.get_initialization_order(selected_modules)
       
        for module_name in initialization_order:
            module = self.modules[module_name]
            for entity_type, entities in module.data.items():
                if entity_type not in combined_data:
                    combined_data[entity_type] = []
                combined_data[entity_type].extend(entities)
       
        return combined_data

    def validate_dependencies(self) -> Optional[str]:
        for module_name, module in self.modules.items():
            for dep in module.dependencies:
                if dep not in self.modules:
                    return f"Module '{module_name}' has an undefined dependency: '{dep}'"
        return None

class DBStructure(BaseModel):
    users: List[Dict[str, Any]] = Field(default_factory=list, description="List of users to create")
    models: List[Dict[str, Any]] = Field(default_factory=list, description="List of models to create")
    api_configs: List[Dict[str, Any]] = Field(default_factory=list, description="List of api configs to create")
    apis: List[Dict[str, Any]] = Field(default_factory=list, description="List of apis to create")
    parameters: List[Dict[str, Any]] = Field(default_factory=list, description="List of parameters to create")
    prompts: List[Dict[str, Any]] = Field(default_factory=list, description="List of prompts to create")
    user_checkpoints: List[Dict[str, Any]] = Field(default_factory=list, description="List of user checkpoints to create")
    agents: List[Dict[str, Any]] = Field(default_factory=list, description="List of agents to create")
    tasks: List[Dict[str, Any]] = Field(default_factory=list, description="List of tasks to create")
    chats: List[Dict[str, Any]] = Field(default_factory=list, description="List of chats to create")

def get_combined_data() -> Dict[str, List[Dict[str, Any]]]:
    modular_db = ModularDBStructure()
    return modular_db.get_combined_data(all_modules)
    
# Create DB_STRUCTURE
DB_STRUCTURE = DBStructure(**get_combined_data())