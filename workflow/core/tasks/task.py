import uuid
from enum import Enum
from typing import Dict, Any, Optional, List, Callable, Union, Tuple
from abc import ABC, abstractmethod
from pydantic import BaseModel, Field
from workflow.core.prompt import Prompt
from workflow.core.agent import AliceAgent
from workflow.core.api import APIManager, APIEngine
from workflow.core.data_structures import TaskResponse, ApiType, FunctionParameters, ParameterDefinition, FunctionConfig, ToolFunction
from workflow.util import LOGGER

class AliceTask(BaseModel, ABC):
    """
    An abstract base class representing a task in the Alice workflow system.

    AliceTask serves as the foundation for all task types in the system. It defines
    the basic structure and interface that all tasks must implement, including
    execution, API validation, and function representation for use in workflows.

    Attributes:
        id (Optional[str]): Unique identifier for the task.
        task_name (str): Name of the task.
        task_description (str): Detailed description of what the task does.
        input_variables (FunctionParameters): Expected input structure for the task.
        exit_codes (Dict[int, str]): Mapping of exit codes to their meanings.
        recursive (bool): Whether the task can be called recursively.
        templates (Optional[Dict[str, Prompt]]): Prompts used by the task.
        tasks (Optional[Dict[str, "AliceTask"]]): Subtasks that this task may use.
        valid_languages (List[str]): Programming languages the task can work with.
        timeout (Optional[int]): Maximum execution time for the task.
        prompts_to_add (Optional[Dict[str, Prompt]]): Additional prompts for the task.
        exit_code_response_map (Optional[Dict[str, int]]): Mapping of responses to exit codes.
        start_node (Optional[str]): Name of the initial subtask, if applicable.
        required_apis (Optional[List[ApiType]]): APIs required for task execution.
        task_selection_method (Optional[Callable]): Method for selecting the next task in a workflow.
        node_end_code_routing (Optional[Dict]): Routing logic for subtasks based on exit codes.
        max_attempts (int): Maximum number of execution attempts before failure.
        agent (Optional[AliceAgent]): The agent associated with this task.
        human_input (Optional[bool]): Whether the task requires human interaction.

    Methods:
        task_type: Returns the class name of the task.
        run: Abstract method to be implemented by subclasses for task execution.
        validate_required_apis: Ensures all required APIs are available and healthy.
        deep_validate_required_apis: Recursively validates APIs for this task and its subtasks.
        a_execute: Asynchronously executes the task, handling recursion and history.
        get_function: Returns a dictionary representing the task as a function for workflow use.
        get_failed_task_response: Generates a TaskResponse object for a failed task execution.

    The AliceTask class provides a robust framework for defining complex, multi-step
    tasks that can be composed into workflows, with built-in support for API dependencies,
    recursion control, and detailed execution tracking.
    """
    id: Optional[str] = Field(default=None, description="The task ID", alias="_id")
    task_name: str = Field(..., description="The name of the task")
    task_description: str = Field(..., description="A clear, concise statement of what the task entails")
    input_variables: FunctionParameters = Field(
        default_factory=lambda: FunctionParameters(
            type="object",
            properties={
                "prompt": ParameterDefinition(
                    type="string",
                    description="The input prompt for the task",
                    default=None
                )
            },
            required=["prompt"]
        ),
        description="The input variables for the task. Default is a string prompt."
    )
    exit_codes: Dict[int, str] = Field(default_factory=lambda: {0: "Success", 1: "Failed"}, description="A dictionary of exit codes for the task")
    recursive: bool = Field(True, description="Whether the task can be executed recursively")
    templates: Dict[str, Prompt] = Field(default_factory=dict, description="A dictionary of templates for the task")
    tasks: Dict[str, "AliceTask"] = Field(default_factory=dict, description="A dictionary of task_id: task")
    valid_languages: List[str] = Field(default_factory=list, description="A list of valid languages for the task")
    timeout: Optional[int] = Field(default=None, description="The timeout for the task in seconds")
    prompts_to_add: Optional[Dict[str, Prompt]] = Field(default_factory=dict, description="A dictionary of prompts to add to the task")
    exit_code_response_map: Optional[Dict[str, int]] = Field(default=None, description="A dictionary mapping exit codes to responses")
    start_node: Optional[str] = Field(default=None, description="The name of the starting task")
    required_apis: List[ApiType] = Field(default_factory=list, description="A list of required APIs for the task")
    task_selection_method: Optional[Callable[[TaskResponse, List[Dict[str, Any]]], Optional[str]]] = Field(default=None, description="A method to select the next task based on the current task's response")
    node_end_code_routing: Optional[Dict[str, Dict[Union[str, int], Tuple[Optional[str], bool]]]] = Field(default=None, description="A dictionary of tasks -> exit codes and the task to route to given each exit code")
    max_attempts: int = Field(default=3, description="The maximum number of failed task attempts before the workflow is considered failed")
    agent: Optional[AliceAgent] = Field(default=None, description="The agent that the task is associated with")
    human_input: bool = Field(default=False, description="Whether the task requires human input")
    api_engine: Optional[APIEngine] = Field(default=None, description="The API engine for the task")
    
    @property
    def task_type(self) -> str:
        return self.__class__.__name__
    
    def model_dump(self, *args, **kwargs):
        # Create a copy of the current instance's dict
        data = dict(self.__dict__)
        
        # Handle nested tasks before calling super().model_dump()
        if 'tasks' in data and isinstance(data['tasks'], dict):
            data['tasks'] = {
                task_id: task.model_dump(*args, **kwargs) if isinstance(task, AliceTask) else task
                for task_id, task in data['tasks'].items()
            }

        # Call super().model_dump() with the updated data
        dumped_data = super().model_dump(*args, **kwargs, exclude={'tasks'})
        
        # Add the task_type
        dumped_data['task_type'] = self.task_type

        # Add the processed tasks back to the dumped data
        if 'tasks' in data:
            dumped_data['tasks'] = data['tasks']

        # Handle ApiType enums or strings in required_apis
        if 'required_apis' in dumped_data and dumped_data['required_apis']:
            LOGGER.debug(f'Original required_apis: {dumped_data["required_apis"]}')
            dumped_data['required_apis'] = [
                api.value if isinstance(api, Enum) else api
                for api in dumped_data['required_apis']
            ]
            LOGGER.debug(f'Updated required_apis: {dumped_data["required_apis"]}')

        # Handle other potential nested AliceTask objects and enums
        for key, value in dumped_data.items():
            if isinstance(value, AliceTask):
                dumped_data[key] = value.model_dump(*args, **kwargs)
            elif isinstance(value, list):
                dumped_data[key] = [
                    item.value if isinstance(item, Enum) else
                    item.model_dump(*args, **kwargs) if isinstance(item, AliceTask) else item
                    for item in value
                ]
            elif isinstance(value, dict):
                dumped_data[key] = {
                    k: (v.value if isinstance(v, Enum) else
                        v.model_dump(*args, **kwargs) if isinstance(v, AliceTask) else v)
                    for k, v in value.items()
                }
            elif isinstance(value, Enum):
                dumped_data[key] = value.value
        if 'api_engine' in dumped_data and dumped_data['api_engine']:
            dumped_data.pop('api_engine')
            
        return dumped_data
    
    @abstractmethod
    async def run(self, **kwargs) -> TaskResponse:
        """Runs the task and returns a TaskResponse."""
        ...

    def validate_required_apis(self, api_manager: APIManager) -> bool:
        if not self.required_apis:
            LOGGER.debug(f"No required APIs for task {self.task_name}")
            return True
        for api_type in self.required_apis:
            api = api_manager.get_api_by_type(api_type)
            if not api or not api.is_active:
                raise ValueError(f"Required API {api_type} is not active or not found.")
            if api.health_status != "healthy":
                raise ValueError(f"Required API {api_type} is not healthy.")
        return True
    
    def deep_validate_required_apis(self, api_manager: APIManager) -> Dict[str, Any]:
        result = {
            "task_name": self.task_name,
            "status": "valid",
            "warnings": [],
            "child_tasks": []
        }

        try:
            self.validate_required_apis(api_manager)
        except ValueError as e:
            result["status"] = "warning"
            result["warnings"].append(str(e))

        for child_task_name, child_task in self.tasks.items():
            child_result = child_task.deep_validate_required_apis(api_manager)
            result["child_tasks"].append(child_result)
            if child_result["status"] == "warning":
                result["status"] = "warning"
                result["warnings"].append(f"Warning in child task '{child_task_name}': {', '.join(child_result['warnings'])}")

        return result
    
    async def a_execute(self, **kwargs) -> TaskResponse:
        """Executes the task and returns a TaskResponse."""
        LOGGER.info(f'Executing task {self.task_name}')
        
        # Retrieve or initialize execution history
        execution_history: List[Dict] = kwargs.pop("execution_history", [])
        if self.required_apis and not self.validate_required_apis(kwargs.get("api_manager")):
            raise ValueError("Required APIs are not active or healthy.")
        
        # Check for recursion
        if not self.recursive:
            if any(task["task_name"] == self.task_name for task in execution_history):
                LOGGER.error(f'Error: Task {self.task_name} is already in the execution history. Execution history: {execution_history}')
                raise RecursionError(f"Task {self.task_name} is already in the execution history, preventing recursion.")
        
        # Add current task to execution history
        execution_history.append({
            "task_name": self.task_name,
            "task_id": self.id,
            "task_description": self.task_description
        })
        # Return the the task response
        return await self.run(execution_history=execution_history, **kwargs)        
    
    def get_function(self, execution_history: Optional[List]=[], api_manager: Optional[APIManager] = None) -> Dict[str, Any]:
        """
        Returns a dictionary representing the function typedict and the function callable.
        """
        async def function_callable(**kwargs) -> TaskResponse:
            params = {"api_manager": api_manager} if api_manager else {}
            final_params = {"execution_history": execution_history, **params, **kwargs}
            return await self.a_execute(**final_params)
        
        function_dict = FunctionConfig(
            name=self.task_name, 
            description=self.task_description, 
            parameters=self.input_variables.model_dump()
        )
        tool_function = ToolFunction(
            type="function",
            function=function_dict
        )
        
        return {
            "tool_function": tool_function,
            "function_map": {self.task_name: function_callable}
        }
    
    def get_failed_task_response(self, diagnostics: str = None, **kwargs) -> TaskResponse:
        """
        Returns a failed task response with the given diagnostics.
        """
        exec_history = kwargs.pop("execution_history", None)
        kwargs.pop("api_manager", None)
        return TaskResponse(
            task_id = self.id if self.id else '',
            task_name=self.task_name,
            task_description=self.task_description,
            status="failed",
            result_code=1,
            task_outputs=None,
            task_inputs=kwargs,
            result_diagnostic=diagnostics,
            execution_history=exec_history
        )
    
    # async def a_run(self, **kwargs) -> TaskResponse:
    #     """
    #     Asynchronous version of the run method.
    #     This method should be implemented by subclasses.
    #     """
    #     return self.run(**kwargs)

    # def execute(self, **kwargs) -> TaskResponse:
    #     """Synchronous wrapper for a_execute"""
    #     return asyncio.run(self.a_execute(**kwargs))

    # async def a_execute(self, **kwargs) -> TaskResponse:
    #     """Executes the task and returns a TaskResponse."""
    #     return await self.execute(**kwargs)

    # def execute(self, **kwargs) -> TaskResponse:
    #     # Generate a new task ID for this execution
    #     print(f'Executing task {self.task_name}')
    #     task_id = self.id if self.id else str(uuid.uuid4())
        
    #     # Retrieve or initialize execution history
    #     execution_history: List[Dict] = kwargs.pop("execution_history", [])
    #     if self.required_apis and not self.validate_required_apis(kwargs.get("api_manager")):
    #         raise ValueError("Required APIs are not active or healthy.")
    #     # Check for recursion
    #     if not self.recursive:
    #         if any(task["task_name"] == self.task_name for task in execution_history):
    #             # raise RecursionError(f"Task {self.task_name} is already in the execution history, preventing recursion.")
    #             print(f'Error: Task {self.task_name} is already in the execution history. Execution history: {execution_history}')
        
    #     # Add current task to execution history
    #     execution_history.append({
    #         "task_name": self.task_name,
    #         "task_id": task_id,
    #         "task_description": self.task_description
    #     })
        
    #     # Run the task
    #     response = self.run(execution_history=execution_history, **kwargs)
    #     return TaskResponse.model_validate(response)
    
    # def update_input(self, **kwargs) -> list[Any]:
    #     """Executes the task and returns a TaskResponse."""
    #     ...

    # @abstractmethod
    # def stream(self, **kwargs) -> TaskResponse:
    #     """Streams the task process and returns a TaskResponse."""
    #     ...

