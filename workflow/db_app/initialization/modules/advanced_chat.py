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
                "has_tools": 1,
                "has_code_exec": 0,
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
                "has_tools": 1,
                "has_code_exec": 0,
                "max_consecutive_auto_reply": 1,
            },
            {
                "key": "oai_alice_adv",
                "name": "Alice w/ approve-tools (OAI)",
                "system_message": "default_system_message",
                "models": {
                    "chat": "gpt-4o-mini",
                    "img_gen": "Dall-E-3",
                    "embeddings": "oai_embedding_large",
                    "tts": "tts-1",
                },
                "has_tools": 2,
                "has_code_exec": 0,
                "max_consecutive_auto_reply": 1,
            }
        ],
        "chats": [
            {
                "key": "advanced_chat",
                "name": "Advanced Chat (Gemini)",
                "alice_agent": "gemini_alice_adv", 
                "agent_tools": [ "web_scrape_workflow", "tts_task", "research_workflow"],
                "retrieval_tools": ["retrieval_task"],
                "default_user_checkpoints": {
                    "tool_call": "default_tool_call_checkpoint",
                    "code_execution": "default_code_exec_checkpoint"
                }
            },
            {
                "key": "advanced_chat_claude",
                "name": "Advanced Chat (Claude)",
                "alice_agent": "claude_alice_adv",
                "agent_tools": ["coding_workflow", "image_gen_task", "search_hub"],
                "default_user_checkpoints": {
                    "tool_call": "default_tool_call_checkpoint",
                    "code_execution": "default_code_exec_checkpoint"
                }
            },
            {
                "key": "advanced_chat_oai",
                "name": "Advanced Chat (OAI)",
                "alice_agent": "oai_alice_adv",
                "agent_tools": ["coding_workflow", "image_gen_task", "search_hub"],
                "retrieval_tools": ["retrieval_task"],
                "default_user_checkpoints": {
                    "tool_call": "default_tool_call_checkpoint",
                    "code_execution": "default_code_exec_checkpoint"
                }
            }
        ]
    }
)