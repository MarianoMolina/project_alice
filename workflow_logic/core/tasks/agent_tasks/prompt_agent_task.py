from typing import List, Dict, Any, Tuple, Optional
from pydantic import Field
from workflow_logic.core.api import APIManager
from workflow_logic.util import LOGGER, MessageDict, TaskResponse, ApiType
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

    Attributes:
        task_name (str): The name of the task, defaulting to "check_output".
        exit_code_response_map (dict[str, int]): A mapping of expected responses to exit codes.

    Methods:
        get_exit_code: Determines the exit code based on the presence of predefined strings in the output.
    """
    task_name: str = Field("check_output", description="The name of the task")
    exit_code_response_map: dict[str, int] = Field({"APPROVED": 0, "FAILED": 1}, description="A dictionary of exit codes mapped to string responses for the task. These strings should be present in the system prompt of the checking agent", examples=[{"TESTS PASSED": 0, "TESTS FAILED": 1}])

    def get_exit_code(self, chat_output: List[MessageDict], response_code: bool) -> int:
        if not chat_output or not 'content' in chat_output[-1]:
            return 1
        for key, value in self.exit_code_response_map.items():
            if key in chat_output[-1]["content"]:
                return value
        LOGGER.warning(f"None of the exit code responses were found in the output of the task {self.task_name}")
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
        if not chat_output or not 'content' in chat_output[-1]:
            return 1
        code_blocks = self.agent._extract_code_blocks(chat_output[-1]["content"])
        if not code_blocks:
            return 2
        return 0