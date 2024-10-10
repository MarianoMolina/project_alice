import os
from typing import List, Dict, Any
from pydantic import Field
from workflow_logic.db_app.initialization.modules.init_module import InitializationModule

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
META_API_KEY = os.getenv("META_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
EXA_API_KEY = os.getenv("EXA_API_KEY")
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_CSE_ID = os.getenv("GOOGLE_CSE_ID")
BACKEND_HOST = os.getenv("BACKEND_HOST")
BACKEND_PORT = os.getenv("BACKEND_PORT")
LOCAL_LLM_API_URL = f"http://{BACKEND_HOST}:{BACKEND_PORT}/lm-studio"

class BaseModule(InitializationModule):
    """This module defines the base models and apis for the system, as well as the default parameter and prompt."""
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
                "api_name": "openai_llm",
            },
            {
                "key": "GPT4-turbo",
                "short_name": "GPT4-turbo",
                "model_format": "OpenChat",
                "model_name": "gpt-4-turbo",
                "ctx_size": 128000,
                "model_type": "chat",
                "temperature": 0.7,
                "api_name": "openai_llm",
            },
            {
                "key": "gpt-4o-mini",
                "short_name": "GPT4o-mini",
                "model_format": "OpenChat",
                "model_name": "gpt-4o-mini",
                "ctx_size": 128000,
                "model_type": "chat",
                "temperature": 0.7,
                "api_name": "openai_llm",
            },
            {
                "key": "Claude3.5",
                "short_name": "Claude3.5",
                "model_format": "OpenChat",
                "model_name": "claude-3-5-sonnet-20240620",
                "ctx_size": 200000,
                "model_type": "chat",
                "api_name": "anthropic_llm",
            },
            {
                "key": "Llama3_8B_Hermes",
                "short_name": "Llama3_8B_Hermes",
                "model_format": "Llama3",
                "model_name": "NousResearch/Hermes-2-Theta-Llama-3-8B-GGUF",
                "ctx_size": 32768,
                "model_type": "chat",
                "api_name": "lm-studio_llm",
                "lm_studio_preset": "Llama 3 V3"
            },
            {
                "key": "Llama3_1_8B",
                "short_name": "Llama3_1_8B",
                "model_format": "Llama3",
                "model_name": "lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF",
                "ctx_size": 131072,
                "model_type": "instruct",
                "api_name": "lm-studio_llm",
                "lm_studio_preset": "Llama 3 V3"
            },
            {
                "key": "Whisper_1",
                "short_name": "Whisper",
                "model_name": "whisper-1", # need model name here
                "model_format": "Base", # random value
                "ctx_size": 2048, # random value
                "model_type": "stt",
                "api_name": "openai_stt",
            },
            {
                "key": "Dall-E-3",
                "short_name": "dall-e-3",
                "model_name": "dall-e-3",
                "model_format": "Base", # random value
                "ctx_size": 2048, # random value
                "model_type": "img_gen",
                "api_name": "openai_img_gen",
            },
            {
                "key": "tts-1",
                "short_name": "tts-1",
                "model_name": "tts-1",
                "model_format": "Base", # random value
                "ctx_size": 2048, # random value
                "model_type": "tts",
                "api_name": "openai_tts",
            },
            {
                "key": "oai_embedding_large",
                "short_name": "text-embedding-3-large",
                "model_name": "text-embedding-3-large",
                "model_format": "Base", # random value
                "ctx_size": 2048, # random value
                "model_type": "embeddings",
                "api_name": "openai_embeddings",
            },
            {
                "key": "hermes_llava_vision", 
                "short_name": "Hermes-2-vision",
                "model_name": "billborkowski/llava-NousResearch_Nous-Hermes-2-Vision-GGUF",
                "model_format": "Obsidian_Vision",
                "ctx_size": 4096,
                "model_type": "vision",
                "api_name": "lm-studio_vision"
            },
            {
                "key": "o1_openai",
                "short_name": "O1",
                "model_name": "o1-preview", 
                "model_format": "OpenChat", 
                "ctx_size": 128000,
                "model_type": "chat",
                "api_name": "openai_llm"
            },
            {
                "key": "mistral_small",
                "short_name": "Mistral Small",
                "model_name": "mistral-small-latest",
                "model_format": "OpenChat",
                "ctx_size": 32000,
                "model_type": "chat",
                "api_name": "mistral_llm",
            },
            {
                "key": "gemini_1.5_flash",
                "short_name": "Gemini 1.5 Flash",
                "model_name": "gemini-1.5-flash",
                "model_format": "OpenChat",
                "ctx_size": 1048576,
                "model_type": "chat",
                "api_name": "gemini_llm",
            },
            {
                "key": "gemini_1.5_flash_v",
                "short_name": "Gemini 1.5 Flash Vision",
                "model_name": "gemini-1.5-flash",
                "model_format": "OpenChat",
                "ctx_size": 1048576,
                "model_type": "vision",
                "api_name": "gemini_vision",
            },
            {
                "key": "gemini_1.5_flash_stt",
                "short_name": "Gemini 1.5 Flash STT",
                "model_name": "gemini-1.5-flash",
                "model_format": "OpenChat",
                "ctx_size": 1048576,
                "model_type": "stt",
                "api_name": "gemini_stt",
            },
            {
                "key": "gemini_text_embedding",
                "short_name": "Gemini Text Embedding",
                "model_name": "text-embedding-004",
                "model_format": "OpenChat",
                "ctx_size": 2048,
                "model_type": "embeddings",
                "api_name": "gemini_embeddings",
            },
            {
                "key": "gemini_img_gen_imagen_3",
                "short_name": "Gemini Imagen 3",
                "model_name": "imagen-3.0-generate-001",
                "model_format": "OpenChat",
                "ctx_size": 2048,
                "model_type": "img_gen",
                "api_name": "gemini_img_gen",
            },
            {
                "key": "llama3.2_90b",
                "short_name": "Llama3.2 90B",
                "model_name": "llama3.2-90b-vision",
                "model_format": "Llama3",
                "ctx_size": 128000,
                "model_type": "chat",
                "api_name": "meta_llm",
            },
            {
                "key": "pixtral12b",
                "short_name": "Pixtral 12B",
                "model_name": "pixtral-12b",
                "model_format": "OpenChat",
                "ctx_size": 128000,
                "model_type": "vision",
                "api_name": "mistral_vision",
            },
            {
                "key": "mistral-embed",
                "short_name": "Mistral Embed",
                "model_name": "mistral-embed",
                "model_format": "OpenChat",
                "ctx_size": 8000,
                "model_type": "embeddings",
                "api_name": "mistral_embeddings",
            },
            {
                "key": "command-r-plus",
                "short_name": "Command R Plus",
                "model_name": "command-r-plus-08-2024",
                "model_format": "OpenChat",
                "ctx_size": 128000,
                "model_type": "chat",
                "api_name": "cohere_llm",
            },
            {
                "key": "llama-3.1-70b-versatile",
                "short_name": "Llama 3.1 70b",
                "model_name": "llama-3.1-70b-versatile",
                "model_format": "Llama3",
                "ctx_size": 128000,
                "model_type": "chat",
                "api_name": "groq_llm",
            },
            {
                "key": "groq_tts_whisper",
                "short_name": "Groq Whisper",
                "model_name": "whisper-large-v3",
                "model_format": "Base",
                "ctx_size": 2048,
                "model_type": "tts",
                "api_name": "groq_tts",
            },
            {
                "key": "groq_llama_3.2_11b_vision",
                "short_name": "Llama 3.2 11b Vision",
                "model_name": "llama-3.2-11b-vision-preview",
                "model_format": "Llama3",
                "ctx_size": 8000,
                "model_type": "vision",
                "api_name": "groq_vision",
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
                "key": "openai_llm",
                "api_type": "llm_api",
                "api_name": "openai_llm",
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
                "key": "mistral_llm_api",
                "api_type": "llm_api",
                "api_name": "mistral_llm",
                "name": "Mistral API",
                "api_config": {
                    "api_key": MISTRAL_API_KEY,
                    "base_url": "https://api.mistral.ai/v1"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "mistral_small",
            },
            {
                "key": "mistral_vision",
                "api_type": "img_vision",
                "api_name": "mistral_vision",
                "name": "Mistral Vision API",
                "api_config": {
                    "api_key": MISTRAL_API_KEY,
                    "base_url": "https://api.mistral.ai/v1"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "pixtral12b",
            },
            {
                "key": "mistral_embeddings",
                "api_type": "embeddings",
                "api_name": "mistral_embeddings",
                "name": "Mistral Embeddings API",
                "api_config": {
                    "api_key": MISTRAL_API_KEY,
                    "base_url": "https://api.mistral.ai/v1"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "mistral-embed",
            },
            {
                "key": "anthropic",
                "api_type": "llm_api",
                "api_name": "anthropic_llm",
                "name": "Anthropic API",
                "api_config": {
                    "api_key": ANTHROPIC_API_KEY,
                    "base_url": "https://api.anthropic.com"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "Claude3.5",
            },
            {
                "key": "gemini_llm",
                "api_type": "llm_api",
                "api_name": "gemini_llm",
                "name": "Gemini API",
                "api_config": {
                    "api_key": GEMINI_API_KEY,
                    "base_url": "https://api.gemini.ai"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "gemini_1.5_flash",
            },
            {
                "key": "gemini_vision",
                "api_type": "img_vision",
                "api_name": "gemini_vision",
                "name": "Gemini Vision API",
                "api_config": {
                    "api_key": GEMINI_API_KEY,
                    "base_url": "https://api.gemini.ai"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "gemini_1.5_flash_v",
            },
            {
                "key": "gemini_stt",
                "api_type": "speech_to_text",
                "api_name": "gemini_stt",
                "name": "Gemini Speech to Text API",
                "api_config": {
                    "api_key": GEMINI_API_KEY,
                    "base_url": "https://api.gemini.ai"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "gemini_1.5_flash_stt",
            },
            {
                "key": "gemini_embeddings",
                "api_type": "embeddings",
                "api_name": "gemini_embeddings",
                "name": "Gemini Embeddings API",
                "api_config": {
                    "api_key": GEMINI_API_KEY,
                    "base_url": "https://api.gemini.ai"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "gemini_text_embedding",
            },
            {
                "key": "gemini_img_gen",
                "api_type": "img_generation",
                "api_name": "gemini_img_gen",
                "name": "Gemini Image Generation API",
                "api_config": {
                    "api_key": GEMINI_API_KEY,
                    "base_url": "https://api.gemini.ai"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "gemini_img_gen_imagen_3",
            },
            {
                "key": "cohere_llm",
                "api_type": "llm_api",
                "api_name": "cohere_llm",
                "name": "Cohere API",
                "api_config": {
                    "api_key": COHERE_API_KEY,
                    "base_url": "https://api.cohere.ai"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "command-r-plus",
            },
            {
                "key": "meta_llm",
                "api_type": "llm_api",
                "api_name": "meta_llm",
                "name": "Meta API",
                "api_config": {
                    "api_key": META_API_KEY,
                    "base_url": "https://api.llama-api.com"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "llama3.2_90b",
            },
            {
                "key": "local_lm_studio",
                "api_type": "llm_api",
                "api_name": "lm-studio_llm",
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
                "api_name": "openai_vision",
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
                "api_name": "lm-studio_vision",
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
                "api_name": "anthropic_vision",
                "name": "Anthropic Image Vision",
                "api_config": {
                    "api_key": ANTHROPIC_API_KEY,
                    "base_url": "https://api.anthropic.com"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "Claude3.5"
            },
            {
                "key": "img_generation",
                "api_type": "img_generation",
                "api_name": "openai_img_gen",
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
                "key": "speech_to_text",
                "api_type": "speech_to_text",
                "api_name": "openai_stt",
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
                "api_name": "openai_adv_stt",
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
                "api_name": "openai_tts",
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
                "api_name": "openai_embeddings",
                "name": "OpenAI Embeddings", 
                "api_config": {
                    "api_key": OPENAI_API_KEY,
                    "base_url": "https://api.openai.com/v1"                    
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "oai_embedding_large"            
            },
            {
                "key": "groq_llm",
                "api_type": "llm_api",
                "api_name": "groq_llm",
                "name": "Groq API",
                "api_config": {
                    "api_key": GROQ_API_KEY,
                    "base_url": "https://api.groq.com/openai/v1"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "llama-3.1-70b-versatile",
            },
            {
                "key": "groq_vision",
                "api_type": "img_vision",
                "api_name": "groq_vision",
                "name": "Groq Vision API",
                "api_config": {
                    "api_key": GROQ_API_KEY,
                    "base_url": "https://api.groq.com/openai/v1"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "groq_llama_3.2_11b_vision",
            },
            {
                "key": "groq_tts",
                "api_type": "speech_to_text",
                "api_name": "groq_tts",
                "name": "Groq Text to Speech API",
                "api_config": {
                    "api_key": GROQ_API_KEY,
                    "base_url": "https://api.groq.com/openai/v1"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "groq_tts_whisper",
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