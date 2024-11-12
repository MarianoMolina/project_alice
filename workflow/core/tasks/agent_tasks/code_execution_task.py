from pydantic import Field
from typing import List, Optional
from workflow.util import LOGGER, get_traceback, Language
from workflow.core.data_structures import (
    MessageDict, ApiType, References, NodeResponse, TasksEndCodeRouting
)
from workflow.core.tasks.agent_tasks.prompt_agent_task import PromptAgentTask
from workflow.core.agent.agent import AliceAgent

class CodeExecutionLLMTask(PromptAgentTask):
    """
    A task for executing code that is extracted from a prompt or previous outputs.
    """
    agent: AliceAgent = Field(..., description="The agent to use for the task")
    task_name: str = Field("execute_code", description="The name of the task")
    exit_codes: dict[int, str] = Field({0: "Success", 1: "Execution failed."}, description="A dictionary of exit codes for the task")
    valid_languages: list[Language] = Field([Language.PYTHON, Language.SHELL], description="A list of valid languages for code execution")
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
                )]),
                execution_order=len(execution_history)
            )

        try:
            code_execs, exit_code = await self.agent.process_code_execution(messages)
            return NodeResponse(
                parent_task_id=self.id,
                node_name="code_execution",
                exit_code=exit_code,
                references=References(code_executions=code_execs),
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