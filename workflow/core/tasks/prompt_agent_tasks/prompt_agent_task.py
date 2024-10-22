from pydantic import Field
from typing import List, Dict, Any, Optional
from workflow.util import LOGGER
from workflow.core.data_structures import (
    MessageDict, ApiType, References, NodeResponse, FunctionParameters, ParameterDefinition, TasksEndCodeRouting
)
from workflow.util.utils import json_to_python_type_mapping
from workflow.core.agent.agent import AliceAgent
from workflow.core.tasks.agent_tasks.agent_task import BasicAgentTask
from workflow.core.prompt import Prompt

class PromptAgentTask(BasicAgentTask):
    """
    A task class that processes a string prompt using templates before passing it to the agent.
    """
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "prompt": ParameterDefinition(
                    type="string",
                    description="The input prompt for the task",
                    default=None
                )
            },
            required=["prompt"]
        ),
        description="Inputs that the agent will require. Default is a 'prompt' string."
    )
    templates: Dict[str, Any] = Field(
        default={
            "task_template": Prompt(
                name="basic_prompt",
                content="{{prompt}}",
                is_templated=True,
                parameters=FunctionParameters(
                    type="object",
                    properties={
                        "prompt": ParameterDefinition(
                            type="string",
                            description="The input prompt for the task",
                            default=None
                        )
                    },
                    required=["prompt"]
                )
            )
        },
        description="A dictionary of template names and their prompt objects."
    )

    def create_message_list(self, **kwargs) -> List[MessageDict]:
        template = self.get_prompt_template("task_template")
        if not template:
            raise ValueError(f"Template {self.task_name} not retrieved correctly.")
        if not isinstance(template, Prompt):
            try: 
                template = Prompt(**template)
            except Exception as e:
                raise ValueError(f"Template {self.task_name} is not a valid prompt configuration: {e}")
        sanitized_inputs = self.update_inputs(**kwargs)
        input_string = template.format_prompt(**sanitized_inputs)
        LOGGER.info(f"Input string for task {self.task_name}: {input_string}")
        return [MessageDict(content=input_string, role="user", generated_by="user", step=self.task_name)]

    def update_inputs(self, **kwargs) -> Dict[str, Any]:
        """
        Validates and sanitizes the input parameters based on the defined input_variables.
        """
        sanitized_input = {}
        # Validate and sanitize required parameters
        for param in self.input_variables.required:
            if param not in kwargs:
                raise ValueError(f"Missing required parameter: {param}")
            value = kwargs[param]
            param_type = self.input_variables.properties[param].type
            python_type = json_to_python_type_mapping(param_type)
            if not python_type:
                raise ValueError(f"Invalid parameter type: {param_type}")
            if not isinstance(value, python_type):
                raise TypeError(f"Parameter '{param}' should be of type {param_type}")
            sanitized_input[param] = value
        
        # Validate and sanitize optional parameters
        for param, definition in self.input_variables.properties.items():
            if param not in sanitized_input:
                value = kwargs.get(param, definition.default)
                if value is not None:
                    param_type = definition.type
                    python_type = json_to_python_type_mapping(param_type)
                    if not python_type:
                        raise ValueError(f"Invalid parameter type: {param_type}")
                    if not isinstance(value, python_type):
                        raise TypeError(f"Parameter '{param}' should be of type {param_type}")
                sanitized_input[param] = value
        
        return sanitized_input
    
    def get_prompt_template(self, template_name: str) -> Prompt:
        if template_name not in self.templates or not self.templates[template_name]:
            raise ValueError(f"Template {template_name} not found in the task templates dictionary.")
        return self.templates[template_name]

class CheckTask(PromptAgentTask):
    """
    A specialized task for checking if the generated output includes certain strings.
    """
    task_name: str = Field("check_output", description="The name of the task")
    exit_code_response_map: Dict[str, int] = Field(
        {"APPROVED": 0, "FAILED": 1},
        description="A dictionary of exit codes mapped to string responses for the task."
    )
    start_node: str = Field(default='llm_generation', description="The name of the starting node")
    node_end_code_routing: TasksEndCodeRouting = Field(default={
        'llm_generation': {
            0: (None, False),
            1: ('llm_generation', True),
        }
    }, description="A dictionary of tasks/nodes -> exit codes and the task to route to given each exit code")

    def get_llm_exit_code(self, chat_output: List[MessageDict], response_code: bool) -> int:
        if not response_code or not chat_output or not chat_output[-1].content:
            LOGGER.warning(f"Invalid input for task {self.task_name}. Returning default failure code.")
            return 1

        content = chat_output[-1].content.upper()
        for key, value in self.exit_code_response_map.items():
            normalized_key = ' '.join(key.upper().split())  # Normalize whitespace
            if normalized_key in content:
                LOGGER.info(f"Found matching response '{key}' for task {self.task_name}. Returning exit code {value}.")
                return value

        LOGGER.warning(f"No matching response found for task {self.task_name}. Returning default failure code.")
        return 1

class CodeGenerationLLMTask(PromptAgentTask):
    """
    A task specifically designed for generating code from a given prompt.
    """
    agent: AliceAgent = Field(..., description="The agent to use for the task")
    task_name: str = Field("generate_code", description="The name of the task")
    exit_codes: dict[int, str] = Field({0: "Success", 1: "Generation failed.", 2: "No code blocks in response"}, description="A dictionary of exit codes for the task")
    start_node: str = Field(default='llm_generation', description="The name of the starting node")
    node_end_code_routing: TasksEndCodeRouting = Field(default={
        'llm_generation': {
            0: (None, False),
            1: ('llm_generation', True),
        }
    }, description="A dictionary of tasks/nodes -> exit codes and the task to route to given each exit code")

    def get_llm_exit_code(self, chat_output: List[MessageDict], response_code: bool) -> int:
        if not response_code or not chat_output or not chat_output[-1].content:
            LOGGER.warning(f"Invalid input for task {self.task_name}. Returning default failure code.")
            return 1
        code_blocs = self.agent._extract_code_blocs(chat_output[-1].content)
        if not code_blocs:
            return 2
        return 0

class CodeExecutionLLMTask(PromptAgentTask):
    """
    A task for executing code that is extracted from a prompt or previous outputs.
    """
    agent: AliceAgent = Field(..., description="The agent to use for the task")
    task_name: str = Field("execute_code", description="The name of the task")
    exit_codes: dict[int, str] = Field({0: "Success", 1: "Execution failed."}, description="A dictionary of exit codes for the task")
    valid_languages: list[str] = Field(["python", "shell"], description="A list of valid languages for code execution")
    timeout: int = Field(50, description="The maximum time in seconds to wait for code execution")
    required_apis: Optional[List[ApiType]] = Field(None, description="A list of required APIs for the task")
    start_node: str = Field(default='code_execution', description="The name of the starting node")
    node_end_code_routing: TasksEndCodeRouting = Field(default={
        'code_execution': {
            0: ('code_execution', True),
            1: (None, True),
        }
    }, description="A dictionary of tasks/nodes -> exit codes and the task to route to given each exit code")

    async def execute_code_execution(self, execution_history: List[NodeResponse], node_responses: List[NodeResponse], **kwargs) -> NodeResponse:
        messages = self.create_message_list(**kwargs)
        if not messages:
            LOGGER.warning(f"No messages to execute code from in task {self.task_name}")
            return NodeResponse(
                parent_task_id=self.id,
                node_name="code_execution",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content="No messages to execute code from",
                    generated_by="system"
                )])
            )

        try:
            code_execs, _ = await self.agent._process_code_execution(messages)
            exit_code = self.get_code_exec_exit_code(code_execs, True)
            return NodeResponse(
                parent_task_id=self.id,
                node_name="code_execution",
                exit_code=exit_code,
                references=References(messages=code_execs)
            )
        except Exception as e:
            LOGGER.error(f"Error in code execution: {e}")
            return NodeResponse(
                parent_task_id=self.id,
                node_name="code_execution",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content=f"Code execution failed: {str(e)}",
                    generated_by="system"
                )])
            )

    def get_code_exec_exit_code(self, chat_output: List[MessageDict], response_code: bool) -> int:
        LOGGER.info(f"Chat output: {chat_output} \nResponse code: {response_code}")
        if not chat_output or not response_code or not chat_output[-1].content or chat_output[-1].content.startswith("Error"):
            LOGGER.warning(f"Invalid input for task {self.task_name}. Returning default failure code.")
            return 1
        return 0