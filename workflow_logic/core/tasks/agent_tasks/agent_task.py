import logging
from typing import Optional, List, Tuple
from pydantic import Field
from autogen.agentchat import ConversableAgent
from workflow_logic.core.communication import StringOutput, LLMChatOutput, MessageDict, TaskResponse
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

    @property
    def agent(self) -> ConversableAgent:
        return self.agent.get_autogen_agent()
    
    def run(self, messages: List[MessageDict],  **kwargs) -> TaskResponse:
        if not messages:
            return TaskResponse(
                task_name=self.task_name,
                task_description=self.task_description,
                status="failed",
                result_code=1,
                result_diagnostic="Failed to initialize messages.",
                execution_history=kwargs.get("execution_history", [])
            )
        self.update_agent_human_input()
        logging.info(f'Executing task: {self.task_name}')
        task_inputs = messages.copy()
        result, exitcode = self.generate_agent_response(messages=messages, max_rounds=1, **kwargs)
        logging.info(f"Task {self.task_name} executed with exit code: {exitcode}. Response: {result}")
        task_outputs = StringOutput(content=[result]) if isinstance(result, str) else LLMChatOutput(content=result)
        messages.append(MessageDict(content=result, role="assistant", generated_by="llm", step=self.task_name, assistant_name=self.agent.name))

        if exitcode in self.exit_codes:
            return TaskResponse(
                task_name=self.task_name,
                task_description=self.task_description,
                status="complete",
                result_code=exitcode,
                task_outputs=str(task_outputs),
                task_content=task_outputs,
                task_inputs=task_inputs,
                result_diagnostic="Task executed.",
                execution_history=kwargs.get("execution_history", [])
            )
        return TaskResponse(
            task_name=self.task_name,
            task_description=self.task_description,
            status="failed",
            result_code=exitcode,
            task_outputs=str(task_outputs),
            task_content=task_outputs,
            task_inputs=task_inputs,
            result_diagnostic=f"Exit code not found.",
            execution_history=kwargs.get("execution_history", [])
        )
    
    def update_agent_human_input(self) -> None:
        if self.human_input:
            self.agent.human_input_mode = "ALWAYS"
        else:
            self.agent.human_input_mode = "NEVER"
    
    def generate_agent_response(self, messages: List[dict], max_rounds: int = 1, **kwargs) -> Tuple[str, int]:
        logging.info(f"Generating response by {self.agent.name} from messages: {messages}")  
        self.agent.update_max_consecutive_auto_reply(max_rounds)
        result = self.agent.generate_reply(messages)
        if result:
            if isinstance(result, str):
                return result, 0
            elif isinstance(result, dict):
                return result.get("content"), 0
        return "", 1