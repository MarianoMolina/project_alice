from .base import base_module
from .base_chat import base_chat_module
from .base_local_chat import base_local_chat_module
from .base_tasks import base_tasks_module
from .coding_workflow import coding_workflow_module
from .advanced_chat import advanced_chat_module
from .init_module import InitializationModule
from .adv_tasks import adv_tasks_module
from .adv_tasks_local import adv_tasks_local_module
from .research_workflow import research_workflow_module
from .web_scrape_workflow import web_scrape_workflow_module
from .base_local import base_local_module
from typing import List
module_list: List[InitializationModule] = [
    base_module, 
    base_tasks_module, 
    base_chat_module, 
    coding_workflow_module, 
    advanced_chat_module, 
    adv_tasks_module, 
    research_workflow_module,
    base_local_module,
    base_local_chat_module,
    adv_tasks_local_module,
    # web_scrape_workflow_module # Not used anymore
]

__all__ = ['InitializationModule']