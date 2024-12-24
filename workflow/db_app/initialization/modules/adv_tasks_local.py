from typing import List, Dict, Any
from pydantic import Field
from workflow.db_app.initialization.modules.init_module import InitializationModule, get_prompt_file

class AdvTasksModule(InitializationModule):
    """This module defines the advanced tasks (img gen, tts, embeddings), their agents, parameters and prompts."""
    name: str = "adv_tasks_local"
    dependencies: List[str] = ["base", "base_chat", "base_local", "adv_tasks"]
    data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)

adv_tasks_local_module = AdvTasksModule(
    data = {
        "parameters": [
            {
                "key": "voice_bark_parameter",
                "type": "string",
                "description": "The voice to use for the speech.", # TODO: Add Bark TTS voices to description
                "default": "v2/en_speaker_6"
            },
        ],
        "agents": [
            {
                "key": "pixart_gen_agent",
                "name": "Pixart Agent",
                "system_message": "default_system_message",
                "models": {
                    "img_gen": "pixart_sigma_model",
                },
                "has_code_exec": 0,
                "has_tools": 0,
                "max_consecutive_auto_reply": 1,
            },
            {
                "key": "bark_tts_agent",
                "name": "Bark TTS Agent",
                "system_message": "default_system_message",
                "models": {
                    "tts": "bark_large",
                },
                "has_code_exec": 0,
                "has_tools": 0,
                "max_consecutive_auto_reply": 1,
            },
        ],
        "tasks": [
            {
                "key": "image_gen_task_pixart",
                "task_type": "GenerateImageTask",
                "task_name": "Pixart_Image_Generation",
                "agent": "pixart_gen_agent",
                "task_description": "Generates an image from the input text",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_img_gen",
                        "n": "n_parameter",
                        "size": "size_parameter",
                        "quality": "quality_parameter"
                    },
                    "required": ["prompt"]
                },
                "required_apis": ["img_generation"],
            },
            {
                "key": "bark_tts_task",
                "task_type": "TextToSpeechTask",
                "task_name": "Bark_TTS_Task",
                "agent": "bark_tts_agent",
                "task_description": "Converts text to speech using the Bark TTS API",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "text": "text_parameter",
                        "voice": "voice_bark_parameter",
                        "speed": "speed_parameter"
                    },
                    "required": ["text"]
                },
                "required_apis": ["text_to_speech"]
            },
        ],
    }
)
