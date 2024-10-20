from pydantic import Field
from typing import List, Dict, Optional, Callable, Tuple, Union
from workflow.core.api import APIManager
from workflow.core.agent.agent import AliceAgent
from workflow.core.tasks.task_new import AliceTask
from workflow.core.data_structures.task_response_new import NodeResponse
from workflow.core.data_structures.base_models import TasksEndCodeRouting
from workflow.core.data_structures import References, MessageDict, TaskResponse, ApiType, FunctionParameters, ParameterDefinition, FunctionConfig
from workflow.util import LOGGER
from workflow.util.utils import generate_node_responses_summary

class BasicAgentTask(AliceTask):
    """
    A base class for agent-based tasks.

    This class sets up the basic structure for tasks that involve an agent interacting
    with a chat system, potentially executing functions or code.

    Attributes:
        agent (AliceAgent): The primary agent responsible for generating responses.
        input_variables (FunctionParameters): Defines the expected input structure for the task.

    Methods:
        tool_list: Returns a list of available functions for the agent.
        tool_map: Creates a combined map of all available functions.
        generate_agent_response: Generates a response using the chat execution functionality.
        run: Executes the task and returns a TaskResponse.
        get_exit_code: Determines the exit code based on the chat output and response status.
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
    start_node: Optional[str] = Field(default=None, description="The name of the starting node")
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
    
    async def generate_agent_response(self, api_manager: APIManager, **kwargs) ->  Tuple[Optional[References], int, Optional[Union[List[MessageDict], Dict[str, str]]]]:   
        messages = self.create_message_list(**kwargs)
        node_name = kwargs.get("node_name", "default")
        if node_name != "default" and node_name != "llm_generation":
            execution_history: List[NodeResponse] = kwargs.get("execution_history", [])
            self_nodes = self.get_self_nodes_from_execution_history(execution_history)
            message_node = [node for node in self_nodes if node.node_name == 'llm_generation']
            messages_to_add = message_node[-1].references.messages if message_node else []
            if not self_nodes or not message_node or not messages_to_add:
                LOGGER.error(f"Issue finding the expected messages: {self_nodes} \n Execution history: {execution_history}")
                return {}, 1, messages if messages else []
            messages.extend(messages_to_add)
        new_messages = await self.agent.generate_response(api_manager=api_manager, node_name=node_name, messages=messages, tool_map=self.tool_map(api_manager), tools_list=self.tool_list(api_manager))
        if not new_messages:
            LOGGER.error("No messages returned from agent.")
            return {}, 1, messages if messages else []
        is_terminated = True if 'TERMINATE' in new_messages[-1].content else False
        exitcode = self.get_exit_code(new_messages, not is_terminated)
        return References(messages=new_messages), exitcode, messages
    
    async def run(self, api_manager: APIManager, **kwargs) -> TaskResponse:
        execution_history: List[NodeResponse] = kwargs.get("execution_history", [])
        user_interaction = self.handle_user_checkpoints(execution_history, 'default')
        if user_interaction:
            str_output = generate_node_responses_summary(execution_history)
            return self.get_task_response(str_output, 1, 'User interaction required.', 'pending', execution_history, **kwargs)
        references, exitcode, start_messages = await self.generate_agent_response(api_manager, **kwargs)
        exec_history = kwargs.pop("execution_history", None)
        if not references or len(references) == 0: 
            return self.get_failed_task_response(diagnostics="No messages generated by the agent", **kwargs)
        # Log the type of new messages
        LOGGER.debug(f'references: {references.messages}')
        LOGGER.debug(f'new_files: {references.files}')
        output_str = references.detailed_summary()
        kwargs['messages'] = start_messages
        
        return TaskResponse(
            task_id=self.id,
            task_name=self.task_name,
            task_description=self.task_description,
            status="complete" if exitcode == 0 else "failed",
            result_code=exitcode,
            task_outputs=output_str,
            references=references,
            task_inputs=kwargs,
            result_diagnostic="Task executed successfully." if exitcode == 0 else "Task execution failed.",
            execution_history=exec_history
        )
    
    def get_exit_code(self, chat_output: List[MessageDict], response_code: bool) -> int:
        return 0 if (chat_output and chat_output[-1].content) else 1