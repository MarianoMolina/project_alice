from typing import List, Dict, Any
from pydantic import Field
from workflow.db_app.initialization.modules.init_module import InitializationModule, get_prompt_file

class BaseChatModule(InitializationModule):
    """This module defines the base chat agents and chats, as well as the default prompt for the chat agent."""
    name: str = "base_local_chat"
    dependencies: List[str] = ["base", "base_local", "base_chat"]
    data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)

base_local_chat_module = BaseChatModule(
    data = {
        "agents": [
            {
                "key": "lm_studio_alice",
                "name": "Alice (LM Studio)",
                "system_message": "default_system_message",
                "models": {
                    "chat": "Yi_Coder_9B",
                    "embeddings": "nomic-embed-text-v1",
                    "vision": "llava_vision",
                },
                "max_consecutive_auto_reply": 1,
                "has_tools": 1,
                "has_code_execution": 0,
            },
        ],
        "chats": [
            {
                "key": "lm_studio_chat",
                "name": "LMStudio Chat",
                "alice_agent": "lm_studio_alice",
                "default_user_checkpoints": {
                    "tool_call": "default_tool_call_checkpoint",
                    "code_execution": "default_code_exec_checkpoint"
                }
            },
        ]
    }
)