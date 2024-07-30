from typing import List, Dict, Optional, Callable
from pydantic import Field
from workflow_logic.core.api import APIManager
from workflow_logic.core.api import ApiType
from workflow_logic.core.communication import MessageDict, TaskResponse, LLMChatOutput
from workflow_logic.core.agent.agent import AliceAgent
from workflow_logic.core.tasks.task import AliceTask
from workflow_logic.core.parameters import FunctionParameters, ParameterDefinition, FunctionConfig

class BasicAgentTask(AliceTask):
    """
    A base class for agent-based tasks.

    This class sets up the basic structure for tasks that involve an agent interacting
    with a chat system, potentially executing functions or code.

    Attributes:
        agent (AliceAgent): The primary agent responsible for generating responses.
        execution_agent (AliceAgent): An agent responsible for executing code or functions.
        input_variables (FunctionParameters): Defines the expected input structure for the task.

    Methods:
        tool_list: Returns a list of available functions for the agent.
        tool_map: Creates a combined map of all available functions.
        generate_response: Generates a response using the chat execution functionality.
        run: Executes the task and returns a TaskResponse.
        get_exit_code: Determines the exit code based on the chat output and response status.
    """
    agent: AliceAgent = Field(..., description="The primary agent to use for the task")
    execution_agent: AliceAgent = Field(
        default=AliceAgent(
            name="default_executor",
            system_message={"name": "default_executor", "content": "Default executor agent."},
            autogen_class="UserProxyAgent",
            code_execution_config=False,
            default_auto_reply=""
        ),
        description="The executor agent. By default, it's set up without code execution capabilities."
    )
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
    required_apis: List[ApiType] = Field(['llm_api'], description="A list of required APIs for the task")

    def tool_list(self, api_manager: APIManager) -> List[FunctionConfig]:
        return [func.get_function(api_manager)["tool_function"] for func in self.tasks.values()] if self.tasks else None
    
    def tool_map(self, api_manager: APIManager) -> Optional[Dict[str, Callable]]:
        combined_function_map = {}
        for func in self.tasks.values():
            function_details = func.get_function(api_manager=api_manager)
            combined_function_map.update(function_details["function_map"])
        return combined_function_map
    
    async def run(self, api_manager: APIManager, **kwargs) -> TaskResponse:
        self.setup_chat_execution(api_manager)
        
        messages = kwargs.get('messages', [])
        new_messages = await self.agent.chat(api_manager=api_manager, messages=messages, max_turns=1, tool_map=self.tool_map(api_manager), tool_list=self.tool_list(api_manager))
        
        is_terminated = True if 'TERMINATE' in new_messages[-1]['content'] else False

        exitcode = self.get_exit_code(new_messages, is_terminated)
        all_messages = messages + new_messages
        chat_output = LLMChatOutput(content=all_messages)
        
        return TaskResponse(
            task_id=self.id,
            task_name=self.task_name,
            task_description=self.task_description,
            status="complete" if exitcode == 0 else "failed",
            result_code=exitcode,
            task_outputs=str(chat_output),
            task_content=chat_output,
            task_inputs=kwargs,
            result_diagnostic="Task executed successfully." if not is_terminated else "Task execution terminated by the agent.",
            execution_history=kwargs.get("execution_history", [])
        )
    
    def get_exit_code(self, chat_output: List[MessageDict], response_code: bool) -> int:
        return 0 if (chat_output and 'content' in chat_output[-1]) else 1