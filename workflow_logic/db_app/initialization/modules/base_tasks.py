from typing import List, Dict, Any
from pydantic import Field
from workflow_logic.db_app.initialization.modules.init_module import InitializationModule, get_prompt_file

class BaseTasksModule(InitializationModule):
    """This module defines the base tasks, their agents, parameters and prompts."""
    name: str = "base_tasks"
    dependencies: List[str] = ["base"]
    data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)

base_tasks_module = BaseTasksModule(
    data = {
        "parameters": [
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
            }
        ],
        "prompts": [
            {
                "key": "research_agent_prompt",
                "name": "Research Agent",
                "content": get_prompt_file("research_agent.prompt"),
                "is_templated": False
            },
        ],
        "agents": [
            {
                "key": "research_agent",
                "name": "research_agent",
                "system_message": "research_agent_prompt",
                "models": {
                    "chat": "gpt-4o-mini",
                },
                "has_code_exec": False,
                "has_functions": True,
                "max_consecutive_auto_reply": 2,
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