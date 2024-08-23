from enum import Enum, EnumMeta
from typing import List, Tuple
    
class ApiType(str, Enum):
    LLM_MODEL = 'llm_api'
    GOOGLE_SEARCH = 'google_search'
    REDDIT_SEARCH = 'reddit_search'
    WIKIPEDIA_SEARCH = 'wikipedia_search'
    EXA_SEARCH = 'exa_search'
    ARXIV_SEARCH = 'arxiv_search'
    IMG_VISION = 'img_vision'
    IMG_GENERATION = 'img_generation'
    WEB_SCRAPE = 'web_scrape'
    SPEECH_TO_TEXT = 'speech_to_text'
    TEXT_TO_SPEECH = 'text_to_speech'
    EMBEDDINGS = 'embeddings'
    
class ModelType(str, Enum):
    INSTRUCT = 'instruct'
    CHAT = 'chat'
    VISION = 'vision'
    STT = 'stt'
    TTS = 'tts'
    EMBEDDINGS = 'embeddings'
    IMG_GEN = 'img_gen'

class ApiNameMeta(EnumMeta):
    def __new__(metacls, cls, bases, classdict):
        # Extend with all ApiType values except LLM_MODEL
        for name, value in ApiType.__members__.items():
            if name != 'LLM_MODEL':
                classdict[name] = value.value
        
        # Add LLM-specific API names
        classdict['OPENAI'] = 'openai'
        classdict['OPENAI_TIMESTAMPS'] = 'openai-timestamps'
        classdict['AZURE'] = 'azure'
        classdict['ANTHROPIC'] = 'anthropic'
        classdict['LM_STUDIO'] = 'lm-studio'
        classdict['BEAUTIFULSOUP'] = 'beautiful-soup'
        
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