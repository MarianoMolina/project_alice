from typing import List, Dict, Any
from pydantic import Field
from workflow_logic.db_app.initialization.modules.init_module import InitializationModule

class BaseTasksModule(InitializationModule):
    name: str = "base_tasks"
    dependencies: List[str] = ["base"]
    data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)

base_tasks_module = BaseTasksModule(
    data = {
        "parameters": [
            {
                "key": "prompt_parameter",
                "type": "string",
                "description": "The input prompt for the task",
                "default": None
            },
            {
                "key": "max_results_parameter",
                "type": "integer",
                "description": "The maximum number of results to return",
                "default": 10
            },
            {
                "key": "sort_parameter",
                "type": "string",
                "description": "The sort method for the search",
                "default": "hot"
            },
            {
                "key": "time_filter_parameter",
                "type": "string",
                "description": "The time period to filter by",
                "default": "week"
            },
            {
                "key": "subreddit_parameter",
                "type": "string",
                "description": "The subreddit to search",
                "default": "all"
            },
        ],
        "prompts": [
            {
                "key": "research_agent",
                "name": "Research Agent",
                "content": """You are a research specialist. You have access to different tools that retrieve information from different sources. 
    Look at the task the user requested and use any tools you believe could be relevant. 
    Once you believe the task is complete, create a summary with references for the user and end with 'TERMINATE'.""",
                "is_templated": False
            },
        ],
        "agents": [
            {
                "key": "research_agent",
                "name": "research_agent",
                "system_message": "research_agent",
                "autogen_class": "ConversableAgent",
                "model_id": "GPT4o",
                "code_execution_config": False,
                "max_consecutive_auto_reply": 10,
                "human_input_mode": "NEVER",
                "default_auto_reply": ""
            },
        ],
        "tasks": [
            {
                "key": "reddit_search",
                "task_type": "APITask",
                "task_name": "reddit_search",
                "task_description": "Searches Reddit for information",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter",
                        "sort": "sort_parameter",
                        "time_filter": "time_filter_parameter",
                        "subreddit": "subreddit_parameter",
                        "limit": "max_results_parameter"
                    },
                    "required": ["prompt"]
                },
                "required_apis": ["reddit_search"]
            },
            {
                "key": "exa_search",
                "task_type": "APITask",
                "task_name": "exa_search",
                "task_description": "Searches Exa for information",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter",
                        "limit": "max_results_parameter"
                    },
                    "required": ["prompt"]
                },
                "required_apis": ["exa_search"]
            },
            {
                "key": "wikipedia_search",
                "task_type": "APITask",
                "task_name": "wikipedia_search",
                "task_description": "Searches Wikipedia for information",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter",
                        "limit": "max_results_parameter"
                    },
                    "required": ["prompt"]
                },
                "required_apis": ["wikipedia_search"]
            },
            {
                "key": "google_search",
                "task_type": "APITask",
                "task_name": "google_search",
                "task_description": "Searches Google for information",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter",
                        "limit": "max_results_parameter"
                    },
                    "required": ["prompt"]
                },
                "required_apis": ["google_search"]
            },
            {
                "key": "arxiv_search",
                "task_type": "APITask",
                "task_name": "arxiv_search",
                "task_description": "Searches arXiv for papers",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter",
                        "limit": "max_results_parameter"
                    },
                    "required": ["prompt"]
                },
                "required_apis": ["arxiv_search"]
            },
            {   
                "key": "search_hub",
                "task_type": "PromptAgentTask", 
                "task_name": "search_hub",
                "task_description": "Searches multiple sources and returns the results",
                "agent": "research_agent",
                "templates": {
                    "task_template": "basic_prompt"
                },
                "execution_agent": "executor_agent",
                "tasks":{
                    "reddit_search": "reddit_search",
                    "exa_search": "exa_search",
                    "wikipedia_search": "wikipedia_search",
                    "google_search": "google_search",
                    "arxiv_search": "arxiv_search",
                },
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter",
                    },
                    "required": ["prompt"]
                },
                "required_apis": ["llm_api"]
            },
        ]
    }
)