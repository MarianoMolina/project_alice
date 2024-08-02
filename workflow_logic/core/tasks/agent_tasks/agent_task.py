from pydantic import Field
from typing import List, Dict, Optional, Callable, Tuple
from workflow_logic.core.api import APIManager
from workflow_logic.core.agent.agent import AliceAgent
from workflow_logic.core.tasks.task import AliceTask
from workflow_logic.util import MessageDict, TaskResponse, LLMChatOutput, LOGGER, ApiType
from workflow_logic.core.parameters import FunctionParameters, ParameterDefinition, FunctionConfig

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
        generate_response: Generates a response using the chat execution functionality.
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
    

    
class CodeExecutionLLMTask(BasicAgentTask):
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
        generate_response: Handles the extraction and execution of code from the input messages.
    """
    agent: AliceAgent = Field(..., description="The agent to use for the task")
    task_name: str = Field("execute_code", description="The name of the task")
    exit_codes: dict[int, str] = Field({0: "Success", 1: "Execution failed."}, description="A dictionary of exit codes for the task")
    valid_languages: list[str] = Field(["python", "shell"], description="A list of valid languages for code execution")
    timeout: int = Field(50, description="The maximum time in seconds to wait for code execution")
    required_apis: Optional[List[ApiType]] = Field(None, description="A list of required APIs for the task")

    def get_exit_code(self, chat_output: List[MessageDict], response_code: bool) -> int:
        if not chat_output or response_code or not 'content' in chat_output[-1] or chat_output[-1]["content"].startswith("Error"):
            return 1
        return 0
    
    async def generate_response(self, messages: List[MessageDict]) -> Tuple[List[MessageDict], bool]:
        if not messages or not 'content' in messages[-1]:
            LOGGER.warning(f"No messages to execute code from in task {self.task_name}")
            return [], True
        responses = self.agent._process_code_execution(messages[-1]['content'])
        if not responses:
            LOGGER.warning(f"Code execution failed")
            return [], True
        return responses, False
