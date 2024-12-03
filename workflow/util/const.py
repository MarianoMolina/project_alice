import os
from dotenv import load_dotenv
load_dotenv()

CHAR_PER_TOKEN = 3
EST_TOKENS_PER_TOOL = 100

BACKEND_PORT = os.getenv("BACKEND_PORT", 3000)
FRONTEND_PORT = os.getenv("FRONTEND_PORT", 4000)
WORKFLOW_PORT = os.getenv("WORKFLOW_PORT", 8000)
FRONTEND_PORT_DOCKER = os.getenv("FRONTEND_PORT_DOCKER", 4000)
BACKEND_PORT_DOCKER = os.getenv("BACKEND_PORT_DOCKER", 3000)
HOST = os.getenv("HOST", "localhost")
FRONTEND_HOST = os.getenv("FRONTEND_HOST", "frontend")
BACKEND_HOST = os.getenv("BACKEND_HOST", "backend")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN")
SHARED_UPLOAD_DIR = os.getenv("SHARED_UPLOAD_DIR", '/app/shared-uploads')
# Environment variable to control log level
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

LOGGING_FOLDER = os.getenv("LOGGING_FOLDER", "logs")

const_model_definitions = [
    {
        "short_name": "Mistral7B_Instruct",
        "model_name": "TheBloke/Mistral-7B-Instruct-v0.2-GGUF",
        "model_file": "TheBloke/Mistral-7B-Instruct-v0.2-GGUF/mistral-7b-instruct-v0.2.Q6_K.gguf",
        "model_format": "Mistral_Instruct",
        "ctx_size": 32768,
        "model_type": "instruct",
    },
    {  
        "short_name": "Starling7B_Chat",
        "model_name": "LoneStriker/Starling-LM-7B-beta-GGUF",
        "model_file": "LoneStriker/Starling-LM-7B-beta-GGUF/Starling-LM-7B-beta-Q8_0.gguf",
        "model_format": "OpenChat",
        "ctx_size": 8192,
        "model_type": "chat",
    },
    {
        "short_name": "Llama8B_Chat",
        "model_name": "bartowski/llama-3-neural-chat-v2.2-8B-GGUF",
        "model_format": "Llama3Neural",
        "model_file": "bartowski/llama-3-neural-chat-v2.2-8B-GGUF/llama-3-neural-chat-v2.2-8B-Q6_K.gguf",
        "ctx_size": 8192,
        "model_type": "chat",
    },
    {
        "short_name": "StarCoder2_15B",
        "model_name": "second-state/StarCoder2-15B-GGUF",
        "model_format": "Starcoder2",
        "model_file": "second-state/StarCoder2-15B-GGUF/starcoder2-15b-Q6_K.gguf",
        "ctx_size": 16384,
        "model_type": "instruct",
    },
    {
        "short_name": "Llama3_Medichat",
        "model_name": "mradermacher/Medichat-V2-Llama3-8B-GGUF",
        "model_format": "Llama3",
        "model_file": "mradermacher/Medichat-V2-Llama3-8B-GGUF/Medichat-V2-Llama3-8B.Q8_0.gguf",
        "ctx_size": 32768,
        "model_type": "instruct",
    },
    {
        "short_name": "Llama3_8B_Instruct_v2",
        "model_name": "bartowski/Llama-3-8B-Instruct-Gradient-1048k-GGUF",
        "model_format": "Llama3",
        "model_file": "bartowski/Llama-3-8B-Instruct-Gradient-1048k-GGUF/Llama-3-8B-Instruct-Gradient-1048k-Q8_0.gguf",
        "ctx_size": 64000,
        "model_type": "instruct",
    },
    {
        "short_name": "Llama3_8B_Instruct",
        "model_name": "nisten/llama3-8b-instruct-32k-gguf",
        "model_format": "Llama3",
        "model_file": "nisten/llama3-8b-instruct-32k-gguf/llama3ins-8b-32k-q6.gguf",
        "ctx_size": 32768,
        "model_type": "instruct",
    },
    {
        "short_name": "Llava_vision",
        "model_name": "xtuner/llava-llama-3-8b-v1_1-gguf",
        "model_format": "Obsidian_Vision",
        "model_file": "xtuner/llava-llama-3-8b-v1_1-gguf/llava-llama-3-8b-v1_1-f16.gguf",
        "ctx_size": 4096,
        "model_type": "vision",
    },
    {
        "short_name": "GPT3.5",
        "model_format": "OpenChat",
        "model_name": "gpt-3.5-turbo-0125",
        "ctx_size": 16385,
        "model_type": "chat",
        "api_type": "openai",
        "api_key": '',
        "base_url": "https://api.openai.com/v1"
    },
    {
        "short_name": "GPT4",
        "model_format": "OpenChat",
        "model_name": "gpt-4-turbo-2024-04-09",
        "ctx_size": 128000,
        "model_type": "chat",
        "api_type": "openai",
        "api_key":'',
        "base_url": "https://api.openai.com/v1"
    },
    {
        "short_name": "Claude3",
        "model_format": "OpenChat",
        "model_name": "claude-3-opus-20240229",
        "ctx_size": 200000,
        "model_type": "chat",
        "api_type": "anthropic",
        "api_key": '',
        "base_url": "https://api.anthropic.com",
        "model_client_cls": "AnthropicClient"
    },
    {
        "short_name": "GPT4o",
        "model_format": "OpenChat",
        "model_name": "gpt-4o-2024-05-13",
        "ctx_size": 128000,
        "model_type": "chat",
        "api_type": "openai",
        "temperature": 0.7,
    }
]

model_formats = {
    "Base": {
        "input_prefix": "<|im_end|><|im_start|>user<|im_end|>\n\n",
        "input_suffix": "<|im_end|><|im_start|>assistant<|im_end|>\n\n",
        "pre_prompt": "You are a helpful, smart, kind, and efficient AI assistant. You always fulfill the user's requests to the best of your ability.",
        "pre_prompt_prefix": "<|im_start|>system<|im_end|>\n\n",
        "pre_prompt_suffix": "",
        "antiprompt": [
            "<|im_start|>",
            "<|im_end|>",
            "<|eot_id|>", 
            "<|start_header_id|>"
        ]
    },
    "ChatML": {
        "input_prefix": "<|im_end|>\n<|im_start|>user\n",
        "input_suffix": "<|im_end|>\n<|im_start|>assistant\n",
        "antiprompt": [
            "<|im_start|>",
            "<|im_end|>",
            "<|eot_id|>", 
            "<|start_header_id|>"
        ],
        "pre_prompt_prefix": "<|im_start|>system\n",
        "pre_prompt_suffix": "",
        "pre_prompt": "Perform the task to the best of your ability."
    },
    "Mistral_Instruct": {
        "input_prefix": "</s><s>[INST]",
        "input_suffix": "[/INST]<s>",
        "antiprompt": [
            "[INST]", 
            "[/INST]",
            "</s>",
            "<s>"
        ],
        "pre_prompt_prefix": "<s>",
        "pre_prompt_suffix": "",
        "pre_prompt": ""
    },
    "CodeLlama_Instruct": {
        "input_prefix": "[INST]",
        "input_suffix": "[/INST]\n",
        "pre_prompt": "Below is an instruction that describes a task. Write a response that appropriately completes the request.",
        "pre_prompt_prefix": "<<SYS>>",
        "pre_prompt_suffix": "<</SYS>>\n",
        "antiprompt": [
            "[INST]", 
            "<<SYS>>"
        ]
    },
    "Llama3": {
        "input_prefix": "<|im_end|><|im_start|>user<|im_end|>\n\n",
        "input_suffix": "<|im_end|><|im_start|>assistant<|im_end|>\n\n",
        "pre_prompt": "You are a helpful, smart, kind, and efficient AI assistant. You always fulfill the user's requests to the best of your ability.",
        "pre_prompt_prefix": "<|im_start|>system<|im_end|>\n\n",
        "pre_prompt_suffix": "",
        "antiprompt": [
            "<|im_start|>",
            "<|im_end|>",
            "<|eot_id|>", 
            "<|start_header_id|>"
        ]
    },
    "Llama3Neural": {
        "input_prefix": "<|end_of_text|><|begin_of_text|>user<|end_of_text|>\n",
        "input_suffix": "<|end_of_text|><|begin_of_text|>assistant<|end_of_text|>\n",
        "pre_prompt": "You are a helpful, smart, kind, and efficient AI assistant. You always fulfill the user's requests to the best of your ability.",
        "pre_prompt_prefix": "<|begin_of_text|>system<|end_of_text|>\n",
        "pre_prompt_suffix": "",
        "antiprompt": [
            "<|begin_of_text|>",
            "<|end_of_text|>",
            "<|eot_id|>", 
            "<|start_header_id|>"
        ]
    },
    "Starcoder2": {
        "input_prefix": "### Instruction:\n",
        "input_suffix": "\n### Response:\n",
        "antiprompt": [
            "### Instruction:", 
            "### Response:", 
            "### SYS:"
        ],
        "pre_prompt": "Below is an instruction that describes a task. Write a response that appropriately completes the request.",
        "pre_prompt_prefix": "### SYS: \n",
        "pre_prompt_suffix": "\n"
    },
    "OpenChat": {
        "input_prefix": "<|end_of_turn|>GPT4 Correct User: ",
        "input_suffix": "<|end_of_turn|>GPT4 Correct Assistant:",
        "antiprompt": [
            "<|end_of_turn|>",
            "GPT4 Correct User:",
            "GPT4 Correct Assistant:"
        ],
        "pre_prompt_prefix": "",
        "pre_prompt_suffix": "",
        "pre_prompt": ""
    },
    "Obsidian_Vision": {
        "input_prefix": "<|im_start|>user\n",
        "input_suffix": "\n###\n<|im_start|>assistant:",
        "antiprompt": [
        "<|im_start|>",
        "<|im_end|>",
        "###",
        "<|endoftext|>"
        ],
        "pre_prompt": "",
        "pre_prompt_suffix": "",
        "pre_prompt_prefix": ""
    }
}