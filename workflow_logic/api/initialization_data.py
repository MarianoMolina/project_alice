from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union

class DBStructure(BaseModel):
    users: List[Dict[str, Any]] = Field(..., description="List of users to create")
    models: List[Dict[str, Any]] = Field(..., description="List of models to create")
    prompts: List[Dict[str, Any]] = Field(..., description="List of prompts to create")
    agents: List[Dict[str, Any]] = Field(..., description="List of agents to create")
    tasks: List[Dict[str, Any]] = Field(..., description="List of tasks to create")
    chats: List[Dict[str, Any]] = Field(..., description="List of chats to create")

DB_STRUCTURE = DBStructure(
    users=[
        {
            "key": "admin_user",
            "name": "Admin User",
            "email": "admin@example.com",
            "password": "admin_password",
            "role": "admin"
        },
        {
            "key": "test_user",
            "name": "Test User",
            "email": "testuser@example.com",
            "password": "testpassword123",
            "role": "user"
        }
    ],
    models=[
        {
            "key": "gpt3.5",
            "name": "GPT-3.5",
            "short_name": "GPT-3.5",
            "model_name": "gpt-3.5-turbo",
            "model_format": "OpenChat",
            "ctx_size": 4096,
            "model_type": "chat",
            "deployment": "remote",
            "api_type": "openai",
            "base_url": "https://api.openai.com/v1"
        }
    ],
    prompts=[
        {
            "key": "default_system_message",
            "name": "Default System Message",
            "content": "You are a helpful AI assistant.",
            "is_templated": False
        }
    ],
    agents=[
        {
            "key": "default_assistant",
            "name": "Default Assistant",
            "system_message": "default_system_message",  # Reference to prompt key
            "autogen_class": "AssistantAgent",
            "model": "gpt3.5",  # Reference to model key
            "code_execution_config": False,
            "max_consecutive_auto_reply": 10,
            "human_input_mode": "NEVER",
            "default_auto_reply": ""
        }
    ],
    tasks=[
        {
            "key": "simple_chat",
            "name": "Simple Chat",
            "task_description": "A simple chat task",
            "task_type": "BasicAgentTask",
            "agent_id": "default_assistant",  # Reference to agent key
            "execution_agent_id": "default_assistant",  # Reference to agent key
        }
    ],
    chats=[
        {
            "key": "default_chat",
            "name": "New Chat",
            "messages": [],
            "alice_agent": "default_assistant",  # Reference to agent key
            "executor": {
                "name": "executor_agent",
                "system_message": {
                    "name": "executor_agent",
                    "content": "Executor Agent. Executes the code and returns the result."
                },
                "autogen_class": "UserProxyAgent",
                "code_execution_config": True,
                "default_auto_reply": ""
            }
        }
    ]
)