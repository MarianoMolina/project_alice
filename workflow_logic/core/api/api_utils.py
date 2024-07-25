from enum import Enum, EnumMeta
from typing import Literal, List, Tuple

# The order of this list is used to determine which entities are created first
EntityType = Literal["users", "models", "parameters", "prompts", "agents", "tasks", "chats", "task_responses", "apis"]
    
class ApiType(str, Enum):
    LLM_MODEL = 'llm_api'
    GOOGLE_SEARCH = 'google_search'
    REDDIT_SEARCH = 'reddit_search'
    WIKIPEDIA_SEARCH = 'wikipedia_search'
    EXA_SEARCH = 'exa_search'
    ARXIV_SEARCH = 'arxiv_search'

class ApiNameMeta(EnumMeta):
    def __new__(metacls, cls, bases, classdict):
        # Extend with all ApiType values except LLM_MODEL
        for name, value in ApiType.__members__.items():
            if name != 'LLM_MODEL':
                classdict[name] = value.value
        
        # Add LLM-specific API names
        classdict['OPENAI'] = 'openai'
        classdict['AZURE'] = 'azure'
        classdict['ANTHROPIC'] = 'anthropic'
        classdict['CUSTOM'] = 'custom'
        
        return super().__new__(metacls, cls, bases, classdict)

    @classmethod
    def _missing_(cls, value):
        # This allows using ApiName with new ApiType values
        if value in ApiType.__members__:
            return cls(ApiType[value].value)
        return super()._missing_(value)

class ApiName(str, Enum, metaclass=ApiNameMeta):
    pass

# Helper function to get all ApiName values
def get_all_api_names() -> List[Tuple[str, str]]:
    return [(name, value) for name, value in ApiName.__members__.items()]