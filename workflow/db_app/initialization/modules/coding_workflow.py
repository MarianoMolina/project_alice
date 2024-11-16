from typing import List, Dict, Any
from pydantic import Field
from workflow.db_app.initialization.modules.init_module import InitializationModule, get_prompt_file

class CodingWorkflowModule(InitializationModule):
    """This module defines the coding workflow, its subtasks, agents and prompts"""
    name: str = "coding_workflow"
    dependencies: List[str] = ["base"]
    data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)

coding_workflow_module = CodingWorkflowModule(
    data={
        "parameters": [
            {
                "key": "param_plan_workflow",
                "type": "string",
                "description": "The task plan that describes the code requirements for the task",
            },
            {
                "key": "param_generate_code",
                "type": "string",
                "description": "The code that was generated",
            },
            {
                "key": "param_generate_unit_tests",
                "type": "string",
                "description": "The unit test code that was generated, passed in case of a recursive call",
            },
        ],
        "user_checkpoints": [
            {   
                "key": "generate_unit_tests_checkpoint",
                "user_prompt": "Please approve or reject the code generated before the unit tests are generated. Provide feedback, if any, for the unit test agent to consider.",
                "task_next_obj": {0: "generate_unit_tests", 1: "generate_code"},
                "options_obj": {0: "Approve", 1: "Reject"},
                "request_feedback": True
            }
        ],
        "prompts": [
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
                "key": "code_generation_task_prompt",
                "name": "Code Generation Task",
                "content": get_prompt_file("code_generation_task.prompt"),
                "is_templated": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "plan_workflow": "param_plan_workflow",
                        "generate_code": "param_generate_code",
                        "generate_unit_tests": "param_generate_unit_tests",
                    },
                    "required": ["plan_workflow"]
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
                        "plan_workflow": "param_plan_workflow",
                        "generate_code": "param_generate_code",
                        "generate_unit_tests": "param_generate_unit_tests",
                    },
                    "required": ["generate_unit_tests", "generate_code", "plan_workflow"]
                }
            }, 
            {
                "key": "coding_workflow_output_prompt",
                "name": "Coding Workflow Output Template",
                "content": "Plan: {{ plan_workflow }}\n\nCode: {{ generate_code }}\n\nUnit Tests: {{ generate_unit_tests }}\n\n",
                "is_templated": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "plan_workflow": "param_plan_workflow",
                        "generate_code": "param_generate_code",
                        "generate_unit_tests": "param_generate_unit_tests",
                    },
                    "required": ["plan_workflow"]
                }
            }
        ],
        "agents": [
            {
                "key": "coding_planner_agent",
                "name": "coding_planner_agent",
                "system_message": "planner_agent",
                "models": {
                    "chat": "GPT4o",
                },
                "max_consecutive_auto_reply": 1,
                "has_tools": 0,
                "has_code_exec": 0,                
            },
            {
                "key": "coding_agent",
                "name": "coding_agent",
                "system_message": "coding_agent",
                "models": {
                    "chat": "GPT4o",
                },
                "max_consecutive_auto_reply": 2,
                "has_tools": 0,
                "has_code_exec": 1,                
            },
            {
                "key": "unit_tester_agent",
                "name": "unit_tester_agent",
                "system_message": "unit_tester_agent",
                "models": {
                    "chat": "GPT4o",
                },
                "max_consecutive_auto_reply": 2,
                "has_tools": 0,
                "has_code_exec": 1,                
            },
            {
                "key": "unit_test_check_agent",
                "name": "unit_test_check_agent",
                "system_message": "unit_test_check_agent",
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
                "key": "plan_workflow",
                "task_type": "PromptAgentTask",
                "task_name": "plan_workflow",
                "task_description": "Takes a simple prompt and develops it into a full task prompt",
                "agent": "coding_planner_agent",
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
                "exit_codes": {0: "Success", 1: "Generation failed."},
                "node_end_code_routing": {
                    'llm_generation':{
                        0: (None, False),
                        1: ('llm_generation', True),
                    }, 
                },
            },
            {
                "key": "generate_code",
                "task_type": "CodeGenerationLLMTask",
                "task_name": "generate_code",
                "task_description": "Generates code based on the provided plan_workflow output",
                "agent": "coding_agent",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "plan_workflow": "param_plan_workflow",
                        "generate_code": "param_generate_code",
                        "generate_unit_tests": "param_generate_unit_tests",
                    },
                    "required": ["plan_workflow"]
                },
                "required_apis": ["llm_api"],
                "templates": {
                    "task_template": "code_generation_task_prompt"
                },
            },
            {
                "key": "generate_unit_tests",
                "task_type": "CodeGenerationLLMTask",
                "task_name": "generate_unit_tests",
                "task_description": "Generates unit tests for the prompt provided. Ensure the code and task are available in the prompt",
                "agent": "unit_tester_agent",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "plan_workflow": "param_plan_workflow",
                        "generate_code": "param_generate_code",
                        "generate_unit_tests": "param_generate_unit_tests",
                    },
                    "required": ["generate_code"]
                },
                "templates": {
                    "task_template": "code_generation_task_prompt"
                },
                "exit_codes": {0: "Success", 1: "Generation failed.", 2: "No code blocks in response"}
            },
            {
                "key": "check_unit_test_results",
                "task_type": "CheckTask",
                "task_name": "check_unit_test_results",
                "task_description": "Checks the results of the unit tests",
                "agent": "unit_test_check_agent",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "plan_workflow": "param_plan_workflow",
                        "generate_code": "param_generate_code",
                        "generate_unit_tests": "param_generate_unit_tests",
                    },
                    "required": ["generate_unit_tests", "generate_code"]
                },
                "exit_code_response_map": {"TEST FAILED": 2, "ALL TESTS PASSED": 0, "TEST CODE ERROR": 3},
                "exit_codes": {0: "Test Passed", 1: "Response generation failed", 2: "Test Failed", 3: "Test Code Error"},
                "templates": {
                    "task_template": "unit_test_check_prompt"
                }
            },
            {
                "key": "coding_workflow",
                "task_type": "Workflow",
                "task_name": "coding_workflow",
                "task_description": "Workflow for creating code. Provide a prompt detailing the requirements and language for the code.",
                "tasks": {
                    "plan_workflow": "plan_workflow",
                    "generate_code": "generate_code",
                    "generate_unit_tests": "generate_unit_tests",
                    "check_unit_test_results": "check_unit_test_results"
                },
                "start_node": "plan_workflow",
                "node_end_code_routing": {
                    "plan_workflow": {
                        0: ("generate_code", False),
                        1: ("plan_workflow", True),
                    },
                    "generate_code": {
                        0: ("generate_unit_tests", False),
                        1: ("generate_code", True),
                        2: ("generate_unit_tests", True),
                        3: (None, True),
                    },
                    "generate_unit_tests": {
                        0: ("check_unit_test_results", False),
                        1: ("generate_unit_tests", True),
                        2: ("check_unit_test_results", True),
                        3: (None, True)
                    },
                    "check_unit_test_results": {
                        0: (None, False),
                        1: ("check_unit_test_results", True),
                        2: ("generate_code", True),
                        3: ("generate_unit_tests", True)
                    }
                },
                "max_attempts": 2,
                "recursive": False,
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter",
                    },
                    "required": ["prompt"]
                },
                "templates": {
                    "output_template": "coding_workflow_output_prompt"
                }
            },
            {
                "key": "coding_workflow_with_checkpoint",
                "task_type": "Workflow",
                "task_name": "coding_workflow_with_checkpoint",
                "task_description": "Workflow for creating code. Provide a prompt detailing the requirements and language for the code.",
                "tasks": {
                    "plan_workflow": "plan_workflow",
                    "generate_code": "generate_code",
                    "generate_unit_tests": "generate_unit_tests",
                    "check_unit_test_results": "check_unit_test_results"
                },
                "start_node": "plan_workflow",
                "node_end_code_routing": {
                    "plan_workflow": {
                        0: ("generate_code", False),
                        1: ("plan_workflow", True),
                    },
                    "generate_code": {
                        0: ("generate_unit_tests", False),
                        1: ("generate_code", True),
                        2: ("generate_unit_tests", True),
                        3: (None, True),
                    },
                    "generate_unit_tests": {
                        0: ("check_unit_test_results", False),
                        1: ("generate_unit_tests", True),
                        2: ("check_unit_test_results", True),
                        3: (None, True)
                    },
                    "check_unit_test_results": {
                        0: (None, False),
                        1: ("check_unit_test_results", True),
                        2: ("generate_code", True),
                        3: ("generate_unit_tests", True)
                    }
                },
                "max_attempts": 2,
                "recursive": False,
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter",
                    },
                    "required": ["prompt"]
                },
                "user_checkpoints": {
                    "generate_unit_tests": "generate_unit_tests_checkpoint"
                },
                "templates": {
                    "output_template": "coding_workflow_output_prompt"
                }
            }
        ]
    }
)