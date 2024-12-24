import os
from typing import List, Dict, Any
from pydantic import Field
from workflow.db_app.initialization.modules.init_module import InitializationModule
from workflow.util.const import LOCAL_LLM_API_URL

class BaseLocalModule(InitializationModule):
    """This module defines the base models and apis for the system, as well as the default parameter and prompt."""
    name: str = "base_local"
    dependencies: List[str] = ["base"]
    data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)

base_local_module = BaseLocalModule(
    data={
        "models": [
            {
                "key": "Yi_Coder_9B",
                "short_name": "Yi Coder 9B Chat",
                "model_name": "lmstudio-community/Yi-Coder-9B-Chat-GGUF/Yi-Coder-9B-Chat-Q6_K.gguf",
                "api_name": "lm_studio",
                "model_type": "chat",
                "config_obj": {
                    "ctx_size": 128000,
                },
            },
            {
                "key": "nomic-embed-text-v1",
                "short_name": "Nomic Embed Text",
                "model_name": "nomic-ai/nomic-embed-text-v1.5-GGUF/nomic-embed-text-v1.5.Q8_0.gguf",
                "api_name": "lm_studio",
                "model_type": "embeddings",
                "config_obj": {
                    "ctx_size": 2048,
                },
            },
            {
                "key": "llava_vision",
                "short_name": "Llava 1.5 7B Vision",
                "model_name": "second-state/Llava-v1.5-7B-GGUF/llava-v1.5-7b-mmproj-model-f16.gguf",
                "model_type": "vision",
                "api_name": "lm_studio",
                "config_obj": {
                    "ctx_size": 4096,
                    "prompt_config": {
                        "bos": "<s>",
                        "eos": "</s>",
                    },
                },
            },
            {
                "key": "bark_large",
                "short_name": "Bark Large",
                "model_name": "suno/bark",
                "config_obj": {
                    "ctx_size": 256,
                },
                "model_type": "tts",
                "api_name": "bark",
            },
            {
                "key": "pixart_sigma_model",
                "short_name": "Pixart Sigma",
                "model_name": "PixArt-alpha/PixArt-Sigma-XL-2-1024-MS",
                "config_obj": {
                    "ctx_size": 256,
                },
                "model_type": "img_gen",
                "api_name": "pixart",
            },
        ],
        "api_configs": [
            {
                "key": "local_lm_api_config",
                "name": "LM Studio API Config",
                "api_name": "lm_studio",
                "data": {"api_key": "dummy_key", "base_url": LOCAL_LLM_API_URL},
                "health_status": "healthy" if LOCAL_LLM_API_URL else "unhealthy",
            },
            {
                "key": "bark_api_config",
                "name": "Bark API Config",
                "api_name": "bark",
                "data": {"base_url": LOCAL_LLM_API_URL},
                "health_status": "healthy" if LOCAL_LLM_API_URL else "unhealthy",
            },
            {
                "key": "pixart_api_config",
                "name": "Pixart API Config",
                "api_name": "pixart",
                "data": {"base_url": LOCAL_LLM_API_URL},
                "health_status": "healthy" if LOCAL_LLM_API_URL else "unhealthy",
            },
        ],
        "apis": [
            {
                "key": "local_lm_studio",
                "api_type": "llm_api",
                "api_name": "lm_studio",
                "name": "LM Studio API",
                "api_config": "local_lm_api_config",
                "is_active": True,
                "default_model": "Yi_Coder_9B",
            },
            {
                "key": "local_lm_studio_embeddings",
                "api_type": "embeddings",
                "api_name": "lm_studio",
                "name": "LM Studio API",
                "api_config": "local_lm_api_config",
                "is_active": True,
                "default_model": "nomic-embed-text-v1",
            },
            {
                "key": "img_vision_lm_studio",
                "api_type": "img_vision",
                "api_name": "lm_studio",
                "name": "LM Studio Image Vision",
                "api_config": "local_lm_api_config",
                "is_active": True,
                "default_model": "llava_vision"
            },
            {
                "key": "bark_tts",
                "api_type": "text_to_speech",
                "api_name": "bark",
                "name": "Bark TTS",
                "api_config": "bark_api_config",
                "is_active": True,
                "default_model": "bark_large",
            },
            {
                "key": "pixart_img_gen",
                "api_type": "img_generation",
                "api_name": "pixart", # This should probably be called diffusers_img_gen
                "name": "Pixart Image Generation",
                "api_config": "pixart_api_config",
                "is_active": True,
                "default_model": "pixart_sigma_model",
            }
        ],
    },
)
