from pydantic import Field
from typing import List, Dict
from workflow.util import LOGGER
from workflow.core.data_structures import (
    MessageDict, TasksEndCodeRouting
)
from workflow.core.tasks.agent_tasks.prompt_agent_task import PromptAgentTask

class CheckTask(PromptAgentTask):
    """
    A specialized PromptAgentTask that uses the LLM to perform validation checks
    against specific criteria.

    This task simplifies the PromptAgentTask pattern to a single LLM node that
    looks for specific approval/failure strings in the response. It's ideal for
    validation, moderation, or quality check scenarios.

    Node Structure:
    --------------
    1. llm_generation:
        - Single node that processes input and checks response
        - Looks for predefined strings (default: "APPROVED" or "FAILED")
        - Exit codes mapped directly from response content:
            * 0: Response contains approval string
            * 1: Response contains failure string or no match

    Key Features:
    -------------
    * Simple Validation:
        - Configurable success/failure strings
        - Direct exit code mapping
        - Clear response expectations

    Attributes:
    -----------
    exit_code_response_map : Dict[str, int]
        Maps response strings to exit codes (default: {"APPROVED": 0, "FAILED": 1})

    Example:
    --------
    ```python
    check_task = CheckTask(
        agent=agent,
        task_name="content_check",
        task_description="Check content against guidelines",
        templates={
            "task_template": Prompt(
                content="Review this content and respond APPROVED or FAILED: {{prompt}}"
            )
        }
    )
    ```
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

    def get_llm_exit_code(self, message: MessageDict) -> int:
        if not message:
            LOGGER.warning(f"Invalid input for task {self.task_name}. Returning default failure code.")
            return 1

        content = message.content.upper()
        for key, value in self.exit_code_response_map.items():
            normalized_key = ' '.join(key.upper().split())  # Normalize whitespace
            if normalized_key in content:
                LOGGER.info(f"Found matching response '{key}' for task {self.task_name}. Returning exit code {value}.")
                return value

        LOGGER.warning(f"No matching response found for task {self.task_name}. Returning default failure code.")
        return 1
