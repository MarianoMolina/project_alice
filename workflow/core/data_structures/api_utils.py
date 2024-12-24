from enum import Enum
from typing import List, TypedDict, Dict
    
class ApiType(str, Enum):
    """Enum for different types of API services"""
    LLM_MODEL = 'llm_api'
    IMG_VISION = 'img_vision'
    IMG_GENERATION = 'img_generation'
    SPEECH_TO_TEXT = 'speech_to_text'
    TEXT_TO_SPEECH = 'text_to_speech'
    EMBEDDINGS = 'embeddings'
    WOLFRAM_ALPHA = 'wolfram_alpha'
    GOOGLE_KNOWLEDGE_GRAPH = 'google_knowledge_graph'
    GOOGLE_SEARCH = 'google_search'
    REDDIT_SEARCH = 'reddit_search'
    WIKIPEDIA_SEARCH = 'wikipedia_search'
    EXA_SEARCH = 'exa_search'
    ARXIV_SEARCH = 'arxiv_search'
    REQUESTS = 'requests'

class ApiName(str, Enum):
    """Simplified enum for API providers"""
    OPENAI = 'openai'
    ANTHROPIC = 'anthropic'
    GEMINI = 'gemini'
    MISTRAL = 'mistral'
    COHERE = 'cohere'
    LLAMA = 'llama'
    AZURE = 'azure'
    GROQ = 'groq'
    GOOGLE_SEARCH = 'google_search'
    REDDIT = 'reddit'
    WIKIPEDIA = 'wikipedia'
    EXA = 'exa'
    ARXIV = 'arxiv'
    GOOGLE_KNOWLEDGE_GRAPH = 'google_knowledge_graph'
    WOLFRAM_ALPHA = 'wolfram_alpha'
    
    # LM_STUDIO = 'lm_studio'
    # BARK = 'bark'
    # PIXART = 'pixart'
    # CUSTOM = 'custom'

# Type definitions for different API configurations
class BaseApiConfig(TypedDict):
    """Base configuration that applies to most AI model APIs"""
    api_key: str
    base_url: str

class LocalApiConfig(TypedDict):
    """Configuration for local APIs"""
    base_url: str

class GoogleSearchConfig(TypedDict):
    api_key: str
    cse_id: str

class RedditConfig(TypedDict):
    client_id: str
    client_secret: str

class WolframConfig(TypedDict):
    app_id: str

class ExaConfig(TypedDict):
    api_key: str
class NoConfig(TypedDict):
    """Empty config type for APIs that don't require configuration"""
    pass
# Map of ApiName to their required configuration structure
API_CONFIG_TYPES: Dict[ApiName, Dict] = {
    ApiName.OPENAI: BaseApiConfig,
    ApiName.ANTHROPIC: BaseApiConfig,
    ApiName.GEMINI: BaseApiConfig,
    ApiName.MISTRAL: BaseApiConfig,
    ApiName.COHERE: BaseApiConfig,
    ApiName.LLAMA: BaseApiConfig,
    ApiName.AZURE: BaseApiConfig,
    ApiName.GROQ: BaseApiConfig,
    ApiName.GOOGLE_SEARCH: GoogleSearchConfig,
    ApiName.REDDIT: RedditConfig,
    ApiName.WIKIPEDIA: NoConfig,
    ApiName.EXA: ExaConfig,
    ApiName.ARXIV: NoConfig,
    ApiName.GOOGLE_KNOWLEDGE_GRAPH: ExaConfig,
    ApiName.WOLFRAM_ALPHA: WolframConfig,
    ApiName.LM_STUDIO: LocalApiConfig,
    ApiName.BARK: LocalApiConfig,
    ApiName.PIXART: LocalApiConfig,
}

# Map of ApiName to supported ApiTypes
API_CAPABILITIES = {
    ApiName.OPENAI: {
        ApiType.LLM_MODEL,
        ApiType.IMG_VISION,
        ApiType.IMG_GENERATION,
        ApiType.SPEECH_TO_TEXT,
        ApiType.TEXT_TO_SPEECH,
        ApiType.EMBEDDINGS
    },
    ApiName.ANTHROPIC: {
        ApiType.LLM_MODEL,
        ApiType.IMG_VISION
    },
    ApiName.GEMINI: {
        ApiType.LLM_MODEL,
        ApiType.IMG_VISION,
        ApiType.IMG_GENERATION,
        ApiType.SPEECH_TO_TEXT,
        ApiType.EMBEDDINGS
    },
    ApiName.MISTRAL: {
        ApiType.LLM_MODEL,
        ApiType.IMG_VISION,
        ApiType.EMBEDDINGS
    },
    ApiName.COHERE: {
        ApiType.LLM_MODEL
    },
    ApiName.LLAMA: {
        ApiType.LLM_MODEL,
        ApiType.IMG_VISION
    },
    ApiName.GROQ: {
        ApiType.LLM_MODEL,
        ApiType.IMG_VISION,
        ApiType.TEXT_TO_SPEECH
    },
    ApiName.AZURE: {
        ApiType.LLM_MODEL
    },
    ApiName.GOOGLE_SEARCH: {
        ApiType.GOOGLE_SEARCH
    },
    ApiName.REDDIT: {
        ApiType.REDDIT_SEARCH
    },
    ApiName.WIKIPEDIA: {
        ApiType.WIKIPEDIA_SEARCH
    },
    ApiName.EXA: {
        ApiType.EXA_SEARCH
    },
    ApiName.ARXIV: {
        ApiType.ARXIV_SEARCH
    },
    ApiName.GOOGLE_KNOWLEDGE_GRAPH: {
        ApiType.GOOGLE_KNOWLEDGE_GRAPH
    },
    ApiName.WOLFRAM_ALPHA: {
        ApiType.WOLFRAM_ALPHA
    },
    ApiName.LM_STUDIO: {
        ApiType.LLM_MODEL,
        ApiType.IMG_VISION,
        ApiType.EMBEDDINGS
    },
    ApiName.BARK: {
        ApiType.TEXT_TO_SPEECH
    },
    ApiName.PIXART: {
        ApiType.IMG_GENERATION
    },
    ApiName.CUSTOM: {
        ApiType.LLM_MODEL,
        ApiType.IMG_VISION,
        ApiType.IMG_GENERATION,
        ApiType.SPEECH_TO_TEXT,
        ApiType.TEXT_TO_SPEECH,
        ApiType.EMBEDDINGS
    }
}

ModelApis: List[ApiType] = [ApiType.LLM_MODEL, ApiType.IMG_VISION, ApiType.IMG_GENERATION, ApiType.SPEECH_TO_TEXT, ApiType.TEXT_TO_SPEECH, ApiType.EMBEDDINGS]
    
class ModelType(str, Enum):
    INSTRUCT = 'instruct'
    CHAT = 'chat'
    VISION = 'vision'
    STT = 'stt'
    TTS = 'tts'
    EMBEDDINGS = 'embeddings'
    IMG_GEN = 'img_gen'