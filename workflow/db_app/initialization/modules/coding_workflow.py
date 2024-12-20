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
              "key": "code_execution_param",
                "type": "string",
                "description": "The code execution output", 
            },
            {
                "key": "param_generate_unit_tests",
                "type": "string",
                "description": "The unit test code that was generated, passed in case of a recursive call",
            },
            {
                "key": "include_prompt_param",
                "type": "boolean",
                "description": "Whether to include the prompt in code execution",
                "default": True
            },
            {
                "key": "prompt_parameter",
                "type": "string",
                "description": "The input prompt for the task",
            }
        ],
        "user_checkpoints": [
            {   
                "key": "generate_unit_tests_checkpoint",
                "user_prompt": "Please approve or reject the code generated before the unit tests are generated. Provide feedback, if any, for the unit test agent to consider.",
                "task_next_obj": {0: "Generate_Unit_Tests", 1: None},
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
                        "Plan_Workflow": "param_plan_workflow",
                        "Generate_Code": "param_generate_code",
                        "Generate_Unit_Tests": "param_generate_unit_tests",
                    },
                    "required": ["Plan_Workflow"]
                }
            },
            {
                "key": "code_generation_output_prompt",
                "name": "Code Generation Output",
                "content": "{{llm_generation}}\n\n{{code_execution}}",
                "is_templated": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "llm_generation": "param_generate_code",
                        "code_execution": "code_execution_param",
                    },
                    "required": ["llm_generation"]
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
                        "Plan_Workflow": "param_plan_workflow",
                        "Generate_Code": "param_generate_code",
                        "Generate_Unit_Tests": "param_generate_unit_tests",
                    },
                    "required": ["Generate_Unit_Tests", "Generate_Code", "Plan_Workflow"]
                }
            }, 
            {
                "key": "coding_workflow_output_prompt",
                "name": "Coding Workflow Output Template",
                "content": "Plan: {{ Plan_Workflow }}\n\nCode: {{ Generate_Code }}\n\nUnit Tests: {{ Generate_Unit_Tests }}\n\n",
                "is_templated": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "Plan_Workflow": "param_plan_workflow",
                        "Generate_Code": "param_generate_code",
                        "Generate_Unit_Tests": "param_generate_unit_tests",
                    },
                    "required": ["Plan_Workflow"]
                }
            }
        ],
        "agents": [
            {
                "key": "coding_planner_agent",
                "name": "Coding Planner Agent",
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
                "name": "Coding Agent",
                "system_message": "coding_agent",
                "models": {
                    "chat": "Claude3.5",
                },
                "max_consecutive_auto_reply": 1,
                "has_tools": 0,
                "has_code_exec": 1,                
            },
            {
                "key": "unit_tester_agent",
                "name": "Unit Tester Agent",
                "system_message": "unit_tester_agent",
                "models": {
                    "chat": "GPT4o",
                },
                "max_consecutive_auto_reply": 1,
                "has_tools": 0,
                "has_code_exec": 1,                
            },
            {
                "key": "unit_test_check_agent",
                "name": "Unit Test Check Agent",
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
                "task_name": "Plan_Workflow",
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
                "max_attempts": 2,
                "recursive": True,
            },
            {
                "key": "generate_code",
                "task_type": "CodeGenerationLLMTask",
                "task_name": "Generate_Code",
                "task_description": "Generates code based on the provided plan_workflow output",
                "agent": "coding_agent",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "Plan_Workflow": "param_plan_workflow",
                        "Generate_Code": "param_generate_code",
                        "Generate_Unit_Tests": "param_generate_unit_tests",
                    },
                    "required": ["Plan_Workflow"]
                },
                "required_apis": ["llm_api"],
                "templates": {
                    "task_template": "code_generation_task_prompt",
                    "output_template": "code_generation_output_prompt" ## This template ensures we only retrieve the last nodes of each type
                },
                "max_attempts": 1,
                "recursive": True,
            },
            {
                "key": "generate_unit_tests",
                "task_type": "CodeGenerationLLMTask",
                "task_name": "Generate_Unit_Tests",
                "task_description": "Generates unit tests for the prompt provided. Ensure the code and task are available in the prompt",
                "agent": "unit_tester_agent",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "Plan_Workflow": "param_plan_workflow",
                        "Generate_Code": "param_generate_code",
                        "Generate_Unit_Tests": "param_generate_unit_tests",
                        "include_prompt_in_execution": "include_prompt_param"
                    },
                    "required": ["Generate_Code"]
                },
                "templates": {
                    "task_template": "code_generation_task_prompt",
                    "output_template": "code_generation_output_prompt"
                },
                "max_attempts": 1,
                "recursive": True,
                "exit_codes": {0: "Success", 1: "Generation failed.", 2: "No code blocks in response"}
            },
            {
                "key": "check_unit_test_results",
                "task_type": "CheckTask",
                "task_name": "Check_Unit_Test_Results",
                "task_description": "Checks the results of the unit tests",
                "agent": "unit_test_check_agent",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "Plan_Workflow": "param_plan_workflow",
                        "Generate_Code": "param_generate_code",
                        "Generate_Unit_Tests": "param_generate_unit_tests",
                    },
                    "required": ["Generate_Unit_Tests", "Generate_Code"]
                },
                "node_end_code_routing": {
                    'llm_generation': {
                        0: (None, False),
                        1: ('llm_generation', True),
                        2: ('llm_generation', True),
                        3: (None, True)
                    }
                },
                "exit_code_response_map": {"TEST FAILED": 2, "ALL TESTS PASSED": 0, "TEST CODE ERROR": 3},
                "exit_codes": {0: "Test Passed", 1: "Response generation failed", 2: "Test Failed", 3: "Test Code Error"},
                "templates": {
                    "task_template": "unit_test_check_prompt"
                },
                "max_attempts": 1,
                "recursive": True,
            },
            {
                "key": "coding_workflow",
                "task_type": "Workflow",
                "task_name": "Coding_Workflow",
                "task_description": "Workflow for creating code. Provide a prompt detailing the requirements and language for the code.",
                "tasks": {
                    "Plan_Workflow": "plan_workflow",
                    "Generate_Code": "generate_code",
                    "Generate_Unit_Tests": "generate_unit_tests",
                    "Check_Unit_Test_Results": "check_unit_test_results"
                },
                "start_node": "Plan_Workflow",
                "node_end_code_routing": {
                    "Plan_Workflow": {
                        0: ("Generate_Code", False),
                        1: ("Plan_Workflow", True),
                    },
                    "Generate_Code": {
                        0: ("Generate_Unit_Tests", False),
                        1: ("Generate_Code", True),
                        2: ("Generate_Code", True),
                        3: ("Generate_Code", True),
                    },
                    "Generate_Unit_Tests": {
                        0: ("Check_Unit_Test_Results", False),
                        1: ("Generate_Unit_Tests", True),
                        2: ("Check_Unit_Test_Results", True),
                        3: ("Generate_Unit_Tests", True)
                    },
                    "Check_Unit_Test_Results": {
                        0: (None, False),
                        1: ("Check_Unit_Test_Results", True),
                        2: ("Generate_Code", True),
                        3: ("Generate_Unit_Tests", True)
                    }
                },
                "max_attempts": 3,
                "recursive": True,
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
                "task_name": "Coding_Workflow_w/_Checkpoint",
                "task_description": "Workflow for creating code. Provide a prompt detailing the requirements and language for the code.",
                "tasks": {
                    "Plan_Workflow": "plan_workflow",
                    "Generate_Code": "generate_code",
                    "Generate_Unit_Tests": "generate_unit_tests",
                    "Check_Unit_Test_Results": "check_unit_test_results"
                },
                "start_node": "Plan_Workflow",
                "node_end_code_routing": {
                    "Plan_Workflow": {
                        0: ("Generate_Code", False),
                        1: ("Plan_Workflow", True),
                    },
                    "Generate_Code": {
                        0: ("Generate_Unit_Tests", False),
                        1: ("Generate_Code", True),
                        2: ("Generate_Code", True),
                        3: ("Generate_Code", True),
                    },
                    "Generate_Unit_Tests": {
                        0: ("Check_Unit_Test_Results", False),
                        1: ("Generate_Unit_Tests", True),
                        2: ("Check_Unit_Test_Results", True),
                        3: ("Generate_Unit_Tests", True)
                    },
                    "Check_Unit_Test_Results": {
                        0: (None, False),
                        1: ("Check_Unit_Test_Results", True),
                        2: ("Generate_Code", True),
                        3: ("Generate_Unit_Tests", True)
                    }
                },
                "max_attempts": 3,
                "recursive": True,
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter",
                    },
                    "required": ["prompt"]
                },
                "user_checkpoints": {
                    "Generate_Unit_Tests": "generate_unit_tests_checkpoint"
                },
                "templates": {
                    "output_template": "coding_workflow_output_prompt"
                }
            }
        ]
    }
)