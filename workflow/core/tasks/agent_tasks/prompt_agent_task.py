from pydantic import Field, BaseModel
from typing import List, Dict, Any, Optional, Callable
from workflow.util import LOGGER
from workflow.core.api import APIManager
from workflow.core.data_structures import (
    MessageDict, References, NodeResponse, FunctionParameters, ParameterDefinition, ToolFunction, ApiType, TasksEndCodeRouting, Prompt, ContentType, RoleTypes, MessageGenerators
)
from workflow.util.utils import json_to_python_type_mapping, get_traceback
from workflow.core.agent.agent import AliceAgent
from workflow.core.tasks.task import AliceTask

from enum import IntEnum

class LLMExitCode(IntEnum):
    SUCCESS_NO_EXEC = 0  # Generated successfully, no code or tool calls needed
    FAILURE = 1         # Generation failed
    SUCCESS_TOOLS = 2   # Generated successfully, has tool calls, no code
    SUCCESS_CODE = 3    # Generated successfully, has code, no tool calls
    SUCCESS_BOTH = 4    # Generated successfully, has both tool calls and code

class ToolExitCode(IntEnum):
    SUCCESS = 0         # Success, no code needed
    FAILURE = 1         # Failed
    SUCCESS_CODE = 2    # Success, proceed to code execution
    
class PromptAgentTask(AliceTask):
    """
    A task class that processes prompts using an AI agent, with support for conditional tool and code execution.

    This task implements a three-node workflow:
    1. LLM Generation: Processes the input prompt and determines execution path
    2. Tool Execution: Handles any tool/function calls (if present and permitted)
    3. Code Execution: Processes any code blocks (if present and permitted)

    The workflow is controlled by a flexible routing system where each node's exit code determines
    the next step. The LLM generation node analyzes its output to determine if tool calls and/or
    code execution are needed, and the tool execution node can optionally proceed to code execution
    based on the original LLM output.

    Exit codes are automatically adjusted based on agent capabilities and available routes,
    ensuring graceful handling even with partial routing tables or disabled features.

    Attributes:
        agent (AliceAgent): The agent responsible for LLM interaction and execution
        required_apis (List[ApiType]): Required APIs, defaults to [LLM_MODEL]
        input_variables (FunctionParameters): Expected input structure
        node_end_code_routing (TasksEndCodeRouting): Routing rules between nodes
    """
    agent: AliceAgent = Field(..., description="The agent to use for the task")
    required_apis: List[ApiType] = Field([ApiType.LLM_MODEL], description="A list of required APIs for the task")
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
    templates: Dict[str, Any] = Field(..., description="A dictionary of template names and their prompt objects. task_template is used to format the agent input message, output_template is used to format the output.")
    start_node: str = Field(default='llm_generation', description="The name of the starting node")
    node_end_code_routing: TasksEndCodeRouting = Field(
        default={
            'llm_generation': {
                LLMExitCode.SUCCESS_NO_EXEC: (None, False),
                LLMExitCode.FAILURE: ('llm_generation', True),
                LLMExitCode.SUCCESS_TOOLS: ('tool_call_execution', False),
                LLMExitCode.SUCCESS_CODE: ('code_execution', False),
                LLMExitCode.SUCCESS_BOTH: ('tool_call_execution', False)
            },
            'tool_call_execution': {
                ToolExitCode.SUCCESS: (None, False),
                ToolExitCode.FAILURE: ('tool_call_execution', True),
                ToolExitCode.SUCCESS_CODE: ('code_execution', False)
            },
            'code_execution': {
                0: (None, False),
                1: ('code_execution', True)
            }
        }, 
        description="A dictionary of tasks/nodes -> exit codes and the task to route to given each exit code"
    )
    def model_dump(self, *args, **kwargs):
        try:
            LOGGER.debug(f"PromptAgentTask.model_dump called for {self.__class__.__name__}")
            if self.tasks:
                for task in self.tasks.values():
                    LOGGER.debug(f'Task state: {task.task_name} - {task}')
                    for k, v in self.__dict__.items():
                        if isinstance(v, BaseModel):
                            LOGGER.debug(f"Nested BaseModel found in {k}: {type(v)}")
                            if hasattr(v, '__dict__'):
                                LOGGER.debug(f"Nested object {k} dict type: {type(vars(v.__class__))}")
                # LOGGER.debug(f"Removing tasks from model dump for {self.__class__.__name__}")
                # self.tasks = {}
            return super().model_dump(*args, **kwargs)
        except TypeError as e:
            LOGGER.error(f"TypeError in AliceTask model_dump: {str(e)}")
            LOGGER.error(f"Full task state: {vars(self)}")
            raise

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
        msg_list = [MessageDict(content=input_string, role=RoleTypes.USER, generated_by=MessageGenerators.USER, step=self.task_name)]
        
        # Add messages from history
        execution_history: List[NodeResponse] = kwargs.get("execution_history", [])
        for node in execution_history:
            if isinstance(node, NodeResponse) and node.parent_task_id == self.id and node.references and node.references.messages:
                msg_list.extend(node.references.messages)
        return msg_list

    def update_inputs(self, **kwargs) -> Dict[str, Any]:
        """
        TODO: Review if this is necessary, Task already does input validation
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
    
    async def execute_llm_generation(self, execution_history: List[NodeResponse], node_responses: List[NodeResponse], **kwargs) -> NodeResponse:
        api_manager: APIManager = kwargs.get("api_manager")
        messages = self.create_message_list(**kwargs)
        tools_list = self.tool_list(api_manager)
        
        try:
            llm_response = await self.agent.generate_llm_response(api_manager, messages, tools_list)
            exit_code = self.get_llm_exit_code(llm_response)
            return NodeResponse(
                parent_task_id=self.id,
                node_name="llm_generation",
                exit_code=exit_code,
                execution_order=len(execution_history),
                references=References(messages=[llm_response])
            )
        except Exception as e:
            LOGGER.error(f"Error in LLM generation: {e}")
            traceback_str = get_traceback()
            LOGGER.error(traceback_str)
            return NodeResponse(
                parent_task_id=self.id,
                node_name="llm_generation",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content=f"LLM generation failed: {str(e)}" + "\n" + traceback_str,
                    generated_by="system"
                )]),
                execution_order=len(execution_history)
            )

    async def execute_tool_call_execution(self, execution_history: List[NodeResponse], node_responses: List[NodeResponse], **kwargs) -> NodeResponse:
        """Execute tool calls and determine appropriate exit code."""
        api_manager: APIManager = kwargs.get("api_manager")
        llm_node = self.get_last_node_by_name(node_responses, "llm_generation")
        
        if not llm_node or not llm_node.references or not llm_node.references.messages:
            return self.get_failed_task_response(diagnostics="No LLM response found", execution_history=execution_history)

        try:
            llm_response: MessageDict = llm_node.references.messages[-1]
            tool_map = self.tool_map(api_manager)
            tools_list = self.tool_list(api_manager)
            
            tool_messages = await self.agent.process_tool_calls(
                llm_response.references.tool_calls, 
                tool_map, 
                tools_list
            )
            
            # Determine exit code based on success and LLM context
            success = bool(tool_messages)  # Tool execution succeeded if we got messages
            exit_code = self.get_tool_exit_code(success, llm_node.exit_code)
            
            return NodeResponse(
                parent_task_id=self.id,
                node_name="tool_call_execution",
                exit_code=exit_code,
                references=References(messages=tool_messages),
                execution_order=len(execution_history)
            )
            
        except Exception as e:
            return self.get_failed_task_response(diagnostics=str(e), execution_history=execution_history)

    async def execute_code_execution(self, execution_history: List[NodeResponse], node_responses: List[NodeResponse], include_prompt_in_execution: Optional[bool] = False, **kwargs) -> NodeResponse:
        messages: List[MessageDict] = []
        LOGGER.info(f"Executing code execution for task {self.task_name} with include_prompt_in_execution: {include_prompt_in_execution}")
        if include_prompt_in_execution:
            prompt_messages = self.create_message_list(**kwargs)
            messages.extend(prompt_messages)
        llm_reference = self.get_node_reference(node_responses, "llm_generation")

        if not llm_reference or not llm_reference.messages:
            return NodeResponse(
                parent_task_id=self.id,
                node_name="code_execution",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content="Code execution failed: No LLM response found",
                    generated_by="system"
                )]),
                execution_order=len(execution_history)
            )

        messages.extend(llm_reference.messages)

        try:
            code_executions, exit_code  = await self.agent.process_code_execution(messages)
            return NodeResponse(
                parent_task_id=self.id,
                node_name="code_execution",
                exit_code=exit_code,
                references=References(code_executions=code_executions),
                execution_order=len(execution_history)
            )
        except Exception as e:
            LOGGER.error(f"Error in code execution: {e}")
            return NodeResponse(
                parent_task_id=self.id,
                node_name="code_execution",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content=f"Code execution failed: {str(e)}\n\n" + get_traceback(),
                    generated_by="system"
                )]),
                execution_order=len(execution_history)
            )
        
    def get_llm_exit_code(self, message: MessageDict) -> int:
        """Determine LLM exit code based on content and available routes."""
        if not message or not message.content:
            return self._get_available_exit_code(LLMExitCode.FAILURE, "llm_generation")

        has_tool_calls = bool(message.references.tool_calls)
        has_code = bool(self.agent.collect_code_blocs([message]))

        # Check agent capabilities
        if has_tool_calls and not self.agent.has_tools:
            has_tool_calls = False
        if has_code and not self.agent.has_code_exec:
            has_code = False

        # Determine desired exit code
        if has_tool_calls and has_code:
            desired_code = LLMExitCode.SUCCESS_BOTH
        elif has_tool_calls:
            desired_code = LLMExitCode.SUCCESS_TOOLS
        elif has_code:
            desired_code = LLMExitCode.SUCCESS_CODE
        else:
            desired_code = LLMExitCode.SUCCESS_NO_EXEC

        # Return available exit code closest to desired behavior
        return self._get_available_exit_code(desired_code, "llm_generation")
    
    def get_tool_exit_code(self, success: bool, last_llm_exit_code: int) -> ToolExitCode:
        """Determine tool exit code based on execution success and LLM context."""
        if not success:
            return self._get_available_exit_code(ToolExitCode.FAILURE, "tool_call_execution")

        # Check if we should proceed to code execution
        if last_llm_exit_code == LLMExitCode.SUCCESS_BOTH:
            desired_code = ToolExitCode.SUCCESS_CODE
        else:
            desired_code = ToolExitCode.SUCCESS

        return self._get_available_exit_code(desired_code, "tool_call_execution")
    
    def tool_list(self, api_manager: APIManager) -> List[ToolFunction]:
        return [func.get_function(api_manager)["tool_function"] for func in self.tasks.values()] if self.tasks else None
    
    def tool_map(self, api_manager: APIManager) -> Optional[Dict[str, Callable]]:
        combined_function_map = {}
        for func in self.tasks.values():
            function_details = func.get_function(api_manager=api_manager)
            combined_function_map.update(function_details["function_map"])
        return combined_function_map