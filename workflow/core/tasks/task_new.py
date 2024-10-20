import uuid
from enum import Enum
from typing import Dict, Any, Optional, List, Callable, Union, Tuple
from abc import ABC, abstractmethod
from pydantic import BaseModel, Field
from workflow.core.prompt import Prompt
from workflow.core.agent import AliceAgent
from workflow.core.api import APIManager, APIEngine
from workflow.core.data_structures import ApiType, FunctionParameters, ParameterDefinition, FunctionConfig, ToolFunction, References
from workflow.core.data_structures.user_interaction import UserCheckpoint, UserInteraction
from workflow.core.data_structures.task_response_new import NodeResponse, TaskResponse
from workflow.util.utils import simplify_execution_history
from workflow.util import LOGGER
from workflow.core.data_structures.base_models import TasksEndCodeRouting

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
        start_task (Optional[str]): Name of the initial subtask, if applicable.
        required_apis (Optional[List[ApiType]]): APIs required for task execution.
        task_selection_method (Optional[Callable]): Method for selecting the next task in a workflow.
        tasks_end_code_routing (Optional[Dict]): Routing logic for subtasks based on exit codes.
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
    required_apis: List[ApiType] = Field(default_factory=list, description="A list of required APIs for the task")
    task_selection_method: Optional[Callable[[TaskResponse, List[Dict[str, Any]]], Optional[str]]] = Field(default=None, description="A method to select the next task based on the current task's response. Overrides the default logic that uses task_end_code_routing.")
    node_end_code_routing: Optional[TasksEndCodeRouting] = Field(default=None, description="A dictionary of tasks/nodes -> exit codes and the task to route to given each exit code")
    max_attempts: int = Field(default=3, description="The maximum number of failed task attempts before the workflow is considered failed")
    agent: Optional[AliceAgent] = Field(default=None, description="The agent that the task is associated with, if any")
    api_engine: Optional[APIEngine] = Field(default=None, description="The API engine for the task")
    start_node: Optional[str] = Field(default=None, description="The name of the starting node")
    user_checkpoints: Dict[str, UserCheckpoint] = Field(default_factory=dict, description="Dictionary of node to user checkpoint to implement human input for this task")

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
    async def run(self, execution_history: List[NodeResponse] = None, node_name: str = None, **kwargs) -> TaskResponse:
        """
        Runs the task and returns a TaskResponse.
        This method must be implemented by subclasses to define their specific logic.
        """
        pass

    async def handle_user_checkpoints(self, execution_history: List[NodeResponse] = None, node_name: str = None) -> Optional[NodeResponse]:
        """
        Handles user checkpoints. This method can be called by subclasses before their specific logic.
        Returns a TaskResponse if a user interaction is needed, None otherwise.
        """
        execution_history = execution_history or []
        node_name = node_name or self.start_node or "default"
       
        if node_name in self.user_checkpoints:
            completed_interaction = next((
                node for node in reversed(execution_history)
                if node.node_name == node_name
                and node.references.user_interactions
                and node.references.user_interactions[-1].user_response is not None
            ), None)
           
            if not completed_interaction:
                return self.create_user_interaction(node_name, len(execution_history))
        return None

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
    
    async def a_execute(self, execution_history: List[NodeResponse] = None, **kwargs) -> TaskResponse:
        """Executes the task and returns a TaskResponse."""
        LOGGER.info(f'Executing task {self.task_name}')
        execution_history = execution_history or []

        try:
            self._validate_apis(kwargs.get("api_manager"))
        except ValueError as e:
            return self.get_failed_task_response(str(e), **kwargs)

        node_name = self._determine_next_node(execution_history)
        if node_name is None:
            return self._complete_partial_execution(execution_history, **kwargs)

        return await self.run(execution_history=execution_history, node_name=node_name, **kwargs)

    def _validate_apis(self, api_manager: Optional[APIManager]) -> None:
        """Validates that all required APIs are active and healthy."""
        if self.required_apis and not self.validate_required_apis(api_manager):
            raise ValueError("Required APIs are not active or healthy.")

    def _determine_next_node(self, execution_history: List[NodeResponse]) -> Optional[str]:
        """Determines the next node to execute based on execution history."""
        if not execution_history or not any(node.parent_task_id == self.id for node in execution_history):
            return self.start_node or "default"

        if self._is_task_completed(execution_history):
            return self._handle_completed_task(execution_history)

        return self._handle_partial_execution(execution_history)

    def _is_task_completed(self, execution_history: List[NodeResponse]) -> bool:
        """Checks if the task has been completed before."""
        return any(node.node_name == self.task_name for node in execution_history)

    def _handle_completed_task(self, execution_history: List[NodeResponse]) -> Optional[str]:
        """Handles the case when the task has been completed before."""
        if not self.recursive:
            LOGGER.error(f'Error: Task {self.task_name} is already in the execution history. Execution history: {execution_history}')
            return None
        LOGGER.info(f'Task {self.task_name} is recursive and will be executed again')
        return self.start_node or "default"

    def _handle_partial_execution(self, execution_history: List[NodeResponse]) -> Optional[str]:
        """Handles the case when the task has been partially executed before."""
        LOGGER.info(f'Task {self.task_name} has been partially executed before. Execution history: {execution_history}')
        last_node = self.get_last_node_of_same_id(execution_history) or {}
        next_node = self.node_end_code_routing.get(last_node.node_name, {}).get(last_node.exit_code, (None, False))
        return next_node[0]

    def _complete_partial_execution(self, execution_history: List[NodeResponse], **kwargs) -> TaskResponse:
        """Completes a partially executed task."""
        content = self.get_content_string_from_node_responses(execution_history, self.node_end_code_routing)
        return self.get_task_response(content, 0, "Task completed successfully", "complete", **kwargs)

    async def a_execute_from_task_response(self, task_response: TaskResponse, **kwargs) -> TaskResponse:
        """
        Executes the task from a TaskResponse object, continuing from the last node in task response
        """
        execution_history = task_response.inner_execution_history()
        return await self.a_execute(execution_history=execution_history, **kwargs)
    
    def get_last_node_of_same_id(self, execution_history: List[NodeResponse]) -> Optional[NodeResponse]:
        """
        Returns the node with the highest execution_order value in the execution history with the same parent_task_id as the task id.
        """
        return max([node for node in execution_history if node.parent_task_id == self.id], key=lambda x: x.execution_order, default=None)
    
    def get_content_string_from_node_responses(self, node_responses: List[NodeResponse], node_end_code_routing: Optional[TasksEndCodeRouting] = None) -> str:
        """
        Returns a string representation of the content of the node responses, IN ORDER by execution order, with little added text
        """

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
        return self.get_task_response("", 1, diagnostics, "failed", **kwargs)
    
    def get_task_response(self, task_outputs: str, result_code: int, diagnostics: str = None, status: str = "complete", node_references: Optional[List[NodeResponse]]=[], **kwargs) -> TaskResponse:
        """
        Returns a task response with the given outputs, result code, and diagnostics.
        """
        exec_history = kwargs.pop("execution_history", None)
        if exec_history and isinstance(exec_history, list):
            exec_history = simplify_execution_history(exec_history)
        exec_history = kwargs.pop("execution_history", None)
        kwargs.pop("api_manager", None)
        return TaskResponse(
            task_id = self.id if self.id else '',
            task_name=self.task_name,
            task_description=self.task_description,
            status=status,
            result_code=result_code,
            task_outputs=task_outputs,
            task_inputs=kwargs,
            result_diagnostic=diagnostics,
            node_references=node_references,
            execution_history=exec_history
        )
    
    def create_user_interaction(self, node_name: str, execution_order: int) -> NodeResponse:
        """
        Creates a UserInteraction for the specified node and returns it wrapped in a NodeResponse.

        Args:
            node_name (str): The name of the node for which to create the user interaction.
            execution_order (int): The execution order for this node in the task's sequence.

        Returns:
            NodeResponse: A NodeResponse object containing the UserInteraction.

        Raises:
            ValueError: If no UserCheckpoint is defined for the specified node.
        """
        if node_name not in self.user_checkpoints:
            raise ValueError(f"No UserCheckpoint defined for node '{node_name}'")

        checkpoint = self.user_checkpoints[node_name]
        user_interaction = UserInteraction(
            user_checkpoint_id=checkpoint.id,
            task_response_id=self.id
        )

        return NodeResponse(
            parent_task_id=self.id,
            node_name=node_name,
            execution_order=execution_order,
            references=References(user_interactions=[user_interaction])
        )
    
    def get_self_nodes_from_execution_history(self, execution_history: List[NodeResponse]) -> List[NodeResponse]:
        """
        Retrieves messages from the execution history that belong to this task and match the node names
        defined in the node_end_code_routing.

        Args:
            execution_history (List[NodeResponse]): The full execution history.

        Returns:
            List[NodeResponse]: Filtered list of NodeResponses that belong to this task and match the defined nodes.
        """
        valid_node_names = set(self.node_end_code_routing.keys())
        filtered_history = []

        for node in execution_history:
            if node.parent_task_id == self.id and node.node_name in valid_node_names:
                filtered_history.append(node)

        # Sort the filtered history by execution order
        filtered_history.sort(key=lambda x: x.execution_order)

        return filtered_history