import os
from typing import List, Dict, Any
from pydantic import Field
from workflow_logic.db_app.initialization.modules.init_module import InitializationModule

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API = os.getenv("ANTHROPIC_API")
EXA_API_KEY = os.getenv("EXA_API_KEY")
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_CSE_ID = os.getenv("GOOGLE_CSE_ID")
BACKEND_HOST = os.getenv("BACKEND_HOST")
BACKEND_PORT = os.getenv("BACKEND_PORT")
LOCAL_LLM_API_URL = f"http://{BACKEND_HOST}:{BACKEND_PORT}/lm-studio"

class BaseModule(InitializationModule):
    name: str = "base"
    dependencies: List[str] = []
    data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)

base_module = BaseModule(
    data = {
        "models": [
            {
                "key": "GPT4o",
                "short_name": "GPT4o",
                "model_format": "OpenChat",
                "model_name": "chatgpt-4o-latest",
                "ctx_size": 128000,
                "model_type": "chat",
                "temperature": 0.7,
                "api_name": "openai",
            },
            {
                "key": "Claude3.5",
                "short_name": "Claude3.5",
                "model_format": "OpenChat",
                "model_name": "claude-3-5-sonnet-20240620",
                "ctx_size": 200000,
                "model_type": "chat",
                "api_name": "anthropic",
            },
            {
                "key": "Llama3_8B_Hermes",
                "short_name": "Llama3_8B_Hermes",
                "model_format": "Llama3",
                "model_name": "NousResearch/Hermes-2-Theta-Llama-3-8B-GGUF",
                "ctx_size": 32768,
                "model_type": "chat",
                "api_name": "lm-studio",
                "lm_studio_preset": "Llama 3 V3"
            },
            {
                "key": "Llama3_1_8B",
                "short_name": "Llama3_1_8B",
                "model_format": "Llama3",
                "model_name": "lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF",
                "ctx_size": 131072,
                "model_type": "instruct",
                "api_name": "lm-studio",
                "lm_studio_preset": "Llama 3 V3"
            },
            {
                "key": "Whisper_1",
                "short_name": "Whisper",
                "model_name": "whisper-1", # need model name here
                "model_format": "Base", # random value
                "ctx_size": 2048, # random value
                "model_type": "stt",
                "api_name": "speech_to_text",
            },
            {
                "key": "Dall-E-3",
                "short_name": "dall-e-3",
                "model_name": "dall-e-3",
                "model_format": "Base", # random value
                "ctx_size": 2048, # random value
                "model_type": "img_gen",
                "api_name": "img_generation",
            },
            {
                "key": "tts-1",
                "short_name": "tts-1",
                "model_name": "tts-1",
                "model_format": "Base", # random value
                "ctx_size": 2048, # random value
                "model_type": "tts",
                "api_name": "text_to_speech",
            },
            {
                "key": "oai_embedding_large",
                "short_name": "text-embedding-large",
                "model_name": "text-embedding-large",
                "model_format": "Base", # random value
                "ctx_size": 2048, # random value
                "model_type": "embeddings",
                "api_name": "embeddings",
            },
            {
                "key": "hermes_llava_vision", 
                "short_name": "Hermes-2-vision",
                "model_name": "billborkowski/llava-NousResearch_Nous-Hermes-2-Vision-GGUF",
                "model_format": "Obsidian_Vision",
                "ctx_size": 4096,
                "model_type": "vision",
                "api_name": "img_vision"
            }
        ],
        "apis": [
            {
                "key": "reddit_search",
                "api_type": "reddit_search",
                "api_name": "reddit_search",
                "name": "Reddit Search",
                "api_config": {
                    "client_id": REDDIT_CLIENT_ID,
                    "client_secret": REDDIT_CLIENT_SECRET,
                },
                "is_active": True,
                "health_status": "healthy",
            },
            {
                "key": "exa_search",
                "api_type": "exa_search",
                "api_name": "exa_search",
                "name": "Exa Search",
                "api_config": {
                    "api_key": EXA_API_KEY,
                },
                "is_active": True,
                "health_status": "healthy",
            },
            {
                "key": "google_search",
                "api_type": "google_search",
                "api_name": "google_search",
                "name": "Google Search",
                "api_config": {
                    "api_key": GOOGLE_API_KEY,
                    "cse_id": GOOGLE_CSE_ID,
                },
                "is_active": True,
                "health_status": "healthy",
            },
            {
                "key": "wikipedia_search",
                "api_type": "wikipedia_search",
                "api_name": "wikipedia_search",
                "name": "Wikipedia Search",
                "api_config": {},
                "is_active": True,
                "health_status": "healthy",
            },
            {
                "key": "arxiv_search",
                "api_type": "arxiv_search",
                "api_name": "arxiv_search",
                "name": "Arxiv Search",
                "api_config": {},
                "is_active": True,
                "health_status": "healthy",
            },
            {
                "key": "openai",
                "api_type": "llm_api",
                "api_name": "openai",
                "name": "OpenAI API",
                "api_config": {
                    "api_key": OPENAI_API_KEY,
                    "base_url": "https://api.openai.com/v1"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "GPT4o",
            },
            {
                "key": "anthropic",
                "api_type": "llm_api",
                "api_name": "anthropic",
                "name": "Anthropic API",
                "api_config": {
                    "api_key": ANTHROPIC_API,
                    "base_url": "https://api.anthropic.com"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "Claude3.5",
            },
            {
                "key": "local_lm_studio",
                "api_type": "llm_api",
                "api_name": "lm-studio",
                "name": "LM Studio API",
                "api_config": {
                    "api_key": "lm-studio",
                    "base_url": LOCAL_LLM_API_URL
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "Llama3_8B_Hermes",
            },
            {
                "key": "img_vision",
                "api_type": "img_vision",
                "api_name": "openai",
                "name": "OpenAI Image Vision",
                "api_config": {
                    "api_key": OPENAI_API_KEY,
                    "base_url": "https://api.openai.com/v1"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "GPT4o",
            },
            {
                "key": "img_vision_lm_studio",
                "api_type": "img_vision",
                "api_name": "lm-studio",
                "name": "LM Studio Image Vision",
                "api_config": {
                    "api_key": "lm-studio",
                    "base_url": LOCAL_LLM_API_URL
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "hermes_llava_vision"
            },
            {
                "key": "img_vision_anthropic",
                "api_type": "img_vision",
                "api_name": "anthropic",
                "name": "Anthropic Image Vision",
                "api_config": {
                    "api_key": ANTHROPIC_API,
                    "base_url": "https://api.anthropic.com"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "Claude3.5"
            },
            {
                "key": "img_generation",
                "api_type": "img_generation",
                "api_name": "openai",
                "name": "Image Generation",
                "api_config": {
                    "api_key": OPENAI_API_KEY,
                    "base_url": "https://api.openai.com/v1"    
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "Dall-E-3"
            },
            {
                "key": "web_scrape",
                "api_type": "web_scrape",
                "api_name": "beautiful-soup",
                "name": "Web Scrape w/ BeautifulSoup",
                "api_config": {},
                "is_active": True,
                "health_status": "healthy",
            },
            {
                "key": "speech_to_text",
                "api_type": "speech_to_text",
                "api_name": "openai",
                "name": "OpenAI Speech to Text",
                "api_config": {
                    "api_key": OPENAI_API_KEY, # Since whisper is open source, it should probably be a local deployment
                    "base_url": "https://api.openai.com/v1"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "Whisper_1"
            },
            {
                "key": "speech_to_text_openai_advanced",
                "api_type": "speech_to_text",
                "api_name": "openai-timestamps",
                "name": "OpenAI Advanced Speech to Text",
                "api_config": {
                    "api_key": OPENAI_API_KEY,
                    "base_url": "https://api.openai.com/v1"
                },
                "is_active": True,
                "health_status": "healthy",      
                "default_model": "Whisper_1"          
            },
            {
                "key": "text_to_speech",
                "api_type": "text_to_speech",
                "api_name": "openai",
                "name": "Text to Speech",
                "api_config": {
                    "api_key": OPENAI_API_KEY,
                    "base_url": "https://api.openai.com/v1"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "tts-1"
           },
            {
                "key": "embedding_api",
                "api_type": "embeddings", 
                "api_name": "openai",
                "name": "OpenAI Embeddings", 
                "api_config": {
                    "api_key": OPENAI_API_KEY,
                    "base_url": "https://api.openai.com/v1"                    
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "oai_embedding_large"            
            }
        ],
        "parameters": [
            {
                "key": "prompt_parameter",
                "type": "string",
                "description": "The input prompt for the task",
                "default": None
            },
        ],
        "prompts": [
            {
                "key": "basic_prompt",
                "name": "Basic Prompt",
                "content": "{{ prompt }}",
                "is_templated": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter"
                    },
                    "required": ["prompt"]
                }
            },
        ]
    }
)