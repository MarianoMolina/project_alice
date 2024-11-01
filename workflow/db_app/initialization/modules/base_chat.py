from typing import List, Dict, Any
from pydantic import Field
from workflow.db_app.initialization.modules.init_module import InitializationModule, get_prompt_file

class BaseChatModule(InitializationModule):
    """This module defines the base chat agents and chats, as well as the default prompt for the chat agent."""
    name: str = "base_chat"
    dependencies: List[str] = ["base"]
    data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)

base_chat_module = BaseChatModule(
    data = {
        "parameters": [
            {
                "key": "user_name_parameter",
                "type": "string",
                "description": "The name of the user."
            }
        ],
        "prompts": [
            {
                "key": "default_system_message",
                "name": "Default System Message",
                "content": get_prompt_file("default_system_message.prompt"),
                "is_templated": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "user_name": "user_name_parameter"
                    },
                    "required": []
                }
            },
        ],
        "agents": [
            {
                "key": "gpt_alice",
                "name": "Alice (GPT)",
                "system_message": "default_system_message",
                "models": {
                    "chat": "GPT4o",
                },
                "max_consecutive_auto_reply": 1,
                "has_tools": 1,
                "has_code_exec": 0,
            },
            {
                "key": "claude_alice",
                "name": "Alice (Claude)",
                "system_message": "default_system_message",
                "models": {
                    "chat": "Claude3.5",
                },
                "max_consecutive_auto_reply": 1,
                "has_tools": 1,
                "has_code_exec": 0,
            },
            {
                "key": "lm_studio_alice",
                "name": "Alice (LM Studio)",
                "system_message": "default_system_message",
                "models": {
                    "chat": "Llama3_1_8B",
                },
                "max_consecutive_auto_reply": 1,
                "has_tools": 1,
                "has_code_exec": 0,
            },
            {
                "key": "gemini_alice",
                "name": "Alice (Gemini)",
                "system_message": "default_system_message",
                "models": {
                    "chat": "gemini_1.5_flash",
                },
                "max_consecutive_auto_reply": 1,
                "has_tools": 1,
                "has_code_exec": 0,
            },
            {
                "key": "mistral_alice",
                "name": "Alice (Mistral)",
                "system_message": "default_system_message",
                "models": {
                    "chat": "mistral_small",
                },
                "max_consecutive_auto_reply": 1,
                "has_tools": 1,
                "has_code_exec": 0,
            },
            {
                "key": "cohere_alice",
                "name": "Alice (Cohere)",
                "system_message": "default_system_message",
                "models": {
                    "chat": "command-r-plus",
                },
                "max_consecutive_auto_reply": 1,
                "has_tools": 1,
                "has_code_exec": 0,                
            },
            {
                "key": "llama_alice",
                "name": "Alice (Meta)",
                "system_message": "default_system_message",
                "models": {
                    "chat": "llama3.2_90b",
                },
                "max_consecutive_auto_reply": 1,
                "has_tools": 1,
                "has_code_exec": 0,
            },
            {
                "key": "groq_alice",
                "name": "Alice (Groq)",
                "system_message": "default_system_message",
                "models": {
                    "chat": "llama-3.1-70b-versatile",
                },
                "max_consecutive_auto_reply": 1,
                "has_tools": 1,
                "has_code_exec": 0,
            }
        ],
        "chats": [
            {
                "key": "default_chat",
                "name": "GPT4 Chat",
                "messages": [],
                "alice_agent": "gpt_alice",
                "functions": [],
            },
            {
                "key": "claude_chat",
                "name": "Claude Chat",
                "messages": [],
                "alice_agent": "claude_alice",
                "functions": [],
            },
            {
                "key": "lm_studio_chat",
                "name": "LMStudio Chat",
                "messages": [],
                "alice_agent": "lm_studio_alice",
                "functions": [],
            },
            {
                "key": "gemini_chat",
                "name": "Gemini Chat",
                "messages": [],
                "alice_agent": "gemini_alice",
                "functions": [],
            },
            {
                "key": "mistral_chat",
                "name": "Mistral Chat",
                "messages": [],
                "alice_agent": "mistral_alice",
                "functions": [],
            },
            {
                "key": "cohere_chat",
                "name": "Cohere Chat",
                "messages": [],
                "alice_agent": "cohere_alice",
                "functions": [],
            },
            {
                "key": "llama_chat",
                "name": "Llama Chat",
                "messages": [],
                "alice_agent": "llama_alice",
                "functions": [],
            },
            {
                "key": "groq_chat",
                "name": "Groq Chat",
                "messages": [],
                "alice_agent": "groq_alice",
                "functions": [],
            }
        ]
    }
)