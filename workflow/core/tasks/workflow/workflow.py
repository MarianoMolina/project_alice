from typing import Dict, Any, Optional, List
from pydantic import Field
from workflow.core.data_structures import References, NodeResponse
from workflow.util import LOGGER
from workflow.util.utils import get_traceback
from workflow.core.tasks import AliceTask

class Workflow(AliceTask):
    """
    A specialized AliceTask implementation that orchestrates multiple tasks in a defined sequence.

    Workflow extends AliceTask to manage a collection of tasks that execute in a coordinated manner.
    It treats each task as a node in its execution flow, automatically handling variable passing
    between tasks and managing the overall execution state.

    Key Features:
    -------------
    * Task Orchestration:
        - Executes multiple tasks in sequence
        - Manages data flow between tasks
        - Handles task dependencies

    * Variable Management:
        - Automatic variable passing between tasks
        - Type validation and conversion
        - Context preservation across task boundaries

    * Execution Control:
        - Task-level retry logic
        - Error propagation and handling
        - State management across tasks

    Attributes:
    -----------
    tasks : Dict[str, AliceTask]
        Collection of tasks to be executed (Required)
        
    recursive : bool
        Always False for workflows to prevent infinite loops
        
    node_end_code_routing : TasksEndCodeRouting
        Routing rules for task execution sequence

    Example:
    --------
    ```python
    workflow = Workflow(
        task_name="data_processing",
        task_description="Process and analyze data",
        tasks={
            "fetch_data": DataFetchTask(),
            "analyze_data": AnalysisTask(),
            "generate_report": ReportTask()
        },
        node_end_code_routing={
            'fetch_data': {
                0: ('analyze_data', False),
                1: ('fetch_data', True)
            },
            'analyze_data': {
                0: ('generate_report', False),
                1: ('analyze_data', True)
            },
            'generate_report': {
                0: (None, False),
                1: ('generate_report', True)
            }
        }
    )
    ```

    Notes:
    ------
    1. Task Management:
        - Each task becomes a node in the workflow
        - Tasks must be instances of AliceTask
        - Task names must be unique

    2. Data Flow:
        - Variables can flow between tasks
        - Type checking is performed automatically
        - Task outputs can be used as inputs for subsequent tasks

    3. Error Handling:
        - Task-level errors are captured and managed
        - Workflow can retry failed tasks
        - Error states are preserved in workflow history

    4. Implementation:
        - No need to implement individual node methods
        - Tasks define their own execution logic
        - Workflow manages orchestration automatically
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
            # We don't pass the node responses because the task inputs are already validated in the kwargs
            # And the task's run method should not be aware of the prior nodes in the workflow beyond kwarg variables
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