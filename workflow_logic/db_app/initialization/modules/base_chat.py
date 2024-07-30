from typing import List, Dict, Any
from pydantic import Field
from workflow_logic.db_app.initialization.modules.init_module import InitializationModule

class BaseChatModule(InitializationModule):
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
            {
                "key": "executor_agent",
                "name": "Executor Agent",
                "content": "Executor Agent. Executes the code and returns the result."
            },
        ],
        "agents": [
            {
                "key": "default_alice",
                "name": "Default Assistant",
                "system_message": "default_system_message",
                "autogen_class": "ConversableAgent",
                "model_id": "GPT4o",
                "code_execution_config": False,
                "max_consecutive_auto_reply": 10,
                "human_input_mode": "NEVER",
                "default_auto_reply": ""
            },
            {
                "key": "executor_agent",
                "name": "executor_agent",
                "system_message": "executor_agent",
                "autogen_class": "UserProxyAgent",
                "code_execution_config": True,
                "default_auto_reply": "",
                "model_id": None,
            },
        ],
        "chats": [
            {
                "key": "default_chat",
                "name": "New Chat",
                "messages": [],
                "alice_agent": "default_alice",
                "executor": "executor_agent",
                "model_id": "GPT4o",
                "functions": [],
            },
        ]
    }
)