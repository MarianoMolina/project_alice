from typing import List, Dict, Any
from pydantic import Field
from workflow.db_app.initialization.modules.init_module import InitializationModule, get_prompt_file

class ResearchWorkflowModule(InitializationModule):
    """This module defines the research workflow, its tasks, agents and prompts."""
    name: str = "research_workflow"
    dependencies: List[str] = ["base", "base_tasks"]
    data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)

research_workflow_module = ResearchWorkflowModule(
    data={
        "parameters": [
            {
                "key": "param_research_brief_task",
                "type": "string",
                "description": "The research brief for the data retrieval expert",
            },
            {
                "key": "param_research_check_task",
                "type": "string",
                "description": "Optional feedback in case the research has already be ran unsuccessfully",
            },
            {
                "key": "param_data_retrieval_task",
                "type": "string",
                "description": "The research data retrieval task output",
            },
            {
                "key": "research_summary_param",
                "type": "string",
                "description": "The summary of the research data",
            }
        ],
        "prompts": [
            {
                "key": "brief_specialist_prompt",
                "name": "Brief Specialist",
                "content": get_prompt_file("brief_specialist.prompt"),
            },
            {
                "key": "data_retrieval_expert_prompt",
                "name": "Data Retrieval Expert",
                "content": get_prompt_file("data_retrieval_expert.prompt"),
            },
            {
                "key": "research_check_prompt",
                "name": "Research Check Agent",
                "content": get_prompt_file("research_check_agent.prompt"),
            },
            {
                "key": "research_summary_agent_prompt",
                "name": "Research Summary Agent",
                "content": get_prompt_file("research_summarizer.prompt"),
            },
            {
                "key": "data_retrieval_task_prompt",
                "name": "Data Retrieval Task",
                "content": get_prompt_file("data_retrieval_task.prompt"),
                "is_templated": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "Research_Brief": "param_research_brief_task",
                        "Check_Research": "param_research_check_task",
                    },
                    "required": ["Research_Brief"]
                }
            },
            {
                "key": "research_check_task_prompt",
                "name": "Research Check Task",
                "content": get_prompt_file("research_check_task.prompt"),
                "is_templated": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "Research_Brief": "param_research_brief_task",
                        "Retrieve_Data": "param_data_retrieval_task",
                    },
                    "required": ["Retrieve_Data", "Research_Brief"]
                }
            },
            {
                "key": "research_summary_task_prompt",
                "name": "Resarch Summary Task",
                "content": get_prompt_file("research_summary_task.prompt"),
                "is_templated": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter",
                        "Retrieve_Data": "param_data_retrieval_task",
                    },
                    "required": ["prompt", "Retrieve_Data"]
                }
            },
            {
                "key": "research_output_prompt",
                "name": "Research Output Template",
                "content": "Research Brief: {{ Research_Brief }}\n\nSummary: {{ Summarize_Research }}",
                "is_templated": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "Research_Brief": "param_research_brief_task",
                        "Summarize_Research": "research_summary_param"
                    },
                    "required": ["Research_Brief", "Summarize_Research"]
                }
            }
        ],
        "agents": [
            {
                "key": "brief_specialist",
                "name": "Brief Specialist",
                "system_message": "brief_specialist_prompt",
                "models": {
                    "chat": "GPT4o",
                },
                "max_consecutive_auto_reply": 1,
                "has_tools": 0,
                "has_code_exec": 0,                
            },
            {
                "key": "data_retrieval_expert",
                "name": "Data Retrieval Expert",
                "system_message": "data_retrieval_expert_prompt",
                "models": {
                    "chat": "gpt-4o-mini", # Has to be mini bc some models can't use tools
                },
                "max_consecutive_auto_reply": 1,
                "has_tools": 1,
                "has_code_exec": 0,                
            },
            {
                "key": "research_check",
                "name": "Research Reviewer",
                "system_message": "research_check_prompt",
                "models": {
                    "chat": "GPT4o",
                },
                "max_consecutive_auto_reply": 1,
                "has_tools": 0,
                "has_code_exec": 0,                
            },
            {
                "key": "research_summarizer_agent",
                "name": "Research Summarizer Agent",
                "system_message": "research_summary_agent_prompt",
                "models": {
                    "chat": "GPT4o",
                },
                "max_consecutive_auto_reply": 1,
                "has_tools": 0,
                "has_code_exec": 0
            },
        ],
        "tasks": [
            {
                "key": "research_brief_task",
                "task_type": "PromptAgentTask",
                "task_name": "Research_Brief",
                "task_description": "Takes a simple prompt and generates a research brief",
                "agent": "brief_specialist",
                "required_apis": ["llm_api"],
                "templates": {
                    "task_template": "basic_prompt"
                },
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter",
                    },
                    "required": ["prompt"]
                },
                "node_end_code_routing": {
                    'llm_generation':{
                        0: (None, False),
                        1: ('llm_generation', True),
                    }, 
                },
                "max_attempts": 2,
                "recursive": True,
            },
            {
                "key": "data_retrieval_task",
                "task_type": "PromptAgentTask",
                "task_name": "Retrieve_Data",
                "task_description": "Generates tool calls for data retrieval based on the research brief provided",
                "agent": "data_retrieval_expert",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "Research_Brief": "param_research_brief_task",
                        "Research_Check_Task": "param_research_check_task",
                    },
                    "required": ["Research_Brief"]
                },
                "tasks": {
                    "Exa_Search": "exa_search",
                    "Wikipedia_Search": "wikipedia_search",
                    "Google_Search": "google_search",
                    "Arxiv_Search": "arxiv_search",
                    "Knowledge_Graph_Search": "knowledge_graph_search_task",
                    "Wolfram_Alpha_Query": "wolfram_alpha_query_task",
                    "Reddit_Search": "reddit_search",
                },
                "required_apis": ["llm_api"],
                "templates": {
                    "task_template": "data_retrieval_task_prompt"
                },
                "node_end_code_routing": {
                    'llm_generation':{
                        0: ('tool_call_execution', False),
                        1: ('llm_generation', True),
                    }, 
                    'tool_call_execution':{
                        0: (None, False),
                        1: ('tool_call_execution', True),
                    }, 
                },
                "max_attempts": 2,
                "recursive": True,
            },
            {
                "key": "research_check_task",
                "task_type": "CheckTask",
                "task_name": "Check_Research",
                "task_description": "Checks the data retrieval results and generates a conclusion",
                "agent": "research_check",
                "exit_code_response_map": {"APPROVED": 0, "REJECTED": 2},
                "exit_codes": {0: "Data retrieval approved", 1: "Response generation failed", 2: "Data retrieval rejected"},
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "Research_Brief": "param_research_brief_task",
                        "Retrieve_Data": "param_data_retrieval_task",
                    },
                    "required": ["Retrieve_Data", "Research_Brief"]
                },
                "templates": {
                    "task_template": "research_check_task_prompt"
                },
                "max_attempts": 2,
                "recursive": True,
            },
            {
                "key": "research_summary_task",
                "task_type": "PromptAgentTask",
                "task_name": "Summarize_Research",
                "task_description": "Generates a summary of the data retrieved during the research process",
                "agent": "research_summarizer_agent",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter",
                        "Retrieve_Data": "param_data_retrieval_task",
                    },
                    "required": ["prompt", "Retrieve_Data"]
                },
                "templates": {
                    "task_template": "research_summary_task_prompt"
                },
                "node_end_code_routing": {
                    'llm_generation':{
                        0: (None, False),
                        1: ('llm_generation', True),
                    }, 
                },
            },
            {
                "key": "research_workflow",
                "task_type": "Workflow",
                "task_name": "Research_Workflow",
                "task_description": "Executes the research workflow based on a string prompt",
                "tasks": {
                    "Research_Brief": "research_brief_task",
                    "Retrieve_Data": "data_retrieval_task",
                    "Check_Research": "research_check_task",
                    "Summarize_Research": "research_summary_task",
                },
                "start_node": "Research_Brief",
                "node_end_code_routing": {
                    "Research_Brief": {
                        0: ("Retrieve_Data", False),
                        1: ("Research_Brief", True),
                    },
                    "Retrieve_Data": {
                        0: ("Check_Research", False),
                        1: ("Retrieve_Data", True),
                    },
                    "Check_Research": {
                        0: ("Summarize_Research", False),
                        1: ("Check_Research", True),
                        2: ("Retrieve_Data", False),
                    },
                    "Summarize_Research": {
                        0: (None, False),
                        1: ("Summarize_Research", True),
                    },
                },
                "max_attempts": 2,
                "recursive": True,
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter",
                    },
                    "required": ["prompt"]
                },
                "templates": {
                    "output_template": "research_output_prompt"
                }
            }
        ]
    }
)