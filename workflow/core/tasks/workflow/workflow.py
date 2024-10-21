from typing import Dict, Any, Optional, List, Callable, Union, Tuple
from pydantic import Field
from workflow.core.data_structures import References
from workflow.core.data_structures.task_response import TaskResponse, NodeResponse
from workflow.core.data_structures.user_interaction import UserInteraction
from workflow.util import LOGGER
from workflow.core.tasks.task import AliceTask
from workflow.util.utils import generate_node_responses_summary, get_traceback

class Workflow(AliceTask):
    """
    Represents a sequence of tasks that are executed in a defined order.

    This class inherits from AliceTask, allowing it to be used as part of another workflow.
    It manages the execution flow of multiple tasks, handling task selection, execution,
    and result processing.

    Attributes:
        tasks (Dict[str, AliceTask]): A dictionary of tasks in the workflow.
        start_node (Optional[str]): The name of the starting task.
        task_selection_method (Optional[Callable]): A method to select the next task based on the current task's response.
        node_end_code_routing (Optional[Dict]): A dictionary defining task routing based on exit codes.
        max_attempts (int): Maximum number of failed task attempts before the workflow is considered failed.
        recursive (bool): Whether the workflow can be executed recursively.

    Methods:
        run: Execute the workflow and return a TaskResponse.
        execute_workflow: Core method for workflow execution.
        find_task_by_name: Utility method to find a task by its name.
        get_initial_task_name: Determine the first task to execute.
        execute_task: Execute a single task within the workflow.
        get_next_task: Determine the next task to execute based on the current task's result.
        create_workflow_response: Create a TaskResponse object for the entire workflow.
        select_next_task: Select the next task based on defined logic or routing.
    """
    tasks: Dict[str, AliceTask] = Field(..., description="A dictionary of tasks in the workflow")
    start_node: Optional[str] = Field(None, description="The name of the starting task")
    task_selection_method: Optional[Callable[[TaskResponse, List[Dict[str, Any]]], Optional[str]]] = Field(None, description="A method to select the next task based on the current task's response")
    node_end_code_routing: Optional[Dict[str, Dict[Union[str, int], Union[Tuple[Optional[str], bool], List[Optional[Union[str, bool]]]]]]] = Field(None, description="A dictionary of tasks -> exit codes and the task to route to given each exit code and a bool to determine if the outcome represents an extra 'try' at the task. If a selection method is provided, this isn't used")
    max_attempts: int = Field(3, description="The maximum number of failed task attempts before the workflow is considered failed. Default is 3.")
    recursive: bool = Field(False, description="Whether the workflow can be executed recursively. By default, tasks are recursive but workflows are not, unless one is expected to be used within another workflow")

    def find_task_by_name(self, task_name: str) -> Optional[AliceTask]:
        """
        Utility method to find a task by its name.
        """
        for task in self.tasks.values():
            if task.task_name == task_name:
                return task
        return None

    async def run(self, **kwargs) -> TaskResponse:
        """
        Execute the workflow and return a TaskResponse.

        This method initiates the workflow execution, processes all tasks,
        and returns a comprehensive response for the entire workflow.

        Args:
            **kwargs: Additional keyword arguments passed to the tasks.

        Returns:
            TaskResponse: A response object containing the results of the entire workflow.
        """
        task_inputs = kwargs.copy()
        execution_history = kwargs.pop('execution_history', [])
        
        if not execution_history:
            initial_task_name = self.get_initial_task()
        else:
            node_list = [NodeResponse(**node) for node in execution_history if node.get('parent_task_id') == self.id]
            if not node_list:
                initial_task_name = self.get_initial_task()
            else:
                sorted_nodes = sorted(node_list, key=lambda x: x.execution_order)
                last_node = sorted_nodes[-1]
                if last_node.references.user_interactions:
                    last_interaction = last_node.references.user_interactions[-1]
                    initial_task_name, _ = self.select_next_task(last_interaction, sorted_nodes)
                elif last_node.references.task_responses:
                    last_task_response = last_node.references.task_responses[-1]
                    initial_task_name, _ = self.select_next_task(last_task_response, sorted_nodes)
                else:
                    initial_task_name = self.get_initial_task()

        tasks_performed, status, diagnostic = await self.execute_workflow(initial_task_name, execution_history=execution_history, **kwargs)
        str_output = generate_node_responses_summary(tasks_performed)
        end_code = 0 if status == "complete" else 1
        return self.get_task_response(str_output, end_code, diagnostic, status, tasks_performed, **task_inputs)

    async def execute_workflow(self, initial_task_name: str, execution_history: List[Dict[str, Any]] = None, **kwargs) -> Tuple[List[NodeResponse], str, str]:
        attempts = 1
        current_task_name = initial_task_name
        node_references: List[NodeResponse] = []
        execution_order: int = 0

        if execution_history:
            node_references = [NodeResponse(**node) for node in execution_history if node.get('parent_task_id') == self.id]
            execution_order = max([node.execution_order for node in node_references]) + 1 if node_references else 0

        try:
            while current_task_name:
                user_checkpoint = self.handle_user_checkpoints(node_references, current_task_name)
                if user_checkpoint:
                    return node_references, "pending", "User interaction checkpoint reached."

                # Execute the current task and get the result
                task_result = await self.execute_task(current_task_name, **kwargs)

                node = NodeResponse(
                    parent_task_id=self.id,
                    node_name=current_task_name,
                    exit_code=task_result.result_code,
                    references=References(task_responses=[task_result]),
                    execution_order=execution_order
                )
                node_references.append(node)
                execution_order += 1
                
                current_task_name, try_bool = self.select_next_task(task_result, node_references)
                
                if try_bool:
                    attempts += 1
                    if attempts > self.max_attempts:
                        return node_references, "failed", "Workflow ended due to maximum attempts reached."

            return node_references, "complete", "Workflow completed successfully"

        except Exception as e:
            return node_references, "failed", f"Error: {str(e)}\nTraceback: {get_traceback()}"

    def get_initial_task(self) -> Optional[str]:
        """
        Determine the name of the initial task to be executed in the workflow.

        Returns:
            Tuple[Optional[str], bool]: A tuple containing:
                - The name of the initial task (or None if not found)
                - A boolean indicating whether this is a retry (always False for initial task)
        """
        return self.start_node if self.start_node else self.select_next_task(None, None)[0]

    async def execute_task(self, task_name: str, **kwargs) -> TaskResponse:
        """
        Execute a single task within the workflow.

        Args:
            task_name (str): The name of the task to execute.
            **kwargs: Additional keyword arguments to pass to the task.

        Returns:
            TaskResponse: The response from the executed task.

        Raises:
            ValueError: If the specified task is not found in the workflow.
        """
        current_task = self.find_task_by_name(task_name)
        if not current_task:
            raise ValueError(f"Task {task_name} not found in the workflow.")
        return await current_task.run(**kwargs)

    def select_next_task(self, response: Optional[Union[TaskResponse, UserInteraction]], node_references: Optional[List[NodeResponse]]) -> Tuple[Optional[str], bool]:
        """
        Select the next task based on the task selection method or routing configuration.

        Args:
            response (Optional[Union[TaskResponse, UserInteraction]]): The response from the previous task or user interaction.
            node_references (Optional[List[NodeResponse]]): A list of node references from previous executions.

        Returns:
            Tuple[Optional[str], bool]: A tuple containing:
                - The name of the next task to execute (or None if workflow is complete)
                - A boolean indicating whether this is a retry attempt

        Raises:
            ValueError: If neither task_selection_method nor node_end_code_routing is defined.
        """
        if self.task_selection_method:
            return self.task_selection_method(response, node_references)
        if not self.node_end_code_routing:
            raise ValueError("Either the task_selection_method or the node_end_code_routing needs to be defined.")
        
        if response is None:
            return self.get_initial_task_name()

        return self.get_next_task_from_routing(response)

    def get_initial_task_name(self) -> Tuple[Optional[str], bool]:
        if self.start_node:
            return self.start_node, False
        LOGGER.info("No start task defined, selecting the first task.")
        return next(iter(self.tasks.values())).task_name, False

    def get_next_task_from_routing(self, response: Union[TaskResponse, UserInteraction]) -> Tuple[Optional[str], bool]:
        """
        Determine the next task based on the routing configuration or user checkpoint.

        Args:
            response (Union[TaskResponse, UserInteraction]): The response from the previous task or user interaction.

        Returns:
            Tuple[Optional[str], bool]: A tuple containing:
                - The name of the next task to execute (or None if workflow is complete)
                - A boolean indicating whether this is a retry attempt

        Raises:
            ValueError: If the task is not found in the workflow routing or if the user checkpoint is not found.
        """
        if isinstance(response, UserInteraction):
            # Handle user interaction routing
            if response.user_response is None:
                return None, False  # User interaction is not completed yet
            
            checkpoint = next((cp for cp in self.user_checkpoints.values() if cp.id == response.user_checkpoint_id), None)
            if checkpoint is None:
                raise ValueError(f"User checkpoint {response.user_checkpoint_id} not found.")
            
            selected_option = response.user_response.selected_option
            if selected_option not in checkpoint.task_next_obj:
                raise ValueError(f"Selected option {selected_option} not found in user checkpoint routing.")
            
            next_task = checkpoint.task_next_obj[selected_option]
            return next_task, False  # User interactions don't have retry logic
        
        else:  # TaskResponse
            task_name = response.task_name
            if task_name not in self.node_end_code_routing:
                raise ValueError(f"Task {task_name} not found in the workflow routing.")

            result_code = response.result_code
            task_routing = self.node_end_code_routing[task_name]

            next_task_info = self.get_next_task_info(task_routing, result_code)
            return self.parse_next_task_info(next_task_info)

    def get_next_task_info(self, task_routing: Dict[Union[str, int], Union[Tuple[Optional[str], bool], List[Optional[Union[str, bool]]]]], result_code: Union[str, int]) -> Union[Tuple[Optional[str], bool], List[Optional[Union[str, bool]]]]:
        """
        Retrieve the next task information based on the task routing and result code.

        Args:
            task_routing (Dict): The routing configuration for the current task.
            result_code (Union[str, int]): The result code from the previous task execution.

        Returns:
            Union[Tuple[Optional[str], bool], List[Optional[Union[str, bool]]]]: Information about the next task.

        Raises:
            ValueError: If the result code is not found in the task routing.
        """
        if result_code in task_routing:
            return task_routing[result_code]
        try:
            if int(result_code) in task_routing:
                return task_routing[int(result_code)]
        except:
            raise ValueError(f"Exit code {result_code} not found in task routing.")
        
        converted_result_code = result_code if isinstance(result_code, int) else int(result_code)
        if converted_result_code in task_routing:
            return task_routing[converted_result_code]
        elif str(converted_result_code) in task_routing:
            return task_routing[str(converted_result_code)]
        
        raise ValueError(f"Exit code {result_code} not found in task routing.")

    def parse_next_task_info(self, next_task_info: Union[Tuple[Optional[str], bool], List[Optional[Union[str, bool]]]]) -> Tuple[Optional[str], bool]:
        """
        Parse the next task information into a standardized format.

        Args:
            next_task_info (Union[Tuple[Optional[str], bool], List[Optional[Union[str, bool]]]]): Raw next task information.

        Returns:
            Tuple[Optional[str], bool]: A tuple containing:
                - The name of the next task (or None if workflow is complete)
                - A boolean indicating whether this is a retry attempt
        """
        if isinstance(next_task_info, tuple):
            next_task, try_bool = next_task_info
        else:
            next_task, try_bool = next_task_info[0], next_task_info[1] if len(next_task_info) > 1 else False

        self.validate_next_task(next_task)
        return next_task, try_bool

    def validate_next_task(self, next_task: Optional[str]):
        """
        Validate that the next task exists in the workflow.

        Args:
            next_task (Optional[str]): The name of the next task to validate.

        Raises:
            ValueError: If the specified task is not found in the workflow.
        """
        if next_task and self.find_task_by_name(next_task) is None:
            raise ValueError(f"Selected task {next_task} not found in the workflow.")
