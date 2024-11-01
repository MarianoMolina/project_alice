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
                "key": "generate_selectors_and_parse_param",
                "type": "string",
                "description": "The clean text of the web scrape task returned by the generate_selectors_and_parse node",
            },
            {
                "key": "web_scrape_param",
                "type": "string",
                "description": "The outputs of the web scrape task",
            },
            {
                "key": "web_scrape_content_param",
                "type": "string",
                "description": "The raw content of the web required if it is already retrieved. If provided, url will be ignored (it is still required).",
            },
            {
                "key": "web_summary_param",
                "type": "string",
                "description": "The summary of scraped web",
            }
        ],
        "prompts": [
            {
                "key": "web_scrape_selector_agent_prompt",
                "name": "Web Scrape Selector Agent",
                "content": get_prompt_file("web_scrape_selector_agent.prompt"),
            },
            {
                "key": "web_scrape_output_prompt",
                "name": "Web Scrape Output Template",
                "content": "{{ generate_selectors_and_parse }}",
                "is_templated": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "generate_selectors_and_parse": "generate_selectors_and_parse_param"
                    },
                    "required": ["generate_selectors_and_parse"]
                }
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
                        "web_scrape": "web_scrape_param"
                    },
                    "required": ["web_scrape"]
                }
            },
            {
                "key": "web_scrape_workflow_prompt",
                "name": "Web Scrape Workflow Output Template",
                "content": "Summary of URL: {{ url }}\n\n{{ web_summarize }}",
                "is_templated": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "url": "url_param",
                        "web_summarize": "web_summary_param"
                    },
                    "required": ["url", "web_summarize"]
                }
            }
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
                "has_tools": 0,
                "has_code_exec": 0,                
            },
            {
                "key": "web_summarizer_agent",
                "name": "web_summarizer",
                "system_message": "web_summarizer_prompt",
                "models": {
                    "chat": "GPT4o",
                },
                "max_consecutive_auto_reply": 1,
                "has_tools": 0,
                "has_code_exec": 0,                
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
                    "task_template": "basic_prompt_url",
                    "output_template": "web_scrape_output_prompt"
                },
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "url": "url_param",
                        "fetch_url_html_content": "web_scrape_content_param"
                    },
                    "required": ["url"]
                },
                "node_end_code_routing": {
                    'fetch_url': {
                        0: ('generate_selectors_and_parse', False),
                        1: ('fetch_url', True),
                    }, 
                    'generate_selectors_and_parse': {
                        0: (None, False),
                        1: ('generate_selectors_and_parse', True),
                    }
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
                        "web_scrape": "web_scrape_param",
                    },
                    "required": ["web_scrape"]
                },
                "required_apis": ["llm_api"],
                "templates": {
                    "task_template": "web_summarize_task_prompt"
                },
                "node_end_code_routing": {
                    'llm_generation':{
                        0: (None, False),
                        1: ('llm_generation', True),
                    }, 
                },
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
                "start_node": "web_scrape",
                "node_end_code_routing": {
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
                "templates": {
                    "output_template": "web_scrape_workflow_prompt"
                }
            }
        ]
    }
)