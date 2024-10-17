from typing import List, Dict, Any
from pydantic import Field
from workflow.db_app.initialization.modules.init_module import InitializationModule, get_prompt_file

class WebScrapeWorkflowModule(InitializationModule):
    """This module defines the research workflow, its tasks, agents and prompts."""
    name: str = "web_scrape_workflow"
    dependencies: List[str] = ["base"]
    data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)

web_scrape_workflow_module = WebScrapeWorkflowModule(
    data={
        "parameters": [
            {
                "key": "url_param",
                "type": "string",
                "description": "The URL to scrape",
            },
            {
                "key": "paramsparams",
                "type": "string",
                "description": "The outputs of the web scrape task",
            },
        ],
        "prompts": [
            {
                "key": "web_scrape_selector_agent_prompt",
                "name": "Web Scrape Selector Agent",
                "content": get_prompt_file("web_scrape_selector_agent.prompt"),
            },
            {
                "key": "web_summarizer_prompt",
                "name": "Web Summarizer",
                "content": get_prompt_file("web_summarizer.prompt"),
            },
            {
                "key": "basic_prompt_url",
                "name": "URL Prompt",
                "content": "{{ url }}",
                "is_templated": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "url": "url_param"
                    },
                    "required": ["url"]
                }
            },
            {
                "key": "web_summarize_task_prompt",
                "name": "Web summarization prompt",
                "content": "{{ web_scrape }}",
                "is_templated": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "web_scrape": "paramsparams"
                    },
                    "required": ["web_scrape"]
                }
            },
        ],
        "agents": [
            {
                "key": "web_scrape_selector_agent",
                "name": "Web Scrape Selector",
                "system_message": "web_scrape_selector_agent_prompt",
                "models": {
                    "chat": "GPT4o",
                },
                "max_consecutive_auto_reply": 1,
                "has_functions": False,
                "has_code_exec": False,                
            },
            {
                "key": "web_summarizer_agent",
                "name": "web_summarizer",
                "system_message": "web_summarizer_prompt",
                "models": {
                    "chat": "GPT4o",
                },
                "max_consecutive_auto_reply": 1,
                "has_functions": False,
                "has_code_exec": False,                
            },
        ],
        "tasks": [
            {
                "key": "web_scrape_task",
                "task_type": "WebScrapeBeautifulSoupTask",
                "task_name": "web_scrape",
                "task_description": "Scrapes a webpage using BeautifulSoup and an LLM agent",
                "agent": "web_scrape_selector_agent",
                "required_apis": ["llm_api"],
                "templates": {
                    "task_template": "basic_prompt_url"
                },
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "url": "url_param",
                    },
                    "required": ["url"]
                },
            },
            {
                "key": "web_summarize_task",
                "task_type": "PromptAgentTask",
                "task_name": "web_summarize",
                "task_description": "Summarizes the web scrape results",
                "agent": "web_summarizer_agent",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "web_scrape": "params_web_scrape_task",
                    },
                    "required": ["web_scrape"]
                },
                "required_apis": ["llm_api"],
                "templates": {
                    "task_template": "web_summarize_task_prompt"
                }
            },
            {
                "key": "web_scrape_workflow",
                "task_type": "Workflow",
                "task_name": "web_scrape_workflow",
                "task_description": "Executes the web scrape and summarize tasks",
                "tasks": {
                    "web_scrape": "web_scrape_task",
                    "web_summarize": "web_summarize_task",
                },
                "start_task": "web_scrape",
                "tasks_end_code_routing": {
                    "web_scrape": {
                        0: ("web_summarize", False),
                        1: ("web_scrape", True),
                    },
                    "web_summarize": {
                        0: (None, False),
                        1: ("web_summarize", True),
                    },
                },
                "max_attempts": 2,
                "recursive": False,
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "url": "url_param",
                    },
                    "required": ["url"]
                },
            }
        ]
    }
)