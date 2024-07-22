from typing import Dict, Any, Optional, List, Callable, Union, Tuple
from pydantic import Field
from workflow_logic.core.communication import TaskResponse
from workflow_logic.core.tasks.task import AliceTask
from workflow_logic.core.communication import WorkflowOutput

class Workflow(AliceTask):
    """
    A Workflow is a sequence of tasks that are executed in a defined order.
    Inherits from Task, so it can be used as a part of another workflow.
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

    async def run(self, step_through: bool = False, **kwargs) -> TaskResponse:
        task_inputs = kwargs.copy()
        tasks_performed, status, diagnostic = await self.execute_workflow(step_through, **kwargs)
        return self.create_workflow_response(tasks_performed, status, diagnostic, task_inputs, **kwargs)

    async def execute_workflow(self, step_through: bool, **kwargs) -> Tuple[List[TaskResponse], str, str]:
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

                if step_through:
                    input("Press Enter to continue to the next step...")

            return tasks_performed, "complete", "Workflow completed successfully"

        except Exception as e:
            return tasks_performed, "failed", f"Error: {str(e)}\nTraceback: {self.get_traceback()}"

    def get_initial_task(self) -> Optional[str]:
        return self.start_task if self.start_task else self.select_next_task(None, None)[0]

    async def execute_task(self, task_name: str, **kwargs) -> TaskResponse:
        current_task = self.find_task_by_name(task_name)
        if not current_task:
            raise ValueError(f"Task {task_name} not found in the workflow.")
        return await current_task.a_execute(**kwargs)

    def update_kwargs(self, kwargs: Dict[str, Any], task_name: str, task_result: TaskResponse) -> Dict[str, Any]:
        kwargs[f'outputs_{task_name}'] = str(task_result.task_outputs) if task_result.task_outputs else None
        return kwargs

    def get_next_task(self, task_result: TaskResponse, tasks_performed: List[TaskResponse]) -> Tuple[Optional[str], bool]:
        next_task_info = self.select_next_task(task_result, tasks_performed)
        return next_task_info

    def create_workflow_response(self, tasks_performed: List[TaskResponse], status: str, diagnostic: str, task_inputs: Dict[str, Any], **kwargs) -> TaskResponse:
        return TaskResponse(
            task_id=self.id if self.id else '',
            task_name=self.task_name,
            task_description=self.task_description,
            status=status,
            result_code=1 if status == "failed" else 0,
            task_outputs=str(WorkflowOutput(content=tasks_performed)),
            task_content=WorkflowOutput(content=tasks_performed),
            task_inputs=task_inputs,
            result_diagnostic=diagnostic,
            execution_history=kwargs.get("execution_history", [])
        )

    def get_traceback(self) -> str:
        import traceback
        return traceback.format_exc()

    def select_next_task(self, task_response: Optional[TaskResponse], outputs: Optional[List[Dict[str, Any]]]) -> Tuple[Optional[str], bool]:
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
        print("No start task defined, selecting the first task.")
        return next(iter(self.tasks.values())).task_name, False

    def get_next_task_from_routing(self, task_response: TaskResponse) -> Tuple[Optional[str], bool]:
        task_name = task_response.task_name
        if task_name not in self.tasks_end_code_routing:
            raise ValueError(f"Task {task_name} not found in the workflow routing.")

        result_code = task_response.result_code
        task_routing: Dict[Union[str, int], Union[Tuple[Optional[str], bool], List[Optional[Union[str, bool]]]]] = self.tasks_end_code_routing[task_name]

        next_task_info: Union[Tuple[Optional[str], bool], List[Optional[Union[str, bool]]]] = self.get_next_task_info(task_routing, result_code)
        return self.parse_next_task_info(next_task_info)

    def get_next_task_info(self, task_routing: Dict[Union[str, int], Union[Tuple[Optional[str], bool], List[Optional[Union[str, bool]]]]], result_code: Union[str, int]) -> Union[Tuple[Optional[str], bool], List[Optional[Union[str, bool]]]]:
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
        if isinstance(next_task_info, tuple):
            next_task, try_bool = next_task_info
        else:
            next_task, try_bool = next_task_info[0], next_task_info[1] if len(next_task_info) > 1 else False

        self.validate_next_task(next_task)
        return next_task, try_bool

    def validate_next_task(self, next_task: Optional[str]):
        if next_task and self.find_task_by_name(next_task) is None:
            raise ValueError(f"Selected task {next_task} not found in the workflow.")
