from typing import List, Optional
from pydantic import Field
from workflow.core.tasks.task import AliceTask
from workflow.core.data_structures import TaskResponse, NodeResponse, References
from workflow.core.data_structures.base_models import TasksEndCodeRouting
from workflow.util import LOGGER, generate_node_responses_summary

class NodeBasedTask(AliceTask):
    """
    A base class for tasks that follow a node-based execution model.

    This class extends AliceTask to provide a framework for tasks that are composed
    of multiple execution nodes. It manages the flow between these nodes based on
    their execution results and predefined routing rules.

    Attributes:
        start_node (Optional[str]): The name of the initial node to execute.
        node_end_code_routing (TasksEndCodeRouting): A dictionary defining the routing
            logic between nodes based on their exit codes.

    Methods:
        run: Main method to execute the task, managing the flow between nodes.
        execute_node: Executes a single node within the task.
        get_next_node: Determines the next node to execute based on the current node's result.
        create_partial_response: Creates a TaskResponse for a partially completed task.
        create_final_response: Creates a TaskResponse for a fully completed task.
        get_final_exit_code: Determines the final exit code for the entire task.
        get_last_node_by_name: Retrieves the last executed node with a specific name.
        get_node_reference: Retrieves the references from a specific node.

    The NodeBasedTask class provides a robust framework for defining complex,
    multi-step tasks with conditional logic between steps. It supports features
    such as error handling, user interactions, and detailed execution tracking.
    """
    start_node: Optional[str] = Field(default=None, description="The name of the starting node")
    node_end_code_routing: TasksEndCodeRouting = Field(default={}, description="A dictionary of tasks/nodes -> exit codes and the task to route to given each exit code")

    async def run(self, execution_history: List[NodeResponse] = None, **kwargs) -> TaskResponse:
        """
        Executes the task by running through its nodes based on the defined routing logic.

        This method manages the overall execution flow of the task, moving from one
        node to the next based on each node's exit code and the defined routing rules.

        Args:
            execution_history (List[NodeResponse], optional): A list of previously
                executed nodes, used for continuing partially completed tasks.
            **kwargs: Additional keyword arguments passed to the nodes.

        Returns:
            TaskResponse: A response object containing the results of the entire task execution.
        """
        execution_history = execution_history or []
        node_responses: List[NodeResponse] = []
        node_name = kwargs.pop("node_name", None)
        current_node = node_name or self.start_node or "default"

        while current_node:
            node_response = await self.execute_node(current_node, execution_history, node_responses, **kwargs)
            if node_response.references and node_response.references.user_interactions:
                # User interaction required, return current state
                return self.create_partial_response(node_responses, "pending", **kwargs)

            node_responses.append(node_response)
            current_node = self.get_next_node(current_node, node_response.exit_code)

        return self.create_final_response(node_responses, **kwargs)

    async def execute_node(self, node_name: str, execution_history: List[NodeResponse], node_responses: List[NodeResponse], **kwargs) -> NodeResponse:
        """
        Executes a single node within the task.

        This method is responsible for running the logic of a specific node. It
        handles user checkpoints and calls the appropriate node-specific method.

        Args:
            node_name (str): The name of the node to execute.
            execution_history (List[NodeResponse]): The full execution history of the task.
            node_responses (List[NodeResponse]): The responses from previously executed nodes in this run.
            **kwargs: Additional keyword arguments passed to the node.

        Returns:
            NodeResponse: The response from the executed node.
        """
        # Check for user checkpoint
        user_interaction = self.handle_user_checkpoints(execution_history, node_name)
        if user_interaction:
            return user_interaction

        # Execute node-specific logic
        method_name = f"execute_{node_name}"
        if hasattr(self, method_name):
            return await getattr(self, method_name)(execution_history, node_responses, **kwargs)
        else:
            LOGGER.error(f"No method found for node: {node_name}")
            return NodeResponse(parent_task_id=self.id, node_name=node_name, exit_code=1, execution_order=len(execution_history) + len(node_responses))

    def get_next_node(self, current_node: str, exit_code: int) -> Optional[str]:
        routing = self.node_end_code_routing.get(current_node, {})
        next_node, _ = routing.get(exit_code, (None, False))
        return next_node

    def create_partial_response(self, node_responses: List[NodeResponse], status: str, **kwargs) -> TaskResponse:
        return self.get_task_response(
            task_outputs=generate_node_responses_summary(node_responses),
            result_code=1,
            diagnostics='User interaction required.',
            status=status,
            node_references=node_responses,
            **kwargs
        )

    def create_final_response(self, node_responses: List[NodeResponse], **kwargs) -> TaskResponse:
        exit_code = self.get_final_exit_code(node_responses)
        return self.get_task_response(
            task_outputs=generate_node_responses_summary(node_responses),
            result_code=exit_code,
            diagnostics="Task executed successfully." if exit_code == 0 else "Task execution failed.",
            status="complete" if exit_code == 0 else "failed",
            node_references=node_responses,
            **kwargs
        )

    def get_final_exit_code(self, node_responses: List[NodeResponse]) -> int:
        return 1 if any(node.exit_code != 0 for node in node_responses) else 0

    def get_last_node_by_name(self, node_responses: List[NodeResponse], node_name: str) -> Optional[NodeResponse]:
        for node in reversed(node_responses):
            if node.node_name == node_name:
                return node
        return None

    def get_node_reference(self, node_responses: List[NodeResponse], node_name: str) -> Optional[References]:
        node = self.get_last_node_by_name(node_responses, node_name)
        if node:
            return node.references
        LOGGER.error(f"No node found with name: {node_name}")
        return None