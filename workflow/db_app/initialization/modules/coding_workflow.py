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
                    },
                    "required": ["outputs_plan_workflow"]
                }
            },
            {
                "key": "code_execution_task",
                "name": "Code Execution Task",
                "content": "This is the code:\n\n{{ outputs_generate_code }}",
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
                "key": "test_execution_task",
                "name": "Test Code Execution Task",
                "content": get_prompt_file('unit_test_execution_task.prompt'),
                "is_templated": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "outputs_generate_code": "outputs_generate_code",
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
                        "outputs_plan_workflow": "outputs_plan_workflow",
                        "outputs_generate_code": "outputs_generate_code",
                        "outputs_execute_code": "outputs_execute_code",
                        "outputs_generate_unit_tests": "outputs_generate_unit_tests",
                        "outputs_execute_unit_tests": "outputs_execute_unit_tests",
                    },
                    "required": ["outputs_generate_unit_tests", "outputs_generate_code", "outputs_execute_unit_tests", "outputs_plan_workflow", "outputs_execute_code"]
                }
            }, 
            {
                "key": "execution_agent_prompt",
                "name": "Execution Agent Prompt",
                "content": "This agent executes the code",
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
                "has_functions": False,
                "has_code_exec": False,                
            },
            {
                "key": "coding_agent",
                "name": "coding_agent",
                "system_message": "coding_agent",
                "models": {
                    "chat": "GPT4o",
                },
                "max_consecutive_auto_reply": 1,
                "has_functions": False,
                "has_code_exec": False,                
            },
            {
                "key": "unit_tester_agent",
                "name": "unit_tester_agent",
                "system_message": "unit_tester_agent",
                "models": {
                    "chat": "GPT4o",
                },
                "max_consecutive_auto_reply": 1,
                "has_functions": False,
                "has_code_exec": False,                
            },
            {
                "key": "unit_test_check_agent",
                "name": "unit_test_check_agent",
                "system_message": "unit_test_check_agent",
                "models": {
                    "chat": "GPT4o",
                },
                "max_consecutive_auto_reply": 1,
                "has_functions": False,
                "has_code_exec": False,
            },
            {
                "key": "execution_agent",
                "name": "execution_agent",
                "system_message": "execution_agent_prompt",
                "max_consecutive_auto_reply": 1,
                "has_functions": False,
                "has_code_exec": True,
            }
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
                "exit_codes": {0: "Success", 1: "Generation failed."}
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
                },
                "exit_codes": {0: "Success", 1: "Generation failed.", 2: "No code blocks in response"}
            },
            {
                "key": "execute_code",
                "task_type": "CodeExecutionLLMTask",
                "task_name": "execute_code",
                "task_description": "Executes the code available in a list of message dicts",
                "agent": "execution_agent",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "outputs_generate_code": "outputs_generate_code",
                    },
                    "required": ["outputs_generate_code"]
                },
                "templates": {
                    "task_template": "code_execution_task"
                },
                "exit_codes": {0: "Success", 1: "Execution failed."}
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
                        "outputs_plan_workflow": "outputs_plan_workflow",
                        "outputs_generate_code": "outputs_generate_code",
                        "outputs_execute_code": "outputs_execute_code",
                        "outputs_generate_unit_tests": "outputs_generate_unit_tests",
                        "outputs_execute_unit_tests": "outputs_execute_unit_tests",
                    },
                    "required": ["outputs_generate_code", "outputs_execute_code"]
                },
                "templates": {
                    "task_template": "code_generation_task"
                },
                "exit_codes": {0: "Success", 1: "Generation failed.", 2: "No code blocks in response"}
            },
            {
                "key": "execute_unit_tests",
                "task_type": "CodeExecutionLLMTask",
                "task_name": "execute_unit_tests",
                "task_description": "Executes the code available in a list of message dicts",
                "agent": "execution_agent",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "outputs_generaate_code": "outputs_generate_code",
                        "outputs_generate_unit_tests": "outputs_generate_unit_tests",
                    },
                    "required": ["outputs_generate_unit_tests"]
                },
                "templates": {
                    "task_template": "test_execution_task"
                },
                "exit_codes": {0: "Success", 1: "Execution failed."}
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
                        "outputs_plan_workflow": "outputs_plan_workflow",
                        "outputs_generate_code": "outputs_generate_code",
                        "outputs_execute_code": "outputs_execute_code",
                        "outputs_generate_unit_tests": "outputs_generate_unit_tests",
                        "outputs_execute_unit_tests": "outputs_execute_unit_tests",
                    },
                    "required": ["outputs_generate_unit_tests", "outputs_generate_code", "outputs_execute_unit_tests"]
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
                "task_description": "Executes a coding workflow based on the provided prompt",
                "tasks": {
                    "plan_workflow": "plan_workflow",
                    "generate_code": "generate_code",
                    "execute_code": "execute_code",
                    "generate_unit_tests": "generate_unit_tests",
                    "execute_unit_tests": "execute_unit_tests",
                    "check_unit_test_results": "check_unit_test_results"
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
                    },
                    "generate_unit_tests": {
                        0: ("execute_unit_tests", False),
                        1: ("generate_unit_tests", True),
                        2: ("generate_unit_tests", True)
                    },
                    "execute_unit_tests": {
                        0: ("check_unit_test_results", False),
                        1: ("generate_unit_tests", True),
                    },
                    "check_unit_test_results": {
                        0: (None, False),
                        1: ("check_unit_test_results", True),
                        2: ("generate_code", True),
                        3: ("generate_unit_tests", True)
                    }
                },
                "max_attempts": 3,
                "recursive": False,
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter",
                    },
                    "required": ["prompt"]
                }
            }
        ]
    }
)