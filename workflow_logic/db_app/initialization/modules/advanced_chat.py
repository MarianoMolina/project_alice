from typing import List, Dict, Any
from pydantic import Field
from workflow_logic.db_app.initialization.modules.init_module import InitializationModule

class AdvancedChatModule(InitializationModule):
    name: str = "advanced_chat"
    dependencies: List[str] = ["base", "base_tasks", "base_chat", "adv_tasks"]
    data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)

advanced_chat_module = AdvancedChatModule(
    data={
        "agents": [
            {
                "key": "gpt_alice_adv",
                "name": "GPT Alice (turbo)",
                "system_message": "default_system_message",
                "models": {
                    "chat": "gpt-4o-mini",
                    "img_gen": "Dall-E-3",
                    "embeddings": "oai_embedding_large",
                    "tts": "tts-1",
                },
                "has_code_exec": False,
                "has_functions": True,
                "max_consecutive_auto_reply": 1,
            },
            {
                "key": "claude_alice_adv",
                "name": "Claude Alice",
                "system_message": "default_system_message",
                "models": {
                    "chat": "Claude3.5",
                    "img_gen": "Dall-E-3",
                    "embeddings": "oai_embedding_large",
                    "tts": "tts-1",
                },
                "max_consecutive_auto_reply": 1,
                "has_functions": True,
                "has_code_exec": True,
            },
        ],
        "chats": [
            {
                "key": "advanced_chat",
                "name": "Advanced Chat (GPT)",
                "messages": [],
                "alice_agent": "gpt_alice_adv",  # Reference to agent key from base_chat
                "functions": ["search_hub", "embedding_task", "tts_task"],  # Reference to task keys from base_tasks and coding_workflow
            },
            {
                "key": "advanced_chat_claude",
                "name": "Advanced Chat (Claude)",
                "messages": [],
                "alice_agent": "claude_alice",  # Reference to agent key from base_chat
                "functions": ["search_hub", "image_gen_task"],  # Reference to task keys from base_tasks and coding_workflow
            },
        ]
    }
)