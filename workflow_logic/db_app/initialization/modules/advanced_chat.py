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
                "name": "Advanced Chat",
                "messages": [],
                "alice_agent": "default_alice",  # Reference to agent key from base_chat
                "executor": "executor_agent",  # Reference to agent key from base_chat
                "model_id": "GPT4o",  # Reference to model key from base
                "functions": ["search_hub", "coding_workflow"],  # Reference to task keys from base_tasks and coding_workflow
            }
        ]
    }
)