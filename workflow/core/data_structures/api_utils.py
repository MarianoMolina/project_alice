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
    SPEECH_TO_TEXT = 'speech_to_text'
    TEXT_TO_SPEECH = 'text_to_speech'
    EMBEDDINGS = 'embeddings'
    GOOGLE_KNOWLEDGE_GRAPH = 'google_knowledge_graph'

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
    GEMINI = 'gemini_llm',
    GEMINI_VISION = 'gemini_vision',
    GEMINI_STT = 'gemini_stt',
    GEMINI_EMBEDDINGS = 'gemini_embeddings',
    GEMINI_IMG_GEN = 'gemini_img_gen',
    MISTRAL = 'mistral_llm',
    MISTRAL_VISION = 'mistral_vision',
    MISTRAL_EMBEDDINGS = 'mistral_embeddings',
    COHERE = 'cohere_llm',
    META = 'meta_llm',
    META_VISION = 'meta_vision',
    LM_STUDIO = 'lm-studio_llm',
    LM_STUDIO_VISION = 'lm-studio_vision',
    GROQ = 'groq_llm',
    GROQ_VISION = 'groq_vision',
    GROQ_TTS = 'groq_tts',
    CUSTOM = 'Custom',
    BARK_TTS = 'bark_tts',
    PIXART_IMG_GEN = 'pixart_img_gen',
    GOOGLE_SEARCH = 'google_search',
    REDDIT_SEARCH = 'reddit_search',
    WIKIPEDIA_SEARCH = 'wikipedia_search',
    EXA_SEARCH = 'exa_search',
    ARXIV_SEARCH = 'arxiv_search'
    GOOGLE_KNOWLEDGE_GRAPH = 'google_knowledge_graph'

ModelApis: List[ApiType] = [ApiType.LLM_MODEL, ApiType.IMG_VISION, ApiType.IMG_GENERATION, ApiType.SPEECH_TO_TEXT, ApiType.TEXT_TO_SPEECH, ApiType.EMBEDDINGS]
    
class ModelType(str, Enum):
    INSTRUCT = 'instruct'
    CHAT = 'chat'
    VISION = 'vision'
    STT = 'stt'
    TTS = 'tts'
    EMBEDDINGS = 'embeddings'
    IMG_GEN = 'img_gen'