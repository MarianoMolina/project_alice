from typing import Dict, Any, Optional, List, Callable, Union, Tuple
from pydantic import Field
from workflow_logic.util import TaskResponse, WorkflowOutput, LOGGER
from workflow_logic.core.tasks.task import AliceTask

class Workflow(AliceTask):
    """
    Represents a sequence of tasks that are executed in a defined order.

    This class inherits from AliceTask, allowing it to be used as part of another workflow.
    It manages the execution flow of multiple tasks, handling task selection, execution,
    and result processing.

    Attributes:
        tasks (Dict[str, AliceTask]): A dictionary of tasks in the workflow.
        start_task (Optional[str]): The name of the starting task.
        task_selection_method (Optional[Callable]): A method to select the next task based on the current task's response.
        tasks_end_code_routing (Optional[Dict]): A dictionary defining task routing based on exit codes.
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
    start_task: Optional[str] = Field(None, description="The name of the starting task")
    task_selection_method: Optional[Callable[[TaskResponse, List[Dict[str, Any]]], Optional[str]]] = Field(None, description="A method to select the next task based on the current task's response")
    tasks_end_code_routing: Optional[Dict[str, Dict[Union[str, int], Union[Tuple[Optional[str], bool], List[Optional[Union[str, bool]]]]]]] = Field(None, description="A dictionary of tasks -> exit codes and the task to route to given each exit code and a bool to determine if the outcome represents an extra 'try' at the task. If a selection method is provided, this isn't used")
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
        tasks_performed, status, diagnostic = await self.execute_workflow(**kwargs)
        return self.create_workflow_response(tasks_performed, status, diagnostic, **task_inputs)

    async def execute_workflow(self, **kwargs) -> Tuple[List[TaskResponse], str, str]:
        """
        Core method for executing the workflow.

        This method manages the flow of task execution, including task selection,
        execution, and handling of results and errors.

        Args:
            **kwargs: Additional keyword arguments passed to the tasks.

        Returns:
            Tuple[List[TaskResponse], str, str]: A tuple containing:
                - List of TaskResponse objects for all executed tasks
                - Status of the workflow execution ("complete" or "failed")
                - Diagnostic information or error message
        """
        tasks_performed = []
        attempts = 1
        current_task_name, bool = self.get_initial_task_name()

        try:
            while current_task_name:
                task_result = await self.execute_task(current_task_name, **kwargs)
                tasks_performed.append(task_result)
                kwargs = self.update_kwargs(kwargs, current_task_name, task_result)
                
                current_task_name, try_bool = self.get_next_task(task_result, tasks_performed)
                
                if try_bool:
                    attempts += 1
                    if attempts > self.max_attempts:
                        return tasks_performed, "failed", "Workflow ended due to maximum attempts reached."

            return tasks_performed, "complete", "Workflow completed successfully"

        except Exception as e:
            return tasks_performed, "failed", f"Error: {str(e)}\nTraceback: {self.get_traceback()}"

    def get_initial_task(self) -> Optional[str]:
        """
        Determine the name of the initial task to be executed in the workflow.

        Returns:
            Tuple[Optional[str], bool]: A tuple containing:
                - The name of the initial task (or None if not found)
                - A boolean indicating whether this is a retry (always False for initial task)
        """
        return self.start_task if self.start_task else self.select_next_task(None, None)[0]

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

    def update_kwargs(self, kwargs: Dict[str, Any], task_name: str, task_result: TaskResponse) -> Dict[str, Any]:
        """
        Update the keyword arguments with the results of the latest task execution.

        Args:
            kwargs (Dict[str, Any]): The current keyword arguments.
            task_name (str): The name of the task that was just executed.
            task_result (TaskResponse): The result of the task execution.

        Returns:
            Dict[str, Any]: Updated keyword arguments including the latest task output.
        """
        kwargs[f'outputs_{task_name}'] = str(task_result.task_outputs) if task_result.task_outputs else None
        return kwargs

    def get_next_task(self, task_result: TaskResponse, tasks_performed: List[TaskResponse]) -> Tuple[Optional[str], bool]:
        """
        Determine the next task to be executed based on the current task's result.

        Args:
            task_result (TaskResponse): The result of the most recently executed task.
            tasks_performed (List[TaskResponse]): A list of all tasks performed so far.

        Returns:
            Tuple[Optional[str], bool]: A tuple containing:
                - The name of the next task to execute (or None if workflow is complete)
                - A boolean indicating whether this is a retry attempt
        """
        next_task_info = self.select_next_task(task_result, tasks_performed)
        return next_task_info

    def create_workflow_response(self, tasks_performed: List[TaskResponse], status: str, diagnostic: str, **kwargs) -> TaskResponse:
        exec_history = kwargs.pop("execution_history", None)
        kwargs.pop("api_manager", None)
        return TaskResponse(
            task_id=self.id if self.id else '',
            task_name=self.task_name,
            task_description=self.task_description,
            status=status,
            result_code=1 if status == "failed" else 0,
            task_outputs=str(WorkflowOutput(content=tasks_performed)),
            task_content=WorkflowOutput(content=tasks_performed),
            task_inputs=kwargs,
            result_diagnostic=diagnostic,
            execution_history=exec_history
        )

    def get_traceback(self) -> str:
        """
        Get the traceback information for the current exception.

        Returns:
            str: A string containing the formatted traceback.
        """
        import traceback
        return traceback.format_exc()

    def select_next_task(self, task_response: Optional[TaskResponse], outputs: Optional[List[Dict[str, Any]]]) -> Tuple[Optional[str], bool]:
        """
        Select the next task based on the task selection method or routing configuration.

        Args:
            task_response (Optional[TaskResponse]): The response from the previous task.
            outputs (Optional[List[Dict[str, Any]]]): A list of outputs from previous tasks.

        Returns:
            Tuple[Optional[str], bool]: A tuple containing:
                - The name of the next task to execute (or None if workflow is complete)
                - A boolean indicating whether this is a retry attempt

        Raises:
            ValueError: If neither task_selection_method nor tasks_end_code_routing is defined.
        """
        if self.task_selection_method:
            return self.task_selection_method(task_response, outputs)
        if not self.tasks_end_code_routing:
            raise ValueError("Either the task_selection_method or the tasks_end_code_routing needs to be defined.")
        
        if task_response is None:
            return self.get_initial_task_name()

        return self.get_next_task_from_routing(task_response)

    def get_initial_task_name(self) -> Tuple[Optional[str], bool]:
        if self.start_task:
            return self.start_task, False
        LOGGER.info("No start task defined, selecting the first task.")
        return next(iter(self.tasks.values())).task_name, False

    def get_next_task_from_routing(self, task_response: TaskResponse) -> Tuple[Optional[str], bool]:
        """
        Determine the next task based on the task routing configuration.

        Args:
            task_response (TaskResponse): The response from the previous task.

        Returns:
            Tuple[Optional[str], bool]: A tuple containing:
                - The name of the next task to execute (or None if workflow is complete)
                - A boolean indicating whether this is a retry attempt

        Raises:
            ValueError: If the task or its result code is not found in the routing configuration.
        """
        task_name = task_response.task_name
        if task_name not in self.tasks_end_code_routing:
            raise ValueError(f"Task {task_name} not found in the workflow routing.")

        result_code = task_response.result_code
        task_routing: Dict[Union[str, int], Union[Tuple[Optional[str], bool], List[Optional[Union[str, bool]]]]] = self.tasks_end_code_routing[task_name]

        next_task_info: Union[Tuple[Optional[str], bool], List[Optional[Union[str, bool]]]] = self.get_next_task_info(task_routing, result_code)
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
        
        converted_result_code = str(result_code) if isinstance(result_code, int) else int(result_code)
        if converted_result_code in task_routing:
            return task_routing[converted_result_code]
        
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
