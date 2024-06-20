import uuid
from typing import Dict, Any, Optional, List
from abc import ABC, abstractmethod
from pydantic import BaseModel, Field
from workflow_logic.util.task_utils import FunctionParameters, TaskResponse, ParameterDefinition

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

    @abstractmethod
    def run(self, **kwargs) -> TaskResponse:
        """Runs the task and returns a TaskResponse."""
        pass

    def execute(self, **kwargs) -> TaskResponse:
        # Generate a new task ID for this execution
        task_id = str(uuid.uuid4())
        
        # Retrieve or initialize execution history
        execution_history = kwargs.pop("execution_history", [])
        
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

