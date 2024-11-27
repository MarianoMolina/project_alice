from typing import Dict, Any, Optional, List
from pydantic import Field
from workflow.core.data_structures import References, NodeResponse
from workflow.util import LOGGER
from workflow.util.utils import get_traceback
from workflow.core.tasks import AliceTask

class Workflow(AliceTask):
    """
    Represents a sequence of tasks that are executed in a defined order.
    Provides automatic variable passing between tasks based on node names and input requirements.
    """
    tasks: Dict[str, AliceTask] = Field(..., description="A dictionary of tasks in the workflow")
    recursive: bool = Field(False, description="Whether the workflow can be executed recursively")

    async def execute_node(self, node_name: str, execution_history: List[NodeResponse], node_responses: List[NodeResponse], **kwargs) -> NodeResponse:
        """
        Executes a task as a node within the workflow, handling variable passing between tasks.
        """
        # Check for user interaction checkpoints
        user_interaction = self.handle_user_checkpoints(execution_history, node_name)
        if user_interaction:
            return user_interaction

        try:
            # Find the task
            current_task = self.find_task_by_name(node_name)
            if not current_task:
                raise ValueError(f"Task {node_name} not found in workflow.")

            # Execute the task using the common input validation logic
            task_result = await current_task.run(
                execution_history=execution_history,
                **kwargs
            )

            # Create node response
            node_response = NodeResponse(
                parent_task_id=self.id,
                node_name=node_name,
                exit_code=task_result.result_code,
                references=References(task_responses=[task_result]),
                execution_order=len(execution_history)
            )

            return node_response

        except Exception as e:
            LOGGER.error(f"Error executing task {node_name}: {str(e)}\n{get_traceback()}")
            return NodeResponse(
                parent_task_id=self.id,
                node_name=node_name,
                exit_code=1,
                references=References(
                    messages=[{
                        "role": "system",
                        "content": f"Error executing task: {str(e)}\n\n" + get_traceback(),
                        "generated_by": "system"
                    }]
                ),
                execution_order=len(execution_history)
            )
        
    def find_task_by_name(self, task_name: str) -> Optional[AliceTask]:
        """Finds a task in the workflow by its name."""
        for task in self.tasks.values():
            if task.task_name == task_name:
                return task
        return None