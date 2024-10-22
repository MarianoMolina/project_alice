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

            # Get input variables required by the task
            required_vars = current_task.input_variables.required
            var_types = {
                name: props.type 
                for name, props in current_task.input_variables.properties.items()
            }

            # Prepare execution kwargs with variable passing
            execution_kwargs = self.prepare_task_variables(
                node_name=node_name,
                required_vars=required_vars,
                var_types=var_types,
                execution_history=execution_history + node_responses,
                current_kwargs=kwargs
            )

            # Execute the task
            task_result = await current_task.run(
                execution_history=execution_history + node_responses,
                **execution_kwargs
            )

            # Create node response
            node_response = NodeResponse(
                parent_task_id=self.id,
                node_name=node_name,
                exit_code=task_result.result_code,
                references=References(task_responses=[task_result]),
                execution_order=len(execution_history) + len(node_responses)
            )

            # Update the kwargs if this node's name exists as a variable
            if node_name in kwargs:
                # Get the value from node references
                try:
                    value = node_response.references.summary()
                    # Convert to the same type as the existing variable
                    var_type = type(kwargs[node_name])
                    kwargs[node_name] = var_type(value)
                    LOGGER.debug(f"Updated existing variable {node_name} with new value from node execution")
                except (ValueError, TypeError) as e:
                    LOGGER.warning(f"Failed to update variable {node_name} with node output: {e}")

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
                        "content": f"Error executing task: {str(e)}",
                        "generated_by": "system"
                    }]
                ),
                execution_order=len(execution_history) + len(node_responses)
            )

    def prepare_task_variables(self, node_name: str, required_vars: List[str], 
                             var_types: Dict[str, str], execution_history: List[NodeResponse],
                             current_kwargs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepares variables for task execution by checking execution history and current kwargs.

        Args:
            node_name (str): Name of the current task/node
            required_vars (List[str]): List of required variable names
            var_types (Dict[str, str]): Mapping of variable names to their expected types
            execution_history (List[NodeResponse]): Full execution history including current run
            current_kwargs (Dict[str, Any]): Currently provided kwargs

        Returns:
            Dict[str, Any]: Updated kwargs with required variables
        """
        execution_kwargs = current_kwargs.copy()

        for var_name in required_vars:
            # Skip if variable is already provided and no matching node exists
            if var_name in execution_kwargs and not any(
                node.node_name == var_name for node in execution_history
            ):
                continue

            # Look for matching node in history
            matching_node = next(
                (node for node in reversed(execution_history)
                 if node.node_name == var_name and node.references),
                None
            )

            if matching_node:
                try:
                    # Get the value from node references
                    value = matching_node.references.summary()
                    # Convert to expected type
                    if var_types.get(var_name) == "string":
                        value = str(value)
                    elif var_types.get(var_name) == "integer":
                        value = int(value)
                    elif var_types.get(var_name) == "number":
                        value = float(value)
                    
                    # Update the kwargs with the new value
                    execution_kwargs[var_name] = value
                    LOGGER.debug(f"Updated variable {var_name} for task {node_name} with value from node {matching_node.node_name}")
                except (ValueError, TypeError) as e:
                    LOGGER.warning(f"Failed to convert value for {var_name} to type {var_types.get(var_name)}: {e}")
            elif var_name not in execution_kwargs:
                LOGGER.warning(f"Required variable {var_name} not found in execution history or kwargs for task {node_name}")

        return execution_kwargs

    def find_task_by_name(self, task_name: str) -> Optional[AliceTask]:
        """Finds a task in the workflow by its name."""
        for task in self.tasks.values():
            if task.task_name == task_name:
                return task
        return None