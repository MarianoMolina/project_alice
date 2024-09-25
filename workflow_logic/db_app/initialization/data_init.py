from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from workflow_logic.db_app.initialization.modules import InitializationModule, base, base_chat, base_tasks, coding_workflow, advanced_chat, adv_tasks

class ModularDBStructure(BaseModel):
    modules: Dict[str, InitializationModule] = Field(default_factory=dict)

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
    apis: List[Dict[str, Any]] = Field(default_factory=list, description="List of apis to create")
    parameters: List[Dict[str, Any]] = Field(default_factory=list, description="List of parameters to create")
    prompts: List[Dict[str, Any]] = Field(default_factory=list, description="List of prompts to create")
    agents: List[Dict[str, Any]] = Field(default_factory=list, description="List of agents to create")
    tasks: List[Dict[str, Any]] = Field(default_factory=list, description="List of tasks to create")
    chats: List[Dict[str, Any]] = Field(default_factory=list, description="List of chats to create")

# Create ModularDBStructure and add all modules
modular_db = ModularDBStructure()
modular_db.add_module(base.base_module)
modular_db.add_module(base_tasks.base_tasks_module)
modular_db.add_module(base_chat.base_chat_module)
modular_db.add_module(coding_workflow.coding_workflow_module)
modular_db.add_module(advanced_chat.advanced_chat_module)
modular_db.add_module(adv_tasks.adv_tasks_module)

# Validate dependencies
validation_result = modular_db.validate_dependencies()
if validation_result:
    raise ValueError(f"Dependency validation failed: {validation_result}")

# Get combined data for all modules
all_modules = ["base", "base_tasks", "base_chat", "coding_workflow", "advanced_chat"]
combined_data = modular_db.get_combined_data(all_modules)

# Create DB_STRUCTURE
DB_STRUCTURE = DBStructure(**combined_data)