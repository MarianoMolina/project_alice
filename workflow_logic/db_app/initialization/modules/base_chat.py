from typing import List, Dict, Any
from pydantic import Field
from workflow_logic.db_app.initialization.modules.init_module import InitializationModule

class BaseChatModule(InitializationModule):
    """This module defines the base chat agents and chats, as well as the default prompt for the chat agent."""
    name: str = "base_chat"
    dependencies: List[str] = ["base"]
    data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)

base_chat_module = BaseChatModule(
    data = {
        "prompts": [
            {
                "key": "default_system_message",
                "name": "Default System Message",
                "content": """You are Alice, a helpful AI assistant. 
                You work with your user to help them not only with their tasks, but also to learn, grow and achieve their goals. 
                You are kind and humble, but direct, honest and clear. You are here to help, and you are always learning and improving.""",
                "is_templated": False
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
                "has_functions": True,
                "has_code_exec": False,
            },
            {
                "key": "claude_alice",
                "name": "Alice (Claude)",
                "system_message": "default_system_message",
                "models": {
                    "chat": "Claude3.5",
                },
                "max_consecutive_auto_reply": 1,
                "has_functions": True,
                "has_code_exec": False,
            },
            {
                "key": "lm_studio_alice",
                "name": "Alice (LM Studio)",
                "system_message": "default_system_message",
                "models": {
                    "chat": "Llama3_1_8B",
                },
                "max_consecutive_auto_reply": 1,
                "has_functions": True,
                "has_code_exec": False,
            },
            {
                "key": "gemini_alice",
                "name": "Alice (Gemini)",
                "system_message": "default_system_message",
                "models": {
                    "chat": "gemini_1.5_flash",
                },
                "max_consecutive_auto_reply": 1,
                "has_functions": True,
                "has_code_exec": False,
            },
            {
                "key": "mistral_alice",
                "name": "Alice (Mistral)",
                "system_message": "default_system_message",
                "models": {
                    "chat": "mistral_small",
                },
                "max_consecutive_auto_reply": 1,
                "has_functions": True,
                "has_code_exec": False,
            },
            {
                "key": "cohere_alice",
                "name": "Alice (Cohere)",
                "system_message": "default_system_message",
                "models": {
                    "chat": "command-r-plus",
                },
                "max_consecutive_auto_reply": 1,
                "has_functions": True,
                "has_code_exec": False,                
            },
            {
                "key": "meta_alice",
                "name": "Alice (Meta)",
                "system_message": "default_system_message",
                "models": {
                    "chat": "llama3.2_90b",
                },
                "max_consecutive_auto_reply": 1,
                "has_functions": True,
                "has_code_exec": False,
            },
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
                "key": "meta_chat",
                "name": "Meta Chat",
                "messages": [],
                "alice_agent": "meta_alice",
                "functions": [],
            },
        ]
    }
)