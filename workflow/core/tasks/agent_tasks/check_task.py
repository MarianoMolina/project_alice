from pydantic import Field
from typing import List, Dict
from workflow.util import LOGGER
from workflow.core.data_structures import (
    MessageDict, TasksEndCodeRouting
)
from workflow.core.tasks.agent_tasks.prompt_agent_task import PromptAgentTask

class CheckTask(PromptAgentTask):
    """
    A specialized task for checking if the generated output includes certain strings.
    """
    task_name: str = Field("check_output", description="The name of the task")
    exit_code_response_map: Dict[str, int] = Field(
        {"APPROVED": 0, "FAILED": 1},
        description="A dictionary of exit codes mapped to string responses for the task."
    )
    start_node: str = Field(default='llm_generation', description="The name of the starting node")
    node_end_code_routing: TasksEndCodeRouting = Field(default={
        'llm_generation': {
            0: (None, False),
            1: ('llm_generation', True),
        }
    }, description="A dictionary of tasks/nodes -> exit codes and the task to route to given each exit code")

    def get_llm_exit_code(self, chat_output: List[MessageDict], response_code: bool) -> int:
        if not response_code or not chat_output or not chat_output[-1].content:
            LOGGER.warning(f"Invalid input for task {self.task_name}. Returning default failure code.")
            return 1

        content = chat_output[-1].content.upper()
        for key, value in self.exit_code_response_map.items():
            normalized_key = ' '.join(key.upper().split())  # Normalize whitespace
            if normalized_key in content:
                LOGGER.info(f"Found matching response '{key}' for task {self.task_name}. Returning exit code {value}.")
                return value

        LOGGER.warning(f"No matching response found for task {self.task_name}. Returning default failure code.")
        return 1
