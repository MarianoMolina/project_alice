import uuid
from typing import Dict, Any, Optional, List, Callable, Union
from abc import ABC, abstractmethod
from pydantic import BaseModel, Field
from workflow_logic.util.task_utils import FunctionParameters, TaskResponse, ParameterDefinition
from workflow_logic.core.prompt import Prompt

prompt_function_parameters = FunctionParameters(
    type="object",
    properties={
        "prompt": ParameterDefinition(
            type="string",
            description="The input prompt for the task",
            default=None
        )},
    required=["prompt"]
)

class AliceTask(BaseModel, ABC):
    """
    An abstract Task class. A task is an atomic unit of work that can be executed in a workflow.
    Has to implement the run method which takes an input dict and returns a TaskResponse.
    Can optionally include the input variables that the task expects and additional info relevant for use.
    """
    task_name: str = Field(..., description="The name of the task")
    task_description: str = Field(..., description="A clear, concise statement of what the task entails")
    input_variables: FunctionParameters = Field(prompt_function_parameters, description="The input variables for the task. Default is a string prompt.")
    exit_codes: Dict[int, str] = Field(default={0: "Success", 1: "Failed"}, description="A dictionary of exit codes for the task, consistent with the TaskResponse structure", example={0: "Success", 1: "Failed"})
    recursive: bool = Field(True, description="Whether the task can be executed recursively")
    templates: Dict[str, str] = Field(default={}, description="A dictionary of templates for the task")
    tasks: Dict[str, "AliceTask"] = Field(default={}, description="A dictionary of tasks for the task")
    valid_languages: List[str] = Field([], description="A list of valid languages for the task")
    timeout: Optional[int] = Field(None, description="The timeout for the task in seconds")
    prompts_to_add: Optional[Dict[str, Prompt]] = Field(None, description="A dictionary of prompts to add to the task")
    exit_code_response_map: Optional[Dict[int, int]] = Field(None, description="A dictionary mapping exit codes to responses")
    start_task: Optional[str] = Field(None, description="The name of the starting task")
    task_selection_method: Optional[Callable[[TaskResponse, List[Dict[str, Any]]], Optional[str]]] = Field(None, description="A method to select the next task based on the current task's response")
    tasks_end_code_routing: Optional[Dict[str, Dict[int, tuple[Union[str, None], bool]]]] = Field(None, description="A dictionary of tasks -> exit codes and the task to route to given each exit code and a bool to determine if the outcome represents an extra 'try' at the task")
    max_attempts: int = Field(3, description="The maximum number of failed task attempts before the workflow is considered failed. Default is 3.")
    recursive: bool = Field(False, description="Whether the workflow can be executed recursively. By default, tasks are recursive but workflows are not, unless one is expected to be used within another workflow")

    @abstractmethod
    def run(self, **kwargs) -> TaskResponse:
        """Runs the task and returns a TaskResponse."""
        pass

    def execute(self, **kwargs) -> TaskResponse:
        # Generate a new task ID for this execution
        task_id = str(uuid.uuid4())
        
        # Retrieve or initialize execution history
        execution_history: List[Dict] = kwargs.pop("execution_history", [])
        
        # Check for recursion
        if not self.recursive:
            if any(task["task_name"] == self.task_name for task in execution_history):
                raise RecursionError(f"Task {self.task_name} is already in the execution history, preventing recursion.")
        
        # Add current task to execution history
        execution_history.append({
            "task_name": self.task_name,
            "task_id": task_id,
            "task_description": self.task_description
        })
        
        # Run the task
        response = self.run(execution_history=execution_history, **kwargs)
        
        # Return the response
        return response

    def get_function(self, execution_history: Optional[List]=[]) -> Dict[str, Any]:
        """
        Returns a dictionary representing the function typedict and the function callable.
        """
        def function_callable(**kwargs) -> TaskResponse:
            return self.execute(execution_history = execution_history, **kwargs)
        
        function_dict = {
            "name": self.task_name,
            "description": self.task_description,
            "parameters": self.input_variables.model_dump()
        }

        tool_dict = {
            "type": "function",
            "function": function_dict
        }
        
        return {
            "tool_dict": tool_dict,
            "function_map": {self.task_name: function_callable}
        }
    
    # def update_input(self, **kwargs) -> list[Any]:
    #     """Executes the task and returns a TaskResponse."""
    #     ...

    # @abstractmethod
    # def stream(self, **kwargs) -> TaskResponse:
    #     """Streams the task process and returns a TaskResponse."""
    #     ...

