from workflow_logic.util.logging_config import LOGGER
from typing import Optional, List, Tuple
from pydantic import Field
from workflow_logic.core.api.api import APIManager
from workflow_logic.core.communication import LLMChatOutput, MessageDict, TaskResponse, messages_to_autogen_compatible
from workflow_logic.core.agent.agent import AliceAgent
from workflow_logic.core.tasks.task import AliceTask
from workflow_logic.core.parameters import ParameterDefinition, FunctionParameters

# Define the default FunctionParameters for the default classes
messages_function_parameters = FunctionParameters(
    type="object",
    properties={
        "messages": ParameterDefinition(
            type="list",
            description="A list of message dictionaries to use as input for the task. Dicts should have a content and role key with str values.",
            default=None
        )
    },
    required=["messages"]
)

class BasicAgentTask(AliceTask):
    agent: AliceAgent = Field(..., description="The agent to use for the task")
    input_variables: FunctionParameters = Field(default=messages_function_parameters, description="Inputs that the agent will require in a workflow. Default is 'messages', a list of MessageDicts.")
    exit_codes: dict[int, str] = Field(default={0: "Success", 1: "Generation failed."}, description="A dictionary of exit codes for the task")
    human_input: Optional[bool] = Field(default=False, description="Whether the task requires human input")
  
    async def run(self, messages: List[MessageDict], api_manager: APIManager, **kwargs) -> TaskResponse:
        if not messages:
            # There's a conceit here that a task has to have messages to run. 
            # This is not strictly true, but it's a better default than allowing a system message to function as a task prompt. 
            diagnostics = "Failed to initialize messages."
            return self.get_failed_task_response(diagnostics=diagnostics, **kwargs)

        LOGGER.info(f'Executing task: {self.task_name}')
        initial_inputs = {**kwargs, "messages": messages }
        result, exitcode = await self.generate_agent_response(messages=messages, max_rounds=1, api_manager=api_manager, **kwargs)
        LOGGER.info(f"Task {self.task_name} executed with exit code: {exitcode}. Response: {result}")
        if isinstance(result, str):
            result = MessageDict(content=result, role="assistant", generated_by="llm", step=self.task_name, assistant_name=self.agent.name)
        task_outputs = LLMChatOutput(content=[result])

        if exitcode in self.exit_codes:
            return TaskResponse(
                task_id=self.id if self.id else '',
                task_name=self.task_name,
                task_description=self.task_description,
                status="complete",
                result_code=exitcode,
                task_outputs=str(task_outputs),
                task_content=task_outputs,
                task_inputs=initial_inputs,
                result_diagnostic="Task executed.",
                execution_history=kwargs.get("execution_history", [])
            )
        return TaskResponse(
            task_id=self.id if self.id else '',
            task_name=self.task_name,
            task_description=self.task_description,
            status="failed",
            result_code=exitcode,
            task_outputs=str(task_outputs),
            task_content=task_outputs,
            task_inputs=initial_inputs,
            result_diagnostic=f"Exit code not found.",
            execution_history=kwargs.get("execution_history", [])
        )

    def update_agent(self, max_rounds=None):
        if max_rounds:
            self.agent.max_consecutive_auto_reply = max_rounds
        self.update_agent_human_input()
    
    def update_agent_human_input(self) -> None:
        # if self.human_input:
        #     self.agent.human_input_mode = "ALWAYS"
        # else:
            self.agent.human_input_mode = "NEVER"
    
    async def generate_agent_response(self, messages: List[MessageDict], api_manager, max_rounds: int = 1, **kwargs) -> Tuple[str, int]:
        LOGGER.info(f"Generating response by {self.agent.name} from messages: {messages}")  
        self.update_agent(max_rounds)
        messages = messages_to_autogen_compatible(messages)
        result = await self.agent.get_autogen_agent(api_manager=api_manager).a_generate_reply(messages)
        if result:
            if isinstance(result, str):
                return result, 0
            elif isinstance(result, dict):
                return result.get("content"), 0
        return "", 1