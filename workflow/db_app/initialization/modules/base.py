from typing import List, Dict, Any
from pydantic import Field
from workflow.db_app.initialization.modules.init_module import InitializationModule
from workflow.util.const import (
    OPENAI_API_KEY,
    ANTHROPIC_API_KEY,
    MISTRAL_API_KEY,
    GEMINI_API_KEY,
    COHERE_API_KEY,
    LLAMA_API_KEY,
    GROQ_API_KEY,
    EXA_API_KEY,
    REDDIT_CLIENT_ID,
    REDDIT_CLIENT_SECRET,
    GOOGLE_API_KEY,
    GOOGLE_CSE_ID,
    GOOGLE_KNOWLEDGE_GRAPH_API_KEY,
    WOLFRAM_ALPHA_APP_ID,
    DEEPSEEK_API_KEY,
)


class BaseModule(InitializationModule):
    """This module defines the base models and apis for the system, as well as the default parameter and prompt."""

    name: str = "base"
    dependencies: List[str] = []
    data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)


base_module = BaseModule(
    data={
        "models": [
            {
                "key": "GPT4o",
                "short_name": "GPT4o",
                "model_name": "gpt-4o",
                "model_type": "chat",
                "api_name": "openai",
                "config_obj": {
                    "ctx_size": 128000,
                },
                "model_costs": {
                    "input_token_cost_per_million": 2.5,
                    "cached_input_token_cost_per_million": 1.5,
                    "output_token_cost_per_million": 10,
                },
            },
            {
                "key": "gpt-4o-mini",
                "short_name": "GPT4o-mini",
                "model_name": "gpt-4o-mini",
                "model_type": "chat",
                "api_name": "openai",
                "config_obj": {
                    "ctx_size": 128000,
                },
                "model_costs": {
                    "input_token_cost_per_million": 0.15,
                    "cached_input_token_cost_per_million": 0.075,
                    "output_token_cost_per_million": 0.6,
                },
            },
            {
                "key": "Claude3.5",
                "short_name": "Claude3.5",
                "model_name": "claude-3-5-sonnet-20240620",
                "api_name": "anthropic",
                "model_type": "chat",
                "config_obj": {
                    "ctx_size": 200000,
                },
                "model_costs": {
                    "input_token_cost_per_million": 3,
                    "cached_input_token_cost_per_million": 3,
                    "output_token_cost_per_million": 15,
                },
            },
            {
                "key": "Claude3.5_v",
                "short_name": "Claude3.5",
                "model_name": "claude-3-5-sonnet-20240620",
                "model_type": "vision",
                "api_name": "anthropic",
                "config_obj": {
                    "ctx_size": 200000,
                },
                "model_costs": {
                    "input_token_cost_per_million": 3,
                    "cached_input_token_cost_per_million": 3,
                    "output_token_cost_per_million": 15,
                },
            },
            {
                "key": "Whisper_1",
                "short_name": "Whisper",
                "model_name": "whisper-1",
                "model_type": "stt",
                "api_name": "openai",
                "config_obj": {
                    "ctx_size": 2048,
                },
                "model_costs": {
                    "cost_per_unit": 0.0006,  # Cost per minute
                },
            },
            {
                "key": "Dall-E-3",
                "short_name": "DALL-E 3",
                "model_name": "dall-e-3",
                "model_type": "img_gen",
                "api_name": "openai",
                "config_obj": {
                    "ctx_size": 4096,
                },
                "model_costs": {
                    "cost_per_unit": 0.80,
                },
            },
            {
                "key": "tts-1",
                "short_name": "tts-1",
                "model_name": "tts-1",
                "config_obj": {
                    "ctx_size": 4096,
                },
                "model_type": "tts",
                "api_name": "openai",
                "model_costs": {
                    "cost_per_unit": 0.000015,
                },
            },
            {
                "key": "tts-1-hd",
                "short_name": "tts-1-hd",
                "model_name": "tts-1-hd",
                "config_obj": {
                    "ctx_size": 4096,
                },
                "model_type": "tts",
                "api_name": "openai",
                "model_costs": {
                    "cost_per_unit": 0.00003,
                },
            },
            {
                "key": "oai_embedding_large",
                "short_name": "text-embedding-3-large",
                "model_name": "text-embedding-3-large",
                "model_type": "embeddings",
                "api_name": "openai",
                "config_obj": {
                    "ctx_size": 8191,
                },
                "model_costs": {
                    "input_token_cost_per_million": 0.13,
                },
            },
            {
                "key": "o1_openai",
                "short_name": "O1",
                "model_name": "o1-preview",
                "config_obj": {
                    "ctx_size": 128000,
                },
                "model_type": "chat",
                "api_name": "openai",
                "model_costs": {
                    "input_token_cost_per_million": 15,
                    "cached_input_token_cost_per_million": 7.5,
                    "output_token_cost_per_million": 60,
                },
            },
            {
                "key": "mistral_small",
                "short_name": "Mistral Small",
                "model_name": "mistral-small-latest",
                "config_obj": {
                    "ctx_size": 32000,
                },
                "model_type": "chat",
                "api_name": "mistral",
                "model_costs": {
                    "input_token_cost_per_million": 0.2,
                    "cached_input_token_cost_per_million": 0.2,
                    "output_token_cost_per_million": 0.6,
                },
            },
            {
                "key": "gemini_1.5_flash",
                "short_name": "Gemini 1.5 Flash",
                "model_name": "gemini-1.5-flash",
                "config_obj": {
                    "ctx_size": 1048576,
                },
                "model_type": "chat",
                "api_name": "gemini",
                "model_costs": {
                    "input_token_cost_per_million": 0.075,
                    "cached_input_token_cost_per_million": 0.01875,
                    "output_token_cost_per_million": 0.3,
                },
            },
            {
                "key": "gemini_1.5_flash_v",
                "short_name": "Gemini 1.5 Flash Vision",
                "model_name": "gemini-1.5-flash",
                "config_obj": {
                    "ctx_size": 1048576,
                },
                "model_type": "vision",
                "api_name": "gemini",
                "model_costs": {
                    "input_token_cost_per_million": 0.075,
                    "cached_input_token_cost_per_million": 0.01875,
                    "output_token_cost_per_million": 0.3,
                },
            },
            {
                "key": "gemini_1.5_flash_stt",
                "short_name": "Gemini 1.5 Flash STT",
                "model_name": "gemini-1.5-flash",
                "config_obj": {
                    "ctx_size": 1048576,
                },
                "model_type": "stt",
                "api_name": "gemini",
                "model_costs": {
                    "cost_per_unit": 0,  # ?
                },
            },
            {
                "key": "gemini_text_embedding",
                "short_name": "Gemini Text Embedding",
                "model_name": "text-embedding-004",
                "config_obj": {
                    "ctx_size": 2048,
                },
                "model_type": "embeddings",
                "api_name": "gemini",
                "model_costs": {
                    "input_token_cost_per_million": 0.000000025,
                    "cached_input_token_cost_per_million": 0.00000002,
                },
            },
            {
                "key": "gemini_img_gen_imagen_3",
                "short_name": "Gemini Imagen 3",
                "model_name": "imagen-3.0-generate-001",
                "config_obj": {
                    "ctx_size": 2048,
                },
                "model_type": "img_gen",
                "api_name": "gemini",
                "model_costs": {
                    "cost_per_unit": 0.04,
                },
            },
            {
                "key": "llama3.2_90b",
                "short_name": "Llama3.2 90B",
                "model_name": "llama3.2-90b-vision",
                "config_obj": {
                    "ctx_size": 128000,
                },
                "model_type": "chat",
                "api_name": "llama",
                "model_costs": {
                    "input_token_cost_per_million": 2.8,
                    "cached_input_token_cost_per_million": 2.8,
                    "output_token_cost_per_million": 2.8,
                },
            },
            {
                "key": "pixtral12b",
                "short_name": "Pixtral 12B",
                "model_name": "pixtral-12b",
                "config_obj": {
                    "ctx_size": 128000,
                },
                "model_type": "vision",
                "api_name": "mistral",
                "model_costs": {
                    "input_token_cost_per_million": 2,
                    "cached_input_token_cost_per_million": 2,
                    "output_token_cost_per_million": 6,
                },
            },
            {
                "key": "mistral-embed",
                "short_name": "Mistral Embed",
                "model_name": "mistral-embed",
                "config_obj": {
                    "ctx_size": 8000,
                },
                "model_type": "embeddings",
                "api_name": "mistral",
                "model_costs": {
                    "input_token_cost_per_million": 0.1,
                    "cached_input_token_cost_per_million": 0.1,
                    "output_token_cost_per_million": 0.0,
                },
            },
            {
                "key": "command-r-plus",
                "short_name": "Command R Plus",
                "model_name": "command-r-plus-08-2024",
                "config_obj": {
                    "ctx_size": 128000,
                },
                "model_type": "chat",
                "api_name": "cohere",
                "model_costs": {
                    "input_token_cost_per_million": 2.5,
                    "cached_input_token_cost_per_million": 2.5,
                    "output_token_cost_per_million": 10,
                },
            },
            {
                "key": "deepseek-chat",
                "short_name": "Deepseek Chat",
                "model_name": "deepseek-chat",
                "config_obj": {
                    "ctx_size": 64000,
                },
                "model_type": "chat",
                "api_name": "deepseek",
                "model_costs": {
                    "input_token_cost_per_million": 0.14,
                    "cached_input_token_cost_per_million": 0.07,
                    "output_token_cost_per_million": 0.28,
                }
            },
            {
                "key": "llama-3.3-70b-versatile",
                "short_name": "Llama 3.3 70b",
                "model_name": "llama-3.3-70b-versatile",
                "config_obj": {
                    "ctx_size": 128000,
                },
                "model_type": "chat",
                "api_name": "groq",
                "model_costs": {
                    "input_token_cost_per_million": 0.59,
                    "cached_input_token_cost_per_million": 0.59,
                    "output_token_cost_per_million": 0.79,
                },
            },
            {
                "key": "groq_stt_whisper",
                "short_name": "Groq Whisper",
                "model_name": "whisper-large-v3",
                "config_obj": {
                    "ctx_size": 2048,
                },
                "model_type": "stt",
                "api_name": "groq",
                "model_costs": {
                    "cost_per_unit": 0.000185,  # Cost per minute
                },
            },
            {
                "key": "groq_llama_3_2_11b_vision",
                "short_name": "Llama 3.2 11b Vision",
                "model_name": "llama-3.2-11b-vision-preview",
                "config_obj": {
                    "ctx_size": 8000,
                },
                "model_type": "vision",
                "api_name": "groq",
                "model_costs": {
                    "input_token_cost_per_million": 0.18,
                    "cached_input_token_cost_per_million": 0.18,
                    "output_token_cost_per_million": 0.18,
                },
            },
        ],
        "api_configs": [
            {
                "key": "openai_api_config",
                "name": "OpenAI API Config",
                "api_name": "openai",
                "data": {
                    "api_key": OPENAI_API_KEY,
                    "base_url": "https://api.openai.com/v1",
                },
                "health_status": "healthy" if OPENAI_API_KEY else "unhealthy",
            },
            {
                "key": "anthropic_api_config",
                "name": "Anthropic API Config",
                "api_name": "anthropic",
                "data": {
                    "api_key": ANTHROPIC_API_KEY,
                    "base_url": "https://api.anthropic.com",
                },
                "health_status": "healthy" if ANTHROPIC_API_KEY else "unhealthy",
            },
            {
                "key": "mistral_api_config",
                "name": "Mistral API Config",
                "api_name": "mistral",
                "data": {
                    "api_key": MISTRAL_API_KEY,
                    "base_url": "https://api.mistral.ai/v1",
                },
                "health_status": "healthy" if MISTRAL_API_KEY else "unhealthy",
            },
            {
                "key": "gemini_api_config",
                "name": "Gemini API Config",
                "api_name": "gemini",
                "data": {
                    "api_key": GEMINI_API_KEY,
                    "base_url": "https://api.gemini.ai",
                },
                "health_status": "healthy" if GEMINI_API_KEY else "unhealthy",
            },
            {
                "key": "cohere_api_config",
                "name": "Cohere API Config",
                "api_name": "cohere",
                "data": {
                    "api_key": COHERE_API_KEY,
                    "base_url": "https://api.cohere.ai",
                },
                "health_status": "healthy" if COHERE_API_KEY else "unhealthy",
            },
            {
                "key": "llama_api_config",
                "name": "LLAMA API Config",
                "api_name": "llama",
                "data": {
                    "api_key": LLAMA_API_KEY,
                    "base_url": "https://api.llama-api.com",
                },
                "health_status": "healthy" if LLAMA_API_KEY else "unhealthy",
            },
            {
                "key": "groq_api_config",
                "name": "Groq API Config",
                "api_name": "groq",
                "data": {
                    "api_key": GROQ_API_KEY,
                    "base_url": "https://api.groq.com/openai/v1",
                },
                "health_status": "healthy" if GROQ_API_KEY else "unhealthy",
            },
            {
              "key": "deepseek_api_config",
                "name": "Deepseek API Config",
                "api_name": "deepseek",
                "data": {
                    "api_key": DEEPSEEK_API_KEY,
                    "base_url": "https://api.deepseek.com/v1",
                },
                "health_status": "healthy" if DEEPSEEK_API_KEY else "unhealthy", 
            },
            {
                "key": "exa_api_config",
                "name": "Exa API Config",
                "api_name": "exa",
                "data": {"api_key": EXA_API_KEY, "base_url": "https://api.exa.ai/v1"},
                "health_status": "healthy" if EXA_API_KEY else "unhealthy",
            },
            {
                "key": "reddit_api_config",
                "name": "Reddit API Config",
                "api_name": "reddit",
                "data": {
                    "client_id": REDDIT_CLIENT_ID,
                    "client_secret": REDDIT_CLIENT_SECRET,
                },
                "health_status": (
                    "healthy"
                    if REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET
                    else "unhealthy"
                ),
            },
            {
                "key": "google_knowledge_graph_api_config",
                "name": "Google Knowledge Graph API Config",
                "api_name": "google_knowledge_graph",
                "data": {"api_key": GOOGLE_KNOWLEDGE_GRAPH_API_KEY},
                "health_status": (
                    "healthy" if GOOGLE_KNOWLEDGE_GRAPH_API_KEY else "unhealthy"
                ),
            },
            {
                "key": "wolfram_alpha_api_config",
                "name": "Wolfram Alpha API Config",
                "api_name": "wolfram_alpha",
                "data": {"app_id": WOLFRAM_ALPHA_APP_ID},
                "health_status": "healthy" if WOLFRAM_ALPHA_APP_ID else "unhealthy",
            },
            {
                "key": "google_search_api_config",
                "name": "Google Search API Config",
                "api_name": "google_search",
                "data": {"api_key": GOOGLE_API_KEY, "cse_id": GOOGLE_CSE_ID},
                "health_status": (
                    "healthy" if GOOGLE_API_KEY and GOOGLE_CSE_ID else "unhealthy"
                ),
            },
            {
                "key": "wikipedia_api_config",
                "name": "Wikipedia API Config",
                "api_name": "wikipedia",
                "data": {},
                "health_status": "healthy",
            },
            {
                "key": "arxiv_api_config",
                "name": "Arxiv API Config",
                "api_name": "arxiv",
                "data": {},
                "health_status": "healthy",
            },
        ],
        "apis": [
            {
                "key": "google_knowledge_graph_api",
                "api_type": "google_knowledge_graph",
                "api_name": "google_knowledge_graph",
                "name": "Google Knowledge Graph",
                "api_config": "google_knowledge_graph_api_config",
                "is_active": True,
            },
            {
                "key": "wolfram_alpha_api",
                "api_type": "wolfram_alpha",
                "api_name": "wolfram_alpha",
                "name": "Wolfram Alpha",
                "api_config": "wolfram_alpha_api_config",
                "is_active": True,
            },
            {
                "key": "reddit_search",
                "api_type": "reddit_search",
                "api_name": "reddit",
                "name": "Reddit Search",
                "api_config": "reddit_api_config",
                "is_active": True,
            },
            {
                "key": "exa_search",
                "api_type": "exa_search",
                "api_name": "exa",
                "name": "Exa Search",
                "api_config": "exa_api_config",
                "is_active": True,
            },
            {
                "key": "google_search",
                "api_type": "google_search",
                "api_name": "google_search",
                "name": "Google Search",
                "api_config": "google_search_api_config",
                "is_active": True,
            },
            {
                "key": "wikipedia_search",
                "api_type": "wikipedia_search",
                "api_name": "wikipedia",
                "name": "Wikipedia Search",
                "api_config": "wikipedia_api_config",
                "is_active": True,
            },
            {
                "key": "arxiv_search",
                "api_type": "arxiv_search",
                "api_name": "arxiv",
                "name": "Arxiv Search",
                "api_config": "arxiv_api_config",
                "is_active": True,
            },
            {
                "key": "openai_api",
                "api_type": "llm_api",
                "api_name": "openai",
                "name": "OpenAI API",
                "api_config": "openai_api_config",
                "is_active": True,
                "default_model": "GPT4o",
            },
            {
                "key": "mistral_llm_api",
                "api_type": "llm_api",
                "api_name": "mistral",
                "name": "Mistral API",
                "api_config": "mistral_api_config",
                "is_active": True,
                "default_model": "mistral_small",
            },
            {
                "key": "mistral_vision",
                "api_type": "img_vision",
                "api_name": "mistral",
                "name": "Mistral Vision API",
                "api_config": "mistral_api_config",
                "is_active": True,
                "default_model": "pixtral12b",
            },
            {
                "key": "mistral_embeddings",
                "api_type": "embeddings",
                "api_name": "mistral",
                "name": "Mistral Embeddings API",
                "api_config": "mistral_api_config",
                "is_active": True,
                "default_model": "mistral-embed",
            },
            {
                "key": "anthropic",
                "api_type": "llm_api",
                "api_name": "anthropic",
                "name": "Anthropic API",
                "api_config": "anthropic_api_config",
                "is_active": True,
                "default_model": "Claude3.5",
            },
            {
                "key": "gemini_llm",
                "api_type": "llm_api",
                "api_name": "gemini",
                "name": "Gemini API",
                "api_config": "gemini_api_config",
                "is_active": True,
                "default_model": "gemini_1.5_flash",
            },
            {
                "key": "gemini_vision",
                "api_type": "img_vision",
                "api_name": "gemini",
                "name": "Gemini Vision API",
                "api_config": "gemini_api_config",
                "is_active": True,
                "default_model": "gemini_1.5_flash_v",
            },
            {
                "key": "gemini_stt",
                "api_type": "speech_to_text",
                "api_name": "gemini",
                "name": "Gemini Speech to Text API",
                "api_config": "gemini_api_config",
                "is_active": True,
                "default_model": "gemini_1.5_flash_stt",
            },
            {
                "key": "gemini_embeddings",
                "api_type": "embeddings",
                "api_name": "gemini",
                "name": "Gemini Embeddings API",
                "api_config": "gemini_api_config",
                "is_active": True,
                "default_model": "gemini_text_embedding",
            },
            {
                "key": "gemini_img_gen",
                "api_type": "img_generation",
                "api_name": "gemini",
                "name": "Gemini Image Generation API",
                "api_config": "gemini_api_config",
                "is_active": True,
                "default_model": "gemini_img_gen_imagen_3",
            },
            {
                "key": "cohere_llm",
                "api_type": "llm_api",
                "api_name": "cohere",
                "name": "Cohere API",
                "api_config": "cohere_api_config",
                "is_active": True,
                "default_model": "command-r-plus",
            },
            {
                "key": "llama_llm_api",
                "api_type": "llm_api",
                "api_name": "llama",
                "name": "LLAMA API",
                "api_config": "llama_api_config",
                "is_active": True,
                "default_model": "llama3.2_90b",
            },
            {
                "key": "img_vision",
                "api_type": "img_vision",
                "api_name": "openai",
                "name": "OpenAI Image Vision",
                "api_config": "openai_api_config",
                "is_active": True,
                "default_model": "GPT4o",
            },
            {
                "key": "img_vision_anthropic",
                "api_type": "img_vision",
                "api_name": "anthropic",
                "name": "Anthropic Image Vision",
                "api_config": "anthropic_api_config",
                "is_active": True,
                "default_model": "Claude3.5",
            },
            {
                "key": "img_generation",
                "api_type": "img_generation",
                "api_name": "openai",
                "name": "Image Generation",
                "api_config": "openai_api_config",
                "is_active": True,
                "default_model": "Dall-E-3",
            },
            {
                "key": "speech_to_text",
                "api_type": "speech_to_text",
                "api_name": "openai",
                "name": "OpenAI Speech to Text",
                "api_config": "openai_api_config",  # Since whisper is open source, do we need a key?
                "is_active": True,
                "default_model": "Whisper_1",
            },
            {
                "key": "text_to_speech",
                "api_type": "text_to_speech",
                "api_name": "openai",
                "name": "Text to Speech",
                "api_config": "openai_api_config",
                "is_active": True,
                "default_model": "tts-1",
            },
            {
                "key": "embedding_api",
                "api_type": "embeddings",
                "api_name": "openai",
                "name": "OpenAI Embeddings",
                "api_config": "openai_api_config",
                "is_active": True,
                "default_model": "oai_embedding_large",
            },
            {
                "key": "groq_llm",
                "api_type": "llm_api",
                "api_name": "groq",
                "name": "Groq API",
                "api_config": "groq_api_config",
                "is_active": True,
                "default_model": "llama-3.3-70b-versatile",
            },
            {
                "key": "deepseek_llm", 
                "api_type": "llm_api",
                "api_name": "deepseek",
                "name": "Deepseek API",
                "api_config": "deepseek_api_config",
                "is_active": True,
                "default_model": "deepseek-chat",
            },
            {
                "key": "groq_vision",
                "api_type": "img_vision",
                "api_name": "groq",
                "name": "Groq Vision API",
                "api_config": "groq_api_config",
                "is_active": True,
                "default_model": "groq_llama_3_2_11b_vision",
            },
            {
                "key": "groq_stt",
                "api_type": "text_to_speech",
                "api_name": "groq",
                "name": "Groq Text to Speech API",
                "api_config": "groq_api_config",
                "is_active": True,
                "default_model": "groq_stt_whisper",
            },
        ],
        "parameters": [
            {
                "key": "prompt_parameter",
                "type": "string",
                "description": "The input prompt for the task",
                "default": None,
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
                    "properties": {"prompt": "prompt_parameter"},
                    "required": ["prompt"],
                },
            },
        ],
    }
)
