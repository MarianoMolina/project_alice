from typing import List, Dict, Any
from pydantic import Field
from workflow_logic.db_app.initialization.modules.init_module import InitializationModule

class AdvancedChatModule(InitializationModule):
    name: str = "advanced_chat"
    dependencies: List[str] = ["base", "base_tasks", "base_chat"]
    data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)

advanced_chat_module = AdvancedChatModule(
    data={
        "chats": [
            {
                "key": "advanced_chat",
                "name": "Advanced Chat (GPT)",
                "messages": [],
                "alice_agent": "gpt_alice",  # Reference to agent key from base_chat
                "functions": ["search_hub", "coding_workflow"],  # Reference to task keys from base_tasks and coding_workflow
            },
            {
                "key": "advanced_chat_claude",
                "name": "Advanced Chat (Claude)",
                "messages": [],
                "alice_agent": "claude_alice",  # Reference to agent key from base_chat
                "functions": ["search_hub", "coding_workflow"],  # Reference to task keys from base_tasks and coding_workflow
            },
            {
                "key": "advanced_chat_lm_studio",
                "name": "Advanced Chat (LM Studio)",
                "messages": [],
                "alice_agent": "lm_studio_alice",  # Reference to agent key from base_chat
                "functions": ["search_hub", "coding_workflow"],  # Reference to task keys from base_tasks and coding_workflow
            }
        ]
    }
)