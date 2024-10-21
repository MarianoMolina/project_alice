from typing import List, Optional, Callable, Dict
from pydantic import Field
from workflow.core.agent.agent import AliceAgent
from workflow.core.api import APIManager
from workflow.core.data_structures import ApiType, FunctionParameters, ParameterDefinition, NodeResponse, References, MessageDict, FunctionConfig
from workflow.core.data_structures.base_models import TasksEndCodeRouting
from workflow.core.tasks.node_based_task.node_based_task import NodeBasedTask
from workflow.util import LOGGER

class BasicAgentTask(NodeBasedTask):
    """
    A task class that integrates an AI agent for executing various subtasks.

    This class extends NodeBasedTask to provide a framework for tasks that utilize
    an AI agent for operations such as natural language processing, function calling,
    and code execution.

    Attributes:
        agent (AliceAgent): The primary AI agent used for task execution.
        input_variables (FunctionParameters): Defines the expected input structure for the task.
        required_apis (List[ApiType]): List of APIs required for task execution.

    Methods:
        execute_llm_generation: Executes the language model to generate a response.
        execute_tool_call: Executes tool calls based on the language model's output.
        execute_code_execution: Executes code generated or referenced in previous steps.
        create_message_list: Creates a list of messages from the input data.
        tool_list: Returns a list of available tools for the agent.
        tool_map: Creates a mapping of tool names to their corresponding functions.

    The BasicAgentTask class provides a versatile foundation for creating AI-powered
    tasks that can perform a wide range of operations, from simple text generation
    to complex multi-step processes involving tool usage and code execution.
    """
    agent: AliceAgent = Field(..., description="The primary agent to use for the task")
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "messages": ParameterDefinition(
                    type="list",
                    description="A list of message dictionaries to use as input for the task.",
                    default=None
                )
            },
            required=["messages"]
        ),
        description="Inputs that the agent will require. Default is a list of messages."
    )
    required_apis: List[ApiType] = Field([ApiType.LLM_MODEL], description="A list of required APIs for the task")
    start_node: Optional[str] = Field(default='llm_generation', description="The name of the starting node")
    node_end_code_routing: TasksEndCodeRouting = Field(default={
        'llm_generation':{
            0: ('tool_call_execution', False),
            1: ('llm_generation', True),
        }, 
        'tool_call_execution':{
            0: ('code_execution', False),
            1: ('tool_call_execution', True),
        }, 
        'code_execution':{
            0: ('code_execution', True),
            1: (None, True),
        }
    }, description="A dictionary of tasks/nodes -> exit codes and the task to route to given each exit code")

    async def execute_llm_generation(self, execution_history: List[NodeResponse], node_responses: List[NodeResponse], **kwargs) -> NodeResponse:
        api_manager: APIManager = kwargs.get("api_manager")
        messages = self.create_message_list(**kwargs)
        tools_list = self.tool_list(api_manager)
        
        try:
            llm_response = await self.agent._generate_llm_response(api_manager, messages, tools_list)
            exit_code = self.get_llm_exit_code(llm_response)
            return NodeResponse(
                parent_task_id=self.id,
                node_name="llm_generation",
                exit_code=exit_code,
                references=References(messages=llm_response)
            )
        except Exception as e:
            LOGGER.error(f"Error in LLM generation: {e}")
            return NodeResponse(
                parent_task_id=self.id,
                node_name="llm_generation",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content=f"LLM generation failed: {str(e)}",
                    generated_by="system"
                )])
            )

    async def execute_tool_call(self, execution_history: List[NodeResponse], node_responses: List[NodeResponse], **kwargs) -> NodeResponse:
        api_manager: APIManager = kwargs.get("api_manager")
        llm_reference = self.get_node_reference(node_responses, "llm_generation")
        if not llm_reference or not llm_reference.messages:
            return NodeResponse(
                parent_task_id=self.id,
                node_name="tool_call_execution",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content="Tool call execution failed: No LLM response found",
                    generated_by="system"
                )])
            )

        llm_response = llm_reference.messages[-1]
        tool_map = self.tool_map(api_manager)
        tools_list = self.tool_list(api_manager)

        try:
            tool_messages = await self.agent._process_tool_calls(llm_response.tool_calls, tool_map, tools_list)
            return NodeResponse(
                parent_task_id=self.id,
                node_name="tool_call_execution",
                exit_code=0,
                references=References(messages=tool_messages)
            )
        except Exception as e:
            LOGGER.error(f"Error in tool call execution: {e}")
            return NodeResponse(
                parent_task_id=self.id,
                node_name="tool_call_execution",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content=f"Tool call execution failed: {str(e)}",
                    generated_by="system"
                )])
            )

    async def execute_code_execution(self, execution_history: List[NodeResponse], node_responses: List[NodeResponse], **kwargs) -> NodeResponse:
        llm_reference = self.get_node_reference(node_responses, "llm_generation")
        tool_reference = self.get_node_reference(node_responses, "tool_call_execution")

        if not llm_reference or not llm_reference.messages:
            return NodeResponse(
                parent_task_id=self.id,
                node_name="code_execution",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content="Code execution failed: No LLM response found",
                    generated_by="system"
                )])
            )

        llm_response = llm_reference.messages[-1]
        tool_messages = tool_reference.messages if tool_reference else []

        try:
            code_messages = await self.agent._process_code_execution([llm_response] + tool_messages)
            return NodeResponse(
                parent_task_id=self.id,
                node_name="code_execution",
                exit_code=0,
                references=References(messages=code_messages)
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
        
    def get_llm_exit_code(self, llm_response: List[MessageDict]) -> int:
        return 0 if llm_response else 1

    def create_message_list(self, **kwargs) -> List[MessageDict]:
        """Create a list of messages from the input data."""
        messages: List[MessageDict] = kwargs.get('messages', [])
        return messages
        
    def tool_list(self, api_manager: APIManager) -> List[FunctionConfig]:
        return [func.get_function(api_manager)["tool_function"] for func in self.tasks.values()] if self.tasks else None
    
    def tool_map(self, api_manager: APIManager) -> Optional[Dict[str, Callable]]:
        combined_function_map = {}
        for func in self.tasks.values():
            function_details = func.get_function(api_manager=api_manager)
            combined_function_map.update(function_details["function_map"])
        return combined_function_map