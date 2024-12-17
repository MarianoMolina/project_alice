from typing import List, Dict, Any
from pydantic import Field
from workflow.db_app.initialization.modules.init_module import InitializationModule, get_prompt_file

class AdvTasksModule(InitializationModule):
    """This module defines the advanced tasks (img gen, tts, embeddings), their agents, parameters and prompts."""
    name: str = "adv_tasks"
    dependencies: List[str] = ["base", "base_chat"]
    data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)

adv_tasks_module = AdvTasksModule(
    data = {
        "parameters": [
            {
                "key": "input_parameter",
                "type": "string",
                "description": "The input text to get embeddings for. Can be a string or an array of strings."
            },
            {
                "key": "prompt_retrieval_parameter",
                "type": "string",
                "description": "The prompt to retrieve similar embeddings for."
            },
            {
                "key": "sumilarity_threshold_parameter",
                "type": "number",
                "description": "The threshold for the similarity of the embeddings."
            },
            {
                "key": "update_all_parameter",
                "type": "boolean",
                "description": "Whether to update all the embeddings or only the missing ones.",
                "default": False
            },
            {
                "key": "prompt_img_gen",
                "type": "string",
                "description": "The prompt to generate an image from."
            },
            {
                "key": "n_parameter",
                "type": "integer",
                "description": "The number of images to generate.",
            },
            {
                "key": "size_parameter",
                "type": "string",
                "description": "The size of the generated images.",
            },
            {
                "key": "quality_parameter",
                "type": "string",
                "description": "The quality of the image generation. Options: 'standard', 'hd'.",
            },
            {
                "key": "text_parameter",
                "type": "string",
                "description": "The text to convert to speech."
            },
            {
                "key": "voice_parameter",
                "type": "string",
                "description": "The voice to use for the speech.",
                "default": "nova"
            },
            {
                "key": "voice_bark_parameter",
                "type": "string",
                "description": "The voice to use for the speech.", # TODO: Add Bark TTS voices to description
                "default": "v2/en_speaker_6"
            },
            {
                "key": "speed_parameter",
                "type": "number",
                "description": "The speed of the speech."
            },
            {
                "key": "retrieval_result_parameter",
                "type": "string",
                "description": "The list of retrieved embeddings as a string."
            },
            {
                "key": "url_param",
                "type": "string",
                "description": "The URL to scrape",
            },
            {
                "key": "web_scrape_content_param",
                "type": "string",
                "description": "The raw content of the web required if it is already retrieved. If provided, url will be ignored (it is still required).",
            },
            {
                "key": "url_summarization_param",
                "type": "string",
                "description": "The clean text of the web scraped and summarized by the url_summarization node",
            },
            {
                "key": "generate_selectors_and_parse_param",
                "type": "string",
                "description": "The clean text of the web scrape task returned by the generate_selectors_and_parse node",
            },
        ],
        "prompts": [
            {
                "key": "retrieval_output_template",
                "name": "Retrieval output template",
                "content": """  """,
                "is_templated": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "retrieve_relevant_embeddings": "retrieval_result_parameter"
                    },
                    "required": ["retrieve_relevant_embeddings"]
                }
            },
            {
                "key": "web_scrape_selector_agent_prompt",
                "name": "Web Scrape Selector Agent",
                "content": get_prompt_file("web_scrape_selector_agent.prompt"),
            },
            {
                "key": "web_scrape_output_prompt_2",
                "name": "Web Scrape Output Template w/ Summarization",
                "content": "{{ url_summarization }}",
                "is_templated": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "url_summarization": "url_summarization_param"
                    },
                    "required": ["url_summarization"]
                }
            },
            {
                "key": "web_scrape_output_prompt",
                "name": "Web Scrape Output Template",
                "content": "{{ generate_selectors_and_parse }}",
                "is_templated": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "generate_selectors_and_parse": "generate_selectors_and_parse_param"
                    },
                    "required": ["generate_selectors_and_parse"]
                }
            },
            {
                "key": "basic_prompt_url",
                "name": "URL Prompt",
                "content": "{{ url }}",
                "is_templated": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "url": "url_param"
                    },
                    "required": ["url"]
                }
            },
            {
                "key": "web_summarizer_prompt",
                "name": "Web Summarizer",
                "content": get_prompt_file("web_summarizer.prompt"),
            },
        ],
        "agents": [
            {
                "key": "oai_agent",
                "name": "Alice (OpenAI)",
                "system_message": "default_system_message",
                "models": {
                    "embeddings": "oai_embedding_large",
                    "img_gen": "Dall-E-3",
                    "tts": "tts-1",
                    "chat": "GPT4-turbo",
                    "stt": "Whisper_1"
                },
                "has_code_exec": 0,
                "has_tools": 1,
                "max_consecutive_auto_reply": 1,
            },
            {
                "key": "gemini_agent",
                "name": "Alice (Gemini)",
                "system_message": "default_system_message",
                "models": {
                    "embeddings": "gemini_text_embedding",
                    "img_gen": "gemini_img_gen_imagen_3", # Still doesn't work
                    "stt": "gemini_1.5_flash_stt",
                    "vision": "gemini_1.5_flash_v",
                    "chat": "gemini_1.5_flash",
                },
                "has_code_exec": 0,
                "has_tools": 1,
                "max_consecutive_auto_reply": 1,
            },
            {
                "key": "mistral_agent",
                "name": "Mistral Agent",
                "system_message": "default_system_message",
                "models": {
                    "embeddings": "mistral-embed",
                    "vision": "pixtral12b",
                    "chat": "mistral_small",
                },
                "has_code_exec": 0,
                "has_tools": 1,
                "max_consecutive_auto_reply": 1,
            },
            {
                "key": "Groq_agent",
                "name": "Alice (Groq)",
                "system_message": "default_system_message",
                "models": {
                    "stt": "groq_stt_whisper",
                    "vision": "groq_llama_3_2_11b_vision",
                    "chat": "llama-3.1-70b-versatile",
                },
                "has_code_exec": 0,
                "has_tools": 0,
                "max_consecutive_auto_reply": 1,
            },
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
            {
                "key": "web_scrape_selector_agent",
                "name": "Web Scrape Selector",
                "system_message": "web_scrape_selector_agent_prompt",
                "models": {
                    "chat": "GPT4o",
                },
                "max_consecutive_auto_reply": 1,
                "has_tools": 0,
                "has_code_exec": 0,                
            },
            {
                "key": "web_summarizer_agent",
                "name": "web_summarizer",
                "system_message": "web_summarizer_prompt", # TODO: Currently, the scrape task is using this same prompt, but it is embedded in the task, 
                "models": {                                # because it uses the selector agent. I need to either allow tasks to have multiple agents, 
                    "chat": "GPT4o",                       # allow agents to have multiple system prompts, allow tasks to swap them, or some other solution. 
                },
                "max_consecutive_auto_reply": 1,
                "has_tools": 0,
                "has_code_exec": 0,                
            },
        ],
        "tasks": [
            {
                "key": "embedding_task",
                "task_type": "EmbeddingTask",
                "task_name": "Embedding_Task",
                "agent": "oai_agent",
                "task_description": "Generates embeddings for the input text",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "input": "input_parameter",
                    },
                    "required": ["input"]
                },
                "required_apis": ["embeddings"]
            },
            {
                "key": "retrieval_task",
                "task_type": "RetrievalTask",
                "task_name": "Retrieve_Relevant_Embeddings",
                "agent": "oai_agent",
                "task_description": "Retrieves similar embeddings for the input text from its data cluster, ensuring all the references have embeddings available.",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_retrieval_parameter",
                        "max_results": "max_results_parameter",
                        "sumilarity_threshold": "sumilarity_threshold_parameter",
                        "update_all": "update_all_parameter",
                    },
                    "required": ["prompt"]
                },
                "templates": {
                    "output_template": "retrieval_output_template"
                },
                "required_apis": ["embeddings"]
            },
            {
                "key": "update_data_cluster_task",
                "task_type": "RetrievalTask",
                "task_name": "Update_Data_Cluster",
                "agent": "oai_agent",
                "task_description": "Ensures all the references in its data cluster have embeddings available. If Update All is set to True, it updates all the embeddings, otherwise only the missing ones.",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "update_all": "update_all_parameter",
                    },
                    "required": []
                },
                "required_apis": ["embeddings"],
                "node_end_code_routing": {
                    'ensure_embeddings_in_data_cluster': {
                        0: (None, False),
                        1: ('ensure_embeddings_in_data_cluster', True),
                    },
                },
            },
            {
                "key": "image_gen_task",
                "task_type": "GenerateImageTask",
                "task_name": "DALL-E_Image_Generation",
                "agent": "oai_agent",
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
                "key": "image_gen_task_gemini",
                "task_type": "GenerateImageTask",
                "task_name": "Image_Gen_Gemini_Imagen3",
                "agent": "gemini_agent",
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
                "key": "tts_task",
                "task_type": "TextToSpeechTask",
                "task_name": "OAI_TTS_Task",
                "agent": "oai_agent",
                "task_description": "Converts text to speech using the OpenAI TTS API",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "text": "text_parameter",
                        "voice": "voice_parameter",
                        "speed": "speed_parameter"
                    },
                    "required": ["text"]
                },
                "required_apis": ["text_to_speech"]
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
            {
                "key": "web_scrape_task_2",
                "task_type": "WebScrapeBeautifulSoupTask",
                "task_name": "Scrape_and_Summarize_URL",
                "task_description": "Scrapes a webpage using BeautifulSoup and an LLM agent to both parse and summarize the content",
                "agent": "web_scrape_selector_agent",
                "required_apis": ["llm_api"],
                "templates": {
                    "task_template": "basic_prompt_url",
                    "output_template": "web_scrape_output_prompt_2"
                },
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "url": "url_param",
                        "fetch_url_html_content": "web_scrape_content_param"
                    },
                    "required": ["url"]
                },
                "node_end_code_routing": {
                    'fetch_url': {
                        0: ('generate_selectors_and_parse', False),
                        1: ('fetch_url', True),
                    }, 
                    'generate_selectors_and_parse': {
                        0: ('url_summarization', False),
                        1: ('generate_selectors_and_parse', True),
                    },
                    'url_summarization': {
                        0: (None, False),
                        1: ('url_summarization', True),
                    }
                },
            },
            {
                "key": "web_scrape_task",
                "task_type": "WebScrapeBeautifulSoupTask",
                "task_name": "Scrape_URL",
                "task_description": "Scrapes a webpage using BeautifulSoup and an LLM agent to parse the content",
                "agent": "web_scrape_selector_agent",
                "required_apis": ["llm_api"],
                "templates": {
                    "task_template": "basic_prompt_url",
                    "output_template": "web_scrape_output_prompt"
                },
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "url": "url_param",
                        "fetch_url_html_content": "web_scrape_content_param"
                    },
                    "required": ["url"]
                },
                "node_end_code_routing": {
                    'fetch_url': {
                        0: ('generate_selectors_and_parse', False),
                        1: ('fetch_url', True),
                    }, 
                    'generate_selectors_and_parse': {
                        0: (None, False),
                        1: ('generate_selectors_and_parse', True),
                    },
                },
            },
        ],
    }
)
