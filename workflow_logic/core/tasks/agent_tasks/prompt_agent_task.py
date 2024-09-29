import re
from pydantic import Field
from typing import List, Dict, Any, Tuple, Optional
from workflow_logic.core.api import APIManager
from workflow_logic.util import LOGGER
from workflow_logic.core.data_structures import TaskResponse, MessageDict, ApiType, References
from workflow_logic.util.utils import json_to_python_type_mapping
from workflow_logic.core.agent.agent import AliceAgent
from workflow_logic.core.tasks.agent_tasks.agent_task import BasicAgentTask
from workflow_logic.core.prompt import Prompt
from workflow_logic.core.parameters import FunctionParameters, ParameterDefinition
    
class PromptAgentTask(BasicAgentTask):
    """
    A task class that processes a string prompt using templates before passing it to the agent.

    This class extends BasicAgentTask and incorporates templating functionality from TemplatedTask.
    It's designed for tasks where the input is a string prompt that needs to be processed before
    being sent to the agent.

    Attributes:
        input_variables (FunctionParameters): Defines the expected input structure, defaulting to a 'prompt' string.
        templates (Dict[str, Any]): A dictionary of templates used for processing the input prompt.

    Methods:
        create_message_list: Processes the input prompt using templates to create a list of messages.
        run: Executes the task by first creating a message list from the prompt.
        update_inputs: Validates and sanitizes the input parameters based on the defined input_variables.
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
                name = "basic_prompt",
                content = "{{prompt}}",
                is_templated = True,
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
        return [MessageDict(content=input_string, role="user", generated_by="user", step=self.task_name)]

    async def run(self, api_manager: APIManager, **kwargs) -> TaskResponse:
        messages = self.create_message_list(**kwargs)
        return await super().run(api_manager=api_manager, messages=messages, **kwargs)

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
    This task type is used when you need to validate the output against predefined
    responses and return specific exit codes based on the match.
    """
    task_name: str = Field("check_output", description="The name of the task")
    exit_code_response_map: Dict[str, int] = Field(
        {"APPROVED": 0, "FAILED": 1},
        description="A dictionary of exit codes mapped to string responses for the task. These strings should be present in the system prompt of the checking agent",
        examples=[{"TESTS PASSED": 0, "TESTS FAILED": 1}]
    )

    def get_exit_code(self, chat_output: List[MessageDict], response_code: bool) -> int:
        """
        Determines the exit code based on the presence of predefined strings in the output.
        
        Args:
            chat_output (List[MessageDict]): The output from the chat.
            response_code (bool): A flag indicating if the response was successful.
        
        Returns:
            int: The determined exit code.
        """
        if not response_code or not chat_output or not chat_output[-1].content:
            LOGGER.warning(f"Invalid input for task {self.task_name}. Returning default failure code. Response code: {response_code} Chat output: {chat_output}")
            return 1

        content = chat_output[-1].content.upper()
        for key, value in self.exit_code_response_map.items():
            normalized_key = ' '.join(key.upper().split())  # Normalize whitespace
            if normalized_key in content:
                LOGGER.info(f"Found matching response '{key}' for task {self.task_name}. Returning exit code {value}.")
                return value

        LOGGER.warning(f"No matching response found for task {self.task_name}. Returning default failure code. \nResponse code: {response_code} \nChat output: {chat_output} \nexit_code_response_map: {self.exit_code_response_map}")
        return 1
    
class CodeGenerationLLMTask(PromptAgentTask):
    """
    A task specifically designed for generating code from a given prompt.

    This task uses a language model to generate code based on the input prompt
    and checks if the output contains valid code blocks.

    Attributes:
        agent (AliceAgent): The agent responsible for code generation.
        task_name (str): The name of the task, defaulting to "generate_code".
        exit_codes (dict[int, str]): A mapping of exit codes to their descriptions.

    Methods:
        get_exit_code: Determines the exit code based on the presence and validity of code blocks in the output.
    """
    agent: AliceAgent = Field(..., description="The agent to use for the task")
    task_name: str = Field("generate_code", description="The name of the task")
    exit_codes: dict[int, str] = Field({0: "Success", 1: "Generation failed.", 2: "No code blocks in response"}, description="A dictionary of exit codes for the task")

    def get_exit_code(self, chat_output: List[MessageDict], response_code: bool) -> int:
        if not response_code or not chat_output or not chat_output[-1].content:
            LOGGER.warning(f"Invalid input for task {self.task_name}. Returning default failure code. Response code: {response_code} Chat output: {chat_output}")
            return 1
        code_blocks = self.agent._extract_code_blocks(chat_output[-1].content)
        if not code_blocks:
            return 2
        return 0
    
    
class CodeExecutionLLMTask(PromptAgentTask):
    """
    A task for executing code that is extracted from a prompt or previous outputs.

    This task is capable of executing code in specified languages and handling
    the execution results.

    Attributes:
        agent (AliceAgent): The agent responsible for code execution.
        task_name (str): The name of the task, defaulting to "execute_code".
        exit_codes (dict[int, str]): A mapping of exit codes to their descriptions.
        valid_languages (list[str]): A list of programming languages that can be executed.
        timeout (int): The maximum time allowed for code execution.

    Methods:
        get_exit_code: Determines the exit code based on the success of code execution.
        generate_agent_response: Handles the extraction and execution of code from the input messages.
    """
    agent: AliceAgent = Field(..., description="The agent to use for the task")
    task_name: str = Field("execute_code", description="The name of the task")
    exit_codes: dict[int, str] = Field({0: "Success", 1: "Execution failed."}, description="A dictionary of exit codes for the task")
    valid_languages: list[str] = Field(["python", "shell"], description="A list of valid languages for code execution")
    timeout: int = Field(50, description="The maximum time in seconds to wait for code execution")
    required_apis: Optional[List[ApiType]] = Field(None, description="A list of required APIs for the task")

    def get_exit_code(self, chat_output: List[MessageDict], response_code: bool) -> int:
        LOGGER.info(f"Chat output: {chat_output} \nResponse code: {response_code}")
        if not chat_output or not response_code or not chat_output[-1].content or chat_output[-1].content.startswith("Error"):
            LOGGER.warning(f"Invalid input for task {self.task_name}. Returning default failure code. Response code: {response_code} Chat output: {chat_output}")
            return 1
        return 0
    
    async def generate_agent_response(self, api_manager: APIManager, **kwargs) -> Tuple[Optional[References], int, Optional[Dict[str, str]]]:    
        if not kwargs.get('messages'):
            LOGGER.warning(f"No messages to execute code from in task {self.task_name}")
            return {}, self.get_exit_code([], False)

        # Process and execute the code blocks
        code_execs, code_blocks = await self.agent._process_code_execution(kwargs.get('messages'))
        
        return References(messages=code_execs), self.get_exit_code(code_execs, True), code_blocks
