from typing import List, Dict, Any
from pydantic import Field
from workflow.db_app.initialization.modules.init_module import InitializationModule

class AdvancedChatModule(InitializationModule):
    """This module defines the advanced chat agents and chats."""
    name: str = "advanced_chat"
    dependencies: List[str] = ["base", "base_tasks", "base_chat", "adv_tasks", "web_scrape_workflow", "coding_workflow", "research_workflow"]
    data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)

advanced_chat_module = AdvancedChatModule(
    data={
        "agents": [
            {
                "key": "gemini_alice_adv",
                "name": "Alice w/ tools (Gemini)",
                "system_message": "default_system_message",
                "models": {
                    "chat": "gemini_1.5_flash",
                    "img_gen": "Dall-E-3",
                    "embeddings": "gemini_text_embedding",
                    "tts": "tts-1",
                },
                "has_code_exec": False,
                "has_functions": True,
                "max_consecutive_auto_reply": 1,
            },
            {
                "key": "claude_alice_adv",
                "name": "Alice w/ tools (Claude)",
                "system_message": "default_system_message",
                "models": {
                    "chat": "Claude3.5",
                    "img_gen": "Dall-E-3",
                    "embeddings": "oai_embedding_large",
                    "tts": "tts-1",
                },
                "max_consecutive_auto_reply": 1,
                "has_functions": True,
                "has_code_exec": False,
            },
        ],
        "chats": [
            {
                "key": "advanced_chat",
                "name": "Advanced Chat (Gemini)",
                "messages": [],
                "alice_agent": "gemini_alice_adv", 
                "functions": [ "web_scrape_workflow", "embedding_task", "tts_task", "research_workflow"], 
            },
            {
                "key": "advanced_chat_claude",
                "name": "Advanced Chat (Claude)",
                "messages": [],
                "alice_agent": "claude_alice_adv",
                "functions": ["coding_workflow", "image_gen_task", "embedding_task"], 
            },
        ]
    }
)