from enum import Enum
from typing import List
    
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

class ApiName(str, Enum):
    OPENAI = 'openai_llm',
    OPENAI_VISION = 'openai_vision',
    OPENAI_IMG_GENERATION = 'openai_img_gen',
    OPENAI_EMBEDDINGS = 'openai_embeddings',
    OPENAI_TTS = 'openai_tts',
    OPENAI_STT = 'openai_stt',
    OPENAI_ASTT = 'openai_adv_stt',
    AZURE = 'azure',
    ANTHROPIC = 'anthropic_llm',
    ANTHROPIC_VISION = 'anthropic_vision',
    LM_STUDIO = 'lm-studio_llm',
    LM_STUDIO_VISION = 'lm-studio_vision',
    CUSTOM = 'Custom',
    GOOGLE_SEARCH = 'google_search',
    REDDIT_SEARCH = 'reddit_search',
    WIKIPEDIA_SEARCH = 'wikipedia_search',
    EXA_SEARCH = 'exa_search',
    ARXIV_SEARCH = 'arxiv_search',
    BEAUTIFULSOUP = 'beautiful_soup'

ModelApis: List[ApiType] = [ApiType.LLM_MODEL, ApiType.IMG_VISION, ApiType.IMG_GENERATION, ApiType.SPEECH_TO_TEXT, ApiType.TEXT_TO_SPEECH, ApiType.EMBEDDINGS]
    
class ModelType(str, Enum):
    INSTRUCT = 'instruct'
    CHAT = 'chat'
    VISION = 'vision'
    STT = 'stt'
    TTS = 'tts'
    EMBEDDINGS = 'embeddings'
    IMG_GEN = 'img_gen'