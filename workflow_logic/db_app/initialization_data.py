import os, pkgutil
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Literal
from dotenv import load_dotenv
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API = os.getenv("ANTHROPIC_API")
EXA_API_KEY = os.getenv("EXA_API_KEY")
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_CSE_ID = os.getenv("GOOGLE_CSE_ID")
LOCAL_LLM_API_URL = os.getenv("LOCAL_LLM_API_URL")

def get_prompt_file(file_name):
    data = pkgutil.get_data('workflow_logic.db_app.prompts', file_name)
    if data:
        return data.decode('utf-8')
    else:
        raise FileNotFoundError(f"File {file_name} not found in the prompts directory")

ComponentType = Literal["users", "models", "prompts", "agents", "tasks", "parameters", "apis", "chats"]

class DBStructure(BaseModel):
    users: List[Dict[str, Any]] = Field(default_factory=list, description="List of users to create")
    models: List[Dict[str, Any]] = Field(default_factory=list, description="List of models to create")
    prompts: List[Dict[str, Any]] = Field(default_factory=list, description="List of prompts to create")
    agents: List[Dict[str, Any]] = Field(default_factory=list, description="List of agents to create")
    tasks: List[Dict[str, Any]] = Field(default_factory=list, description="List of tasks to create")
    parameters: List[Dict[str, Any]] = Field(default_factory=list, description="List of parameters to create")
    apis: List[Dict[str, Any]] = Field(default_factory=list, description="List of apis to create")
    chats: List[Dict[str, Any]] = Field(default_factory=list, description="List of chats to create")

    def add_component(self, component_type: ComponentType, component: Dict[str, Any]):
        """
        Add a new component to the DBStructure.

        :param component_type: The type of component to add (e.g., "users", "models", etc.)
        :param component: The component data to add
        """
        if component_type not in self.model_fields:
            raise ValueError(f"Invalid component type: {component_type}")

        getattr(self, component_type).append(component)

    def get_components_order(self) -> List[ComponentType]:
        """
        Get the order of components as defined in the class.

        :return: A list of component types in the order they are defined
        """
        return list(self.model_fields.keys())

    def add_components_from_dict(self, components_dict: Dict[str, List[Dict[str, Any]]]):
        """
        Add multiple components from a dictionary, maintaining the correct order.

        :param components_dict: A dictionary containing components to add
        """
        for component_type in self.get_components_order():
            if component_type in components_dict:
                for component in components_dict[component_type]:
                    self.add_component(component_type, component)

DB_STRUCTURE = DBStructure(
    users=[
    ],
    models=[
        {
            "key": "GPT4o",
            "short_name": "GPT4o",
            "model_format": "OpenChat",
            "model_name": "gpt-4o-2024-05-13",
            "ctx_size": 128000,
            "model_type": "chat",
            "deployment": "remote",
            "temperature": 0.7,
            "api_name": "openai",
            # "api_key": OPENAI_API_KEY,
            # "base_url": "https://api.openai.com/v1"
        },
        {
            "key": "Llama3_8B_Instruct",
            "short_name": "Llama3_8B_Instruct",
            "model_name": "nisten/llama3-8b-instruct-32k-gguf", # nisten/llama3-8b-instruct-32k-gguf/llama3ins-8b-32k-q6.gguf ?
            "model_format": "Llama3",
            "ctx_size": 32768,
            "model_type": "instruct",
            "deployment": "local",
            "api_name": "custom",
        },
        {
            "key": "Claude3.5",
            "short_name": "Claude3.5",
            "model_format": "OpenChat",
            "model_name": "claude-3-5-sonnet-20240620",
            "ctx_size": 200000,
            "model_type": "chat",
            "deployment": "remote",
            "temperature": 0.7,
            "api_name": "anthropic",
            # "api_key": ANTHROPIC_API,
            # "base_url": "https://api.anthropic.com",
            # "model_client_cls": "AnthropicClient"
        }
    ],
    parameters=[
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
        {
            "key": "outputs_plan_workflow",
            "type": "string",
            "description": "The task plan that describes the code requirements for the task",
        },
        {
            "key": "outputs_generate_code",
            "type": "string",
            "description": "The code that was generated",
        },
        {
            "key": "outputs_execute_code",
            "type": "string",
            "description": "The code execution output that was generated",
        },
        {
            "key": "outputs_generate_unit_tests",
            "type": "string",
            "description": "The unit test code that was generated, passed in case of a recursive call",
        },
        {
            "key": "outputs_execute_unit_tests",
            "type": "string",
            "description": "The output of the unit test execution, passed in case of a recursive call",
        }
    ],
    prompts=[
        {
            "key": "default_system_message",
            "name": "Default System Message",
            "content": """You are Alice, a helpful AI assistant. 
            You work with your user to help them not only with their tasks, but also to learn, grow and achieve their goals. 
            You are kind and humble, but direct, honest and clear. You are here to help, and you are always learning and improving.""",
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
        {
            "key": "planner_agent",
            "name": "Planner Agent",
            "content": get_prompt_file("coding_planner_agent.prompt"),
        },
        {
            "key": "coding_agent",
            "name": "Coding Agent",
            "content": get_prompt_file("coding_agent.prompt"),
        },
        {
            "key": "unit_tester_agent",
            "name": "Unit Tester Agent",
            "content": get_prompt_file("unit_tester_agent.prompt"),
        },
        {
            "key": "code_generation_task",
            "name": "Code Generation Task",
            "content": get_prompt_file("code_generation_task.prompt"),
            "is_templated": True,
            "parameters": {
                "type": "object",
                "properties": {
                    "outputs_plan_workflow": "outputs_plan_workflow",
                    "outputs_generate_code": "outputs_generate_code",
                    "outputs_execute_code": "outputs_execute_code",
                    "outputs_generate_unit_tests": "outputs_generate_unit_tests",
                    "outputs_execute_unit_tests": "outputs_execute_unit_tests",
                },
                "required": ["outputs_plan_workflow"]
            }
        },
        {
            "key": "code_execution_task",
            "name": "Code Execution Task",
            "content": "This is the code: {{ outputs_generate_code }}",
            "is_templated": True,
            "parameters": {
                "type": "object",
                "properties": {
                    "outputs_generate_code": "outputs_generate_code",
                },
                "required": ["outputs_generate_code"]
            }
        },
        {
            "key": "code_execution_task_unit_tests",
            "name": "Code Execution Task Unit Tests",
            "content": "This is the code: {{ outputs_generate_unit_tests }}",
            "is_templated": True,
            "parameters": {
                "type": "object",
                "properties": {
                    "outputs_generate_unit_tests": "outputs_generate_unit_tests",
                },
                "required": ["outputs_generate_unit_tests"]
            }
        },
        {
            "key": "unit_test_check_agent",
            "name": "Unit Test Check Agent",
            "content": get_prompt_file("unit_test_execution_checker_agent.prompt"),
        },
        {
            "key": "unit_test_check_prompt",
            "name": "Unit Test Check Prompt",
            "content": get_prompt_file("unit_test_execution_check_task.prompt"),
            "is_templated": True,
            "parameters": {
                "type": "object",
                "properties": {
                    "outputs_generate_unit_tests": "outputs_generate_unit_tests",
                    "outputs_generate_code": "outputs_generate_code",
                    "ouputs_execute_unit_tests": "outputs_execute_unit_tests",
                },
                "required": ["outputs_generate_unit_tests", "outputs_generate_code", "outputs_execute_unit_tests"]
            }
        }
    ],
    agents=[
        {
            "key": "default_alice",
            "name": "Default Assistant",
            "system_message": "default_system_message",  # Reference to prompt key
            "autogen_class": "ConversableAgent",
            "model_id": "GPT4o",  # Reference to model key
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
            "model_id": "GPT4o", # Reference
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
            "default_auto_reply": "",
            "model_id": None,
        },
        {
            "key": "coding_planner_agent",
            "name": "coding_planner_agent",
            "system_message": "planner_agent", # Reference
            "autogen_class": "ConversableAgent",
            "model_id": "GPT4o", # Reference
            "code_execution_config": False,
            "max_consecutive_auto_reply": 10,
            "human_input_mode": "NEVER",
            "default_auto_reply": ""
        },
        {
            "key": "coding_agent",
            "name": "coding_agent",
            "system_message": "coding_agent", # Reference
            "autogen_class": "ConversableAgent",
            "model_id": "GPT4o", # Reference
            "code_execution_config": False,
            "max_consecutive_auto_reply": 10,
            "human_input_mode": "NEVER",
            "default_auto_reply": ""
        },
        {
            "key": "unit_tester_agent",
            "name": "unit_tester_agent",
            "system_message": "unit_tester_agent", # Reference
            "autogen_class": "ConversableAgent",
            "model_id": "GPT4o", # Reference
            "code_execution_config": False,
            "max_consecutive_auto_reply": 10,
            "human_input_mode": "NEVER",
            "default_auto_reply": ""
        },
        {
            "key": "unit_test_execution_checker_agent",
            "name": "unit_test_execution_checker_agent",
            "system_message": "unit_test_check_agent", # Reference
            "autogen_class": "ConversableAgent",
            "model_id": "GPT4o", # Reference
            "code_execution_config": False,
            "max_consecutive_auto_reply": 10,
            "human_input_mode": "NEVER",
            "default_auto_reply": ""
        }
    ],
    tasks=[
        {
            "key": "reddit_search",
            "task_type": "RedditSearchTask",
            "task_name": "reddit_search",
            "task_description": "Searches Reddit for information",
            "input_variables": {
                "type": "object",
                "properties": {
                    "prompt": "prompt_parameter", # Parameter references
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
            "task_type": "ExaSearchTask",
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
            "task_type": "WikipediaSearchTask",
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
            "task_type": "GoogleSearchTask",
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
            "task_type": "ArxivSearchTask",
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
            "task_type": "AgentWithFunctions", 
            "task_name": "search_hub",
            "task_description": "Searches multiple sources and returns the results",
            "agent": "research_agent", # Reference
            "template": {
                "task_template": "code_generation_task"
            },
            "execution_agent": "executor_agent", # Reference
            "tasks":{
                "reddit_search": "reddit_search", # Reference
                "exa_search": "exa_search", # Reference
                "wikipedia_search": "wikipedia_search", # Reference
                "google_search": "google_search", # Reference
                "arxiv_search": "arxiv_search", # Reference
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
        {
            "key": "plan_workflow",
            "task_type": "PromptAgentTask",
            "task_name": "plan_workflow",
            "task_description": "Takes a simple prompt and develops it into a full task prompt",
            "agent": "coding_planner_agent", # Reference
            "required_apis": ["llm_api"],
            "template": {
                "task_template": "basic_prompt"
            },
            "input_variables": {
                "type": "object",
                "properties": {
                    "prompt": "prompt_parameter",
                },
                "required": ["prompt"]
            },
        },
        {
            "key": "generate_code",
            "task_type": "CodeGenerationLLMTask",
            "task_name": "generate_code",
            "task_description": "Generates code based on the provided plan_workflow output",
            "agent": "coding_agent", # Reference
            "input_variables": {
                "type": "object",
                "properties": {
                    "outputs_plan_workflow": "outputs_plan_workflow",
                    "outputs_generate_code": "outputs_generate_code",
                    "outputs_execute_code": "outputs_execute_code",
                    "outputs_generate_unit_tests": "outputs_generate_unit_tests",
                },
                "required": ["outputs_plan_workflow"]
            },
            "required_apis": ["llm_api"],
            "templates": {
                "task_template": "code_generation_task"
            }
        },
        {
            "key": "execute_code",
            "task_type": "CodeExecutionLLMTask",
            "task_name": "execute_code",
            "task_description": "Executes the code available in a list of message dicts",
            "agent": "executor_agent", # Reference
            "execution_agent": "executor_agent", # Reference
            "input_variables": {
                "type": "object",
                "properties": {
                    "outputs_generate_code": "outputs_generate_code",
                },
                "required": ["outputs_generate_code"]
            },
            "templates": {
                "task_template": "code_execution_task"
            }
        },
        {
            "key": "generate_unit_tests",
            "task_type": "CodeGenerationLLMTask",
            "task_name": "generate_unit_tests",
            "task_description": "Generates unit tests for the prompt provided. Ensure the code and task are available in the prompt",
            "agent": "unit_tester_agent", # Reference
            "input_variables": {
                "type": "object",
                "properties": {
                    "outputs_plan_workflow": "outputs_plan_workflow",
                    "outputs_generate_code": "outputs_generate_code",
                    "outputs_execute_code": "outputs_execute_code",
                    "outputs_generate_unit_tests": "outputs_generate_unit_tests",
                    "outputs_execute_unit_tests": "outputs_execute_unit_tests",
                },
                "required": ["outputs_plan_workflow", "outputs_generate_code", "outputs_execute_code"]
            },
            "templates": {
                "task_template": "code_generation_task"
            }
        },
        {
            "key": "execute_unit_tests",
            "task_type": "CodeExecutionLLMTask",
            "task_name": "execute_unit_tests",
            "task_description": "Executes the code available in a list of message dicts",
            "agent": "executor_agent", # Reference
            "execution_agent": "executor_agent", # Reference
            "input_variables": {
                "type": "object",
                "properties": {
                    "outputs_generate_unit_tests": "outputs_generate_unit_tests",
                },
                "required": ["outputs_generate_unit_tests"]
            },
            "templates": {
                "task_template": "code_execution_task_unit_tests"
            }
        },
        {
            "key": "check_unit_test_results",
            "task_type": "CheckTask",
            "task_name": "check_unit_test_results",
            "task_description": "Checks the results of the unit tests",
            "agent": "unit_tester_agent", # Reference
            "input_variables": {
                "type": "object",
                "properties": {
                    "outputs_generate_unit_tests": "outputs_generate_unit_tests",
                    "outputs_generate_code": "outputs_generate_code",
                    "outputs_execute_unit_tests": "outputs_execute_unit_tests",
                },
                "required": ["outputs_generate_unit_tests", "outputs_generate_code", "outputs_execute_unit_tests"]
            },
            "exit_code_response_map": {"FAILED": 2, "TEST PASSED": 0, "TEST CODE ERROR": 3},
            "exit_codes": {0: "Test Passed", 1: "Response generation failed", 2: "Test Failed"},
            "templates": {
                "task_template": "unit_test_check_prompt"
            }
        },
        {
            "key": "coding_workflow",
            "task_type": "Workflow",
            "task_name": "coding_workflow",
            "task_description": "Executes a coding workflow based on the provided prompt",
            "tasks": {
                "plan_workflow": "plan_workflow", # Reference
                "generate_code": "generate_code", # Reference
                "execute_code": "execute_code", # Reference
                "generate_unit_tests": "generate_unit_tests", # Reference
                "execute_unit_tests": "execute_unit_tests", # Reference
                "check_unit_test_results": "check_unit_test_results" # Reference
            },
            "start_task": "plan_workflow",
            "tasks_end_code_routing": {
                "plan_workflow": {
                    0: ("generate_code", False),
                    1: ("plan_workflow", True),
                },
                "generate_code": {
                    0: ("execute_code", False),
                    1: ("generate_code", True),
                    2: ("generate_code", True)
                },
                "execute_code": {
                    0: ("generate_unit_tests", False),
                    1: ("generate_code", True),
                    2: ("generate_code", True),
                    3: ("execute_code", True)
                },
                "generate_unit_tests": {
                    0: ("execute_unit_tests", False),
                    1: ("generate_unit_tests", True),
                    2: ("generate_unit_tests", True)
                },
                "execute_unit_tests": {
                    0: ("check_unit_test_results", False),
                    1: ("generate_unit_tests", True),
                    2: ("generate_unit_tests", True),
                    3: ("execute_unit_tests", True)
                },
                "check_unit_test_results": {
                    0: (None, False),
                    1: ("check_unit_test_results", True),
                    2: ("generate_code", True),
                    3: ("generate_unit_tests", True)
                }
            },
            "max_attempts": 5,
            "recursive": False,
            "input_variables": {
                "type": "object",
                "properties": {
                    "prompt": "prompt_parameter",
                },
                "required": ["prompt"]
            }
        }
    ],
    apis=[
        {
            "key": "reddit_search",
            "api_type": "reddit_search",
            "api_name": "reddit_search",
            "name": "Reddit Search",
            "api_config": {
                "client_id": REDDIT_CLIENT_ID,
                "client_secret": REDDIT_CLIENT_SECRET,
            },
            "is_active": True,
            "health_status": "healthy",
        },
        {
            "key": "exa_search",
            "api_type": "exa_search",
            "api_name": "exa_search",
            "name": "Exa Search",
            "api_config": {
                "api_key": EXA_API_KEY,
            },
            "is_active": True,
            "health_status": "healthy",
        },
        {
            "key": "google_search",
            "api_type": "google_search",
            "api_name": "google_search",
            "name": "Google Search",
            "api_config": {
                "api_key": GOOGLE_API_KEY,
                "cse_id": GOOGLE_CSE_ID,
            },
            "is_active": True,
            "health_status": "healthy",
        },
        {
            "key": "wikipedia_search",
            "api_type": "wikipedia_search",
            "api_name": "wikipedia_search",
            "name": "Wikipedia Search",
            "api_config": {},
            "is_active": True,
            "health_status": "healthy",
        },
        {
            "key": "arxiv_search",
            "api_type": "arxiv_search",
            "api_name": "arxiv_search",
            "name": "Arxiv Search",
            "api_config": {},
            "is_active": True,
            "health_status": "healthy",
        },
        {
            "key": "openai",
            "api_type": "llm_api",
            "api_name": "openai",
            "name": "OpenAI API",
            "api_config": {
                "api_key": OPENAI_API_KEY,
                "base_url": "https://api.openai.com/v1"
            },
            "is_active": True,
            "health_status": "healthy",
            "default_model": "GPT4o", # Reference
        },
        {
            "key": "anthropic",
            "api_type": "llm_api",
            "api_name": "anthropic",
            "name": "Anthropic API",
            "api_config": {
                "api_key": ANTHROPIC_API,
                "base_url": "https://api.anthropic.com"
            },
            "is_active": True,
            "health_status": "healthy",
            "default_model": "Claude3.5", # Reference
            "model_client_cls": "AnthropicClient"
        },
        {
            "key": "local_lm_studio",
            "api_type": "llm_api",
            "api_name": "custom",
            "name": "LM Studio API",
            "api_config": {
                "api_key": "local_lm_studio",
                "base_url": LOCAL_LLM_API_URL
            },
            "is_active": True,
            "health_status": "healthy",
            "default_model": "Llama3_8B_Instruct", # Reference
        }
    ],
    chats=[
        {
            "key": "default_chat",
            "name": "New Chat",
            "messages": [],
            "alice_agent": "default_alice",  # Reference to agent key
            "executor": "executor_agent", # Reference
            "model_id": "GPT4o", # Reference
            "functions": [], # Reference
        },
        
        {
            "key": "default_chat_2",
            "name": "New Chat 2",
            "messages": [],
            "alice_agent": "default_alice",  # Reference to agent key
            "executor": "executor_agent", # Reference
            "model_id": "GPT4o", # Reference
            "functions": ["google_search"], # Reference
        }
    ]
)