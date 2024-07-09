from pydantic import BaseModel, Field
from typing import List, Dict, Any
from workflow_logic.util.const import ANTHROPIC_API, OPENAI_API_KEY

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
            "key": "GPT4o",
            "short_name": "GPT4o",
            "model_format": "OpenChat",
            "model": "gpt-4o-2024-05-13",
            "ctx_size": 128000,
            "model_type": "chat",
            "deployment": "remote",
            "api_type": "openai",
            "api_key": OPENAI_API_KEY,
            "base_url": "https://api.openai.com/v1"
        },
        # {
        #     "key": "Llama3_8B_Instruct",
        #     "short_name": "Llama3_8B_Instruct",
        #     "model": "nisten/llama3-8b-instruct-32k-gguf",
        #     "model_format": "Llama3",
        #     "model_file": "nisten/llama3-8b-instruct-32k-gguf/llama3ins-8b-32k-q6.gguf",
        #     "ctx_size": 32768,
        #     "model_type": "instruct",
        #     "deployment": "local",
        # },
        {
            "key": "Claude3.5",
            "short_name": "Claude3.5",
            "model_format": "OpenChat",
            "model": "claude-3-5-sonnet-20240620",
            "ctx_size": 200000,
            "model_type": "chat",
            "deployment": "remote",
            "api_type": "anthropic",
            "api_key": ANTHROPIC_API,
            "base_url": "https://api.anthropic.com",
            "model_client_cls": "AnthropicClient"
        }
    ],
    parameters=[
        {
            "key": "prompt_parameter",
            "type": "string",
            "description": "The input prompt for the task",
            "default": None
        },
    ],
    prompts=[
        {
            "key": "default_system_message",
            "name": "Default System Message",
            "content": "You are a helpful AI assistant.",
            "is_templated": False
        },
        {
            "key": "basic_prompt",
            "name": "Basic Prompt",
            "content": "{{ prompt }}",
            "is_templated": True,
            "parameters": {
                "type": "object",
                "properties": {
                    "prompt": "prompt_parameter"
                },
                "required": ["prompt"]
            }
        },
        {
            "key": "research_agent",
            "name": "Research Agent",
            "content": """You are a research specialist. You have access to different tools that retrieve information from different sources. 
Look at the task the user requested and use any tools you believe could be relevant. 
Once you believe the task is complete, create a summary with references for the user and end with 'TERMINATE'.""",
            "is_templated": False
        },
        {
            "key": "executor_agent",
            "name": "Executor Agent",
            "content": "Executor Agent. Executes the code and returns the result."
        },
    ],
    agents=[
        {
            "key": "default_alice",
            "name": "Default Assistant",
            "system_message": "default_system_message",  # Reference to prompt key
            "autogen_class": "AssistantAgent",
            "model": "GPT4o",  # Reference to model key
            "code_execution_config": False,
            "max_consecutive_auto_reply": 10,
            "human_input_mode": "NEVER",
            "default_auto_reply": ""
        },
        {
            "key": "research_agent",
            "name": "research_agent",
            "system_message": "research_agent", # Reference
            "autogen_class": "ConversableAgent",
            "model": "GPT4o", # Reference
            "code_execution_config": False,
            "max_consecutive_auto_reply": 10,
            "human_input_mode": "NEVER",
            "default_auto_reply": ""
        },
        {
            "key": "executor_agent",
            "name": "executor_agent",
            "system_message": "executor_agent", # Reference
            "autogen_class": "UserProxyAgent",
            "code_execution_config": True,
            "default_auto_reply": ""
        }
    ],
    tasks=[
        {
            "key": "reddit_search",
            "task_type": "RedditSearchTask",
            "task_name": "reddit_search"
        },
        {
            "key": "exa_search",
            "task_type": "ExaSearchTask",
            "task_name": "exa_search",
        },
        {
            "key": "wikipedia_search",
            "task_type": "WikipediaSearchTask",
            "task_name": "wikipedia_search",
        },
        {
            "key": "google_search",
            "task_type": "GoogleSearchTask",
            "task_name": "google_search",
        },
        {
            "key": "arxiv_search",
            "task_type": "ArxivSearchTask",
            "task_name": "arxiv_search",
        },
        {   
            "key": "search_hub",
            "task_type": "AgentWithFunctions", 
            "task_name": "search_hub",
            "task_description": "Searches multiple sources and returns the results",
            "agent_id": "research_agent",
            "tasks":{
                "reddit_search": "reddit_search", # Reference
                "exa_search": "exa_search",# Reference
                "wikipedia_search": "wikipedia_search",# Reference
                "google_search": "google_search",# Reference
                "arxiv_search": "arxiv_search",# Reference
            },
        }
    ],
    chats=[
        {
            "key": "default_chat",
            "name": "New Chat",
            "messages": [],
            "alice_agent": "default_alice",  # Reference to agent key
            "executor": "executor_agent", # Reference
            "llm_config": {
                "config_list": ["GPT4o"],
                "temperature": 0.9,
                "timeout": 300
            }
        }
    ]
)