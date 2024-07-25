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
LOCAL_LLM_API_URL = os.getenv("LOCAL_LLM_API_URL")

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
                "model_name": "gpt-4o-2024-05-13",
                "ctx_size": 128000,
                "model_type": "chat",
                "deployment": "remote",
                "temperature": 0.7,
                "api_name": "openai",
            },
            {
                "key": "Llama3_8B_Instruct",
                "short_name": "Llama3_8B_Instruct",
                "model_name": "nisten/llama3-8b-instruct-32k-gguf",
                "model_format": "Llama3",
                "ctx_size": 32768,
                "model_type": "instruct",
                "deployment": "local",
                "api_name": "custom",
            },
            {
                "key": "Claude3.5",
                "short_name": "Claude3.5",
                "model_format": "OpenChat",
                "model_name": "claude-3-5-sonnet-20240620",
                "ctx_size": 200000,
                "model_type": "chat",
                "deployment": "remote",
                "temperature": 0.7,
                "api_name": "anthropic",
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
                "model_client_cls": "AnthropicClient"
            },
            {
                "key": "local_lm_studio",
                "api_type": "llm_api",
                "api_name": "custom",
                "name": "LM Studio API",
                "api_config": {
                    "api_key": "local_lm_studio",
                    "base_url": "LOCAL_LLM_API_URL"
                },
                "is_active": True,
                "health_status": "healthy",
                "default_model": "Llama3_8B_Instruct",
            }
        ]
    }
)